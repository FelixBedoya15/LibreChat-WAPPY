import React, { useState, useCallback, useEffect } from 'react';
import {
    Sparkles,
    History,
    BarChart,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    HeartPulse,
    Activity,
    LineChart,
    RefreshCw,
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

// ─── SVG Gauge Component ─────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main DashboardPredictivo Component ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const DashboardPredictivo = () => {
    const { showToast } = useToastContext();
    const { token } = useAuthContext();

    // Data State
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    // UI State (same pattern as EstadisticasATEL)
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ─── Fetch Forecast Data ─────────────────────────────────────────────
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
                showToast({ message: 'Indicadores predictivos actualizados', status: 'success' });
            } else {
                const errData = await res.json();
                showToast({ message: errData.error || 'Error al cargar indicadores', status: 'error' });
            }
        } catch (err) {
            console.error('Forecast error:', err);
            showToast({ message: 'Error de conexión con el servidor', status: 'error' });
        } finally {
            setIsLoadingForecast(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchForecast();
    }, []);

    // ─── Report Generation (same pattern as EstadisticasATEL.handleGenerate) ──
    const handleGenerate = useCallback(async () => {
        if (!token) return;
        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/predictivo/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ modelName: selectedModel }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el informe');
            }

            const data = await response.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);

            // Reset context for new save
            setConversationId('new');
            setReportMessageId(null);

            showToast({ message: 'Informe Predictivo generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Predictive report error:', error);
            showToast({ message: error.message || 'Error al generar el informe', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [selectedModel, token, showToast]);

    // ─── Save Report (same pattern as EstadisticasATEL.handleSaveReport) ──
    const handleSaveReport = useCallback(async () => {
        const contentToSave = editorContent || generatedReport;
        if (!contentToSave) {
            showToast({ message: 'No hay informe para guardar', status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: 'Error: No autorizado', status: 'error' });
            return;
        }

        try {
            const isNew = !conversationId || conversationId === 'new';
            const method = isNew ? 'POST' : 'PUT';

            const body = {
                content: contentToSave,
                ...(isNew ? {
                    title: `Pronóstico IA Predictivo - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-predictivo-ia']
                } : {
                    conversationId,
                    messageId: reportMessageId
                })
            };

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                if (isNew) {
                    setConversationId(data.conversationId);
                    setReportMessageId(data.messageId);
                }
                setGeneratedReport(contentToSave);
                setEditorContent(contentToSave);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Informe guardado exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast]);

    // ─── Select Report from History (same pattern as EstadisticasATEL) ────
    const handleSelectReport = async (reportOrId: any) => {
        let content = '';
        let convId = '';
        let msgId = '';

        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                const res = await fetch(`/api/messages/${convId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const messages = await res.json();
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' ||
                        (m.isCreatedByUser === false && m.text && m.text.includes('<html')) ||
                        (m.isCreatedByUser === false && m.text && m.text.length > 100)
                    );

                    if (reportMsg) {
                        content = reportMsg.text;
                        msgId = reportMsg.messageId;
                    } else {
                        const last = messages[0];
                        if (last) {
                            content = last.text;
                            msgId = last.messageId;
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching report content:', error);
                showToast({ message: 'Error al obtener el contenido del informe', status: 'error' });
                return;
            }
        } else if (reportOrId && reportOrId.content) {
            content = reportOrId.content;
            convId = reportOrId.conversationId;
            msgId = reportOrId.messageId;
        }

        if (content) {
            setGeneratedReport(content);
            setEditorContent(content);
            setConversationId(convId);
            setReportMessageId(msgId);
            setIsHistoryOpen(false);
            showToast({ message: 'Informe cargado desde historial', status: 'info' });
        } else {
            showToast({ message: 'No se encontró contenido válido en el informe', status: 'warning' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ═══ Header / Toolbar (Same structure as EstadisticasATEL) ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Gestor de Inteligencia Predictiva SST</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-text-secondary">Análisis cruzado de 8 módulos integrados</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Refrescar Indicadores */}
                    <button
                        onClick={fetchForecast}
                        disabled={isLoadingForecast}
                        title="Actualizar Indicadores Predictivos"
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                    >
                        <RefreshCw className={cn("h-5 w-5 text-gray-500", isLoadingForecast && "animate-spin")} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Actualizar Indicadores
                        </span>
                    </button>

                    {/* Botón Generar Pronóstico IA (equivalente al Sparkles de otros apps) */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm ring-2 ring-teal-500/20 disabled:opacity-50"
                    >
                        {isGenerating
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <AnimatedIcon name="sparkles" size={20} />
                        }
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Generar Pronóstico IA
                        </span>
                    </button>

                    {/* Botón Historial (same as EstadisticasATEL) */}
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                    >
                        <AnimatedIcon name="history" size={20} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Historial Informes
                        </span>
                    </button>

                    {/* Guardar Informe + Exportar (only when report exists) */}
                    {generatedReport && (
                        <>
                            <button
                                onClick={handleSaveReport}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                            >
                                <AnimatedIcon name="save" size={20} className="text-gray-500" />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                    Guardar Informe
                                </span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Pronostico_Predictivo_IA_${new Date().toISOString().split('T')[0]}`}
                            />
                        </>
                    )}

                    {/* Model Selector */}
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
                </div>
            </div>

            {/* ═══ ReportHistory Sidebar (same pattern as EstadisticasATEL) ═══ */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-predictivo-ia']}
                    />
                </div>
            )}

            {/* ═══ Indicadores Predictivos (Gauges) ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Carta Principal de Probabilidad */}
                <div className="md:col-span-1 p-8 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 rounded-2xl text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
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
                            <span className="font-black text-teal-100">{forecast.criticalArea.toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* Gauges Específicos */}
                <Gauge value={forecast?.indicators?.safetyRisk || 0} label="Seguridad Física" color="#f59e0b" icon={AlertTriangle} />
                <Gauge value={forecast?.indicators?.healthRisk || 0} label="Vigilancia Salud" color="#ef4444" icon={HeartPulse} />
                <Gauge value={forecast?.indicators?.ergonomicRisk || 0} label="Ergonomía" color="#10b981" icon={ShieldCheck} />
            </div>

            {/* ═══ Resumen de IA y Acciones Prescriptivas ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis de Correlación */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2.5">
                        <AnimatedIcon name="sparkles" size={18} className="text-teal-500" />
                        ANÁLISIS DE CORRELACIÓN PREDICTIVA
                    </h3>
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary leading-relaxed font-medium italic p-4 bg-surface-primary rounded-xl border border-border-light shadow-inner">
                            "{forecast?.predictionSummary || "Haga clic en 'Actualizar Indicadores' para generar el análisis predictivo..."}"
                        </p>
                        <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 rounded-xl border border-teal-100/50 dark:border-teal-800/20">
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block mb-3 uppercase tracking-wider">Fuentes de Datos Integradas:</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary">
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Perfil Sociodemográfico</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Estadísticas ATEL</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Investigaciones ATEL</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Actos/Condiciones Inseguras</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Método OWAS (Ergonomía)</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />ATS (Tareas Críticas)</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Análisis de Vulnerabilidad</li>
                                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-teal-400" />Matriz GTC 45</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Acciones Prescriptivas */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                    <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2.5">
                        <AnimatedIcon name="database" size={18} className="text-green-500" />
                        ACCIONES PREVENTIVAS DE ALTA PRIORIDAD
                    </h3>
                    <div className="space-y-3">
                        {forecast?.recommendedActions?.length ? forecast.recommendedActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-surface-primary rounded-xl border border-border-medium hover:border-green-400 hover:shadow-sm transition-all group">
                                <div className="mt-0.5 h-6 w-6 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <span className="text-sm text-text-primary font-medium">{action}</span>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-surface-tertiary/50 rounded-xl border border-border-light">
                                <div className="h-6 w-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Generated Report - LiveEditor ═══ */}
            {generatedReport && (
                <div className="rounded-2xl border-2 border-teal-500/20 bg-surface-primary overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="border-b border-border-medium bg-teal-50/50 dark:bg-teal-950/20 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LineChart className="h-6 w-6 text-teal-600" />
                            <div>
                                <h3 className="font-bold text-text-primary">Informe Predictivo Detallado</h3>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Generado por WAPPY AI Engine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={handleSaveReport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                            >
                                <AnimatedIcon name="save" size={14} />
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
