import React, { useState } from 'react';
import { useLocalize, useNewConvo } from '~/hooks';
import LiveEditor from './Editor/LiveEditor';

const LivePage = () => {
    const localize = useLocalize();
    const { newConversation } = useNewConvo();
    // Placeholder for split view state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editorContent, setEditorContent] = useState('');

    const initialReportContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Ubicación:</strong> [Detectando ubicación...]</p>
<h2>Hallazgos</h2>
<ul>
  <li>Riesgo detectado en video en vivo.</li>
  <li>Análisis pendiente de confirmación.</li>
</ul>
<p><em>(Este informe fue generado automáticamente por el módulo LIVE)</em></p>
  `;

    const htmlToMarkdown = (html: string) => {
        return html
            .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
            .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
            .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
            .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<b>(.*?)<\/b>/g, '**$1**')
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<i>(.*?)<\/i>/g, '*$1*')
            .replace(/<ul>/g, '')
            .replace(/<\/ul>/g, '\n')
            .replace(/<li>(.*?)<\/li>/g, '- $1\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]*>/g, '') // Remove remaining tags
            .trim();
    };

    const handleSave = () => {
        // Use editorContent if available, otherwise fallback to initial (though onUpdate should catch it)
        const contentToSave = editorContent || initialReportContent;
        const markdownContent = htmlToMarkdown(contentToSave);

        newConversation({
            state: { initialMessage: markdownContent },
        });
    };

    return (
        <div className="flex h-full w-full flex-row overflow-hidden bg-white dark:bg-gray-900">
            {/* Left Panel: Video Stream & Alerts */}
            <div className="flex w-1/2 flex-col border-r border-gray-200 dark:border-gray-700">
                <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        LIVE - Intelligent Video Assessment
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
                        <span className="text-sm font-medium text-red-500">Live</span>
                    </div>
                </div>

                {/* Video Player Placeholder */}
                <div className="relative flex-1 bg-black">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p>Video Stream Placeholder</p>
                            <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Connect Camera
                            </button>
                        </div>
                    </div>
                </div>

                {/* Real-time Alerts Panel */}
                <div className="h-1/3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Real-time Risk Alerts</h3>
                    <div className="space-y-2">
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
                            ⚠️ Waiting for video stream to start analysis...
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Document Editor */}
            <div className="flex w-1/2 flex-col bg-white dark:bg-gray-900">
                <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Risk Assessment Report
                    </h2>
                    <div className="flex gap-2">
                        <button className="rounded px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                            Export Word
                        </button>
                        <button
                            onClick={handleSave}
                            className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-800">
                    <LiveEditor
                        initialContent={editorContent || initialReportContent}
                        onUpdate={setEditorContent}
                    />
                </div>
            </div>
        </div>
    );
};

export default LivePage;
