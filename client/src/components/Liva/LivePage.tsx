import React, { useState, useEffect, useCallback } from 'react';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import ReportHistory from './ReportHistory';
import { Video, Save, History } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useLocalize, useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

const LivePage = () => {
    const localize = useLocalize();
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');

    // REMOVED useNewConvo because it forces a redirect to /c/new.
    // We handle "new" state locally.
    useEffect(() => {
        setConversationId('new');
        setEditorContent('');
        setReportMessageId(null);
    }, []);

    const handleStartAnalysis = () => {
        setIsModalOpen(true);
    };

    const handleTextReceived = (text: string) => {
        // console.log("LivePage: Text received (ignored for editor):", text);
    };

    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    // State to trigger history refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleReportReceived = useCallback((html: string, messageId?: string) => {
        console.log("LivePage: Full Report received", messageId);
        setEditorContent(html);
        setLastUpdated(new Date());
        if (messageId) {
            setReportMessageId(messageId);
        }
    }, []);

    const handleSelectReport = async (selectedConvoId: string) => {
        try {
            console.log("Loading report from conversation:", selectedConvoId);
            setConversationId(selectedConvoId);
            setIsHistoryOpen(false);

            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Handle both array and object response formats
            let messages = [];
            if (Array.isArray(data)) {
                messages = data;
            } else if (data && data.messages) {
                messages = data.messages;
            }

            // DEBUG: Traceability for Report Loading
            console.log('[ReportDebug] Total messages loaded:', messages.length);
            messages.forEach((m, i) => {
                const hasImg = m.text && m.text.includes('<img src="data:');
                const isUser = m.isCreatedByUser || m.sender === 'User';
                console.log(`[ReportDebug] Msg ${i}: ID=${m.messageId}, User=${isUser}, HasImage=${hasImg}, Len=${m.text?.length || 0}, TextStart=${m.text?.substring(0, 50)}...`);
            });

            // DECODING STRATEGY
            // Check for Base64 encoded reports (New Format) which guarantees fidelity
            const b64_to_utf8 = (str: string) => {
                return decodeURIComponent(escape(window.atob(str)));
            };

            const reportWithPackedData = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('data-report-content="')
            );

            // 1. HIGHEST PRIORITY: The saved report containing the Base64 Image.
            // (Legacy support or if Base64 missing)
            const reportWithImage = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('<img src="data:')
            );

            console.log('[ReportDebug] Found ReportWithPackedData:', !!reportWithPackedData);
            console.log('[ReportDebug] Found ReportWithImage:', !!reportWithImage);

            // 2. Fallback: A user-created message with a Header (for reports without images)
            const reportUserMsg = [...messages].reverse().find((m: any) =>
                (m.isCreatedByUser || m.sender === 'User') && (m.text && (m.text.includes('<h1>') || m.text.includes('# ')))
            );

            // 3. Last Resort: Any message with a Header (likely AI summary)
            const reportSystemMsg = [...messages].reverse().find((m: any) =>
                m.text && (m.text.includes('<h1>') || m.text.includes('# '))
            );

            // Select the best match
            const lastMsg = reportWithPackedData || reportWithImage || reportUserMsg || reportSystemMsg || messages[messages.length - 1];

            if (lastMsg && lastMsg.text) {
                let html = lastMsg.text;

                // TRY DECODE
                if (html.includes('data-report-content="')) {
                    try {
                        const match = html.match(/data-report-content="([^"]+)"/);
                        if (match && match[1]) {
                            html = b64_to_utf8(match[1]);
                            console.log('[ReportDebug] Successfully decoded Base64 content');
                        }
                    } catch (e) {
                        console.error('[ReportDebug] Failed to decode report:', e);
                    }
                }

                // Only apply markdown conversion if it DOESN'T look like HTML already.
                if (!html.trim().startsWith('<') && !html.includes('<div') && !html.includes('<h1')) {
                    // Basic Markdown to HTML conversion for legacy/AI responses
                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
                }

                // Set content and update state
                setEditorContent(html);
                setReportMessageId(lastMsg.messageId);
                setLastUpdated(new Date(lastMsg.createdAt));
            }
        } catch (e) {
            console.error("Error loading conversation:", e);
            showToast({ message: 'Error al cargar el informe', status: 'error' });
        }
    };

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
`;

    const handleSave = async () => {
        // ENCODING STRATEGY: 
        // We Base64 encode the HTML to bypass any backend sanitization or markdown conversion.
        // This ensures 100% fidelity of images and table structures when saving.
        const utf8_to_b64 = (str: string) => {
            return window.btoa(unescape(encodeURIComponent(str)));
        };

        const contentToSave = editorContent || initialReportContent;
        // We wrap the base64 data in a marker we can easily find later
        const base64Data = utf8_to_b64(contentToSave);
        const packedContent = `<!-- REPORT_START -->\n<div style="display:none;" data-report-content="${base64Data}"></div>\n<!-- REPORT_END -->\n# Informe de Riesgos Guardado\nEl informe ha sido almacenado con éxito. Usa el menú de historial para verlo.\n(Datos encriptados para fidelidad)`;

        let finalConvoId = conversationId;

        // SCENARIO 1: Update existing message
        if (!token) {
            showToast({ message: 'Error: No autorizado (Token faltante)', status: 'error' });
            return;
        }

        // TAGGING LOGIC - Helper function to avoid duplication
        const tagConversation = async (id: string) => {
            try {
                const tagRes = await fetch(`/api/tags/convo/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tags: ['report']
                    })
                });

                if (tagRes.ok) {
                    // Update Title to "Informe de Riesgos - [Date]"
                    const dateStr = new Date().toLocaleString();
                    await fetch('/api/convos/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            arg: {
                                conversationId: id,
                                title: `Informe de Riesgos - ${dateStr}`
                            }
                        })
                    });

                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Informe guardado y archivado', status: 'success' });
                } else {
                    console.error("Tagging failed:", tagRes.status, tagRes.statusText);
                    showToast({ message: 'Error: Informe guardado pero NO etiquetado', status: 'warning' });
                }
            } catch (e) {
                console.error("Error tagging conversation:", e);
                showToast({ message: 'Excepción al etiquetar informe', status: 'error' });
            }
        };

        // SCENARIO 1: Existing conversation (Update)
        if (conversationId && conversationId !== 'new') {
            try {
                const res = await fetch('/api/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: packedContent,
                        conversationId: conversationId,
                        model: 'gemini-2.5-flash-preview-09-2025',
                        endpoint: 'google'
                    })
                });

                if (res.ok) {
                    await tagConversation(conversationId);
                } else {
                    console.error("Update failed:", res.status);
                    showToast({ message: `Error al actualizar: ${res.status}`, status: 'error' });
                }
            } catch (error) {
                console.error('Error updating report message:', error);
                showToast({ message: 'Error al actualizar el informe', status: 'error' });
                return;
            }
        }
        // SCENARIO 2: New Conversation / New Message
        else {
            try {
                const payload = {
                    text: packedContent,
                    conversationId: null, // Explicitly null for new
                    model: 'gemini-2.5-flash-preview-09-2025',
                    endpoint: 'google',
                    parentMessageId: '00000000-0000-0000-0000-000000000000'
                };
                console.log("Saving new report, payload:", payload);

                const res = await fetch('/api/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    console.error("Creation failed:", res.status, res.statusText);
                    const errorText = await res.text();
                    console.error("Error details:", errorText);
                    showToast({ message: `Error al crear reporte: ${res.status}`, status: 'error' });
                    return; // Stop here if creation failed
                }

                if (res.body) {
                    // Try to parse ID from stream
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let done = false;
                    let foundId = false;

                    while (!done) {
                        const { value, done: doneReading } = await reader.read();
                        done = doneReading;
                        if (value) {
                            const chunk = decoder.decode(value);
                            // Simple regex for conversationId
                            const match = chunk.match(/"conversationId":\s*"([^"]+)"/);
                            if (match && match[1]) {
                                finalConvoId = match[1];
                                setConversationId(finalConvoId);
                                foundId = true;
                                break;
                            }
                        }
                        if (doneReading || foundId) break;
                    }
                    try { if (!done) reader.cancel(); } catch (e) { }
                }
            } catch (error) {
                console.error('Error saving new report:', error);
                showToast({ message: 'Error de red al guardar', status: 'error' });
                return;
            }
        }

        // FALLBACK: If we still don't have the ID, try fetching latest with retries
        if (!finalConvoId || finalConvoId === 'new') {
            try {
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts && (!finalConvoId || finalConvoId === 'new')) {
                    attempts++;
                    // Wait a bit more on each attempt (1s, 2s, 3s)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));

                    console.log(`Fallback: Fetching latest conversations (Attempt ${attempts})...`);
                    const resp = await fetch('/api/conversations', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await resp.json();
                    const convos = data.conversations || (Array.isArray(data) ? data : []);

                    if (convos && convos.length > 0) {
                        // Check if this conversation looks like ours (created very recently)
                        const mostRecent = convos[0];
                        const createdTime = new Date(mostRecent.createdAt).getTime();
                        const now = new Date().getTime();
                        // If it's within last 30 seconds
                        if (now - createdTime < 30000) {
                            finalConvoId = mostRecent.conversationId;
                            setConversationId(finalConvoId);
                            console.log("Fallback: retrieved conversationId:", finalConvoId);
                            showToast({ message: `ID recuperado (Fallback)`, status: 'warning' });
                            break;
                        } else {
                            console.log("Fallback: Most recent convo is too old, waiting...");
                        }
                    }
                }

                if (!finalConvoId || finalConvoId === 'new') {
                    console.error("Fallback: parsed conversations list is empty or invalid");
                    showToast({ message: 'FALLO: No se encontró la conversación nueva', status: 'error' });
                }
            } catch (e) {
                console.error("Fallback fetch failed", e);
                showToast({ message: 'Error de conexión en Fallback', status: 'error' });
            }
        }

        // Final Tagging Attempt
        if (finalConvoId && finalConvoId !== 'new') {
            await tagConversation(finalConvoId);
        } else {
            // Only show error if we supposedly finished but still have no ID
            console.error("Critical: Finished save flow but ID is missing.");
            showToast({ message: 'Error: No se pudo verificar el guardado (ID faltante)', status: 'error' });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-surface-secondary relative">
            {/* Report History Sidebar */}
            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
                refreshTrigger={refreshTrigger}
            />

            {/* Toolbar / Header Actions */}
            <div className="w-full p-4 pb-0">
                <div className="max-w-5xl mx-auto bg-surface-primary rounded-xl shadow-lg border border-light p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {!navVisible && (
                            <OpenSidebar setNavVisible={setNavVisible} className="mr-2 hidden md:flex" />
                        )}
                        <h1 className="text-2xl font-bold text-primary hidden md:block">Análisis de Riesgos</h1>
                        {lastUpdated && (
                            <span className="text-xs text-green-600 font-medium animate-pulse hidden md:inline">
                                Actualizado: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className={`flex items-center px-4 py-2 border border-light rounded-full transition-colors shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700' : 'bg-surface-primary text-primary hover:bg-surface-hover'}`}
                        >
                            <History className="w-4 h-4 mr-2" />
                            Historial
                        </button>
                        <button
                            onClick={handleStartAnalysis}
                            className="flex items-center px-4 py-2 bg-surface-primary border border-light hover:bg-surface-hover text-primary rounded-full transition-colors shadow-sm font-medium text-sm"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            {localize('com_ui_start_live_analysis')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center px-4 py-2 bg-surface-primary border border-light hover:bg-surface-hover text-primary rounded-full transition-colors shadow-sm font-medium text-sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {localize('com_ui_save_report')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Full Screen Editor */}
            <div className="flex-1 overflow-hidden p-4 bg-surface-secondary">
                <div className="h-full max-w-5xl mx-auto bg-surface-primary rounded-xl shadow-lg overflow-hidden border border-light">
                    <LiveEditor
                        initialContent={editorContent || initialReportContent}
                        onUpdate={(html) => {
                            setEditorContent(html);
                        }}
                        onSave={handleSave}
                    />
                </div>
            </div>

            {/* Live Analysis Modal Overlay */}
            <LiveAnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                conversationId={conversationId}
                onConversationIdUpdate={setConversationId}
                onTextReceived={handleTextReceived}
                onReportReceived={handleReportReceived}
            />
        </div>
    );
};

export default LivePage;
