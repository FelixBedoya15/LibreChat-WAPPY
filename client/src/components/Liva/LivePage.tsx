import React, { useState, useEffect, useCallback } from 'react';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import ReportHistory from './ReportHistory'; // NEW
import { Video, Save, History, FileText } from 'lucide-react'; // NEW Icons
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useNewConvo, useLocalize } from '~/hooks';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

const LivePage = () => {
    const localize = useLocalize();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); // NEW
    const [conversationId, setConversationId] = useState('new');
    const { newConversation } = useNewConvo();

    const handleStartAnalysis = () => {
        setIsModalOpen(true);
    };

    const handleTextReceived = (text: string) => {
        // console.log("LivePage: Text received (ignored for editor):", text);
        // We ignore conversational text for the editor now, as we rely on the 'Second Brain' report.
    };

    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);

    const handleReportReceived = useCallback((html: string, messageId?: string) => {
        console.log("LivePage: Full Report received", messageId);
        setEditorContent(html);
        setLastUpdated(new Date());
        if (messageId) {
            setReportMessageId(messageId);
        }
    }, []);

    // NEW: Function to load a selected report from history
    const handleSelectReport = async (selectedConvoId: string) => {
        try {
            console.log("Loading report from conversation:", selectedConvoId);
            setConversationId(selectedConvoId);
            setIsHistoryOpen(false);

            // Fetch conversation details/messages
            const token = localStorage.getItem('token');
            // We need to fetch messages. The conversation object doesn't have messages usually in the list view.
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Assume the last message/response is the report? or try to find one with HTML?
            // For now, let's take the last assistant message.
            if (data && Array.isArray(data)) { // Assuming data is array of messages or { messages: [] }
                const messages = Array.isArray(data) ? data : data.messages;
                // Find last assistant message
                const lastAssistantMsg = [...messages].reverse().find((m: any) => m.sender === 'Assistant' || m.isCreatedByUser === false);

                if (lastAssistantMsg && lastAssistantMsg.text) {
                    // Check if it looks like markdown or html. The editor expects HTML ideally or conversion.
                    // Our LiveEditor likely takes HTML. The saved content was Markdown.
                    // Ensure LiveEditor can handle Markdown or we convert it back?
                    // Usually CKEditor handles HTML.
                    // The handleSave converted HTML -> Markdown.
                    // So here we might receive Markdown.
                    // We need to render Markdown as HTML for the editor... or Editor supports markdown?
                    // The component is called LiveEditor. Let's assume for now we pass text.
                    // Ideally we should use a markdown-to-html converter here if Editor requires HTML.
                    // For MVP, just loading the text.
                    // Note: The previous handleSave saved Markdown.
                    // Let's do a simple line break to <br> conversion if needed or rely on Editor.

                    // Quick Markdown to HTML (very basic) for restoring visual
                    let html = lastAssistantMsg.text;
                    // Basic bold
                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

                    setEditorContent(html);
                    setReportMessageId(lastAssistantMsg.messageId);
                    setLastUpdated(new Date(lastAssistantMsg.createdAt));
                }
            }

        } catch (e) {
            console.error("Error loading conversation:", e);
        }
    };

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
`;

    const navigate = useNavigate();

    const handleSave = async () => {
        // Helper function to convert HTML to Markdown (Improved)
        const convertHtmlToMarkdown = (html: string) => {
            let md = html;
            md = md.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n### $1\n');
            md = md.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
            md = md.replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**');
            md = md.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
            md = md.replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*');
            md = md.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
            md = md.replace(/<ul[^>]*>/g, '\n');
            md = md.replace(/<\/ul>/g, '\n');
            md = md.replace(/<p[^>]*>(.*?)<\/p>/g, '\n$1\n');
            md = md.replace(/<br\s*\/?>/g, '\n');
            md = md.replace(/<table[^>]*>/g, '\n'); // Simple table handling
            md = md.replace(/<\/table>/g, '\n');
            md = md.replace(/<tr[^>]*>/g, '|');
            md = md.replace(/<\/tr>/g, '|\n');
            md = md.replace(/<td[^>]*>(.*?)<\/td>/g, ' $1 |');
            md = md.replace(/<th[^>]*>(.*?)<\/th>/g, ' **$1** |');
            md = md.replace(/<[^>]*>/g, ''); // Remove remaining tags
            md = md.replace(/&nbsp;/g, ' ');
            md = md.replace(/\n\s*\n\s*\n/g, '\n\n'); // Fix excess newlines
            return md.trim();
        };

        const contentToSave = editorContent || initialReportContent;
        const markdownContent = convertHtmlToMarkdown(contentToSave);

        if (conversationId && conversationId !== 'new') {
            // If we have a reportMessageId, we update that specific message with the edited content
            if (reportMessageId) {
                try {
                    const token = localStorage.getItem('token'); // Basic auth retrieval
                    await fetch(`/api/messages/${conversationId}/${reportMessageId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            text: markdownContent, // Send converted Markdown
                            index: 0,
                            model: 'gemini-2.5-flash-preview-09-2025'
                        })
                    });
                    console.log('Report message updated successfully');
                    setLastUpdated(new Date());
                } catch (error) {
                    console.error('Error updating report message:', error);
                }
            } else {
                // FALLBACK: If no report message ID, send as a NEW message to the conversation
                try {
                    const token = localStorage.getItem('token');
                    await fetch('/api/ask', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            text: markdownContent,
                            conversationId: conversationId,
                            model: 'gemini-2.5-flash-preview-09-2025',
                            endpoint: 'google'
                        })
                    });
                    console.log('Report saved as new message');
                } catch (error) {
                    console.error('Error saving report as new message:', error);
                }
            }

            // Navigate to the existing conversation where the report is now saved (and updated)
            // navigate(`/c/${conversationId}`);
            // STAY on LivePage to verify edit
            alert(localize('com_ui_saved_success') || 'Guardado exitosamente');

        } else {
            newConversation({
                state: { initialMessage: markdownContent },
            });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-surface-secondary relative">
            {/* Report History Sidebar */}
            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
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
