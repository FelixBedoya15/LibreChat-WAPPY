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
            messages.forEach((m: any, i: number) => {
                const hasImg = m.text && m.text.includes('<img src="data:');
                const isHtml = m.isHtmlReport || (m.text && m.text.trim().startsWith('<'));
                console.log(`[ReportDebug] Msg ${i}: ID=${m.messageId}, IsHtml=${isHtml}, HasImage=${hasImg}, Len=${m.text?.length || 0}`);
            });

            // PRIORITY 1: Find HTML reports (new format with isHtmlReport marker)
            const htmlReport = [...messages].reverse().find((m: any) =>
                m.isHtmlReport === true
            );

            // PRIORITY 2: Reports with embedded images (captures snapshot)
            const reportWithImage = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('<img src="data:')
            );

            // PRIORITY 3: Base64 packed content (legacy format)
            const b64_to_utf8 = (str: string) => {
                return decodeURIComponent(escape(window.atob(str)));
            };
            const reportWithPackedData = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('data-report-content="')
            );

            // PRIORITY 4: Any message that looks like HTML (starts with <)
            const htmlLookingMsg = [...messages].reverse().find((m: any) =>
                m.text && (m.text.trim().startsWith('<') || m.text.includes('<h1>') || m.text.includes('<h2>') || m.text.includes('<table'))
            );

            // PRIORITY 5: Last resort - any message with header (Markdown)
            const reportSystemMsg = [...messages].reverse().find((m: any) =>
                m.text && (m.text.includes('# ') || m.text.includes('## '))
            );

            // Select the best match
            const lastMsg = htmlReport || reportWithImage || reportWithPackedData || htmlLookingMsg || reportSystemMsg || messages[messages.length - 1];

            console.log('[ReportDebug] Selected message type:',
                htmlReport ? 'isHtmlReport' :
                    reportWithImage ? 'withImage' :
                        reportWithPackedData ? 'packed' :
                            htmlLookingMsg ? 'htmlLooking' :
                                reportSystemMsg ? 'markdown' : 'lastMsg');

            if (lastMsg && lastMsg.text) {
                // Use text field directly (stores HTML for reports)
                let html = lastMsg.text;

                // Try decode Base64 packed content (legacy)
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

                // Convert Markdown to HTML if content is in Markdown format
                if (!html.trim().startsWith('<') && !html.includes('<div') && !html.includes('<h1') && !html.includes('<table')) {
                    // Convert Markdown tables to HTML
                    const lines = html.split('\n');
                    const convertedLines: string[] = [];
                    let inTable = false;
                    let tableRows: string[] = [];

                    for (const line of lines) {
                        const trimmed = line.trim();

                        // Check if it's a table row (has pipes and is not a separator)
                        if (trimmed.includes('|') && !trimmed.match(/^\|?[\s\-:|]+\|?$/)) {
                            if (!inTable) {
                                inTable = true;
                                tableRows = [];
                            }
                            tableRows.push(trimmed);
                        } else if (trimmed.match(/^\|?[\s\-:|]+\|?$/) && inTable) {
                            // Skip separator line but keep collecting
                            continue;
                        } else {
                            // End of table or non-table line
                            if (inTable && tableRows.length > 0) {
                                // Convert collected table rows to HTML
                                let tableHtml = '<table border="1" style="width: 100%; border-collapse: collapse; margin: 10px 0;"><tbody>';
                                tableRows.forEach((row, idx) => {
                                    const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
                                    const tag = idx === 0 ? 'th' : 'td';
                                    tableHtml += '<tr>' + cells.map(c => `<${tag} style="padding: 8px; border: 1px solid #ddd;">${c}</${tag}>`).join('') + '</tr>';
                                });
                                tableHtml += '</tbody></table>';
                                convertedLines.push(tableHtml);
                                tableRows = [];
                            }
                            inTable = false;
                            convertedLines.push(trimmed);
                        }
                    }

                    // Handle remaining table if file ends with table
                    if (inTable && tableRows.length > 0) {
                        let tableHtml = '<table border="1" style="width: 100%; border-collapse: collapse;"><tbody>';
                        tableRows.forEach((row, idx) => {
                            const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
                            const tag = idx === 0 ? 'th' : 'td';
                            tableHtml += '<tr>' + cells.map(c => `<${tag} style="padding: 8px; border: 1px solid #ddd;">${c}</${tag}>`).join('') + '</tr>';
                        });
                        tableHtml += '</tbody></table>';
                        convertedLines.push(tableHtml);
                    }

                    html = convertedLines.join('\n');

                    // Basic Markdown formatting
                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
                    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
                    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
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
        const contentToSave = editorContent || initialReportContent;

        if (!token) {
            showToast({ message: 'Error: No autorizado (Token faltante)', status: 'error' });
            return;
        }

        // HTML to Markdown conversion for chat compatibility
        const convertHtmlToMarkdown = (html: string): string => {
            let md = html;

            // Handle tables FIRST
            const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
            md = md.replace(tableRegex, (_match, tableContent) => {
                const rows: string[] = [];
                const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
                let rowMatch;
                let isHeader = true;

                while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
                    const cells: string[] = [];
                    const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
                    let cellMatch;

                    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                        let cellText = cellMatch[2].replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
                        cells.push(cellText || ' ');
                    }

                    if (cells.length > 0) {
                        rows.push('| ' + cells.join(' | ') + ' |');
                        if (isHeader) {
                            rows.push('|' + cells.map(() => '---').join('|') + '|');
                            isHeader = false;
                        }
                    }
                }

                return '\n' + rows.join('\n') + '\n';
            });

            // Handle headings
            md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
            md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
            md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
            md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

            // Handle text formatting
            md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
            md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

            // Handle lists
            md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
            md = md.replace(/<ul[^>]*>/gi, '\n');
            md = md.replace(/<\/ul>/gi, '\n');
            md = md.replace(/<ol[^>]*>/gi, '\n');
            md = md.replace(/<\/ol>/gi, '\n');

            // Handle paragraphs and line breaks
            md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
            md = md.replace(/<br\s*\/?>/gi, '\n');
            md = md.replace(/<div[^>]*>/gi, '\n');
            md = md.replace(/<\/div>/gi, '\n');

            // Handle images - base64 images replaced with placeholder, URL images to markdown
            // Base64 images cause display issues in chat (too long)
            md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '\n\n📷 **[$1]** *(imagen disponible en el informe original)*\n\n');
            md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, '\n\n📷 **[Imagen captada]** *(ver en informe original)*\n\n');
            // Normal URL images convert to markdown
            md = md.replace(/<img[^>]*src="(https?:\/\/[^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
            md = md.replace(/<img[^>]*src="(https?:\/\/[^"]*)"[^>]*>/gi, '![image]($1)');

            // Remove remaining HTML tags
            md = md.replace(/<[^>]*>/g, '');

            // Clean up entities
            md = md.replace(/&nbsp;/g, ' ');
            md = md.replace(/&amp;/g, '&');
            md = md.replace(/&lt;/g, '<');
            md = md.replace(/&gt;/g, '>');

            // Fix excess newlines
            md = md.replace(/\n\s*\n\s*\n/g, '\n\n');

            return md.trim();
        };

        // NOTE: We save HTML directly for Live editor compatibility
        // MongoDB doesn't persist custom fields like originalHtml

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

        // SCENARIO 1: Existing report - Update message directly
        if (conversationId && conversationId !== 'new' && reportMessageId) {
            try {
                console.log('[Save] Updating existing report:', conversationId, reportMessageId);

                // Use direct message update API (no AI trigger)
                const res = await fetch(`/api/messages/${conversationId}/${reportMessageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: contentToSave // Save HTML directly
                    })
                });

                if (res.ok) {
                    console.log('[Save] Message updated successfully');
                    await tagConversation(conversationId);
                } else {
                    console.error("[Save] Update failed:", res.status);
                    showToast({ message: `Error al actualizar: ${res.status}`, status: 'error' });
                }
            } catch (error) {
                console.error('[Save] Error updating report message:', error);
                showToast({ message: 'Error al actualizar el informe', status: 'error' });
            }
            return;
        }

        // SCENARIO 2: Existing conversation but no message ID - Create new message
        if (conversationId && conversationId !== 'new') {
            try {
                console.log('[Save] Creating new message in existing conversation:', conversationId);

                // Use direct message creation API - Save as Assistant message with HTML
                const res = await fetch(`/api/messages/${conversationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: contentToSave, // Save HTML directly
                        conversationId: conversationId,
                        sender: 'Assistant',
                        isCreatedByUser: false,
                        isHtmlReport: true,
                        messageId: crypto.randomUUID()
                    })
                });

                if (res.ok) {
                    const savedMsg = await res.json();
                    setReportMessageId(savedMsg.messageId);
                    console.log('[Save] New message created:', savedMsg.messageId);
                    await tagConversation(conversationId);
                } else {
                    console.error("[Save] Creation failed:", res.status);
                    showToast({ message: `Error al crear mensaje: ${res.status}`, status: 'error' });
                }
            } catch (error) {
                console.error('[Save] Error creating message:', error);
                showToast({ message: 'Error al crear el mensaje', status: 'error' });
            }
            return;
        }

        // SCENARIO 3: No conversation exists - Need to create conversation first
        // For simplicity, we still use /api/ask for this as it handles conversation creation
        try {
            console.log('[Save] Creating new conversation with report');

            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: contentToSave, // Save HTML directly
                    conversationId: null,
                    model: 'gemini-2.5-flash-preview-09-2025',
                    endpoint: 'google',
                    parentMessageId: '00000000-0000-0000-0000-000000000000'
                })
            });

            if (!res.ok) {
                console.error("[Save] Creation failed:", res.status);
                showToast({ message: `Error al crear reporte: ${res.status}`, status: 'error' });
                return;
            }

            // Parse conversation ID from stream response
            let newConvoId = null;
            if (res.body) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let done = false;

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        const chunk = decoder.decode(value);
                        const match = chunk.match(/"conversationId":\s*"([^"]+)"/);
                        if (match && match[1]) {
                            newConvoId = match[1];
                            break;
                        }
                    }
                }
                try { if (!done) reader.cancel(); } catch (e) { }
            }

            if (newConvoId) {
                setConversationId(newConvoId);
                console.log('[Save] New conversation created:', newConvoId);
                await tagConversation(newConvoId);
            } else {
                showToast({ message: 'Error: No se obtuvo ID de conversación', status: 'error' });
            }
        } catch (error) {
            console.error('[Save] Error creating new report:', error);
            showToast({ message: 'Error de red al guardar', status: 'error' });
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
                            className={`group flex items-center px-3 py-2 border border-light rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700' : 'bg-surface-primary text-primary hover:bg-surface-hover'}`}
                        >
                            <History className="w-5 h-5" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                Historial
                            </span>
                        </button>
                        <button
                            onClick={handleStartAnalysis}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-light hover:bg-surface-hover text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <Video className="w-5 h-5" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                {localize('com_ui_start_live_analysis')}
                            </span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-light hover:bg-surface-hover text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <Save className="w-5 h-5" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                {localize('com_ui_save_report')}
                            </span>
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
