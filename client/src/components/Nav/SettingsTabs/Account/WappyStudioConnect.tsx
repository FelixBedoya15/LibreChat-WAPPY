import React, { useState, useEffect } from 'react';
import { Clapperboard, Sparkles, CheckCircle2, ExternalLink, Bot } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { WappyStudioIntegrationModal } from '~/components/SGSST/WappyStudioIntegrationView';
import { WappyExpandButton } from '../WappyExpandButton';

export default function WappyStudioConnect() {
  const { token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
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

    fetch('/api/studio/antigravity/status', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDaemonStatus(data);
      })
      .catch(() => {});

    fetch('/api/mcp-bridge/antigravity/ping', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.daemonListening || data.userDaemonConnected)) {
          setDaemonStatus((prev) => ({
            ...prev,
            daemonListening: data.daemonListening,
            userDaemonConnected: data.userDaemonConnected,
          }));
        }
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-lime-500/5 dark:from-teal-950/15 dark:to-emerald-950/10 transition-all hover:border-teal-500/45">
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0E1300] shadow-md shadow-teal-500/20 shrink-0 border border-[#C7F303]/40"
          style={{ background: 'linear-gradient(135deg, #0D9488 0%, #C7F303 100%)' }}
        >
          <Clapperboard className="w-5 h-5 text-white drop-shadow-sm" />
        </div>
        <div>
          <div className="flex items-center flex-wrap gap-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Wappy Studio & Subagentes de Video
            </h4>
            {isLiveConnected && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Conectado en Vivo
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-lg">
              <Bot className="w-3 h-3" /> 4 Subagentes Activos
            </span>
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-lg">
              <Sparkles className="w-3 h-3" /> 7 Skills + Efectos XL
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isLiveConnected
              ? 'Escuadrón de 4 Subagentes (Efectos XL + Wappy Podcast 24kHz + Animación 60-FPS + Render MP4) enlazado con tu Antigravity.'
              : 'Instala en 1 clic los 4 Subagentes Especialistas y las 7 Skills Oficiales de Video (Modo Móvil XL 1080×1920) en tu Antigravity.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <WappyExpandButton
          variant="emerald"
          onClick={() => window.open('/wappystudio', '_blank')}
          icon={<ExternalLink className="w-4 h-4" />}
          label="Abrir Wappy Studio"
        />
        <WappyExpandButton
          variant="teal"
          onClick={() => setIsOpen(true)}
          icon={<Sparkles className="w-4 h-4" />}
          label={isLiveConnected ? 'Subagentes & Skills' : 'Configurar'}
        />
      </div>

      <WappyStudioIntegrationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
