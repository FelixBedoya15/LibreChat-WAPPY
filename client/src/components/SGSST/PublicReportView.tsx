import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer, Copy, Check, ShieldCheck } from 'lucide-react';

const PublicReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`/api/public-report/${id}`);
        setContent(response.data.content);
        if (response.data.fileName) {
          setFileName(response.data.fileName);
          document.title = `${response.data.fileName.replace(/_/g, ' ')} | WAPPY`;
        }
      } catch (err) {
        console.error('Error fetching public report:', err);
        setError('El informe no existe o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-3"></div>
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Cargando informe oficial...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="text-amber-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Informe No Encontrado</h1>
        <p className="text-slate-600 text-center max-w-md text-sm">
          {error || 'No se pudo cargar el informe solicitado.'}
        </p>
      </div>
    );
  }

  return (
    <div className="public-report-viewer bg-white min-h-screen relative text-slate-800">
      <style>{`
        /* Overwrite any global app styles for the public view */
        html, body {
          background-color: #ffffff !important;
          color: #1e293b !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        #root {
          max-width: none !important;
          width: 100% !important;
          background-color: #ffffff !important;
          color: #1e293b !important;
        }
        .public-report-viewer {
          color: #1e293b !important;
        }
        @media print {
          .print-hidden-bar {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Action Bar (Pill style following WAPPY design system) */}
      <aside 
        aria-label="Acciones del informe"
        className="print-hidden-bar fixed top-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 shadow-xl transition-all"
      >
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900/30">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Documento Oficial</span>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
          title="Copiar enlace para compartir"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-bold">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
              <span>Copiar Enlace</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
          title="Imprimir o guardar como PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / PDF</span>
        </button>
      </aside>

      <main 
        className="public-report-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
};

export default PublicReportView;
