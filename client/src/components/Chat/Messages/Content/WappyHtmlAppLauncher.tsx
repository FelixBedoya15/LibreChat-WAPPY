import React, { useState, useMemo } from 'react';
import { useSetRecoilState } from 'recoil';
import { Sparkles, Code2, ChevronDown, ChevronUp, Laptop } from 'lucide-react';
import store from '~/store';
import { useMessageContext } from '~/Providers/MessageContext';
import { useAuthContext } from '~/hooks/AuthContext';
import CodeBlock from '~/components/Messages/Content/CodeBlock';

interface WappyHtmlAppLauncherProps {
  codeString: string;
  lang?: string;
  codeChildren?: React.ReactNode;
  blockIndex?: number;
  canRunCode?: boolean;
  allowExecution?: boolean;
}

export const WappyHtmlAppLauncher: React.FC<WappyHtmlAppLauncherProps> = ({
  codeString,
  lang = 'html',
  codeChildren,
  blockIndex,
  canRunCode = false,
  allowExecution = true,
}) => {
  const [showSourceCode, setShowSourceCode] = useState(false);
  const { conversationId, messageId } = useMessageContext();
  const { token } = useAuthContext();
  const setStreamingCanvas = useSetRecoilState(store.streamingCanvasState);
  const setIsCanvasActive = useSetRecoilState(store.isCanvasActive);

  // Extract a clean descriptive title from the HTML document
  const extractedTitle = useMemo(() => {
    if (!codeString) return 'Aplicativo SG-SST Interactivo';

    // 1. Try <title id="app-document-title"> or <title>
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(codeString);
    if (titleMatch && titleMatch[1]?.trim()) {
      return titleMatch[1].trim();
    }

    // 2. Try <h1> tag
    const h1Match = /<h1[^>]*>([^<]+)<\/h1>/i.exec(codeString);
    if (h1Match && h1Match[1]?.trim()) {
      return h1Match[1].trim();
    }

    // 3. Try document header keywords
    const headerMatch = /id=["']app-document-title["'][^>]*>([^<]+)</i.exec(codeString);
    if (headerMatch && headerMatch[1]?.trim()) {
      return headerMatch[1].trim();
    }

    return 'Aplicativo SG-SST Interactivo';
  }, [codeString]);

  const handleOpenCanvas = () => {
    const activeConvoId = conversationId;
    const canvasIdentifier = `app-${messageId || Date.now()}`;

    // 1. Mount into Canvas state and open drawer
    setStreamingCanvas({
      id: canvasIdentifier,
      title: extractedTitle,
      fileType: 'html',
      content: codeString,
      messageId: messageId || '',
      isStreaming: false,
    });
    setIsCanvasActive(true);

    // 2. Persist to CanvasSession in backend
    if (activeConvoId && activeConvoId !== 'new' && token) {
      fetch(`/api/sgsst/canvas/${activeConvoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: codeString,
          title: extractedTitle,
          fileType: 'html',
          isManual: false,
        }),
      }).catch((err) => {
        console.error('[WappyHtmlAppLauncher] Failed to auto-persist canvas document:', err);
      });
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shadow-2xs border border-teal-200/60 dark:bg-teal-950/50 dark:border-teal-800/80 dark:text-teal-300">
            <Laptop className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Aplicativo Interactivo WAPPY
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate" title={extractedTitle}>
              {extractedTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
              Herramienta HTML interactiva generada para este caso.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleOpenCanvas}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Abrir en Lienzo (Canvas)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSourceCode(!showSourceCode)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-slate-200 dark:border-zinc-700 cursor-pointer"
            title={showSourceCode ? 'Ocultar código' : 'Ver código fuente'}
          >
            <Code2 className="h-3.5 w-3.5" />
            {showSourceCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {showSourceCode && (
        <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-zinc-800">
          <CodeBlock
            lang={lang}
            codeChildren={codeChildren ?? codeString}
            blockIndex={blockIndex}
            allowExecution={allowExecution && canRunCode}
          />
        </div>
      )}
    </div>
  );
};

export default WappyHtmlAppLauncher;
