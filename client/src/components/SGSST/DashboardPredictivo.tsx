import React, { useState, useEffect, useCallback } from 'react';
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
    RefreshCw,
    X,
    ChevronDown
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';

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
        <div className="flex flex-col items-center p-6 bg-surface-primary rounded-2xl border border-border-medium shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30 group">
            <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-100 dark:text-gray-800"
                    />
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <Icon className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" style={{ color }} />
                    <span className="text-xl font-bold text-text-primary">{value}%</span>
                </div>
            </div>
            <span className="mt-4 text-xs font-bold text-text-secondary uppercase tracking-[0.1em]">{label}</span>
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
    const [isSaving, setIsSaving] = useState(false);
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
                if (data.overallRisk > 0) {
                   showToast({ message: 'Indicadores predictivos actualizados', status: 'success' });
                }
            } else {
                const errData = await res.json();
                showToast({ message: errData.error || 'Error al cargar indicadores', status: 'error' });
            }
        } catch (err) {
            console.error('Forecast error:', err);
            showToast({ message: 'Error de conexión con el servidor predictivo', status: 'error' });
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
                const errData = await res.json();
                throw new Error(errData.error || 'Error en la generación');
            }
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar el pronóstico', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveReport = async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;

        setIsSaving(true);
        try {
            const isNew = conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    ...(isNew ? {
                        title: `Pronóstico IA Predictivo - ${new Date().toLocaleDateString()}`,
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
                showToast({ message: 'Pronóstico guardado correctamente', status: 'success' });
            }
        } catch (err) {
            showToast({ message: 'Error al ahorrar', status: 'error' });
        } finally {
            setIsSaving(false);
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
            {/* Toolbar Principal - Matching other apps style */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary tracking-tight">Gestor Predictivo SST Inteligente</h2>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Predicción activa basada en 8 módulos integrados
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Botón Refrescar Datos */}
                    <button
                        onClick={fetchForecast}
                        disabled={isLoadingForecast}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:border-indigo-500/50 hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                    >
                        <RefreshCw className={cn("h-5 w-5 text-gray-500 mr-0 transition-transform group-hover:rotate-180", isLoadingForecast && "animate-spin")} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Actualizar Indicadores
                        </span>
                    </button>

                    {/* Botón Generar Pronóstico */}
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isGenerating}
                        className="group flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm ring-2 ring-indigo-500/20"
                    >
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                        Generar Pronóstico IA
                    </button>

                    {/* Botón Análisis Avanzado */}
                    <button
                        onClick={() => handleGenerate(true)}
                        disabled={isGenerating}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-400 text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                    >
                        <Brain className="h-5 w-5 text-indigo-500" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-indigo-600 dark:text-indigo-400">
                            Análisis Profundo
                        </span>
                    </button>

                    {/* Botón Historial */}
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={cn(
                           "group flex items-center px-3 py-2 border transition-all duration-300 shadow-sm font-medium text-sm rounded-full",
                           isHistoryOpen ? "bg-indigo-600 border-indigo-600 text-white" : "bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                        )}
                    >
                        <History className={cn("h-5 w-5 transition-transform group-hover:scale-110", isHistoryOpen ? "text-white" : "text-gray-500")} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            {isHistoryOpen ? 'Cerrar Historial' : 'Ver Historial'}
                        </span>
                    </button>

                    {generatedReport && (
                        <div className="flex items-center gap-2 border-l border-border-medium pl-2.5 ml-1">
                            {/* Botón Guardar */}
                            <button
                                onClick={handleSaveReport}
                                disabled={isSaving}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-gray-500" />}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                    Guardar Resultado
                                </span>
                            </button>
                            
                            {/* Dropdown Exportar */}
                            <ExportDropdown
                                content={editorContent || generatedReport}
                                fileName={`Pronostico_IA_Predictivo_${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                    )}

                    {/* Selector de Modelos */}
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
                </div>
            </div>

            {/* Panel de Historial */}
            {isHistoryOpen && (
                <div className="rounded-2xl border border-border-medium bg-surface-primary overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 bg-surface-tertiary border-b border-border-medium">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-500" />
                            <h3 className="font-bold text-text-primary">Historial de Pronósticos Generados</h3>
                        </div>
                        <button 
                            onClick={() => setIsHistoryOpen(false)}
                            className="p-1 rounded-full hover:bg-surface-hover transition-colors"
                        >
                            <X className="h-5 w-5 text-text-secondary" />
                        </button>
                    </div>
                    <div className="p-2 max-h-[500px] overflow-y-auto bg-surface-primary">
                        <ReportHistory
                            onSelectReport={handleSelectReport}
                            isOpen={isHistoryOpen}
                            toggleOpen={() => setIsHistoryOpen(false)}
                            refreshTrigger={refreshTrigger}
                            tags={['sgsst-predictivo-ia']}
                        />
                    </div>
                </div>
            )}

            {/* Indicadores Predictivos en Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Carta Principal de Probabilidad */}
                <div className="md:col-span-1 p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                        <Sparkles className="h-24 w-24" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-3 border-b border-white/20 pb-1">Probabilidad de Siniestro</span>
                    <div className="text-6xl font-black mb-2 tracking-tighter">
                        {isLoadingForecast ? <Loader2 className="h-10 w-10 animate-spin" /> : `${forecast?.overallRisk || 0}%`}
                    </div>
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        (forecast?.overallRisk || 0) > 70 ? "bg-red-500" : (forecast?.overallRisk || 0) > 40 ? "bg-amber-500" : "bg-green-500"
                    )}>
                        Riesgo {(forecast?.overallRisk || 0) > 70 ? 'Extremo' : (forecast?.overallRisk || 0) > 40 ? 'Alto' : 'Controlado'}
                    </div>
                    {forecast?.criticalArea && (
                        <div className="mt-6 pt-4 border-t border-white/20 w-full text-xs">
                            <span className="block opacity-70 mb-1 font-bold">ÁREA DE ENFOQUE CRÍTICO:</span>
                            <span className="font-black text-indigo-100">{forecast.criticalArea.toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* Gauges Específicos */}
                <Gauge 
                    value={forecast?.indicators.safetyRisk || 0} 
                    label="Seguridad Física" 
                    color="#f59e0b" 
                    icon={AlertTriangle} 
                />
                <Gauge 
                    value={forecast?.indicators.healthRisk || 0} 
                    label="Vigilancia Salud" 
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

            {/* Resumen de IA y Acciones Prescriptivas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis de Correlación */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2.5">
                        <AnimatedIcon name="brain" size={18} className="text-indigo-500" />
                        ANÁLISIS DE CORRELACIÓN PREDICTIVA (IA)
                    </h3>
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary leading-relaxed font-medium italic p-4 bg-surface-primary rounded-xl border border-border-light shadow-inner">
                            "{forecast?.predictionSummary || "Procesando algoritmos de riesgo. Haga clic en refrescar si no ve datos..."}"
                        </p>
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/20">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-3 uppercase tracking-wider">Metodología de Evaluación:</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary">
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                    Cruce ATEL vs Actos Inseguros
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                    Patrones Médicos Críticos
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                    Análisis de Posturas OWAS
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                    Riesgos Identificados GTC-45
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Acciones Prescriptivas */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                    <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2.5">
                        <AnimatedIcon name="shield" size={18} className="text-green-500" />
                        ACCIONES PREVENTIVAS DE ALTA PRIORIDAD
                    </h3>
                    <div className="space-y-3">
                        {forecast?.recommendedActions.length ? forecast.recommendedActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-surface-primary rounded-xl border border-border-medium hover:border-green-400 hover:shadow-sm transition-all group">
                                <div className="mt-0.5 h-6 w-6 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <span className="text-sm text-text-primary font-medium">{action}</span>
                            </div>
                        )) : [1,2,3].map(i => (
                            <div key={i} className="h-16 bg-surface-tertiary animate-pulse rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Informe Generado - Visualización de Resultados */}
            {generatedReport && (
                <div className="rounded-2xl border-2 border-indigo-500/20 bg-surface-primary overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="border-b border-border-medium bg-indigo-50/50 dark:bg-indigo-950/20 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LineChart className="h-6 w-6 text-indigo-600" />
                            <div>
                                <h3 className="font-bold text-text-primary">Informe Predictivo Detallado</h3>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Generado por WAPPY AI Engine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={handleSaveReport}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
                                Guardar en Historial
                            </button>
                        </div>
                    </div>
                    <div className="p-2 min-h-[600px] bg-white dark:bg-gray-900">
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
