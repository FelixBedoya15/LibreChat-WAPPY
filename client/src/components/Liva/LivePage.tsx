import React, { useState, useEffect } from 'react';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import { Video, Save } from 'lucide-react';
import { useNewConvo } from '~/hooks';

const LivePage = () => {
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const { newConversation } = useNewConvo();

    const handleStartAnalysis = () => {
        setIsModalOpen(true);
    };

    // Simple Markdown to HTML parser for the specific report format
    const parseMarkdownToHtml = (markdown: string) => {
        let html = markdown;

        // 1. Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');

        // 2. Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 3. Tables (Basic implementation for standard Markdown tables)
        // Find table blocks
        const tableRegex = /\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.*\|\n?)*)/g;

        html = html.replace(tableRegex, (match, header, separator, body) => {
            const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
            const rows = body.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim() !== '').map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            return `<table style="width:100%; border-collapse: collapse; border: 1px solid #ddd;">
                        <thead><tr>${headers}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`;
        });

        // 4. Paragraphs / Line breaks (for non-HTML lines)
        // Wrap lines that are not headers or tables in <p> or add <br>
        // This is a bit tricky, so we'll just replace remaining newlines with <br> 
        // ensuring we don't break the HTML we just created.

        // A safer approach for the remaining text:
        // We can't just replace \n globally because it might break the table HTML structure we just built.
        // But since we built the table HTML as a single string (mostly), we can try to target text blocks.

        // For now, let's just handle double newlines as paragraphs
        html = html.replace(/\n\n/g, '<br/><br/>');
        // And single newlines as <br/> if they are not inside tags (simplified)
        // html = html.replace(/\n/g, '<br/>'); // This might be too aggressive

        return html;
    };

    const handleTextReceived = (text: string) => {
        console.log("LivePage: Text received from AI:", text);
        // Parse Markdown to HTML before setting
        const htmlContent = parseMarkdownToHtml(text);
        setEditorContent(htmlContent);
    };

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
`;

    const handleSave = () => {
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
    };

    return (
        <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 relative">
            {/* Toolbar / Header Actions */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Risk Assessment Report</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleStartAnalysis}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <Video className="w-5 h-5 mr-2" />
                        Start Live Analysis
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Save Report
                    </button>
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
            />
        </div>
    );
};

export default LivePage;
