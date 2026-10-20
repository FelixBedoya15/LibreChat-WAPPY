import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import axios from 'axios';
import './marketing.css';

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
  const { user, token } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  const funnelKey = 'psicosocial';

  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // YouTube Video & Admin Configuration States
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>(
    '¿Qué es la Batería de Riesgo Psicosocial, para qué sirve y cómo se aplica en Colombia?'
  );

  // Admin Edit Modal States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [tempVideoUrl, setTempVideoUrl] = useState<string>('');
  const [tempVideoTitle, setTempVideoTitle] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

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
        '¿Qué es la Batería de Riesgo Psicosocial, para qué sirve y cómo se aplica en Colombia?';

      await axios.post(
        '/api/comunidad/config',
        {
          funnelKey,
          videoUrl: cleanUrl,
          extraVideoTitle1: cleanTitle,
        },
        { headers }
      );
      setVideoUrl(cleanUrl);
      setVideoTitle(cleanTitle);
      if (cleanUrl) {
        setShowVideo(true);
      }
      setIsAdminModalOpen(false);
      showToast('✅ Video de YouTube guardado y publicado en vivo para todos los visitantes.');
    } catch (err) {
      console.error('[BateriaPsicosocialPage] Error saving admin config:', err);
      showToast('⚠️ Error al guardar el video. Verifica tu sesión de administrador.');
    } finally {
      setIsSavingConfig(false);
    }
  };

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
    if (isMobileMenuOpen || isAdminModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isAdminModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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

      {/* ==========================================================================
          ENCABEZADO / NAVBAR (CON EL MISMO DISEÑO CÁPSULA DE WAPPY HOME)
         ========================================================================== */}
      <nav className="mkt-nav" aria-label="Navegación de la guía de Batería Psicosocial">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="WAPPY IA - Guía Informativa Batería Psicosocial"
            href="/bateria-psicosocial"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" className="mkt-logo-icon" />
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">
                WAPPY<span>IA</span>
              </span>
              <span className="mkt-logo-sub">RIESGO PSICOSOCIAL</span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#video" onClick={(e) => scrollToSection(e, 'video')} title="Video explicativo sobre la Batería">
              Video Explicativo
            </a>
            <a href="#que-es" onClick={(e) => scrollToSection(e, 'que-es')} title="¿Qué es y para qué sirve la Batería?">
              ¿Qué es y para qué sirve?
            </a>
            <a href="#instrumentos" onClick={(e) => scrollToSection(e, 'instrumentos')} title="Los 4 Instrumentos: Forma A, Forma B, Extralaboral y Estrés">
              4 Instrumentos (Forma A y B)
            </a>
            <a href="#dominios" onClick={(e) => scrollToSection(e, 'dominios')} title="Los 4 Dominios y 19 Dimensiones Intralaborales">
              4 Dominios Evaluados
            </a>
            <a href="#aplicacion" onClick={(e) => scrollToSection(e, 'aplicacion')} title="Paso a paso de cómo se aplica la Batería">
              ¿Cómo se aplica?
            </a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} title="Preguntas Frecuentes Normativas">
              Preguntas Frecuentes
            </a>
          </div>

          <div className="mkt-nav-cta">
            <a
              href="#video"
              onClick={(e) => scrollToSection(e, 'video')}
              className="btn btn-ghost mkt-nav-signin"
            >
              Ver Video
            </a>

            <a
              href="#instrumentos"
              onClick={(e) => scrollToSection(e, 'instrumentos')}
              className="btn btn-lime btn-sm"
            >
              Explorar Guía
            </a>

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
              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('video')}>
                <span className="mkt-mobile-link-icon">🎬</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Video Explicativo</span>
                  <span className="mkt-mobile-link-desc">Cápsula educativa sobre la Batería de Riesgo Psicosocial</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('que-es')}>
                <span className="mkt-mobile-link-icon">🎯</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">¿Qué es y para qué sirve?</span>
                  <span className="mkt-mobile-link-desc">Objetivos, beneficios y obligatoriedad legal en Colombia</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('instrumentos')}>
                <span className="mkt-mobile-link-icon">📋</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Los 4 Instrumentos Oficiales</span>
                  <span className="mkt-mobile-link-desc">Ficha General, Intralaboral (Forma A y B), Extralaboral y Estrés</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('dominios')}>
                <span className="mkt-mobile-link-icon">🧠</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Los 4 Dominios y 19 Dimensiones</span>
                  <span className="mkt-mobile-link-desc">Liderazgo, Control, Demandas del Trabajo y Recompensas</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('aplicacion')}>
                <span className="mkt-mobile-link-icon">🛡️</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">¿Cómo se aplica paso a paso?</span>
                  <span className="mkt-mobile-link-desc">Consentimiento informado, aplicación, baremos y reserva legal</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('faq')}>
                <span className="mkt-mobile-link-icon">❓</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Preguntas Frecuentes</span>
                  <span className="mkt-mobile-link-desc">Periodicidad anual/bianual, psicólogo especialista y confidencialidad</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ==========================================================================
          HERO SECTION (ESTILO CIELO WAPPY + CONSTELACIÓN 100% SOBRE LA BATERÍA)
         ========================================================================== */}
      <header className="hero">
        <div className="cloud" style={{ top: 90, left: -60, width: 300, height: 120 }}></div>
        <div className="cloud" style={{ top: 240, right: -40, width: 260, height: 110 }}></div>
        <div className="cloud" style={{ bottom: 60, left: '18%', width: 240, height: 100, opacity: 0.5 }}></div>

        <div className="wrap hero-inner">
          <span className="trial">
            <span className="tdot"></span>
            Guía Informativa Oficial · Resolución 2764 de 2022 & Resolución 2646 de 2008
          </span>

          <h1 className="display">
            <span className="hero-h1-main">Batería de Instrumentos para la Evaluación</span>
            <span className="hero-h1-sub">de Factores de Riesgo Psicosocial.</span>
          </h1>

          <p className="sub">
            Conoce qué es la Batería de Riesgo Psicosocial del Ministerio del Trabajo y la Pontificia Universidad
            Javeriana, para qué sirve en la protección de la salud mental de los trabajadores, cuáles cuestionarios la
            componen (Forma A, Forma B, Extralaboral y Estrés) y cómo se aplica paso a paso bajo confidencialidad legal.
          </p>

          <div className="hero-cta">
            <a
              href="#video"
              onClick={(e) => scrollToSection(e, 'video')}
              className="btn btn-primary"
            >
              Ver video explicativo
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </span>
            </a>
            <a
              href="#que-es"
              onClick={(e) => scrollToSection(e, 'que-es')}
              className="btn btn-glass"
            >
              ¿Qué es y para qué sirve?
            </a>
          </div>

          {/* Banner Informativo Normativo */}
          <div
            className="hero-ai-banner"
            style={{
              maxWidth: 780,
              margin: '26px auto 0',
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
              📜
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                ¿Por qué se aplica la Batería de Riesgo Psicosocial en las empresas?
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.82)', marginTop: 4, lineHeight: 1.45 }}>
                No es un examen de desempeño ni una prueba para calificar al trabajador. Es una herramienta científica y
                confidencial para escuchar cómo las condiciones del trabajo, el liderazgo y el entorno impactan tu
                bienestar físico, emocional y familiar, permitiendo crear entornos laborales más sanos.
              </div>
            </div>
          </div>
        </div>

        {/* Constelación Visual de los Componentes de la Batería Psicosocial */}
        <div className="wrap">
          <div className="hero-stage">
            <svg className="hero-connectors" aria-hidden="true">
              <line x1="50%" y1="40%" x2="16%" y2="12%" className="connector-line" />
              <line x1="50%" y1="40%" x2="84%" y2="12%" className="connector-line" />
              <line x1="50%" y1="40%" x2="16%" y2="52%" className="connector-line" />
              <line x1="50%" y1="40%" x2="84%" y2="52%" className="connector-line" />
              <line x1="50%" y1="40%" x2="50%" y2="75%" className="connector-line" />
            </svg>

            {/* ⭐ CENTRO: LA BATERÍA Y EL BIENESTAR DEL TRABAJADOR ⭐ */}
            <div className="float-center-bio">
              <div className="fcb-eyebrow">
                <span className="fcb-pulse-dot"></span>
                Evaluación Oficial · Ministerio del Trabajo
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
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    Batería Psicosocial
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    Salud Mental & Bienestar Laboral
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
                <span>🔒</span> 100% Confidencial · Reserva Legal (Res. 2646)
              </div>

              <div className="fcb-bars" style={{ marginTop: 8 }}>
                <span className="fcb-bar" title="Factores Intralaborales"></span>
                <span className="fcb-bar" title="Factores Extralaborales"></span>
                <span className="fcb-bar" title="Evaluación del Estrés"></span>
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
                <span>Estrés</span>
              </div>

              <div className="fcb-tag" style={{ marginTop: 10 }}>
                4 CUESTIONARIOS · 4 DOMINIOS · 5 NIVELES DE RIESGO
              </div>
              <div className="fcb-sub" style={{ fontSize: 11, lineHeight: 1.35 }}>
                Evalúa de forma integral las condiciones internas del trabajo, el entorno familiar y social, y los
                síntomas asociados al estrés.
              </div>
            </div>

            {/* Satélites explicativos de los componentes de la Batería */}
            <div className="hero-satellites">
              {/* Satélite 1 (Top-Left): Cuestionario Intralaboral Forma A */}
              <div className="float-card-v2 pos-top-left">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                    👔
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Intralaboral Forma A</div>
                    <div className="fcv2-subtitle">Jefes, Profesionales y Técnicos</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                    123 ÍTEMS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#FEF9C3', color: '#713F12' }}>
                  Dirigido a cargos directivos, de coordinación, profesionales o técnicos. Evalúa autonomía, toma de
                  decisiones, responsabilidad por resultados y manejo de personal a cargo.
                </div>
              </div>

              {/* Satélite 2 (Top-Right): Cuestionario Intralaboral Forma B */}
              <div className="float-card-v2 pos-top-right">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#C7F303', color: '#0E1300' }}>
                    👷
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Intralaboral Forma B</div>
                    <div className="fcv2-subtitle">Auxiliares y Operativos</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                    97 ÍTEMS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#C7F303', color: '#0E1300' }}>
                  Dirigido a cargos auxiliares, asistenciales, operarios y de servicios. Evalúa las demandas físicas,
                  cuantitativas, ambientales, jornada de trabajo, apoyo social y recompensas.
                </div>
              </div>

              {/* Satélite 3 (Bottom-Left): Cuestionario Extralaboral */}
              <div className="float-card-v2 pos-bottom-left">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    🏡
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Factores Extralaborales</div>
                    <div className="fcv2-subtitle">Entorno Familiar y Social</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#CFFAFE', color: '#0E7490' }}>
                    31 ÍTEMS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#ECFEFF', color: '#155E75' }}>
                  Indaga 7 dimensiones fuera del trabajo: uso del tiempo libre, desplazamiento vivienda-trabajo, redes
                  de apoyo familiar, características de la vivienda y situación económica.
                </div>
              </div>

              {/* Satélite 4 (Bottom-Right): Cuestionario para la Evaluación del Estrés */}
              <div className="float-card-v2 pos-bottom-right">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    ❤️‍🩹
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Cuestionario de Estrés</div>
                    <div className="fcv2-subtitle">Sintomatología en los últimos 3 meses</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    31 ÍTEMS
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#F0FDF4', color: '#166534' }}>
                  Identifica síntomas fisiológicos (dolor muscular, sueño), de comportamiento social, intelectuales y
                  laborales (concentración, fatiga) y psicoemocionales.
                </div>
              </div>

              {/* Satélite 5 (Bottom-Center): Ficha de Datos Generales y Reserva Psicólogo SST */}
              <div className="float-card-v2 pos-bottom-center">
                <div className="fcv2-header">
                  <div className="fcv2-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                    🩺
                  </div>
                  <div className="fcv2-titles">
                    <div className="fcv2-title">Ficha Sociodemográfica & Psicólogo SST</div>
                    <div className="fcv2-subtitle">Custodia de Historia Clínica Ocupacional</div>
                  </div>
                  <div className="fcv2-badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>
                    CONFIDENCIAL
                  </div>
                </div>
                <div className="fcv2-body" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  Recopila 19 variables demográficas y ocupacionales. Es aplicada exclusivamente por un Psicólogo
                  Especialista en SST con licencia vigente bajo consentimiento informado.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================================================
          VIDEO BAND: ESPACIO DE VIDEO DE YOUTUBE (ADMINISTRABLE POR ADMIN DE WAPPY)
         ========================================================================== */}
      <section id="video" className="band vid-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Cápsula Educativa · Aplicación de la Batería de Riesgo Psicosocial
            </span>
            <h2 className="display">{videoTitle}</h2>
            <p>
              Mira este video informativo para comprender de manera clara qué es la Batería de Riesgo Psicosocial, cuál
              es su propósito preventivo y cómo participar durante la jornada de evaluación.
            </p>
          </div>

          {/* Barra superior del reproductor */}
          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }}></span>
                Guía en Video · Batería de Riesgo Psicosocial
              </span>
              <span className="vid-tech-pill">Resolución 2764 de 2022 · Res. 2646 de 2008</span>
            </div>

            <div className="vid-control-right">
              {youtubeId && (
                <>
                  <button
                    type="button"
                    className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                    onClick={() => setShowVideo(false)}
                  >
                    🖼️ Portada
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

          {/* Contenedor del Video */}
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
                    setIsAdminModalOpen(true);
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
                        ? 'Reproducir video sobre la Batería de Riesgo Psicosocial'
                        : isAdmin
                          ? 'Haz clic aquí para pegar el link del video de YouTube (Modo Admin)'
                          : 'Espacio para el video informativo sobre la Batería de Riesgo Psicosocial'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECCIÓN 1: ¿QUÉ ES LA BATERÍA DE RIESGO PSICOSOCIAL Y PARA QUÉ SIRVE?
         ========================================================================== */}
      <section id="que-es" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Fundamento Conceptual y Legal en Colombia
            </span>
            <h2 className="display">
              ¿Qué es la Batería de Riesgo Psicosocial y para qué sirve?
            </h2>
            <p>
              Desarrollada por el Ministerio de la Protección Social (hoy Ministerio del Trabajo) junto con la
              Pontificia Universidad Javeriana, es el instrumento técnico oficial en Colombia para evaluar los factores
              psicosociales en el trabajo.
            </p>
          </div>

          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                Propósito Preventivo y de Salud Ocupacional
              </span>
              <h3>Identificar, evaluar y prevenir el impacto psicosocial en la salud del trabajador.</h3>
              <p>
                Los factores psicosociales comprenden las interacciones entre el trabajo, el medio ambiente laboral, la
                satisfacción en el cargo y las condiciones de la organización, por una parte, y por la otra, las
                capacidades del trabajador, sus necesidades, su cultura y su situación personal fuera del trabajo.
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>¿Para qué sirve en la empresa?:</strong> Permite identificar qué áreas, procesos o cargos están expuestos a sobrecarga mental, desgaste emocional, problemas de liderazgo o desbalance vida-trabajo para intervenirlos a tiempo.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>¿Para qué le sirve al trabajador?:</strong> Protege su salud física y emocional previniendo enfermedades derivadas del estrés laboral (como Síndrome de Burnout, trastornos del sueño, ansiedad, depresión, hipertensión o afecciones gastrointestinales).
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Identificación de Factores Protectores:</strong> No solo detecta riesgos; también visibiliza las fortalezas de la organización (buen clima laboral, apoyo social, estabilidad y reconocimiento) para potenciarlas.
                </li>
              </ul>
            </div>

            <div className="feat-art tint-sky">
              <div style={{ width: '100%', maxWidth: 390, background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🎯</span> Objetivos Clave de la Batería
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D' }}>
                    SALUD MENTAL
                  </span>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      title: '1. Diagnóstico Científico y Objetivo',
                      desc: 'Establece con baremos validados en población trabajadora colombiana el nivel real de riesgo (Sin Riesgo, Bajo, Medio, Alto o Muy Alto).',
                      pill: 'Validado en Colombia',
                      color: '#0D9488',
                      bg: '#F0FDFA',
                    },
                    {
                      title: '2. Prevención del Estrés y Burnout',
                      desc: 'Detecta a tiempo síntomas fisiológicos, psicoemocionales y cognitivos antes de que se conviertan en patologías crónicas.',
                      pill: 'Prevención Primaria',
                      color: '#2563EB',
                      bg: '#EFF6FF',
                    },
                    {
                      title: '3. Mejora del Liderazgo y Clima Laboral',
                      desc: 'Orienta planes de formación en comunicación asertiva, claridad de rol, distribución equitativa de cargas y trabajo en equipo.',
                      pill: 'Bienestar Colectivo',
                      color: '#D97706',
                      bg: '#FFFBEB',
                    },
                    {
                      title: '4. Vigilancia Epidemiológica (SVE)',
                      desc: 'Sirve como base técnica obligatoria para activar el Sistema de Vigilancia Epidemiológica en Riesgo Psicosocial.',
                      pill: 'Res. 2646 y 2764',
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
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>{item.title}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: item.color, background: '#fff', padding: '2px 6px', borderRadius: 9999 }}>
                          {item.pill}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.38 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          BENTO GRID: LOS 4 INSTRUMENTOS QUE COMPONEN LA BATERÍA Y SUS BAREMOS
         ========================================================================== */}
      <section id="instrumentos" className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Resolución 2764 de 2022 · Estructura de los Cuestionarios
            </span>
            <h2 className="display">
              ¿Cuáles son los instrumentos que componen la Batería?
            </h2>
            <p>
              Durante la aplicación de la Batería de Riesgo Psicosocial, cada trabajador diligencia una Ficha de Datos
              Generales y tres cuestionarios específicos según el perfil de su cargo.
            </p>
          </div>

          <div className="bento">
            {/* Big Cell: Niveles de Riesgo, Periodicidad y Reglas de Aplicación */}
            <div className="cell big">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#10B981', display: 'inline-block' }}></span>
                    <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', fontWeight: 800 }}>
                      Marco Legal · Resolución 2646 de 2008 & Resolución 2764 de 2022
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Normativa Colombiana
                  </span>
                </div>

                {/* Resumen de Custodia y Psicólogo Especialista */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 18, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 84, height: 84, transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="15" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: '#34D399', lineHeight: 1 }}>5</span>
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>NIVELES</span>
                      <span style={{ fontSize: 7, fontWeight: 900, background: '#10B981', color: '#062B16', padding: '1px 5px', borderRadius: 9999, marginTop: 2 }}>BAREMO</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                      Aplicación exclusiva por Psicólogo Especialista en SST
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
                      Con posgrado en Seguridad y Salud en el Trabajo y Licencia SST vigente
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 4, lineHeight: 1.4 }}>
                      Las respuestas individuales de cada trabajador están protegidas bajo Reserva de Historia Clínica
                      Ocupacional (Ley 1090 de 2006 y Resolución 2346 de 2007). La empresa solo recibe el informe
                      epidemiológico general y colectivo por áreas.
                    </div>
                  </div>
                </div>
              </div>

              {/* Semáforo de los 5 Niveles de Riesgo y Periodicidad */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></span>
                    Clasificación de Resultados y Periodicidad Legal (Art. 3 · Res. 2764 de 2022)
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 9999 }}>
                    Semáforo Epidemiológico
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Nivel Alto / Muy Alto -> Anual */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.10)', border: '1px solid rgba(248, 113, 113, 0.30)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 68, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#F87171', lineHeight: 1 }}>ANUAL</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>CADA 1 AÑO</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🔴</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Riesgo Alto o Muy Alto</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(239, 68, 68, 0.25)', color: '#FECACA', textTransform: 'uppercase' }}>
                          Intervención Inmediata
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}>
                        Tiene alta probabilidad de asociarse a respuestas muy altas de estrés. Exige intervención inmediata en el marco de un Sistema de Vigilancia Epidemiológica (SVE) y evaluación cada año.
                      </div>
                    </div>
                  </div>

                  {/* Nivel Medio -> Bianual */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.10)', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 68, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#FBBF24', lineHeight: 1 }}>BIANUAL</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>CADA 2 AÑOS</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🟡</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Riesgo Medio</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(245, 158, 11, 0.2)', color: '#FDE68A', textTransform: 'uppercase' }}>
                          Prevención y Monitoreo
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}>
                        Se esperaría una respuesta de estrés moderada. Las dimensiones en este nivel ameritan observación y acciones sistemáticas de intervención para prevenir efectos perjudiciales.
                      </div>
                    </div>
                  </div>

                  {/* Nivel Bajo / Sin Riesgo -> Bianual */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.10)', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 68, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#34D399', lineHeight: 1 }}>BIANUAL</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>CADA 2 AÑOS</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🟢</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Riesgo Bajo o Sin Riesgo (Despreciable)</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0', textTransform: 'uppercase' }}>
                          Factor Protector
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}>
                        No se espera que los factores psicosociales estén relacionados con síntomas significativos de estrés. Son objeto de programas de promoción y mantenimiento del bienestar.
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: 10, textAlign: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                      ✓ Todos los cuestionarios requieren firma previa de Consentimiento Informado libre y voluntario
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
                  1. Cuestionario Intralaboral Forma A
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Se aplica a trabajadores con cargos de <strong>jefatura, dirección, coordinación, profesionales o técnicos</strong>.
                  Evalúa las condiciones propias del trabajo incluyendo las exigencias de responsabilidad por resultados,
                  información confidencial y la relación con los colaboradores (subordinados).
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#0369A1' }}>
                ✓ Evalúa 4 Dominios y 19 Dimensiones
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
                  2. Cuestionario Intralaboral Forma B
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Se aplica a personas con cargos <strong>auxiliares, asistenciales y operarios</strong>, cuyas funciones
                  siguen procedimientos o instrucciones definidas y no tienen personal a cargo. Evalúa demandas físicas,
                  ambientales, cuantitativas, control, liderazgo y recompensas.
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                ✓ Evalúa 4 Dominios y 16 Dimensiones
              </div>
            </div>

            {/* Cell 3: Cuestionario de Factores Extralaborales */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🏡
                  </span>
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    31 Preguntas
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  3. Cuestionario Extralaboral
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  Común para todos los cargos. Evalúa <strong>7 dimensiones fuera del ámbito laboral</strong>: tiempo fuera
                  del trabajo, relaciones familiares, comunicación interpersonal, situación económica del grupo familiar,
                  características de la vivienda, influencia del entorno en el trabajo y desplazamiento vivienda-trabajo-vivienda.
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                ✓ 7 Dimensiones del entorno familiar y social
              </div>
            </div>

            {/* Cell 4: Evaluación del Estrés y Ficha de Datos Generales */}
            <div className="cell lime" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14, 19, 0, 0.1)', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    ❤️‍🩹
                  </span>
                  <span style={{ background: 'rgba(14, 19, 0, 0.12)', color: '#0E1300', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    31 Ítems + Ficha
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0E1300', lineHeight: 1.25, marginBottom: 8 }}>
                  4. Evaluación del Estrés + Ficha General
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(14, 19, 0, 0.76)', lineHeight: 1.5, fontWeight: 500 }}>
                  El <strong>Cuestionario de Estrés (3ª versión)</strong> mide la frecuencia de síntomas fisiológicos,
                  sociales, intelectuales y psicoemocionales en los últimos 3 meses. Se acompaña de la{' '}
                  <strong>Ficha de Datos Generales</strong> (datos sociodemográficos como edad, estado civil, escolaridad,
                  personas a cargo, tipo de contrato y antigüedad).
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(14, 19, 0, 0.15)', fontSize: 11, fontWeight: 800, color: '#0E1300' }}>
                ⚡ Visión integral de síntomas y perfil demográfico
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECCIÓN 2: LOS 4 DOMINIOS Y 19 DIMENSIONES INTRALABORALES EXPLICADOS AL DETALLE
         ========================================================================== */}
      <section id="dominios" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Análisis Profundo del Trabajo · Condiciones Intralaborales
            </span>
            <h2 className="display">
              ¿Qué evalúan los 4 Dominios Intralaborales de la Batería?
            </h2>
            <p>
              Las condiciones intralaborales son aquellas características del trabajo y de la organización que influyen
              en la salud y bienestar del individuo. La Batería las agrupa en 4 grandes dominios y 19 dimensiones:
            </p>
          </div>

          <div className="feat rev">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                4 Dominios · 19 Dimensiones (Forma A) / 16 Dimensiones (Forma B)
              </span>
              <h3>Comprende qué mide cada dominio dentro de tu organización.</h3>
              <p>
                Cuando respondes las preguntas del cuestionario intralaboral (con opciones: Siempre, Casi siempre,
                Algunas veces, Casi nunca o Nunca), el instrumento analiza cuatro pilares fundamentales de tu experiencia
                diaria en el trabajo:
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Dominio 1 · Liderazgo y Relaciones Sociales en el Trabajo:</strong> Evalúa cómo los jefes planifican, comunican y apoyan al trabajador; la cohesión y trabajo en equipo entre compañeros; la retroalimentación del desempeño y (en Forma A) la relación con los subordinados.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Dominio 2 · Control sobre el Trabajo:</strong> Analiza si el trabajador tiene claridad sobre sus funciones (claridad de rol), si recibe capacitación pertinente, si participa en los cambios, si el cargo aprovecha sus habilidades y qué margen de autonomía tiene para tomar decisiones.
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>Dominio 3 · Demandas del Trabajo y Dominio 4 · Recompensas:</strong> Mide el volumen y ritmo de tareas (demandas cuantitativas), la exigencia de atención y memoria (carga mental), la exposición a emociones de otros (demandas emocionales), el esfuerzo físico/ambiental, las pausas y jornadas; así como el sentimiento de pertenencia, estabilidad y reconocimiento recibido.
                </li>
              </ul>
            </div>

            <div className="feat-art tint-lav">
              <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📊</span> Las 19 Dimensiones por Dominio
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#F3E8FF', color: '#6B21A8' }}>
                    ESTRUCTURA OFICIAL
                  </span>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      dom: '1. Liderazgo y Relaciones Sociales (4 Dimensiones)',
                      dims: '• Características del liderazgo • Relaciones sociales en el trabajo • Retroalimentación del desempeño • Relación con los colaboradores (solo Forma A).',
                      badge: '4 Dimensiones',
                      color: '#0D9488',
                      bg: '#F0FDFA',
                    },
                    {
                      dom: '2. Control sobre el Trabajo (5 Dimensiones)',
                      dims: '• Claridad de rol • Capacitación • Participación y manejo del cambio • Oportunidades para el uso y desarrollo de habilidades • Control y autonomía sobre el trabajo.',
                      badge: '5 Dimensiones',
                      color: '#2563EB',
                      bg: '#EFF6FF',
                    },
                    {
                      dom: '3. Demandas del Trabajo (8 Dimensiones)',
                      dims: '• Ambientales y esfuerzo físico • Emocionales • Cuantitativas • Influencia del trabajo sobre el entorno extralaboral • Exigencias de responsabilidad del cargo (Forma A) • Carga mental • Consistencia del rol (Forma A) • Demandas de la jornada de trabajo.',
                      badge: '8 Dimensiones',
                      color: '#D97706',
                      bg: '#FFFBEB',
                    },
                    {
                      dom: '4. Recompensas (2 Dimensiones)',
                      dims: '• Recompensas derivadas de la pertenencia a la organización y del trabajo que se realiza • Reconocimiento y compensación.',
                      badge: '2 Dimensiones',
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
                          {item.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.4 }}>{item.dims}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECCIÓN 3: ¿CÓMO SE APLICA LA BATERÍA Y QUÉ PASA DESPUÉS? (ESTILO 3 TARJETAS CIELO)
         ========================================================================== */}
      <section id="aplicacion" className="band" style={{ background: 'var(--sky)', overflow: 'hidden', position: 'relative' }}>
        <div className="cloud" style={{ top: 40, left: -40, width: 240, height: 100 }}></div>
        <div className="cloud" style={{ bottom: 40, right: -30, width: 220, height: 90 }}></div>

        <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className="sec-head" style={{ marginBottom: 40 }}>
            <span className="eyebrow">
              <span className="dot"></span>
              Proceso Paso a Paso · Antes, Durante y Después de la Evaluación
            </span>
            <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
              ¿Cómo se aplica la Batería de Riesgo Psicosocial?
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.68)', maxWidth: 680, margin: '14px auto 0' }}>
              La aplicación sigue un protocolo técnico y ético estricto establecido por el Ministerio del Trabajo para
              garantizar la tranquilidad del trabajador, la validez de las respuestas y la efectividad de los planes de
              intervención:
            </p>
          </div>

          <div className="app-phones">
            {/* Etapa 1: Antes y Consentimiento Informado */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>1️⃣</span> Fase 1 · Sensibilización y Consentimiento
              </div>
              <div className="phone" style={{ width: 270, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#090D16', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0D9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          📝
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Antes de Iniciar</div>
                          <div style={{ fontSize: 9.5, color: '#5EEAD4', fontWeight: 600 }}>Garantías del Trabajador</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' }}>
                        PASO 1
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0F172A', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#C7F303', marginBottom: 4 }}>
                          ✓ Socialización Previa
                        </div>
                        <div style={{ fontSize: 9.5, color: '#E2E8F0', lineHeight: 1.4 }}>
                          El psicólogo especialista explica el objetivo preventivo de la evaluación y resuelve todas las inquietudes de los trabajadores.
                        </div>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: 12, padding: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#34D399', marginBottom: 4 }}>
                          ✓ Consentimiento Informado
                        </div>
                        <div style={{ fontSize: 9.5, color: '#E2E8F0', lineHeight: 1.4 }}>
                          La participación es libre y voluntaria. Ningún cuestionario puede aplicarse sin la firma previa del Consentimiento Informado (Ley 1090 de 2006).
                        </div>
                      </div>

                      <div style={{ background: 'rgba(56, 189, 248, 0.12)', borderRadius: 12, padding: 10, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#38BDF8', marginBottom: 4 }}>
                          ✓ Reserva de Historia Clínica
                        </div>
                        <div style={{ fontSize: 9.5, color: '#E2E8F0', lineHeight: 1.4 }}>
                          Tus respuestas individuales nunca se entregan a jefes ni a Recursos Humanos; quedan bajo custodia exclusiva del psicólogo especialista.
                        </div>
                      </div>
                    </div>

                    <span style={{ height: 34, width: '100%', borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800 }}>
                      🔒 Secreto Profesional Garantizado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Etapa 2: Durante el Diligenciamiento */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>2️⃣</span> Fase 2 · Diligenciamiento de Cuestionarios
              </div>
              <div className="phone" style={{ width: 270, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 }}>
                          ✍️
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Durante la Prueba</div>
                          <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Recomendaciones Prácticas</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(199, 243, 3, 0.2)', color: '#C7F303' }}>
                        PASO 2
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 11, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: '#fff', borderRadius: 12, padding: 10, fontSize: 10.5, lineHeight: 1.4, color: '#1E293B', border: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#0F172A', display: 'block', marginBottom: 3 }}>📋 No hay respuestas buenas ni malas</strong>
                        Responde con total sinceridad pensando en tu realidad de los últimos meses en tu puesto de trabajo actual.
                      </div>

                      <div style={{ background: '#fff', borderRadius: 12, padding: 10, fontSize: 10.5, lineHeight: 1.4, color: '#1E293B', border: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#0F172A', display: 'block', marginBottom: 3 }}>⏱️ Duración aproximada (30 a 45 min)</strong>
                        Se realiza dentro de la jornada laboral, en un espacio tranquilo, cómodo, iluminado y libre de interrupciones.
                      </div>

                      <div style={{ background: '#fff', borderRadius: 12, padding: 10, fontSize: 10.5, lineHeight: 1.4, color: '#1E293B', border: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#0F172A', display: 'block', marginBottom: 3 }}>✅ Marca una sola opción por pregunta</strong>
                        Escala tipo Likert: <em>Siempre, Casi siempre, Algunas veces, Casi nunca, Nunca</em>. No dejes preguntas en blanco para que el baremo sea válido.
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#0E1300', color: '#C7F303', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontWeight: 800 }}>
                        🧑‍⚕️ Acompañamiento del Psicólogo SST
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Etapa 3: Después de la Evaluación (Intervención y SVE) */}
            <div className="phone-wrap">
              <div className="phone-label">
                <span>3️⃣</span> Fase 3 · Resultados Colectivos e Intervención
              </div>
              <div className="phone" style={{ width: 270, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                          📈
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>¿Qué pasa después?</div>
                          <div style={{ fontSize: 9.5, color: '#93C5FD' }}>Acciones de Mejoramiento</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD' }}>
                        PASO 3
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 11, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>📊 Informe Diagnóstico General</div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#DBEAFE', color: '#1E40AF' }}>
                            Colectivo
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B', lineHeight: 1.38 }}>
                          El psicólogo consolida estadísticas grupales por áreas y cargos sin revelar nombres ni respuestas individuales.
                        </div>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>🩺 Vigilancia Epidemiológica (SVE)</div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#FEF3C7', color: '#B45309' }}>
                            Riesgo Alto
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B', lineHeight: 1.38 }}>
                          Se diseñan planes de intervención sobre las dimensiones con riesgo alto o muy alto usando los Protocolos Oficiales del Ministerio.
                        </div>
                      </div>

                      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>🌱 Promoción y Bienestar</div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D' }}>
                            Continuo
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B', lineHeight: 1.38 }}>
                          Talleres de manejo del estrés, fortalecimiento del liderazgo, equilibrio vida-trabajo, pausas activas y convivencia laboral.
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontWeight: 800 }}>
                        ✨ Entornos de Trabajo Saludables
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
          FAQ: PREGUNTAS FRECUENTES SOBRE LA BATERÍA DE RIESGO PSICOSOCIAL
         ========================================================================== */}
      <section id="faq" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              Resolvemos todas tus dudas sobre la Evaluación
            </span>
            <h2 className="display">Preguntas Frecuentes sobre la Batería de Riesgo Psicosocial</h2>
            <p>
              Respuestas claras basadas en la Resolución 2646 de 2008 y la Resolución 2764 de 2022 del Ministerio del
              Trabajo de Colombia.
            </p>
          </div>

          <div className="faq">
            {[
              {
                q: '¿Mis respuestas en la Batería de Riesgo Psicosocial las puede ver mi jefe o Recursos Humanos?',
                a: 'No. Por mandato legal (Resolución 2646 de 2008, Resolución 2346 de 2007 y Ley 1090 de 2006), la evaluación individual hace parte de la Historia Clínica Ocupacional y goza de estricta reserva profesional. Solo el Psicólogo Especialista en SST con licencia vigente tiene acceso a tus cuestionarios individuales. La empresa únicamente recibe un informe general con estadísticas globales por áreas o grupos de cargos.',
              },
              {
                q: '¿La Batería de Riesgo Psicosocial es una prueba psicológica de personalidad o de desempeño laboral?',
                a: 'No. La Batería NO evalúa tu desempeño, ni tu capacidad intelectual, ni califica si eres un "buen o mal trabajador", ni tiene relación con procesos de despido. Su único propósito es evaluar las condiciones del trabajo (carga, horarios, liderazgo, claridad del rol, ambiente) y del entorno para proteger tu salud física y mental.',
              },
              {
                q: '¿Por qué a unos compañeros les entregan la Forma A y a otros la Forma B?',
                a: 'Porque las exigencias varían según el tipo de cargo. La Forma A (123 preguntas) se aplica a personas en cargos de dirección, jefatura, profesionales o técnicos que suelen tener personal a cargo o alta autonomía decisoria. La Forma B (97 preguntas) está diseñada para cargos auxiliares, asistenciales y operativos.',
              },
              {
                q: '¿Por qué la Batería incluye preguntas sobre mi familia, mi vivienda y el transporte (Cuestionario Extralaboral)?',
                a: 'Porque el ser humano es integral: las condiciones fuera del trabajo (como el tiempo de desplazamiento entre la casa y el trabajo, las responsabilidades familiares, el descanso o la situación económica) interactúan con las exigencias laborales y pueden aumentar o disminuir los niveles de fatiga y estrés. Conocer estas tendencias a nivel grupal permite a la empresa crear programas de bienestar familiar, convenios y flexibilidad.',
              },
              {
                q: '¿Quién es el único profesional autorizado en Colombia para aplicar la Batería?',
                a: 'De acuerdo con la Resolución 2646 de 2008 y la Resolución 2764 de 2022, la aplicación, calificación, interpretación y custodia de la Batería debe ser realizada exclusivamente por un Psicólogo con posgrado en Seguridad y Salud en el Trabajo (o Salud Ocupacional) y con Licencia en SST vigente expedida por la Secretaría de Salud.',
              },
              {
                q: '¿Cada cuánto tiempo se debe aplicar la Batería en las empresas (Anual o Bianual)?',
                a: 'Según el Artículo 3 de la Resolución 2764 de 2022: la evaluación es ANUAL (cada año) para las empresas cuyos resultados intralaborales generales se ubiquen en nivel de riesgo Alto o Muy Alto. Es BIANUAL (cada 2 años) cuando el nivel de riesgo intralaboral general sea Medio, Bajo o Sin Riesgo.',
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

      {/* Final Banner Informativo */}
      <section className="final">
        <span className="trial" style={{ marginBottom: 18 }}>
          <span className="tdot"></span>
          Promoción de la Salud Mental · Resolución 2764 de 2022
        </span>
        <h2>Tu participación sincera construye un entorno laboral más sano.</h2>
        <p>
          La Batería de Riesgo Psicosocial es el primer paso para transformar las condiciones de trabajo, fortalecer el
          liderazgo y cuidar la salud emocional y familiar de todos los colaboradores.
        </p>
        <div className="hero-cta" style={{ marginTop: 28 }}>
          <a
            href="#video"
            onClick={(e) => scrollToSection(e, 'video')}
            className="btn btn-primary"
          >
            Ver video informativo
            <span className="pip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </span>
          </a>
          <a
            href="#instrumentos"
            onClick={(e) => scrollToSection(e, 'instrumentos')}
            className="btn btn-glass"
          >
            Repasar los 4 cuestionarios
          </a>
        </div>
      </section>

      {/* Footer con el estilo de la Home Page */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }}></div>
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }}></div>

        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                  WAPPY<span style={{ color: '#16a34a' }}>IA</span>
                </span>
              </div>
              <p className="foot-desc">
                Guía pedagógica e informativa sobre la Batería de Instrumentos para la Evaluación de Factores de Riesgo
                Psicosocial en Colombia (Resolución 2646 de 2008 y Resolución 2764 de 2022 del Ministerio del Trabajo).
              </p>
            </div>
          </div>

          <div className="foot-word">WAPPY</div>

          <div className="foot-bottom">
            <span>© 2026 WAPPY LTDA · NIT 901437310-3 · Medellín, Colombia. Todos los derechos reservados.</span>
            <div className="foot-legal">
              <a
                href="/ login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                title="Acceso Administrador WAPPY"
              >
                Acceso Admin
              </a>
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
                Título del encabezado del video
              </label>
              <input
                className="fld"
                type="text"
                placeholder="Ej: ¿Qué es la Batería de Riesgo Psicosocial, para qué sirve y cómo se aplica?"
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
                  ⚠️ No se detectó un ID válido de YouTube. Asegúrate de pegar un enlace como{' '}
                  <code>https://www.youtube.com/watch?v=XXXXXXXXXXX</code> o <code>https://youtu.be/XXXXXXXXXXX</code>.
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-glass"
                  style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--line)' }}
                  onClick={() => setIsAdminModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? 'Guardando...' : 'Guardar y Publicar Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
