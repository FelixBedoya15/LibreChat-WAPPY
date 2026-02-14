```javascript
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Filter,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MinusCircle,
    ChevronDown,
    ChevronRight,
    FileText,
    Download,
    Sparkles,
    History,
    Save,
    Loader2,
    HelpCircle,
    Users,
    AlertTriangle,
    Building2,
} from 'lucide-react';
import { Button, useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { AUDITORIA_ITEMS, AuditoriaItem } from './auditoriaData';
import {
    CompanySize,
    RiskLevel,
    getApplicableArticle,
    getComplianceLevel,
} from './checklistData';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { useAuthContext } from '~/hooks';
import ModelSelector from './ModelSelector';

interface AuditoriaChecklistProps {
    onAnalysisComplete?: (report: string) => void;
}

interface ComplianceStatus {
    itemId: string;
    status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
}

const COMPANY_SIZE_OPTIONS = [
    { value: CompanySize.SMALL, label: '≤10 trabajadores', icon: Users },
    { value: CompanySize.MEDIUM, label: '11-50 trabajadores', icon: Users },
    { value: CompanySize.LARGE, label: '>50 trabajadores', icon: Building2 },
];

const RISK_LEVEL_OPTIONS = [
    { value: RiskLevel.I, label: 'Riesgo I' },
    { value: RiskLevel.II, label: 'Riesgo II' },
    { value: RiskLevel.III, label: 'Riesgo III' },
    { value: RiskLevel.IV, label: 'Riesgo IV' },
    { value: RiskLevel.V, label: 'Riesgo V' },
];

const STATUS_OPTIONS = [
    { value: 'cumple' as const, label: 'Conforme', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
    { value: 'no_cumple' as const, label: 'No Conforme', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { value: 'parcial' as const, label: 'Obs. Mejora', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
    { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10' },
];

const AuditoriaChecklist: React.FC<AuditoriaChecklistProps> = ({ onAnalysisComplete }) => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Filters state
    const [companySize, setCompanySize] = useState<CompanySize>(CompanySize.SMALL);
    const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.I);

    // Checklist state
    const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(['planear', 'hacer', 'verificar', 'actuar'].reduce((acc, cat) => acc.add(cat), new Set()));

    // Observations state
    const [observations, setObservations] = useState<Record<string, string>>({});

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // History & save state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const checklist = useMemo(() => AUDITORIA_ITEMS, []);

    const applicableArticle = useMemo(() => {
        return getApplicableArticle(companySize, riskLevel);
    }, [companySize, riskLevel]);

    // Calculate scores
    const totalPoints = useMemo(() => checklist.reduce((sum, item) => sum + (item.points || 0), 0), [checklist]);

    const currentScore = useMemo(() => {
        let score = 0;
        for (const item of checklist) {
            const status = statuses.find(s => s.itemId === item.id);
            if (status) {
                switch (status.status) {
                    case 'cumple':
                    case 'no_aplica': // No Aplica counts as full points per user request
                        score += (item.points || 0);
                        break;
                    case 'parcial':
                        score += (item.points || 0) * 0.5;
                        break;
                    // 'no_cumple', 'pendiente' = 0
                }
            }
        }
        return score;
    }, [checklist, statuses]);

    const complianceLevel = useMemo(() => getComplianceLevel(currentScore, totalPoints), [currentScore, totalPoints]);

    // Progress
    const completedCount = useMemo(() => {
        return statuses.filter(s => s.status !== 'pendiente').length;
    }, [statuses]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, AuditoriaItem[]> = {
            planear: [],
            hacer: [],
            verificar: [],
            actuar: [],
        };
        checklist.forEach(item => {
            if (groups[item.category]) {
                groups[item.category].push(item);
            }
        });
        return groups;
    }, [checklist]);

    const handleStatusChange = useCallback((itemId: string, status: ComplianceStatus['status']) => {
        setStatuses(prev => {
            const existing = prev.find(s => s.itemId === itemId);
            if (existing) {
                return prev.map(s => s.itemId === itemId ? { ...s, status } : s);
            }
            return [...prev, { itemId, status }];
        });
    }, []);

    const toggleItemExpanded = useCallback((itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    }, []);

    const toggleCategoryExpanded = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    const getItemStatus = useCallback((itemId: string): ComplianceStatus['status'] => {
        return statuses.find(s => s.itemId === itemId)?.status || 'pendiente';
    }, [statuses]);

    const handleAnalyze = useCallback(async () => {
        if (completedCount === 0) {
            showToast({ message: t('com_ui_complete_one_item', 'Complete al menos un ítem antes de analizar'), status: 'warning' });
            return;
        }

        setIsAnalyzing(true);

        try {
            const analysisData = {
                type: 'auditoria',
                checklist: checklist.map(item => ({
                    ...item,
                    status: getItemStatus(item.id),
                })),
                score: currentScore,
                totalPoints,
                percentage: (currentScore / totalPoints) * 100,
                riskLevel,
                companySize,
                observations,
                modelName: selectedModel,
                complianceLevel,
                userName: user?.name || user?.username || 'Usuario',
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            };

            const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, {
                headers: { 'Authorization': `Bearer ${ token } ` }
            });

            const result = response.data;
            setAnalysisReport(result.report);
            setEditorContent(result.report);
            setConversationId('new');
            setReportMessageId(null);
            onAnalysisComplete?.(result.report);
            showToast({ message: t('com_ui_analysis_success', 'Informe generado exitosamente'), status: 'success' });
        } catch (error: any) {
            console.error('Audit Analysis error:', error);
            const errorMsg = error.response?.data?.error || error.message || t('com_ui_analysis_error', 'Error al generar el informe');
            showToast({ message: `Error: ${ errorMsg } `, status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [checklist, currentScore, totalPoints, riskLevel, companySize, observations, selectedModel, complianceLevel, user, token, getItemStatus, completedCount, onAnalysisComplete, showToast, t]);

    const handleExportWord = useCallback(async () => {
        const contentForExport = editorContent || analysisReport;
        if (!contentForExport) {
            showToast({ message: t('com_ui_generate_analysis_first', 'Primero genere el informe'), status: 'warning' });
            return;
        }
        
        // Use generic word export or specific one if needed
        const { exportToWord } = await import('~/utils/wordExport');
        // Simple HTML strip
         let body = contentForExport.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, (tag) => tag.startsWith('<h') || tag.startsWith('<p') || tag.startsWith('<li') ? '\n' + tag : tag)
            .replace(/<[^>]+>/g, '');

        await exportToWord(body, {
            documentTitle: 'Informe Auditoría SST',
             fontFamily: 'Arial',
            fontSize: 11,
            margins: 1,
            coverTitle: 'Informe de Auditoría Interna\nSistema de Gestión de Seguridad y Salud en el Trabajo',
            messageTitle: 'Auditoría de cumplimiento Decreto 1072',
             showPagination: true,
        });
         showToast({ message: 'Informe exportado a Word', status: 'success' });
    }, [editorContent, analysisReport, showToast, t]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || analysisReport;
        if (!contentToSave) return;

         try {
             const body = {
                content: contentToSave,
                title: `Auditoría SST - ${ new Date().toLocaleDateString('es-CO') } `,
                tags: ['sgsst-auditoria'],
                ...(conversationId !== 'new' ? { conversationId, messageId: reportMessageId } : {})
            };
             const method = conversationId !== 'new' ? 'PUT' : 'POST';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ token } ` },
                 body: JSON.stringify(body),
            });

             if (res.ok) {
                 const data = await res.json();
                 if (method === 'POST') {
                    setConversationId(data.conversationId);
                     setReportMessageId(data.messageId);
                 }
                 setRefreshTrigger(prev => prev + 1);
                 showToast({ message: t('com_ui_diagnostic_saved', 'Auditoría guardada exitosamente'), status: 'success' });
            } else {
                 showToast({ message: t('com_ui_save_error', 'Error al guardar'), status: 'error' });
            }
         } catch (e) {
             showToast({ message: t('com_ui_save_network_error', 'Error de red'), status: 'error' });
         }
    }, [editorContent, analysisReport, conversationId, reportMessageId, token, showToast, t]);

    // Load report from history
    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        try {
            const res = await fetch(`/ api / messages / ${ selectedConvoId } `, {
                headers: { 'Authorization': `Bearer ${ token } ` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setAnalysisReport(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsHistoryOpen(false);
                showToast({ message: t('com_ui_audit_loaded', 'Auditoría cargada'), status: 'success' });
            }
        } catch (e) {
            console.error('Load error:', e);
            showToast({ message: t('com_ui_load_error', 'Error al cargar auditoría'), status: 'error' });
        }
    }, [token, showToast, t]);

    const getCategoryTitle = (category: string) => {
        const titles: Record<string, string> = {
            planear: 'I. PLANIFICACIÓN (Planear)',
            hacer: 'II. IMPLEMENTACIÓN (Hacer)',
            verificar: 'III. VERIFICACIÓN (Verificar)',
            actuar: 'IV. MEJORA (Actuar)',
        };
        return titles[category] || category;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            planear: 'border-blue-500 text-blue-600',
            hacer: 'border-yellow-500 text-yellow-600',
            verificar: 'border-red-500 text-red-600',
            actuar: 'border-green-500 text-green-600',
        };
        return colors[category] || '';
    };


    return (
        <div className="flex flex-col gap-6">
             {/* Filters Section */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary p-4">
                <div className="mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-text-secondary" />
                    <h3 className="font-semibold text-text-primary">{t('com_ui_eval_filters', 'Filtros de Evaluación')}</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">
                            {t('com_ui_worker_count', 'Número de Trabajadores')}
                        </label>
                        <select
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                            className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-text-primary focus:border-blue-500 focus:outline-none"
                        >
                            {COMPANY_SIZE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">
                            {t('com_ui_risk_level', 'Nivel de Riesgo')}
                        </label>
                        <select
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(Number(e.target.value) as RiskLevel)}
                            className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-text-primary focus:border-blue-500 focus:outline-none"
                        >
                            {RISK_LEVEL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-700 dark:text-blue-300">
                         {t('com_ui_applies_article', 'Aplica')} <strong>{t('com_ui_article', 'Artículo')} {applicableArticle}</strong> {t('com_ui_resolution_0312', 'de la Resolución 0312/2019')}
                        ({checklist.length} {t('com_ui_standards', 'estándares')})
                    </span>
                </div>
            </div>

            {/* Progress Card */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-sm text-text-secondary">{t('com_ui_progress', 'Progreso')}</p>
                            <p className="text-2xl font-bold text-text-primary">
                                {completedCount}/{checklist.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">{t('com_ui_score', 'Puntuación')}</p>
                            <p className="text-2xl font-bold text-text-primary">
                                {currentScore.toFixed(1)}/{Math.round(totalPoints)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">{t('com_ui_level', 'Nivel')}</p>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                                complianceLevel.level === 'crítico' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                complianceLevel.level === 'moderado' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                complianceLevel.level === 'aceptable' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            )}>
                                {complianceLevel.level.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Model Selector */}
                        <ModelSelector
                            selectedModel={selectedModel}
                            onSelectModel={setSelectedModel}
                            disabled={isAnalyzing}
                        />

                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className={`group flex items - center px - 3 py - 2 border border - border - medium rounded - full transition - all duration - 300 shadow - sm font - medium text - sm ${ isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-surface-primary text-text-primary hover:bg-surface-hover' } `}
                        >
                            <History className="h-5 w-5" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                {t('com_ui_history', 'Historial')}
                            </span>
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || completedCount === 0}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5" />
                            )}
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                {t('com_ui_gen_analysis', 'Generar Informe')}
                            </span>
                        </button>
                        {analysisReport && (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                                >
                                    <Save className="h-5 w-5" />
                                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                        {t('com_ui_save', 'Guardar')}
                                    </span>
                                </button>
                                <button
                                    onClick={handleExportWord}
                                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                                >
                                    <Download className="h-5 w-5" />
                                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                        {t('com_ui_export_word', 'Exportar')}
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                        className={cn(
                            'h-full transition-all duration-300',
                            complianceLevel.level === 'crítico' && 'bg-red-500',
                            complianceLevel.level === 'moderado' && 'bg-yellow-500',
                            complianceLevel.level === 'aceptable' && 'bg-green-500',
                        )}
                        style={{ width: `${ (currentScore / totalPoints) * 100 }% ` }}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {['planear', 'hacer', 'verificar', 'actuar'].map((category) => {
                    const items = groupedItems[category];
                    if (!items || items.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);
                    const categoryCompleted = items.filter(item => getItemStatus(item.id) !== 'pendiente').length;

                    return (
                        <div key={category} className="rounded-xl border border-border-medium bg-surface-secondary">
                            <button
                                onClick={() => toggleCategoryExpanded(category)}
                                className={cn(
                                    'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-tertiary',
                                    'border-l-4',
                                    getCategoryColor(category),
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                                    <span className="font-bold">{getCategoryTitle(category)}</span>
                                    <span className="text-sm text-text-secondary">({categoryCompleted}/{items.length})</span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="divide-y divide-border-light">
                                    {items.map((item) => {
                                        const status = getItemStatus(item.id);
                                        const isItemExpanded = expandedItems.has(item.id);

                                        return (
                                            <div key={item.id} className="bg-surface-primary/50 p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-col gap-1.5">
                                                            <h4 className="font-medium text-text-primary text-base">
                                                                <span className="font-bold text-blue-600 mr-2">{item.code}</span>
                                                                {item.name}
                                                            </h4>
                                                            <div className="group relative w-fit">
                                                                <span className="inline-block font-mono text-[10px] uppercase tracking-wide font-bold text-text-tertiary bg-surface-tertiary px-2 py-1 rounded cursor-help border border-border-light hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                                                    {item.criteria}
                                                                </span>
                                                                {item.normativeText && (
                                                                    <div className="absolute top-full left-0 mt-2 w-96 p-4 rounded-lg shadow-xl bg-surface-secondary border border-border-medium text-xs text-text-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-pre-wrap text-left max-h-[300px] overflow-y-auto">
                                                                        <div className="font-semibold mb-1 text-blue-500">Fundamento Legal:</div>
                                                                        {item.normativeText}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                                                        {isItemExpanded && (
                                                            <div className="mt-2 text-xs text-text-tertiary bg-surface-tertiary p-2 rounded whitespace-pre-wrap">
                                                                {item.evaluation}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => toggleItemExpanded(item.id)}
                                                            className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                        >
                                                            <HelpCircle className="h-3 w-3" /> Ver criterio de evaluación
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-shrink-0 gap-1">
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => handleStatusChange(item.id, opt.value)}
                                                                className={cn(
                                                                    'rounded-lg p-2 transition-all',
                                                                    status === opt.value ? opt.color : 'text-text-tertiary hover:bg-surface-tertiary'
                                                                )}
                                                                title={opt.label}
                                                            >
                                                                <opt.icon className="h-5 w-5" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {(status === 'parcial' || status === 'no_cumple' || status === 'no_aplica') && (
                                                    <div className="mt-3">
                                                        <textarea
                                                            placeholder="Describa el hallazgo, evidencia o motivo de no aplicabilidad..."
                                                            value={observations[item.id] || ''}
                                                            onChange={(e) => setObservations(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-blue-500 focus:outline-none resize-none"
                                                            rows={2}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center mt-6 mb-4">
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || completedCount === 0}
                    className="group flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-md font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                    Generar Informe Auditoría
                </button>
            </div>

            {analysisReport && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <div className="flex items-center gap-2 p-4 border-b border-border-light">
                        <FileText className="h-5 w-5 text-text-secondary" />
                        <h3 className="font-semibold text-text-primary">Informe de Auditoría Generado</h3>
                    </div>
                    <div style={{ minHeight: '400px', overflowX: 'auto' }}>
                        <LiveEditor
                            initialContent={analysisReport}
                            onUpdate={(content) => setEditorContent(content)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}

            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-auditoria']}
            />
        </div>
    );
};

export default AuditoriaChecklist;
