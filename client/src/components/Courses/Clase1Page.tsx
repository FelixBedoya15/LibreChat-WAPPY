import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Clase1Page() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f8fafc]">
      {/* Floating Back button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/tienda');
          }
        }}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-700 shadow-md text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
        title="Volver a WAPPY"
      >
        <ArrowLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span>Volver</span>
      </button>

      <iframe
        src="/clase1.html"
        title="Clase 1: Google Antigravity & Ecosistema Autónomo SST · WAPPY IA"
        className="h-full w-full border-0"
      />
    </div>
  );
}
