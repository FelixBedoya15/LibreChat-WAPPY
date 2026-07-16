import React, { useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import type { Pluggable } from 'unified';
import { visit } from 'unist-util-visit';
import { useMessageContext } from '~/Providers';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';
import { extractContent } from '~/utils';

export const canvasPlugin: Pluggable = () => {
  return (tree) => {
    visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node, index, parent) => {
      if (node.type === 'textDirective') {
        const replacementText = `:${node.name}`;
        if (parent && Array.isArray(parent.children) && typeof index === 'number') {
          parent.children[index] = {
            type: 'text',
            value: replacementText,
          };
        }
      }
      if (node.name !== 'canvas') {
        return;
      }
      node.data = {
        hName: node.name,
        hProperties: node.attributes,
        ...node.data,
      };
      return node;
    });
  };
};

const defaultTitle = 'Archivo sin título';
const defaultFileType = 'text';
const defaultIdentifier = 'canvas-doc';

export function CanvasDirective({
  node: _node,
  ...props
}: {
  title?: string;
  fileType?: 'text' | 'excel' | 'presentation' | 'html' | 'animo' | 'actos_condiciones';
  identifier?: string;
  children: React.ReactNode | { props: { children: React.ReactNode } };
  node: unknown;
}) {
  const { messageId, conversationId, isSubmitting = false, isLatestMessage = false } = useMessageContext();
  const { token } = useAuthContext();
  const setStreamingCanvas = useSetRecoilState(store.streamingCanvasState);
  const setIsCanvasActive = useSetRecoilState(store.isCanvasActive);

  const prevIsSubmittingRef = useRef<boolean>(isSubmitting);
  const contentRef = useRef<string>('');

  const title = props.title ?? defaultTitle;
  const fileType = props.fileType ?? defaultFileType;
  const identifier = props.identifier ?? defaultIdentifier;

  const content = extractContent(props.children);
  contentRef.current = content;

  // 1. Sync content streaming in real-time
  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;

    setStreamingCanvas({
      id: identifier,
      title,
      fileType,
      content,
      messageId,
      isStreaming: isSubmitting && isLatestMessage,
    });
    setIsCanvasActive(true);

    return () => {
      // Cleanup on unmount
      setStreamingCanvas(null);
    };
  }, [content, title, fileType, identifier, messageId, conversationId, isSubmitting, isLatestMessage, setStreamingCanvas, setIsCanvasActive]);

  // 2. Asynchronous Auto-save when generating finishes (isSubmitting transitions true -> false)
  useEffect(() => {
    const activeConvoId = conversationId;
    if (!activeConvoId || activeConvoId === 'new') return;

    if (prevIsSubmittingRef.current === true && isSubmitting === false && isLatestMessage) {
      // Fire-and-forget save to MongoDB in background
      fetch(`/api/sgsst/canvas/${activeConvoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: contentRef.current,
          title,
          fileType,
          isManual: false,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log('[CanvasDirective] Auto-save success after streaming.');
          } else {
            console.warn('[CanvasDirective] Auto-save returned success false.', data);
          }
        })
        .catch((err) => {
          console.error('[CanvasDirective] Background auto-save failed:', err);
        });
    }

    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, isLatestMessage, conversationId, token, title, fileType]);

  return null; // The directive renders nothing in the markdown chat itself
}
