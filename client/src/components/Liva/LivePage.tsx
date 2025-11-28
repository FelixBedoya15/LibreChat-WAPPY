import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import LiveEditor from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import { Video, Save } from 'lucide-react';
import { useNewConvo } from '~/hooks';

const LivePage = () => {
    const { setHeaderTitle } = useOutletContext<{ setHeaderTitle: (title: string) => void }>();
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const { newConversation } = useNewConvo();

    useEffect(() => {
        setHeaderTitle('Live Analysis');
    }, [setHeaderTitle]);

    const handleStartAnalysis = () => {
        setIsModalOpen(true);
    };

    const handleTextReceived = (text: string) => {
        console.log("LivePage: Text received from AI:", text);
        setEditorContent(prev => prev + text);
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
