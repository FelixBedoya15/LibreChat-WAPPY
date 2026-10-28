import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FileEdit,
  FileText,
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
  RotateCcw,
  MoreVertical,
  Trash,
  Edit,
  Save,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import { useRecoilState, useRecoilValue, useRecoilCallback, useSetRecoilState } from 'recoil';
import { ephemeralAgentByConvoId } from '~/store/agents';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import store from '~/store';
import CanvasTextEditor from './CanvasTextEditor';
import CanvasExcelEditor from './CanvasExcelEditor';
import CanvasSlidesEditor from './CanvasSlidesEditor';
import CanvasHtmlEditor from './CanvasHtmlEditor';
import MoodAnalyticsDashboard from '../SGSST/MoodAnalyticsDashboard';
import ActosCondicionesAnalyticsDashboard from '../SGSST/ActosCondicionesAnalyticsDashboard';
import ExportDropdown from '../SGSST/ExportDropdown';
import { UpgradeWall } from '../SGSST/UpgradeWall';
import { useNavigate } from 'react-router-dom';
import ReportHistory from '~/components/Liva/ReportHistory';
import { v4 } from 'uuid';
import { useChatContext } from '~/Providers';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { saveAs } from 'file-saver';

const detectFileType = (content: any, defaultType = 'text') => {
  if (!content) return defaultType;
  if (Array.isArray(content)) {
    if (content.length === 0) return defaultType;
    if (Array.isArray(content[0])) return 'excel';
    if (typeof content[0] === 'object') return 'presentation';
    return defaultType;
  }
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return defaultType;
          if (Array.isArray(parsed[0])) return 'excel';
          if (typeof parsed[0] === 'object') return 'presentation';
        }
      } catch (e) {}
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          if (parsed.estadoAnimo || parsed.totalMuestras) return 'animo';
          if (parsed.preliminarClasificacion || parsed.totalReportesBuzon)
            return 'actos_condiciones';
        }
      } catch (e) {}
    }
    if (
      trimmed.toLowerCase().includes('<!doctype html>') ||
      trimmed.toLowerCase().includes('<html')
    ) {
      return 'html';
    }
  }
  return defaultType;
};

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

function appendSignatureIfMissing(html: string): string {
  if (!html) return html;
  if (
    html.includes('signature-placeholder') ||
    html.includes('RESPONSABLE SST') ||
    /responsable\s+(sg-)?sst/i.test(html) ||
    /representante\s+legal/i.test(html) ||
    /firmas?\s+y\s+responsabilidades/i.test(html) ||
    /evaluador\s+t[eé]cnico/i.test(html) ||
    /firma:?\s*_{3,}/i.test(html) ||
    html.includes('Licencia No.')
  ) {
    return html;
  }
  return html + DEFAULT_SIGNATURE_BLOCK;
}

const DROPDOWN_Z = 100_000_000;

const VersionMenuDropdown = ({
  version,
  title,
  onRename,
  onDelete,
}: {
  version: number;
  title: string;
  onRename: (newName: string) => void;
  onDelete: () => Promise<void>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const calcMenuStyle = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      zIndex: DROPDOWN_Z,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (
      !window.confirm(
        `¿Eliminar la versión ${version} del historial?\nEsta acción no se puede deshacer.`,
      )
    )
      return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const menu = isOpen ? (
    <div
      ref={dropdownRef}
      style={menuStyle}
      className="w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          const n = prompt('Nuevo nombre para esta versión:', title);
          if (n && n !== title) onRename(n);
          setIsOpen(false);
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
      >
        <Edit className="h-3 w-3 text-teal-600" /> Renombrar
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
      >
        <Trash className="h-3.5 w-3.5" /> Eliminar
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          calcMenuStyle();
          setIsOpen((o) => !o);
        }}
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <MoreVertical className="h-4 w-4 text-text-secondary" />
      </button>
      {ReactDOM.createPortal(menu, document.body)}
    </>
  );
};

interface CanvasPanelProps {
  conversationId: string | null;
}

const POLL_INTERVAL_MS = 2500;
const DEBOUNCE_SAVE_MS = 10000;

const CanvasPanel: React.FC<CanvasPanelProps> = ({ conversationId }) => {
  const { showToast } = useToastContext();
  const { token, user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || user?.role === 'USER_IPEVAR' || user?.role === 'IPEVAR';
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState('');
  const [upgradeModalDesc, setUpgradeModalDesc] = useState('');
  const [isMaximized, setIsMaximized] = useRecoilState<boolean>(store.canvasMaximized);
  const setIsCanvasActive = useSetRecoilState(store.isCanvasActive);
  const setEphemeralAgent = useSetRecoilState(ephemeralAgentByConvoId(conversationId ?? 'new'));

  const handleCloseCanvas = useCallback(() => {
    setIsCanvasActive(false);
    setIsMaximized(false);
    setEphemeralAgent((prev: any) => {
      if (!prev?.tools) return prev;
      return {
        ...prev,
        tools: prev.tools.filter(
          (t: string) =>
            t !== 'canvas' &&
            t !== 'consultar_analitica_psicosocial' &&
            t !== 'consultar_analitica_actos_condiciones'
        ),
      };
    });
  }, [setIsCanvasActive, setIsMaximized, setEphemeralAgent]);

  // Ephemeral agent state to check which tools are active
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const streamingCanvas = useRecoilValue(store.streamingCanvasState);
  const streamingLoadedAtRef = useRef<number>(streamingCanvas?.content ? Date.now() : 0);

  const extractSmartTitle = useCallback((rawContent: string, candidateTitle?: string) => {
    const cleanCandidate = (candidateTitle || '').trim();
    if (cleanCandidate && cleanCandidate !== 'Archivo sin título') {
      return cleanCandidate;
    }
    if (typeof rawContent === 'string' && rawContent.length > 0) {
      const titleTagMatch = rawContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleTagMatch?.[1]) {
        const extracted = titleTagMatch[1].replace(/<[^>]+>/g, '').trim();
        if (extracted && extracted !== 'Plantilla Informativa SST') {
          return extracted.slice(0, 90);
        }
      }
      const h1Match = rawContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match?.[1]) {
        const extracted = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (extracted) {
          return extracted.slice(0, 90);
        }
      }
    }
    return cleanCandidate || 'Documento SG-SST';
  }, []);

  const initialStreamingType = React.useMemo(() => {
    if (!streamingCanvas) return 'text';
    const raw = String(streamingCanvas.content || '');
    if (
      streamingCanvas.fileType === 'html' ||
      raw.includes('<!DOCTYPE html') ||
      raw.includes('<html')
    ) {
      return 'html';
    }
    return (streamingCanvas.fileType as any) || 'text';
  }, [streamingCanvas]);

  const initialStreamingContent = streamingCanvas?.content || '';
  const initialStreamingTitle = streamingCanvas
    ? extractSmartTitle(initialStreamingContent, streamingCanvas.title)
    : 'Archivo sin título';

  // Main Canvas session state
  const [fileType, setFileType] = useState<
    'text' | 'excel' | 'presentation' | 'html' | 'animo' | 'actos_condiciones'
  >(initialStreamingType);
  const [content, setContent] = useState<string>(initialStreamingContent);
  const [title, setTitle] = useState<string>(initialStreamingTitle);
  const [version, setVersion] = useState<number>(1);
  const [history, setHistory] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const hasActiveSession =
    !!content ||
    (fileType !== 'text' && fileType !== 'actos_condiciones' && fileType !== 'animo') ||
    fileType === 'actos_condiciones' ||
    fileType === 'animo';

  // References to handle syncing correctly without stale closures
  const contentRef = useRef<string>(initialStreamingContent);
  const fileTypeRef = useRef<
    'text' | 'excel' | 'presentation' | 'html' | 'animo' | 'actos_condiciones'
  >(initialStreamingType);
  const titleRef = useRef<string>(initialStreamingTitle);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMutingAutoSaveRef = useRef<boolean>(false);
  const muteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // References to store the original document's type and title, avoiding temporary tool state overrides
  const dbFileTypeRef = useRef<
    'text' | 'excel' | 'presentation' | 'html' | 'animo' | 'actos_condiciones'
  >(initialStreamingType);
  const dbTitleRef = useRef<string>(initialStreamingTitle);

  useEffect(() => {
    if (fileType !== 'animo' && fileType !== 'actos_condiciones') {
      dbFileTypeRef.current = fileType;
    }
  }, [fileType]);

  useEffect(() => {
    if (fileType !== 'animo' && fileType !== 'actos_condiciones') {
      dbTitleRef.current = title;
    }
  }, [title, fileType]);

  const muteAutoSave = (durationMs: number) => {
    if (muteTimeoutRef.current) clearTimeout(muteTimeoutRef.current);
    isMutingAutoSaveRef.current = true;
    muteTimeoutRef.current = setTimeout(() => {
      isMutingAutoSaveRef.current = false;
      muteTimeoutRef.current = null;
    }, durationMs);
  };
  const prevIsSubmittingRef = useRef<boolean>(false);
  const downloadRef = useRef<(() => void) | null>(null);

  const navigate = useNavigate();
  const [isReportHistoryOpen, setIsReportHistoryOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const chatContext = useChatContext();
  const setConversation = chatContext?.setConversation;

  const copyEphemeralAgent = useRecoilCallback(
    ({ snapshot, set }) =>
      async (targetId: string) => {
        const sourceId = conversationId || 'new';
        const sourceAgent = await snapshot.getPromise(ephemeralAgentByConvoId(sourceId));
        if (sourceAgent) {
          set(ephemeralAgentByConvoId(targetId), sourceAgent);
        }
      },
    [conversationId],
  );

  const ephemeralKey = conversationId ?? 'new';
  const ephemeralAgent = useRecoilValue(ephemeralAgentByConvoId(ephemeralKey));

  useEffect(() => {
    const activeTools = (ephemeralAgent as any)?.tools ?? [];
    if (activeTools.includes('consultar_analitica_psicosocial')) {
      setFileType('animo');
      setTitle('Termómetro Psicosocial');
    } else if (activeTools.includes('consultar_analitica_actos_condiciones')) {
      setFileType('actos_condiciones');
      setTitle('Analítica de Actos y Condiciones');
    } else {
      if (dbFileTypeRef.current) setFileType(dbFileTypeRef.current);
      if (dbTitleRef.current && dbTitleRef.current !== 'Archivo sin título') {
        setTitle(dbTitleRef.current);
      }
    }
  }, [ephemeralAgent]);

  // Sync state refs on change
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    fileTypeRef.current = fileType;
  }, [fileType]);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Save pending changes immediately on unmount, changing chat, or closing the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        const activeConvoId = conversationId;
        if (activeConvoId && activeConvoId !== 'new') {
          fetch(`/api/sgsst/canvas/${activeConvoId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content:
                fileTypeRef.current === 'text'
                  ? appendSignatureIfMissing(contentRef.current)
                  : contentRef.current,
              title: titleRef.current,
              fileType: fileTypeRef.current,
              isManual: true,
            }),
            keepalive: true,
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        const activeConvoId = conversationId;
        if (activeConvoId && activeConvoId !== 'new') {
          fetch(`/api/sgsst/canvas/${activeConvoId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content:
                fileTypeRef.current === 'text'
                  ? appendSignatureIfMissing(contentRef.current)
                  : contentRef.current,
              title: titleRef.current,
              fileType: fileTypeRef.current,
              isManual: true,
            }),
          }).catch((err) => console.error('[CanvasPanel] Save on exit error:', err));
        }
      }
    };
  }, [conversationId, token]);

  // ── Markdown → HTML conversion (for agent-created content) ─────────────
  // The CanvasTool sends markdown; the LiveEditor renders HTML.
  // This lightweight converter handles the common cases produced by LLMs.
  const markdownToHtml = useCallback((md: string): string => {
    if (!md) return md;

    // Helper to find matching tag depth-wise
    const findMatchingClosingTag = (html: string, startIndex: number, tagName: string): number => {
      const openTag = `<${tagName}`;
      const closeTag = `</${tagName}>`;
      let depth = 0;
      let i = startIndex;

      while (i < html.length) {
        if (html.slice(i, i + openTag.length).toLowerCase() === openTag) {
          depth++;
          i += openTag.length;
        } else if (html.slice(i, i + closeTag.length).toLowerCase() === closeTag) {
          depth--;
          if (depth === 0) {
            return i + closeTag.length;
          }
          i += closeTag.length;
        } else {
          i++;
        }
      }
      return -1;
    };

    // Check if it's purely HTML (like from an old session or already parsed)
    // If it has markdown headers (#) or bold (**), we should parse it.
    // The regex below might break if we parse HTML, so let's protect HTML blocks.
    // A simple heuristic: if it contains # or **, it's probably markdown mixed with HTML.
    if (
      md.trim().startsWith('<') &&
      !md.includes('#') &&
      !md.includes('**') &&
      !md.includes('---')
    ) {
      return md;
    }

    let header = '';
    let body = md;
    let signature = '';

    // 1. Extract Header if it exists (can be multiple contiguous HTML blocks like comments, divs, tables, style)
    let index = 0;
    while (index < md.length) {
      const remaining = md.substring(index);
      const nextCharMatch = remaining.search(/\S/);
      if (nextCharMatch === -1) break;
      const actualIndex = index + nextCharMatch;
      const actualRemaining = md.substring(actualIndex);

      if (actualRemaining.startsWith('<!--')) {
        const commentEnd = actualRemaining.indexOf('-->');
        if (commentEnd !== -1) {
          index = actualIndex + commentEnd + 3;
          continue;
        }
      } else if (
        actualRemaining.startsWith('<div') ||
        actualRemaining.startsWith('<table') ||
        actualRemaining.startsWith('<style')
      ) {
        const startTag = actualRemaining.startsWith('<div')
          ? 'div'
          : actualRemaining.startsWith('<table')
            ? 'table'
            : 'style';
        const endIndex = findMatchingClosingTag(md, actualIndex, startTag);
        if (endIndex !== -1) {
          index = endIndex;
          continue;
        }
      }
      break;
    }

    if (index > 0) {
      header = md.substring(0, index);
      body = md.substring(index);
    }

    // 2. Extract Signature if it exists at the end
    const sigMarkers = [
      '<div style="margin-top: 60px;',
      '<div style="margin-top:60px;',
      '<div style="margin-top: 50px;',
      '<div style="margin-top:50px;',
      '<div style="page-break-inside:avoid;',
      '<div style="page-break-inside: avoid;',
      '<div class="signature-placeholder',
    ];

    let sigStartIndex = -1;
    for (const marker of sigMarkers) {
      const idx = body.lastIndexOf(marker);
      if (idx !== -1 && (sigStartIndex === -1 || idx < sigStartIndex)) {
        sigStartIndex = idx;
      }
    }

    if (sigStartIndex !== -1) {
      signature = body.substring(sigStartIndex);
      body = body.substring(0, sigStartIndex);
    }

    // Now, parse ONLY the body as markdown.
    // Split the body into HTML blocks and Markdown blocks to avoid parsing inside HTML
    const parts = body.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>)/i);

    const parsedBody = parts
      .map((part) => {
        if (part.trim().startsWith('<')) {
          return part; // Return HTML blocks as-is
        }

        let parsed = part;

        // Parse markdown tables first
        const tableRegex =
          /((?:^|\n)\|[^\n]+\|[^\n]*\n\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n(?:\|[^\n]+\|[^\n]*(?:\n|$))+)/g;
        parsed = parsed.replace(tableRegex, (match) => {
          const lines = match
            .trim()
            .split('\n')
            .map((l) => l.trim());
          if (lines.length < 2) return match;

          const headerCols = lines[0]
            .split('|')
            .map((c) => c.trim())
            .filter((c, i, arr) => i > 0 && i < arr.length - 1);
          const separatorCols = lines[1]
            .split('|')
            .map((c) => c.trim())
            .filter((c, i, arr) => i > 0 && i < arr.length - 1);

          const alignments = separatorCols.map((col) => {
            if (col.startsWith(':') && col.endsWith(':')) return 'center';
            if (col.endsWith(':')) return 'right';
            if (col.startsWith(':')) return 'left';
            return '';
          });

          const headersHtml = headerCols
            .map((col, idx) => {
              const align = alignments[idx] ? ` align="${alignments[idx]}"` : '';
              return `<th${align} style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: ${alignments[idx] || 'left'};">${col}</th>`;
            })
            .join('');

          const dataRowsHtml = lines
            .slice(2)
            .map((line) => {
              const cols = line
                .split('|')
                .map((c) => c.trim())
                .filter((c, i, arr) => i > 0 && i < arr.length - 1);
              const cellsHtml = cols
                .map((col, idx) => {
                  const align = alignments[idx] ? ` align="${alignments[idx]}"` : '';
                  return `<td${align} style="border: 1px solid #ddd; padding: 8px; text-align: ${alignments[idx] || 'left'};">${col}</td>`;
                })
                .join('');
              return `<tr>${cellsHtml}</tr>`;
            })
            .join('');

          return `<div style="overflow-x:auto; margin: 15px 0;"><table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;"><thead><tr>${headersHtml}</tr></thead><tbody>${dataRowsHtml}</tbody></table></div>`.replace(
            /\n/g,
            '',
          );
        });

        // Pre-process: split squished numbered headings (e.g., "... (SURA)1. OBJETIVOEstablecer ...")
        parsed = parsed
          .replace(/([a-zA-Z0-9\.\)])(\d+\.\s+[A-ZÁÉÍÓÚÑ]{3,})/g, '$1\n\n### $2\n\n')
          .replace(/(\d+\.\s+[A-ZÁÉÍÓÚÑ]{3,})([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, '$1\n\n$2');

        // Parse remaining markdown
        return parsed
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
      })
      .join('');

    return header + parsedBody + signature;
  }, []);

  // ── Sync streaming content in real-time ───────────────────────────────────
  useEffect(() => {
    if (streamingCanvas) {
      const rawContent = String(streamingCanvas.content || '');
      const isHtml =
        streamingCanvas.fileType === 'html' ||
        rawContent.includes('<!DOCTYPE html') ||
        rawContent.includes('<html');
      const resolvedFileType = isHtml ? 'html' : ((streamingCanvas.fileType as any) || 'text');
      const resolvedTitle = extractSmartTitle(rawContent, streamingCanvas.title);

      // Convert markdown → HTML for text documents
      const htmlContent =
        resolvedFileType === 'text'
          ? markdownToHtml(rawContent)
          : rawContent;

      streamingLoadedAtRef.current = Date.now();

      setContent(htmlContent);
      contentRef.current = htmlContent;

      setFileType(resolvedFileType);
      fileTypeRef.current = resolvedFileType;
      dbFileTypeRef.current = resolvedFileType;

      setTitle(resolvedTitle);
      titleRef.current = resolvedTitle;
      dbTitleRef.current = resolvedTitle;
    }
  }, [streamingCanvas, markdownToHtml, extractSmartTitle]);

  // ── Fetch session from database ──────────────────────────────────────────
  const fetchSession = useCallback(
    async (isInitial = false) => {
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

        // Si la conversación no tiene sesión guardada en DB (updatedAt vacío y content vacío)
        // y ya tenemos un documento abierto (ej. desde Tenshi / Antigravity), NO sobreescribirlo.
        const incomingUpdatedAt = data.updatedAt || null;
        if (!incomingUpdatedAt && !data.content && (contentRef.current || streamingCanvas?.content)) {
          return;
        }

        // Si el usuario acaba de abrir un entregable en streamingCanvas y la sesión en DB de esta conversación es más antigua,
        // preservar el entregable recién abierto.
        if (
          streamingLoadedAtRef.current > 0 &&
          incomingUpdatedAt &&
          new Date(incomingUpdatedAt).getTime() < streamingLoadedAtRef.current &&
          contentRef.current
        ) {
          return;
        }

        // Force refresh on initial load (lastUpdatedAtRef is null) OR if timestamp changed
        if (isInitial || incomingUpdatedAt !== lastUpdatedAtRef.current) {
          lastUpdatedAtRef.current = incomingUpdatedAt;
          const activeTools = (ephemeralAgent as any)?.tools ?? [];
          const isPsychologistActive = activeTools.includes('consultar_analitica_psicosocial');
          const isACIActive = activeTools.includes('consultar_analitica_actos_condiciones');

          dbFileTypeRef.current = data.fileType || 'text';
          dbTitleRef.current = data.title || 'Archivo sin título';

          setFileType(
            isPsychologistActive
              ? 'animo'
              : isACIActive
                ? 'actos_condiciones'
                : data.fileType || 'text',
          );
          setTitle(
            isPsychologistActive
              ? 'Termómetro Psicosocial'
              : isACIActive
                ? 'Analítica de Actos y Condiciones'
                : data.title || 'Archivo sin título',
          );
          setVersion(data.version || 1);
          setHistory(data.history || []);

          // Convert markdown → HTML for text documents written by the agent
          const rawContent = data.content || '';
          let htmlContent =
            data.fileType === 'text' || !data.fileType ? markdownToHtml(rawContent) : rawContent;

          if (data.fileType === 'text' || !data.fileType) {
            htmlContent = appendSignatureIfMissing(htmlContent);
          }

          // On initial load always update (even if refs match — avoids stale-ref false-negative).
          // On subsequent polls only update if content actually changed.
          if (isInitial || JSON.stringify(contentRef.current) !== JSON.stringify(htmlContent)) {
            if (!isInitial) {
              muteAutoSave(1500);
            }
            setContent(htmlContent);
          }
        }
      } catch (e) {
        console.error('[CanvasPanel] Fetch error:', e);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [conversationId, token, markdownToHtml, ephemeralAgent, streamingCanvas],
  );

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
    prevIsSubmittingRef.current = isSubmitting as boolean;
  }, [isSubmitting, fetchSession, conversationId]);

  // Helper to initialize session and transition new conversation
  const initializeConvoAndSave = async (
    initialFileType: 'text' | 'excel' | 'presentation' | 'html' | 'animo' | 'actos_condiciones',
    initialContent: string,
    initialTitle: string,
  ) => {
    const newConvoId = v4();

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    muteAutoSave(2500);

    await copyEphemeralAgent(newConvoId);

    setFileType(initialFileType);
    setContent(initialContent);
    setTitle(initialTitle);

    fileTypeRef.current = initialFileType;
    contentRef.current = initialContent;
    titleRef.current = initialTitle;

    if (setConversation) {
      setConversation((prev: any) => ({
        ...prev,
        conversationId: newConvoId,
      }));
    }

    await saveSession(newConvoId);

    queryClient.invalidateQueries([QueryKeys.messages, newConvoId]);
    queryClient.invalidateQueries([QueryKeys.allConversations]);

    navigate(`/c/${newConvoId}`, { replace: true });
  };

  // ── Debounced Auto-Save ──────────────────────────────────────────────────
  const saveSession = useCallback(
    async (customId?: string, isManual = false) => {
      const activeConvoId = customId || conversationId;
      if (!activeConvoId || activeConvoId === 'new') return;
      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const res = await fetch(`/api/sgsst/canvas/${activeConvoId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content:
              fileTypeRef.current === 'text'
                ? appendSignatureIfMissing(contentRef.current)
                : contentRef.current,
            title: titleRef.current,
            fileType: fileTypeRef.current,
            isManual,
          }),
        });
        const data = await res.json();
        if (data.success) {
          muteAutoSave(2000);
          if (data.content !== undefined) {
            // Update ref to keep content fresh, but do not setContent state to avoid cursor jumping
            contentRef.current = data.content;
          }
          setVersion(data.version);
          setHistory(data.history || []);
          lastUpdatedAtRef.current = data.updatedAt;
          showToast({ status: 'success', message: '¡Cambios guardados con éxito!' });
        }
      } catch (e) {
        console.error('[CanvasPanel] Save error:', e);
        showToast({ status: 'error', message: 'Error al guardar los cambios.' });
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [conversationId, token],
  );

  const queueSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSession(undefined, true);
    }, DEBOUNCE_SAVE_MS);
  }, [saveSession]);

  // Handle local content updates from the child editors
  const handleContentUpdate = (newContent: string) => {
    const updated =
      fileTypeRef.current === 'text' ? appendSignatureIfMissing(newContent) : newContent;
    // Update ref only (not state) to prevent parent state re-renders and editor cursor jumping
    contentRef.current = updated;
    if (isMutingAutoSaveRef.current) {
      return;
    }
    queueSave();
  };

  const handleTitleRename = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    saveSession();
  };

  const handleApplyTemplate = async (newContent: string, newTitle: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    muteAutoSave(2000);
    const updated =
      fileTypeRef.current === 'text' ? appendSignatureIfMissing(newContent) : newContent;

    setContent(updated);
    setTitle(newTitle);

    contentRef.current = updated;
    titleRef.current = newTitle;

    if (!conversationId || conversationId === 'new') {
      const newConvoId = v4();
      await copyEphemeralAgent(newConvoId);
      if (setConversation) {
        setConversation((prev: any) => ({
          ...prev,
          conversationId: newConvoId,
        }));
      }
      await saveSession(newConvoId);
      queryClient.invalidateQueries([QueryKeys.messages, newConvoId]);
      queryClient.invalidateQueries([QueryKeys.allConversations]);
      navigate(`/c/${newConvoId}`, { replace: true });
    } else {
      await saveSession();
    }
  };

  const handleResetSession = async () => {
    if (
      !window.confirm(
        '¿Deseas volver a la selección de lienzos? Los cambios no guardados en la versión actual podrían perderse.',
      )
    )
      return;

    setIsSaving(true);
    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      muteAutoSave(1500);

      const res = await fetch(`/api/sgsst/canvas/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: '',
          title: 'Archivo sin título',
          fileType: 'text',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        setFileType('text');
        setTitle('Archivo sin título');
        setVersion(1);
        setHistory([]);
        lastUpdatedAtRef.current = data.updatedAt;
        downloadRef.current = null;
      }
    } catch (e) {
      console.error('[CanvasPanel] Reset error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Document Title Header (matches LiveEditor) ───────────────────────────
  const DocumentTitleHeader: React.FC = () => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setDraft(title);
    }, [title]);
    useEffect(() => {
      if (editing) setTimeout(() => inputRef.current?.select(), 50);
    }, [editing]);

    const commit = () => {
      const trimmed = draft.trim();
      if (trimmed) handleTitleRename(trimmed);
      setEditing(false);
    };

    const getIcon = () => {
      switch (fileType) {
        case 'excel':
          return <FileSpreadsheet className="h-5 w-5" />;
        case 'presentation':
          return <MonitorPlay className="h-5 w-5" />;
        case 'html':
          return <Code2 className="h-5 w-5" />;
        case 'animo':
          return <Heart className="h-5 w-5" />;
        case 'actos_condiciones':
          return <ShieldAlert className="h-5 w-5" />;
        default:
          return <FileEdit className="h-5 w-5" />;
      }
    };

    const getThemeColors = () => {
      switch (fileType) {
        case 'excel':
          return {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            grad: 'from-emerald-500/40 via-emerald-300/20',
          };
        case 'presentation':
          return {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-600 dark:text-amber-400',
            grad: 'from-amber-500/40 via-amber-300/20',
          };
        case 'html':
          return {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
            grad: 'from-blue-500/40 via-blue-300/20',
          };
        case 'animo':
          return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-600 dark:text-red-400',
            grad: 'from-red-500/40 via-red-300/20',
          };
        case 'actos_condiciones':
          return {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            text: 'text-orange-600 dark:text-orange-400',
            grad: 'from-orange-500/40 via-orange-300/20',
          };
        default:
          return {
            bg: 'bg-teal-500/10',
            border: 'border-teal-500/20',
            text: 'text-teal-600 dark:text-teal-400',
            grad: 'from-teal-500/40 via-teal-300/20',
          };
      }
    };

    const theme = getThemeColors();

    return (
      <div className="w-full shrink-0 px-4 pb-2 pt-4">
        <div className="group flex items-center gap-3">
          {hasActiveSession && (
            <button
              onClick={handleResetSession}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary text-text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-surface-hover"
              aria-label="Volver a la selección de lienzos"
              title="Volver a la selección de lienzos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${theme.bg} ${theme.border} ${theme.text}`}
          >
            {getIcon()}
          </div>

          {editing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className={`flex-1 border-b-2 bg-transparent py-0.5 text-xl font-bold text-text-primary outline-none ${theme.border.replace('/20', '')}`}
                autoFocus
              />
              <button
                onClick={commit}
                className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                aria-label="Confirmar"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover"
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h2 className="truncate text-xl font-bold leading-tight text-text-primary">
                {title}
              </h2>
              {fileType !== 'animo' && (
                <button
                  onClick={() => setEditing(true)}
                  className={`rounded-lg p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:${theme.text.split(' ')[0]} ${theme.bg.replace('/10', '/5')} shrink-0 transition-all`}
                  aria-label="Renombrar documento"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className={`mt-3 h-px bg-gradient-to-r ${theme.grad} to-transparent`} />
      </div>
    );
  };

  const handleRestoreVersion = async (vItem: any) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    muteAutoSave(1500);
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sgsst/canvas/${conversationId}/versions/${vItem.version}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFileType(data.fileType);
        fileTypeRef.current = data.fileType;
        setContent(data.content);
        contentRef.current = data.content;
        setTitle(data.title);
        titleRef.current = data.title;
        setVersion(data.version);
        setHistory(data.history || []);
        lastUpdatedAtRef.current = data.updatedAt;
        setIsHistoryOpen(false);
        showToast({ status: 'success', message: '¡Versión restaurada con éxito!' });
      }
    } catch (e) {
      console.error('[Restore Version] Error:', e);
      showToast({ status: 'error', message: 'Error al restaurar la versión.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Render correct editor depending on active session state
  const renderEditor = () => {
    const isHtmlString = typeof content === 'string' && (content.includes('<!DOCTYPE html') || content.includes('<html') || content.includes('<body'));
    const resolvedFileType = (fileType === 'html' || isHtmlString) ? 'html' : fileType;

    switch (resolvedFileType) {
      case 'excel':
        return (
          <CanvasExcelEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
            isMaximized={isMaximized}
            onRegisterDownload={(fn) => {
              downloadRef.current = fn;
            }}
          />
        );
      case 'presentation':
        return (
          <CanvasSlidesEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
            isMaximized={isMaximized}
            onRegisterDownload={(fn) => {
              downloadRef.current = fn;
            }}
          />
        );
      case 'html':
        return (
          <CanvasHtmlEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            title={title}
            isMaximized={isMaximized}
            onRegisterDownload={(fn) => {
              downloadRef.current = fn;
            }}
          />
        );
      case 'animo': {
        const isFree = user?.role === 'USER';
        return (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary">
            <div
              className={`flex-1 overflow-y-auto p-6 ${isFree ? 'pointer-events-none select-none blur-[8px] filter' : ''}`}
            >
              <MoodAnalyticsDashboard isMaximized={isMaximized} />
            </div>
            {isFree && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 p-4 backdrop-blur-[2px] sm:p-6 md:p-8">
                <UpgradeWall
                  isPopup={true}
                  title="Analítica Psicosocial Exclusiva"
                  description="El Termómetro Psicosocial es una herramienta exclusiva de los planes de pago. Adquiere o actualiza tu plan para ver el diagnóstico cuantitativo, estresores principales y recomendaciones de la IA."
                  plan="USER"
                />
              </div>
            )}
          </div>
        );
      }
      case 'actos_condiciones': {
        return (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary">
            <div className="flex-1 overflow-y-auto p-6">
              <ActosCondicionesAnalyticsDashboard isMaximized={isMaximized} />
            </div>
          </div>
        );
      }
      default:
        return (
          <CanvasTextEditor
            initialContent={content}
            onUpdate={handleContentUpdate}
            onApplyTemplate={handleApplyTemplate}
            isMaximized={isMaximized}
          />
        );
    }
  };

  // Empty state design with actions to instantiate canvas files
  if (isLoading && !content) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-surface-primary p-8">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal-500"></div>
        <p className="text-sm font-semibold text-text-secondary">
          Cargando espacio de trabajo Canvas...
        </p>
      </div>
    );
  }

  const panelContent = (
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-surface-primary text-text-primary ${
        isMaximized
          ? 'fixed inset-0 z-[9990] m-0 h-screen w-screen rounded-none shadow-2xl pt-[max(env(safe-area-inset-top),2.5rem)] sm:pt-0'
          : 'relative pt-[max(env(safe-area-inset-top),1.5rem)] sm:pt-0'
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="relative z-[300] flex shrink-0 items-center justify-between overflow-visible border-b border-border-light bg-surface-secondary px-3 sm:px-4 py-2 sm:py-0"
        style={{ minHeight: '3.75rem' }}
      >
        {/* Botón Cerrar Móvil (Accesible inmediatamente debajo del notch) */}
        <button
          onClick={handleCloseCanvas}
          className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700 font-bold text-xs shrink-0 active:scale-95 mr-2"
          aria-label="Cerrar lienzo"
          title="Cerrar lienzo"
        >
          <X className="h-4 w-4" />
          <span>Cerrar</span>
        </button>

        <div className="mr-2 flex min-w-0 flex-shrink items-center gap-2 sm:gap-3 overflow-hidden">
          <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-xs">
            <FileEdit className="h-4 w-4" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-xs sm:text-sm font-extrabold text-text-primary">Canvas</h2>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                2.0
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSubmitting ? 'animate-pulse bg-teal-500' : 'bg-green-500'}`}
              />
              <span className="truncate text-[11px] sm:text-xs text-text-secondary">{title}</span>
              {isSaving && (
                <span className="text-[10px] italic text-text-tertiary">Guardando...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2 overflow-visible py-1">
          {hasActiveSession && fileType !== 'animo' && fileType !== 'actos_condiciones' && (
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await saveSession(undefined, true);
              }}
              disabled={isSaving}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Guardar cambios"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                {isSaving ? (
                  <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-b-2 border-t-2 border-current" />
                ) : (
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </div>
              <div className="hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
                <span className="text-xs font-bold tracking-wide">
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </span>
              </div>
            </button>
          )}

          {hasActiveSession && fileType === 'text' && (
            <ExportDropdown content={content} fileName={title} />
          )}

          {hasActiveSession &&
            fileType !== 'text' &&
            fileType !== 'animo' &&
            fileType !== 'actos_condiciones' && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Trigger registered download immediately to preserve browser user-gesture token
                  if (downloadRef.current) {
                    downloadRef.current();
                  } else if (content) {
                    const safeTitle = (title || 'archivo').replace(/[/\\?%*:|"<>]/g, '_').trim();
                    const isHtml = fileType === 'html' || content.includes('<html') || content.includes('<!DOCTYPE');
                    const ext = isHtml ? 'html' : fileType === 'excel' ? 'json' : 'txt';
                    const blob = new Blob([content], { type: isHtml ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8' });
                    saveAs(blob, `${safeTitle}.${ext}`);
                  }

                  if (user?.role === 'USER') {
                    fetch('/api/files/register-download', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                    }).catch((err) => console.error('Download register error:', err));
                  }
                }}
                className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Descargar archivo"
                title={
                  fileType === 'presentation'
                    ? 'Descargar presentación editable en PowerPoint (.pptx)'
                    : fileType === 'excel'
                      ? 'Descargar hoja de cálculo en Excel (.xlsx)'
                      : 'Descargar aplicativo (.html)'
                }
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
                  <span className="text-xs font-bold tracking-wide">
                    {fileType === 'presentation'
                      ? 'Descargar .PPTX'
                      : fileType === 'excel'
                        ? 'Descargar .XLSX'
                        : 'Descargar .HTML'}
                  </span>
                </div>
              </button>
            )}

          {hasActiveSession && fileType !== 'animo' && fileType !== 'actos_condiciones' && (
            <button
              onClick={() => setIsReportHistoryOpen(!isReportHistoryOpen)}
              className={`hidden sm:flex group h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${
                isReportHistoryOpen
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20'
              }`}
              aria-label="Historial de reportes"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
                <span className="text-xs font-bold tracking-wide">Historial</span>
              </div>
            </button>
          )}

          {hasActiveSession && fileType !== 'animo' && fileType !== 'actos_condiciones' && (
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`hidden sm:flex group h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${
                isHistoryOpen
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20'
              }`}
              aria-label="Versiones de documento"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
                <span className="text-xs font-bold tracking-wide">Versiones</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setIsMaximized((m) => !m)}
            className="hidden sm:flex group h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            aria-label={isMaximized ? 'Reducir panel' : 'Expandir panel'}
          >
            <div className="relative flex flex-shrink-0 items-center justify-center">
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </div>
            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
              <span className="text-xs font-bold tracking-wide">
                {isMaximized ? 'Contraer' : 'Expandir'}
              </span>
            </div>
          </button>

          <button
            onClick={handleCloseCanvas}
            className="hidden sm:flex group h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            aria-label="Cerrar lienzo"
            title="Cerrar lienzo"
          >
            <div className="relative flex flex-shrink-0 items-center justify-center">
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
              <span className="text-xs font-bold tracking-wide">
                Cerrar
              </span>
            </div>
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
        toggleOpen={() => setIsReportHistoryOpen((h) => !h)}
        historyEndpoint={
          conversationId && conversationId !== 'new'
            ? `/api/sgsst/canvas/history?conversationId=${conversationId}`
            : '/api/sgsst/canvas/history'
        }
        tags={[]}
        refreshTrigger={version}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {hasActiveSession ? (
          <>
            <DocumentTitleHeader />
            <div className="relative flex h-full flex-1 flex-col overflow-hidden">
              {renderEditor()}
            </div>
          </>
        ) : (
          /* Premium Empty State Guide — WAPPY Canvas Studio 2.0 */
          <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6 text-center">
              {/* Studio Badge & Icon */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-transparent text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 items-center rounded-md border border-teal-500/40 bg-surface-primary px-1.5 text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 shadow-xs">
                    PRO
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  WAPPY CANVAS STUDIO 2.0 · SUITE EJECUTIVA SG-SST
                </span>
              </div>

              <div className="space-y-2 max-w-xl">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                  El lienzo está listo
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-text-secondary">
                  Crea documentos normativos, matrices de cálculo, presentaciones ejecutivas con descarga nativa en{' '}
                  <span className="font-bold text-text-primary">PowerPoint (.PPTX)</span> y aplicativos interactivos en tiempo real.
                </p>
              </div>

              {/* Bento 2x2 Grid — 4 Specialized Studios */}
              <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* 1. Documento Word */}
                <button
                  onClick={() => {
                    const initialContent = appendSignatureIfMissing(`
<div style="font-family: 'Inter', Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #cbd5e1;">
    <tr>
      <td style="width: 25%; padding: 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; font-size: 12px; text-align: center;">
        SISTEMA DE GESTIÓN SG-SST<br/><span style="font-size: 10px; color: #0d9488;">DECRETO 1072 DE 2015</span>
      </td>
      <td style="width: 50%; padding: 12px; border: 1px solid #cbd5e1; text-align: center;">
        <div style="font-size: 15px; font-weight: 800; color: #0f172a;">DOCUMENTO CORPORATIVO SG-SST</div>
        <div style="font-size: 11px; color: #64748b;">Política, Acta o Procedimiento Operativo Normalizado</div>
      </td>
      <td style="width: 25%; padding: 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 11px;">
        <strong>Código:</strong> SST-DOC-001<br/>
        <strong>Versión:</strong> 01<br/>
        <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}
      </td>
    </tr>
  </table>
  <h2 style="font-size: 16px; font-weight: bold; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin-top: 16px;">1. OBJETIVO Y ALCANCE</h2>
  <p style="font-size: 13px;">Establecer los lineamientos normativos y técnicos de Seguridad y Salud en el Trabajo conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019. Haz clic aquí para redactar o selecciona una de las <strong>15 Plantillas SST</strong> en la barra superior.</p>
  <h2 style="font-size: 16px; font-weight: bold; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin-top: 20px;">2. DESARROLLO Y COMPROMISOS</h2>
  <ul>
    <li style="font-size: 13px;">Identificación de peligros, evaluación y valoración de riesgos (GTC-45).</li>
    <li style="font-size: 13px;">Cumplimiento de estándares mínimos y mejora continua del ciclo PHVA.</li>
  </ul>
</div>`);
                    if (!conversationId || conversationId === 'new') {
                      initializeConvoAndSave('text', initialContent, 'Informe Técnico SG-SST');
                    } else {
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      muteAutoSave(1500);
                      setFileType('text');
                      setContent(initialContent);
                      setTitle('Informe Técnico SG-SST');
                      fileTypeRef.current = 'text';
                      contentRef.current = initialContent;
                      titleRef.current = 'Informe Técnico SG-SST';
                      saveSession();
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-teal-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-teal-500/[0.06] hover:shadow-md cursor-pointer"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <FileEdit className="h-5 w-5" />
                    </div>
                    <span className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      .DOC / .PDF
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-extrabold text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      Documento Word
                    </div>
                    <p className="text-[11px] leading-snug text-text-secondary">
                      Políticas, actas COPASST, procedimientos, RIT y formatos oficiales con firma digital.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5">
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      15 Plantillas SST
                    </span>
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      Firma Digital
                    </span>
                  </div>
                </button>

                {/* 2. Hoja de Cálculo Excel */}
                <button
                  onClick={() => {
                    const initialContent = JSON.stringify([
                      ['Indicador SG-SST (Res. 0312)', 'Meta Anual (%)', 'Q1 (%)', 'Q2 (%)', 'Q3 (%)', 'Q4 (%)', 'Promedio Real'],
                      ['Ejecución Plan Anual de Trabajo', '95', '88', '92', '95', '98', '=PROMEDIO(C2:F2)'],
                      ['Cumplimiento Cronograma Capacitación', '90', '85', '90', '92', '96', '=PROMEDIO(C3:F3)'],
                      ['Cierre de Acciones ACPM', '100', '80', '88', '94', '100', '=PROMEDIO(C4:F4)'],
                      ['Cobertura Exámenes Ocupacionales', '100', '95', '100', '100', '100', '=PROMEDIO(C5:F5)'],
                      ['PROMEDIO CONSOLIDADO', '=PROMEDIO(B2:B5)', '=PROMEDIO(C2:C5)', '=PROMEDIO(D2:D5)', '=PROMEDIO(E2:E5)', '=PROMEDIO(F2:F5)', '=PROMEDIO(G2:G5)'],
                    ]);
                    if (!conversationId || conversationId === 'new') {
                      initializeConvoAndSave('excel', initialContent, 'Tablero Indicadores SG-SST');
                    } else {
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      muteAutoSave(1500);
                      setFileType('excel');
                      setContent(initialContent);
                      setTitle('Tablero Indicadores SG-SST');
                      fileTypeRef.current = 'excel';
                      contentRef.current = initialContent;
                      titleRef.current = 'Tablero Indicadores SG-SST';
                      saveSession();
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-emerald-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.06] hover:shadow-md cursor-pointer"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      .XLSX NATIVO
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-extrabold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Hoja de Cálculo
                    </div>
                    <p className="text-[11px] leading-snug text-text-secondary">
                      Matrices GTC-45, presupuestos, indicadores Res. 0312, fórmulas en vivo y analítica gráfica.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5">
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      Fórmulas + Gráficos
                    </span>
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      Multi-Hoja
                    </span>
                  </div>
                </button>

                {/* 3. Presentación Ejecutiva PowerPoint */}
                <button
                  onClick={() => {
                    const initialContent = JSON.stringify([
                      {
                        title: 'Informe Ejecutivo de Rendición de Cuentas SG-SST',
                        subtitle: 'Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora',
                        kicker: 'DECRETO 1072 DE 2015 · ART. 2.2.4.6.31',
                        layout: 'title',
                        theme: 'wappy-dark',
                        bullets: [
                          'Cumplimiento de Estándares Mínimos Resolución 0312 de 2019',
                          'Gestión de Peligros Prioritarios y Vigilancia Epidemiológica',
                        ],
                        takeaway: 'Presentación oficial para aprobación de la Alta Dirección.',
                      },
                      {
                        title: 'El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual',
                        subtitle: 'Balance cuantitativo de los cuatro indicadores rectores del sistema',
                        kicker: 'TABLERO DE CONTROL GERENCIAL',
                        layout: 'kpi-grid',
                        theme: 'wappy-dark',
                        bullets: [
                          'Estándares Res. 0312: 94.5% (Nivel Aceptable)',
                          'Plan Anual de Trabajo: 92% ejecutado',
                          'Reducción de accidentalidad ATEL: -35%',
                          'Cobertura de exámenes médicos: 100%',
                        ],
                        kpis: [
                          { label: 'Estándares Res. 0312', value: '94.5%', delta: '+14.5% vs año ant.', trend: 'up', description: 'Calificación Aceptable (>85%)' },
                          { label: 'Plan Anual SST', value: '92.0%', delta: '46 de 50 actividades', trend: 'up', description: 'Ejecución presupuestal del 96%' },
                          { label: 'Siniestralidad ATEL', value: '-35%', delta: '0 accidentes graves', trend: 'down', description: 'Reducción sostenida en planta' },
                          { label: 'Cobertura EMO', value: '100%', delta: 'Res. 1843 de 2025', trend: 'up', description: 'Profesiograma y SVE al día' },
                        ],
                        takeaway: 'La intervención en la fuente redujo los días de incapacidad en un 41%.',
                      },
                      {
                        title: 'Transición de controles reactivos hacia controles de ingeniería en la fuente',
                        kicker: 'MATRIZ DE PELIGROS GTC-45',
                        layout: 'columns',
                        theme: 'emerald-sst',
                        bullets: ['Comparativa de estado inicial vs intervención ejecutada'],
                        columns: [
                          {
                            title: 'Estado Inicial (Riesgo Crítico)',
                            badge: 'Nivel I — NR 600',
                            theme: 'danger',
                            items: [
                              'Manipulación manual de cargas >25 kg sin ayudas mecánicas.',
                              'Permisos de trabajo en alturas diligenciados en papel.',
                            ],
                          },
                          {
                            title: 'Estado Actual (Control Ingeniería)',
                            badge: 'Nivel III — NR 80',
                            theme: 'success',
                            items: [
                              'Ayudas mecánicas hidráulicas instaladas en bodega central.',
                              'Trazabilidad digital en tiempo real mediante WAPPY IA.',
                            ],
                          },
                        ],
                        takeaway: '100% de los peligros críticos intervenidos con controles efectivos.',
                      },
                      {
                        title: 'Hoja de Ruta Estratégica PHVA para el Próximo Periodo',
                        kicker: 'MEJORA CONTINUA',
                        layout: 'timeline',
                        theme: 'wappy-cream',
                        bullets: ['Planificación trimestral verificable'],
                        steps: [
                          { phase: 'FASE 01 · PLANEAR', title: 'Diagnóstico e Higiene', detail: 'Actualización GTC-45 y mediciones ambientales.' },
                          { phase: 'FASE 02 · HACER', title: 'Intervención SVE', detail: 'Batería psicosocial y escuela de liderazgo.' },
                          { phase: 'FASE 03 · VERIFICAR', title: 'Auditoría e Inspección', detail: 'Simulacro anual y auditoría Decreto 1072.' },
                          { phase: 'FASE 04 · ACTUAR', title: 'Cierre de ACPM', detail: 'Cierre del 100% de hallazgos y revisión gerencial.' },
                        ],
                        takeaway: 'Compromiso gerencial con la mejora continua del SG-SST.',
                      },
                    ]);
                    if (!conversationId || conversationId === 'new') {
                      initializeConvoAndSave('presentation', initialContent, 'Presentación Ejecutiva SG-SST');
                    } else {
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      muteAutoSave(1500);
                      setFileType('presentation');
                      setContent(initialContent);
                      setTitle('Presentación Ejecutiva SG-SST');
                      fileTypeRef.current = 'presentation';
                      contentRef.current = initialContent;
                      titleRef.current = 'Presentación Ejecutiva SG-SST';
                      saveSession();
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] hover:shadow-md cursor-pointer"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <MonitorPlay className="h-5 w-5" />
                    </div>
                    <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-700 dark:text-green-300">
                      .PPTX EDITABLE
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-extrabold text-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Presentación Ejecutiva
                    </div>
                    <p className="text-[11px] leading-snug text-text-secondary">
                      10 layouts ejecutivos (KPIs, columnas, PHVA, tablas, gráficos) y exportación a PowerPoint.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5">
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      PowerPoint .PPTX
                    </span>
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      8 Temas Pro
                    </span>
                  </div>
                </button>

                {/* 4. Código Prototipo Web */}
                <button
                  onClick={() => {
                    const initialContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
  </style>
</head>
<body class="p-6 sm:p-12">
  <div class="max-w-xl text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-500">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
      <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
      Prototipo de Código WAPPY
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-6">
      Bienvenido al sandbox interactivo de prototipos en HTML. Inserta componentes premium de SST desde la barra lateral izquierda y observa cómo cobran vida en tiempo real en la vista previa.
    </p>
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25">
      <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
      <span class="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Listo para Inyectar</span>
    </div>
  </div>
</body>
</html>`;
                    if (!conversationId || conversationId === 'new') {
                      initializeConvoAndSave('html', initialContent, 'Prototipo de Código');
                    } else {
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      muteAutoSave(1500);
                      setFileType('html');
                      setContent(initialContent);
                      setTitle('Prototipo de Código');
                      fileTypeRef.current = 'html';
                      contentRef.current = initialContent;
                      titleRef.current = 'Prototipo de Código';
                      saveSession();
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/[0.06] hover:shadow-md cursor-pointer"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      .HTML5 APP
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-extrabold text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Código Prototipo
                    </div>
                    <p className="text-[11px] leading-snug text-text-secondary">
                      Calculadoras SST, simuladores, tableros interactivos y páginas web autocontenidas.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5">
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      Sandbox en Vivo
                    </span>
                    <span className="rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary">
                      Componentes SST
                    </span>
                  </div>
                </button>
              </div>

              {/* History Button — Group 12 (Orange) */}
              <div className="flex w-full pt-1">
                <button
                  onClick={() => setIsReportHistoryOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-xs sm:text-sm font-extrabold text-orange-700 dark:text-orange-300 shadow-xs transition-all duration-300 hover:bg-orange-500/20 sm:hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  <History className="h-4 w-4" />
                  <span>Explorar el Historial de Documentos Canvas</span>
                </button>
              </div>
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
            <div className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm">
                      <History className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">Versiones</h2>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    Historial de versiones de {title}
                  </p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto bg-surface-primary p-6">
                {!isPro && (
                  <div
                    onClick={() => (window.location.href = '/planes')}
                    className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 transition-all duration-300 hover:scale-[1.01] hover:bg-amber-500/15 dark:text-amber-300"
                  >
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
                    <div className="flex-1 text-sm">
                      <span className="font-bold">Límite del Plan Gratuito:</span> Solo conservamos
                      las últimas 5 versiones en este chat. Pásate a Pro para mantener un registro
                      de hasta 20 versiones.
                      <span className="ml-2 font-bold underline transition-colors hover:text-amber-900 dark:hover:text-amber-100">
                        ¡Subir de nivel ahora!
                      </span>
                    </div>
                  </div>
                )}
                {history.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border-light bg-surface-secondary">
                      <History className="h-8 w-8 text-text-tertiary" />
                    </div>
                    <p className="font-medium text-text-secondary">
                      No hay versiones previas guardadas aún.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {history.map((hItem, idx) => {
                      const isCurrent = hItem.version === version;
                      const itemFileType =
                        hItem.fileType || detectFileType(hItem.content) || fileType || 'text';

                      const renderTypeBadge = () => {
                        switch (itemFileType) {
                          case 'excel':
                            return (
                              <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                <FileSpreadsheet className="h-3 w-3 text-emerald-500" />
                                Hoja de Cálculo (Excel)
                              </span>
                            );
                          case 'presentation':
                            return (
                              <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                <MonitorPlay className="h-3 w-3 text-amber-500" />
                                Presentación (Slides)
                              </span>
                            );
                          case 'html':
                            return (
                              <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-purple-500/20 bg-purple-50 px-2 py-0.5 text-[9.5px] font-bold text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                                <Code2 className="h-3 w-3 text-purple-500" />
                                Prototipo HTML / Código
                              </span>
                            );
                          default:
                            return (
                              <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-sky-500/20 bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-600 dark:bg-sky-950/30 dark:text-sky-400">
                                <FileText className="h-3 w-3 text-sky-500" />
                                Documento de Texto (Word)
                              </span>
                            );
                        }
                      };

                      const isBlockedVersion = !isPro && idx < history.length - 5;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                            isCurrent
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                              : isBlockedVersion
                                ? 'border-dashed border-gray-300 bg-gray-50/50 opacity-60 hover:opacity-85 dark:border-gray-800 dark:bg-gray-900/5'
                                : 'border-border-medium bg-surface-secondary hover:border-teal-500/50'
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between border-b border-border-light pb-2">
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 font-bold text-text-primary">
                                  Versión {hItem.version}
                                </span>
                                {isCurrent && (
                                  <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                                    Actual
                                  </span>
                                )}
                              </div>
                              <span className="truncate text-xs text-text-tertiary">
                                {new Date(hItem.updatedAt).toLocaleString('es-ES')}
                              </span>
                              {renderTypeBadge()}
                            </div>

                            {!isBlockedVersion ? (
                              <VersionMenuDropdown
                                version={hItem.version}
                                title={hItem.title || title}
                                onRename={async (newName) => {
                                  try {
                                    const res = await fetch(
                                      `/api/sgsst/canvas/${conversationId}/versions/${hItem.version}/rename`,
                                      {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ title: newName }),
                                      },
                                    );
                                    if (res.ok) {
                                      const data = await res.json();
                                      setHistory(data.history || []);
                                      if (isCurrent) {
                                        setTitle(newName);
                                        titleRef.current = newName;
                                      }
                                    }
                                  } catch (e) {
                                    console.error('[Version History Rename] Error:', e);
                                  }
                                }}
                                onDelete={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/sgsst/canvas/${conversationId}/versions/${hItem.version}`,
                                      {
                                        method: 'DELETE',
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    if (res.ok) {
                                      const data = await res.json();
                                      setHistory(data.history || []);
                                    }
                                  } catch (e) {
                                    console.error('[Version History Delete] Error:', e);
                                  }
                                }}
                              />
                            ) : (
                              <span className="shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500">
                                🔒 PRO
                              </span>
                            )}
                          </div>
                          <div className="mb-4 line-clamp-3 flex-1 text-sm italic text-text-secondary opacity-80">
                            "{hItem.title || title}"
                          </div>
                          {isBlockedVersion ? (
                            <button
                              onClick={() => {
                                window.location.href = '/planes';
                              }}
                              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:hover:bg-amber-900/20"
                            >
                              <RotateCcw className="h-4 w-4 text-amber-500" />
                              Restaurar 🔒 PRO
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreVersion(hItem)}
                              disabled={isCurrent}
                              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-primary py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-teal-900/20"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restaurar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón flotante de salida rápida para celulares (garantiza que el usuario nunca quede atrapado) */}
        <button
          onClick={handleCloseCanvas}
          className="fixed bottom-6 right-6 z-[99999999] flex sm:hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-900/90 dark:bg-zinc-800/95 text-white shadow-2xl active:scale-90 border border-slate-400/30 backdrop-blur-md focus:outline-none"
          aria-label="Cerrar lienzo"
          title="Cerrar lienzo"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  // Use Portal when maximized to escape any relative/absolute parent boundaries and overflow hidden contexts
  const output = isMaximized ? ReactDOM.createPortal(panelContent, document.body) : panelContent;

  return (
    <>
      {output}

      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm duration-300 animate-in zoom-in-95">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute -top-10 right-0 z-50 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300"
            >
              Cerrar ✕
            </button>
            <UpgradeWall
              title={upgradeModalTitle}
              description={upgradeModalDesc}
              plan={user?.role || 'USER'}
              isPopup={true}
              hideFeatures={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CanvasPanel;
