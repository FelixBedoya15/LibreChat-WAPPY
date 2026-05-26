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
    BrainCircuit,
    Database,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
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

// ─── Animated Ring Gauge (Premium H1 Style) ──────────────────────────────────
const RingGauge = ({
    value,
    label,
    color,
    bgColor,
    icon: Icon,
    description,
    gradientId,
    gradColors,
}: {
    value: number;
    label: string;
    color: string;
    bgColor: string;
    icon: any;
    description?: string;
    gradientId: string;
    gradColors: { from: string; to: string };
}) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const riskLabel = value >= 70 ? 'CRÍTICO' : value >= 40 ? 'ALTO' : value >= 20 ? 'MODERADO' : 'BAJO';
    const riskColor = value >= 70 ? '#ef4444' : value >= 40 ? '#f97316' : value >= 20 ? '#eab308' : '#22c55e';

    return (
        <div className="flex flex-col items-center p-6 glass-premium rounded-3xl border border-border-medium/60 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1.5 group cursor-default">
            <div className="relative mb-5 shrink-0">
                <div className="absolute inset-0 rounded-2xl opacity-20 blur-md transition-all duration-500 group-hover:opacity-40" style={{ backgroundColor: color }} />
                <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" style={{ color }} />
                </div>
            </div>
            <div className="relative flex items-center justify-center mb-5">
                <svg className="w-32 h-32 transform -rotate-90 filter drop-shadow-[0_0_12px_rgba(0,0,0,0.06)]" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={gradColors.from} />
                            <stop offset="100%" stopColor={gradColors.to} />
                        </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-slate-800/60" />
                    {/* Progress arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        style={{
                            strokeDashoffset: offset,
                            transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            filter: `drop-shadow(0 0 8px ${color}60)`
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-text-primary tracking-tighter transition-all duration-300 group-hover:scale-105">{value}%</span>
                </div>
            </div>
            <span className="text-xs font-black text-text-primary uppercase tracking-[0.15em] text-center mb-2">{label}</span>
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm transition-all" style={{ color: riskColor, backgroundColor: `${riskColor}12`, border: `1px solid ${riskColor}25` }}>
                {riskLabel}
            </span>
            {description && <p className="text-[11px] text-text-secondary text-center mt-3.5 leading-relaxed px-1 font-medium">{description}</p>}
        </div>
    );
};

// ─── Horizontal Bar Chart (Premium Shimmer style) ──────────────────────────
const RiskBar = ({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return (
        <div className="flex items-center gap-4 group py-1">
            <span className="text-xs font-bold text-text-secondary w-36 shrink-0 text-right group-hover:text-text-primary transition-colors">{label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-slate-800/80 rounded-full h-6 overflow-hidden border border-border-light shadow-inner relative flex items-center">
                <div className="absolute inset-0 animate-shimmer-move pointer-events-none" />
                <div
                    className="h-full rounded-full flex items-center justify-end pr-3 transition-all relative"
                    style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        transition: `width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
                        boxShadow: `0 0 10px ${color}50`,
                    }}
                >
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{value}%</span>
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
    const [selectedModel, setSelectedModel] = useState(() => user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite');

    useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user]);
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

    // Quantum reactive background system for the Hero Card
    const getHeroStyles = (risk: number) => {
        if (risk >= 70) {
            return {
                bg: 'linear-gradient(135deg, #311012 0%, #7f1d1d 50%, #991b1b 100%)',
                glow: 'rgba(239, 68, 68, 0.45)',
                textGlow: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.85)]',
                badgeText: 'text-red-400',
                badgeBg: 'rgba(239, 68, 68, 0.15)',
                badgeBorder: 'border-red-500/30'
            };
        } else if (risk >= 40) {
            return {
                bg: 'linear-gradient(135deg, #2b170c 0%, #7c2d12 50%, #9a3412 100%)',
                glow: 'rgba(249, 115, 22, 0.45)',
                textGlow: 'drop-shadow-[0_0_20px_rgba(249,115,22,0.85)]',
                badgeText: 'text-orange-400',
                badgeBg: 'rgba(249, 115, 22, 0.15)',
                badgeBorder: 'border-orange-500/30'
            };
        } else {
            return {
                bg: 'linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #115e59 100%)',
                glow: 'rgba(13, 148, 136, 0.45)',
                textGlow: 'drop-shadow-[0_0_20px_rgba(20,184,166,0.85)]',
                badgeText: 'text-teal-300',
                badgeBg: 'rgba(20, 184, 166, 0.15)',
                badgeBorder: 'border-teal-400/30'
            };
        }
    };
    
    const heroStyles = getHeroStyles(overallRisk);

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Inject Custom Style Block for High End Micro-Animations */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.15); }
                }
                @keyframes border-shimmer {
                    0% { border-color: rgba(20, 184, 166, 0.4); }
                    50% { border-color: rgba(99, 102, 241, 0.6); }
                    100% { border-color: rgba(20, 184, 166, 0.4); }
                }
                @keyframes shimmer-move {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
                .animate-border-shimmer {
                    animation: border-shimmer 4s infinite ease-in-out;
                }
                .animate-shimmer-move {
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
                    background-size: 200% 100%;
                    animation: shimmer-move 3s infinite linear;
                }
                .glass-premium {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
                .dark .glass-premium {
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
            `}</style>

            {/* ═══ Header / Toolbar ═══ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/20">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-400 blur-[100px] -mr-20 -mt-20 animate-pulse-slow" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500 blur-[80px] -ml-20 -mb-20 animate-pulse-slow" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-400/10 backdrop-blur-md border border-teal-400/20 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/10">
                            <Brain className="w-6 h-6 text-teal-300 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-teal-100 to-indigo-200">
                                    Gestor de Inteligencia Predictiva SST
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Activo · 8 Módulos
                                </span>
                            </div>
                            <p className="text-teal-100/75 text-xs max-w-2xl leading-relaxed font-medium">
                                Motor de análisis predictivo cruzado. Evalúa vulnerabilidades, reportes y métricas operacionales para emitir alertas e informes preventivos automatizados.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-6 pt-5 border-t border-white/10 w-full">
                    <SGSSTToolbar
                        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                        isHistoryOpen={isHistoryOpen}
                        aiButtons={[
                            {
                                id: 'generate-predictive',
                                onClick: handleGenerate,
                                disabled: isGenerating,
                                title: "Generar Pronóstico IA",
                                label: "Generar Pronóstico IA",
                                icon: "sparkles",
                                variant: "ai",
                                isLoading: isGenerating
                            }
                        ]}
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        onSave={handleSaveReport}
                        hasContent={!!(editorContent || generatedReport)}
                        exportContent={editorContent || generatedReport || ''}
                        exportFileName={`Pronostico_Predictivo_IA_${new Date().toISOString().split('T')[0]}`}
                        customSections={[
                            <button
                                key="btn-refresh"
                                onClick={fetchForecast}
                                disabled={isLoadingForecast}
                                className="group flex items-center justify-center h-10 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all duration-300 shadow-lg shrink-0 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed outline-none hover:-rotate-2 hover:scale-105"
                            >
                                <RefreshCw className={cn("h-4 w-4 text-teal-300", isLoadingForecast && "animate-spin")} />
                                <span className="ml-2 font-bold tracking-wide uppercase">Actualizar</span>
                            </button>
                        ]}
                    />
                </div>
            </div>

            {/* ═══ Report History ═══ */}
            {isHistoryOpen && (
                <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-predictivo-ia']} />
                </div>
            )}

            {/* ═══ Main Dashboard Grid ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Hero Card (Quantum Reactive Glow) ── */}
                <div className="lg:col-span-1 relative overflow-hidden rounded-3xl p-8 flex flex-col justify-between min-h-[300px] border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-3xl"
                    style={{ background: heroStyles.bg, boxShadow: `0 20px 40px -15px ${heroStyles.glow}` }}>
                    
                    {/* Glowing moving ambient orbs */}
                    <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 blur-2xl animate-pulse-slow pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl animate-pulse-slow pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <Zap className="h-4.5 w-4.5 text-teal-200 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-200">Probabilidad de Siniestro</span>
                        </div>
                        <div className={cn("text-7xl sm:text-8xl font-black text-white mb-4 tracking-tighter leading-none transition-all duration-500", heroStyles.textGlow)}>
                            {isLoadingForecast
                                ? <div className="h-20 w-36 bg-white/15 rounded-2xl animate-pulse" />
                                : `${overallRisk}%`
                            }
                        </div>
                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/10"
                            style={{ backgroundColor: riskBadgeBg, color: riskBadgeColor }}>
                            {riskLabel}
                        </span>
                    </div>

                    {forecast?.criticalArea && (
                        <div className="mt-6 pt-5 border-t border-white/15">
                            <span className="block text-[9px] text-teal-200/80 font-black uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" /> Área Crítica Detectada
                            </span>
                            <span className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                                {forecast.criticalArea.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Right: 3 Premium Medidores ── */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <RingGauge
                        value={forecast?.indicators?.safetyRisk || 0}
                        label="Seguridad Física"
                        color="#f97316"
                        bgColor="#fff7ed"
                        icon={AlertTriangle}
                        description={forecast?.evidence?.safetyEvidence || "Condiciones y actos inseguros no controlados"}
                        gradientId="grad-safety"
                        gradColors={{ from: "#f97316", to: "#f43f5e" }}
                    />
                    <RingGauge
                        value={forecast?.indicators?.healthRisk || 0}
                        label="Vigilancia Salud"
                        color="#ef4444"
                        bgColor="#fef2f2"
                        icon={HeartPulse}
                        description={forecast?.evidence?.healthEvidence || "Hallazgos médicos y patologías de origen laboral"}
                        gradientId="grad-health"
                        gradColors={{ from: "#ef4444", to: "#991b1b" }}
                    />
                    <RingGauge
                        value={forecast?.indicators?.ergonomicRisk || 0}
                        label="Ergonomía"
                        color="#8b5cf6"
                        bgColor="#f5f3ff"
                        icon={ShieldCheck}
                        description={forecast?.evidence?.ergonomicEvidence || "Riesgos biomecánicos y posturales (OWAS)"}
                        gradientId="grad-ergonomic"
                        gradColors={{ from: "#8b5cf6", to: "#6366f1" }}
                    />
                </div>
            </div>

            {/* ═══ Bar Chart + Predicted Insight ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Bar Chart (Radar Panel) */}
                <div className="p-6 rounded-3xl border border-border-medium/60 glass-premium shadow-xl transition-all duration-300">
                    <h3 className="text-xs font-black text-text-primary mb-6 flex items-center gap-2 tracking-[0.12em] uppercase">
                        <Activity className="h-4 w-4 text-teal-500" />
                        RADAR DE FACTORES DE RIESGO
                    </h3>
                    {isLoadingForecast ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex flex-wrap items-center gap-3 w-full animate-pulse">
                                    <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4.5">
                            {barData.map((bar, i) => (
                                <RiskBar key={bar.label} {...bar} delay={i * 150} />
                            ))}
                        </div>
                    )}

                    {/* Data Sources */}
                    <div className="mt-6 pt-5 border-t border-border-medium/60">
                        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 block mb-3.5 uppercase tracking-[0.15em]">Fuentes Integradas Activas</span>
                        <div className="grid grid-cols-2 gap-2">
                            {['Perfil Sociodemográfico', 'Estadísticas ATEL', 'Investigaciones ATEL', 'Actos/Condiciones', 'Método OWAS', 'ATS', 'Vulnerabilidad', 'Matriz GTC 45'].map(src => (
                                <div key={src} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-primary border border-border-light hover:border-teal-500/30 hover:bg-teal-500/5 transition-all duration-300 group cursor-default">
                                    <div className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_6px_#14b8a6] shrink-0 group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">{src}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Correlation Panel or Upgrade Wall */}
                <div className="flex flex-col gap-6">
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
                            <div className="p-6 rounded-3xl border border-border-medium/60 glass-premium shadow-xl flex-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-teal-500/10 blur-2xl pointer-events-none group-hover:bg-teal-500/20 transition-all duration-500" />
                                <h3 className="text-xs font-black text-text-primary mb-5 flex items-center gap-2 tracking-[0.12em] uppercase">
                                    <AnimatedIcon name="sparkles" size={16} className="text-teal-500 animate-pulse" />
                                    ANÁLISIS DE CORRELACIÓN PREDICTIVA IA
                                </h3>
                                <div className="relative p-5 bg-surface-primary/80 backdrop-blur-sm rounded-2xl border border-border-medium shadow-inner">
                                    <span className="absolute -top-3 left-4 text-3xl font-serif text-teal-400/50 leading-none">“</span>
                                    <p className="text-xs text-text-primary leading-relaxed font-semibold italic pl-4 pr-2">
                                        {forecast?.predictionSummary || "Haga clic en 'Actualizar' para generar el análisis predictivo cruzado de todos los módulos..."}
                                    </p>
                                    <span className="absolute -bottom-7 right-4 text-3xl font-serif text-teal-400/50 leading-none">”</span>
                                </div>
                            </div>

                            {/* Recommended Actions */}
                            <div className="p-6 rounded-3xl border border-border-medium/60 glass-premium shadow-xl hover:shadow-2xl transition-all duration-300">
                                <h3 className="text-xs font-black text-text-primary mb-5 flex items-center gap-2 tracking-[0.12em] uppercase">
                                    <AnimatedIcon name="database" size={16} className="text-teal-500" />
                                    ACCIONES PREVENTIVAS PRIORITARIAS
                                </h3>
                                <div className="space-y-3.5">
                                    {forecast?.recommendedActions?.length ? forecast.recommendedActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-4.5 p-4.5 bg-surface-primary/60 hover:bg-surface-primary hover:border-teal-500/40 hover:shadow-md transition-all duration-300 rounded-2xl border border-border-light/80 group">
                                            <div className="mt-0.5 h-7 w-7 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform"
                                                style={{ background: 'linear-gradient(135deg, #0d9488, #10b981)' }}>
                                                {i + 1}
                                            </div>
                                            <span className="text-xs text-text-primary font-semibold leading-relaxed">{action}</span>
                                        </div>
                                    )) : [1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-4 p-4.5 bg-surface-primary/60 rounded-2xl border border-border-light">
                                            <div className="h-7 w-7 rounded-2xl bg-gray-200 dark:bg-slate-700 animate-pulse shrink-0" />
                                            <div className="flex-1 h-4 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
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
                <div className="rounded-3xl border border-border-medium/60 bg-surface-primary overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 relative group/report">
                    <div 
                        className="border-b border-border-medium/60 bg-gradient-to-r from-teal-500/5 to-transparent dark:from-teal-500/10 px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-teal-500/10 transition-colors duration-300"
                        onClick={() => setIsReportCollapsed(!isReportCollapsed)}
                    >
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm border border-teal-500/20 shrink-0">
                                <LineChart className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-text-primary tracking-wide text-sm">Informe Predictivo Detallado</h3>
                                <p className="text-[9px] text-text-secondary uppercase tracking-[0.15em] mt-0.5">Generado por WAPPY AI Engine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleSaveReport()}
                                className="group flex flex-shrink-0 items-center justify-center h-10 px-3 bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 shadow-lg shadow-teal-600/20 shrink-0 cursor-pointer disabled:opacity-50 border border-teal-500/20 outline-none rounded-xl hover:-rotate-2 hover:scale-105">
                                <AnimatedIcon name="save" size={16} />
                                <span className="ml-2 font-bold tracking-wide uppercase text-xs">Guardar</span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Pronostico_Predictivo_IA_${new Date().toISOString().split('T')[0]}`}
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsReportCollapsed(!isReportCollapsed); }}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-text-secondary"
                            >
                                {isReportCollapsed ? <ChevronDown /> : <ChevronUp />}
                            </button>
                        </div>
                    </div>
                    {!isReportCollapsed && (
                        <div className="rounded-2xl p-2.5 overflow-hidden bg-white dark:bg-[#1a1a1a]">
                            <LiveEditor
                                initialContent={generatedReport}
                                onUpdate={setEditorContent}
                                onSave={handleSaveReport}
                                reportSourceData={forecast}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPredictivo;
