import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import TenshiAvatar from '~/components/Tenshi/TenshiAvatar';
import './marketing.css';

interface WappyAppCardItem {
  id: string;
  badge: string;
  badgeTone: 'active' | 'soon';
  title: string;
  subtitle: string;
  description: string;
  normative: string;
  image?: string;
  icon: string;
  tags: string[];
  href?: string;
  ctaLabel: string;
}

export default function WappyPortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAppsRoute =
    location.pathname.includes('wappy-apps') ||
    location.pathname === '/apps' ||
    searchParams.get('view') === 'apps';

  const [view, setView] = useState<'hub' | 'apps'>(isAppsRoute ? 'apps' : 'hub');
  const [hoveredCard, setHoveredCard] = useState<'ia' | 'apps' | null>(null);

  useEffect(() => {
    const nextView =
      location.pathname.includes('wappy-apps') ||
      location.pathname === '/apps' ||
      searchParams.get('view') === 'apps'
        ? 'apps'
        : 'hub';
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, searchParams]);

  const getRefQuery = () => {
    try {
      const sp = new URLSearchParams(location.search || window.location.search);
      const urlRef = (sp.get('ref') || sp.get('referral') || sp.get('r') || '').trim();
      const storedRef = (
        localStorage.getItem('wappy_ref') ||
        sessionStorage.getItem('wappy_ref') ||
        ''
      ).trim();
      const refToUse = urlRef || storedRef;
      if (refToUse) {
        return `?ref=${encodeURIComponent(refToUse)}`;
      }
    } catch (e) {}
    return '';
  };

  const handleGoToWappyIA = () => {
    const refQuery = getRefQuery();
    navigate(`/login${refQuery}`);
  };

  const handleOpenWappyApps = () => {
    setView('apps');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', 'apps');
    setSearchParams(nextParams);
  };

  const handleBackToHub = () => {
    if (location.pathname.includes('wappy-apps') || location.pathname === '/apps') {
      navigate(`/portal${getRefQuery()}`);
      return;
    }
    setView('hub');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('view');
    setSearchParams(nextParams);
  };

  const handleOpenMatrizIpvr = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'wappy.club' || window.location.hostname.endsWith('.wappy.club'))
    ) {
      window.location.href = 'https://wappy.club/matrizipvr';
    } else {
      window.location.href = '/matrizipvr';
    }
  };

  const wappyAppsCatalog: WappyAppCardItem[] = [
    {
      id: 'matriz-ipvr',
      badge: 'DISPONIBLE AHORA · APP INTERACTIVA',
      badgeTone: 'active',
      title: 'APP de Matriz IPVR',
      subtitle: 'Identificación de Peligros, Evaluación y Valoración de Riesgos · GTC 45',
      description:
        'Aplicativo completo para construir, evaluar y auditar tu Matriz IPEVR bajo la metodología GTC 45. Incluye sugerencias automáticas con IA (Google Gemini), Dashboard de analítica con mapa de calor e Informe Gerencial en formato A4 listo para imprimir o exportar.',
      normative: 'GTC 45 · Decreto 1072 de 2015',
      image: '/marketing/marketplace-matriz-ipvr-card-horizontal.png',
      icon: '📊',
      tags: [
        'Matriz GTC 45 en Vivo',
        'Controles con IA Gemini',
        'Gráficas & Mapa de Calor',
        'Informe Gerencial A4',
      ],
      href: 'https://wappy.club/matrizipvr',
      ctaLabel: 'Ingresar a APP Matriz IPVR',
    },
    {
      id: 'diagnostico-0312',
      badge: 'PRÓXIMAMENTE EN WAPPY APPs',
      badgeTone: 'soon',
      title: 'APP Autoevaluación Res. 0312',
      subtitle: 'Diagnóstico Interactivo de Estándares Mínimos SG-SST (7, 21 y 60 Estándares)',
      description:
        'Calculadora normativa inteligente que clasifica tu empresa según número de trabajadores y nivel de riesgo ARL, evalúa el cumplimiento del ciclo PHVA y genera el Plan de Mejoramiento automático.',
      normative: 'Resolución 0312 de 2019 · Art. 27-28',
      icon: '🛡️',
      tags: ['7, 21 o 60 Estándares', 'Plan de Mejora IA', 'Puntaje Ponderado', 'Reporte Oficial'],
      ctaLabel: 'Próximamente disponible',
    },
    {
      id: 'matriz-quimica-sga',
      badge: 'PRÓXIMAMENTE EN WAPPY APPs',
      badgeTone: 'soon',
      title: 'APP Compatibilidad Química SGA',
      subtitle: 'Inventario de Sustancias, Pictogramas SGA y Matriz de Almacenamiento Seguro',
      description:
        'Valida al instante la compatibilidad de almacenamiento de tus productos químicos según el Sistema Globalmente Armonizado (SGA), extrae datos de Fichas de Seguridad (FDS) y genera etiquetas normativas.',
      normative: 'Decreto 1496 de 2018 · Res. 773 de 2021',
      icon: '🧪',
      tags: ['Cruce SGA en Vivo', 'Pictogramas Oficiales', 'Alertas de Reacción', 'Etiquetado SGA'],
      ctaLabel: 'Próximamente disponible',
    },
  ];

  return (
    <div className="mkt wappy-portal-page">
      <style>{`
        .wappy-portal-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 18% 12%, rgba(91, 184, 245, 0.35) 0%, rgba(91, 184, 245, 0) 48%),
            radial-gradient(circle at 82% 18%, rgba(199, 243, 3, 0.22) 0%, rgba(199, 243, 3, 0) 45%),
            linear-gradient(180deg, #dff1fd 0%, #f1f8fe 32%, #f6f7f9 100%);
        }

        @keyframes portal-halo-float {
          0%, 100% {
            transform: translateX(-50%) rotateX(68deg) translateY(0px) scale(1);
            box-shadow: 0 0 26px rgba(250, 204, 21, 0.95), 0 0 50px rgba(250, 204, 21, 0.55), inset 0 0 12px rgba(254, 240, 138, 0.85);
          }
          50% {
            transform: translateX(-50%) rotateX(68deg) translateY(-6px) scale(1.08);
            box-shadow: 0 0 36px rgba(253, 224, 71, 1), 0 0 68px rgba(199, 243, 3, 0.65), inset 0 0 16px rgba(255, 255, 255, 0.95);
          }
        }

        @keyframes felix-avatar-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-7px) scale(1.018);
          }
        }

        @keyframes portal-badge-bob {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .portal-main-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 28px;
          inline-size: 100%;
          max-inline-size: 1080px;
          margin-inline: auto;
        }

        .portal-choice-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 30px;
          border: 2px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 50px -15px rgba(15, 23, 42, 0.12);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease;
        }

        .portal-choice-card:hover {
          transform: translateY(-8px);
        }

        .portal-choice-card.card-ia:hover {
          border-color: #10b981;
          box-shadow: 0 28px 65px -12px rgba(16, 185, 129, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.28);
        }

        .portal-choice-card.card-apps:hover {
          border-color: #f59e0b;
          box-shadow: 0 28px 65px -12px rgba(245, 158, 11, 0.26), 0 0 0 4px rgba(251, 191, 36, 0.24);
        }

        .portal-stage {
          position: relative;
          block-size: 310px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 20px;
        }

        .portal-stage-ia {
          background:
            radial-gradient(circle at 50% 32%, rgba(250, 204, 21, 0.24) 0%, rgba(16, 185, 129, 0.22) 36%, rgba(6, 20, 17, 0) 72%),
            linear-gradient(145deg, #041310 0%, #092620 52%, #0e1300 100%);
        }

        .portal-stage-apps {
          background:
            radial-gradient(circle at 50% 42%, rgba(251, 191, 36, 0.28) 0%, rgba(14, 165, 233, 0.2) 42%, rgba(15, 23, 42, 0) 74%),
            linear-gradient(145deg, #0b192c 0%, #102a43 52%, #1e293b 100%);
        }

        .portal-stage-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .felix-avatar-wrapper {
          position: relative;
          z-index: 20;
          height: 268px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: felix-avatar-float 3.4s ease-in-out infinite;
          filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.45));
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .portal-choice-card.card-apps:hover .felix-avatar-wrapper {
          transform: scale(1.06) translateY(-4px);
        }

        .portal-apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
          gap: 24px;
          inline-size: 100%;
          max-inline-size: 1120px;
          margin-inline: auto;
        }

        .app-item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff;
          border-radius: 26px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.25s ease;
          box-shadow: 0 14px 34px -12px rgba(15, 23, 42, 0.08);
        }

        .app-item-card.is-active {
          border-color: rgba(13, 148, 136, 0.45);
          box-shadow: 0 20px 45px -12px rgba(13, 148, 136, 0.18);
          cursor: pointer;
        }

        .app-item-card.is-active:hover {
          transform: translateY(-6px);
          border-color: #0d9488;
          box-shadow: 0 26px 55px -12px rgba(13, 148, 136, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.3);
        }

        .app-item-card.is-soon {
          opacity: 0.9;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
      `}</style>

      {/* Top Capsule Navbar */}
      <nav className="mkt-nav" aria-label="Navegación Portal WAPPY">
        <div className="mkt-nav-inner scrolled" style={{ maxWidth: 1120 }}>
          <a
            className="mkt-nav-logo"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${getRefQuery()}`);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {view === 'apps' ? (
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={handleBackToHub}
                style={{ border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                ← Volver a Wappy IA / APPs
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => navigate(`/${getRefQuery()}`)}
                style={{ border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                ← Volver al inicio
              </button>
            )}

            <button
              type="button"
              className="btn btn-lime btn-sm"
              onClick={handleGoToWappyIA}
              style={{ fontWeight: 800 }}
            >
              Iniciar Sesión IA
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main
        className="wrap"
        style={{
          flex: 1,
          paddingTop: 136,
          paddingBottom: 72,
          width: '100%',
        }}
      >
        {view === 'hub' ? (
          <>
            {/* Header Section */}
            <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 38px' }}>
              <span className="trial" style={{ marginBottom: 16 }}>
                <span className="tdot"></span>
                PORTAL DE ACCESO OFICIAL · ECOSISTEMA WAPPY
              </span>
              <h1
                className="display"
                style={{
                  fontSize: 'clamp(30px, 4.5vw, 50px)',
                  fontWeight: 800,
                  color: '#0e1300',
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  margin: '0 0 14px',
                }}
              >
                ¿A dónde deseas ingresar hoy?
              </h1>
              <p
                style={{
                  fontSize: 'clamp(15px, 1.8vw, 17.5px)',
                  color: '#475569',
                  lineHeight: 1.55,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Selecciona entre nuestra plataforma central de Inteligencia Artificial con{' '}
                <strong style={{ color: '#0f172a' }}>Tenshi IA</strong> o nuestra suite de
                aplicaciones interactivas directas en{' '}
                <strong style={{ color: '#0f172a' }}>Wappy APPs</strong>.
              </p>
            </div>

            {/* Two Master Selection Cards: Wappy IA & Wappy APPs */}
            <div className="portal-main-grid">
              {/* ============================================================
                  TARJETA 1: WAPPY IA (Tenshi con su Aureola Celestial)
                 ============================================================ */}
              <article
                className="portal-choice-card card-ia"
                onMouseEnter={() => setHoveredCard('ia')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={handleGoToWappyIA}
                role="button"
                tabIndex={0}
                aria-label="Ingresar a Wappy IA - Ir al Login"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToWappyIA();
                  }
                }}
              >
                {/* Stage Visual Superior con Tenshi y su Aureola */}
                <div className="portal-stage portal-stage-ia">
                  <div className="portal-stage-grid" />

                  {/* Badge Flotante Izquierdo */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 18,
                      zIndex: 30,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      background: 'rgba(16, 185, 129, 0.18)',
                      border: '1px solid rgba(52, 211, 153, 0.45)',
                      color: '#a7f3d0',
                      fontSize: 11,
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)',
                      animation: 'portal-badge-bob 3.2s ease-in-out infinite',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#c7f303',
                        boxShadow: '0 0 8px #c7f303',
                      }}
                    />
                    ORQUESTADOR IA 24/7
                  </div>

                  {/* Badge Flotante Derecho */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 18,
                      zIndex: 30,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      background: 'rgba(250, 204, 21, 0.16)',
                      border: '1px solid rgba(250, 204, 21, 0.5)',
                      color: '#fef08a',
                      fontSize: 11,
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    😇 Tenshi + +20 Agentes
                  </div>

                  {/* Contenedor Central de Tenshi con su Única Aureola Celestial Sincronizada */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingTop: 14,
                    }}
                  >
                    <TenshiAvatar
                      size={225}
                      mood="idle"
                      showHaloEffect={true}
                      showHUD={true}
                      interactive={false}
                    />
                  </div>

                  {/* Pedestal de Luz Inferior */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 180,
                      height: 22,
                      borderRadius: '50%',
                      background:
                        'radial-gradient(ellipse at center, rgba(199, 243, 3, 0.45) 0%, rgba(16, 185, 129, 0) 75%)',
                      filter: 'blur(6px)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Cuerpo de la Tarjeta Wappy IA */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '26px 28px 28px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#0d9488',
                        marginBottom: 8,
                      }}
                    >
                      <span>✨ PLATAFORMA CENTRAL SG-SST</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <h2
                        className="display"
                        style={{
                          fontSize: 32,
                          fontWeight: 900,
                          color: '#0e1300',
                          margin: 0,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Wappy <span style={{ color: '#16a34a' }}>IA</span>
                      </h2>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        Acceso a Cuenta / Login
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 14.5,
                        color: '#475569',
                        lineHeight: 1.55,
                        margin: '0 0 18px',
                      }}
                    >
                      Ingresa al ecosistema completo del SG-SST liderado por{' '}
                      <strong style={{ color: '#0f172a' }}>Tenshi IA</strong>. Gestiona los 8 Hitos
                      preventivos, Metodología del Bioindividuo, Comités QR, Academia LMS y consulta
                      en tiempo real a más de 20 especialistas autónomos.
                    </p>

                    {/* Chips de Características */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 24,
                      }}
                    >
                      {[
                        '🤖 +20 Agentes Especialistas SST',
                        '🧬 Metodología del Bioindividuo',
                        '🎙️ Voz en Vivo con Tenshi',
                        '🎓 Academia LMS & Comités QR',
                      ].map((chip) => (
                        <span
                          key={chip}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '5px 11px',
                            borderRadius: 10,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#1e293b',
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botón CTA Wappy IA */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToWappyIA();
                    }}
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      padding: '0 12px 0 24px',
                      height: 54,
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    <span>Ingresar a Wappy IA</span>
                    <span className="pip" style={{ width: 34, height: 34 }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0E1300"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                  </button>
                </div>
              </article>

              {/* ============================================================
                  TARJETA 2: WAPPY APPs (Avatar 3D de Félix)
                 ============================================================ */}
              <article
                className="portal-choice-card card-apps"
                onMouseEnter={() => setHoveredCard('apps')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={handleOpenWappyApps}
                role="button"
                tabIndex={0}
                aria-label="Ingresar a Wappy APPs - Ver tarjetas de aplicaciones"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenWappyApps();
                  }
                }}
              >
                {/* Stage Visual Superior con el Avatar 3D de Félix */}
                <div className="portal-stage portal-stage-apps">
                  <div className="portal-stage-grid" />

                  {/* Badge Flotante Izquierdo */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 18,
                      zIndex: 30,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.5)',
                      color: '#fde68a',
                      fontSize: 11,
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)',
                      animation: 'portal-badge-bob 3.5s ease-in-out infinite',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#fbbf24',
                        boxShadow: '0 0 8px #fbbf24',
                      }}
                    />
                    SUITE DE APLICATIVOS
                  </div>

                  {/* Badge Flotante Derecho */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 18,
                      zIndex: 30,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      background: 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#bae6fd',
                      fontSize: 11,
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    ⚡ Herramientas SST en Vivo
                  </div>

                  {/* Avatar 3D de Félix (Cuerpo Completo) */}
                  <div className="felix-avatar-wrapper">
                    <img
                      src="/assets/felix_avatar_3d.png"
                      alt="Avatar Wappy APPs"
                      style={{
                        height: '100%',
                        width: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        userSelect: 'none',
                      }}
                    />
                  </div>

                  {/* Pedestal de Luz Inferior Ámbar/Lima */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 180,
                      height: 22,
                      borderRadius: '50%',
                      background:
                        'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.5) 0%, rgba(14, 165, 233, 0) 75%)',
                      filter: 'blur(6px)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Cuerpo de la Tarjeta Wappy APPs */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '26px 28px 28px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#d97706',
                        marginBottom: 8,
                      }}
                    >
                      <span>🛠️ APLICACIONES INTERACTIVAS DE ACCESO DIRECTO</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <h2
                        className="display"
                        style={{
                          fontSize: 32,
                          fontWeight: 900,
                          color: '#0e1300',
                          margin: 0,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Wappy <span style={{ color: '#d97706' }}>APPs</span>
                      </h2>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          background: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                        }}
                      >
                        Catálogo de Apps
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 14.5,
                        color: '#475569',
                        lineHeight: 1.55,
                        margin: '0 0 18px',
                      }}
                    >
                      Ingresa a nuestra colección de aplicativos especializados listos para usar al
                      instante: comenzando con la{' '}
                      <strong style={{ color: '#0f172a' }}>APP de Matriz IPVR (GTC 45)</strong> con
                      Inteligencia Artificial, gráficas ejecutivas e informes descargables.
                    </p>

                    {/* Chips de Características */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 24,
                      }}
                    >
                      {[
                        '📊 APP Matriz IPVR (GTC 45)',
                        '⚡ Uso Inmediato sin Fricción',
                        '🧠 IA Gemini Integrada',
                        '🖨️ Informe Gerencial A4 & Excel',
                      ].map((chip) => (
                        <span
                          key={chip}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '5px 11px',
                            borderRadius: 10,
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#78350f',
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botón CTA Wappy APPs */}
                  <button
                    type="button"
                    className="btn btn-lime"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenWappyApps();
                    }}
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      padding: '0 12px 0 24px',
                      height: 54,
                      fontSize: 16,
                      fontWeight: 800,
                      border: '2px solid #0e1300',
                    }}
                  >
                    <span>Explorar Wappy APPs</span>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9999,
                        background: '#0e1300',
                        color: '#c7f303',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#c7f303"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                  </button>
                </div>
              </article>
            </div>
          </>
        ) : (
          /* ================================================================
             VISTA 2: CATÁLOGO DE TARJETAS DENTRO DE WAPPY APPs
             ================================================================ */
          <div>
            {/* Cabecera Wappy APPs con el Avatar de Félix */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                background: 'linear-gradient(135deg, #0b192c 0%, #102a43 60%, #0f172a 100%)',
                borderRadius: 28,
                padding: '24px 30px',
                marginBottom: 32,
                color: '#fff',
                boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 22,
                    background:
                      'radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.35), rgba(15, 23, 42, 0.9))',
                    border: '2px solid #fbbf24',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/assets/felix_avatar_3d.png"
                    alt="Avatar Wappy APPs"
                    style={{ height: '94%', width: 'auto', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#fde047',
                      marginBottom: 4,
                    }}
                  >
                    <span>🚀 SUITE DE APLICACIONES ESPECIALIZADAS</span>
                  </div>
                  <h1
                    className="display"
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 36px)',
                      fontWeight: 900,
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    Wappy <span style={{ color: '#c7f303' }}>APPs</span>
                  </h1>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: '4px 0 0',
                      maxWidth: 620,
                    }}
                  >
                    Selecciona la aplicación especializada que deseas abrir. Herramientas prácticas
                    diseñadas para multiplicar tu velocidad en Seguridad y Salud en el Trabajo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackToHub}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 18px',
                  borderRadius: 9999,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span>← Volver a Selección</span>
              </button>
            </div>

            {/* Grid de Tarjetas de Aplicaciones (La 1ra es APP Matriz IPVR -> https://wappy.club/matrizipvr) */}
            <div className="portal-apps-grid">
              {wappyAppsCatalog.map((app, index) => {
                const isFirstApp = app.id === 'matriz-ipvr';
                return (
                  <article
                    key={app.id}
                    className={`app-item-card ${isFirstApp ? 'is-active' : 'is-soon'}`}
                    onClick={isFirstApp ? handleOpenMatrizIpvr : undefined}
                    role={isFirstApp ? 'button' : undefined}
                    tabIndex={isFirstApp ? 0 : undefined}
                    onKeyDown={
                      isFirstApp
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenMatrizIpvr();
                            }
                          }
                        : undefined
                    }
                  >
                    <div>
                      {/* Cabecera Visual de la Tarjeta */}
                      {app.image ? (
                        <div
                          style={{
                            position: 'relative',
                            height: 205,
                            background: '#0e1300',
                            overflow: 'hidden',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <img
                            src={app.image}
                            alt={app.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 9999,
                              background: '#0e1300',
                              color: '#c7f303',
                              fontSize: 10.5,
                              fontWeight: 900,
                              letterSpacing: '0.04em',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#c7f303',
                              }}
                            />
                            {app.badge}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 10,
                              right: 12,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#fff',
                              fontSize: 10.5,
                              fontWeight: 800,
                              backdropFilter: 'blur(6px)',
                            }}
                          >
                            APP #{index + 1} · {app.normative}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            position: 'relative',
                            height: 150,
                            background:
                              'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              background: '#cbd5e1',
                              color: '#334155',
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {app.badge}
                          </div>
                          <div
                            style={{
                              width: 68,
                              height: 68,
                              borderRadius: 20,
                              background: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 34,
                              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
                            }}
                          >
                            {app.icon}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 10,
                              right: 12,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: '#64748b',
                            }}
                          >
                            {app.normative}
                          </div>
                        </div>
                      )}

                      {/* Contenido de la Tarjeta */}
                      <div style={{ padding: '22px 24px 16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{app.icon}</span>
                          <h3
                            className="display"
                            style={{
                              fontSize: 23,
                              fontWeight: 900,
                              color: '#0f172a',
                              margin: 0,
                            }}
                          >
                            {app.title}
                          </h3>
                        </div>

                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: isFirstApp ? '#0d9488' : '#64748b',
                            marginBottom: 10,
                          }}
                        >
                          {app.subtitle}
                        </div>

                        <p
                          style={{
                            fontSize: 13.5,
                            color: '#475569',
                            lineHeight: 1.55,
                            margin: '0 0 16px',
                          }}
                        >
                          {app.description}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          {app.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 9px',
                                borderRadius: 8,
                                background: isFirstApp ? '#f0fdfa' : '#f1f5f9',
                                color: isFirstApp ? '#0f766e' : '#475569',
                                border: isFirstApp ? '1px solid #99f6e4' : '1px solid #e2e8f0',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pie / Botón de la Tarjeta */}
                    <div style={{ padding: '0 24px 24px' }}>
                      {isFirstApp ? (
                        <a
                          href="https://wappy.club/matrizipvr"
                          onClick={handleOpenMatrizIpvr}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'space-between',
                            padding: '0 12px 0 20px',
                            height: 50,
                            fontSize: 15,
                            fontWeight: 800,
                            textDecoration: 'none',
                          }}
                        >
                          <span>{app.ctaLabel}</span>
                          <span className="pip" style={{ width: 32, height: 32 }}>
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#0E1300"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            width: '100%',
                            height: 48,
                            borderRadius: 9999,
                            border: '1px dashed #cbd5e1',
                            background: '#f8fafc',
                            color: '#64748b',
                            fontSize: 13.5,
                            fontWeight: 700,
                            cursor: 'not-allowed',
                          }}
                        >
                          🔒 {app.ctaLabel}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
