import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, FileText, Plus, Trash2, Calendar, FileType } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

interface LiveDocument {
  _id: string;
  title: string;
  originalFileType: string;
  createdAt: string;
  updatedAt: string;
}

const EditorArchivosDashboard = () => {
  const [documents, setDocuments] = useState<LiveDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/live/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents', err);
    }
  };

  useEffect(() => {
    if (token) fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setError('Solo se permiten archivos .pdf y .docx');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1. Extract content
      const formData = new FormData();
      formData.append('file', file);

      const extractRes = await fetch('/api/live/documents/extract', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error || 'Error al extraer');

      // 2. Save extracted content as a new document
      // If PDF, we pass the text as content but wrap it in basic HTML if it comes raw.
      const escapeHtml = (unsafeText: string) => {
          return unsafeText
               .replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
      };
      
      let finalContent = extractData.html || `<div class="pdf-text-container">${escapeHtml(extractData.text || '').replace(/\n/g, '<br/>')}</div>`;
      
      const saveRes = await fetch('/api/live/documents', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: extractData.fileName || file.name,
          content: finalContent,
          originalFileName: file.name,
          originalFileType: extractData.type || (file.name.endsWith('.pdf') ? 'pdf' : 'docx')
        }),
      });

      const savedData = await saveRes.json();
      if (!saveRes.ok) throw new Error(savedData.error || 'Error al guardar');

      // 3. Navigate to editor
      navigate(`/editor-archivos/${savedData._id}`);

    } catch (err: any) {
      setError(err.message || 'Error durante la carga');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar este documento?')) return;
    try {
      const res = await fetch(`/api/live/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error('Error deleting', err);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary dark:bg-gray-900">
      {!isPro ? (
        <div className="flex-1 overflow-y-auto bg-surface-secondary flex justify-center items-start px-4 py-8">
          <UpgradeWall
            title="Plan Premium Exclusivo"
            description="El Editor de Archivos es una poderosa herramienta exclusiva para planes PREMIUM. Permite importar documentos Word y PDF extrayendo todo el texto y formato para ser editado con nuestra IA predictiva."
            plan="USER_PRO"
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-text-primary">
              <FileEditIcon /> Editor de Archivos Texturizado
            </h1>
            <p className="mt-2 text-text-secondary">
              Sube un documento Word (DOCX) o PDF. El sistema extraerá el texto respetando los formatos, listas y títulos, y lo preparará para edición enriquecida con IA.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 dark:bg-red-900/30 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-10 w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#10b981]/50 bg-surface-secondary transition-colors hover:bg-surface-hover">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center p-12">
            <div className="mb-4 rounded-full bg-[#10b981]/20 p-4 text-[#10b981]">
               {isUploading ? <span className="animate-spin text-2xl">⏳</span> : <FileUp size={40} />}
            </div>
            <p className="mb-2 text-lg font-semibold text-text-primary">
              {isUploading ? 'Procesando archivo...' : 'Haz clic para cargar un nuevo archivo'}
            </p>
            <p className="text-sm text-text-secondary">Soporta formatos .docx y .pdf</p>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-text-primary">Historial de Documentos</h2>
        
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border-medium bg-surface-secondary py-16">
            <FileText size={48} className="mb-4 text-text-tertiary" />
            <p className="text-text-secondary">Aún no tienes documentos en tu historial.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(doc => (
              <div 
                key={doc._id}
                onClick={() => navigate(`/editor-archivos/${doc._id}`)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-[#10b981]/50 hover:shadow-md dark:border-border-medium"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-surface-secondary p-2.5 text-[#10b981] group-hover:bg-[#10b981]/10">
                    <FileText size={20} />
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, doc._id)}
                    className="rounded-lg p-2 text-text-tertiary opacity-0 transition-opacity hover:bg-red-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="mb-1 line-clamp-2 text-base font-semibold text-text-primary group-hover:text-[#10b981] transition-colors">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 uppercase"><FileType size={12} /> {doc.originalFileType || 'doc'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        </div>
      )}
    </div>
  );
};

// Helper component
const FileEditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10b981]">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"/>
  </svg>
);

export default EditorArchivosDashboard;
