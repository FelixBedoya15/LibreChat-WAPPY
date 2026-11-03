import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import McpAntigravityModal from '~/components/SGSST/McpAntigravityModal';
import { WappyExpandButton } from '../WappyExpandButton';

export default function AntigravityMcpConnect() {
  const { token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [keyCount, setKeyCount] = useState<number>(0);
  const [daemonStatus, setDaemonStatus] = useState<{
    connected?: boolean;
    daemonListening?: boolean;
    userDaemonConnected?: boolean;
    activeListeners?: number;
    bridge?: {
      connected?: boolean;
      daemonListening?: boolean;
      userDaemonConnected?: boolean;
      activeListeners?: number;
      userListeners?: number;
    };
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/user-api-keys', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKeyCount(data.length);
        }
      })
      .catch(() => {});

    fetch('/api/studio/antigravity/status', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDaemonStatus(data);
      })
      .catch(() => {});
  }, [token, isOpen]);

  const isLiveConnected = Boolean(
    daemonStatus?.bridge?.userDaemonConnected ||
      daemonStatus?.bridge?.daemonListening ||
      daemonStatus?.bridge?.connected ||
      daemonStatus?.userDaemonConnected ||
      daemonStatus?.daemonListening ||
      daemonStatus?.connected,
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/10 transition-all hover:border-orange-500/40">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Antigravity & Agentes MCP
            </h4>
            {isLiveConnected && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Conectado en Vivo (Push SSE)
              </span>
            )}
            {keyCount > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> {keyCount} {keyCount === 1 ? 'clave activa' : 'claves activas'}
              </span>
            ) : !isLiveConnected ? (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                Disponible
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isLiveConnected
              ? 'Puente Reactivo Push SSE conectado en tiempo real con tu Google Antigravity local (0 ms de latencia).'
              : 'Conecta tu Antigravity personal para alimentar tu perfil de empresa, matriz GTC-45, PESV y cronograma de SST.'}
          </p>
        </div>
      </div>

      <WappyExpandButton
        variant="orange"
        onClick={() => setIsOpen(true)}
        icon={<Terminal className="w-4 h-4" />}
        label={isLiveConnected ? 'Gestionar MCP' : 'Configurar MCP'}
      />

      <McpAntigravityModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
