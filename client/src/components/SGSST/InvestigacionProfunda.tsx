import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Loader2,
    History,
    FileText,
    BrainCircuit,
    ChevronDown,
    ChevronRight,
    Download,
    Save
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import SGSSTToolbar from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';
import SGSSTLegalBadge from './SGSSTLegalBadge';

const InvestigacionProfunda = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [topic, setTopic] = useState('');
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.8-flash');

    useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user?.personalization?.geminiModels?.sstManagement]);

    // Generation states
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const editorContentRef = useRef<string>('');
    const liveEditorRef = useRef<LiveEditorHandle>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressStatus, setProgressStatus] = useState<string>('Iniciando investigación...');

    // History & Polling states
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleDummyData = () => {
        setTopic('Analizar la responsabilidad legal y administrativa solidaria de la empresa contratante frente al accidente de trabajo grave de un contratista que realizaba mantenimiento de luminarias a 4 metros de altura sin usar arnés de seguridad ni línea de vida en Bogotá. Citar Decreto 1072 de 2015.');
        showToast({ message: 'Tema de investigación simulado cargado correctamente.', status: 'success' });
    };

    // Polling effect
    useEffect(() => {
        let intervalId: any;
        if (isGenerating && conversationId && reportMessageId) {
            setProgressStatus('Gemini está analizando la jurisprudencia e historial de la empresa...');
            let attempts = 0;
            intervalId = setInterval(async () => {
                try {
                    attempts++;
                    const res = await fetch(`/api/sgsst/investigacion-profunda/status/${conversationId}/${reportMessageId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.isCompleted) {
                            clearInterval(intervalId);
                            setGeneratedReport(data.text);
                            editorContentRef.current = data.text;
                            setIsGenerating(false);
                            setIsFormExpanded(false);
                            setRefreshTrigger(prev => prev + 1);
                            showToast({ message: 'Investigación profunda completada con éxito.', status: 'success' });
                        } else if (data.isError) {
                            clearInterval(intervalId);
                            setIsGenerating(false);
                            setGeneratedReport(data.text);
                            showToast({ message: 'Ocurrió un error durante la investigación.', status: 'error' });
                        } else {
                            if (attempts > 15) {
                                setProgressStatus('Sintetizando informe final en HTML premium...');
                            } else if (attempts > 8) {
                                setProgressStatus('Cruzando datos con resoluciones y normativas de SST...');
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error polling status:', err);
                }
            }, 4000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isGenerating, conversationId, reportMessageId, token, showToast]);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            showToast({ message: 'Por favor escribe un tema o consulta de investigación.', status: 'warning' });
            return;
        }

        setIsGenerating(true);
        setGeneratedReport(null);
        setProgressStatus('Enviando solicitud al servidor de fondo...');

        try {
            const response = await fetch('/api/sgsst/investigacion-profunda/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    topic,
                    modelName: selectedModel,
                    userName: user?.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al iniciar la generación de la investigación');
            }

            const data = await response.json();
            setConversationId(data.conversationId);
            setReportMessageId(data.messageId);
        } catch (error: any) {
            console.error('[InvestigacionProfunda UI] Error:', error);
            showToast({ message: error.message || 'Error al conectar con el servidor', status: 'error' });
            setIsGenerating(false);
        }
    }, [topic, selectedModel, token, user, showToast]);

    const handleHistorySelect = (convoId: string, text: string, messageId: string) => {
        setConversationId(convoId);
        if (messageId) setReportMessageId(messageId);
        setGeneratedReport(text);
        editorContentRef.current = text;
        setIsHistoryOpen(false);
        setIsFormExpanded(false);
    };

    return (
        <div className="w-full space-y-6">
            {/* ─── BANNER DE ESTADO Y MÉTRICAS CONECTADAS ─── */}
            <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-500/5 via-teal-500/10 to-transparent p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-sm">
                            <Search className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                                    Investigación Profunda SST
                                </h1>
                                <span className="inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500 text-white shrink-0">
                                    Doctrina Legal
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {/* Estado Documento */}
                                <div
                                    title={generatedReport ? "Investigación Generada" : "Listo para Investigar"}
                                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                                        <span className="text-sm font-bold tracking-wide">
                                            {generatedReport ? "Dictamen Elaborado" : "IA Jurídica SST"}
                                        </span>
                                    </div>
                                </div>

                                {/* Res. 0312 / Dec. 1072: CUMPLE */}
                                <SGSSTLegalBadge
                                    standardCode="3.2.2"
                                    label="Res. 0312 / Dec. 1072: CUMPLE"
                                    tooltip="Dec. 1072/2015 Art. 2.2.4.6.32 y Res. 0312/2019 Estándar 3.2.2 — Investigación Profunda, Doctrina y Marco Jurídico en SST"
                                    moduleName="Investigación Profunda SST"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleGenerate}
                isAnalyzing={isGenerating}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                hasContent={!!(generatedReport || editorContentRef.current)}
                exportContent={editorContentRef.current || ''}
                exportFileName="Investigacion_Profunda_SST"
                onDummy={handleDummyData}
            />

            {isHistoryOpen ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-teal-600" />
                            Historial de Investigaciones Profundas
                        </h2>
                        <button
                            onClick={() => setIsHistoryOpen(false)}
                            className="text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                        >
                            Volver al Generador
                        </button>
                    </div>
                    <ReportHistory
                        onSelectReport={handleHistorySelect}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-investigacion-profunda']}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Collapsible Form Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setIsFormExpanded(!isFormExpanded)}
                            className="w-full flex items-center justify-between p-5 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Search className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                                    {isFormExpanded ? 'Configurar Consulta de Investigación' : 'Ver Parámetros de Consulta'}
                                </span>
                            </div>
                            {isFormExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                        </button>

                        {isFormExpanded && (
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Tema o problema de investigación
                                    </label>
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Escribe aquí los detalles del tema legal, accidente de trabajo o problema de SST que deseas que la IA investigue de forma profunda..."
                                        rows={5}
                                        disabled={isGenerating}
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent dark:focus:ring-teal-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <DummyGenerateButton onClick={handleDummyData} />
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <BrainCircuit className="w-4 h-4" />
                                                Iniciar Investigación
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Background generation status card */}
                    {isGenerating && (
                        <div className="bg-teal-50/30 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-950 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm animate-pulse">
                            <div className="w-10 h-10 border-4 border-teal-200 dark:border-teal-900 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin"></div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-teal-800 dark:text-teal-300 text-base">🔍 Investigación en Curso en Segundo Plano</h3>
                                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{progressStatus}</p>
                            </div>
                            <p className="text-xs text-teal-500 dark:text-teal-500 max-width: 480px;">
                                Esta consulta cruza bases de datos y legislación. El análisis toma alrededor de un minuto. 
                                <strong>Puedes cerrar esta pantalla con total seguridad;</strong> la tarea continuará y te avisaremos.
                            </p>
                        </div>
                    )}

                    {/* Report Box */}
                    {generatedReport && (
                        <CollapsibleReportBox
                            title="Resultado de la Investigación Profunda"
                            icon="ScrollText"
                        >
                            <LiveEditor
                                ref={liveEditorRef}
                                initialContent={generatedReport}
                                onUpdate={(val) => {
                                    editorContentRef.current = val;
                                }}
                            />
                        </CollapsibleReportBox>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvestigacionProfunda;
