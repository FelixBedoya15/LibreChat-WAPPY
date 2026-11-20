import React, { useState, useEffect, useCallback } from 'react';
import { Clapperboard, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import GoogleFlowModal from './GoogleFlowModal';
import { WappyExpandButton } from '../WappyExpandButton';

export default function GoogleFlowConnect() {
  const { token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = useCallback(() => {
    if (!token) return;
    const companyId = localStorage.getItem('wappy_active_company_id') || '';
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    fetch(`/api/googleflow/status${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, isOpen]);

  useEffect(() => {
    const handleFlowAuthExpired = () => {
      setStatus((prev: any) => ({ ...(prev || {}), connected: true, isValid: false, sessionExpired: true }));
    };
    const handleFlowUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (
        custom?.detail?.authExpired === true ||
        custom?.detail?.sessionExpired === true ||
        custom?.detail?.isValid === false
      ) {
        handleFlowAuthExpired();
        return;
      }
      fetchStatus();
    };
    window.addEventListener('wappy-company-changed', fetchStatus);
    window.addEventListener('wappy-empresa-cambiada', fetchStatus);
    window.addEventListener('wappy-googleflow-updated', handleFlowUpdated);
    window.addEventListener('wappy-googleflow-auth-expired', handleFlowAuthExpired);
    window.addEventListener('googleflow_auth_expired', handleFlowAuthExpired);
    window.addEventListener('wappy-notebooklm-auth-expired', fetchStatus);
    window.addEventListener('notebooklm_auth_expired', fetchStatus);
    return () => {
      window.removeEventListener('wappy-company-changed', fetchStatus);
      window.removeEventListener('wappy-empresa-cambiada', fetchStatus);
      window.removeEventListener('wappy-googleflow-updated', handleFlowUpdated);
      window.removeEventListener('wappy-googleflow-auth-expired', handleFlowAuthExpired);
      window.removeEventListener('googleflow_auth_expired', handleFlowAuthExpired);
      window.removeEventListener('wappy-notebooklm-auth-expired', fetchStatus);
      window.removeEventListener('notebooklm_auth_expired', fetchStatus);
    };
  }, [fetchStatus]);

  const isConnected = Boolean(status?.connected);
  const isExpired = Boolean(status?.sessionExpired || (isConnected && status?.isValid === false));
  const isValid = isConnected && !isExpired;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/10 transition-all hover:border-purple-500/40">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
          <Clapperboard className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Google Flow & Studio (Veo & Imagen)
            </h4>
            {isValid ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Conectado (Privado)
              </span>
            ) : isExpired ? (
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
            {isValid
              ? `Tus agentes y Tenshi generan imágenes con Imagen y vídeos con Veo (${status?.email || 'Cuenta vinculada'}).`
              : isExpired
              ? 'Tu sesión de Google expiró. Haz clic en Actualizar Sesión para revincular tu cuenta.'
              : 'Conecta tu cuenta para generar imágenes fotorrealistas con Imagen y vídeos con Google Veo en chats y Tenshi.'}
          </p>
        </div>
      </div>

      <WappyExpandButton
        variant={isExpired ? 'orange' : 'gradient-orange'}
        onClick={() => setIsOpen(true)}
        icon={<Sparkles className="w-4 h-4" />}
        label={
          isValid
            ? 'Gestionar Sesión'
            : isExpired
            ? 'Actualizar Sesión'
            : 'Vincular Mi Cuenta'
        }
      />

      <GoogleFlowModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStatusChange={fetchStatus}
      />
    </div>
  );
}
