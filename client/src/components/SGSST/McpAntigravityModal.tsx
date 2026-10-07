import React from 'react';
import ReactDOM from 'react-dom';
import { X, Cpu } from 'lucide-react';
import McpAntigravityView from './McpAntigravityView';

interface McpAntigravityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpAntigravityModal: React.FC<McpAntigravityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Conectar mi Perfil con Antigravity (MCP)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Alimenta tu empresa, GTC-45, PESV y cronograma de SST de forma autónoma.
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
        <div className="flex-1 overflow-y-auto p-6">
          <McpAntigravityView onClose={onClose} isModal={true} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200/80 dark:border-zinc-800/80 px-6 py-3 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default McpAntigravityModal;
