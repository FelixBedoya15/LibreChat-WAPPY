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

    const handleReportReceived = useCallback((html: string, messageId?: string) => {
        console.log("LivePage: Full Report received", messageId);
        setEditorContent(html);
        setLastUpdated(new Date());
        if (messageId) {
            setReportMessageId(messageId);
        }
    }, []);

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
`;

    const navigate = useNavigate();

    const handleSave = async () => {
        // Helper function to convert HTML to Markdown
        const convertHtmlToMarkdown = (html: string) => {
            let markdown = html;

            // Replace block elements with newlines
            markdown = markdown.replace(/<div[^>]*>/g, '\n');
            markdown = markdown.replace(/<\/div>/g, '');
            markdown = markdown.replace(/<p[^>]*>/g, '\n\n');
            markdown = markdown.replace(/<\/p>/g, '');
            markdown = markdown.replace(/<br\s*\/?>/g, '\n');

            // Tables
            // This is a simplified converter. For complex nested tables, a library is recommended.
            markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gs, (match, tableContent) => {
                let tableMd = '\n';
                let rows = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gs) || [];

                rows.forEach((row: string, rowIndex: number) => {
                    let cells = row.match(/<(td|th)[^>]*>(.*?)<\/\1>/gs) || [];
                    let rowMd = '|';
                    let separatorMd = '|';

                    cells.forEach((cell: string) => {
                        let content = cell.replace(/<(td|th)[^>]*>/, '').replace(/<\/(td|th)>/, '').trim();
                        // Remove internal tags from cell content for simplicity
                        content = content.replace(/<[^>]*>/g, '');
                        rowMd += ` ${content} |`;
                        separatorMd += ' --- |';
                    });

                    tableMd += rowMd + '\n';

                    // Add separator after header (first row)
                    if (rowIndex === 0) {
                        tableMd += separatorMd + '\n';
                    }
                });

                return tableMd + '\n';
            });

            // Headers
            markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n');
            markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n');
            markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n');

            // Lists
            markdown = markdown.replace(/<ul[^>]*>/g, '\n');
            markdown = markdown.replace(/<\/ul>/g, '\n');
            markdown = markdown.replace(/<ol[^>]*>/g, '\n');
            markdown = markdown.replace(/<\/ol>/g, '\n');
            markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');

            // Formatting
            markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
            markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**');
            markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
            markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*');

            // Clean up remaining tags (like span, etc)
            markdown = markdown.replace(/<[^>]*>/g, '');

            // Decode HTML entities (basic ones)
            markdown = markdown.replace(/&nbsp;/g, ' ');
            markdown = markdown.replace(/&amp;/g, '&');
            markdown = markdown.replace(/&lt;/g, '<');
            markdown = markdown.replace(/&gt;/g, '>');

            // Fix multiple newlines (ensure max 2 newlines)
            markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');

            return markdown.trim();
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
                } catch (error) {
                    console.error('Error updating report message:', error);
                }
            }

            // Navigate to the existing conversation where the report is now saved (and updated)
            navigate(`/c/${conversationId}`);
        } else {
            newConversation({
                state: { initialMessage: markdownContent },
            });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-surface-secondary relative">
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
