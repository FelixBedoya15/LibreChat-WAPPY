import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import McpAntigravityModal from '~/components/SGSST/McpAntigravityModal';

export default function AntigravityMcpConnect() {
  const { token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [keyCount, setKeyCount] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    fetch('/api/user-api-keys', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKeyCount(data.length);
        }
      })
      .catch(() => {});
  }, [token, isOpen]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/10 transition-all hover:border-orange-500/40">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Antigravity & Agentes MCP
            </h4>
            {keyCount > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> {keyCount} {keyCount === 1 ? 'clave activa' : 'claves activas'}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                Disponible
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Conecta tu Antigravity personal para alimentar tu perfil de empresa, matriz GTC-45, PESV y cronograma de SST.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
      >
        <Terminal className="w-4 h-4" />
        <span>Configurar MCP</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
      </button>

      <McpAntigravityModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
