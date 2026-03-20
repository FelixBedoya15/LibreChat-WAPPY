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

    useEffect(() => {
        if (!token || hasAttempted.current || generatedReport) return;
        
        let isMounted = true;
        const autoLoad = async () => {
            hasAttempted.current = true;
            try {
                const queryStr = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
                const res = await fetch(`/api/convos?limit=1&order=desc&${queryStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                
                if (isMounted && data && data.conversations && data.conversations.length > 0) {
                    const latestConvoId = data.conversations[0].conversationId;
                    if (latestConvoId) {
                        await handleSelectReport(latestConvoId);
                    }
                }
            } catch (err) {
                console.error("Auto load failed", err);
            }
        };
        autoLoad();
        
        return () => { isMounted = false; };
    }, [token, tags, generatedReport, handleSelectReport]);
}
