import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Clapperboard,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Sparkles,
  Copy,
  Check,
  Key,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

interface GoogleFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const GoogleFlowModal: React.FC<GoogleFlowModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { token } = useAuthContext();
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [copiedAg, setCopiedAg] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://app.wappy.club';
  const terminalCommand = `curl -sL "${serverOrigin}/api/googleflow/connect-script?token=${token || ''}" | node`;
  const antigravityPrompt = `Por favor ejecuta este comando en mi terminal para vincular mi cuenta privada de Google Flow / Studio con WAPPY:\n\n\`\`\`bash\n${terminalCommand}\n\`\`\``;

  const fetchStatus = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/googleflow/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      console.error('Error fetching Google Flow status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedback(null);
    }
  }, [isOpen, token]);

  const handleCopyAg = () => {
    navigator.clipboard.writeText(antigravityPrompt);
    setCopiedAg(true);
    setTimeout(() => setCopiedAg(false), 3000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setFeedback({ type: 'error', message: 'Por favor ingresa tu API Key de Google AI Studio.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: apiKeyInput.trim(), source: 'api_key' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: '¡API Key de Google guardada con éxito!',
        });
        setApiKeyInput('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Error al guardar la clave API.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error de conexión: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualJson.trim()) {
      setFeedback({ type: 'error', message: 'Por favor pega el JSON o las cookies de sesión.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ raw: manualJson, source: 'manual' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || '¡Sesión de Google Flow vinculada con éxito!',
        });
        setManualJson('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Error al guardar la sesión.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error de conexión: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || '✓ ¡Conexión con Google Flow verificada con éxito!',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.reason || 'La sesión no superó la prueba.',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al probar: ' + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('¿Seguro que deseas desvincular tu sesión de Google Flow?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'info',
          message: 'Sesión desvinculada correctamente.',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al desvincular.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al desvincular: ' + err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = Boolean(status?.connected);
  const isValid = status?.isValid !== false;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Google Flow & Studio (Veo & Imagen — 100% Privado)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Vincula tu propia cuenta para generar vídeos cinematográficos e imágenes fotorrealistas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 px-2 min-w-[32px] flex items-center justify-center rounded-xl border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isConnected && isValid ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : isConnected && !isValid ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {isConnected && isValid
                        ? 'Sesión de Google Flow Activa'
                        : isConnected && !isValid
                        ? 'Sesión de Google Expirada'
                        : 'Sin Vincular (Privacidad Total por Usuario)'}
                    </h4>
                    {isConnected && isValid ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                        {status?.hasApiKey ? 'API Key activa' : `${status?.cookieCount || 0} cookies activas`}
                      </span>
                    ) : isConnected && !isValid ? (
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        Requiere actualizar
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-500/10 border border-slate-300/60 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                        Desconectado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isConnected && isValid
                      ? `Conectado como: ${status.email}. Tus agentes y Tenshi pueden generar vídeos con Veo e imágenes con Imagen directamente.`
                      : isConnected && !isValid
                      ? 'Google rotó las credenciales de tu navegador. Vuelve a vincular abajo en 1 clic.'
                      : 'Vincula tu cuenta privada de Google para habilitar generación de vídeos e imágenes multimedia.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={isLoading}
                  className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Actualizar estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-xs font-bold tracking-wide">Estado</span>
                  </div>
                </button>

                {isConnected && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Probar sesión"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isTesting ? 'animate-pulse' : ''}`} />
                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                        <span className="text-xs font-bold tracking-wide">{isTesting ? 'Probando...' : 'Probar'}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteSession}
                      disabled={isDeleting}
                      className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Desvincular cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                        <span className="text-xs font-bold tracking-wide">Desvincular</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                  : 'bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {feedback.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Opción 1: Antigravity / Terminal 1-Clic */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Método 1: Vinculación Automática 1-Clic (Recomendado)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                Automático
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Abre una ventana segura de Google Flow en tu navegador local, detecta tu sesión privada y la sincroniza con WAPPY sin configuraciones manuales:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 text-zinc-100 border border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-2 truncate">
                  <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{terminalCommand}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-sans text-[10px] font-bold shrink-0 transition-colors"
                >
                  {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCmd ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyAg}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  {copiedAg ? '¡Instrucción copiada para Antigravity!' : 'Copiar instrucción para Antigravity'}
                </button>
              </div>
            </div>
          </div>

          {/* Opción 2: API Key de Google AI Studio */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Método 2: Google AI Studio API Key (Alternativo)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                Directo API
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Si prefieres usar una clave de API directa de Google AI Studio para invocar Veo e Imagen sin depender de la sesión web:
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={isSaving || !apiKeyInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Key'}
              </button>
            </div>
          </div>

          {/* Opción 3: Manual JSON (Acordeón) */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 text-[10px] font-bold text-white">
                  3
                </span>
                <span>Método 3: Pegado Manual de Cookies JSON (Avanzado)</span>
              </div>
              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManual && (
              <div className="p-4 pt-1 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Pega aquí el JSON exportado de tus cookies de Google (debe incluir <code className="text-purple-600 font-mono">SID</code> y <code className="text-purple-600 font-mono">__Secure-1PSID</code>):
                </p>
                <textarea
                  rows={4}
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='[{"name": "SID", "value": "..."}, {"name": "__Secure-1PSID", "value": "..."}]'
                  className="w-full p-2.5 text-[11px] font-mono rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveManual}
                    disabled={isSaving || !manualJson.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cookies'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modelos disponibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Google Imagen</h5>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Generación fotorrealista de imágenes, afiches de seguridad y portadas de cursos en alta resolución.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Google Veo</h5>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Generación de vídeo cinematográfico a 1080p, tomas de apoyo y clips de simulacros para Tenshi y chats.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-zinc-800/80 px-6 py-3.5 bg-slate-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            Conexión aislada por usuario &bull; Cifrada en base de datos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GoogleFlowModal;
