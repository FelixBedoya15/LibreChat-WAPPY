import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useToastContext } from '@librechat/client';
import { PermissionTypes, Permissions, dataService } from 'librechat-data-provider';
import CodeBlock from '~/components/Messages/Content/CodeBlock';
import useHasAccess from '~/hooks/Roles/useHasAccess';
import { useFileDownload } from '~/data-provider/Files/queries';
import { useCodeBlockContext } from '~/Providers/CodeBlockContext';
import { handleDoubleClick } from '~/utils';
import useLocalize from '~/hooks/useLocalize';
import store from '~/store/user';
import { WappyCard } from './WappyCard';
import { WappyHtmlAppLauncher } from './WappyHtmlAppLauncher';

type TCodeProps = {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const code: React.ElementType = memo(({ className, children }: TCodeProps) => {
  const canRunCode = useHasAccess({
    permissionType: PermissionTypes.RUN_CODE,
    permission: Permissions.USE,
  });
  const match = /language-([a-zA-Z0-9_-]+)/.exec(className ?? '');
  const lang = match && match[1];
  const isMath = lang === 'math';
  const isSingleLine = typeof children === 'string' && children.split('\n').length === 1;

  const codeString = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.join('')
      : children?.toString() || '';

  const isWappyCard = (lang === 'wappy-card' || lang === 'card') && codeString.trim().startsWith('{');
  const lowerCode = codeString.toLowerCase();
  const isHtmlDocument =
    (lang === 'html' || lang === 'htm' || !lang) &&
    (lowerCode.includes('<!doctype html') || (lowerCode.includes('<html') && lowerCode.includes('</html>')));

  const { getNextIndex, resetCounter } = useCodeBlockContext();
  const blockIndex = useRef(getNextIndex(isMath || isSingleLine || isWappyCard || isHtmlDocument)).current;

  useEffect(() => {
    resetCounter();
  }, [children, resetCounter]);

  if (isMath) {
    return <>{children}</>;
  } else if (isWappyCard) {
    return <WappyCard content={codeString} />;
  } else if (isHtmlDocument) {
    return (
      <WappyHtmlAppLauncher
        codeString={codeString}
        lang={lang ?? 'html'}
        codeChildren={children}
        blockIndex={blockIndex}
        canRunCode={canRunCode}
        allowExecution={canRunCode}
      />
    );
  } else if (isSingleLine) {
    return (
      <code onDoubleClick={handleDoubleClick} className={className}>
        {children}
      </code>
    );
  } else {
    return (
      <CodeBlock
        lang={lang ?? 'text'}
        codeChildren={children}
        blockIndex={blockIndex}
        allowExecution={canRunCode}
      />
    );
  }
});

export const codeNoExecution: React.ElementType = memo(({ className, children }: TCodeProps) => {
  const match = /language-([a-zA-Z0-9_-]+)/.exec(className ?? '');
  const lang = match && match[1];

  const codeString = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.join('')
      : children?.toString() || '';

  const isWappyCard = (lang === 'wappy-card' || lang === 'card') && codeString.trim().startsWith('{');
  const lowerCode = codeString.toLowerCase();
  const isHtmlDocument =
    (lang === 'html' || lang === 'htm' || !lang) &&
    (lowerCode.includes('<!doctype html') || (lowerCode.includes('<html') && lowerCode.includes('</html>')));

  if (lang === 'math') {
    return children;
  } else if (isWappyCard) {
    return <WappyCard content={codeString} />;
  } else if (isHtmlDocument) {
    return (
      <WappyHtmlAppLauncher
        codeString={codeString}
        lang={lang ?? 'html'}
        codeChildren={children}
        allowExecution={false}
      />
    );
  } else if (typeof children === 'string' && children.split('\n').length === 1) {
    return (
      <code onDoubleClick={handleDoubleClick} className={className}>
        {children}
      </code>
    );
  } else {
    return <CodeBlock lang={lang ?? 'text'} codeChildren={children} allowExecution={false} />;
  }
});

type TAnchorProps = {
  href: string;
  children: React.ReactNode;
};

export const NotebookLMArtifactPlayer: React.FC<{ href: string; children?: React.ReactNode }> = memo(
  ({ href, children }) => {
    const lowerHref = href.toLowerCase();
    const isVideo = lowerHref.includes('type=video') || lowerHref.includes('type=cinematic_video');
    const isAudio = lowerHref.includes('type=audio') || lowerHref.includes('type=podcast');
    const isInfographic = lowerHref.includes('type=infographic') || lowerHref.includes('type=infografia');
    const isMedia = isVideo || isAudio || isInfographic;

    const [ready, setReady] = useState<boolean>(!isMedia);
    const [checking, setChecking] = useState<boolean>(isMedia);
    const [title, setTitle] = useState<string>('');
    const [publicUrl, setPublicUrl] = useState<string>('');
    const [retryTick, setRetryTick] = useState<number>(0);

    const statusUrl = useMemo(() => {
      const sep = href.includes('?') ? '&' : '?';
      return `${href}${sep}status_only=1`;
    }, [href]);

    const downloadHref = useMemo(() => {
      if (publicUrl) return publicUrl;
      const sep = href.includes('?') ? '&' : '?';
      return `${href}${sep}download=1`;
    }, [href, publicUrl]);

    const checkStatus = useCallback(async () => {
      if (!isMedia) return;
      try {
        setChecking(true);
        const res = await fetch(statusUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.title) setTitle(String(data.title));
          if (data?.publicUrl) setPublicUrl(String(data.publicUrl));
          if (data?.ready === true || data?.status === 'completed') {
            setReady(true);
          }
        }
      } catch {
        // Ignore transient network errors while polling
      } finally {
        setChecking(false);
      }
    }, [isMedia, statusUrl]);

    useEffect(() => {
      if (!isMedia || ready) return;
      checkStatus();
      const interval = setInterval(() => {
        checkStatus();
      }, 10000);
      return () => clearInterval(interval);
    }, [isMedia, ready, checkStatus]);

    const mediaSrc = useMemo(() => {
      const baseSrc = publicUrl || href;
      if (retryTick === 0) return baseSrc;
      const sep = baseSrc.includes('?') ? '&' : '?';
      return `${baseSrc}${sep}t=${retryTick}`;
    }, [href, publicUrl, retryTick]);

    return (
      <span className="my-2 block overflow-hidden rounded-xl border border-teal-500/30 bg-teal-500/5 p-3">
        {isMedia && !ready ? (
          <span className="mb-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-teal-500/20 bg-slate-900/80 px-4 py-6 text-center text-slate-200">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
            <span className="text-xs font-bold text-teal-300">
              🎬 Google NotebookLM Studio está renderizando tu {isVideo ? 'video' : isAudio ? 'podcast' : 'infografía'}
              {title ? ` (${title})` : ''}...
            </span>
            <span className="max-w-md text-[11px] text-slate-400">
              Los recursos multimedia narrados con IA toman entre 2 y 7 minutos en procesarse en los servidores de Google. Se reproducirá aquí automáticamente apenas esté listo.
            </span>
            <button
              type="button"
              onClick={() => checkStatus()}
              disabled={checking}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {checking ? 'Verificando estado...' : '🔄 Verificar ahora'}
            </button>
          </span>
        ) : (
          <>
            {isVideo && (
              <video
                key={mediaSrc}
                controls
                playsInline
                preload="metadata"
                src={mediaSrc}
                onError={() => {
                  setReady(false);
                  setRetryTick((n) => n + 1);
                }}
                className="mb-2 max-h-96 w-full rounded-lg bg-black"
              />
            )}
            {isAudio && (
              <audio
                key={mediaSrc}
                controls
                preload="metadata"
                src={mediaSrc}
                onError={() => {
                  setReady(false);
                  setRetryTick((n) => n + 1);
                }}
                className="mb-2 w-full"
              />
            )}
            {isInfographic && (
              <img
                key={mediaSrc}
                src={mediaSrc}
                alt={title || 'Infografía NotebookLM'}
                onError={() => {
                  setReady(false);
                  setRetryTick((n) => n + 1);
                }}
                className="mb-2 max-h-[520px] w-auto rounded-lg border border-border-light object-contain"
              />
            )}
          </>
        )}
        <span className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={downloadHref}
            download={Boolean(publicUrl)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-700 transition-all hover:bg-green-500/20 dark:text-green-300"
          >
            ⬇ {children || 'Descargar desde Google NotebookLM'}
          </a>
          {publicUrl && (
            <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
              💾 Guardado en WAPPY (30 días): <code className="rounded bg-black/10 px-1 py-0.5 text-[10px]">{publicUrl}</code>
            </span>
          )}
        </span>
      </span>
    );
  },
);

export const a: React.ElementType = memo(({ href, children }: TAnchorProps) => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const localize = useLocalize();

  const {
    file_id = '',
    filename = '',
    filepath,
  } = useMemo(() => {
    const pattern = new RegExp(`(?:files|outputs)/${user?.id}/([^\\s]+)`);
    const match = href.match(pattern);
    if (match && match[0]) {
      const path = match[0];
      const parts = path.split('/');
      const name = parts.pop();
      const file_id = parts.pop();
      return { file_id, filename: name, filepath: path };
    }
    return { file_id: '', filename: '', filepath: '' };
  }, [user?.id, href]);

  const { refetch: downloadFile } = useFileDownload(user?.id ?? '', file_id);
  const props: { target?: string; onClick?: React.MouseEventHandler } = { target: '_new' };

  if (!file_id || !filename) {
    if (href && href.includes('/api/notebooklm/download/')) {
      return <NotebookLMArtifactPlayer href={href} children={children} />;
    }
    const isMp4Video =
      href &&
      (/\.mp4(?:$|\?)/i.test(href) || href.includes('/images/flow_vid_'));
    if (isMp4Video) {
      const childText =
        typeof children === 'string'
          ? children
          : Array.isArray(children)
            ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
            : '';
      const isDownloadLink = /descargar|download/i.test(childText);
      const cleanVideoSrc = href.split('?')[0];
      let posterUrl = '';
      try {
        const qIndex = href.indexOf('?');
        if (qIndex !== -1) {
          const sp = new URLSearchParams(href.slice(qIndex + 1));
          posterUrl = sp.get('poster') || '';
        }
      } catch {
        // ignore URLSearchParams error
      }
      if (isDownloadLink) {
        return (
          <a
            href={cleanVideoSrc}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-700 transition-all hover:bg-green-500/20 dark:text-green-300"
          >
            {children}
          </a>
        );
      }
      return (
        <span className="my-3 block overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3 shadow-lg">
          <video
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            src={cleanVideoSrc}
            poster={posterUrl || undefined}
            className="mb-2.5 max-h-[520px] w-full rounded-xl bg-black object-contain"
          />
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              🎬 Google Flow Studio (Veo 3.1 Lite)
            </span>
            <a
              href={cleanVideoSrc}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-700 transition-all hover:bg-green-500/20 dark:text-green-300"
            >
              ⬇ Descargar Video MP4
            </a>
          </span>
        </span>
      );
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  const handleDownload = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      const stream = await downloadFile();
      if (stream.data == null || stream.data === '') {
        console.error('Error downloading file: No data found');
        showToast({
          status: 'error',
          message: localize('com_ui_download_error'),
        });
        return;
      }
      const link = document.createElement('a');
      link.href = stream.data;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(stream.data);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  props.onClick = handleDownload;
  props.target = '_blank';

  const domainServerBaseUrl = dataService.getDomainServerBaseUrl();

  return (
    <a
      href={
        filepath?.startsWith('files/')
          ? `${domainServerBaseUrl}/${filepath}`
          : `${domainServerBaseUrl}/files/${filepath}`
      }
      {...props}
    >
      {children}
    </a>
  );
});

type TParagraphProps = {
  children: React.ReactNode;
};

export const p: React.ElementType = memo(({ children }: TParagraphProps) => {
  return <p className="mb-2 whitespace-pre-wrap">{children}</p>;
});

export const table: React.ElementType = memo(({ children, ...props }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      if (maxScrollLeft > 2 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScrollRight = e.deltaY > 0 && el.scrollLeft < maxScrollLeft - 1;
        const canScrollLeft = e.deltaY < 0 && el.scrollLeft > 1;
        if (canScrollRight || canScrollLeft) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="table-responsive custom-table-scroll my-3 w-full max-w-full overflow-x-auto rounded-xl border border-border-medium bg-surface-primary"
    >
      <table {...props} className="w-full min-w-full border-collapse text-xs">
        {children}
      </table>
    </div>
  );
});

