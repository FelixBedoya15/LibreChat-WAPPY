import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, Copy, ExternalLink, MessageCircle, RefreshCw, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import type { WappyAppCatalogItem } from './wappyAppsCatalog';

const STORAGE_PASS_KEY = 'wappy_ig_follow_pass';
const STORAGE_USER_KEY = 'wappy_ig_follow_username';
const STORAGE_CODE_KEY = 'wappy_ig_gate_code';

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
    document.cookie = `wappy_ig_follow_pass=${encodeURIComponent(passToken)}; path=/; max-age=31536000; SameSite=Lax`;
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

    const query = new URLSearchParams();
    if (urlPass) query.set('ig_pass', urlPass);
    if (urlVerified) query.set('ig_verified', urlVerified);

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
        const res = await fetch(
          `/api/comunidad/ig-follow/verify?code=${encodeURIComponent(gateCode)}`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );
        const data = await res.json();
        if (data?.verified && data?.passToken) {
          setStatusType('success');
          setStatusMessage(
            data.message || '¡Verificado con éxito! Desbloqueando WAPPY Apps...',
          );
          onVerified(data.passToken, data.username || null);
          return true;
        }
        if (data?.status === 'DM_RECEIVED_NOT_FOLLOWING') {
          setStatusType('warn');
          setStatusMessage(data.message);
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
    [gateCode, onVerified],
  );

  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // Sondeo automático cada 3.5 segundos mientras el modal está abierto
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {}
  };

  const handleFollowInstagram = () => {
    setStep1Clicked(true);
    window.open('https://www.instagram.com/wappy_ia/', '_blank', 'noopener,noreferrer');
  };

  const handleSendDmInstagram = async () => {
    await handleCopyCode();
    setStep2Clicked(true);
    setStatusType('info');
    setStatusMessage(
      `Código "${gateCode}" copiado al portapapeles. Pégalo y envíalo en el DM de @wappy_ia para desbloquear tu acceso.`,
    );
    window.open('https://ig.me/m/wappy_ia', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-follow-gate-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Franja superior degradada Instagram + WAPPY */}
        <div className="h-2 w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#c7f303]" />

        <div className="p-5 sm:p-7">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-extrabold text-fuchsia-700 dark:text-fuchsia-300">
              <Lock className="h-3.5 w-3.5" />
              <span>ACCESO COMUNIDAD @WAPPY_IA</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 px-2.5 items-center justify-center rounded-xl border border-slate-300/60 bg-slate-500/10 text-xs font-bold text-slate-700 transition-all hover:bg-slate-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300"
            >
              Cerrar ✕
            </button>
          </div>

          <h2
            id="ig-follow-gate-title"
            className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100 sm:text-2xl"
          >
            Síguenos en <span className="text-fuchsia-600 dark:text-fuchsia-400">@wappy_ia</span> para ingresar a WAPPY Apps
          </h2>

          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
            Para acceder gratis a{' '}
            <strong className="text-slate-900 dark:text-zinc-200">
              {targetApp ? targetApp.title : 'los aplicativos de WAPPY Apps'}
            </strong>
            , todos los usuarios deben seguir nuestra cuenta oficial de Instagram{' '}
            <strong className="text-fuchsia-600 dark:text-fuchsia-400">@wappy_ia</strong>. Nuestro sistema
            verifica tu seguimiento automáticamente en segundos:
          </p>

          {/* Tarjeta de Código Único de Verificación */}
          <div className="mt-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3.5 dark:bg-teal-950/30">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  TU CÓDIGO DE ACTIVACIÓN EN VIVO
                </div>
                <div className="mt-0.5 font-mono text-xl font-black tracking-widest text-slate-900 dark:text-white sm:text-2xl">
                  {gateCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-teal-500/30 bg-white/90 px-3 text-xs font-bold text-teal-700 shadow-2xs transition-all hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-teal-300"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? '¡Copiado!' : 'Copiar código'}</span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
              Si estás en computador y tienes Instagram en tu celular, envía este código por DM a{' '}
              <strong>@wappy_ia</strong> y esta pantalla se desbloqueará sola.
            </p>
          </div>

          {/* Pasos 1 y 2 */}
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={handleFollowInstagram}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3.5 text-left transition-all duration-300 hover:bg-fuchsia-500/20 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <div className="text-xs font-extrabold text-fuchsia-800 dark:text-fuchsia-200 sm:text-sm">
                    Seguir a @wappy_ia en Instagram
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Abre nuestro perfil y toca el botón &ldquo;Seguir&rdquo;
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">
                <span>{step1Clicked ? 'Abierto ✓' : 'Seguir'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleSendDmInstagram}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-left transition-all duration-300 hover:bg-emerald-500/20 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                  2
                </span>
                <div>
                  <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 sm:text-sm">
                    Enviar &ldquo;{gateCode}&rdquo; por DM a @wappy_ia
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Copia el código automáticamente y abre el chat de verificación
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{step2Clicked ? 'DM Abierto ✓' : 'Enviar DM'}</span>
              </span>
            </button>
          </div>

          {/* Estado de verificación en tiempo real */}
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-2xl border p-3 text-xs ${
              statusType === 'warn'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                : statusType === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200'
            }`}
          >
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <div className="flex-1 leading-relaxed">
              {statusMessage ||
                `Verificación automática activa: en cuanto sigas a @wappy_ia y envíes "${gateCode}" por DM (o toques el botón que te responde nuestro bot en Instagram), entrarás directo.`}
            </div>
          </div>

          {/* Botón de verificación manual inmediata */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => checkVerificationNow(false)}
              disabled={isChecking}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/40 bg-[#c7f303] px-4 text-xs font-black uppercase tracking-wide text-[#0e1300] shadow-sm transition-all hover:brightness-95 active:scale-95 disabled:opacity-60 sm:text-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {isChecking
                  ? 'Verificando con Instagram (@wappy_ia)...'
                  : '✅ Ya seguí y envié el DM — Verificar ahora'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
