import React, { useState } from 'react';
import { useLocalize } from '~/hooks';

const LivaPage = () => {
    const localize = useLocalize();
    // Placeholder for split view state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-full w-full flex-row overflow-hidden bg-white dark:bg-gray-900">
            {/* Left Panel: Video Stream & Alerts */}
            <div className="flex w-1/2 flex-col border-r border-gray-200 dark:border-gray-700">
                <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        LIVA - Live Intelligent Video Assessment
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
                        <button className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700">
                            Save
                        </button>
                    </div>
                </div>

                {/* Editor Toolbar Placeholder */}
                <div className="border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><b>B</b></button>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><i>I</i></button>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><u>U</u></button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                            ✨ AI Edit
                        </button>
                    </div>
                </div>

                {/* Editor Content Placeholder */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-2xl min-h-[500px] rounded border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h1 className="text-2xl font-bold mb-4">Informe de Riesgos Laborales</h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Fecha: {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Ubicación: [Detectando ubicación...]
                        </p>
                        <hr className="my-4 border-gray-200 dark:border-gray-700" />
                        <p className="text-gray-500 italic">
                            Start the video stream to automatically detect and document risks here...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivaPage;
