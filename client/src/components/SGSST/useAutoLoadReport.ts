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
                // 1. Optionally resolve active company (non-blocking: continues even if this fails)
                let companyId: string | null = null;
                try {
                    const companyRes = await fetch('/api/sgsst/company-info', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (companyRes.ok) {
                        const companyData = await companyRes.json();
                        if (companyData && companyData._id) companyId = companyData._id;
                    }
                } catch (_) { /* non-fatal */ }

                if (!isMounted) return;

                // 2. Fetch recent reports using ONLY the module tag (always works, including legacy reports)
                const queryStr = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
                const res = await fetch(`/api/convos?limit=10&order=desc&${queryStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok || !isMounted) return;
                const data = await res.json();

                if (!data || !data.conversations || data.conversations.length === 0) return;

                // 3. Smart client-side selection:
                //    - Prefer the most recent report tagged with the active company
                //    - Fall back to the most recent legacy report (no company tag) — these
                //      belong to the primary company before migration ran
                const companyTag = companyId ? `company-${companyId}` : null;

                let match = null;
                if (companyTag) {
                    // First try: find a report explicitly tagged for this company
                    match = data.conversations.find((c: any) =>
                        (c.tags || []).includes(companyTag)
                    );

                    // Second try: find a legacy report (no company tag at all)
                    // This allows primary company users to still see their old reports
                    if (!match) {
                        match = data.conversations.find((c: any) =>
                            !(c.tags || []).some((t: string) => t.startsWith('company-'))
                        );
                    }
                } else {
                    // No company context — just load the most recent report
                    match = data.conversations[0];
                }

                if (match && match.conversationId && isMounted) {
                    await handleSelectReportRef.current(match.conversationId);
                }
            } catch (err) {
                console.error('[useAutoLoadReport] Auto load failed', err);
            }
        };
        autoLoad();

        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, generatedReport]);
    // NOTE: `tags` intentionally omitted — tags are static per component.
    // `handleSelectReport` replaced by stable ref above.
}
