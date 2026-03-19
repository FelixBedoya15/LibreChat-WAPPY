import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    History,
    Brain,
    Database,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    HeartPulse,
    Activity,
    LineChart,
    RefreshCw
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';

interface ForecastData {
    overallRisk: number;
    criticalArea: string;
    predictionSummary: string;
    indicators: {
        healthRisk: number;
        safetyRisk: number;
        ergonomicRisk: number;
    };
    recommendedActions: string[];
}

const Gauge = ({ value, label, color, icon: Icon }: { value: number, label: string, color: string, icon: any }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center p-4 bg-surface-primary rounded-2xl border border-border-medium shadow-sm transition-all hover:shadow-md">
            <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-100 dark:text-gray-800"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <Icon className="h-5 w-5 mb-0.5" style={{ color }} />
                    <span className="text-lg font-bold text-text-primary">{value}%</span>
                </div>
            </div>
            <span className="mt-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</span>
        </div>
    );
};

const DashboardPredictivo = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { token } = useAuthContext();

    // Data State
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    
    // UI State
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);

    // Fetch Predictive Data
    const fetchForecast = useCallback(async () => {
        if (!token) return;
        setIsLoadingForecast(true);
        try {
            const res = await fetch('/api/sgsst/predictivo/forecast', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setForecast(data);
            } else {
                showToast({ message: 'Error al cargar indicadores predictivos', status: 'error' });
            }
        } catch (err) {
            console.error('Forecast error:', err);
        } finally {
            setIsLoadingForecast(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchForecast();
    }, [fetchForecast]);

    // Report Generation
    const handleGenerate = async (profundo = false) => {
        if (!token) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/sgsst/predictivo/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    modelName: selectedModel,
                    advanced: profundo
                })
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedReport(data.report);
                setEditorContent(data.report);
                setConversationId('new');
                setReportMessageId(null);
                showToast({ message: 'Pronóstico de IA generado exitosamente', status: 'success' });
            } else {
                throw new Error('Error en la generación');
            }
        } catch (error) {
            showToast({ message: 'Error al generar el pronóstico', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveReport = async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;

        try {
            const isNew = conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    ...(isNew ? {
                        title: `Pronóstico Predictivo SST - ${new Date().toLocaleDateString()}`,
                        tags: ['sgsst-predictivo-ia']
                    } : {
                        conversationId,
                        messageId: reportMessageId
                    })
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (isNew) {
                    setConversationId(data.conversationId);
                    setReportMessageId(data.messageId);
                }
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Pronóstico guardado en el historial', status: 'success' });
            }
        } catch (err) {
            showToast({ message: 'Error al guardar', status: 'error' });
        }
    };

    const handleSelectReport = (report: any) => {
        setGeneratedReport(report.content);
        setEditorContent(report.content);
        setConversationId(report.conversationId);
        setReportMessageId(report.messageId);
        setIsHistoryOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Dashboard Predictivo de Riesgos IA</h2>
                        <span className="text-xs text-text-secondary">Análisis cruzado de todo el ecosistema SST</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchForecast}
                        disabled={isLoadingForecast}
                        title="Actualizar datos en tiempo real"
                        className="p-2 rounded-full hover:bg-surface-hover text-text-secondary transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoadingForecast ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isGenerating}
                        className="group flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-sm"
                    >
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Generar Pronóstico
                        </span>
                    </button>

                    <button
                        onClick={() => handleGenerate(true)}
                        disabled={isGenerating}
                        title="Análisis IA Profundo"
                        className="p-2 rounded-full border border-border-medium hover:bg-surface-hover text-text-primary transition-colors"
                    >
                        <Brain className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`p-2 rounded-full border border-border-medium transition-colors ${isHistoryOpen ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-surface-hover text-text-primary'}`}
                    >
                        <History className="h-5 w-5" />
                    </button>

                    {generatedReport && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveReport}
                                className="p-2 rounded-full border border-border-medium hover:bg-surface-hover text-text-primary transition-colors"
                            >
                                <Database className="h-5 w-5" />
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport}
                                fileName={`Pronostico_Predictivo_SST_${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                    )}

                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
                </div>
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(false)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-predictivo-ia']}
                    />
                </div>
            )}

            {/* Predictive Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Main Probability Card */}
                <div className="md:col-span-1 p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Probabilidad Total Accidentes</span>
                    <div className="text-5xl font-black mb-1">
                        {isLoadingForecast ? <Loader2 className="animate-spin" /> : `${forecast?.overallRisk || 0}%`}
                    </div>
                    <span className="text-sm font-medium opacity-90">Nivel de Riesgo: {forecast?.overallRisk && forecast.overallRisk > 70 ? 'MUY ALTO' : forecast?.overallRisk && forecast.overallRisk > 40 ? 'ALTO' : 'MODERADO'}</span>
                    {forecast?.criticalArea && (
                        <div className="mt-4 pt-4 border-t border-white/20 w-full text-xs">
                            <span className="block opacity-70 mb-1">ÁREA CRÍTICA:</span>
                            <span className="font-bold">{forecast.criticalArea}</span>
                        </div>
                    )}
                </div>

                {/* Specific Gauges */}
                <Gauge 
                    value={forecast?.indicators.safetyRisk || 0} 
                    label="Seguridad" 
                    color="#f59e0b" 
                    icon={AlertTriangle} 
                />
                <Gauge 
                    value={forecast?.indicators.healthRisk || 0} 
                    label="Salud" 
                    color="#ef4444" 
                    icon={HeartPulse} 
                />
                <Gauge 
                    value={forecast?.indicators.ergonomicRisk || 0} 
                    label="Ergonomía" 
                    color="#10b981" 
                    icon={ShieldCheck} 
                />
            </div>

            {/* AI Prediction Summary & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        ANÁLISIS DE CORRELACIÓN IA
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed italic">
                        {forecast?.predictionSummary || "Recopilando datos históricos para generar síntesis predictiva..."}
                    </p>
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/20">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-2 underline">POR QUÉ SE PREDICE ESTO:</span>
                        <ul className="text-xs space-y-1.5 text-text-secondary list-disc pl-4">
                            <li>Cruce de estadísticas ATEL con reportes de actos inseguros.</li>
                            <li>Identificación de patrones de fatiga en perfiles de cargo.</li>
                            <li>Vulnerabilidades detectadas en análisis regional/sectorial.</li>
                        </ul>
                    </div>
                </div>

                {/* Recommended Actions */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        ACCIONES PRESCRIPTIVAS INMEDIATAS
                    </h3>
                    <div className="space-y-3">
                        {forecast?.recommendedActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-surface-primary rounded-xl border border-border-medium group hover:border-green-400 transition-colors">
                                <div className="mt-1 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">
                                    {i + 1}
                                </div>
                                <span className="text-sm text-text-primary">{action}</span>
                            </div>
                        )) || [1,2,3].map(i => (
                            <div key={i} className="h-12 bg-surface-tertiary animate-pulse rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Generated Report Section */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-md">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-indigo-600" />
                            Informe Predictivo Detallado
                        </h3>
                        <span className="text-xs text-text-secondary">AI Forecast Engine v1.0</span>
                    </div>
                    <div className="p-1">
                        <LiveEditor
                            initialContent={generatedReport}
                            onUpdate={setEditorContent}
                            onSave={handleSaveReport}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPredictivo;
