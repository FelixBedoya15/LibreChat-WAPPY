import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import NotebookLMModal from './NotebookLMModal';
import { WappyExpandButton } from '../WappyExpandButton';

export default function NotebookLMConnect() {
  const { token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = () => {
    if (!token) return;
    fetch('/api/notebooklm/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
  }, [token, isOpen]);

  const isConnected = Boolean(status?.connected);
  const isValid = status?.isValid !== false;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/10 transition-all hover:border-teal-500/40">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Google NotebookLM & Gemini Notebook
            </h4>
            {isConnected && isValid ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Conectado (Privado)
              </span>
            ) : isConnected && !isValid ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                <AlertTriangle className="w-3 h-3" /> Sesión Expirada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-500/10 border border-slate-300/60 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                <Lock className="w-3 h-3" /> Sin vincular &bull; 100% Privado
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isConnected && isValid
              ? `Tus agentes consultan únicamente tus cuadernos privados en Google (${status?.email || 'Cuenta vinculada'}).`
              : isConnected && !isValid
              ? 'Tu sesión de Google expiró. Haz clic en Actualizar Sesión para revincular tu cuenta.'
              : 'Conecta tu propio Google NotebookLM de forma 100% privada (sin compartir tus cuadernos con nadie).'}
          </p>
        </div>
      </div>

      <WappyExpandButton
        variant={isConnected && !isValid ? 'amber' : 'teal'}
        onClick={() => setIsOpen(true)}
        icon={<Sparkles className="w-4 h-4" />}
        label={
          isConnected && isValid
            ? 'Gestionar Sesión'
            : isConnected && !isValid
            ? 'Actualizar Sesión'
            : 'Vincular Mi Cuenta'
        }
      />

      <NotebookLMModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStatusChange={fetchStatus}
      />
    </div>
  );
}
