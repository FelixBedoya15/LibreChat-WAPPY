import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import axios from 'axios';
import './marketing.css';

interface AmbassadorProfile {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  phoneClean?: string;
  type?: string;
  typeLabel?: string;
  avatar?: string | null;
  profession?: string;
  yearsExperience?: string;
  specialties?: string[];
  quote?: string;
  storyParagraph1?: string;
  storyParagraph2?: string;
}

// Helper para extraer el ID de cualquier link de YouTube (watch, youtu.be, shorts, embed)
function getYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export default function BateriaPsicosocialPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  const funnelKey = 'psicosocial';

  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ambassador / Referral state
  const [activeRef, setActiveRef] = useState<string>('');
  const [ambassador, setAmbassador] = useState<AmbassadorProfile | null>(null);

  // YouTube Video & Admin Configuration States
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>(
    'Batería de Riesgo Psicosocial en Colombia (Res. 2764 de 2022) e Intervención Viva con IA'
  );
  const [whatsappUrl, setWhatsappUrl] = useState<string>(
    'https://wa.me/573009120624?text=Hola%20WAPPY%2C%20deseo%20informaci%C3%B3n%20sobre%20la%20gesti%C3%B3n%20del%20Riesgo%20Psicosocial%20y%20SG-SST%20con%20IA.'
  );

  // Admin Edit Modal States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [tempVideoUrl, setTempVideoUrl] = useState<string>('');
  const [tempVideoTitle, setTempVideoTitle] = useState<string>('');
  const [tempWhatsappUrl, setTempWhatsappUrl] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Form states for Demo Modal
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoArl, setDemoArl] = useState('');
  const [demoArlCustom, setDemoArlCustom] = useState('');
  const [demoTeamSize, setDemoTeamSize] = useState('1–10 trabajadores');
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  const youtubeId = getYouTubeId(videoUrl);
  const tempYoutubeId = getYouTubeId(tempVideoUrl);
  const isVerticalShort = videoUrl.includes('/shorts/');

  // Fetch Video Configuration from Backend
  const fetchPageConfig = async () => {
    try {
      const response = await axios.get('/api/comunidad/config', { params: { funnelKey } });
      if (response.data) {
        const data = response.data;
        const savedVideo = data.videoUrl && !data.videoUrl.includes('w3schools.com') ? data.videoUrl : '';
        setVideoUrl(savedVideo);
        setTempVideoUrl(savedVideo);
        if (savedVideo) {
          setShowVideo(true);
        }

        if (data.extraVideoTitle1 && data.extraVideoTitle1 !== 'Clase Extra 1') {
          setVideoTitle(data.extraVideoTitle1);
          setTempVideoTitle(data.extraVideoTitle1);
        } else {
          setTempVideoTitle(videoTitle);
        }

        if (data.whatsappUrl) {
          setWhatsappUrl(data.whatsappUrl);
          setTempWhatsappUrl(data.whatsappUrl);
        } else {
          setTempWhatsappUrl(whatsappUrl);
        }
      }
    } catch (err) {
      console.warn('[BateriaPsicosocialPage] Error loading config:', err);
    }
  };

  useEffect(() => {
    fetchPageConfig();
  }, []);

  const handleSaveAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingConfig(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const cleanUrl = tempVideoUrl.trim();
      const cleanTitle =
        tempVideoTitle.trim() ||
        'Batería de Riesgo Psicosocial en Colombia (Res. 2764 de 2022) e Intervención Viva con IA';

      await axios.post(
        '/api/comunidad/config',
        {
          funnelKey,
          videoUrl: cleanUrl,
          extraVideoTitle1: cleanTitle,
          whatsappUrl: tempWhatsappUrl.trim(),
        },
        { headers }
      );
      setVideoUrl(cleanUrl);
      setVideoTitle(cleanTitle);
      setWhatsappUrl(tempWhatsappUrl.trim());
      if (cleanUrl) {
        setShowVideo(true);
      }
      setIsAdminModalOpen(false);
      showToast('✅ Video de YouTube guardado y publicado en vivo para todos los usuarios.');
    } catch (err) {
      console.error('[BateriaPsicosocialPage] Error saving admin config:', err);
      showToast('⚠️ Error al guardar la configuración. Verifica tu sesión de administrador.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Detect referral / ambassador slug from URL or localStorage
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search || window.location.search);
      const urlRef = (
        searchParams.get('ref') ||
        searchParams.get('referral') ||
        searchParams.get('r') ||
        ''
      ).trim();

      let storedRef = '';
      try {
        storedRef = (localStorage.getItem('wappy_ref') || sessionStorage.getItem('wappy_ref') || '').trim();
      } catch (e) {}

      const resolvedRef = urlRef || storedRef;

      if (urlRef) {
        try {
          localStorage.setItem('wappy_ref', urlRef);
          sessionStorage.setItem('wappy_ref', urlRef);
        } catch (e) {}
      }

      if (!resolvedRef) {
        setActiveRef('');
        setAmbassador(null);
        return;
      }

      setActiveRef(resolvedRef);

      const formatSlugName = (slugStr: string) =>
        slugStr
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

      fetch(`/api/referrals/public/ambassador-info/${encodeURIComponent(resolvedRef)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.name) {
            const canonicalSlug = data.slug || resolvedRef;
            setActiveRef(canonicalSlug);
            setAmbassador(data);
          } else {
            setAmbassador({
              name: formatSlugName(resolvedRef),
              slug: resolvedRef,
              typeLabel: 'Embajador Oficial WAPPY',
              profession: 'Especialista en Seguridad y Salud en el Trabajo',
            });
          }
        })
        .catch(() => {});
    } catch (err) {
      console.warn('Error loading ambassador profile:', err);
    }
  }, [location.search, location.pathname]);

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

  useEffect(() => {
    if (isMobileMenuOpen || isDemoModalOpen || isCompareModalOpen || isPwaModalOpen || isAdminModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isDemoModalOpen, isCompareModalOpen, isPwaModalOpen, isAdminModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getRefQuery = () => {
    const refToUse = activeRef || ambassador?.slug || '';
    if (refToUse) {
      return `?ref=${encodeURIComponent(refToUse)}`;
    }
    return '';
  };

  const handleStartTrial = () => {
    const refQuery = getRefQuery();
    if (isAuthenticated && !refQuery) {
      navigate('/c/new');
    } else {
      navigate(`/register${refQuery}`);
    }
  };

  const handleLogin = () => {
    const refQuery = getRefQuery();
    if (isAuthenticated && !refQuery) {
      navigate('/c/new');
    } else {
      navigate(`/login${refQuery}`);
    }
  };

  const handleGoToPlanes = () => {
    const refQuery = getRefQuery();
    navigate(`/planes${refQuery}`);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigateToSection = (targetId: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDemo(true);
    try {
      const selectedArl =
        demoArl === 'Otra' && demoArlCustom.trim()
          ? `Otra (${demoArlCustom.trim()})`
          : demoArl || 'No especificada';

      const ambassadorNote = ambassador
        ? `\nEmbajador / Asesor Referente: ${ambassador.name} (${ambassador.slug})`
        : '';

      await fetch('/api/contact/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoName,
          email: demoEmail,
          phone: demoPhone,
          company: demoCompany || 'No especificada',
          arl: selectedArl,
          plan: 'Asesoría Batería Riesgo Psicosocial & WAPPY IA',
          message: `Solicitud de Demostración desde la Landing Page de Batería de Riesgo Psicosocial.${ambassadorNote}\nEmpresa: ${demoCompany || 'No especificada'}\nARL: ${selectedArl}\nTeléfono/WhatsApp: ${demoPhone || 'No proporcionado'}\nTamaño de la empresa: ${demoTeamSize}\nFecha: ${new Date().toLocaleString('es-CO')}`,
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

      {/* Floating Admin Bar / Button (Visible ONLY to WAPPY Admins) */}
      {isAdmin && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(199, 243, 3, 0.5)',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#C7F303',
                boxShadow: '0 0 10px #C7F303',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              Admin WAPPY
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTempVideoUrl(videoUrl);
              setTempVideoTitle(videoTitle);
              setTempWhatsappUrl(whatsappUrl);
              setIsAdminModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
            }}
          >
            <span>🎬</span> {youtubeId ? 'Cambiar Video YouTube' : 'Agregar Video YouTube'}
          </button>
        </div>
      )}

      {/* Floating Capsule Navbar (Identical to WAPPY Home) */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="WAPPY IA - Ecosistema SG-SST Inteligente"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              navigate('/');
            }}
          >
            <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" className="mkt-logo-icon" />
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">
                WAPPY<span>IA</span>
              </span>
              <span className="mkt-logo-sub">SOMOS SST</span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#vision" onClick={(e) => scrollToSection(e, 'vision')} title="Video Magistral sobre Batería de Riesgo Psicosocial">
              {lang === 'es' ? 'Video Psicosocial' : 'Video Masterclass'}
            </a>
            <a href="#metodologia" onClick={(e) => scrollToSection(e, 'metodologia')} title="Estructura de la Batería: Intralaboral Forma A/B, Extralaboral y Estrés">
              {lang === 'es' ? 'Batería (Forma A/B)' : 'Battery (Form A/B)'}
            </a>
            <a href="#comites" onClick={(e) => scrollToSection(e, 'comites')} title="Los 4 Dominios Intralaborales y Comité de Convivencia">
              {lang === 'es' ? '4 Dominios & COCOLAB' : '4 Domains & Committee'}
            </a>
            <a href="#tenshi" onClick={(e) => scrollToSection(e, 'tenshi')} title="Agentes IA: Especialista en Salud Mental y Tenshi">
              {lang === 'es' ? 'Agentes IA' : 'AI Agents'}
            </a>
            <a href="#movil" onClick={(e) => scrollToSection(e, 'movil')} title="Termómetro Emocional y Portales QR">
              {lang === 'es' ? 'Visión & PWA' : 'Vision & PWA'}
            </a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} title="Planes Comerciales y Tarifas WAPPY Pro">
              {lang === 'es' ? 'Planes' : 'Plans'}
            </a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} title="Preguntas Frecuentes sobre la Batería Psicosocial">
              FAQ
            </a>
          </div>

          <div className="mkt-nav-cta">
            <button type="button" className="btn btn-ghost mkt-nav-signin" onClick={() => setIsDemoModalOpen(true)}>
              {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
            </button>

            <button type="button" className="btn btn-lime btn-sm" onClick={handleLogin}>
              {lang === 'es' ? 'Ir a WAPPY' : 'Go to WAPPY'}
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
              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('vision')}>
                <span className="mkt-mobile-link-icon">🎬</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Video Explicativo</span>
                  <span className="mkt-mobile-link-desc">Cápsula sobre Batería de Riesgo Psicosocial</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('metodologia')}>
                <span className="mkt-mobile-link-icon">📋</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Batería (Forma A y B)</span>
                  <span className="mkt-mobile-link-desc">Resolución 2764 de 2022 y Resolución 2646 de 2008</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('comites')}>
                <span className="mkt-mobile-link-icon">🧠</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">4 Dominios & COCOLAB</span>
                  <span className="mkt-mobile-link-desc">Liderazgo, Control, Demandas, Recompensas y Convivencia</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('tenshi')}>
                <span className="mkt-mobile-link-icon">🤖</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Agentes IA en Salud Mental</span>
                  <span className="mkt-mobile-link-desc">Tenshi y +20 especialistas autónomos en SST</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('movil')}>
                <span className="mkt-mobile-link-icon">📱</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Visión & PWA</span>
                  <span className="mkt-mobile-link-desc">Termómetro emocional QR, comités y perfil sociodemográfico</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('pricing')}>
                <span className="mkt-mobile-link-icon">💳</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Planes</span>
                  <span className="mkt-mobile-link-desc">Tarifas transparentes y prueba gratis de 7 días</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('faq')}>
                <span className="mkt-mobile-link-icon">❓</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">FAQ</span>
                  <span className="mkt-mobile-link-desc">SIRPSI, Psicólogo Especialista, periodicidad y reserva</span>
                </div>
              </button>
            </div>

            <div className="mkt-mobile-menu-divider"></div>

            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-outline-dark mkt-btn-agendar-demo"
                style={{ width: '100%', justifyContent: 'center', minHeight: '48px' }}
                onClick={() => {
                  setIsDemoModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Agendar demo
              </button>

              <button
                type="button"
                className="btn btn-primary mkt-btn-start-trial"
                style={{ width: '100%', justifyContent: 'center', minHeight: '48px' }}
                onClick={() => {
                  handleStartTrial();
                  setIsMobileMenuOpen(false);
                }}
              >
                Comenzar prueba gratis de 7 días
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ==========================================================================
          HERO SECTION (IDÉNTICO A LA PÁGINA DE INICIO DE WAPPY + CONSTELACIÓN)
         ========================================================================== */}
      <header className="hero">
        <div className="cloud" style={{ top: 90, left: -60, width: 300, height: 120 }}></div>
        <div className="cloud" style={{ top: 240, right: -40, width: 260, height: 110 }}></div>
        <div className="cloud" style={{ bottom: 60, left: '18%', width: 240, height: 100, opacity: 0.5 }}></div>

        <div className="wrap hero-inner">
          <span className="trial">
            <span className="tdot"></span>
            Somos SST · Resolución 2764 de 2022 & Resolución 2646 de 2008 · Metodología del Bioindividuo
          </span>

          <h1 className="display">
            <span className="hero-h1-main">Evoluciona tu Gestión de Riesgo Psicosocial con IA,</span>
            <span className="hero-h1-sub">diagnóstico normativo e intervención viva.</span>
          </h1>

          <p className="sub">
            WAPPY sitúa la salud mental del trabajador en el centro con la Metodología del Bioindividuo: articula los
            hallazgos de la Batería de Riesgo Psicosocial (Intralaboral Forma A y B, Extralaboral y Estrés) con
            monitoreo emocional por QR, Comité de Convivencia (Ley 2365), agentes expertos en tiempo real y Sistema de
            Vigilancia Epidemiológica (SVE).
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
            <a
              href="#vision"
              onClick={(e) => scrollToSection(e, 'vision')}
              className="btn btn-glass"
            >
              Ver video explicativo
            </a>
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
                <div className="pwa-s1">Disponible como App Móvil</div>
                <div className="pwa-s2">Termómetro Emocional & Convivencia · PWA</div>
              </div>
              <span className="pwa-badge-pill">Sin tiendas</span>
            </button>
          </div>

          {/* Banner Prevencionista IA (Idéntico al Home) */}
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
                La Batería Psicosocial no debe quedarse archivada en un PDF.
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.82)', marginTop: 4, lineHeight: 1.45 }}>
                El Ministerio del Trabajo exige demostrar planes de intervención continua sobre los riesgos altos y muy
                altos (Res. 2764 de 2022). WAPPY automatiza tus protocolos de intervención, capacitaciones y seguimiento
                epidemiológico en horas, no meses.
              </div>
            </div>
          </div>
        </div>

        {/* Floating Interactive Stage (Ecosistema Centrado en el Bioindividuo - Estilo Idéntico al Home) */}
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

            {/* ⭐ CENTRO: EL COLABORADOR EN EL CORAZÓN PSICOSOCIAL DE LA ORGANIZACIÓN ⭐ */}
            <div className="float-center-bio">
              <div className="fcb-eyebrow">
                <span className="fcb-pulse-dot"></span>
                Equilibrio Mental & Bioindividuo
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(22,163,74,0.15)',
                  }}
                >
                  🧠
                </div>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    El Colaborador
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    Centro de la Evaluación Psicosocial
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  padding: '3px 8px',
                  borderRadius: 9999,
                  fontSize: 10.5,
                  fontWeight: 800,
                  margin: '2px 0 6px',
                }}
              >
                <span>⚡</span> Protegido bajo Reserva Clínica (Res. 2646)
              </div>

              <div className="fcb-bars" style={{ marginTop: 8 }}>
                <span className="fcb-bar" title="Intralaboral"></span>
                <span className="fcb-bar" title="Extralaboral"></span>
                <span className="fcb-bar" title="Manejo del Estrés"></span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: '#15803D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginTop: 4,
                }}
              >
                <span>Intralaboral</span>
                <span>Extralaboral</span>
                <span>Clima & Estrés</span>
              </div>

              <div className="fcb-tag" style={{ marginTop: 10 }}>
                4 INSTRUMENTOS · 4 DOMINIOS · 19 DIMENSIONES
              </div>
              <div className="fcb-sub" style={{ fontSize: 11, lineHeight: 1.35 }}>
                El ser humano en el centro: integración entre condiciones del cargo, entorno familiar, liderazgo y
                salud mental preventiva.
              </div>
            </div>

            {/* Responsive Satellites Container */}
            <div className="hero-satellites">
              {/* Satellite 1 (Top-Left): Cuestionario Intralaboral Forma A y Forma B */}
              <div className="float-card-v2 pos-top-left">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                    📋
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Intralaboral Forma A y B</div>
                    <div className="fcv2-subtitle">Resolución 2764 de 2022</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                    4 DOMINIOS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#FEF9C3', color: '#713F12' }}>
                  Forma A (123 ítems) para jefes, profesionales y técnicos; Forma B (97 ítems) para auxiliares y
                  operarios. Evalúa Liderazgo, Control, Demandas del Trabajo y Recompensas.
                </div>
              </div>

              {/* Satellite 2 (Top-Right): Radar Psicosocial & SVE Predictivo */}
              <div className="float-card-v2 pos-top-right">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#C7F303', color: '#0E1300' }}>
                    🔮
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">SVE & Radar Psicosocial IA</div>
                    <div className="fcv2-subtitle">Vigilancia Epidemiológica Viva</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                    PERIODICIDAD
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#C7F303', color: '#0E1300' }}>
                  Determina la periodicidad normativa (Anual en Riesgo Alto/Muy Alto o Bianual en Riesgo Medio/Bajo) y
                  activa los Protocolos de Intervención por sector económico y patologías asociadas al estrés.
                </div>
              </div>

              {/* Satellite 3 (Bottom-Left): Agente Especialista en Salud Mental & Psicólogo SST */}
              <div className="float-card-v2 pos-bottom-left">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    🤖
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Especialista IA Salud Mental</div>
                    <div className="fcv2-subtitle">Copiloto del Psicólogo SST</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#CFFAFE', color: '#0E7490' }}>
                    GUÍA TÉCNICA
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#ECFEFF', color: '#155E75' }}>
                  Apoya al Psicólogo Especialista con Licencia SST vigente en la estructuración de planes de acción,
                  talleres de prevención de Burnout, Acoso Laboral (Ley 1010) y Acoso Sexual (Ley 2365).
                </div>
              </div>

              {/* Satellite 4 (Bottom-Right): Extralaboral, Estrés y Ficha Sociodemográfica */}
              <div className="float-card-v2 pos-bottom-right">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    🏡
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Extralaboral & Estrés</div>
                    <div className="fcv2-subtitle">Entorno Familiar y Síntomas</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    31 + 31 ÍTEMS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#F0FDF4', color: '#166534' }}>
                  Evalúa 7 dimensiones extralaborales (tiempo libre, desplazamiento, redes de apoyo, vivienda) y 4
                  categorías de síntomas fisiológicos, sociales, intelectuales y psicoemocionales del estrés.
                </div>
              </div>

              {/* Satellite 5 (Bottom-Center): Termómetro Emocional QR & Comité de Convivencia */}
              <div className="float-card-v2 pos-bottom-center">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                    ❤️‍🩹
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Termómetro Emocional & COCOLAB</div>
                    <div className="fcv2-subtitle">Intervención Continua en Somos SST</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>
                    QR MÓVIL
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  Actualización del Perfil Sociodemográfico por QR, pulsos diarios de estado de ánimo (Mood Tracker),
                  buzón confidencial de convivencia laboral y cursos interactivos para líderes en la Academia LMS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================================================
          VIDEO BAND: ESPACIO DE VIDEO DE YOUTUBE (ADMINISTRABLE POR ADMIN DE WAPPY)
          Usa exactamente el diseño .vid-band, .vid-control-bar y .vid-shell del Home
         ========================================================================== */}
      <section id="vision" className="band vid-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Cápsula Audiovisual · Normatividad & Gestión Psicosocial
            </span>
            <h2 className="display">{videoTitle}</h2>
            <p>
              Descubre cómo cumplir cabalmente con la Resolución 2764 de 2022 y la Resolución 2646 de 2008 del
              Ministerio del Trabajo, respetando la reserva legal y articulando el diagnóstico de tu psicólogo
              especialista con los más de 30 aplicativos de WAPPY IA.
            </p>
          </div>

          {/* Video Action Toolbar (OUTSIDE the video - Identical to Home Page) */}
          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }}></span>
                Especial Batería Psicosocial · Res. 2764/2022
              </span>
              <span className="vid-tech-pill">Ministerio del Trabajo · SG-SST</span>
            </div>

            <div className="vid-control-right">
              {youtubeId && (
                <>
                  <button
                    type="button"
                    className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                    onClick={() => setShowVideo(false)}
                  >
                    🖼️ Portada Resumen
                  </button>
                  <button
                    type="button"
                    className={`vid-toggle-btn ${showVideo ? 'active' : ''}`}
                    onClick={() => setShowVideo(true)}
                  >
                    ▶️ Reproducir Video
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vid-ext-link"
                    title="Abrir en YouTube"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube ↗
                  </a>
                </>
              )}

              {/* Botón exclusivo para Admin de WAPPY */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setTempVideoUrl(videoUrl);
                    setTempVideoTitle(videoTitle);
                    setTempWhatsappUrl(whatsappUrl);
                    setIsAdminModalOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  ⚙️ {youtubeId ? 'Editar Link YouTube (Admin)' : 'Agregar Link YouTube (Admin)'}
                </button>
              )}
            </div>
          </div>

          {/* Video Shell (Exact same class .vid-shell from marketing.css) */}
          <div className={`vid-shell ${showVideo && isVerticalShort ? 'vid-vertical-mode' : 'vid-poster-mode'}`}>
            {youtubeId && showVideo ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`}
                  title={videoTitle}
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
            ) : (
              /* Poster interactivo con el estilo exacto de la página de inicio */
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  cursor: youtubeId || isAdmin ? 'pointer' : 'default',
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at 50% 30%, #112233 0%, #070D17 100%)',
                }}
                onClick={() => {
                  if (youtubeId) {
                    setShowVideo(true);
                  } else if (isAdmin) {
                    setTempVideoUrl(videoUrl);
                    setTempVideoTitle(videoTitle);
                    setTempWhatsappUrl(whatsappUrl);
                    setIsAdminModalOpen(true);
                  } else {
                    setIsDemoModalOpen(true);
                  }
                }}
              >
                {youtubeId && (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    alt={videoTitle}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      opacity: 0.75,
                    }}
                    className="vid-poster-img"
                  />
                )}

                <div
                  className="vid-play"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: youtubeId ? 'rgba(14, 19, 0, 0.35)' : 'transparent',
                    padding: 24,
                    textAlign: 'center',
                    gap: 14,
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
                      background: 'rgba(15, 23, 42, 0.90)',
                      backdropFilter: 'blur(10px)',
                      color: '#FFFFFF',
                      padding: '10px 20px',
                      borderRadius: 9999,
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <span>▶</span>
                    <span>
                      {youtubeId
                        ? 'Reproducir video de Batería de Riesgo Psicosocial'
                        : isAdmin
                          ? 'Haz clic aquí para pegar el link del video de YouTube (Modo Admin)'
                          : 'Ver cápsula sobre la Batería de Riesgo Psicosocial en Colombia'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          BENTO GRID: ESTRUCTURA DE LA BATERÍA DE RIESGO PSICOSOCIAL (RES. 2764 DE 2022)
          Usa exactamente las clases .bento, .cell, .cell.big y .cell.lime del Home
         ========================================================================== */}
      <section id="metodologia" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Resolución 2764 de 2022 · Ministerio del Trabajo & Universidad Javeriana
            </span>
            <h2 className="display">
              Estructura Oficial de la Batería de Riesgo Psicosocial
            </h2>
            <p>
              Adoptada obligatoriamente en Colombia para identificar, evaluar, prevenir, intervenir y monitorear los
              factores de riesgo psicosocial intralaboral, extralaboral y la sintomatología asociada al estrés.
            </p>
          </div>

          <div className="bento">
            {/* Big Cell: Semáforo de Baremo Oficial, Periodicidad y Reserva Legal */}
            <div className="cell big">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#10B981', display: 'inline-block' }}></span>
                    <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', fontWeight: 800 }}>
                      Resolución 2646 de 2008 & Resolución 2764 de 2022
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Cumplimiento Normativo
                  </span>
                </div>

                {/* Score Visual Banner (Gauge + Contexto Legal) */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 18, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 84, height: 84, transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="15" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#34D399', lineHeight: 1 }}>100%</span>
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>SVE ACTIVO</span>
                      <span style={{ fontSize: 7, fontWeight: 900, background: '#10B981', color: '#062B16', padding: '1px 5px', borderRadius: 9999, marginTop: 2 }}>LEGAL</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                      Reglas de Oro del Ministerio del Trabajo
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
                      Aplicación exclusiva por Psicólogo Especialista en SST con Licencia Vigente
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 4, lineHeight: 1.4 }}>
                      Aplicación física oficial o vía plataforma institucional SIRPSI. Los resultados individuales hacen
                      parte de la Historia Clínica Ocupacional bajo reserva legal estricta.
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose de Periodicidad y Niveles de Riesgo */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></span>
                    Periodicidad según Nivel de Riesgo (Art. 3 · Res. 2764 de 2022)
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 9999 }}>
                    5 Niveles de Baremo
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Nivel Alto / Muy Alto -> Anual */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.09)', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 62, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#FBBF24', lineHeight: 1 }}>ANUAL</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>CADA 1 AÑO</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🚨</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Riesgo Alto o Muy Alto (Intervención Inmediata)</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(245, 158, 11, 0.2)', color: '#FDE68A', textTransform: 'uppercase' }}>
                          SVE Obligatorio
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        Exige inclusión inmediata en el Sistema de Vigilancia Epidemiológica (SVE Psicosocial) e intervención prioritaria con protocolos específicos.
                      </div>
                    </div>
                  </div>

                  {/* Nivel Medio / Bajo / Sin Riesgo -> Bianual */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.09)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 62, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#34D399', lineHeight: 1 }}>BIANUAL</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>CADA 2 AÑOS</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🛡️</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Riesgo Medio, Bajo o Sin Riesgo</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0', textTransform: 'uppercase' }}>
                          Promoción
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        Evaluación cada 2 años manteniendo acciones continuas de promoción de la salud mental, bienestar y fortalecimiento de factores protectores.
                      </div>
                    </div>
                  </div>

                  {/* Protocolos de Intervención */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 62, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#2DD4BF', lineHeight: 1.1 }}>WAPPY IA</span>
                      <span style={{ fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>EJECUCIÓN</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>⚡</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Guía Técnica General y Protocolos Sectoriales</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(45, 212, 191, 0.2)', color: '#99F6E4', textTransform: 'uppercase' }}>
                          Automatizado
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        Articula los protocolos de prevención de Burnout, Depresión, Reacción al Estrés Agudo y Acoso Laboral en tu Cronograma Anual SG-SST.
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: 10, textAlign: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                      ✓ Trazabilidad Completa para Auditorías del Ministerio del Trabajo y ARL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cell 1: Cuestionario Intralaboral Forma A */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    👔
                  </span>
                  <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    123 Preguntas
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  Intralaboral Forma A (Jefes y Profesionales)
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Diseñado para trabajadores con cargos de dirección, jefatura, coordinación, profesionales o técnicos.
                  Incluye la evaluación de exigencias de responsabilidad del cargo y relación con los colaboradores
                  (subordinados) en los 4 dominios intralaborales.
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#0369A1' }}>
                ✓ 4 Dominios y 19 Dimensiones evaluadas
              </div>
            </div>

            {/* Cell 2: Cuestionario Intralaboral Forma B */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    👷
                  </span>
                  <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    97 Preguntas
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  Intralaboral Forma B (Auxiliares y Operativos)
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Aplicable a cargos auxiliares, asistenciales, operarios y de servicios generales. Evalúa demandas
                  cuantitativas, esfuerzo físico y ambiental, jornada laboral, control sobre el trabajo, liderazgo y
                  recompensas.
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                ✓ Adaptado a roles operativos y asistenciales
              </div>
            </div>

            {/* Cell 3: Cuestionario Extralaboral y Evaluación del Estrés */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🏡
                  </span>
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    31 + 31 Ítems
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  Extralaboral (7 Dimensiones) y Cuestionario de Estrés
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Analiza el tiempo fuera del trabajo, relaciones familiares, situación económica, vivienda y
                  desplazamiento casa-trabajo-casa; junto al Cuestionario de Estrés (síntomas fisiológicos, sociales,
                  intelectuales y psicoemocionales).
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                ✓ Visión holística del entorno del trabajador
              </div>
            </div>

            {/* Cell 4: Ficha de Datos Generales & Portal QR */}
            <div className="cell lime" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14, 19, 0, 0.1)', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    📱
                  </span>
                  <span style={{ background: 'rgba(14, 19, 0, 0.12)', color: '#0E1300', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    Ficha General QR
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0E1300', lineHeight: 1.25, marginBottom: 8 }}>
                  Ficha Sociodemográfica y Termómetro por QR
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(14, 19, 0, 0.72)', lineHeight: 1.5, fontWeight: 500 }}>
                  El trabajador escanea el código QR de la empresa desde su celular para mantener actualizada su Ficha
                  Sociodemográfica (edad, escolaridad, estrato, personas a cargo, antigüedad) y reportar su pulso
                  emocional diario sin contraseñas.
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(14, 19, 0, 0.15)', fontSize: 11, fontWeight: 800, color: '#0E1300' }}>
                ⚡ Caracterización poblacional en tiempo real
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECCIÓN FEATURE 1: LOS 4 DOMINIOS INTRALABORALES & COMITÉ DE CONVIVENCIA
          Usa exactamente .feat y .feat-art.tint-sky del Home
         ========================================================================== */}
      <section id="comites" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              4 Dominios Intralaborales & Comité de Convivencia (Ley 2365 de 2024)
            </span>
            <h2 className="display">
              Del Diagnóstico de los 4 Dominios a la Intervención Viva
            </h2>
            <p>
              Conecta cada dominio evaluado en la Batería de Riesgo Psicosocial con acciones medibles de liderazgo,
              convivencia laboral, claridad de rol y reconocimiento dentro de WAPPY IA.
            </p>
          </div>

          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                Liderazgo, Control, Demandas y Recompensas
              </span>
              <h3>Interviene las 19 dimensiones intralaborales con trazabilidad total.</h3>
              <p>
                No basta con medir: cuando una dimensión arroja riesgo alto o muy alto, el Ministerio del Trabajo exige
                evidencia de intervención continua en el SVE y articulación con el Comité de Convivencia Laboral.
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>1. Liderazgo y Relaciones Sociales:</strong> Votación QR del Comité de Convivencia (COCOLAB), buzón confidencial de acoso laboral (Ley 1010) y acoso sexual (Ley 2365 de 2024).
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>2. Control y Autonomía sobre el Trabajo:</strong> Perfiles de Cargo biocéntricos para claridad de rol, inducción interactiva y desarrollo de competencias en la Academia LMS.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>3. Demandas del Trabajo y 4. Recompensas:</strong> Monitoreo de carga mental y emocional, turnos saludables y gamificación con reconocimiento preventivo.
                </li>
              </ul>
            </div>

            <div className="feat-art tint-sky">
              <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🧠</span> Mapa de los 4 Dominios
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span>
                    RES. 2764 / 2022
                  </span>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      dom: 'Dominio 1 · Liderazgo y Relaciones Sociales',
                      dims: 'Liderazgo, relaciones sociales, retroalimentación y relación con colaboradores (Forma A).',
                      pill: 'COCOLAB & LMS',
                      color: '#0D9488',
                      bg: '#F0FDFA',
                    },
                    {
                      dom: 'Dominio 2 · Control sobre el Trabajo',
                      dims: 'Claridad de rol, capacitación, participación en el cambio, uso de habilidades y autonomía.',
                      pill: 'Perfiles de Cargo',
                      color: '#2563EB',
                      bg: '#EFF6FF',
                    },
                    {
                      dom: 'Dominio 3 · Demandas del Trabajo',
                      dims: 'Cuantitativas, carga mental, emocionales, responsabilidad, ambientales y jornada.',
                      pill: 'Mood Tracker QR',
                      color: '#D97706',
                      bg: '#FFFBEB',
                    },
                    {
                      dom: 'Dominio 4 · Recompensas',
                      dims: 'Pertenencia, estabilidad laboral, reconocimiento y compensación.',
                      pill: 'Gamificación SST',
                      color: '#7C3AED',
                      bg: '#F5F3FF',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: item.bg,
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>{item.dom}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: item.color, background: '#fff', padding: '2px 6px', borderRadius: 9999 }}>
                          {item.pill}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.35 }}>{item.dims}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECCIÓN FEATURE 2: AGENTES IA & TENSHI ORQUESTADOR EN SALUD MENTAL
          Usa exactamente .feat.rev y .feat-art.tint-lav del Home
         ========================================================================== */}
      <section id="tenshi" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Inteligencia Artificial Especializada en Salud Mental
            </span>
            <h2 className="display">
              Tenshi IA y el Agente Especialista en Riesgo Psicosocial
            </h2>
            <p>
              Tenshi coordina con el Especialista IA en Salud Mental, el Médico Laboral y el Abogado SST para ayudarte
              a diseñar el Plan de Intervención Psicosocial, redactar actas de convivencia y ejecutar actividades en
              pantalla.
            </p>
          </div>

          <div className="feat rev">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                Copiloto para Psicólogos SST y Líderes de Talento Humano
              </span>
              <h3>Diseña protocolos de intervención sectoriales y talleres en minutos.</h3>
              <p>
                Una vez que el Psicólogo Especialista entrega el diagnóstico general de la Batería, Tenshi te guía paso
                a paso por el sistema para convertir las recomendaciones en actividades programadas en el Cronograma
                SG-SST, capacitaciones en el LMS y controles en la Matriz GTC 45.
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Protocolos Oficiales Res. 2764 de 2022:</strong> Guía Técnica General, prevención de Burnout, Depresión, Duelo, Estrés Agudo y Acoso Laboral.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Diligenciamiento en Pantalla (Page Controller):</strong> Tenshi agenda las actividades del SVE Psicosocial directamente en tu cronograma anual.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Respeto Absoluto por la Reserva Legal:</strong> Cumplimiento de la Ley 1090 de 2006, Resolución 2346 de 2007 y Ley 1581 de 2012 (Habeas Data).
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
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', lineHeight: 1.1 }}>Tenshi IA · Salud Mental</div>
                      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Orquestador SVE Psicosocial</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                    Res. 2764 / 2022
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <div style={{ alignSelf: 'flex-end', maxWidth: '88%', background: '#F1F5F9', borderRadius: '12px 12px 2px 12px', padding: '8px 12px', fontSize: 11.5, color: '#1E293B', lineHeight: 1.4 }}>
                    Tenshi, el informe de la Batería arrojó Riesgo Alto en Demandas Emocionales y Liderazgo. Ayúdame a estructurar el Plan de Intervención Anual.
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px 12px 12px 2px', padding: '12px', fontSize: 11.5, lineHeight: 1.45, color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0284C7', marginBottom: 4 }}>
                      <span>🧭</span> Plan SVE Activado (Periodicidad Anual):
                    </div>
                    <div style={{ marginBottom: 8, fontSize: 11 }}>
                      Convoqué al Especialista en Salud Mental y apliqué los protocolos de la Resolución 2764 de 2022:
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: 10.5 }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>⚡ Actividades Creadas en tu SG-SST:</div>
                      <div style={{ color: '#475569' }}>• Escuela de Liderazgo Empático (Forma A) en LMS</div>
                      <div style={{ color: '#475569' }}>• Protocolo de Primeros Auxilios Psicológicos</div>
                      <div style={{ color: '#0D9488', fontWeight: 700, marginTop: 2 }}>✓ Vinculado a Matriz GTC 45 y Cronograma</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, height: 36, borderRadius: 10, background: '#0E1300', color: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, gap: 5 }}>
                    <span>⚡</span> Intervención Automatizada
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

      {/* ==========================================================================
          MOBILE APPS SHOWCASE (CON EL FONDO CIELO Y LOS 3 TELÉFONOS DE LA HOME)
         ========================================================================== */}
      <section id="movil" className="band" style={{ background: 'var(--sky)', overflow: 'hidden', position: 'relative' }}>
        <div className="cloud" style={{ top: 40, left: -40, width: 240, height: 100 }}></div>
        <div className="cloud" style={{ bottom: 40, right: -30, width: 220, height: 90 }}></div>

        <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className="sec-head" style={{ marginBottom: 40 }}>
            <span className="eyebrow">
              <span className="dot"></span>
              PWA Móvil & Participación del Trabajador por QR
            </span>
            <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
              Termómetro Emocional, Convivencia y Agentes en el Celular
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.62)', maxWidth: 640, margin: '14px auto 0' }}>
              Sin descargar aplicaciones pesadas ni recordar contraseñas: tus colaboradores actualizan su Ficha
              Sociodemográfica, reportan su estado de ánimo diario, votan en el Comité de Convivencia y reciben apoyo
              preventivo desde cualquier smartphone.
            </p>
          </div>

          <div className="app-phones">
            {/* Phone 1: Termómetro Psicosocial & Mood Tracker QR */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>❤️‍🩹</span> Termómetro Psicosocial · Mood Tracker
              </div>
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#090D16', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#E11D48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          ❤️
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Termómetro Emocional</div>
                          <div style={{ fontSize: 9.5, color: '#FDA4AF', fontWeight: 600 }}>Pulso Psicosocial · Hito 4</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' }}>
                        EN VIVO
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0F172A', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>
                          ¿Cómo percibes tu carga y estado de ánimo hoy?
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, padding: '4px 2px' }}>
                          <span>😄</span>
                          <span>🙂</span>
                          <span>😐</span>
                          <span style={{ transform: 'scale(1.25)', filter: 'drop-shadow(0 0 6px #F59E0B)' }}>😓</span>
                          <span>😫</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(245, 158, 11, 0.14)', borderRadius: 12, padding: 10, border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#FCD34D', marginBottom: 3 }}>
                          ⚡ Alerta Temprana de Fatiga Mental
                        </div>
                        <div style={{ fontSize: 9.5, color: '#E2E8F0', lineHeight: 1.35 }}>
                          Incremento del 18% en sobrecarga cuantitativa en el área de Operaciones esta semana.
                        </div>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: 12, padding: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#34D399', marginBottom: 3 }}>
                          ✓ Acción Preventiva Recomendada
                        </div>
                        <div style={{ fontSize: 9.5, color: '#E2E8F0', lineHeight: 1.35 }}>
                          Pausa cognitiva activa y redistribución de turnos antes de generar ausentismo.
                        </div>
                      </div>
                    </div>

                    <span style={{ height: 34, width: '100%', borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800 }}>
                      📊 Ver Analítica por Áreas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2: Especialista IA en Salud Mental */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>🤖</span> Especialista IA · Salud Mental & SST
              </div>
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                          SM
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Salud Mental IA</div>
                          <div style={{ fontSize: 9.5, color: '#94A3B8' }}>En línea · +20 Especialistas</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(199, 243, 3, 0.2)', color: '#C7F303' }}>
                        CHAT IA
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, background: '#0E1300', color: '#C7F303', whiteSpace: 'nowrap' }}>
                          Salud Mental
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                          Médico Laboral
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                          Abogado SST
                        </span>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 12, padding: 9, fontSize: 11, lineHeight: 1.45, color: '#1E293B', border: '1px solid #E2E8F0' }}>
                        He estructurado el Protocolo de Prevención de Síndrome de Burnout conforme a la Resolución 2764
                        de 2022 para los cargos que puntuaron Riesgo Alto en la Forma A.
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, padding: '6px 8px', fontSize: 9.5, color: '#0369A1', fontWeight: 700, border: '1px solid #E0F2FE' }}>
                        <span>📜</span>
                        <span>Citado con Res. 2764/2022 & Res. 2646/2008</span>
                      </div>

                      <div style={{ fontSize: 9.5, color: '#64748B', padding: '0 2px' }}>
                        ✓ Apoyo técnico 24/7 para el Psicólogo Especialista
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, fontWeight: 800 }}>
                        🎙️ Consulta por Voz en Vivo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 3: Portales Públicos QR (Convivencia, Votación & Perfil) */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>📱</span> Portales Públicos QR · Convivencia
              </div>
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0D9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                          QR
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Portal Colaborador</div>
                          <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Cero contraseñas · Cédula</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(13, 148, 136, 0.25)', color: '#2DD4BF' }}>
                        PWA MÓVIL
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '6px 8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>Mariana Ríos</div>
                          <div style={{ fontSize: 9.5, color: '#64748B' }}>C.C. 1.037.612.*** · Analista (Forma A)</div>
                        </div>
                        <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#10B981' }}></span>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🤝</span> Comité de Convivencia
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#FCE7F3', color: '#BE185D' }}>
                            Ley 2365
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          Canal confidencial y votaciones COCOLAB
                        </div>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>👥</span> Ficha Sociodemográfica
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#FEF3C7', color: '#B45309' }}>
                            Actualizada
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          19 variables generales sincronizadas
                        </div>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🎓</span> Academia LMS Salud Mental
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D' }}>
                            Certificado
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          Micro-curso: Manejo del Estrés y Liderazgo
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, fontWeight: 800 }}>
                        ⚡ Escanear QR de Empresa
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          PRICING SECTION (IDÉNTICA AL HOME DE WAPPY)
         ========================================================================== */}
      <section id="pricing" className="band">
        <div id="planes" style={{ position: 'relative', top: -90 }} />
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Inversión Transparente & Retorno Inmediato
            </span>
            <h2 className="display">Planes Comerciales y Tarifas WAPPY Pro</h2>
            <p>
              Una sola suite integral con todas las herramientas de IA, gestión de riesgo psicosocial y normatividad
              colombiana. Elige la periodicidad que mejor se ajuste a tu empresa con 7 días de prueba gratis:
            </p>
          </div>

          <div className="price">
            {/* Wappy Pro Mensual */}
            <div className="pcard">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                Flexibilidad Mensual
              </span>
              <div className="pn">Wappy Pro Mensual</div>
              <div className="pp">$114.330<span> COP /mes</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                Flexibilidad mes a mes · Cancela en cualquier momento
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#1E8E3E', display: 'inline-block' }}></span>
                Prueba gratis de 7 días
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Somos SST completo (30+ aplicativos en 8 hitos)
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Termómetro Psicosocial, Comité de Convivencia y Perfil QR
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Conversaciones ilimitadas con +20 Agentes IA (incluido Salud Mental)
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Matriz IPEVR (GTC 45), Bio-IPEVR y Cronograma SVE
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleGoToPlanes}>
                Elegir Pro Mensual
              </button>
            </div>

            {/* Wappy Pro Semestral */}
            <div className="pcard">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14, background: '#0D9488', color: '#fff' }}>
                Ahorro Semestral · 6% DCTO
              </span>
              <div className="pn">Wappy Pro Semestral</div>
              <div className="pp">$641.960<span> COP /semestre</span></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', marginTop: 1, marginBottom: 4 }}>
                ⚡ Equivalente a $106.993 COP/mes
              </div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                Compromiso semestral con tarifa reducida para tu empresa
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#1E8E3E', display: 'inline-block' }}></span>
                Prueba gratis de 7 días
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Todo lo del Plan Pro, facturado semestralmente</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  30+ aplicativos del SG-SST y Academia LMS habilitados
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  +20 Agentes IA: Salud Mental, Médico, Abogado, Fisioterapeuta
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Soporte técnico preferencial y acompañamiento de inicio
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleGoToPlanes}>
                Elegir Pro Semestral
              </button>
            </div>

            {/* Wappy Pro Anual (Más Popular) */}
            <div className="pcard feat-plan">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14 }}>
                Más popular · Máximo ahorro
              </span>
              <div className="pn">Wappy Pro Anual</div>
              <div className="pp">$1.200.000<span> COP /año</span></div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime)', marginTop: 1, marginBottom: 4 }}>
                🌟 Solo $100.000 COP/mes (Ahorras $171.960/año)
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
                La elección preferida por empresas y psicólogos especialistas SST
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--lime)', display: 'inline-block' }}></span>
                Prueba gratis de 7 días
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Todo lo del ecosistema Wappy Pro con tarifa preferencial</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Somos SST integral: 30+ aplicativos en los 8 hitos normativos
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  +20 Agentes IA autónomos y orquestador Tenshi 24/7
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Creación de Agentes de IA propios a la medida de tu empresa
                </li>
              </ul>
              <button className="btn btn-lime btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={handleGoToPlanes}>
                Elegir Wappy Pro Anual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FAQ: PREGUNTAS FRECUENTES SOBRE LA BATERÍA DE RIESGO PSICOSOCIAL
         ========================================================================== */}
      <section id="faq" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Resolvemos tus Dudas Normativas
            </span>
            <h2 className="display">Preguntas Frecuentes sobre la Batería Psicosocial</h2>
            <p>
              Todo lo que necesitas saber sobre la Resolución 2646 de 2008, la Resolución 2764 de 2022, el rol del
              psicólogo especialista y cómo WAPPY IA automatiza la intervención.
            </p>
          </div>

          <div className="faq">
            {[
              {
                q: '¿Quién es el único profesional autorizado en Colombia para aplicar la Batería de Riesgo Psicosocial?',
                a: 'De acuerdo con la Resolución 2646 de 2008 y la Resolución 2764 de 2022, la aplicación, calificación e interpretación de la Batería debe ser liderada exclusivamente por un Psicólogo con posgrado en Seguridad y Salud en el Trabajo (o Salud Ocupacional) y con Licencia en SST vigente.',
              },
              {
                q: '¿Cuál es la diferencia entre el Cuestionario Intralaboral Forma A y Forma B?',
                a: 'La Forma A (123 preguntas) se aplica a personas con cargos de jefatura, directivos, profesionales o técnicos que tienen personal a cargo o alta autonomía decisoria. La Forma B (97 preguntas) se aplica a trabajadores en cargos auxiliares, asistenciales y operativos.',
              },
              {
                q: '¿Cada cuánto tiempo están obligadas las empresas a aplicar la Batería (Anual o Bianual)?',
                a: 'Según el Artículo 3 de la Resolución 2764 de 2022: es ANUAL (cada año) para las empresas cuyos resultados intralaborales generales se ubiquen en nivel de riesgo Alto o Muy Alto. Es BIANUAL (cada 2 años) cuando el nivel de riesgo intralaboral general sea Medio, Bajo o Sin Riesgo.',
              },
              {
                q: '¿Cómo se articula la aplicación oficial (Física / SIRPSI) con WAPPY IA?',
                a: 'El Ministerio del Trabajo establece que la Batería oficial se aplica mediante los formatos físicos oficiales o a través del Sistema de Información de Riesgo Psicosocial (SIRPSI) bajo custodia del psicólogo especialista. Una vez obtenido el diagnóstico epidemiológico general, WAPPY IA automatiza el Perfil Sociodemográfico por QR, el Sistema de Vigilancia Epidemiológica (SVE), el Termómetro Emocional continuo, el Comité de Convivencia (Ley 2365 de 2024) y las capacitaciones en la Academia LMS.',
              },
              {
                q: '¿Cómo se garantiza la confidencialidad y reserva de la Historia Clínica Ocupacional?',
                a: 'Las evaluaciones individuales hacen parte de la Historia Clínica Ocupacional y están protegidas por reserva legal (Resolución 2346 de 2007 y Ley 1090 de 2006) bajo custodia exclusiva del psicólogo especialista. En WAPPY se gestionan los indicadores epidemiológicos colectivos, planes de acción por área y actividades preventivas bajo cifrado AES-256 y cumplimiento de la Ley 1581 de 2012.',
              },
            ].map((item, idx) => (
              <div key={idx} className={`qa ${openFaq === idx ? 'open' : ''}`}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} aria-expanded={openFaq === idx}>
                  {item.q}
                  <span className="q-ico">+</span>
                </button>
                <div className="a">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Banner (Idéntico al Home) */}
      <section className="final">
        <span className="trial" style={{ marginBottom: 18 }}>
          <span className="tdot"></span>
          Auditoría sin estrés garantizada · Res. 2764 de 2022
        </span>
        <h2>Moderniza tu gestión psicosocial y SG-SST hoy mismo.</h2>
        <p>
          Configura tu primera empresa en 2 minutos y deja que Tenshi orqueste tu Plan de Intervención Psicosocial.
        </p>
        <div className="hero-cta" style={{ marginTop: 28 }}>
          <button className="btn btn-primary" onClick={handleStartTrial}>
            Empezar prueba de 7 días
            <span className="pip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </button>
          <button className="btn btn-glass" onClick={() => setIsDemoModalOpen(true)}>
            Agendar demostración
          </button>
        </div>
      </section>

      {/* Footer (Idéntico al Home) */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }}></div>
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }}></div>

        <div className="wrap">
          <div className="foot-cta">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 44, width: 44, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
                WAPPY<span style={{ color: '#16a34a' }}>IA</span>
              </span>
            </div>
            <h3 className="display">La seguridad y salud mental de tu equipo es primero.</h3>
            <p>Empieza hoy tu prueba gratis de 7 días. Sin tarjeta de crédito.</p>
            <div className="hero-cta" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={handleStartTrial}>
                Empezar prueba gratis
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
              <button type="button" className="btn btn-glass" onClick={handleLogin}>
                Ir a WAPPY
              </button>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                  WAPPY<span style={{ color: '#16a34a' }}>IA</span>
                </span>
              </div>
              <p className="foot-desc">
                Ecosistema de Inteligencia Artificial para el SG-SST en Colombia. Metodología del Bioindividuo, +20
                agentes autónomos, gestión de riesgo psicosocial, matrices GTC 45, Química SGA, PESV y analítica
                predictiva.
              </p>
            </div>
          </div>

          <div className="foot-word">WAPPY</div>

          <div className="foot-bottom">
            <span>© 2026 WAPPY LTDA · NIT 901437310-3 · Medellín, Colombia. Todos los derechos reservados.</span>
            <div className="foot-legal">
              <a href="/">Inicio</a>
              <a href="/terms">Términos</a>
              <a href="/privacy-policy">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`mkt-toast ${toastMessage ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* ==========================================================================
          MODAL DE ADMINISTRADOR WAPPY: CONFIGURAR LINK DE YOUTUBE
         ========================================================================== */}
      {isAdmin && (
        <div
          className={`mkt-modal-scrim ${isAdminModalOpen ? 'show' : ''}`}
          aria-hidden={!isAdminModalOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAdminModalOpen(false);
            }
          }}
        >
          <div className="mkt-modal" role="dialog" aria-modal="true" aria-label="Configurar Video YouTube">
            <button className="mkt-modal-x" onClick={() => setIsAdminModalOpen(false)} aria-label="Cerrar">
              ×
            </button>
            <span className="eyebrow">
              <span className="dot"></span>
              Panel de Administrador WAPPY
            </span>
            <h3 className="display" style={{ fontSize: 26, margin: '12px 0 6px' }}>
              Configurar Video de YouTube
            </h3>
            <p style={{ color: '#5a6470', fontSize: 13.5, margin: '0 0 18px', lineHeight: 1.5 }}>
              Pega el enlace de cualquier video de YouTube (formato normal <code>youtube.com/watch?v=...</code>, corto{' '}
              <code>youtu.be/...</code> o <code>shorts</code>). Se cargará automáticamente en la sección de video de
              esta página para todos los visitantes.
            </p>

            <form onSubmit={handleSaveAdminConfig}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                Título de la sección del video
              </label>
              <input
                className="fld"
                type="text"
                placeholder="Ej: Batería de Riesgo Psicosocial en Colombia (Res. 2764 de 2022)"
                value={tempVideoTitle}
                onChange={(e) => setTempVideoTitle(e.target.value)}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', margin: '10px 0 6px' }}>
                Link del Video de YouTube
              </label>
              <input
                className="fld"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={tempVideoUrl}
                onChange={(e) => setTempVideoUrl(e.target.value)}
              />

              {tempYoutubeId ? (
                <div
                  style={{
                    marginTop: 12,
                    marginBottom: 14,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1.5px solid #10B981',
                    background: '#090D16',
                  }}
                >
                  <div
                    style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>✓ Video de YouTube detectado correctamente</span>
                    <span>ID: {tempYoutubeId}</span>
                  </div>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${tempYoutubeId}?rel=0`}
                      title="Vista previa YouTube"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : tempVideoUrl.trim() ? (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ No se detectó un ID válido de YouTube. Asegúrate de pegar el link directo del video.
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingConfig}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isSavingConfig ? 'Guardando...' : 'Guardar y Publicar Video'}
                </button>
                {videoUrl && (
                  <button
                    type="button"
                    className="btn btn-glass"
                    style={{ border: '1px solid #FECACA', color: '#DC2626' }}
                    onClick={() => setTempVideoUrl('')}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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
            Agendar demostración
          </span>
          <h3 className="display" style={{ fontSize: 28, margin: '14px 0 6px' }}>
            Mira WAPPY en vivo
          </h3>
          <p style={{ color: '#5a6470', fontSize: 14.5, margin: '0 0 20px', lineHeight: 1.5 }}>
            Te mostraremos cómo gestionar el SVE de Riesgo Psicosocial, el Comité de Convivencia y los más de 20
            agentes de IA en tu organización.
          </p>

          <form onSubmit={handleDemoSubmit}>
            <input
              className="fld"
              type="text"
              placeholder="Nombre completo"
              required
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
            />
            <input
              className="fld"
              type="email"
              placeholder="Email corporativo"
              required
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
            />
            <input
              className="fld"
              type="tel"
              placeholder="Número de contacto / WhatsApp"
              required
              value={demoPhone}
              onChange={(e) => setDemoPhone(e.target.value)}
            />
            <input
              className="fld"
              type="text"
              placeholder="Empresa u Organización"
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
                Selecciona la ARL de tu empresa
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
              <option value="Otra">Otra ARL / Psicólogo Especialista SST</option>
            </select>
            <select
              className="fld"
              value={demoTeamSize}
              onChange={(e) => setDemoTeamSize(e.target.value)}
            >
              <option value="1–10">1–10 trabajadores</option>
              <option value="11–50">11–50 trabajadores</option>
              <option value="50+">Más de 50 trabajadores</option>
              <option value="consultor">Soy Psicólogo Especialista / Consultor SST</option>
            </select>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmittingDemo}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {isSubmittingDemo ? 'Enviando solicitud...' : 'Solicitar demo personalizada'}
            </button>
          </form>
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
            ×
          </button>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36, display: 'inline-block', marginBottom: 8 }}>📲</span>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
              Instala WAPPY en tu celular o tablet
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              WAPPY es una Aplicación Web Progresiva (PWA): ultraligera, siempre sincronizada y sin descargas pesadas
              desde tiendas.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setIsPwaModalOpen(false)}
          >
            ¡Entendido, gracias!
          </button>
        </div>
      </div>
    </div>
  );
}
