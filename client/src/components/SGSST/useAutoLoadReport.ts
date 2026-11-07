import { useEffect, useRef, useCallback } from 'react';

export interface AutoLoadReportParams {
  token?: string | null;
  tag?: string;
  tags?: string[];
  additionalTags?: string[];
  generatedReport?: string | null;
  handleSelectReport?: (conversationIdOrHtml: string) => Promise<void> | void;
  onLoad?: (content: string, conversationId?: string | null, messageId?: string | null) => void;
  setReport?: (content: string) => void;
  setConversationId?: (id: string | null) => void;
  liveEditorRef?: { current?: { setHTML?: (html: string) => void } | null };
  enabled?: boolean;
}

export function getActiveCompanyId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('wappy_active_company_id') || 'default';
}

export function getReportCacheKey(companyId: string, primaryTag: string): string {
  return `wappy_sgsst_report_${companyId || 'default'}_${primaryTag || 'report'}`;
}

export function saveReportToLocalCache(
  primaryTag: string,
  content: string,
  conversationId?: string | null,
  messageId?: string | null,
  companyIdOverride?: string | null,
) {
  if (typeof window === 'undefined' || !primaryTag || !content) return;
  try {
    const companyId = companyIdOverride || getActiveCompanyId();
    const key = getReportCacheKey(companyId, primaryTag);
    const prevRaw = localStorage.getItem(key);
    let prev: any = null;
    if (prevRaw) {
      try {
        prev = JSON.parse(prevRaw);
      } catch {
        prev = null;
      }
    }
    const payload = {
      content,
      conversationId: conversationId ?? prev?.conversationId ?? null,
      messageId: messageId ?? prev?.messageId ?? null,
      companyId,
      tag: primaryTag,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[useAutoLoadReport] Could not write to localStorage cache:', err);
  }
}

/**
 * useAutoLoadReport — Carga automática, aislamiento por empresa activa y auto-persistencia
 * para los 35 aplicativos SG-SST.
 */
export function useAutoLoadReport(
  paramsOrTag: AutoLoadReportParams | string,
  maybeOnLoadCallback?: (html: string, conversationId?: string | null) => void,
) {
  const isStringArg = typeof paramsOrTag === 'string';
  const params: AutoLoadReportParams = isStringArg
    ? { tag: paramsOrTag, onLoad: maybeOnLoadCallback }
    : paramsOrTag || {};

  const {
    token,
    tag,
    tags,
    additionalTags,
    generatedReport,
    handleSelectReport,
    onLoad,
    setReport,
    setConversationId,
    liveEditorRef,
    enabled = true,
  } = params;

  const tagsList = [
    ...(Array.isArray(tags) ? tags : []),
    ...(tag ? [tag] : []),
    ...(Array.isArray(additionalTags) ? additionalTags : []),
  ].filter(Boolean);

  const primaryTag = tagsList[0] || 'report';
  const tagsKey = tagsList.join(',');

  // Keep latest callbacks in refs to avoid re-triggering effects on every render
  const handleSelectReportRef = useRef(handleSelectReport);
  handleSelectReportRef.current = handleSelectReport;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const setReportRef = useRef(setReport);
  setReportRef.current = setReport;
  const setConversationIdRef = useRef(setConversationId);
  setConversationIdRef.current = setConversationId;
  const liveEditorRefCurrent = useRef(liveEditorRef);
  liveEditorRefCurrent.current = liveEditorRef;

  const lastServerHtmlRef = useRef<string>('');
  const prevCompanyIdRef = useRef<string>(getActiveCompanyId());
  const autoSavedConvoRef = useRef<{
    conversationId: string;
    messageId: string;
    companyId: string;
  } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register active tag on window so LiveEditor / CollapsibleReportBox can reference it
  useEffect(() => {
    if (typeof window !== 'undefined' && primaryTag) {
      (window as any).__wappyActiveSgsstReportTag = primaryTag;
      (window as any).__wappyActiveSgsstReportTags = tagsList;
    }
  }, [primaryTag, tagsKey]);

  const applyReportToComponent = useCallback(
    async (
      content: string,
      convoId: string | null,
      msgId: string | null,
      companyId: string,
      fromServerFetch: boolean,
    ) => {
      onLoadRef.current?.(content, convoId, msgId);
      setReportRef.current?.(content);
      if (convoId) {
        setConversationIdRef.current?.(convoId);
      }
      if (liveEditorRefCurrent.current?.current?.setHTML) {
        liveEditorRefCurrent.current.current.setHTML(content);
      }

      // Broadcast to LiveEditor and CollapsibleReportBox so they hydrate & expand immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('wappy-hydrate-live-editor', {
            detail: {
              html: content,
              tag: primaryTag,
              companyId,
              clear: !content,
            },
          }),
        );
        if (content && content.trim().length > 0) {
          window.dispatchEvent(
            new CustomEvent('wappy-report-loaded', {
              detail: {
                tag: primaryTag,
                companyId,
                content,
                conversationId: convoId,
              },
            }),
          );
          window.dispatchEvent(
            new CustomEvent('wappy-live-editor-content-set', {
              detail: { html: content, tag: primaryTag },
            }),
          );
        }
      }

      const selectFn = handleSelectReportRef.current;
      if (selectFn && content) {
        const fnSource = String(selectFn);
        const expectsConvoId = fnSource.includes('/api/messages');
        if (expectsConvoId) {
          if (convoId && convoId !== 'new' && fromServerFetch) {
            try {
              await selectFn(convoId);
            } catch (err) {
              console.warn('[useAutoLoadReport] handleSelectReport(convoId) error:', err);
            }
          }
        } else {
          try {
            await selectFn(content);
          } catch (err) {
            console.warn('[useAutoLoadReport] handleSelectReport(content) error:', err);
          }
        }
      } else if (selectFn && !content && !String(selectFn).includes('/api/messages')) {
        try {
          await selectFn('');
        } catch {
          /* ignore */
        }
      }
    },
    [primaryTag],
  );

  const loadForCompany = useCallback(
    async (companyChanged = false) => {
      if (!enabled || !primaryTag) return;

      const companyId = getActiveCompanyId();
      const cacheKey = getReportCacheKey(companyId, primaryTag);

      // 1. Instant hydration from company-scoped localStorage cache
      let hydratedFromCache = false;
      let cachedConvoId: string | null = null;
      try {
        const rawCache = localStorage.getItem(cacheKey);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          if (
            parsed &&
            (!parsed.companyId || parsed.companyId === companyId) &&
            typeof parsed.content === 'string' &&
            parsed.content.trim().length > 0
          ) {
            hydratedFromCache = true;
            cachedConvoId = parsed.conversationId || null;
            lastServerHtmlRef.current = parsed.content;
            if (parsed.conversationId && parsed.conversationId !== 'new') {
              autoSavedConvoRef.current = {
                conversationId: parsed.conversationId,
                messageId: parsed.messageId || '',
                companyId,
              };
            }
            await applyReportToComponent(
              parsed.content,
              parsed.conversationId || null,
              parsed.messageId || null,
              companyId,
              false,
            );
          }
        }
      } catch (e) {
        console.warn('[useAutoLoadReport] Cache read error:', e);
      }

      // 2. Fetch latest report from server for the active company
      const effectiveToken =
        token ||
        (typeof window !== 'undefined'
          ? (window as any).platformUserToken || localStorage.getItem('token')
          : null);

      if (!effectiveToken) {
        if (companyChanged && !hydratedFromCache) {
          lastServerHtmlRef.current = '';
          autoSavedConvoRef.current = null;
          await applyReportToComponent('', null, null, companyId, false);
        }
        return;
      }

      try {
        const candidateTags = tagsKey.split(',').filter(Boolean);
        let conversations: any[] = [];
        let serverCompanyId: string | null = null;

        for (const candidateTag of candidateTags) {
          const res = await fetch(
            `/api/sgsst/diagnostico/report-history?tags=${encodeURIComponent(candidateTag)}`,
            {
              headers: { Authorization: `Bearer ${effectiveToken}` },
              cache: 'no-store',
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (data.companyId) {
              serverCompanyId = String(data.companyId);
              if (
                typeof window !== 'undefined' &&
                !localStorage.getItem('wappy_active_company_id')
              ) {
                localStorage.setItem('wappy_active_company_id', serverCompanyId);
              }
            }
            const list =
              Array.isArray(data.reports) && data.reports.length > 0
                ? data.reports
                : Array.isArray(data.conversations)
                  ? data.conversations
                  : [];
            if (list.length > 0) {
              conversations = list;
              break;
            }
          }
        }

        const effectiveCompanyId = serverCompanyId || companyId;

        if (conversations.length > 0) {
          const latest = conversations[0];
          const latestConvoId = latest.conversationId || latest._id || '';
          let latestHtml = latest.content || latest.text || '';
          let latestMsgId = latest.messageId || '';

          if (!latestHtml && latestConvoId) {
            const msgRes = await fetch(`/api/messages/${latestConvoId}`, {
              headers: { Authorization: `Bearer ${effectiveToken}` },
              cache: 'no-store',
            });
            if (msgRes.ok) {
              const messages = await msgRes.json();
              if (Array.isArray(messages) && messages.length > 0) {
                const lastMsg =
                  [...messages]
                    .reverse()
                    .find(
                      (m: any) =>
                        (m.isCreatedByUser === false && m.text?.trim()) ||
                        m.sender === 'SGSST Diagnóstico' ||
                        m.text?.trim(),
                    ) || messages[messages.length - 1];
                if (lastMsg?.text) {
                  latestHtml = lastMsg.text;
                  latestMsgId = lastMsg.messageId || '';
                }
              }
            }
          }

          if (latestHtml && latestHtml.trim().length > 0) {
            lastServerHtmlRef.current = latestHtml;
            autoSavedConvoRef.current = {
              conversationId: latestConvoId,
              messageId: latestMsgId,
              companyId: effectiveCompanyId,
            };
            saveReportToLocalCache(
              primaryTag,
              latestHtml,
              latestConvoId,
              latestMsgId,
              effectiveCompanyId,
            );
            if (effectiveCompanyId !== companyId) {
              saveReportToLocalCache(
                primaryTag,
                latestHtml,
                latestConvoId,
                latestMsgId,
                companyId,
              );
            }

            await applyReportToComponent(
              latestHtml,
              latestConvoId,
              latestMsgId,
              effectiveCompanyId,
              true,
            );
            return;
          }
        }

        // 3. Server returned 0 reports for this company
        if (companyChanged || (!hydratedFromCache && !cachedConvoId)) {
          if (companyChanged) {
            lastServerHtmlRef.current = '';
            autoSavedConvoRef.current = null;
            await applyReportToComponent('', null, null, effectiveCompanyId, false);
          }
        }
      } catch (err) {
        console.warn('[useAutoLoadReport] Error loading report history:', err);
      }
    },
    [enabled, primaryTag, tagsKey, token, applyReportToComponent],
  );

  // Run on mount and when tag/token changes
  useEffect(() => {
    loadForCompany(false);
  }, [loadForCompany]);

  // Listen for active company changes (cross-company isolation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCompanyChange = () => {
      const currentCompanyId = getActiveCompanyId();
      const changed = currentCompanyId !== prevCompanyIdRef.current;
      prevCompanyIdRef.current = currentCompanyId;
      loadForCompany(changed || true);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'wappy_active_company_id') {
        handleCompanyChange();
      }
    };

    window.addEventListener('wappy-company-changed', handleCompanyChange);
    window.addEventListener('wappy-empresa-cambiada', handleCompanyChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('wappy-company-changed', handleCompanyChange);
      window.removeEventListener('wappy-empresa-cambiada', handleCompanyChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadForCompany]);

  // Watch `generatedReport` prop: when a new report is generated in the module,
  // immediately cache it in localStorage, expand CollapsibleReportBox, and auto-save to backend
  useEffect(() => {
    if (!generatedReport || typeof generatedReport !== 'string') return;
    const trimmed = generatedReport.trim();
    if (trimmed.length < 20) return;

    const companyId = getActiveCompanyId();

    // Always update local cache immediately so switching tabs never loses the report
    saveReportToLocalCache(
      primaryTag,
      generatedReport,
      autoSavedConvoRef.current?.companyId === companyId
        ? autoSavedConvoRef.current.conversationId
        : null,
      autoSavedConvoRef.current?.companyId === companyId
        ? autoSavedConvoRef.current.messageId
        : null,
      companyId,
    );

    // Notify CollapsibleReportBox and LiveEditor immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wappy-hydrate-live-editor', {
          detail: { html: generatedReport, tag: primaryTag, companyId },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('wappy-report-loaded', {
          detail: { tag: primaryTag, companyId, content: generatedReport },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('wappy-live-editor-content-set', {
          detail: { html: generatedReport, tag: primaryTag },
        }),
      );
    }

    // If this matches what we already loaded/saved from the server, do not re-POST
    if (trimmed === lastServerHtmlRef.current.trim()) {
      return;
    }

    lastServerHtmlRef.current = generatedReport;

    const effectiveToken =
      token ||
      (typeof window !== 'undefined'
        ? (window as any).platformUserToken || localStorage.getItem('token')
        : null);

    if (!effectiveToken) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        // Check if backend /generate route or manual save already persisted a report in the last 10s
        const checkRes = await fetch(
          `/api/sgsst/diagnostico/report-history?tags=${encodeURIComponent(primaryTag)}`,
          {
            headers: { Authorization: `Bearer ${effectiveToken}` },
            cache: 'no-store',
          },
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const list =
            Array.isArray(checkData.reports) && checkData.reports.length > 0
              ? checkData.reports
              : Array.isArray(checkData.conversations)
                ? checkData.conversations
                : [];
          if (list.length > 0) {
            const newest = list[0];
            const updatedMs = newest.updatedAt ? new Date(newest.updatedAt).getTime() : 0;
            if (updatedMs > 0 && Date.now() - updatedMs < 10000) {
              const newestId = newest.conversationId || newest._id || '';
              if (newestId) {
                autoSavedConvoRef.current = {
                  conversationId: newestId,
                  messageId: newest.messageId || '',
                  companyId: checkData.companyId ? String(checkData.companyId) : companyId,
                };
                saveReportToLocalCache(
                  primaryTag,
                  generatedReport,
                  newestId,
                  newest.messageId || null,
                  companyId,
                );
                setConversationIdRef.current?.(newestId);
                return;
              }
            }
          }
        }

        // Auto-save to /api/sgsst/diagnostico/save-report so user never loses generated report
        const existingAuto =
          autoSavedConvoRef.current && autoSavedConvoRef.current.companyId === companyId
            ? autoSavedConvoRef.current
            : null;

        if (existingAuto && existingAuto.conversationId && existingAuto.messageId) {
          const putRes = await fetch('/api/sgsst/diagnostico/save-report', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveToken}`,
            },
            body: JSON.stringify({
              conversationId: existingAuto.conversationId,
              messageId: existingAuto.messageId,
              content: generatedReport,
            }),
          });
          if (putRes.ok) {
            saveReportToLocalCache(
              primaryTag,
              generatedReport,
              existingAuto.conversationId,
              existingAuto.messageId,
              companyId,
            );
            return;
          }
        }

        const cleanModuleName = primaryTag
          .replace(/^sgsst-/, '')
          .replace(/-/g, ' ')
          .toUpperCase();
        const postRes = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({
            content: generatedReport,
            title: `Informe ${cleanModuleName} - ${new Date().toLocaleDateString('es-CO')}`,
            tags: tagsList.length > 0 ? tagsList : [primaryTag],
          }),
        });

        if (postRes.ok) {
          const savedData = await postRes.json();
          if (savedData.conversationId) {
            autoSavedConvoRef.current = {
              conversationId: savedData.conversationId,
              messageId: savedData.messageId || '',
              companyId,
            };
            saveReportToLocalCache(
              primaryTag,
              generatedReport,
              savedData.conversationId,
              savedData.messageId || null,
              companyId,
            );
            setConversationIdRef.current?.(savedData.conversationId);
          }
        }
      } catch (err) {
        console.warn('[useAutoLoadReport] Silent auto-save error:', err);
      }
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [generatedReport, primaryTag, tagsKey, token]);
}
