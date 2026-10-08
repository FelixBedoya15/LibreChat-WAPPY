import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const isConnected = status?.connected && !status?.usingDefault;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/10 transition-all hover:border-teal-500/40">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Google NotebookLM & Gemini Notebook
            </h4>
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Privado Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Cuenta Central Activa
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isConnected
              ? `Tus agentes consultan tus fuentes privadas en Google (${status?.email || 'Cuenta conectada'}).`
              : 'Vincula tu cuenta en 1 clic con la extensión WAPPY Connect para acceder a tus cuadernos personales.'}
          </p>
        </div>
      </div>

      <WappyExpandButton
        variant="teal"
        onClick={() => setIsOpen(true)}
        icon={<Sparkles className="w-4 h-4" />}
        label={isConnected ? 'Gestionar Sesión' : 'Vincular en 1 Clic'}
      />

      <NotebookLMModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStatusChange={fetchStatus}
      />
    </div>
  );
}
