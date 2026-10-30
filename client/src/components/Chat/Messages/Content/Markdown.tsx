import React, { memo, useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import supersub from 'remark-supersub';
import rehypeKatex from 'rehype-katex';
import { useRecoilValue } from 'recoil';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkDirective from 'remark-directive';
import type { Pluggable } from 'unified';
import { Citation, CompositeCitation, HighlightedText } from '~/components/Web/Citation';
import { Artifact, artifactPlugin } from '~/components/Artifacts/Artifact';
import { CanvasDirective, canvasPlugin } from '~/components/Canvas/CanvasDirective';
import { ArtifactProvider } from '~/Providers/ArtifactContext';
import { CodeBlockProvider } from '~/Providers/CodeBlockContext';
import MarkdownErrorBoundary from './MarkdownErrorBoundary';
import { langSubset, preprocessLaTeX } from '~/utils';
import { unicodeCitation } from '~/components/Web/plugin';
import { code, a, p, table, img } from './MarkdownComponents';
import store from '~/store/settings';

function normalizeGeneratedMediaKey(rawUrl: string): string | null {
  if (!rawUrl) {
    return null;
  }
  const url = String(rawUrl).trim().replace(/^<|>$/g, '');
  const hallMatch = url.match(/\/images\/((?:flow|nlm|sst|antigravity)_[a-zA-Z0-9_.-]+\.[a-z0-9]+)/i);
  if (hallMatch?.[1]) {
    return `/images/${hallMatch[1].toLowerCase()}`;
  }
  const cleanPath = url.split('?')[0];
  if (
    /^\/images\/[^?]+\.(?:jpg|jpeg|png|webp|mp4)$/i.test(cleanPath) &&
    !/^\/images\/(?:ghs|avatars|icons|logos|assets)\//i.test(cleanPath)
  ) {
    return cleanPath.toLowerCase();
  }
  if (cleanPath.toLowerCase().includes('/api/notebooklm/download/')) {
    return cleanPath.toLowerCase();
  }
  return null;
}

function deduplicateGeneratedMediaMarkdown(input: string): string {
  let text = input;
  if (text.includes('<video')) {
    text = text.replace(/<video\b([^>]*)>(?:[\s\S]*?<\/video>)?/gi, (_match, attrs = '') => {
      const srcMatch = String(attrs).match(/\bsrc=["']([^"']+)["']/i);
      if (!srcMatch?.[1]) {
        return _match;
      }
      const posterMatch = String(attrs).match(/\bposter=["']([^"']+)["']/i);
      const srcUrl = srcMatch[1];
      const finalUrl = posterMatch?.[1]
        ? `${srcUrl}${srcUrl.includes('?') ? '&' : '?'}poster=${encodeURIComponent(posterMatch[1])}`
        : srcUrl;
      return `\n\n[🎬 Video Generado con Google Flow Studio](${finalUrl})\n\n`;
    });
  }

  const seenImages = new Set<string>();
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (fullMatch, _alt, url) => {
    const key = normalizeGeneratedMediaKey(url);
    if (!key) {
      return fullMatch;
    }
    if (seenImages.has(key)) {
      return '';
    }
    seenImages.add(key);
    return fullMatch;
  });

  const seenLinks = new Set<string>();
  text = text.replace(
    /(^[ \t]*(?:[-*•][ \t]+)?(?:[📥⬇🎬🔗✨💾🖼️📹]+\s*)?(?:\*\*[^*\n]{1,60}\*\*:?[ \t]*)?(?:[📥⬇🎬🔗✨💾🖼️📹]+\s*)?)?(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gm,
    (fullMatch, _prefix = '', _label, url) => {
      const key = normalizeGeneratedMediaKey(url);
      if (!key) {
        return fullMatch;
      }
      if (seenImages.has(key) || seenLinks.has(key)) {
        return '';
      }
      seenLinks.add(key);
      return fullMatch;
    },
  );

  return text.replace(/\n{3,}/g, '\n\n');
}

type TContentProps = {
  content: string;
  isLatestMessage: boolean;
};

const Markdown = memo(({ content = '', isLatestMessage }: TContentProps) => {
  const LaTeXParsing = useRecoilValue<boolean>(store.LaTeXParsing);
  const isInitializing = content === '';

  const currentContent = useMemo(() => {
    if (isInitializing) {
      return '';
    }
    const base = LaTeXParsing ? preprocessLaTeX(content) : content;
    return deduplicateGeneratedMediaMarkdown(base);
  }, [content, LaTeXParsing, isInitializing]);

  const rehypePlugins = useMemo(
    () => [
      [rehypeKatex],
      [
        rehypeHighlight,
        {
          detect: true,
          ignoreMissing: true,
          subset: langSubset,
        },
      ],
    ],
    [],
  );

  const remarkPlugins: Pluggable[] = [
    supersub,
    remarkGfm,
    remarkDirective,
    artifactPlugin,
    canvasPlugin,
    [remarkMath, { singleDollarTextMath: false }],
    unicodeCitation,
  ];

  if (isInitializing) {
    if (!isLatestMessage) {
      return null;
    }
    return (
      <div className="flex items-center gap-2.5 py-1.5 text-text-secondary select-none">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-text-secondary/80 animate-pulse">
          Pensando respuesta...
        </span>
      </div>
    );
  }

  return (
    <MarkdownErrorBoundary content={content} codeExecution={true}>
      <ArtifactProvider>
        <CodeBlockProvider>
          <ReactMarkdown
            /** @ts-ignore */
            remarkPlugins={remarkPlugins}
            /* @ts-ignore */
            rehypePlugins={rehypePlugins}
            components={
              {
                code,
                a,
                p,
                table,
                img,
                artifact: Artifact,
                canvas: CanvasDirective,
                citation: Citation,
                'highlighted-text': HighlightedText,
                'composite-citation': CompositeCitation,
              } as {
                [nodeType: string]: React.ElementType;
              }
            }
          >
            {currentContent}
          </ReactMarkdown>
        </CodeBlockProvider>
      </ArtifactProvider>
    </MarkdownErrorBoundary>
  );
});

export default Markdown;
