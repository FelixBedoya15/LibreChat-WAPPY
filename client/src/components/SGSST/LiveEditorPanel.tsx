import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import {
  FileEdit,
  Upload,
  Maximize2,
  Minimize2,
  Trash2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ExportDropdown from './ExportDropdown';
import store from '~/store';

interface LiveEditorPanelProps {
  conversationId: string | null;
}

const POLL_INTERVAL_MS = 2500;

const LiveEditorPanel: React.FC<LiveEditorPanelProps> = ({ conversationId }) => {
  const { token } = useAuthContext();

  const [content, setContent] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Documento sin título');
  const [editorKey, setEditorKey] = useState<string>(() => Date.now().toString());
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const lastUpdatedAtRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track whether agent is actively submitting (same Recoil atom used by IPEVAR)
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));

  // ── Fetch document from backend ─────────────────────────────────────────
  const fetchDocument = useCallback(async (isInitial = false) => {
    if (!conversationId || conversationId === 'new') return;
    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch(`/api/live-editor/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Only update the editor if the backend has a newer version
      if (data.contentUpdatedAt && data.contentUpdatedAt !== lastUpdatedAtRef.current) {
        lastUpdatedAtRef.current = data.contentUpdatedAt;
        setContent(data.content || '');
        setFileName(data.fileName || 'Documento sin título');
        // Bump key to force LiveEditor to remount with new content
        setEditorKey(Date.now().toString());
      }
    } catch (e) {
      console.error('[LiveEditorPanel] Fetch error:', e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [conversationId, token]);

  // Initial load
  useEffect(() => {
    fetchDocument(true);
  }, [fetchDocument]);

  // Polling while agent is submitting or 10s after
  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;
    const interval = setInterval(() => fetchDocument(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, fetchDocument, isSubmitting]);

  // ── Save updated content (from user editing) ────────────────────────────
  const handleSave = useCallback(async () => {
    if (!conversationId || conversationId === 'new') return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/live-editor/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editorContent || content, fileName }),
      });
      if (res.ok) {
        const data = await res.json();
        lastUpdatedAtRef.current = data.contentUpdatedAt;
      }
    } catch (e) {
      console.error('[LiveEditorPanel] Save error:', e);
    } finally {
      setIsSaving(false);
    }
  }, [conversationId, token, editorContent, content, fileName]);

  // ── Clear document ───────────────────────────────────────────────────────
  const handleClear = async () => {
    if (!conversationId || conversationId === 'new') return;
    if (!window.confirm('¿Eliminar el documento actual? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/live-editor/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setContent('');
    setEditorContent('');
    lastUpdatedAtRef.current = null;
    setEditorKey(Date.now().toString());
  };

  // ── Upload DOCX/PDF (reuses existing /live-documents/extract endpoint) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || conversationId === 'new') return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const res = await fetch('/api/live/documents/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      let extractedHtml = '';
      if (data.html) {
        extractedHtml = data.html;
      } else if (data.text) {
        // PDF: convert plain text to basic HTML paragraphs
        extractedHtml = data.text
          .split('\n\n')
          .filter((p: string) => p.trim())
          .map((p: string) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
          .join('\n');
      }

      if (extractedHtml) {
        const newFileName = file.name.replace(/\.[^.]+$/, '');
        // Persist to backend
        const saveRes = await fetch(`/api/live-editor/${conversationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: extractedHtml, fileName: newFileName }),
        });
        const saved = await saveRes.json();
        lastUpdatedAtRef.current = saved.contentUpdatedAt;
        setContent(extractedHtml);
        setFileName(newFileName);
        setEditorKey(Date.now().toString());
      }
    } catch (err) {
      console.error('[LiveEditorPanel] Upload error:', err);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const renderPanel = () => (
    <div
      className={`flex flex-col h-full transition-colors duration-300 border-l border-border-light bg-surface-primary ${
        isMaximized
          ? 'fixed inset-0 z-[999999] w-screen h-screen m-0 rounded-none shadow-2xl'
          : 'w-full'
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-4 shrink-0 relative z-[300] overflow-visible"
        style={{ minHeight: '4rem' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-shrink mr-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm shrink-0">
            <FileEdit className="h-5 w-5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="text-sm font-semibold text-text-primary truncate">Editor Live</h2>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubmitting ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs text-text-secondary truncate">
                {fileName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-visible flex-nowrap shrink-0 py-1">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold tracking-wide">
              Subir Archivo
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".docx,.pdf"
            onChange={handleFileUpload}
          />

          {/* Export */}
          <ExportDropdown
            content={editorContent || content || ''}
            fileName={fileName || 'Documento_Live'}
            reportType="general"
          />

          {/* Clear */}
          {content && (
            <button
              onClick={handleClear}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:-rotate-3 hover:scale-105"
              title="Eliminar documento"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
            </button>
          )}

          {/* Maximize */}
          <button
            onClick={() => setIsMaximized((m) => !m)}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105"
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {!content ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-8 w-8 text-blue-500 opacity-60" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Sin documento activo
              </h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Pídele al agente que <span className="font-bold text-blue-600">cree un documento</span> (ej: "Crea la Política SST de mi empresa"), o sube un archivo Word o PDF.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl font-bold shadow-sm hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-0.5"
            >
              <Upload className="h-4 w-4" />
              Subir DOCX o PDF
            </button>
          </div>
        ) : (
          // LiveEditor
          <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
            <div style={{ minWidth: '100%', padding: '24px' }}>
              <LiveEditor
                key={editorKey}
                initialContent={content}
                onUpdate={(c: string) => setEditorContent(c)}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return isMaximized
    ? ReactDOM.createPortal(renderPanel(), document.body)
    : renderPanel();
};

export default LiveEditorPanel;
