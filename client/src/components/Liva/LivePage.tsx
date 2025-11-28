import React, { useState, useEffect, useRef } from 'react';
import { useLocalize, useNewConvo, useLiveAnalysis } from '~/hooks';
import LiveEditor from './Editor/LiveEditor';
import { Video, VideoOff, RefreshCcw, Camera, Loader2, Play, Square } from 'lucide-react';

const LivePage = () => {
    // Force rebuild timestamp: 2025-11-28
    const localize = useLocalize();
    const { newConversation } = useNewConvo();
    // Use 'new' as conversationId for now, or manage it via state if we need to persist it
    const [conversationId, setConversationId] = useState('new');

    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const {
        startAnalysis,
        stopAnalysis,
        sendVideoFrame,
        sendTextMessage,
        analysisResult,
        error,
        isConnected,
        isConnecting,
        status
    } = useLiveAnalysis({
        conversationId,
        disableAudio: true,
        onConversationIdUpdate: (newId) => {
            console.log("LivePage: Updating conversation ID to:", newId);
            setConversationId(newId);
        },
        onAudioReceived: (audioData) => {
            handleAudioReceived(audioData);
        }
    });

    // Initialize AudioContext on mount
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    /**
     * Handle received audio from Gemini
     */
    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const dataView = new DataView(bytes.buffer);
            const float32Data = new Float32Array(len / 2);

            for (let i = 0; i < len / 2; i++) {
                const int16 = dataView.getInt16(i * 2, true);
                float32Data[i] = int16 / 32768.0;
            }

            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            setAudioQueue(prev => [...prev, audioBuffer]);

        } catch (error) {
            console.error('[LivePage] Error processing audio:', error);
        }
    }

    // Process Audio Queue
    useEffect(() => {
        if (!isPlaying && audioQueue.length > 0 && audioContextRef.current) {
            const buffer = audioQueue[0];
            setAudioQueue(prev => prev.slice(1));
            playAudio(buffer);
        }
    }, [audioQueue, isPlaying]);

    /**
     * Play audio buffer
     */
    function playAudio(audioBuffer: AudioBuffer) {
        if (!audioContextRef.current) return;

        setIsPlaying(true);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
            setIsPlaying(false);
        };

        source.start();
    }

    // Placeholder for split view state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editorContent, setEditorContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Robust camera handling with useEffect
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            if (isStreaming) {
                try {
                    // Stop any existing tracks first
                    if (videoRef.current && videoRef.current.srcObject) {
                        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                        tracks.forEach(track => track.stop());
                    }

                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: facingMode,
                            width: { ideal: 320 },
                            height: { ideal: 240 },
                            frameRate: { ideal: 15 }
                        },
                        audio: false
                    });
                    currentStream = stream;

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(e => console.error("Error playing video:", e));
                    }
                } catch (error) {
                    console.error("Error accessing camera:", error);
                    alert("Could not access camera. Please ensure permissions are granted.");
                    setIsStreaming(false);
                    setIsAutoAnalyzing(false);
                }
            } else {
                // Cleanup if not streaming
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                setIsAutoAnalyzing(false);
                stopAnalysis();
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isStreaming, facingMode, stopAnalysis]);

    const handleToggleCamera = () => {
        setIsStreaming(prev => !prev);
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const toggleAutoAnalysis = () => {
        if (isAutoAnalyzing) {
            setIsAutoAnalyzing(false);
            stopAnalysis();
        } else {
            // Start Analysis
            setIsAutoAnalyzing(true);
        }
    };

    // Effect to start/stop analysis based on state
    useEffect(() => {
        if (isAutoAnalyzing && isStreaming && conversationId && !isConnected && !isConnecting) {
            startAnalysis();
        } else if ((!isAutoAnalyzing || !isStreaming) && isConnected) {
            stopAnalysis();
        }
    }, [isAutoAnalyzing, isStreaming, conversationId, isConnected, isConnecting, startAnalysis, stopAnalysis]);

    // Effect to send initial prompt when connected
    useEffect(() => {
        if (isConnected && isAutoAnalyzing) {
            // Give a small delay to ensure backend is ready
            const timer = setTimeout(() => {
                console.log("LivePage: Sending initial analysis prompt");
                sendTextMessage("Describe what you see in the video first. Then, identify any specific occupational risks. If the environment looks safe, say so. Be concise.");
            }, 2000); // Increased delay to 2s to ensure video frames are received
            return () => clearTimeout(timer);
        }
    }, [isConnected, isAutoAnalyzing, sendTextMessage]);

    // Effect to stream video frames
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isAutoAnalyzing && isStreaming && isConnected) {
            intervalId = setInterval(() => {
                if (videoRef.current) {
                    sendVideoFrame(videoRef.current);
                }
            }, 200); // 5 FPS
        }
        return () => clearInterval(intervalId);
    }, [isAutoAnalyzing, isStreaming, isConnected, sendVideoFrame]);

    // Effect to update report with analysis result
    useEffect(() => {
        if (analysisResult) {
            console.log("LivePage: Updating editor content with:", analysisResult);
            // Append or update editor content
            // For now, just append to a "Live Analysis" section or replace findings
            const newContent = `
<h1>Informe de Riesgos Laborales</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Análisis en Vivo</h2>
<p>${analysisResult}</p>
`;
            setEditorContent(newContent);
        }
    }, [analysisResult]);

    // Debug logging for mount/unmount
    useEffect(() => {
        console.log("LivePage: Mounted");
        return () => {
            console.log("LivePage: Unmounted");
        };
    }, []);

    return (
        <div className="flex h-full w-full flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-900">
            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Left Panel: Video Stream & Alerts */}
            <div className="flex w-full md:w-1/2 h-1/2 md:h-full flex-col border-r border-gray-200 dark:border-gray-700">
                <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        LIVE - Intelligent Video Assessment
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={`flex h - 3 w - 3 rounded - full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'} `}></span>
                        <span className={`text - sm font - medium ${isStreaming ? 'text-green-500' : 'text-red-500'} `}>
                            {isStreaming ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Video Player Placeholder */}
                <div className="relative flex-1 bg-black overflow-hidden group">
                    {/* Always render video to ensure ref is populated, hide when not streaming */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w - full h - full object - cover ${isStreaming ? 'block' : 'hidden'} `}
                    />

                    {!isStreaming && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p>Video Stream Offline</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-20">
                        {/* Toggle Camera */}
                        <button
                            onClick={handleToggleCamera}
                            className={`p-4 rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/30 text-white ${isStreaming
                                ? 'bg-red-500/80 hover:bg-red-600/80'
                                : 'bg-white/20 hover:bg-white/30'
                                }`}
                            title={isStreaming ? "Stop Camera" : "Start Camera"}
                        >
                            {isStreaming ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </button>

                        {/* Auto Analyze Toggle */}
                        {isStreaming && (
                            <button
                                onClick={toggleAutoAnalysis}
                                className={`p-4 rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/30 text-white ${isAutoAnalyzing
                                    ? 'bg-green-500/80 hover:bg-green-600/80 animate-pulse'
                                    : 'bg-white/20 hover:bg-white/30'
                                    }`}
                                title={isAutoAnalyzing ? "Stop Analysis" : "Start Auto Analysis"}
                            >
                                {isAutoAnalyzing ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                        )}

                        {/* Switch Camera */}
                        {isStreaming && (
                            <button
                                onClick={handleSwitchCamera}
                                className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-all shadow-lg border border-white/30"
                                title="Switch Camera"
                            >
                                <RefreshCcw className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Real-time Alerts Panel */}
                <div className="h-1/3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 overflow-y-auto">
                    <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Real-time Risk Alerts</h3>
                    <div className="space-y-2">
                        {isAutoAnalyzing && isConnected && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing video stream...
                            </div>
                        )}
                        {!isAutoAnalyzing && !analysisResult && (
                            <div className="text-sm text-gray-500 italic">
                                Click the Play button to start auto-analysis.
                            </div>
                        )}
                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                                <strong>Analysis Result:</strong>
                                <br />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Document Editor */}
            <div className="flex w-full md:w-1/2 h-1/2 md:h-full flex-col bg-white dark:bg-gray-900">
                <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Risk Assessment Report
                    </h2>
                    <div className="flex gap-2">
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
