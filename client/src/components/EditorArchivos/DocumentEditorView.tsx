import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import LiveEditor, { LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

const DocumentEditorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [docTitle, setDocTitle] = useState('Cargando documento...');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<LiveEditorHandle>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/live/documents/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data) {
          setDocTitle(data.title);
          setContent(data.content);
          // Auto-inject to editor if it mounts after ref is ready, though LiveEditor handles initialContent on mount
          if (editorRef.current && data.content) {
            editorRef.current.setHTML(data.content);
          }
        }
      } catch (err) {
        console.error('Error fetching doc', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (token && id) fetchDoc();
  }, [id, token]);

  const handleUpdate = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/live/documents/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: docTitle, content }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      showToast({ message: 'Documento guardado correctamente.', status: 'success' });
    } catch (err) {
      showToast({ message: 'Hubo un error al guardar el documento.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center p-8 bg-surface-primary"><span className="animate-spin text-3xl">⏳</span></div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-primary dark:bg-zinc-900">
      <div className="flex shrink-0 items-center justify-between border-b border-border-light bg-surface-secondary px-4 py-3 dark:border-border-medium shadow-sm">
        <div className="flex items-center gap-3 w-1/2">
          <button 
            onClick={() => navigate('/editor-archivos')}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-primary border border-border-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title="Volver"
          >
            <ChevronLeft size={18} />
          </button>
          
          <input 
            type="text" 
            className="flex-1 bg-transparent border border-transparent hover:border-border-medium focus:border-[#10b981] rounded px-2 py-1 text-lg font-semibold text-text-primary outline-none transition-colors"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Título del documento"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2 font-semibold text-white shadow-md transition-all sm:hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSaving ? <span className="animate-spin text-sm">⏳</span> : <Save size={18} />} 
            Guardar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* We pass initialContent, and the editor takes full height inside its container */}
        <LiveEditor
          ref={editorRef}
          initialContent={content}
          onUpdate={handleUpdate}
          onSave={handleSave}
          reportType="general"
          paperMode={false}
        />
      </div>

      {/* Upgrade Modal (Freemium Teaser) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setShowUpgradeModal(false)} 
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
                >
                    Cerrar ✕
                </button>
                <div className="bg-surface-primary rounded-3xl shadow-2xl overflow-hidden">
                    <UpgradeWall
                        title="Exportación Bloqueada"
                        description="El guardado y exportación de archivos enriquecidos por IA está reservado para cuentas PREMIUM."
                        plan="USER_PRO"
                        isCompact={true}
                        hideFeatures={true}
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorView;
