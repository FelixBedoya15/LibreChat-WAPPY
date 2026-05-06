import { useEffect, useRef } from 'react';

export function useAutoLoadReport({
    token,
    tags,
    generatedReport,
    handleSelectReport
}: {
    token: string | null | undefined;
    tags: string[];
    generatedReport: string | null;
    handleSelectReport: (conversationId: string) => Promise<void> | void;
}) {
    const hasAttempted = useRef(false);
    // Keep a stable ref to the latest handleSelectReport so we don't
    // include it in the effect dependency array (avoids re-triggering on every render)
    const handleSelectReportRef = useRef(handleSelectReport);
    useEffect(() => {
        handleSelectReportRef.current = handleSelectReport;
    });

    useEffect(() => {
        if (!token || hasAttempted.current || generatedReport) return;

        let isMounted = true;
        const autoLoad = async () => {
            hasAttempted.current = true;
            try {
                // 1. First resolve the active company to filter correctly
                let companyId: string | null = null;
                try {
                    const companyRes = await fetch('/api/sgsst/company-info', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (companyRes.ok) {
                        const companyData = await companyRes.json();
                        if (companyData && companyData._id) {
                            companyId = companyData._id;
                        }
                    }
                } catch (e) {
                    console.error('[useAutoLoadReport] Could not fetch company', e);
                }

                if (!isMounted) return;

                // 2. Build query — include company tag if we have one
                const effectiveTags = companyId 
                    ? [...tags, `company-${companyId}`] 
                    : tags;
                const queryStr = effectiveTags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
                const res = await fetch(`/api/convos?limit=5&order=desc&${queryStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();

                if (!isMounted) return;

                if (data && data.conversations && data.conversations.length > 0) {
                    // 3. Client-side double-check: pick the first convo that belongs to the active company
                    const match = companyId 
                        ? data.conversations.find((c: any) => 
                            (c.tags || []).includes(`company-${companyId}`))
                        : data.conversations[0];
                    
                    if (match && match.conversationId) {
                        await handleSelectReportRef.current(match.conversationId);
                    }
                }
            } catch (err) {
                console.error("Auto load failed", err);
            }
        };
        autoLoad();

        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, generatedReport]);
    // NOTE: `tags` intentionally omitted — tags are static per component.
    // `handleSelectReport` replaced by stable ref above.
}
