import React, { useState, useEffect } from 'react';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import { Video, Save } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useNewConvo, useLocalize } from '~/hooks';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

const LivePage = () => {
    const localize = useLocalize();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleReportReceived = (html: string, messageId?: string) => {
        console.log("LivePage: Full Report received", messageId);
        setEditorContent(html);
        setLastUpdated(new Date());
        if (messageId) {
            setReportMessageId(messageId);
        }
    };

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
`;

    const navigate = useNavigate();

    const handleSave = async () => {
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
                            text: editorContent,
                            index: 0, // Assuming text is the first part
                            model: 'gemini-2.5-flash-preview-09-2025' // Optional, but good for tracking
                        })
                    });
                    console.log('Report message updated successfully');
                } catch (error) {
                    console.error('Error updating report message:', error);
                }
            }

            // Navigate to the existing conversation where the report is now saved (and updated)
            navigate(`/c/${conversationId}`);
        } else {
            // Fallback if no conversation exists (shouldn't happen in live analysis usually)
            const contentToSave = editorContent || initialReportContent;
            // Simple HTML to Markdown conversion for saving
            const markdownContent = contentToSave
                .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
                .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
                .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
                .replace(/<[^>]*>/g, '')
                .trim();

            newConversation({
                state: { initialMessage: markdownContent },
            });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900 relative">
            {/* Toolbar / Header Actions */}
            <div className="w-full p-4 pb-0">
                <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {!navVisible && (
                            <OpenSidebar setNavVisible={setNavVisible} className="mr-2" />
                        )}
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Risk Assessment Report</h1>
                        {lastUpdated && (
                            <span className="text-xs text-green-600 font-medium animate-pulse">
                                Actualizado: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleStartAnalysis}
                            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full transition-colors shadow-sm font-medium text-sm"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            {localize('com_ui_start_live_analysis')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full transition-colors shadow-sm font-medium text-sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {localize('com_ui_save_report')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Full Screen Editor */}
            <div className="flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-900">
                <div className="h-full max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
