import React, { useState, useCallback, useEffect } from 'react';
import {
    Sparkles,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    HeartPulse,
    Activity,
    LineChart,
    RefreshCw,
    Brain,
    TrendingUp,
    Zap,
    Users,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';
import { useAutoLoadReport } from './useAutoLoadReport';
import { UpgradeWall } from './UpgradeWall';
import { SystemRoles } from 'librechat-data-provider';

interface ForecastData {
    overallRisk: number;
    criticalArea: string;
    predictionSummary: string;
    indicators: {
        healthRisk: number;
        safetyRisk: number;
        ergonomicRisk: number;
    };
    evidence: {
        healthEvidence: string;
        safetyEvidence: string;
        ergonomicEvidence: string;
    };
    recommendedActions: string[];
}

// ─── Animated Ring Gauge ──────────────────────────────────────────────────────
const RingGauge = ({
    value,
    label,
    color,
    bgColor,
    icon: Icon,
    description,
}: {
    value: number;
    label: string;
    color: string;
    bgColor: string;
    icon: any;
    description?: string;
}) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const riskLabel = value >= 70 ? 'CRÍTICO' : value >= 40 ? 'ALTO' : value >= 20 ? 'MODERADO' : 'BAJO';
    const riskColor = value >= 70 ? '#ef4444' : value >= 40 ? '#f97316' : value >= 20 ? '#eab308' : '#22c55e';

    return (
        <div className="flex flex-col items-center p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 group cursor-default">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4`} style={{ backgroundColor: bgColor }}>
                <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="relative flex items-center justify-center mb-4">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="9" fill="transparent" className="dark:stroke-gray-700" />
                    {/* Progress arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={color}
                        strokeWidth="9"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}60)` }}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-text-primary" style={{ letterSpacing: '-0.04em' }}>{value}%</span>
                </div>
            </div>
            <span className="text-xs font-black text-text-primary uppercase tracking-[0.12em] text-center mb-1">{label}</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: riskColor, backgroundColor: `${riskColor}15` }}>
                {riskLabel}
            </span>
            {description && <p className="text-[11px] text-text-secondary text-center mt-2 leading-relaxed">{description}</p>}
        </div>
    );
};

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────
const RiskBar = ({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return (
        <div className="flex items-center gap-3 group">
            <span className="text-xs font-semibold text-text-secondary w-36 shrink-0 text-right">{label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
                <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                        width: `${width}%`,
                        backgroundColor: color,
                        transition: `width 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                        boxShadow: `0 0 8px ${color}40`,
                    }}
                >
                    <span className="text-[10px] font-black text-white">{value}%</span>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main DashboardPredictivo Component ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const DashboardPredictivo = () => {
    const { showToast } = useToastContext();
    const { token, user } = useAuthContext();
    const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';

    // Data State
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    // UI State
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isReportCollapsed, setIsReportCollapsed] = useState(false);

    // ─── Fetch Forecast Data ─────────────────────────────────────────────
    const fetchForecast = useCallback(async () => {
        if (!token) return;
        if (!isPro) {
            setForecast(null);
            return;
        }
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
            showToast({ message: 'Error de conexión con el servidor', status: 'error' });
        } finally {
            setIsLoadingForecast(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchForecast();
    }, []);

    // ─── Report Generation ────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!token) return;
        if (!isPro) {
            showToast({ message: 'Mejora a un plan Pro para generar análisis de IA', status: 'warning' });
            return;
        }
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
            setConversationId('new');
            setReportMessageId(null);
            setIsReportCollapsed(false);
            showToast({ message: 'Informe Predictivo generado exitosamente', status: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar el informe', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [selectedModel, token, showToast]);

    // ─── Save Report ──────────────────────────────────────────────────────
    const handleSaveReport = useCallback(async () => {
        const contentToSave = editorContent || generatedReport;
        if (!contentToSave) { showToast({ message: 'No hay informe para guardar', status: 'warning' }); return; }
        if (!token) { showToast({ message: 'Error: No autorizado', status: 'error' }); return; }

        try {
            const isNew = !conversationId || conversationId === 'new';
            const body = {
                content: contentToSave,
                ...(isNew ? {
                    title: `Pronóstico IA Predictivo - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-predictivo-ia']
                } : { conversationId, messageId: reportMessageId })
            };

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
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

    // ─── Select Report from History ──────────────────────────────────────
    const handleSelectReport = async (reportOrId: any) => {
        let content = '', convId = '', msgId = '';

        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                const res = await fetch(`/api/messages/${convId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const messages = await res.json();
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' ||
                        (m.isCreatedByUser === false && m.text && m.text.includes('<html')) ||
                        (m.isCreatedByUser === false && m.text && m.text.length > 100)
                    );
                    if (reportMsg) { content = reportMsg.text; msgId = reportMsg.messageId; }
                    else { const last = messages[0]; if (last) { content = last.text; msgId = last.messageId; } }
                }
            } catch { showToast({ message: 'Error al obtener el contenido del informe', status: 'error' }); return; }
        } else if (reportOrId?.content) {
            content = reportOrId.content; convId = reportOrId.conversationId; msgId = reportOrId.messageId;
        }

        if (content) {
            setGeneratedReport(content); setEditorContent(content);
            setConversationId(convId); setReportMessageId(msgId);
            setIsHistoryOpen(false);
            showToast({ message: 'Informe cargado desde historial', status: 'info' });
        } else {
            showToast({ message: 'No se encontró contenido válido en el informe', status: 'warning' });
        }
    };

    const overallRisk = forecast?.overallRisk || 0;
    const riskBadgeColor = overallRisk > 70 ? '#ef4444' : overallRisk > 40 ? '#f97316' : '#22c55e';
    const riskBadgeBg = overallRisk > 70 ? '#fef2f2' : overallRisk > 40 ? '#fff7ed' : '#f0fdf4';
    const riskLabel = overallRisk > 70 ? 'Riesgo Extremo' : overallRisk > 40 ? 'Riesgo Alto' : 'Controlado';

    // Build bar data from forecast
    const barData = [
        { label: 'Riesgo Ergonómico', value: forecast?.indicators?.ergonomicRisk || 0, color: '#8b5cf6' },
        { label: 'Vigilancia Salud', value: forecast?.indicators?.healthRisk || 0, color: '#ef4444' },
        { label: 'Seguridad Física', value: forecast?.indicators?.safetyRisk || 0, color: '#f97316' },
        { label: 'Riesgo General', value: overallRisk, color: '#0d9488' },
    ];

    useAutoLoadReport({
        token,
        tags: ['sgsst-predictivo-ia'],
        generatedReport,
        handleSelectReport
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ═══ Header / Toolbar ═══ */}
            <div className="flex flex-col items-start justify-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-600/10 via-surface-secondary to-purple-600/10 border border-border-medium shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30">
                        <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Gestor de Inteligencia Predictiva SST</h2>
                        <div className="flex flex-wrap items-center gap-2 w-full">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-text-secondary">Análisis cruzado de 8 módulos integrados</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Refresh */}
                    <button onClick={fetchForecast} disabled={isLoadingForecast}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                        <RefreshCw className={cn("h-4 w-4 text-teal-500", isLoadingForecast && "animate-spin")} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs">
                            Actualizar
                        </span>
                    </button>

                    {/* Generate */}
                    <button onClick={() => handleGenerate()} disabled={isGenerating}
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-full transition-all duration-300 shadow-md shadow-teal-500/30 font-semibold text-sm ring-2 ring-teal-500/20 disabled:opacity-50">
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AnimatedIcon name="sparkles" size={16} />}
                        {isGenerating ? 'Analizando...' : 'Generar Pronóstico IA'}
                    </button>

                    {/* History */}
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
                        <AnimatedIcon name="history" size={16} />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs">Historial</span>
                    </button>

                    {/* Save & Export (only when report exists) */}
                    {generatedReport && (
                        <>
                            <button onClick={() => handleSaveReport()}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                                <AnimatedIcon name="save" size={16} className="text-gray-500" />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs">Guardar</span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Pronostico_Predictivo_IA_${new Date().toISOString().split('T')[0]}`}
                            />
                        </>
                    )}

                    <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
                </div>
            </div>

            {/* ═══ Report History ═══ */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-predictivo-ia']} />
                </div>
            )}

            {/* ═══ Main Dashboard Grid ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Hero Card ── */}
                <div className="lg:col-span-1 relative overflow-hidden rounded-2xl p-7 flex flex-col justify-between min-h-[280px]"
                    style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #134e4a 100%)' }}>
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 right-4 w-20 h-20 rounded-full bg-white/5" />

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-teal-200" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-200">Probabilidad de Siniestro</span>
                        </div>
                        <div className="text-7xl font-black text-white mb-3" style={{ letterSpacing: '-0.04em' }}>
                            {isLoadingForecast
                                ? <div className="h-16 w-32 bg-white/10 rounded-xl animate-pulse" />
                                : `${overallRisk}%`
                            }
                        </div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: riskBadgeBg, color: riskBadgeColor }}>
                            {riskLabel}
                        </span>
                    </div>

                    {forecast?.criticalArea && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <span className="block text-[10px] text-teal-200 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Área Crítica
                            </span>
                            <span className="font-black text-white text-sm">{forecast.criticalArea.toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* ── Right: 3 Gauges ── */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <RingGauge
                        value={forecast?.indicators?.safetyRisk || 0}
                        label="Seguridad Física"
                        color="#f97316"
                        bgColor="#fff7ed"
                        icon={AlertTriangle}
                        description={forecast?.evidence?.safetyEvidence || "Condiciones y actos inseguros no controlados"}
                    />
                    <RingGauge
                        value={forecast?.indicators?.healthRisk || 0}
                        label="Vigilancia Salud"
                        color="#ef4444"
                        bgColor="#fef2f2"
                        icon={HeartPulse}
                        description={forecast?.evidence?.healthEvidence || "Hallazgos médicos y patologías de origen laboral"}
                    />
                    <RingGauge
                        value={forecast?.indicators?.ergonomicRisk || 0}
                        label="Ergonomía"
                        color="#8b5cf6"
                        bgColor="#f5f3ff"
                        icon={ShieldCheck}
                        description={forecast?.evidence?.ergonomicEvidence || "Riesgos biomecánicos y posturales (OWAS)"}
                    />
                </div>
            </div>

            {/* ═══ Bar Chart + Predicted Insight ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Bar Chart */}
                <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                    <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-500" />
                        RADAR DE FACTORES DE RIESGO
                    </h3>
                    {isLoadingForecast ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex flex-wrap items-center gap-3 w-full">
                                    <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {barData.map((bar, i) => (
                                <RiskBar key={bar.label} {...bar} delay={i * 150} />
                            ))}
                        </div>
                    )}

                    {/* Data Sources */}
                    <div className="mt-5 pt-4 border-t border-border-light">
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block mb-2 uppercase tracking-wider">Fuentes Integradas:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                            {['Perfil Sociodemográfico', 'Estadísticas ATEL', 'Investigaciones ATEL', 'Actos/Condiciones', 'Método OWAS', 'ATS', 'Vulnerabilidad', 'Matriz GTC 45'].map(src => (
                                <div key={src} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                                    {src}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Correlation Panel or Upgrade Wall */}
                <div className="flex flex-col gap-4">
                    {!isPro ? (
                        <div className="flex-1 flex flex-col justify-center h-full">
                            <UpgradeWall
                                description="Esta sección requiere un plan PRO. Analiza en tiempo real de forma predictiva mediante IA el ecosistema de más de 8 módulos interconectados de SGSST."
                                isCompact={false}
                                plan="USER_PLUS"
                            />
                        </div>
                    ) : (
                        <>
                            {/* AI Insight Card */}
                            <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm flex-1">
                                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <AnimatedIcon name="sparkles" size={16} className="text-teal-500" />
                                    ANÁLISIS DE CORRELACIÓN PREDICTIVA
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium italic p-4 bg-surface-primary rounded-xl border border-border-light">
                                    "{forecast?.predictionSummary || "Haga clic en 'Actualizar' para generar el análisis predictivo cruzado de todos los módulos..."}"
                                </p>
                            </div>

                            {/* Recommended Actions */}
                            <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <AnimatedIcon name="database" size={16} className="text-green-500" />
                                    ACCIONES PREVENTIVAS PRIORITARIAS
                                </h3>
                                <div className="space-y-2">
                                    {forecast?.recommendedActions?.length ? forecast.recommendedActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-surface-primary rounded-xl border border-border-medium hover:border-green-400/50 hover:shadow-sm transition-all group">
                                            <div className="mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 group-hover:scale-110 transition-transform"
                                                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                                                {i + 1}
                                            </div>
                                            <span className="text-xs text-text-primary font-medium leading-relaxed">{action}</span>
                                        </div>
                                    )) : [1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-surface-primary rounded-xl border border-border-light">
                                            <div className="h-6 w-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                                            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* ═══ Generated Report ═══ */}
            {generatedReport && (
                <div className="rounded-2xl border-2 border-[#10b981]/20 bg-surface-primary overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                    <div 
                        className="border-b border-border-medium bg-gradient-to-r from-[#10b981]/10 to-transparent dark:from-[#10b981]/20 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#10b981]/5 transition-colors"
                        onClick={() => setIsReportCollapsed(!isReportCollapsed)}
                    >
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            <div className="p-2 rounded-lg bg-[#10b981]/20 text-[#10b981]">
                                <LineChart className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0d9488] dark:text-[#10b981]">Informe Predictivo Detallado</h3>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Generado por WAPPY AI Engine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleSaveReport()}
                                className="group flex items-center px-3 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-full transition-all duration-300 shadow-sm font-bold text-xs">
                                <AnimatedIcon name="save" size={16} />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar en Historial</span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Pronostico_Predictivo_IA_${new Date().toISOString().split('T')[0]}`}
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsReportCollapsed(!isReportCollapsed); }}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-text-secondary"
                            >
                                {isReportCollapsed ? <ChevronDown /> : <ChevronUp />}
                            </button>
                        </div>
                    </div>
                    {!isReportCollapsed && (
                        <div className="p-2 min-h-[600px] bg-white dark:bg-[#1a1a1a]">
                            <LiveEditor
                                initialContent={generatedReport}
                                onUpdate={setEditorContent}
                                onSave={handleSaveReport}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPredictivo;
