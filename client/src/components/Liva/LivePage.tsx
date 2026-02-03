import React, { useState, useEffect, useCallback } from 'react';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import ReportHistory from './ReportHistory';
import { Video, Save, History } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

const LivePage = () => {
    const localize = useLocalize();
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

            const token = localStorage.getItem('token');
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

            // Find last assistant message
            const lastAssistantMsg = [...messages].reverse().find((m: any) => m.sender === 'Assistant' || m.isCreatedByUser === false);

            if (lastAssistantMsg && lastAssistantMsg.text) {
                let html = lastAssistantMsg.text;
                // Basic Markdown to HTML conversion for display
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

                // Set content and update state
                setEditorContent(html);
                setReportMessageId(lastAssistantMsg.messageId);
                setLastUpdated(new Date(lastAssistantMsg.createdAt));
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
        // Helper function to convert HTML to Markdown
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
            md = md.replace(/<table[^>]*>/g, '\n');
            md = md.replace(/<\/table>/g, '\n');
            md = md.replace(/<tr[^>]*>/g, '|');
            md = md.replace(/<\/tr>/g, '|\n');
            md = md.replace(/<td[^>]*>(.*?)<\/td>/g, ' $1 |');
            md = md.replace(/<th[^>]*>(.*?)<\/th>/g, ' **$1** |');
            md = md.replace(/<[^>]*>/g, '');
            md = md.replace(/&nbsp;/g, ' ');
            md = md.replace(/\n\s*\n\s*\n/g, '\n\n');
            return md.trim();
        };

        const contentToSave = editorContent || initialReportContent;
        const markdownContent = convertHtmlToMarkdown(contentToSave);
        const token = localStorage.getItem('token');

        let targetConvoId = conversationId;

        // SCENARIO 1: Update existing message
        if (conversationId && conversationId !== 'new' && reportMessageId) {
            try {
                await fetch(`/api/messages/${conversationId}/${reportMessageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: markdownContent,
                        index: 0,
                        model: 'gemini-2.5-flash-preview-09-2025'
                    })
                });
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Error updating report message:', error);
                showToast({ message: 'Error al actualizar el informe', status: 'error' });
                return;
            }
        }
        // SCENARIO 2: New Conversation / New Message
        else {
            try {
                const res = await fetch('/api/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: markdownContent,
                        conversationId: conversationId === 'new' ? null : conversationId,
                        model: 'gemini-2.5-flash-preview-09-2025',
                        endpoint: 'google'
                    })
                });

                if (res.ok) {
                    // Try to parse the stream or response to get the conversation ID
                    // Since /api/ask is streaming, parsing JSON might fail if it sends text/event-stream
                    // However, we can try to fetch the latest conversation if we sent 'new'
                    // For simplicity in this fix, we will rely on Refetching history

                    // If it returns JSON (some configs do), great. If stream, we might miss the ID.
                    // But usually the first chunk contains conversation_id.
                    // FIXME: For a robust implementation we should handle stream reading.
                    // For now, let's assume we can get the ID via a separate check or if the backend returns headers.
                }
            } catch (error) {
                console.error('Error saving new report:', error);
                showToast({ message: 'Error al guardar el informe', status: 'error' });
                return;
            }
        }

        // TAGGING LOGIC (Critical for History)
        // Since we might not have the new ID immediately if it was a 'new' chat stream, 
        // we might need to rely on the backend creating it.
        // But if we are in an existing chat (conversationId !== 'new'), we function nicely.
        // If we just created a 'new' chat, we have a race condition to tag it.

        // WORKAROUND: If we entered via 'newConversation()', the hook might have set a temp ID or similar.
        // But better: Let's assume the user has to 'Start Analysis' which creates the conversation via 'LiveAnalysisModal'.
        // IF 'LiveAnalysisModal' was used, 'conversationId' should be set!

        if (targetConvoId && targetConvoId !== 'new') {
            try {
                await fetch('/api/conversations/tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        conversationId: targetConvoId,
                        tags: ['report'],
                        tag: 'report'
                    })
                });
            } catch (e) {
                console.error("Error tagging conversation:", e);
            }
        }

        showToast({ message: localize('com_ui_saved_success') || 'Guardado exitosamente', status: 'success' });
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
