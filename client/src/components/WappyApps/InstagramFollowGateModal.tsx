import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, RefreshCw, ShieldCheck, Lock, X } from 'lucide-react';
import type { WappyAppCatalogItem } from './wappyAppsCatalog';

const STORAGE_PASS_KEY = 'wappy_ig_follow_pass_v2';
const STORAGE_USER_KEY = 'wappy_ig_follow_username';
const STORAGE_CODE_KEY = 'wappy_ig_gate_code_v2';

export function getOrCreateIgGateCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_CODE_KEY);
    if (existing && /^WAPPY-\d{4}$/.test(existing)) {
      return existing;
    }
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const code = `WAPPY-${random4}`;
    localStorage.setItem(STORAGE_CODE_KEY, code);
    return code;
  } catch (e) {
    return `WAPPY-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

export function getStoredIgPass(): string | null {
  try {
    return localStorage.getItem(STORAGE_PASS_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function getStoredIgUsername(): string | null {
  try {
    return localStorage.getItem(STORAGE_USER_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveStoredIgPass(passToken: string, username?: string | null) {
  try {
    localStorage.setItem(STORAGE_PASS_KEY, passToken);
    if (username) {
      localStorage.setItem(STORAGE_USER_KEY, username);
    }
    document.cookie = `wappy_ig_follow_pass_v2=${encodeURIComponent(passToken)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {}
}

export function appendIgPassToUrl(url: string): string {
  const pass = getStoredIgPass();
  if (!pass) return url;
  try {
    const u = new URL(url, window.location.origin);
    u.searchParams.set('ig_pass', pass);
    return u.toString();
  } catch (e) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}ig_pass=${encodeURIComponent(pass)}`;
  }
}

export function useInstagramFollowGate(onVerifiedSuccess?: (username?: string | null) => void) {
  const [isVerified, setIsVerified] = useState<boolean>(() => Boolean(getStoredIgPass()));
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(() => getStoredIgUsername());
  const [pendingApp, setPendingApp] = useState<WappyAppCatalogItem | null>(null);
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const sp = new URLSearchParams(window.location.search);
    const urlVerified = sp.get('ig_verified') || '';
    const urlPass = sp.get('ig_pass') || getStoredIgPass() || '';
    const gateCode = getOrCreateIgGateCode();

    const query = new URLSearchParams();
    if (urlPass) query.set('ig_pass', urlPass);
    if (urlVerified) query.set('ig_verified', urlVerified);
    if (gateCode) query.set('code', gateCode);

    fetch(`/api/comunidad/ig-follow/status?${query.toString()}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.verified && data?.passToken) {
          saveStoredIgPass(data.passToken, data.username);
          setIsVerified(true);
          setVerifiedUsername(data.username || 'seguidor_wappy_ia');
          if (urlVerified === 'wappy_ig_ok' && onVerifiedSuccess) {
            onVerifiedSuccess(data.username);
          }
        } else {
          setIsVerified(false);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const requireFollowBeforeOpen = useCallback(
    (app: WappyAppCatalogItem, openCallback: (targetApp: WappyAppCatalogItem) => void) => {
      if (isVerified && getStoredIgPass()) {
        openCallback(app);
        return;
      }
      setPendingApp(app);
      setIsGateOpen(true);
    },
    [isVerified],
  );

  const handleGateVerified = useCallback(
    (passToken: string, username: string | null, openCallback: (targetApp: WappyAppCatalogItem) => void) => {
      saveStoredIgPass(passToken, username);
      setIsVerified(true);
      setVerifiedUsername(username || 'seguidor_wappy_ia');
      setIsGateOpen(false);
      if (onVerifiedSuccess) {
        onVerifiedSuccess(username);
      }
      if (pendingApp) {
        const target = pendingApp;
        setPendingApp(null);
        setTimeout(() => {
          openCallback(target);
        }, 250);
      }
    },
    [pendingApp, onVerifiedSuccess],
  );

  return {
    isVerified,
    verifiedUsername,
    pendingApp,
    isGateOpen,
    setIsGateOpen,
    requireFollowBeforeOpen,
    handleGateVerified,
  };
}

interface InstagramFollowGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetApp?: WappyAppCatalogItem | null;
  onVerified: (passToken: string, username: string | null) => void;
}

export default function InstagramFollowGateModal({
  isOpen,
  onClose,
  targetApp,
  onVerified,
}: InstagramFollowGateModalProps) {
  const [gateCode] = useState<string>(() => getOrCreateIgGateCode());
  const [copied, setCopied] = useState(false);
  const [step1Clicked, setStep1Clicked] = useState(false);
  const [step2Clicked, setStep2Clicked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'warn' | 'success'>('info');
  const pollTimerRef = useRef<number | null>(null);

  const checkVerificationNow = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsChecking(true);
      }
      try {
        let actionReady = !silent || step1Clicked || step2Clicked;
        try {
          const ts = Number(localStorage.getItem('wappy_ig_action_started') || '0');
          if (ts > 0 && Date.now() - ts >= 4500) {
            actionReady = true;
          }
        } catch (e) {}

        const res = await fetch(
          `/api/comunidad/ig-follow/verify?code=${encodeURIComponent(gateCode)}${actionReady ? '&confirmed=1' : ''}`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );
        const data = await res.json();
        if (data?.verified && data?.passToken) {
          setStatusType('success');
          setStatusMessage(
            data.message || '¡Verificado con éxito! Abriendo aplicativo...',
          );
          onVerified(data.passToken, data.username || null);
          return true;
        }
        if (data?.status === 'DM_RECEIVED_NOT_FOLLOWING' || data?.status === 'NOT_FOLLOWING_YET') {
          if (!silent || data?.status === 'DM_RECEIVED_NOT_FOLLOWING') {
            setStatusType('warn');
            setStatusMessage(data.message);
          }
        } else if (!silent && data?.message) {
          setStatusType('info');
          setStatusMessage(data.message);
        }
      } catch (e) {
        if (!silent) {
          setStatusType('warn');
          setStatusMessage('No se pudo conectar con el verificador. Intenta de nuevo.');
        }
      } finally {
        if (!silent) {
          setIsChecking(false);
        }
      }
      return false;
    },
    [gateCode, onVerified, step1Clicked, step2Clicked],
  );

  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = window.setInterval(() => {
      checkVerificationNow(true);
    }, 3500);

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, checkVerificationNow]);

  if (!isOpen) return null;

  const markActionStarted = () => {
    try {
      localStorage.setItem('wappy_ig_action_started', String(Date.now()));
    } catch (e) {}
  };

  const handleCopyCode = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(gateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const handleFollowInstagram = () => {
    markActionStarted();
    setStep1Clicked(true);
    window.open('https://www.instagram.com/wappy_ia/', '_blank', 'noopener,noreferrer');
  };

  const handleSendDmInstagram = async () => {
    markActionStarted();
    await handleCopyCode();
    setStep2Clicked(true);
    setStatusType('info');
    setStatusMessage(`Código ${gateCode} copiado. Pégalo en el DM de @wappy_ia.`);
    window.open('https://ig.me/m/wappy_ia', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-follow-gate-title"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja superior compacta Instagram + WAPPY */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#c7f303]" />

        <div className="p-4 sm:p-5">
          {/* Cabecera compacta */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-extrabold text-fuchsia-700 dark:text-fuchsia-300">
              <Lock className="h-3 w-3" />
              <span>COMUNIDAD @WAPPY_IA</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar"
              className="inline-flex h-8 min-w-[32px] items-center justify-center gap-1 rounded-xl border border-slate-300/60 bg-slate-500/10 px-2.5 text-xs font-bold text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </div>

          {/* Título + 1 línea concisa */}
          <h2
            id="ig-follow-gate-title"
            className="mt-2.5 text-base font-black leading-snug tracking-tight text-slate-900 dark:text-zinc-100 sm:text-lg"
          >
            Síguenos en <span className="text-fuchsia-600 dark:text-fuchsia-400">@wappy_ia</span> para abrir{' '}
            <span className="text-teal-700 dark:text-teal-400">
              {targetApp ? targetApp.title : 'WAPPY Apps'}
            </span>
          </h2>

          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            Completa estos 2 pasos para desbloquear el acceso gratuito:
          </p>

          {/* Pasos 1 y 2 compactos y sin redundancia */}
          <div className="mt-3 space-y-2">
            {/* Paso 1: Seguir */}
            <div className="flex items-center justify-between gap-2.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-2.5 sm:p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/20 text-xs font-black text-fuchsia-800 dark:text-fuchsia-200">
                  1
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-extrabold text-slate-900 dark:text-zinc-100 sm:text-sm">
                    Seguir a @wappy_ia
                  </div>
                  <div className="truncate text-[11px] text-slate-600 dark:text-zinc-400">
                    Abre el perfil y pulsa &ldquo;Seguir&rdquo;
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFollowInstagram}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-500/30 bg-white/90 px-3 text-xs font-bold text-fuchsia-700 transition-all duration-300 ease-in-out hover:bg-fuchsia-500/20 sm:h-9 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-fuchsia-300"
              >
                <span>{step1Clicked ? 'Abierto ✓' : 'Seguir'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Paso 2: Código integrado + Enviar DM */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-xs font-black text-emerald-800 dark:text-emerald-200">
                    2
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 sm:text-sm">
                        Enviar código por DM:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        title="Copiar código"
                        className="inline-flex items-center gap-1 rounded-lg border border-teal-500/30 bg-white/90 px-2 py-0.5 font-mono text-xs font-black tracking-wider text-teal-800 transition-all hover:bg-teal-500/20 dark:bg-zinc-800 dark:text-teal-300"
                      >
                        <span>{gateCode}</span>
                        {copied ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-70" />
                        )}
                      </button>
                    </div>
                    <div className="truncate text-[11px] text-slate-600 dark:text-zinc-400">
                      {copied ? '¡Código copiado al portapapeles!' : 'Se copia solo al abrir el DM'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendDmInstagram}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-white/90 px-3 text-xs font-bold text-emerald-700 transition-all duration-300 ease-in-out hover:bg-emerald-500/20 sm:h-9 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{step2Clicked ? 'DM ✓' : 'Enviar DM'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de estado (solo si hay feedback activo o en 1 línea compacta) */}
          {statusMessage && (
            <div
              className={`mt-2.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] leading-snug ${
                statusType === 'warn'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                  : statusType === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* Botón principal de verificación */}
          <button
            type="button"
            onClick={() => {
              markActionStarted();
              checkVerificationNow(false);
            }}
            disabled={isChecking}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 text-xs font-extrabold tracking-wide text-teal-800 transition-all duration-300 ease-in-out hover:bg-teal-500/20 sm:hover:scale-[1.01] active:scale-95 disabled:opacity-60 dark:text-teal-200 sm:text-sm"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>
              {isChecking ? 'Verificando seguimiento en @wappy_ia...' : 'Ya seguí a @wappy_ia — Entrar ahora'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
