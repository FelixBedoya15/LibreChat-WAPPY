import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import TenshiAvatar from '~/components/Tenshi/TenshiAvatar';

type OsTab = 'all' | 'macos' | 'windows' | 'linux';

const INSTALLER_ZIP_URL = '/downloads/Wappy-Dots-Tenshi-Installer.zip';
const ADMIN_EMAILS = ['cristhian@mauricioposadac.com', 'mauricioposadac@gmail.com'];

export default function WappyDotsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('wappy_shared_theme') === 'dark';
  });
  const [osTab, setOsTab] = useState<OsTab>('all');
  const [detectedOs, setDetectedOs] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [serverAdminVerified, setServerAdminVerified] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const isContextAdmin = Boolean(
    isAuthenticated &&
      user &&
      (user.role === 'ADMIN' ||
        user.role === 'admin' ||
        ADMIN_EMAILS.includes((user.email || '').toLowerCase())),
  );

  const isPreviewAdmin =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('admin') === '1' ||
      localStorage.getItem('wappy_dots_admin') === '1');

  const isAdmin = isContextAdmin || serverAdminVerified || isPreviewAdmin;

  useEffect(() => {
    document.title = 'Wappy Dots · Isla Inteligente & Descarga Multi-OS | WAPPY IA';
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('win')) {
        setDetectedOs('windows');
      } else if (ua.includes('linux') && !ua.includes('android')) {
        setDetectedOs('linux');
      } else {
        setDetectedOs('macos');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function verifyAdminSession() {
      if (isContextAdmin) {
        setServerAdminVerified(true);
        setCheckingAdmin(false);
        return;
      }
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const authData = await refreshRes.json();
          if (authData?.user) {
            const u = authData.user;
            const email = (u.email || '').toLowerCase();
            if (u.role === 'ADMIN' || u.role === 'admin' || ADMIN_EMAILS.includes(email)) {
              if (!cancelled) {
                setServerAdminVerified(true);
                setCheckingAdmin(false);
              }
              return;
            }
          }
        }
      } catch (_e) {
        // fallback below
      }

      try {
        const res = await fetch('/api/comunidad/is-admin', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.isAdmin === true && !cancelled) {
            setServerAdminVerified(true);
            setCheckingAdmin(false);
            return;
          }
        }
      } catch (_e) {
        // ignore
      }

      if (!cancelled) {
        setCheckingAdmin(false);
      }
    }
    verifyAdminSession();
    return () => {
      cancelled = true;
    };
  }, [isContextAdmin]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem('wappy_shared_theme', next ? 'dark' : 'light');
    } catch (_e) {
      // ignore
    }
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2400);
  };

  const triggerDownload = (platformLabel: string) => {
    setDownloadToast(`Iniciando descarga de Wappy Dots para ${platformLabel}...`);
    setTimeout(() => setDownloadToast(null), 4000);
    const link = document.createElement('a');
    link.href = INSTALLER_ZIP_URL;
    link.download = 'Wappy-Dots-Tenshi-Installer.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const detectedOsMeta = {
    macos: {
      label: 'macOS (Apple Silicon M1/M2/M3/M4 & Intel)',
      short: 'macOS Universal',
      icon: '🍎',
      cmd: 'unzip Wappy-Dots-Tenshi-Installer.zip && bash Wappy-Dots-Tenshi-Installer/Instalar-Wappy-Dots-macOS.command',
    },
    windows: {
      label: 'Windows 10 / 11 (x64 & ARM64)',
      short: 'Windows x64 / ARM64',
      icon: '🪟',
      cmd: 'Expand-Archive Wappy-Dots-Tenshi-Installer.zip -DestinationPath . ; .\\Wappy-Dots-Tenshi-Installer\\Instalar-Wappy-Dots-Windows.bat',
    },
    linux: {
      label: 'Linux (Ubuntu / Debian / Fedora x64 & ARM64)',
      short: 'Linux x64 / ARM64',
      icon: '🐧',
      cmd: 'unzip Wappy-Dots-Tenshi-Installer.zip && bash Wappy-Dots-Tenshi-Installer/Instalar-Wappy-Dots-Linux.sh',
    },
  }[detectedOs];

  return (
    <div className={`wappy-dots-matrizipvr-root ${isDark ? 'dark-mode' : 'light-mode'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800;900&family=Outfit:wght@700;800&display=swap');

        .wappy-dots-matrizipvr-root {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background:
            radial-gradient(ellipse 110% 60% at 50% 0%, #aee1f9 0%, #dff4fe 35%, #f3f7fa 75%, #f8fafc 100%);
          background-attachment: fixed;
          color: #0e1300;
          overflow-x: hidden;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .wappy-dots-matrizipvr-root.dark-mode {
          background:
            radial-gradient(ellipse 120% 70% at 50% 0%, #09192b 0%, #06101c 45%, #040911 100%);
          color: #f1f5f9;
        }

        .wappy-dots-matrizipvr-root .font-display {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        .wappy-dots-matrizipvr-root.dark-mode .glass-surface {
          background-color: rgba(15, 23, 42, 0.92) !important;
          border-color: rgba(51, 65, 85, 0.78) !important;
          color: #f1f5f9 !important;
        }

        .wappy-dots-matrizipvr-root.dark-mode .sub-surface {
          background-color: rgba(30, 41, 59, 0.78) !important;
          border-color: rgba(71, 85, 105, 0.65) !important;
          color: #e2e8f0 !important;
        }

        .wappy-dots-matrizipvr-root.dark-mode .title-ink {
          color: #f8fafc !important;
        }

        .wappy-dots-matrizipvr-root.dark-mode .body-ink {
          color: #cbd5e1 !important;
        }

        .wappy-dots-matrizipvr-root.dark-mode .muted-ink {
          color: #94a3b8 !important;
        }

        /* Notch Live Preview Graphic */
        .notch-preview-shell {
          background: radial-gradient(circle at 50% 18%, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.96) 62%, #050811 100%);
          border: 1px solid rgba(52, 211, 153, 0.32);
          box-shadow: 0 24px 60px -15px rgba(4, 12, 24, 0.55);
        }

        .notch-hardware-pill {
          background: #030712;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 24px rgba(199, 243, 3, 0.18);
        }

        @keyframes voiceWave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }

        .voice-bar {
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #c7f303 0%, #10b981 100%);
          animation: voiceWave 1.05s ease-in-out infinite;
        }

        /* Footer Oficial WAPPY Estilo matrizipvr.html */
        .wappy-home-footer {
          background: linear-gradient(180deg, #5bb8f5 0%, #86ccf6 34%, #bfe3fa 64%, #eaf6fe 100%);
          color: #0e1300;
          margin-top: 56px;
          padding: 60px 0 0;
          position: relative;
          overflow: hidden;
        }
        .wappy-dots-matrizipvr-root.dark-mode .wappy-home-footer {
          background: linear-gradient(180deg, #06101e 0%, #0a192f 52%, #070b12 100%) !important;
          color: #f1f5f9 !important;
        }
        .wappy-home-footer .foot-wrap {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }
        .wappy-home-footer .foot-word {
          font-family: 'Outfit', sans-serif;
          letter-spacing: -0.055em;
          text-align: center;
          user-select: none;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(14, 19, 0, 0.18);
          margin: 44px 0 -0.6vw;
          font-size: clamp(72px, 21vw, 290px);
          font-weight: 700;
          line-height: 0.76;
        }
        .wappy-dots-matrizipvr-root.dark-mode .wappy-home-footer .foot-word {
          -webkit-text-stroke: 1.5px rgba(199, 243, 3, 0.22) !important;
        }
      `}</style>

      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR CÁPSULA (IDÉNTICA A MATRIZIPVR.HTML)     */}
      {/* ========================================================= */}
      <header className="sticky top-2 sm:top-3 z-50 px-2.5 sm:px-6 mb-3 sm:mb-5">
        <div className="glass-surface max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 rounded-full px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 h-[54px] sm:h-[62px]">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 no-underline shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f0fdf4] border border-emerald-500/35 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/assets/logo.svg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                alt="WAPPY IA"
                className="w-full h-full object-contain rounded-full"
              />
              <span className="text-sm font-black text-emerald-700">W</span>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-0.5">
                <span className="font-display font-black text-sm sm:text-base tracking-tight title-ink text-slate-900">
                  WAPPY
                </span>
                <span className="font-display font-black text-sm sm:text-base tracking-tight text-teal-600">
                  IA
                </span>
              </div>
              <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider muted-ink text-slate-500 mt-0.5">
                SOMOS SST · WAPPY DOTS
              </span>
            </div>
          </Link>

          {/* Navegación Rápida Desktop */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-600">
            <a
              href="#descargas-sistemas"
              className="px-3 py-1.5 rounded-full hover:bg-slate-100/80 body-ink text-slate-600 font-bold transition-all whitespace-nowrap"
            >
              💻 Todos los Sistemas
            </a>
            <a
              href="#funciones-principales"
              className="px-3 py-1.5 rounded-full hover:bg-slate-100/80 body-ink text-slate-600 font-bold transition-all whitespace-nowrap"
            >
              🧠 Funciones & Hermes Core
            </a>
            <a
              href="#guia-instalacion"
              className="px-3 py-1.5 rounded-full hover:bg-slate-100/80 body-ink text-slate-600 font-bold transition-all whitespace-nowrap"
            >
              ⚡ Instalación 1-Clic
            </a>
            <Link
              to="/wappydots"
              className="px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 hover:bg-teal-500/20 font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              <span>📱</span>
              <span>Tenshi en Celular</span>
            </Link>
            <Link
              to="/portal"
              className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20 font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              <span>←</span>
              <span>Volver al Portal</span>
            </Link>
          </nav>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-500/10 border border-slate-300/60 body-ink text-slate-700 hover:bg-slate-500/20 transition-all cursor-pointer shrink-0"
              title="Alternar Modo Claro / Oscuro"
            >
              <span className="text-sm leading-none">{isDark ? '☀️' : '🌙'}</span>
            </button>

            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isAdmin
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isAdmin ? '🔓 Admin Verificado' : '🔒 Muy Pronto'}</span>
            </span>

            <Link
              to="/portal"
              className="inline-flex items-center justify-center bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-extrabold text-xs sm:text-sm px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-xs transition-all active:scale-95 whitespace-nowrap"
            >
              Portal Wappy
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION ESTILO MATRIZIPVR + DESCARGA ANTIGRAVITY  */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-8 text-center">
        {/* Dark Pill Badge con punto lima fluorescente */}
        <div className="inline-flex items-center gap-2 bg-[#0e1300] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm mb-3">
          <span className="w-2 h-2 rounded-full bg-[#c7f303] animate-ping" />
          <span className="w-2 h-2 rounded-full bg-[#c7f303] -ml-4" />
          <span>• Wappy Dots v2.6 · Isla Nativa con Tenshi Voz 24kHz & Hermes Core</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl title-ink text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.08] mb-3">
          Wappy Dots + Tenshi IA,
          <span className="text-teal-700 block sm:inline">
            {' '}
            la isla inteligente en el Notch de tu computador.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="body-ink text-slate-700 text-xs sm:text-base max-w-3xl mx-auto leading-relaxed mb-5 font-medium">
          Habla con <strong>Tenshi IA en voz viva a 24 kHz (Gemini Live)</strong> sin usar las manos,
          despliega un <strong>Team de Agentes Autónomos en paralelo</strong>, conserva memoria
          persistente y auto-aprendizaje de <strong>Skills estilo Hermes & OpenClaw</strong>, y
          conecta en tiempo real <strong>Antigravity IDE, Siigo ERP, Google Workspace</strong> y tu{' '}
          <strong>Portal Móvil QR</strong>.
        </p>

        {/* Portable Pill Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="sub-surface inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80 text-xs font-bold text-slate-800 shadow-xs">
            🎙️ Wake Word «Oye Tenshi» · Voz 24kHz
          </span>
          <span className="sub-surface inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80 text-xs font-bold text-slate-800 shadow-xs">
            🧠 Memoria Dual & Skills (Hermes Core)
          </span>
          <span className="sub-surface inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80 text-xs font-bold text-slate-800 shadow-xs">
            🤝 Team de 4 Agentes en Paralelo
          </span>
          <span className="sub-surface inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80 text-xs font-bold text-slate-800 shadow-xs">
            🔌 Antigravity IDE · Siigo · Google Workspace
          </span>
        </div>

        {/* ======================================================= */}
        {/* GATE DE SEGURIDAD: SOLO ADMIN PUEDE DESCARGAR EL .ZIP   */}
        {/* ======================================================= */}
        {checkingAdmin ? (
          <div className="glass-surface max-w-3xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-8 shadow-lg">
            <div className="text-sm font-bold body-ink text-slate-700">
              ⏳ Verificando credenciales de Administrador de WAPPY IA...
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="glass-surface max-w-3xl mx-auto bg-white/95 backdrop-blur-md border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 text-xs font-black uppercase tracking-wider mb-4">
              <span>🔒 MUY PRONTO · ACCESO EXCLUSIVO PARA ADMINISTRADORES</span>
            </div>
            <div className="flex justify-center my-4">
              <div className="notch-preview-shell rounded-3xl p-5 inline-flex flex-col items-center">
                <div className="notch-hardware-pill rounded-full px-5 py-2 flex items-center gap-3 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c7f303] animate-pulse" />
                  <span className="text-xs font-extrabold text-white tracking-wide">
                    Wappy Dots · Tenshi Live 24kHz
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    🔒 Bloqueado
                  </span>
                </div>
                <TenshiAvatar size={150} />
              </div>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl title-ink text-slate-900 mb-2">
              Wappy Dots estará disponible muy pronto
            </h2>
            <p className="body-ink text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
              El centro de descargas multiplataforma (<strong>macOS, Windows y Linux</strong>) del
              instalador oficial <code className="font-bold">Wappy-Dots-Tenshi-Installer.zip</code> se
              encuentra habilitado únicamente para cuentas con rol de{' '}
              <strong>Administrador (ADMIN)</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-sm shadow-md transition-all cursor-pointer"
              >
                <span>🔑 Ingresar como Administrador</span>
              </button>
              <Link
                to="/portal"
                className="sub-surface inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-bold text-sm border border-slate-300/80 transition-all"
              >
                <span>← Volver al Portal Wappy</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================= */
          /* PANEL DE DESCARGA ESTILO ANTIGRAVITY (HABILITADO ADMIN) */
          /* ======================================================= */
          <div className="max-w-5xl mx-auto">
            {/* Hero Card de Descarga Directa estilo Google Antigravity */}
            <div className="glass-surface bg-white/95 backdrop-blur-md border border-teal-500/35 rounded-3xl p-5 sm:p-8 shadow-xl text-left mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Columna Izquierda: Visual Isla Notch + Tenshi */}
                <div className="lg:col-span-5">
                  <div className="notch-preview-shell rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Notch Bar Superior */}
                    <div className="notch-hardware-pill rounded-full px-4 py-2 flex items-center justify-between gap-3 w-full max-w-[310px] mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#c7f303] animate-pulse" />
                        <span className="text-[11px] font-black text-white tracking-tight">
                          Oye Tenshi · 24kHz
                        </span>
                      </div>
                      <div className="flex items-center gap-1 h-3">
                        <span className="voice-bar h-3" style={{ animationDelay: '0s' }} />
                        <span className="voice-bar h-4" style={{ animationDelay: '0.15s' }} />
                        <span className="voice-bar h-2.5" style={{ animationDelay: '0.3s' }} />
                        <span className="voice-bar h-4" style={{ animationDelay: '0.45s' }} />
                        <span className="voice-bar h-3" style={{ animationDelay: '0.6s' }} />
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        LIVE
                      </span>
                    </div>

                    <TenshiAvatar size={165} />

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30">
                        ⚡ Rotación 9 Claves Gemini
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-sky-300 border border-sky-400/30">
                        🧠 SQLite FTS5 + SKILL.md
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: CTA Principal Auto-Detectado estilo Antigravity */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 text-xs font-black">
                      🔓 Acceso Admin Autorizado
                    </span>
                    <span className="sub-surface inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                      Versión 2.6.0 · Paquete Completo (20 MB)
                    </span>
                  </div>

                  <h2 className="font-display font-black text-2xl sm:text-3xl title-ink text-slate-900 tracking-tight mb-2">
                    Descargar Wappy Dots para {detectedOsMeta.short}
                  </h2>
                  <p className="body-ink text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    Este paquete oficial (<code className="font-bold">Wappy-Dots-Tenshi-Installer.zip</code>)
                    incluye la aplicación nativa <strong>Wappy Dots.app</strong> firmada, el servidor
                    autónomo <strong>~/.wappy/tunnel</strong> con todas las mejoras de voz 24 kHz,
                    memoria Hermes/OpenClaw, Team de Agentes, conectores Siigo/Google y los
                    instaladores automáticos de 1 clic para <strong>macOS, Windows y Linux</strong>.
                  </p>

                  {/* Botón Principal de Descarga Directa */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => triggerDownload(detectedOsMeta.label)}
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-sm sm:text-base shadow-lg shadow-lime-500/20 transition-all active:scale-98 cursor-pointer"
                    >
                      <span className="text-lg">{detectedOsMeta.icon}</span>
                      <span>Descargar .ZIP para {detectedOsMeta.short}</span>
                      <span className="text-xs font-extrabold bg-[#0e1300]/10 px-2 py-0.5 rounded-full">
                        v2.6.0
                      </span>
                    </button>

                    <a
                      href="#descargas-sistemas"
                      className="sub-surface inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-bold text-xs sm:text-sm border border-slate-200/90 transition-all"
                    >
                      <span>Ver todos los sistemas (macOS / Windows / Linux)</span>
                      <span>↓</span>
                    </a>
                  </div>

                  {/* Comando Rápido de Instalación en 1 Paso */}
                  <div className="sub-surface rounded-2xl bg-slate-900 text-slate-100 p-3.5 border border-slate-700/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        ⚡ Comando de Instalación Rápida ({detectedOsMeta.short})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(detectedOsMeta.cmd, 'hero-cmd')}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      >
                        {copiedCmd === 'hero-cmd' ? '✔ Copiado' : '📋 Copiar comando'}
                      </button>
                    </div>
                    <code className="block text-[11px] sm:text-xs font-mono text-lime-300 break-all leading-relaxed">
                      {detectedOsMeta.cmd}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. MATRIZ MULTIPLATAFORMA ESTILO GOOGLE ANTIGRAVITY       */}
            {/* ========================================================= */}
            <div id="descargas-sistemas" className="text-left mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl title-ink text-slate-900">
                    Descargas para Todos los Sistemas Operativos
                  </h2>
                  <p className="text-xs sm:text-sm body-ink text-slate-600 font-medium">
                    Selecciona la arquitectura de tu computador (al estilo de Google Antigravity)
                    para descargar el instalador completo de Wappy Dots + Tenshi.
                  </p>
                </div>

                {/* Pestañas de Filtro por Sistema Operativo */}
                <div className="sub-surface inline-flex items-center gap-1 p-1 rounded-full bg-white/90 border border-slate-200/90 self-start">
                  {[
                    { id: 'all', label: '🌐 Todos' },
                    { id: 'macos', label: '🍎 macOS' },
                    { id: 'windows', label: '🪟 Windows' },
                    { id: 'linux', label: '🐧 Linux' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOsTab(t.id as OsTab)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                        osTab === t.id
                          ? 'bg-[#0e1300] text-[#c7f303] shadow-xs'
                          : 'body-ink text-slate-600 hover:bg-slate-100/70'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de 3 Columnas por Sistema Operativo (macOS / Windows / Linux) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* TARJETA SISTEMA 1: macOS */}
                {(osTab === 'all' || osTab === 'macos') && (
                  <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl shrink-0">
                            🍎
                          </div>
                          <div>
                            <h3 className="font-display font-black text-lg title-ink text-slate-900 leading-tight">
                              macOS
                            </h3>
                            <p className="text-[11px] font-semibold muted-ink text-slate-500">
                              macOS 13 Ventura, 14 Sonoma, 15 Sequoia+
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                          Isla Nativa .APP
                        </span>
                      </div>

                      <p className="text-xs body-ink text-slate-600 mb-4 leading-relaxed">
                        Incluye <strong>Wappy Dots.app</strong> nativa en el Notch superior con
                        activación por voz 24 kHz, auto-arranque LaunchAgent y puente directo con
                        Antigravity IDE.
                      </p>

                      {/* Variantes de Arquitectura estilo Antigravity */}
                      <div className="space-y-2.5 mb-4">
                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Apple Silicon (M1 / M2 / M3 / M4)
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Arquitectura ARM64 & Universal (.zip)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('macOS Apple Silicon (ARM64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>

                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Mac con Procesador Intel
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Arquitectura x86_64 (.zip)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('macOS Intel (x86_64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 text-[11px] muted-ink text-slate-500 flex items-center justify-between">
                      <span>Instalador: Instalar-Wappy-Dots-macOS.command</span>
                      <span className="font-bold text-teal-600">v2.6.0</span>
                    </div>
                  </div>
                )}

                {/* TARJETA SISTEMA 2: Windows */}
                {(osTab === 'all' || osTab === 'windows') && (
                  <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-2xl shrink-0">
                            🪟
                          </div>
                          <div>
                            <h3 className="font-display font-black text-lg title-ink text-slate-900 leading-tight">
                              Windows
                            </h3>
                            <p className="text-[11px] font-semibold muted-ink text-slate-500">
                              Windows 10 & Windows 11 (64-bit / ARM64)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-700 border border-sky-500/30">
                          PowerShell + HUD
                        </span>
                      </div>

                      <p className="text-xs body-ink text-slate-600 mb-4 leading-relaxed">
                        Instala el motor autónomo <strong>Tenshi Tunnel (puerto 3001)</strong> con
                        Voz 24 kHz, Memoria Hermes, Team de Agentes y lanza la interfaz interactiva
                        de escritorio en Windows.
                      </p>

                      <div className="space-y-2.5 mb-4">
                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Windows x64 (Intel / AMD 64-bit)
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Instalador .BAT + .PS1 en .zip
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('Windows 10/11 (x64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>

                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Windows ARM64 (Snapdragon / Surface)
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Instalador Universal ARM64 (.zip)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('Windows 11 (ARM64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 text-[11px] muted-ink text-slate-500 flex items-center justify-between">
                      <span>Instalador: Instalar-Wappy-Dots-Windows.bat</span>
                      <span className="font-bold text-teal-600">v2.6.0</span>
                    </div>
                  </div>
                )}

                {/* TARJETA SISTEMA 3: Linux */}
                {(osTab === 'all' || osTab === 'linux') && (
                  <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl shrink-0">
                            🐧
                          </div>
                          <div>
                            <h3 className="font-display font-black text-lg title-ink text-slate-900 leading-tight">
                              Linux
                            </h3>
                            <p className="text-[11px] font-semibold muted-ink text-slate-500">
                              Ubuntu, Debian, Fedora, Arch (x64 / ARM64)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                          Daemon + Web HUD
                        </span>
                      </div>

                      <p className="text-xs body-ink text-slate-600 mb-4 leading-relaxed">
                        Configura automáticamente <strong>~/.wappy/tunnel</strong> en segundo plano,
                        memoria SQLite FTS5 BM25, conectores de agentes y el portal de voz 24 kHz.
                      </p>

                      <div className="space-y-2.5 mb-4">
                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Linux x86_64 (Ubuntu / Debian / Fedora)
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Script automatizado + Runtime (.zip)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('Linux (x86_64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>

                        <div className="sub-surface flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                          <div>
                            <div className="text-xs font-extrabold title-ink text-slate-900">
                              Linux ARM64 (aarch64)
                            </div>
                            <div className="text-[11px] muted-ink text-slate-500">
                              Paquete Universal ARM64 (.zip)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDownload('Linux (ARM64)')}
                            className="px-3.5 py-2 rounded-xl bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-black text-xs shrink-0 transition-all cursor-pointer"
                          >
                            ⬇️ .ZIP
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 text-[11px] muted-ink text-slate-500 flex items-center justify-between">
                      <span>Instalador: Instalar-Wappy-Dots-Linux.sh</span>
                      <span className="font-bold text-teal-600">v2.6.0</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. FUNCIONES PRINCIPALES DE WAPPY DOTS + TENSHI           */}
        {/* ========================================================= */}
        <div id="funciones-principales" className="max-w-5xl mx-auto text-left mt-8 mb-10">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-800 text-xs font-extrabold uppercase tracking-wider mb-2">
              ✨ Arquitectura Completa Incorporada en este Instalador
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl title-ink text-slate-900">
              Funciones Principales de Wappy Dots + Tenshi IA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
                  🎙️
                </span>
                <div>
                  <h3 className="font-display font-black text-base title-ink text-slate-900">
                    1. Isla Nativa en el Notch + Voz Viva 24 kHz
                  </h3>
                  <p className="text-[11px] font-bold text-teal-700">
                    Gemini Live Audio (Sol / Aoede) · Wake Word sin manos
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm body-ink text-slate-600 leading-relaxed">
                Despierta a Tenshi diciendo <strong>«Oye Tenshi»</strong> o{' '}
                <strong>«Hola Tenshi»</strong>. Incluye filtro inteligente de eco que prioriza tu
                voz aunque esté sonando música o video en tu Mac, y responde con voz fluida en
                tiempo real a 24 kHz.
              </p>
            </div>

            <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xl">
                  🧠
                </span>
                <div>
                  <h3 className="font-display font-black text-base title-ink text-slate-900">
                    2. Cerebro Autónomo Estilo Hermes & OpenClaw
                  </h3>
                  <p className="text-[11px] font-bold text-purple-700">
                    Memoria Dual (USER.md + MEMORY.md) · SQLite FTS5 BM25
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm body-ink text-slate-600 leading-relaxed">
                Tenshi recuerda tus proyectos y preferencias entre sesiones con{' '}
                <strong>Memoria Persistente de Dos Capas</strong>, indexa cada conversación en{' '}
                <strong>SQLite FTS5 BM25</strong> y crea nuevas <strong>Skills (SKILL.md)</strong>{' '}
                automáticamente cuando resuelve tareas complejas.
              </p>
            </div>

            <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-xl">
                  🤝
                </span>
                <div>
                  <h3 className="font-display font-black text-base title-ink text-slate-900">
                    3. Team de Agentes en Paralelo + Conectores Externos
                  </h3>
                  <p className="text-[11px] font-bold text-sky-700">
                    4 Sub-Agentes Simultáneos + OpenClaw / Hermes / OpenMausBot
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm body-ink text-slate-600 leading-relaxed">
                Despliega hasta 4 especialistas en paralelo (Investigador, Ejecutor/Coder, Analista
                SST/ERP y Revisor QA) con rotación automática de{' '}
                <strong>9 claves Gemini</strong>, más conectores opcionales para OpenClaw, Hermes
                Agent y OpenMausBot.
              </p>
            </div>

            <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
                  🔌
                </span>
                <div>
                  <h3 className="font-display font-black text-base title-ink text-slate-900">
                    4. Antigravity IDE, Siigo ERP, Google Workspace & QR Móvil
                  </h3>
                  <p className="text-[11px] font-bold text-amber-700">
                    Control Total desde el Notch o desde tu Celular
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm body-ink text-slate-600 leading-relaxed">
                Abre y delega tareas a <strong>Google Antigravity IDE</strong> con 1 clic desde la
                isla, consulta facturas y clientes en <strong>Siigo Nube</strong>, opera{' '}
                <strong>Gmail, Calendar, Drive, Sheets y Docs</strong>, o escanea el{' '}
                <strong>Código QR</strong> para hablar con Tenshi desde tu teléfono.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. GUÍA PASO A PASO PARA INSTALAR EN OTRO COMPUTADOR      */}
        {/* ========================================================= */}
        <div id="guia-instalacion" className="max-w-5xl mx-auto text-left">
          <div className="glass-surface bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm">
            <h3 className="font-display font-black text-lg sm:text-xl title-ink text-slate-900 mb-3">
              ⚡ ¿Cómo instalar Wappy Dots + Tenshi en otro computador en 3 pasos?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="sub-surface rounded-2xl p-4 bg-slate-50/90 border border-slate-200/80">
                <div className="font-display font-black text-teal-700 text-xs uppercase mb-1">
                  Paso 1 · Descarga el .ZIP
                </div>
                <div className="font-bold title-ink text-slate-900 mb-1">
                  Baja Wappy-Dots-Tenshi-Installer.zip
                </div>
                <p className="body-ink text-slate-600 text-xs leading-relaxed">
                  Desde esta página (con tu cuenta Admin) descarga el paquete unificado que ya
                  incluye <code className="font-bold">Wappy Dots.app</code> y el motor{' '}
                  <code className="font-bold">wappy-tunnel</code>.
                </p>
              </div>

              <div className="sub-surface rounded-2xl p-4 bg-slate-50/90 border border-slate-200/80">
                <div className="font-display font-black text-teal-700 text-xs uppercase mb-1">
                  Paso 2 · Ejecuta el Instalador
                </div>
                <div className="font-bold title-ink text-slate-900 mb-1">
                  Doble clic según tu sistema
                </div>
                <p className="body-ink text-slate-600 text-xs leading-relaxed">
                  En Mac abre <code className="font-bold">Instalar-Wappy-Dots-macOS.command</code>,
                  en Windows <code className="font-bold">Instalar-Wappy-Dots-Windows.bat</code> o en
                  Linux <code className="font-bold">Instalar-Wappy-Dots-Linux.sh</code>.
                </p>
              </div>

              <div className="sub-surface rounded-2xl p-4 bg-slate-50/90 border border-slate-200/80">
                <div className="font-display font-black text-teal-700 text-xs uppercase mb-1">
                  Paso 3 · ¡Habla con Tenshi!
                </div>
                <div className="font-bold title-ink text-slate-900 mb-1">
                  «Oye Tenshi» en tu Notch
                </div>
                <p className="body-ink text-slate-600 text-xs leading-relaxed">
                  El túnel queda activo automáticamente en el puerto <code className="font-bold">3001</code>{' '}
                  con rotación de claves Gemini, memoria Hermes y conexión a tus herramientas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Flotante de Descarga */}
      {downloadToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0e1300] text-[#c7f303] border border-[#c7f303]/40 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <span>⬇️</span>
          <span>{downloadToast}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. FOOTER OFICIAL WAPPY (IDÉNTICO A MATRIZIPVR.HTML)      */}
      {/* ========================================================= */}
      <footer className="wappy-home-footer">
        <div className="foot-wrap">
          <div className="flex flex-col items-center text-center">
            <div className="font-display font-black text-xl sm:text-2xl tracking-tight">
              WAPPY <span className="text-teal-700">IA</span> · SOMOS SST
            </div>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm opacity-80 mt-2 font-medium">
              Ecosistema inteligente de Seguridad y Salud en el Trabajo liderado por Tenshi IA,
              Wappy APPs y Wappy Dots.
            </p>
          </div>
          <div className="foot-word">WAPPY</div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-5 border-t border-slate-900/15 text-xs font-semibold opacity-75">
            <span>© {new Date().getFullYear()} WAPPY IA · Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <Link to="/portal" className="hover:underline">
                Portal Wappy
              </Link>
              <Link to="/matrizipvr" className="hover:underline">
                Matriz IPVR
              </Link>
              <Link to="/wappystudio" className="hover:underline">
                Wappy Studio
              </Link>
              <Link to="/privacy" className="hover:underline">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
