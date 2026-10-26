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
  visualType?: 'matriz-ipvr' | 'wappy-studio' | 'soon';
  icon: string;
  tags: string[];
  href?: string;
  ctaLabel: string;
  onOpen?: (e?: React.MouseEvent) => void;
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wappy_theme_mode') === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wappy_theme_mode', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      showToast(next ? '🌙 Modo Oscuro activado' : '☀️ Modo Claro activado');
      return next;
    });
  };

  useEffect(() => {
    const nextView =
      location.pathname.includes('wappy-apps') ||
      location.pathname === '/apps' ||
      searchParams.get('view') === 'apps'
        ? 'apps'
        : 'hub';
    setView(nextView);
    setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
    const refQuery = getRefQuery();
    navigate(`/login${refQuery}`);
  };

  const handleOpenWappyApps = () => {
    setIsMobileMenuOpen(false);
    setView('apps');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', 'apps');
    setSearchParams(nextParams);
  };

  const handleBackToHub = () => {
    setIsMobileMenuOpen(false);
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

  const handleOpenWappyStudio = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'wappy.club' || window.location.hostname.endsWith('.wappy.club'))
    ) {
      window.location.href = 'https://wappy.club/wappystudio';
    } else {
      window.location.href = '/wappystudio';
    }
  };

  const wappyAppsCatalog: WappyAppCardItem[] = [
    {
      id: 'matriz-ipvr',
      badge: 'DISPONIBLE AHORA · APP #1',
      badgeTone: 'active',
      title: 'APP de Matriz IPVR',
      subtitle: 'Identificación de Peligros, Evaluación y Valoración de Riesgos · GTC 45',
      description:
        'Aplicativo completo para construir, evaluar y auditar tu Matriz IPEVR bajo la metodología GTC 45. Incluye sugerencias automáticas con IA (Google Gemini), Dashboard de analítica con mapa de calor e Informe Gerencial en formato A4 listo para imprimir o exportar.',
      normative: 'GTC 45 · Decreto 1072 de 2015',
      image: '/marketing/marketplace-matriz-ipvr-card-horizontal.png',
      visualType: 'matriz-ipvr',
      icon: '📊',
      tags: [
        'Matriz GTC 45 en Vivo',
        'Controles con IA Gemini',
        'Gráficas & Mapa de Calor',
        'Informe Gerencial A4',
      ],
      href: 'https://wappy.club/matrizipvr',
      ctaLabel: 'Ingresar a APP Matriz IPVR',
      onOpen: handleOpenMatrizIpvr,
    },
    {
      id: 'wappy-studio',
      badge: 'DISPONIBLE AHORA · APP #2',
      badgeTone: 'active',
      title: 'APP de WAPPY Studio',
      subtitle: 'Estudio de Locución Neural 24kHz (Gemini 2.5) y Cápsulas de Video HTML + GSAP',
      description:
        'Produce locuciones profesionales en 24kHz con etiquetas de actuación vocal SST y genera cápsulas animadas de capacitación en formato Horizontal (16:9) o Reels (9:16), listas para compartir por WhatsApp o descargar en HTML autónomo.',
      normative: 'Capacitación e Inducción SST · Decreto 1072',
      visualType: 'wappy-studio',
      icon: '🎬',
      tags: [
        'Locución IA 24kHz (.WAV)',
        'Cápsulas Video HTML+GSAP',
        'Formatos 16:9 y 9:16',
        'Biblioteca Persistente',
      ],
      href: 'https://wappy.club/wappystudio',
      ctaLabel: 'Ingresar a WAPPY Studio',
      onOpen: handleOpenWappyStudio,
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
      visualType: 'soon',
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
      visualType: 'soon',
      icon: '🧪',
      tags: ['Cruce SGA en Vivo', 'Pictogramas Oficiales', 'Alertas de Reacción', 'Etiquetado SGA'],
      ctaLabel: 'Próximamente disponible',
    },
  ];

  return (
    <div className={`mkt wappy-portal-page ${isDarkMode ? 'mkt-dark' : ''}`}>
      <style>{`
        .wappy-portal-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 18% 12%, rgba(91, 184, 245, 0.35) 0%, rgba(91, 184, 245, 0) 48%),
            radial-gradient(circle at 82% 18%, rgba(199, 243, 3, 0.22) 0%, rgba(199, 243, 3, 0) 45%),
            linear-gradient(180deg, #dff1fd 0%, #f1f8fe 32%, #f6f7f9 100%);
          transition: background 0.3s ease, color 0.3s ease;
        }

        .wappy-portal-page.mkt-dark {
          background:
            radial-gradient(ellipse 120% 70% at 50% 0%, #0b2239 0%, #071526 52%, #050b14 100%) !important;
          color: #f8fafc;
        }

        @keyframes felix-avatar-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.015);
          }
        }

        /* Importante: No usar .wrap en el <main> directamente porque marketing.css tiene
           @media (max-width: 640px) { .mkt .wrap { padding: 0 16px !important; } }
           lo cual borraba el padding-top y metía el contenido debajo del navbar fijo. */
        .portal-main-shell {
          flex: 1;
          width: 100%;
          padding-top: 118px;
          padding-bottom: 72px;
        }

        .portal-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 9999px;
          background: rgba(14, 19, 0, 0.92);
          color: #c7f303;
          font-size: clamp(10.5px, 2.6vw, 13px);
          font-weight: 700;
          line-height: 1.3;
          max-width: 100%;
          margin-bottom: 16px;
          border: 1px solid rgba(199, 243, 3, 0.28);
        }

        .portal-eyebrow .tdot {
          background: #c7f303;
          border-radius: 9999px;
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          animation: 1.8s ease-in-out infinite mkt-pulse;
        }

        .portal-hero-title {
          font-size: clamp(26px, 5vw, 50px);
          font-weight: 800;
          color: #0e1300;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
        }

        .wappy-portal-page.mkt-dark .portal-hero-title {
          color: #f8fafc;
        }

        .portal-hero-sub {
          font-size: clamp(14px, 2vw, 17.5px);
          color: #475569;
          line-height: 1.55;
          margin: 0;
          font-weight: 500;
        }

        .wappy-portal-page.mkt-dark .portal-hero-sub {
          color: #cbd5e1;
        }

        .portal-hero-sub strong {
          color: #0f172a;
        }

        .wappy-portal-page.mkt-dark .portal-hero-sub strong {
          color: #c7f303;
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
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, background 0.3s ease;
        }

        .wappy-portal-page.mkt-dark .portal-choice-card {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(51, 65, 85, 0.85);
          box-shadow: 0 22px 55px -15px rgba(0, 0, 0, 0.55);
        }

        .portal-choice-card:hover {
          transform: translateY(-6px);
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
          min-block-size: 315px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 16px 18px 14px;
        }

        .portal-stage-ia {
          background:
            radial-gradient(circle at 50% 42%, rgba(250, 204, 21, 0.24) 0%, rgba(16, 185, 129, 0.22) 38%, rgba(6, 20, 17, 0) 74%),
            linear-gradient(145deg, #041310 0%, #092620 52%, #0e1300 100%);
        }

        .portal-stage-apps {
          background:
            radial-gradient(circle at 50% 45%, rgba(251, 191, 36, 0.28) 0%, rgba(14, 165, 233, 0.2) 42%, rgba(15, 23, 42, 0) 74%),
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

        .portal-stage-top-bar {
          position: relative;
          z-index: 30;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .portal-stage-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          line-height: 1.2;
        }

        .felix-avatar-wrapper {
          position: relative;
          z-index: 20;
          height: 245px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: felix-avatar-float 3.4s ease-in-out infinite;
          filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.45));
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .portal-choice-card.card-apps:hover .felix-avatar-wrapper {
          transform: scale(1.05) translateY(-4px);
        }

        .portal-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 26px 28px 28px;
        }

        .portal-card-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          line-height: 1.35;
        }

        .portal-card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .portal-card-title {
          font-size: clamp(26px, 5.5vw, 32px);
          font-weight: 900;
          color: #0e1300;
          margin: 0;
          letter-spacing: -0.02em;
          white-space: nowrap;
          line-height: 1.1;
        }

        .wappy-portal-page.mkt-dark .portal-card-title {
          color: #f8fafc;
        }

        .portal-card-desc {
          font-size: clamp(13.5px, 1.8vw, 14.5px);
          color: #475569;
          line-height: 1.55;
          margin: 0 0 16px;
        }

        .wappy-portal-page.mkt-dark .portal-card-desc {
          color: #cbd5e1;
        }

        .portal-card-desc strong {
          color: #0f172a;
        }

        .wappy-portal-page.mkt-dark .portal-card-desc strong {
          color: #f8fafc;
        }

        .portal-card-status-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .portal-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .portal-chip {
          font-size: 12px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 10px;
          line-height: 1.3;
        }

        .wappy-portal-page.mkt-dark .portal-chip.chip-ia {
          background: rgba(30, 41, 59, 0.85) !important;
          border-color: rgba(51, 65, 85, 0.9) !important;
          color: #e2e8f0 !important;
        }

        .wappy-portal-page.mkt-dark .portal-chip.chip-apps {
          background: rgba(245, 158, 11, 0.14) !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
          color: #fde68a !important;
        }

        .portal-cta-btn {
          width: 100%;
          justify-content: space-between;
          padding: 0 12px 0 24px !important;
          height: 54px !important;
          font-size: 16px !important;
          font-weight: 800 !important;
        }

        .portal-apps-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: linear-gradient(135deg, #0b192c 0%, #102a43 60%, #0f172a 100%);
          border-radius: 28px;
          padding: 24px 30px;
          margin-bottom: 28px;
          color: #fff;
          box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .portal-apps-banner-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .portal-apps-banner-back:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
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
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.25s ease, background 0.3s ease;
          box-shadow: 0 14px 34px -12px rgba(15, 23, 42, 0.08);
        }

        .wappy-portal-page.mkt-dark .app-item-card {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(51, 65, 85, 0.85);
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.5);
        }

        .app-item-card.is-active {
          border-color: rgba(13, 148, 136, 0.45);
          box-shadow: 0 20px 45px -12px rgba(13, 148, 136, 0.18);
          cursor: pointer;
        }

        .wappy-portal-page.mkt-dark .app-item-card.is-active {
          border-color: rgba(20, 184, 166, 0.55);
        }

        .app-item-card.is-active:hover {
          transform: translateY(-6px);
          border-color: #0d9488;
          box-shadow: 0 26px 55px -12px rgba(13, 148, 136, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.3);
        }

        .app-item-card.is-soon {
          opacity: 0.92;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .wappy-portal-page.mkt-dark .app-item-card.is-soon {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(9, 14, 26, 0.92) 100%);
        }

        .app-card-meta-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 14px;
          background: #0b1320;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .app-card-title {
          font-size: clamp(19px, 3.8vw, 22px);
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .wappy-portal-page.mkt-dark .app-card-title {
          color: #f8fafc;
        }

        .app-card-desc {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.55;
          margin: 0 0 14px;
        }

        .wappy-portal-page.mkt-dark .app-card-desc {
          color: #cbd5e1;
        }

        .app-card-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 8px;
        }

        .app-card-tag.tag-active {
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #99f6e4;
        }

        .wappy-portal-page.mkt-dark .app-card-tag.tag-active {
          background: rgba(13, 148, 136, 0.18);
          color: #5eead4;
          border: 1px solid rgba(45, 212, 191, 0.35);
        }

        .app-card-tag.tag-soon {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .wappy-portal-page.mkt-dark .app-card-tag.tag-soon {
          background: rgba(30, 41, 59, 0.8);
          color: #94a3b8;
          border: 1px solid rgba(51, 65, 85, 0.8);
        }

        .portal-label-mobile {
          display: none;
        }

        .portal-label-desktop {
          display: inline;
        }

        /* =========================================================
           MOBILE & TABLET RESPONSIVE BREAKPOINTS
           ========================================================= */
        @media (max-width: 640px) {
          .portal-main-shell {
            padding-top: 82px !important;
            padding-bottom: 44px !important;
          }

          .portal-label-desktop {
            display: none;
          }

          .portal-label-mobile {
            display: inline;
          }

          .portal-main-grid {
            gap: 20px;
          }

          .portal-choice-card {
            border-radius: 24px;
          }

          .portal-stage {
            min-block-size: 270px;
            padding: 12px 12px 10px;
          }

          .portal-stage-pill {
            font-size: 10px;
            padding: 4px 9px;
            gap: 5px;
          }

          .felix-avatar-wrapper {
            height: 210px;
          }

          .portal-card-body {
            padding: 20px 18px 20px;
          }

          .portal-card-kicker {
            font-size: 10.5px;
          }

          .portal-card-status-pill {
            font-size: 10.5px;
            padding: 3.5px 9px;
          }

          .portal-chips-wrap {
            gap: 6px;
            margin-bottom: 18px;
          }

          .portal-chip {
            font-size: 11px;
            padding: 4px 9px;
          }

          .portal-cta-btn {
            height: 50px !important;
            font-size: 15px !important;
            padding: 0 10px 0 18px !important;
          }

          .portal-apps-banner {
            padding: 18px 16px;
            border-radius: 22px;
            margin-bottom: 20px;
            gap: 14px;
          }

          .portal-apps-banner-back {
            width: 100%;
            padding: 10px 16px;
            font-size: 13px;
          }

          .app-item-card {
            border-radius: 22px;
          }

          .app-card-meta-strip {
            padding: 8px 12px;
          }
        }

        @media (max-width: 380px) {
          .portal-stage-pill {
            font-size: 9.2px;
            padding: 3.5px 7.5px;
          }
        }
      `}</style>

      {/* Toast Flotante de Cambio de Tema */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#0e1300',
            color: '#c7f303',
            padding: '10px 20px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            border: '1px solid rgba(199,243,3,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Mobile Menu Backdrop (Idéntico a LandingPage.tsx) */}
      {isMobileMenuOpen && (
        <div
          className="mkt-mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Capsule Navbar (100% alineado con el encabezado de LandingPage.tsx) */}
      <nav className="mkt-nav" aria-label="Navegación principal WAPPY">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="WAPPY IA - Ecosistema SG-SST Inteligente"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
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

          {/* Enlaces Centrales de Escritorio */}
          <div className="mkt-nav-links">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/${getRefQuery()}`);
              }}
            >
              Inicio
            </a>
            <a
              href="/portal"
              onClick={(e) => {
                e.preventDefault();
                handleBackToHub();
              }}
              style={view === 'hub' ? { color: '#0d9488', fontWeight: 800 } : undefined}
            >
              Selección WAPPY
            </a>
            <a
              href="/portal?view=apps"
              onClick={(e) => {
                e.preventDefault();
                handleOpenWappyApps();
              }}
              style={view === 'apps' ? { color: '#0d9488', fontWeight: 800 } : undefined}
            >
              Wappy APPs
            </a>
            <a
              href="https://wappy.club/matrizipvr"
              onClick={handleOpenMatrizIpvr}
            >
              Matriz IPVR
            </a>
            <a
              href="https://wappy.club/wappystudio"
              onClick={handleOpenWappyStudio}
            >
              WAPPY Studio
            </a>
            <a
              href="/planes"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/planes${getRefQuery()}`);
              }}
            >
              Planes
            </a>
          </div>

          {/* Botones de Acción + Selector de Tema Claro/Oscuro + Menú Hamburguesa Móvil */}
          <div className="mkt-nav-cta">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="mkt-theme-toggle-btn"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
            </button>

            {view === 'apps' ? (
              <button
                type="button"
                className="btn btn-ghost mkt-nav-signin"
                onClick={handleBackToHub}
              >
                ← Volver a Selección
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost mkt-nav-signin"
                onClick={() => navigate(`/${getRefQuery()}`)}
              >
                ← Volver al inicio
              </button>
            )}

            <button type="button" className="btn btn-lime btn-sm" onClick={handleGoToWappyIA}>
              <span className="portal-label-desktop">Ingresar a Wappy IA</span>
              <span className="portal-label-mobile">Wappy IA</span>
            </button>

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

        {/* Cajón Desplegable Móvil (Idéntico a LandingPage.tsx) */}
        {isMobileMenuOpen && (
          <div className="mkt-mobile-menu-drawer">
            <div className="mkt-mobile-menu-links">
              <button
                type="button"
                className="mkt-mobile-link"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate(`/${getRefQuery()}`);
                }}
              >
                <span className="mkt-mobile-link-icon">🏠</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Página de Inicio</span>
                  <span className="mkt-mobile-link-desc">Volver a la portada principal de WAPPY</span>
                </div>
              </button>

              <button
                type="button"
                className="mkt-mobile-link"
                onClick={handleBackToHub}
              >
                <span className="mkt-mobile-link-icon">✨</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Selector Wappy IA / Wappy APPs</span>
                  <span className="mkt-mobile-link-desc">Elegir entre plataforma central o aplicativos</span>
                </div>
              </button>

              <button
                type="button"
                className="mkt-mobile-link"
                onClick={handleOpenWappyApps}
              >
                <span className="mkt-mobile-link-icon">🛠️</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Catálogo Wappy APPs</span>
                  <span className="mkt-mobile-link-desc">Matriz IPVR GTC 45, WAPPY Studio y más</span>
                </div>
              </button>

              <button
                type="button"
                className="mkt-mobile-link"
                onClick={() => handleOpenMatrizIpvr()}
              >
                <span className="mkt-mobile-link-icon">📊</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">APP de Matriz IPVR (GTC 45)</span>
                  <span className="mkt-mobile-link-desc">Abrir aplicativo directo en wappy.club/matrizipvr</span>
                </div>
              </button>

              <button
                type="button"
                className="mkt-mobile-link"
                onClick={() => handleOpenWappyStudio()}
              >
                <span className="mkt-mobile-link-icon">🎬</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">APP de WAPPY Studio</span>
                  <span className="mkt-mobile-link-desc">Locución IA 24kHz y Cápsulas de Video GSAP</span>
                </div>
              </button>
            </div>

            <div className="mkt-mobile-menu-divider"></div>

            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-outline-dark"
                style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}
                onClick={toggleDarkMode}
              >
                {isDarkMode ? '☀️ Cambiar a Modo Claro' : '🌙 Cambiar a Modo Oscuro'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}
                onClick={handleGoToWappyIA}
              >
                Ingresar a Wappy IA (Login)
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Container */}
      <main className="portal-main-shell">
        <div className="wrap">
          {view === 'hub' ? (
            <>
              {/* Header Section */}
              <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 30px' }}>
                <div className="portal-eyebrow">
                  <span className="tdot"></span>
                  <span>PORTAL DE ACCESO OFICIAL · ECOSISTEMA WAPPY</span>
                </div>
                <h1 className="display portal-hero-title">¿A dónde deseas ingresar hoy?</h1>
                <p className="portal-hero-sub">
                  Selecciona entre nuestra plataforma central de Inteligencia Artificial con{' '}
                  <strong>Tenshi IA</strong> o nuestra suite de aplicaciones interactivas directas en{' '}
                  <strong>Wappy APPs</strong>.
                </p>
              </div>

              {/* Two Master Selection Cards: Wappy IA & Wappy APPs */}
              <div className="portal-main-grid">
                {/* ============================================================
                    TARJETA 1: WAPPY IA (Tenshi con su Aureola Celestial)
                   ============================================================ */}
                <article
                  className="portal-choice-card card-ia"
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

                    <div className="portal-stage-top-bar">
                      <div
                        className="portal-stage-pill"
                        style={{
                          background: 'rgba(16, 185, 129, 0.18)',
                          border: '1px solid rgba(52, 211, 153, 0.45)',
                          color: '#a7f3d0',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#c7f303',
                            boxShadow: '0 0 8px #c7f303',
                            flexShrink: 0,
                          }}
                        />
                        <span>ORQUESTADOR IA 24/7</span>
                      </div>

                      <div
                        className="portal-stage-pill"
                        style={{
                          background: 'rgba(250, 204, 21, 0.16)',
                          border: '1px solid rgba(250, 204, 21, 0.5)',
                          color: '#fef08a',
                        }}
                      >
                        <span className="portal-label-desktop">😇 Tenshi + +20 Agentes</span>
                        <span className="portal-label-mobile">😇 +20 Agentes IA</span>
                      </div>
                    </div>

                    <div
                      style={{
                        position: 'relative',
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: 6,
                      }}
                    >
                      <TenshiAvatar
                        size={215}
                        mood="idle"
                        showHaloEffect={true}
                        showHUD={true}
                        interactive={false}
                      />
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 170,
                        height: 20,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(ellipse at center, rgba(199, 243, 3, 0.45) 0%, rgba(16, 185, 129, 0) 75%)',
                        filter: 'blur(6px)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Cuerpo de la Tarjeta Wappy IA */}
                  <div className="portal-card-body">
                    <div>
                      <div className="portal-card-kicker" style={{ color: '#14b8a6' }}>
                        <span>✨ PLATAFORMA CENTRAL SG-SST</span>
                      </div>

                      <div className="portal-card-title-row">
                        <h2 className="display portal-card-title">
                          Wappy <span style={{ color: '#22c55e' }}>IA</span>
                        </h2>
                        <span
                          className="portal-card-status-pill"
                          style={{
                            background: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
                            color: isDarkMode ? '#6ee7b7' : '#047857',
                            border: isDarkMode ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid #a7f3d0',
                          }}
                        >
                          Acceso a Cuenta / Login
                        </span>
                      </div>

                      <p className="portal-card-desc">
                        Ingresa al ecosistema completo del SG-SST liderado por{' '}
                        <strong>Tenshi IA</strong>. Gestiona los 8 Hitos preventivos, Metodología del
                        Bioindividuo, Comités QR, Academia LMS y consulta en tiempo real a más de 20
                        especialistas autónomos.
                      </p>

                      <div className="portal-chips-wrap">
                        {[
                          '🤖 +20 Agentes Especialistas SST',
                          '🧬 Metodología del Bioindividuo',
                          '🎙️ Voz en Vivo con Tenshi',
                          '🎓 Academia LMS & Comités QR',
                        ].map((chip) => (
                          <span
                            key={chip}
                            className="portal-chip chip-ia"
                            style={{
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

                    <button
                      type="button"
                      className="btn btn-primary portal-cta-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToWappyIA();
                      }}
                    >
                      <span>Ingresar a Wappy IA</span>
                      <span className="pip" style={{ width: 34, height: 34, flexShrink: 0 }}>
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
                  <div className="portal-stage portal-stage-apps">
                    <div className="portal-stage-grid" />

                    <div className="portal-stage-top-bar">
                      <div
                        className="portal-stage-pill"
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(251, 191, 36, 0.5)',
                          color: '#fde68a',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#fbbf24',
                            boxShadow: '0 0 8px #fbbf24',
                            flexShrink: 0,
                          }}
                        />
                        <span>SUITE DE APLICATIVOS</span>
                      </div>

                      <div
                        className="portal-stage-pill"
                        style={{
                          background: 'rgba(56, 189, 248, 0.18)',
                          border: '1px solid rgba(56, 189, 248, 0.45)',
                          color: '#bae6fd',
                        }}
                      >
                        <span className="portal-label-desktop">⚡ Herramientas SST en Vivo</span>
                        <span className="portal-label-mobile">⚡ SST en Vivo</span>
                      </div>
                    </div>

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

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 170,
                        height: 20,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.5) 0%, rgba(14, 165, 233, 0) 75%)',
                        filter: 'blur(6px)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Cuerpo de la Tarjeta Wappy APPs */}
                  <div className="portal-card-body">
                    <div>
                      <div className="portal-card-kicker" style={{ color: '#f59e0b' }}>
                        <span>🛠️ APLICACIONES INTERACTIVAS DE ACCESO DIRECTO</span>
                      </div>

                      <div className="portal-card-title-row">
                        <h2 className="display portal-card-title">
                          Wappy <span style={{ color: '#f59e0b' }}>APPs</span>
                        </h2>
                        <span
                          className="portal-card-status-pill"
                          style={{
                            background: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb',
                            color: isDarkMode ? '#fde68a' : '#b45309',
                            border: isDarkMode ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #fde68a',
                          }}
                        >
                          Catálogo de Apps
                        </span>
                      </div>

                      <p className="portal-card-desc">
                        Ingresa a nuestra colección de aplicativos especializados listos para usar al
                        instante: la <strong>APP de Matriz IPVR (GTC 45)</strong> y{' '}
                        <strong>WAPPY Studio (Voz 24kHz & Video Cápsulas GSAP)</strong> con IA
                        integrada.
                      </p>

                      <div className="portal-chips-wrap">
                        {[
                          '📊 APP Matriz IPVR (GTC 45)',
                          '🎬 APP WAPPY Studio (Voz & Video)',
                          '🧠 IA Gemini Integrada',
                          '🖨️ Informes A4, Excel & Cápsulas',
                        ].map((chip) => (
                          <span
                            key={chip}
                            className="portal-chip chip-apps"
                            style={{
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

                    <button
                      type="button"
                      className="btn btn-lime portal-cta-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWappyApps();
                      }}
                      style={{
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
                          flexShrink: 0,
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
               VISTA 2: CATÁLOGO DE TARJETAS DENTRO DE WAPPY APPs (?view=apps)
               ================================================================ */
            <div>
              {/* Cabecera Wappy APPs con el Avatar de Félix */}
              <div className="portal-apps-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 18,
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
                  <div style={{ flex: '1 1 210px', minWidth: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 10.5,
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
                        fontSize: 'clamp(22px, 3.5vw, 34px)',
                        fontWeight: 900,
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      Wappy <span style={{ color: '#c7f303' }}>APPs</span>
                    </h1>
                    <p
                      style={{
                        fontSize: 13.5,
                        color: 'rgba(255, 255, 255, 0.84)',
                        margin: '4px 0 0',
                        maxWidth: 620,
                        lineHeight: 1.45,
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
                  className="portal-apps-banner-back"
                >
                  <span>← Volver a Selección</span>
                </button>
              </div>

              {/* Grid de Tarjetas de Aplicaciones (Matriz IPVR + WAPPY Studio + Próximamente) */}
              <div className="portal-apps-grid">
                {wappyAppsCatalog.map((app) => {
                  const isActiveApp = app.badgeTone === 'active';
                  return (
                    <article
                      key={app.id}
                      className={`app-item-card ${isActiveApp ? 'is-active' : 'is-soon'}`}
                      onClick={isActiveApp && app.onOpen ? app.onOpen : undefined}
                      role={isActiveApp ? 'button' : undefined}
                      tabIndex={isActiveApp ? 0 : undefined}
                      onKeyDown={
                        isActiveApp && app.onOpen
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                app.onOpen?.();
                              }
                            }
                          : undefined
                      }
                    >
                      <div>
                        {/* Franja Superior de Estado y Norma (Fuera de la imagen para NUNCA tapar los textos del banner) */}
                        <div className="app-card-meta-strip">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3.5px 10px',
                              borderRadius: 9999,
                              background: isActiveApp ? 'rgba(199, 243, 3, 0.16)' : 'rgba(148, 163, 184, 0.18)',
                              border: isActiveApp ? '1px solid rgba(199, 243, 3, 0.45)' : '1px solid rgba(148, 163, 184, 0.3)',
                              color: isActiveApp ? '#c7f303' : '#cbd5e1',
                              fontSize: 10,
                              fontWeight: 900,
                              letterSpacing: '0.03em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: isActiveApp ? '#c7f303' : '#94a3b8',
                                flexShrink: 0,
                              }}
                            />
                            <span>{app.badge}</span>
                          </span>

                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {app.normative}
                          </span>
                        </div>

                        {/* Cabecera Visual de la Tarjeta */}
                        {app.visualType === 'matriz-ipvr' && app.image ? (
                          <div
                            style={{
                              position: 'relative',
                              aspectRatio: '16 / 9',
                              width: '100%',
                              background: '#091526',
                              overflow: 'hidden',
                              borderBottom: isDarkMode ? '1px solid rgba(51,65,85,0.8)' : '1px solid #e2e8f0',
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
                          </div>
                        ) : app.visualType === 'wappy-studio' ? (
                          <div
                            style={{
                              position: 'relative',
                              aspectRatio: '16 / 9',
                              width: '100%',
                              background:
                                'radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.28) 0%, rgba(13, 148, 136, 0.25) 45%, rgba(6, 15, 28, 0.98) 100%), linear-gradient(135deg, #071120 0%, #0f172a 50%, #1e1b4b 100%)',
                              overflow: 'hidden',
                              borderBottom: isDarkMode ? '1px solid rgba(51,65,85,0.8)' : '1px solid #e2e8f0',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px 12px',
                            }}
                          >
                            <div style={{ textAlign: 'center', zIndex: 2 }}>
                              <div
                                style={{
                                  fontSize: 'clamp(15px, 3vw, 19px)',
                                  fontWeight: 900,
                                  color: '#c7f303',
                                  letterSpacing: '0.02em',
                                  lineHeight: 1.1,
                                }}
                              >
                                WAPPY STUDIO · VOZ & VIDEO IA
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: '#5eead4',
                                  fontWeight: 700,
                                  marginTop: 2,
                                }}
                              >
                                Locución 24kHz Gemini 2.5 · Cápsulas GSAP 16:9 y 9:16
                              </div>
                            </div>

                            {/* Mockup Central del Estudio de Audio y Video */}
                            <div
                              style={{
                                zIndex: 2,
                                width: '100%',
                                maxWidth: 290,
                                background: 'rgba(15, 23, 42, 0.85)',
                                border: '1px solid rgba(199, 243, 3, 0.35)',
                                borderRadius: 14,
                                padding: '10px 12px',
                                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <span>🎙️</span> Pista Master 24kHz
                                </span>
                                <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 9999, background: '#c7f303', color: '#0e1300' }}>
                                  HTML + GSAP
                                </span>
                              </div>
                              {/* Barras de Onda de Audio */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, height: 22 }}>
                                {[45, 80, 60, 95, 50, 88, 100, 70, 40, 85, 65, 92, 55, 78, 48, 82, 60, 38].map((h, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      flex: 1,
                                      height: `${h}%`,
                                      borderRadius: 9999,
                                      background: idx % 2 === 0 ? '#c7f303' : '#2dd4bf',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div
                              style={{
                                zIndex: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '3px 12px',
                                borderRadius: 9999,
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid rgba(52, 211, 153, 0.45)',
                                color: '#a7f3d0',
                                fontSize: 10,
                                fontWeight: 800,
                              }}
                            >
                              <span>⚡ Acceso Directo · Exportación .WAV y .HTML</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              position: 'relative',
                              height: 140,
                              background: isDarkMode
                                ? 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)'
                                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderBottom: isDarkMode ? '1px solid rgba(51,65,85,0.8)' : '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              style={{
                                width: 62,
                                height: 62,
                                borderRadius: 18,
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 30,
                                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                              }}
                            >
                              {app.icon}
                            </div>
                          </div>
                        )}

                        {/* Contenido de la Tarjeta */}
                        <div style={{ padding: '18px 20px 14px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{app.icon}</span>
                            <h3 className="display app-card-title">{app.title}</h3>
                          </div>

                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: isActiveApp ? (isDarkMode ? '#2dd4bf' : '#0d9488') : '#64748b',
                              marginBottom: 10,
                              lineHeight: 1.35,
                            }}
                          >
                            {app.subtitle}
                          </div>

                          <p className="app-card-desc">{app.description}</p>

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
                                className={`app-card-tag ${isActiveApp ? 'tag-active' : 'tag-soon'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pie / Botón de la Tarjeta */}
                      <div style={{ padding: '0 20px 20px' }}>
                        {isActiveApp && app.href ? (
                          <a
                            href={app.href}
                            onClick={app.onOpen}
                            className="btn btn-primary"
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                              padding: '0 12px 0 18px',
                              height: 50,
                              fontSize: 14.5,
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            <span>{app.ctaLabel}</span>
                            <span className="pip" style={{ width: 32, height: 32, flexShrink: 0 }}>
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
                              border: isDarkMode ? '1px dashed #334155' : '1px dashed #cbd5e1',
                              background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
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
        </div>
      </main>
    </div>
  );
}
