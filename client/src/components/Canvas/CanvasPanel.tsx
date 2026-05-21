import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileEdit,
  Maximize2,
  Minimize2,
  History,
  Check,
  X,
  Pencil,
  FileSpreadsheet,
  MonitorPlay,
  Code2,
  Sparkles,
  Download,
  Upload,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';
import CanvasTextEditor from './CanvasTextEditor';
import CanvasExcelEditor from './CanvasExcelEditor';
import CanvasSlidesEditor from './CanvasSlidesEditor';
import CanvasHtmlEditor from './CanvasHtmlEditor';
import ExportDropdown from '../SGSST/ExportDropdown';
import { useNavigate } from 'react-router-dom';
import ReportHistory from '~/components/Liva/ReportHistory';

interface CanvasPanelProps {
  conversationId: string | null;
}

const POLL_INTERVAL_MS = 2500;
const DEBOUNCE_SAVE_MS = 1200;

const CanvasPanel: React.FC<CanvasPanelProps> = ({ conversationId }) => {
  const { token } = useAuthContext();
  const [isMaximized, setIsMaximized] = useRecoilState<boolean>(store.canvasMaximized);
  
  // Ephemeral agent state to check which tools are active
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));

  // Main Canvas session state
  const [fileType, setFileType] = useState<'text' | 'excel' | 'presentation' | 'html'>('text');
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('Archivo sin título');
  const [version, setVersion] = useState<number>(1);
  const [history, setHistory] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // References to handle syncing correctly without stale closures
  const contentRef = useRef<string>('');
  const fileTypeRef = useRef<'text' | 'excel' | 'presentation' | 'html'>('text');
  const titleRef = useRef<string>('Archivo sin título');
  const lastUpdatedAtRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsSubmittingRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const [isReportHistoryOpen, setIsReportHistoryOpen] = useState<boolean>(false);

  // Sync state refs on change
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { fileTypeRef.current = fileType; }, [fileType]);
  useEffect(() => { titleRef.current = title; }, [title]);

  // ── Markdown → HTML conversion (for agent-created content) ─────────────
  // The CanvasTool sends markdown; the LiveEditor renders HTML.
  // This lightweight converter handles the common cases produced by LLMs.
  const markdownToHtml = useCallback((md: string): string => {
    if (!md) return md;
    
    // Check if it's purely HTML (like from an old session or already parsed)
    // If it has markdown headers (#) or bold (**), we should parse it.
    // The regex below might break if we parse HTML, so let's protect HTML blocks.
    // A simple heuristic: if it contains # or **, it's probably markdown mixed with HTML.
    if (md.trim().startsWith('<') && !md.includes('#') && !md.includes('**')) {
      return md; 
    }

    // Split the content into HTML blocks and Markdown blocks to avoid parsing inside HTML
    const parts = md.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>)/i);
    
    return parts.map(part => {
      if (part.trim().startsWith('<')) {
        return part; // Return HTML blocks as-is
      }
      
      // Parse markdown
      return part
        .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>')
        .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>')
        .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^---+$/gm, '<hr/>')
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
        .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<hr\/>)<\/p>/g, '$1');
    }).join('');
  }, []);

  // ── Fetch session from database ──────────────────────────────────────────
  const fetchSession = useCallback(async (isInitial = false) => {
    if (!conversationId || conversationId === 'new') return;
    if (isSavingRef.current) return;

    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch(`/api/sgsst/canvas/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn(`[CanvasPanel] fetch failed: ${res.status} for convoId=${conversationId}`);
        return;
      }
      const data = await res.json();

      console.log(`[CanvasPanel] fetch ok | convoId=${conversationId} | updatedAt=${data.updatedAt} | prevRef=${lastUpdatedAtRef.current} | contentLen=${String(data.content || '').length}`);

      // Force refresh on initial load (lastUpdatedAtRef is null) OR if timestamp changed
      if (isInitial || data.updatedAt !== lastUpdatedAtRef.current) {
        lastUpdatedAtRef.current = data.updatedAt || null;
        setFileType(data.fileType || 'text');
        setTitle(data.title || 'Archivo sin título');
        setVersion(data.version || 1);
        setHistory(data.history || []);

        // Convert markdown → HTML for text documents written by the agent
        const rawContent = data.content || '';
        const htmlContent = (data.fileType === 'text' || !data.fileType)
          ? markdownToHtml(rawContent)
          : rawContent;

        // On initial load always update (even if refs match — avoids stale-ref false-negative).
        // On subsequent polls only update if content actually changed.
        if (isInitial || JSON.stringify(contentRef.current) !== JSON.stringify(htmlContent)) {
          setContent(htmlContent);
        }
      }
    } catch (e) {
      console.error('[CanvasPanel] Fetch error:', e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [conversationId, token, markdownToHtml]);

  // ── Polling implementation ───────────────────────────────────────────────
  useEffect(() => {
    fetchSession(true);
  }, [conversationId, fetchSession]);

  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;
    
    // Set periodic polling to retrieve agent changes in real-time
    // isSubmitting in deps resets the interval when agent state changes
    const interval = setInterval(() => {
      fetchSession(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId, fetchSession, isSubmitting]);

  // ── Agent finish listener: force immediate re-fetch when agent stops ──────
  // This is the primary mechanism for showing canvas content after tool execution.
  // When isSubmitting transitions true→false, the agent has finished and
  // the CanvasSession is already in the database — fetch it immediately.
  useEffect(() => {
    if (prevIsSubmittingRef.current === true && isSubmitting === false) {
      if (conversationId && conversationId !== 'new') {
        // Small delay to ensure MongoDB write is fully committed
        const timer = setTimeout(() => {
          lastUpdatedAtRef.current = null; // Force content refresh
          fetchSession(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, fetchSession, conversationId]);

  // ── Debounced Auto-Save ──────────────────────────────────────────────────
  const saveSession = useCallback(async () => {
    if (!conversationId || conversationId === 'new') return;
    isSavingRef.current = true;
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/sgsst/canvas/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: contentRef.current,
          title: titleRef.current,
          fileType: fileTypeRef.current,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVersion(data.version);
        lastUpdatedAtRef.current = data.updatedAt;
      }
    } catch (e) {
      console.error('[CanvasPanel] Save error:', e);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [conversationId, token]);

  const queueSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSession();
    }, DEBOUNCE_SAVE_MS);
  }, [saveSession]);

  // Handle local content updates from the child editors
  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    queueSave();
  };

  const handleTitleRename = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    saveSession();
  };

  // ── Document Title Header (matches LiveEditor) ───────────────────────────
  const DocumentTitleHeader: React.FC = () => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setDraft(title); }, [title]);
    useEffect(() => { if (editing) setTimeout(() => inputRef.current?.select(), 50); }, [editing]);

    const commit = () => {
      const trimmed = draft.trim();
      if (trimmed) handleTitleRename(trimmed);
      setEditing(false);
    };

    const getIcon = () => {
      switch (fileType) {
        case 'excel': return <FileSpreadsheet className="h-5 w-5" />;
        case 'presentation': return <MonitorPlay className="h-5 w-5" />;
        case 'html': return <Code2 className="h-5 w-5" />;
        default: return <FileEdit className="h-5 w-5" />;
      }
    };

    const getThemeColors = () => {
      switch (fileType) {
        case 'excel': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', grad: 'from-emerald-500/40 via-emerald-300/20' };
        case 'presentation': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', grad: 'from-amber-500/40 via-amber-300/20' };
        case 'html': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', grad: 'from-blue-500/40 via-blue-300/20' };
        default: return { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-600 dark:text-teal-400', grad: 'from-teal-500/40 via-teal-300/20' };
      }
    };

    const theme = getThemeColors();

    return (
      <div className="w-full px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3 group">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${theme.bg} ${theme.border} ${theme.text}`}>
            {getIcon()}
          </div>

          {editing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
                className={`flex-1 text-xl font-bold text-text-primary bg-transparent border-b-2 outline-none py-0.5 ${theme.border.replace('/20', '')}`}
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
                {title}
              </h2>
              <button
                onClick={() => setEditing(true)}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-tertiary hover:${theme.text.split(' ')[0]} ${theme.bg.replace('/10', '/5')} transition-all shrink-0`}
                aria-label="Renombrar documento"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className={`mt-3 h-px bg-gradient-to-r ${theme.grad} to-transparent`} />
      </div>
    );
  };

  const handleRestoreVersion = async (vItem: any) => {
    setContent(vItem.content);
    contentRef.current = vItem.content;
    setTitle(vItem.title);
    titleRef.current = vItem.title;
    setIsHistoryOpen(false);
    await saveSession();
  };

  // Render correct editor depending on active session state
  const renderEditor = () => {
    switch (fileType) {
      case 'excel':
        return (
          <CanvasExcelEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
          />
        );
      case 'presentation':
        return (
          <CanvasSlidesEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
          />
        );
      case 'html':
        return (
          <CanvasHtmlEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
          />
        );
      default:
        return (
          <CanvasTextEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
          />
        );
    }
  };

  // Empty state design with actions to instantiate canvas files
  if (isLoading && !content) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-surface-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-sm font-semibold text-text-secondary">Cargando espacio de trabajo Canvas...</p>
      </div>
    );
  }

  const hasActiveSession = !!content || fileType !== 'text';

  const panelContent = (
    <div className={`flex h-full w-full flex-col bg-surface-primary text-text-primary overflow-hidden relative ${
      isMaximized ? 'fixed inset-0 z-[999999] w-screen h-screen m-0 rounded-none shadow-2xl' : ''
    }`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-4 shrink-0 relative z-[300] overflow-visible"
        style={{ minHeight: '4rem' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-shrink mr-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm shrink-0">
            <FileEdit className="h-5 w-5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="text-sm font-semibold text-text-primary truncate">Canvas</h2>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubmitting ? 'bg-teal-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs text-text-secondary truncate">{title}</span>
              {isSaving && (
                <span className="text-[10px] text-text-tertiary italic">Guardando...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-visible flex-nowrap shrink-0 py-1">
          {hasActiveSession && fileType === 'text' && (
            <ExportDropdown content={content} fileName={title} />
          )}

          {hasActiveSession && (
            <button
              onClick={() => setIsReportHistoryOpen(!isReportHistoryOpen)}
              className={`group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl ${
                isReportHistoryOpen
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-600'
                  : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
              } hover:-rotate-3 hover:scale-105`}
              aria-label="Historial de reportes"
            >
              <History className="h-4 w-4 shrink-0" />
            </button>
          )}

          {hasActiveSession && (
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`group relative flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm cursor-pointer border outline-none rounded-xl ${
                isHistoryOpen
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-600'
                  : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
              } hover:-rotate-3 hover:scale-105`}
              aria-label="Versiones de documento"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
            </button>
          )}

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
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <ReportHistory
        onSelectReport={(convoId) => {
          setIsReportHistoryOpen(false);
          navigate(`/c/${convoId}`);
        }}
        isOpen={isReportHistoryOpen}
        toggleOpen={() => setIsReportHistoryOpen(h => !h)}
        historyEndpoint="/api/sgsst/canvas/history"
        tags={[]}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {hasActiveSession ? (
          <>
            <DocumentTitleHeader />
            <div className="flex-1 h-full flex flex-col overflow-hidden relative">
              {renderEditor()}
            </div>
          </>
        ) : (
          /* Premium Empty State Guide */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shadow-inner">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-text-primary">El lienzo está listo</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Pídele a Wappy que empiece a redactar o diagramar un entregable. Canvas creará hojas de cálculo, documentos, diapositivas y prototipos interactivos que podrás ver, editar y exportar de inmediato.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-4">
              <button
                onClick={() => {
                  setFileType('text');
                  setContent('<h1>Nuevo Documento</h1><p>Empieza a escribir...</p>');
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-medium bg-surface-secondary hover:border-teal-500/40 hover:bg-surface-hover transition-all text-left space-y-2 group"
              >
                <FileEdit className="h-6 w-6 text-teal-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-primary">Documento Word</span>
                <span className="text-[10px] text-text-tertiary text-center">Políticas, actas o guías</span>
              </button>

              <button
                onClick={() => {
                  setFileType('excel');
                  setContent(JSON.stringify([
                    ['Concepto', 'Enero', 'Febrero', 'Total'],
                    ['Presupuesto EPP', '500', '600', '1100'],
                    ['Capacitación', '200', '300', '500'],
                  ]));
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-medium bg-surface-secondary hover:border-emerald-500/40 hover:bg-surface-hover transition-all text-left space-y-2 group"
              >
                <FileSpreadsheet className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-primary">Hoja de Cálculo</span>
                <span className="text-[10px] text-text-tertiary text-center">Presupuestos e indicadores</span>
              </button>

              <button
                onClick={() => {
                  setFileType('presentation');
                  setContent(JSON.stringify([
                    { title: 'Plan de Capacitación', bullets: ['Fase 1: Inducción General', 'Fase 2: Brigadas'] }
                  ]));
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-medium bg-surface-secondary hover:border-amber-500/40 hover:bg-surface-hover transition-all text-left space-y-2 group"
              >
                <MonitorPlay className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-primary">Presentación</span>
                <span className="text-[10px] text-text-tertiary text-center">Diapositivas y capacitaciones</span>
              </button>

              <button
                onClick={() => {
                  setFileType('html');
                  setContent('<h1>Prototipo HTML</h1>');
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-medium bg-surface-secondary hover:border-blue-500/40 hover:bg-surface-hover transition-all text-left space-y-2 group"
              >
                <Code2 className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-primary">Código Prototipo</span>
                <span className="text-[10px] text-text-tertiary text-center">Páginas web y dashboards</span>
              </button>
            </div>
            
            <div className="flex w-full pt-2">
              <button
                onClick={() => setIsReportHistoryOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-semibold text-sm transition-all"
              >
                <History className="h-4 w-4" />
                Explorar el Historial de Documentos Canvas
              </button>
            </div>
          </div>
        )}

        {/* ── Version History Modal ─────────────────────────────────────────── */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsHistoryOpen(false)}
            />
            <div className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-2xl bg-surface-primary shadow-2xl border border-border-light overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm">
                      <History className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">Versiones</h2>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Historial de versiones de {title}</p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-lg p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-surface-primary">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-surface-secondary flex items-center justify-center border border-border-light">
                      <History className="h-8 w-8 text-text-tertiary" />
                    </div>
                    <p className="text-text-secondary font-medium">No hay versiones previas guardadas aún.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((hItem, idx) => {
                      const isCurrent = hItem.version === version;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                            isCurrent 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10' 
                              : 'border-border-medium bg-surface-secondary hover:border-teal-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-border-light pb-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-text-primary">Versión {hItem.version}</span>
                              <span className="text-xs text-text-tertiary">
                                {new Date(hItem.updatedAt).toLocaleString('es-ES')}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                                Actual
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-sm text-text-secondary line-clamp-3 mb-4 italic opacity-80">
                            "{hItem.title || title}"
                          </div>
                          <button
                            onClick={() => handleRestoreVersion(hItem)}
                            disabled={isCurrent}
                            className="mt-auto w-full flex items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-primary py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-teal-900/20"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restaurar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Pure CSS maximize — no portal to avoid flash/z-index issues.
  // The inner panel div already applies `fixed inset-0 z-[999999]` when isMaximized.
  return panelContent;
};

export default CanvasPanel;
