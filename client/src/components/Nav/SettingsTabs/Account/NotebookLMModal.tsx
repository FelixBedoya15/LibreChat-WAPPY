import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Clipboard,
  Lock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { ExpandableButton } from '~/components/Common/ExpandableButton';

interface NotebookLMStatus {
  connected?: boolean;
  isValid?: boolean;
  sessionExpired?: boolean;
  dbscBound?: boolean;
  dbscWarning?: string | null;
  email?: string;
  cookieCount?: number;
}

interface NotebookLMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const NotebookLMModal: React.FC<NotebookLMModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { token } = useAuthContext();
  const [status, setStatus] = useState<NotebookLMStatus | null>(null);
  const [savedDbscInfo, setSavedDbscInfo] = useState<{ bound: boolean; warning: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [copiedAg, setCopiedAg] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://app.wappy.club';
  const terminalCommand = `mkdir -p ~/.gemini/antigravity && curl -fsSL "${serverOrigin}/api/mcp-bridge/antigravity/daemon.js" -o ~/.gemini/antigravity/wappy-push-daemon.js && node ~/.gemini/antigravity/wappy-push-daemon.js --notebooklm --url="${serverOrigin}" --token="${token || ''}"`;
  const agCliCommand = `node ~/.gemini/antigravity/wappy-push-daemon.js --notebooklm --url="${serverOrigin}" --token="${token || ''}"`;
  const antigravityPrompt = `Ejecuta en la terminal mi conector local de WAPPY:\n\n\`\`\`bash\n${agCliCommand}\n\`\`\``;

  const notifyStatusUpdated = () => {
    onStatusChange?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wappy-notebooklm-updated', { detail: { refresh: true } }));
    }
  };

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const fetchStatus = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/notebooklm/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: NotebookLMStatus = await res.json();
        setStatus(data);
        if (!data?.connected || data?.dbscBound === false) {
          setSavedDbscInfo(null);
        }
      }
    } catch (e: any) {
      console.error('Error fetching NotebookLM status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSavedDbscInfo(null);
      fetchStatus();
      setFeedback(null);
    } else {
      clearPollTimer();
    }
    return () => {
      clearPollTimer();
    };
  }, [isOpen, token]);

  const handleCopyAg = async () => {
    try {
      await navigator.clipboard?.writeText(antigravityPrompt);
    } catch (_) {}
    setCopiedAg(true);
    setTimeout(() => setCopiedAg(false), 3000);
    const wasDbscBound = Boolean(status?.dbscBound === true || savedDbscInfo?.bound);
    try {
      const res = await fetch('/api/mcp-bridge/antigravity/launch-connector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service: 'notebooklm',
          token,
          originUrl: serverOrigin,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setFeedback({
          type: 'success',
          message:
            '✨ ¡Orden enviada directamente a tu computador! Se abrirá Chrome sin DBSC en unos segundos para vincular tu sesión de forma estable (también se copió el comando al portapapeles).',
        });
        clearPollTimer();
        let checks = 0;
        pollTimerRef.current = setInterval(async () => {
          checks += 1;
          if (checks > 12) {
            clearPollTimer();
            return;
          }
          try {
            const stRes = await fetch('/api/notebooklm/status', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (stRes.ok) {
              const stData: NotebookLMStatus = await stRes.json();
              setStatus(stData);
              if (stData?.connected && stData?.isValid !== false && (!wasDbscBound || stData?.dbscBound === false)) {
                if (stData?.dbscBound === false) {
                  setSavedDbscInfo(null);
                }
                notifyStatusUpdated();
                clearPollTimer();
              }
            }
          } catch (_) {}
        }, 3000);
        return;
      }
    } catch (_) {}
    setFeedback({
      type: 'success',
      message:
        '📋 ¡Comando limpio copiado! Pégalo en el chat de tu Google Antigravity o en tu Terminal para abrir el Conector Automático sin DBSC.',
    });
  };

  const handleCopyCmd = () => {
    try {
      navigator.clipboard?.writeText(terminalCommand);
    } catch (_) {}
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  const handleSaveManual = async () => {
    if (!manualJson?.trim()) {
      setFeedback({ type: 'error', message: 'Por favor pega el JSON o las cookies de sesión.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await fetch('/api/notebooklm/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ raw: manualJson, source: 'manual' }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        const hasDbsc = data?.dbscBound === true;
        const warningMsg =
          typeof data?.dbscWarning === 'string' && data.dbscWarning.trim()
            ? data.dbscWarning.trim()
            : null;
        if (hasDbsc) {
          setSavedDbscInfo({ bound: true, warning: warningMsg });
        } else {
          setSavedDbscInfo(null);
        }

        setFeedback({
          type: data?.isValid === false ? 'error' : hasDbsc ? 'warning' : 'success',
          message:
            data?.message ||
            (data?.isValid === false
              ? 'Las cookies guardadas están expiradas o inválidas. Usa el Conector Automático 1-Clic.'
              : '¡Sesión privada de NotebookLM vinculada con éxito!'),
        });
        if (data?.isValid !== false) {
          setManualJson('');
        }
        await fetchStatus();
        notifyStatusUpdated();
      } else {
        setFeedback({
          type: 'error',
          message: data?.error || data?.message || 'Error al guardar la sesión.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error de conexión: ' + (err?.message || 'Error desconocido') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReconnectAndRefresh = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setFeedback({
        type: 'info',
        message: '🔄 Verificando y sincronizando tu sesión con Google...',
      });
      const res = await fetch('/api/notebooklm/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        await fetchStatus();
        notifyStatusUpdated();
        setFeedback({
          type: 'success',
          message: data?.message || '✓ ¡Sesión sincronizada y activa!',
        });
      } else {
        await fetchStatus();
        await handleCopyAg();
      }
    } catch (_) {
      await handleCopyAg();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setFeedback({
        type: 'info',
        message: '🔍 Probando conexión en vivo con Google NotebookLM...',
      });
      const res = await fetch('/api/notebooklm/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setFeedback({
          type: 'success',
          message: data?.message || '✓ ¡Conexión privada con Google NotebookLM verificada con éxito!',
        });
        await fetchStatus();
        notifyStatusUpdated();
      } else {
        setFeedback({
          type: 'error',
          message:
            data?.reason ||
            data?.error ||
            data?.message ||
            'Aún no hay una sesión activa vinculada o la sesión expiró. Haz clic en Reconectar o usa la Opción A.',
        });
        await fetchStatus();
        notifyStatusUpdated();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al probar: ' + (err?.message || 'Error desconocido') });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('¿Seguro que deseas desvincular tu sesión privada de Google NotebookLM?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setFeedback(null);
      const res = await fetch('/api/notebooklm/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setSavedDbscInfo(null);
        setFeedback({
          type: 'info',
          message: 'Sesión privada desvinculada correctamente.',
        });
        await fetchStatus();
        notifyStatusUpdated();
      } else {
        setFeedback({ type: 'error', message: data?.error || 'Error al desvincular.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al desvincular: ' + (err?.message || 'Error desconocido') });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = Boolean(status?.connected);
  const isExpired = Boolean(status?.sessionExpired || (isConnected && status?.isValid === false));
  const isValid = isConnected && !isExpired;
  const isDbscBound = Boolean((isConnected && status?.dbscBound === true) || savedDbscInfo?.bound);
  const dbscWarningText =
    (typeof status?.dbscWarning === 'string' && status.dbscWarning.trim()) ||
    (typeof savedDbscInfo?.warning === 'string' && savedDbscInfo.warning.trim()) ||
    null;
  const displayEmail = status?.email?.trim() || 'tu cuenta privada de Google';

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 break-words">
                Google NotebookLM & Gemini Notebook (100% Privado)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 break-words">
                Vincula tu propia cuenta sin compartir tus cuadernos con correos externos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-2 min-w-[32px] shrink-0 flex items-center justify-center rounded-xl border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isExpired
                ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-rose-500/10 dark:from-amber-950/25 dark:to-rose-950/25'
                : isValid
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40'
            }`}
          >
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-start gap-3 w-full min-w-0">
                {isValid ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : isExpired ? (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-500/10 border border-slate-300/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h4
                      className={`text-xs font-bold break-words ${
                        isExpired
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    >
                      {isValid
                        ? 'Sesión Privada Activa'
                        : isExpired
                          ? 'Sesión expirada — Reconectar'
                          : 'Sin Vincular (Privacidad Total por Usuario)'}
                    </h4>
                    {isValid ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                        {status?.cookieCount || 0} cookies activas
                      </span>
                    ) : isExpired ? (
                      <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                        Sesión expirada
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-500/10 border border-slate-300/60 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                        Desconectado
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-1 break-words ${
                      isExpired
                        ? 'text-amber-900/90 dark:text-amber-200/90'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {isValid
                      ? `Conectado como: ${displayEmail}. Solo tú y tus agentes en tu sesión pueden consultar tus cuadernos.`
                      : isExpired
                        ? `Google expiró o rotó las credenciales de seguridad de tu navegador${status?.email?.trim() ? ` (${status.email.trim()})` : ''}. Reconecta con el Conector Automático 1-Clic para restablecer el acceso.`
                        : 'Tus cuadernos nunca se comparten con cuentas centrales. Vincula tu propio Google NotebookLM para que Tenshi consulte tus fuentes privadas.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 w-full">
                <ExpandableButton
                  size="sm"
                  variant={isExpired ? 'amber' : 'cyan'}
                  onClick={handleReconnectAndRefresh}
                  disabled={isLoading}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                  badge={isExpired ? 'Reconectar' : undefined}
                  label={isExpired ? 'Conector Automático 1-Clic' : 'Reconectar'}
                  title={isExpired ? 'Sesión expirada — Reconectar sesión' : 'Reconectar / Actualizar sesión'}
                />

                <ExpandableButton
                  size="sm"
                  variant="teal"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  icon={<CheckCircle2 className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse' : ''}`} />}
                  label={isTesting ? 'Probando...' : 'Probar'}
                  title="Probar sesión en vivo con Google"
                />

                {isConnected && (
                  <ExpandableButton
                    size="sm"
                    variant="danger"
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label="Desvincular"
                    title="Desvincular sesión"
                  />
                )}
              </div>
            </div>
          </div>

          {/* DBSC Temporary Cookie Lock Warning Banner (Grupo 8) */}
          {isDbscBound && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex flex-col items-start gap-2.5">
              <div className="flex items-start gap-2.5 w-full min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold leading-snug break-words">
                    Cookies con bloqueo temporal DBSC de Chrome (~1 hora)
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90 break-words">
                    Estas cookies están vinculadas al dispositivo en Chrome (DBSC) y pueden caducar en ~1 hora. Te recomendamos usar el{' '}
                    <strong className="font-bold">Conector Automático 1-Clic</strong> (que abre Chrome sin DBSC) para mantener tu sesión estable durante meses.
                  </p>
                  {dbscWarningText && (
                    <p className="text-[10px] leading-snug text-amber-700/90 dark:text-amber-300/85 break-words">
                      {dbscWarningText}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 w-full">
                <ExpandableButton
                  size="sm"
                  variant="amber"
                  onClick={handleCopyAg}
                  icon={copiedAg ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  badge="1-Clic"
                  label={copiedAg ? '¡Conector lanzado!' : 'Conector Automático (sin DBSC)'}
                  title="Lanzar Conector Automático 1-Clic (abre Chrome sin DBSC)"
                />
              </div>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 break-words ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 dark:text-emerald-300'
                  : feedback.type === 'error'
                    ? 'bg-rose-500/10 text-rose-800 border border-rose-500/30 dark:text-rose-300'
                    : feedback.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-800 border border-amber-500/30 dark:text-amber-200'
                      : 'bg-blue-500/10 text-blue-800 border border-blue-500/30 dark:text-blue-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : feedback.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="min-w-0 flex-1 break-words">{feedback.message}</span>
            </div>
          )}

          {/* Opción 1: Vinculación Directa desde PC / Antigravity (Sin instalar extensión) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/10 space-y-3">
            <div className="flex flex-col items-start gap-3">
              <div className="w-full min-w-0">
                <span className="inline-block text-[10px] font-extrabold tracking-wide uppercase text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Opción A &bull; Conector Automático 1-Clic (Sin DBSC)
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 break-words">
                  Vinculación Directa desde tu PC o Antigravity
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 break-words">
                  Abre una ventana segura de Chrome sin bloqueo DBSC en tu computador, detecta tu NotebookLM y mantiene tu sesión estable durante meses.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2.5 w-full">
                <ExpandableButton
                  size="md"
                  variant="purple"
                  onClick={handleCopyAg}
                  icon={copiedAg ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  badge="1-Clic"
                  label={copiedAg ? '¡Copiado para Antigravity!' : 'Conector Automático 1-Clic'}
                  title="Lanzar o copiar instrucción del Conector Automático 1-Clic para Antigravity"
                />

                <ExpandableButton
                  size="md"
                  variant="fuchsia"
                  onClick={handleCopyCmd}
                  icon={copiedCmd ? <Check className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                  label={copiedCmd ? '¡Comando Copiado!' : 'Copiar Comando Terminal'}
                  title="Copiar comando para Terminal"
                />
              </div>
            </div>
          </div>

          {/* Opción 2: Extensión WAPPY Connect */}
          <div className="p-4 sm:p-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/10 space-y-3">
            <div className="flex flex-col items-start gap-3">
              <div className="w-full min-w-0">
                <span className="inline-block text-[10px] font-extrabold tracking-wide uppercase text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-md">
                  Opción B &bull; Extensión de Navegador
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 break-words">
                  Extensión Oficial WAPPY Connect (Chrome / Brave / Edge)
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 break-words">
                  Vincula tu sesión privada desde el navegador con un solo clic.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2.5 w-full">
                <a
                  href="/extension/wappy-connect.zip"
                  download="wappy-connect.zip"
                  title="Descargar Extensión (.zip)"
                  className="wappy-expand-btn group relative flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shrink-0"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide">Descargar Extensión (.zip)</span>
                  </div>
                  <span className="sm:hidden text-xs font-bold ml-1.5">Descargar (.zip)</span>
                </a>
              </div>
            </div>

            {/* Pasos de instalación */}
            <div className="pt-2 border-t border-teal-500/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 dark:text-zinc-400">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">1. Descomprime</div>
                Descarga el archivo ZIP y descomprímelo en una carpeta de tu equipo.
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">2. Carga en Chrome</div>
                Entra a <code className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">chrome://extensions</code>, activa <strong>Modo de desarrollador</strong> y presiona <strong>Cargar descomprimida</strong>.
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">3. Vincula en 1 Clic</div>
                Abre la extensión y haz clic en <strong>"Vincular con WAPPY"</strong>. ¡Listo!
              </div>
            </div>
          </div>

          {/* Opción 3: Pegar Manualmente (Acordeón) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 space-y-3">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-teal-600 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clipboard className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">Opción C: Pegar Clave o JSON de Cookies Manualmente</span>
              </div>
              {showManual ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
            </button>

            {showManual && (
              <div className="pt-2 space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 break-words">
                  Si copiaste tus cookies desde otro navegador o extensión (como Cookie-Editor), pega el contenido aquí:
                </p>

                <textarea
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='Pega aquí el JSON de cookies (ej. [{"name": "__Secure-1PSID", "value": "..."}, ...])'
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-3 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex flex-wrap items-center justify-start gap-2">
                  <ExpandableButton
                    size="md"
                    variant="teal"
                    onClick={handleSaveManual}
                    disabled={isSaving}
                    icon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    label={isSaving ? 'Guardando...' : 'Guardar y Vincular'}
                    title="Guardar y Vincular"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-6 py-3.5 bg-slate-50/50 dark:bg-zinc-900/50">
          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            <span>Abrir mi Google NotebookLM</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <ExpandableButton
            size="md"
            variant="neutral"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
            label="Cerrar"
            title="Cerrar"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotebookLMModal;
