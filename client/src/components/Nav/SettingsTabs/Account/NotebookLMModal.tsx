import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clipboard,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

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
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showManual, setShowManual] = useState(false);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/notebooklm/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      console.error('Error fetching NotebookLM status:', e);
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

  const handleSaveManual = async () => {
    if (!manualJson.trim()) {
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
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || '¡Sesión de NotebookLM vinculada con éxito!',
        });
        setManualJson('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || data.message || 'Error al guardar la sesión.',
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
      const res = await fetch('/api/notebooklm/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || '✓ ¡Conexión con Google NotebookLM verificada con éxito!',
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data.reason || data.message || 'La sesión no superó la prueba con Google.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al probar: ' + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('¿Seguro que deseas desvincular tu sesión? Tus consultas volverán a usar el perfil central compartido de WAPPY.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setFeedback(null);
      const res = await fetch('/api/notebooklm/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'info',
          message: 'Sesión desvinculada. Ahora se utiliza el perfil central de WAPPY.',
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Google NotebookLM & Gemini Notebook
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Conecta tus cuadernos de estudio, matrices y fuentes documentales con tus agentes de IA.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {status?.connected && !status?.usingDefault ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {status?.connected && !status?.usingDefault
                        ? 'Sesión Privada Conectada'
                        : 'Perfil Central Compartido'}
                    </h4>
                    {status?.connected && !status?.usingDefault ? (
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        {status?.cookieCount || 0} cookies activas
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                        Por Defecto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {status?.connected && !status?.usingDefault
                      ? `Conectado como: ${status.email}. Tus agentes consultan tus cuadernos privados directamente.`
                      : 'Actualmente tus agentes consultan cuadernos compartidos con la cuenta central de WAPPY.'}
                  </p>
                </div>
              </div>

              {status?.connected && !status?.usingDefault && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                    title="Probar sesión con Google"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Probando...' : 'Probar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 active:scale-95 transition-all"
                    title="Desvincular sesión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Desvincular</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Método 1: Extensión WAPPY Connect */}
          <div className="p-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold tracking-wide uppercase text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-md">
                  Método Recomendado &bull; 1 Clic
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5">
                  Extensión Oficial WAPPY Connect
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Sin abrir herramientas de desarrollador ni copiar cookies a mano.
                </p>
              </div>

              <a
                href="/extension/wappy-connect.zip"
                download="wappy-connect.zip"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-600/20 transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Extensión (.zip)</span>
              </a>
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

          {/* Método 2: Pegar Manualmente (Acordeón) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 space-y-3">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-teal-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-slate-500" />
                <span>Método Alternativo: Pegar Clave o JSON de Cookies</span>
              </div>
              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManual && (
              <div className="pt-2 space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Si copiaste las cookies desde la extensión WAPPY Connect en otro dispositivo o desde Cookie-Editor, pega el contenido a continuación:
                </p>

                <textarea
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='Pega aquí el JSON de cookies (ej. [{"name": "__Secure-1PSID", "value": "..."}, ...])'
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-3 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveManual}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>{isSaving ? 'Guardando...' : 'Guardar y Vincular'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-zinc-800/80 px-6 py-3.5 bg-slate-50/50 dark:bg-zinc-900/50">
          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            <span>Ir a Google NotebookLM</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotebookLMModal;
