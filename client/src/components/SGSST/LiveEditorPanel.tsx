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
  History,
  Pencil,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import store from '~/store';

interface LiveEditorPanelProps {
  conversationId: string | null;
  title?: string;
  emptyStateTitle?: string;
  emptyStateMessage?: React.ReactNode;
}

const POLL_INTERVAL_MS = 2500;
const LIVE_EDITOR_TAG = 'sgsst-live-editor';
/** Per-conversation tag so ReportHistory shows only this chat's history */
const liveEditorConvoTag = (convoId: string) => `live-doc-${convoId}`;

// ── Default signature block appended to every new document ────────────────
const DEFAULT_SIGNATURE_BLOCK = `
<div style="margin-top:60px; page-break-inside:avoid;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px;">RESPONSABLE SST</p>
        <p style="font-size:11px; margin:0; color:#555;">Firma y Sello</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#555;">Firma y Sello</p>
      </td>
    </tr>
  </table>
</div>`;

/** Append default signature footer only if the document doesn't already have one */
function appendSignatureIfMissing(html: string): string {
  if (!html || html.includes('signature-placeholder') || html.includes('RESPONSABLE SST')) return html;
  return html + DEFAULT_SIGNATURE_BLOCK;
}

/** Tag a conversation so it appears in ReportHistory */
async function tagConversation(conversationId: string, tag: string, token: string) {
  try {
    const res = await fetch(`/api/convos/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const convo = await res.json();
    const currentTags: string[] = convo.tags ?? [];
    if (currentTags.includes(tag)) return; // already tagged
    await fetch('/api/convos/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ arg: { conversationId, tags: [...currentTags, tag] } }),
    });
  } catch (e) {
    console.error('[LiveEditorPanel] Tag error:', e);
  }
}

/** Prominent document title header — matches SomosSST hito editor style */
const DocumentTitleHeader: React.FC<{ fileName: string; onRename: (name: string) => void }> = ({ fileName, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(fileName); }, [fileName]);
  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.select(), 50); }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="flex items-center gap-3 group">
        {/* Icon badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 shadow-sm">
          <FileEdit className="h-5 w-5" />
        </div>

        {/* Title — editable on click */}
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 text-xl font-bold text-text-primary bg-transparent border-b-2 border-blue-500 outline-none py-0.5"
              autoFocus
            />
            <button onClick={commit} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" aria-label="Confirmar">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-text-tertiary hover:bg-surface-hover transition-colors" aria-label="Cancelar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold text-text-primary truncate leading-tight">
              {fileName}
            </h2>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-tertiary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shrink-0"
              aria-label="Renombrar documento"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {/* Decorative separator line */}
      <div className="mt-3 h-px bg-gradient-to-r from-blue-500/40 via-blue-300/20 to-transparent" />
    </div>
  );
};

const LiveEditorPanel: React.FC<LiveEditorPanelProps> = ({ 
  conversationId, 
  title = 'Editor Live',
  emptyStateTitle = 'Sin documento activo',
  emptyStateMessage = 'Empieza a redactar o pídele a Wappy que genere un documento para verlo aquí.'
}) => {
  const { token, user } = useAuthContext();
  const userId = user?.id || user?._id;
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Documento_Live');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReportHistoryOpen, setIsReportHistoryOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useRecoilState(store.ipevarMaximized);
  
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [showRitPrompt, setShowRitPrompt] = useState(false);
  const [pendingExtractedData, setPendingExtractedData] = useState<{ html: string; fileName: string } | null>(null);

  const applyExtractedDocument = useCallback(async (
    data: { html: string; fileName: string },
    useAI: boolean
  ) => {
    try {
      setIsLoading(true);
      let finalHtml = data.html;

      if (useAI) {
        const aiRes = await fetch('/api/live-editor/ai-format-rit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: data.html, fileName: data.fileName }),
        });
        if (!aiRes.ok) {
          throw new Error('Error al estructurar el documento con IA');
        }
        const aiData = await aiRes.json();
        if (aiData.content) {
          finalHtml = aiData.content;
        }
      }

      const withSigs = appendSignatureIfMissing(finalHtml);
      
      const targetId = (!conversationId || conversationId === 'new')
        ? (userId ? `temp-${userId}` : null)
        : conversationId;

      if (targetId) {
        const saveRes = await fetch(`/api/live-editor/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: withSigs, fileName: data.fileName }),
        });
        if (!saveRes.ok) {
          throw new Error('Error al guardar el documento en el servidor');
        }
        const saved = await saveRes.json();
        lastUpdatedAtRef.current = saved.contentUpdatedAt;
        if (conversationId && conversationId !== 'new') {
          await tagConversation(conversationId, LIVE_EDITOR_TAG, token);
        }
      } else {
        lastUpdatedAtRef.current = null;
      }

      setContent(withSigs);
      setFileName(data.fileName);
      editorContentRef.current = withSigs;
      liveEditorRef.current?.setHTML(withSigs);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('[LiveEditorPanel] applyExtractedDocument error:', err);
      alert(err.message || 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
      setPendingExtractedData(null);
      setShowRitPrompt(false);
    }
  }, [conversationId, token]);

  // Imperative handle to push content into the editor without remounting
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  // Track latest editor content via ref to avoid stale closures in handleSave
  const editorContentRef = useRef<string>('');
  const lastUpdatedAtRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));

  // ── Fetch document from backend ──────────────────────────────────────────
  const fetchDocument = useCallback(async (isInitial = false) => {
    const targetId = (!conversationId || conversationId === 'new')
      ? (userId ? `temp-${userId}` : null)
      : conversationId;
    if (!targetId) return;
    if (isSavingRef.current) return;
    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch(`/api/live-editor/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return;
      const data = await res.json();

      if (data.contentUpdatedAt && data.contentUpdatedAt !== lastUpdatedAtRef.current) {
        lastUpdatedAtRef.current = data.contentUpdatedAt;
        const htmlWithSigs = appendSignatureIfMissing(data.content || '');
        setContent(htmlWithSigs);
        setFileName(data.fileName || 'Documento sin título');
        // Push content directly into editor DOM — no remount needed
        if (liveEditorRef.current) {
          liveEditorRef.current.setHTML(htmlWithSigs);
          editorContentRef.current = htmlWithSigs;
        }
      }
    } catch (e) {
      console.error('[LiveEditorPanel] Fetch error:', e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [conversationId, token, userId]);

  useEffect(() => { fetchDocument(true); }, [fetchDocument]);

  useEffect(() => {
    const targetId = (!conversationId || conversationId === 'new')
      ? (userId ? `temp-${userId}` : null)
      : conversationId;
    if (!targetId) return;
    const interval = setInterval(() => fetchDocument(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, fetchDocument, isSubmitting, userId]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const targetId = (!conversationId || conversationId === 'new')
      ? (userId ? `temp-${userId}` : null)
      : conversationId;
    if (!targetId) return;
    try {
      isSavingRef.current = true;
      setIsSaving(true);
      // Read from ref — always has the latest DOM content, no stale closure risk
      const toSave = editorContentRef.current || content;
      if (!toSave) return;
      const finalContent = appendSignatureIfMissing(toSave);
      const res = await fetch(`/api/live-editor/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: finalContent, fileName }),
      });
      if (res.ok) {
        const data = await res.json();
        lastUpdatedAtRef.current = data.contentUpdatedAt;
        setContent(finalContent);
        editorContentRef.current = finalContent;
        if (conversationId && conversationId !== 'new') {
          await tagConversation(conversationId, LIVE_EDITOR_TAG, token);
          await tagConversation(conversationId, liveEditorConvoTag(conversationId), token);
        }
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error('[LiveEditorPanel] Save error:', e);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [conversationId, token, content, fileName, userId]);

  const prevConvoIdRef = useRef<string | undefined>(conversationId);

  useEffect(() => {
    if (prevConvoIdRef.current !== conversationId) {
      const isTransitionFromNewToReal = (prevConvoIdRef.current === 'new' || !prevConvoIdRef.current) && (conversationId && conversationId !== 'new');
      
      if (!isTransitionFromNewToReal) {
        setContent('');
        setFileName('Documento_Live');
        editorContentRef.current = '';
        lastUpdatedAtRef.current = null;
        if (liveEditorRef.current) {
          liveEditorRef.current.setHTML('');
        }
        if (userId && token && (conversationId === 'new' || !conversationId)) {
          fetch(`/api/live-editor/temp-${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error('[LiveEditorPanel] Clear temp error:', err));
        }
      }
      prevConvoIdRef.current = conversationId;
    }
  }, [conversationId, userId, token]);

  // ── History: load a saved report ─────────────────────────────────────────
  const handleSelectReport = async (reportOrId: any) => {
    let docContent = '';
    if (typeof reportOrId === 'string') {
      try {
        const res = await fetch(`/api/live-editor/${reportOrId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          docContent = data.content || '';
        }
        if (!docContent) {
          const msgRes = await fetch(`/api/messages/${reportOrId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (msgRes.ok) {
            const messages = await msgRes.json();
            const reportMsg = messages.reverse().find(
              (m: any) => m.isCreatedByUser === false && m.text?.length > 100,
            );
            if (reportMsg) docContent = reportMsg.text;
          }
        }
      } catch { /* ignore */ }
    } else if (reportOrId?.content) {
      docContent = reportOrId.content;
    }

    if (docContent) {
      const withSigs = appendSignatureIfMissing(docContent);
      const targetId = (!conversationId || conversationId === 'new')
        ? (userId ? `temp-${userId}` : null)
        : conversationId;
      if (targetId) {
        const saveRes = await fetch(`/api/live-editor/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: withSigs }),
        });
        if (saveRes.ok) {
          const saved = await saveRes.json();
          lastUpdatedAtRef.current = saved.contentUpdatedAt;
        }
        if (conversationId && conversationId !== 'new') {
          // Also tag with per-conversation tag so history only shows this chat's doc
          await tagConversation(conversationId, LIVE_EDITOR_TAG, token);
          await tagConversation(conversationId, liveEditorConvoTag(conversationId), token);
        }
      }
      setContent(withSigs);
      editorContentRef.current = withSigs;
      // Push directly into editor DOM — no remount
      liveEditorRef.current?.setHTML(withSigs);
      setIsHistoryOpen(false);
    }
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = async () => {
    const targetId = (!conversationId || conversationId === 'new')
      ? (userId ? `temp-${userId}` : null)
      : conversationId;
    if (!targetId) return;
    if (!window.confirm('¿Eliminar el documento actual? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/live-editor/${targetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setContent('');
    editorContentRef.current = '';
    lastUpdatedAtRef.current = null;
    liveEditorRef.current?.setHTML('');
  };

  // ── Upload DOCX/PDF ──────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const res = await fetch('/api/live/documents/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();

      let extractedHtml = '';
      if (data.html) {
        extractedHtml = data.html;
      } else if (data.text) {
        extractedHtml = data.text
          .split('\n\n')
          .filter((p: string) => p.trim())
          .map((p: string) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
          .join('\n');
      }

      if (!extractedHtml) {
        throw new Error('No se pudo extraer ningún texto del documento cargado.');
      }

      const newFileName = file.name.replace(/\.[^.]+$/, '');
      if (title === 'Editor RIT') {
        setPendingExtractedData({ html: extractedHtml, fileName: newFileName });
        setShowRitPrompt(true);
      } else {
        await applyExtractedDocument({ html: extractedHtml, fileName: newFileName }, false);
      }
    } catch (err: any) {
      console.error('[LiveEditorPanel] Upload error:', err);
      alert(err.message || 'Error al subir el archivo');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
            <h2 className="text-sm font-semibold text-text-primary truncate">{title}</h2>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubmitting ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs text-text-secondary truncate">{fileName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-visible flex-nowrap shrink-0 py-1">
          {(isLoading || isSaving) && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105"
            aria-label="Subir DOCX o PDF"
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
            content={editorContentRef.current || content || ''}
            fileName={fileName || 'Documento_Live'}
            reportType="general"
          />


          {/* Report History */}
          <button
            onClick={() => setIsReportHistoryOpen(h => !h)}
            className={`group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl ${
              isReportHistoryOpen
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
            } hover:-rotate-3 hover:scale-105`}
            aria-label="Historial de documentos"
          >
            <History className="h-4 w-4 shrink-0" />
            <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-2 py-1 rounded-md shadow-xl pointer-events-none z-[110] border border-teal-500/50">
              <span className="text-[9px] font-bold uppercase tracking-wider">Historial</span>
            </div>
          </button>

          {/* Versions (formerly History) */}
          <button
            onClick={() => setIsHistoryOpen(h => !h)}
            className={`group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl ${
              isHistoryOpen
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
            } hover:-rotate-3 hover:scale-105`}
            aria-label="Versiones de documento"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-2 py-1 rounded-md shadow-xl pointer-events-none z-[110] border border-teal-500/50">
              <span className="text-[9px] font-bold uppercase tracking-wider">Versiones</span>
            </div>
          </button>

          {/* Clear */}
          {content && (
            <button
              onClick={handleClear}
              className="group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:-rotate-3 hover:scale-105"
              aria-label="Eliminar documento"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-red-600 text-white px-2 py-1 rounded-md shadow-xl pointer-events-none z-[110] border border-red-500/50">
                <span className="text-[9px] font-bold uppercase tracking-wider">Eliminar</span>
              </div>
            </button>
          )}

          {/* Maximize */}
          <button
            onClick={() => setIsMaximized((m) => !m)}
            className="group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105"
            aria-label={isMaximized ? 'Reducir panel' : 'Expandir panel'}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
            <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-2 py-1 rounded-md shadow-xl pointer-events-none z-[110] border border-teal-500/50">
              <span className="text-[9px] font-bold uppercase tracking-wider">{isMaximized ? 'Reducir' : 'Expandir'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── ReportHistory — filters to this conversation's docs only ─────── */}
      <ReportHistory
        onSelectReport={handleSelectReport}
        isOpen={isReportHistoryOpen}
        toggleOpen={() => setIsReportHistoryOpen(h => !h)}
        refreshTrigger={refreshTrigger}
        historyEndpoint="/api/live-editor/history"
        tags={conversationId && conversationId !== 'new'
          ? [liveEditorConvoTag(conversationId)]
          : [LIVE_EDITOR_TAG]}
      />

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {!content ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-8 w-8 text-blue-500 opacity-60" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                {emptyStateTitle}
              </h3>
              <p className="text-sm text-text-secondary max-w-xs">
                {emptyStateMessage}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl font-bold shadow-sm hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-0.5"
              >
                <Upload className="h-4 w-4" />
                Subir DOCX o PDF
              </button>
              <button
                onClick={() => setIsReportHistoryOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500/10 text-teal-600 border border-teal-500/20 rounded-xl font-bold shadow-sm hover:bg-teal-500 hover:text-white transition-all transform hover:-translate-y-0.5"
              >
                <History className="h-4 w-4" />
                Cargar desde Historial
              </button>
            </div>
          </div>
        ) : (
          <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
            {/* ── Document Title Header (same style as SomosSST hito editors) ── */}
            <DocumentTitleHeader
              fileName={fileName}
              onRename={setFileName}
            />
            <div style={{ minWidth: '100%', padding: isMaximized ? '24px' : '12px' }}>
              <LiveEditor
                ref={liveEditorRef}
                initialContent={content}
                onUpdate={(c: string) => { editorContentRef.current = c; }}
                onSave={handleSave}
                onHistory={() => setIsHistoryOpen(h => !h)}
                hideFullscreen={true}
                hideToolbarWhenCollapsed={!isMaximized}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── RIT AI Confirmation Modal ─────────────────────────────────── */}
      {showRitPrompt && pendingExtractedData && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-surface-primary shadow-2xl transition-all">
            <div className="relative p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-600">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                ¿Organizar reglamento con IA?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Hemos extraído el texto de tu reglamento. Podemos usar la IA de Wappy para organizarlo de manera óptima en Capítulos y Artículos estructurados según la legislación laboral de Colombia.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-medium">
                ¿Deseas que la IA estructure el documento de forma legal manteniendo tus reglas específicas?
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-surface-secondary px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowRitPrompt(false);
                  setPendingExtractedData(null);
                }}
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary py-2.5 text-xs font-semibold text-text-primary transition-all hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => applyExtractedDocument(pendingExtractedData, false)}
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary py-2.5 text-xs font-semibold text-text-primary transition-all hover:bg-surface-hover"
              >
                Subir tal cual
              </button>
              <button
                type="button"
                onClick={() => applyExtractedDocument(pendingExtractedData, true)}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-teal-700"
              >
                Sí, usar IA
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  return isMaximized
    ? ReactDOM.createPortal(renderPanel(), document.body)
    : renderPanel();
};

export default LiveEditorPanel;
