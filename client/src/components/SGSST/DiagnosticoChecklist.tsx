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
import {
    CompanySize,
    RiskLevel,
    ComplianceStatus,
    ChecklistItem,
    getApplicableChecklist,
    getApplicableArticle,
    calculateScore,
    getTotalPoints,
    getComplianceLevel,
} from './checklistData';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { useAuthContext } from '~/hooks';

interface DiagnosticoChecklistProps {
    onAnalysisComplete?: (report: string) => void;
}

const COMPANY_SIZE_OPTIONS = [
    { value: CompanySize.SMALL, label: '≤10 trabajadores', icon: Users },
    { value: CompanySize.MEDIUM, label: '11-50 trabajadores', icon: Users },
    { value: CompanySize.LARGE, label: '>50 trabajadores', icon: Building2 },
];

const RISK_LEVEL_OPTIONS = [
    { value: RiskLevel.I, label: 'Riesgo I', color: 'text-green-500' },
    { value: RiskLevel.II, label: 'Riesgo II', color: 'text-lime-500' },
    { value: RiskLevel.III, label: 'Riesgo III', color: 'text-yellow-500' },
    { value: RiskLevel.IV, label: 'Riesgo IV', color: 'text-orange-500' },
    { value: RiskLevel.V, label: 'Riesgo V', color: 'text-red-500' },
];

const STATUS_OPTIONS = [
    { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
    { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { value: 'parcial' as const, label: 'Parcial', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
    { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10' },
];

const DiagnosticoChecklist: React.FC<DiagnosticoChecklistProps> = ({ onAnalysisComplete }) => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Filters
    const [companySize, setCompanySize] = useState<CompanySize>(CompanySize.MEDIUM);
    const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.III);

    // Checklist state
    const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['planear', 'hacer', 'verificar', 'actuar']));

    // Observations state
    const [observations, setObservations] = useState<Record<string, string>>({});

    // Analysis state  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    // History & save state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get applicable checklist
    const checklist = useMemo(() => {
        return getApplicableChecklist(companySize, riskLevel);
    }, [companySize, riskLevel]);

    const applicableArticle = useMemo(() => {
        return getApplicableArticle(companySize, riskLevel);
    }, [companySize, riskLevel]);

    // Calculate scores
    const totalPoints = useMemo(() => getTotalPoints(checklist), [checklist]);
    const currentScore = useMemo(() => calculateScore(checklist, statuses), [checklist, statuses]);
    const complianceLevel = useMemo(() => getComplianceLevel(currentScore, totalPoints), [currentScore, totalPoints]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {
            planear: [],
            hacer: [],
            verificar: [],
            actuar: [],
        };
        checklist.forEach(item => {
            groups[item.category].push(item);
        });
        return groups;
    }, [checklist]);

    // Progress calculation
    const completedCount = useMemo(() => {
        return statuses.filter(s => s.status !== 'pendiente').length;
    }, [statuses]);

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
            // Prepare data for analysis
            const analysisData = {
                companySize,
                riskLevel,
                applicableArticle,
                checklist: checklist.map(item => ({
                    ...item,
                    status: getItemStatus(item.id),
                })),
                score: currentScore,
                totalPoints,
                complianceLevel,
                userName: user?.name || user?.username || 'Usuario',
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                observations,
            };

            // Call analysis API
            console.log('[DiagnosticoChecklist] Sending analysis data:', analysisData);

            const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = response.data;
            setAnalysisReport(result.report);
            setEditorContent(result.report);
            setConversationId('new');
            setReportMessageId(null);
            onAnalysisComplete?.(result.report);
            showToast({ message: t('com_ui_analysis_success', 'Análisis generado exitosamente'), status: 'success' });
        } catch (error: any) {
            console.error('Analysis error:', error);
            const errorMsg = error.response?.data?.error || error.message || t('com_ui_analysis_error', 'Error al generar el análisis');
            showToast({ message: `Error: ${errorMsg}`, status: 'error', duration: 5000 });
        } finally {
            setIsAnalyzing(false);
        }
    }, [completedCount, companySize, riskLevel, applicableArticle, checklist, currentScore, totalPoints, complianceLevel, getItemStatus, onAnalysisComplete, showToast, user, observations, token]);

    const handleExportWord = useCallback(async () => {
        const contentForExport = editorContent || analysisReport;
        if (!contentForExport) {
            showToast({ message: t('com_ui_generate_analysis_first', 'Primero genere el análisis'), status: 'warning' });
            return;
        }

        // Convert HTML to plain text/markdown for Word export
        const htmlToMarkdown = (html: string): string => {
            // Extract body content if full HTML doc
            let body = html;
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) body = bodyMatch[1];

            // Strip style/script tags entirely
            body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

            // Convert headings
            body = body.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
            body = body.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
            body = body.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
            body = body.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');

            // Convert tables to markdown
            body = body.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
                const rows: string[] = [];
                const rowMatches = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rowMatches.forEach((row: string, idx: number) => {
                    const cells = (row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || []).map((cell: string) =>
                        cell.replace(/<t[hd][^>]*>/i, '').replace(/<\/t[hd]>/i, '').replace(/<[^>]+>/g, '').trim()
                    );
                    rows.push('| ' + cells.join(' | ') + ' |');
                    if (idx === 0) {
                        rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
                    }
                });
                return rows.join('\n') + '\n';
            });

            // Convert lists
            body = body.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
            body = body.replace(/<\/?[uo]l[^>]*>/gi, '\n');

            // Convert formatting
            body = body.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            body = body.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            body = body.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
            body = body.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

            // Convert paragraphs and line breaks
            body = body.replace(/<br\s*\/?>/gi, '\n');
            body = body.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
            body = body.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');

            // Strip remaining HTML tags
            body = body.replace(/<[^>]+>/g, '');

            // Decode HTML entities
            body = body.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');

            // Clean up whitespace
            body = body.replace(/\n{3,}/g, '\n\n').trim();

            return body;
        };

        const markdownContent = htmlToMarkdown(contentForExport);

        // Dynamic import of word export
        const { exportToWord } = await import('~/utils/wordExport');

        await exportToWord(markdownContent, {
            documentTitle: 'Informe Diagnóstico SG-SST',
            fontFamily: 'Arial',
            fontSize: 11,
            margins: 1,
            logoUrl: '',
            showPagination: true,
            coverTitle: 'Informe de Diagnóstico Inicial\nSistema de Gestión de Seguridad y Salud en el Trabajo',
            messageTitle: 'Evaluación según Resolución 0312 de 2019',
        });

        showToast({ message: t('com_ui_export_word_success', 'Informe exportado a Word'), status: 'success' });
    }, [editorContent, analysisReport, showToast]);

    // Save report using dedicated backend endpoint
    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || analysisReport;
        if (!contentToSave) {
            showToast({ message: t('com_ui_no_report_save', 'No hay informe para guardar'), status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: t('com_ui_error_unauthorized', 'Error: No autorizado'), status: 'error' });
            return;
        }

        try {
            // Update existing report
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                console.log('[SGSST Save] Updating existing:', conversationId, reportMessageId);
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId,
                        messageId: reportMessageId,
                        content: contentToSave,
                    }),
                });

                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: t('com_ui_diagnostic_updated', 'Diagnóstico actualizado exitosamente'), status: 'success' });
                } else {
                    const err = await res.json();
                    showToast({ message: `${t('com_ui_update_error', 'Error al actualizar')}: ${err.error || res.status}`, status: 'error' });
                }
                return;
            }

            // Create new report
            console.log('[SGSST Save] Creating new report');
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: t('com_ui_diagnostic_saved', 'Diagnóstico guardado exitosamente'), status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `${t('com_ui_save_error', 'Error al guardar')}: ${err.error || res.status}`, status: 'error' });
            }
        } catch (e) {
            console.error('[SGSST Save] Error:', e);
            showToast({ message: t('com_ui_save_network_error', 'Error de red al guardar el diagnóstico'), status: 'error' });
        }
    }, [editorContent, analysisReport, token, conversationId, reportMessageId, showToast]);

    // Load report from history
    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();

            // Find the last message with content
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setAnalysisReport(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsHistoryOpen(false);
                showToast({ message: t('com_ui_diagnostic_loaded', 'Diagnóstico cargado'), status: 'success' });
            }
        } catch (e) {
            console.error('Load error:', e);
            showToast({ message: t('com_ui_load_error', 'Error al cargar el diagnóstico'), status: 'error' });
        }
    }, [token, showToast]);

    const getCategoryTitle = (category: string): string => {
        const titles: Record<string, string> = {
            planear: 'I. PLANEAR',
            hacer: 'II. HACER',
            verificar: 'III. VERIFICAR',
            actuar: 'IV. ACTUAR',
        };
        return titles[category] || category;
    };

    const getCategoryColor = (category: string): string => {
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
                            className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
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
                                {t('com_ui_gen_analysis', 'Generar Análisis IA')}
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
                                        {t('com_ui_export_word', 'Exportar Word')}
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
                        style={{ width: `${(currentScore / totalPoints) * 100}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items by Category */}
            <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => {
                    if (items.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);
                    const categoryCompleted = items.filter(item => {
                        const status = getItemStatus(item.id);
                        return status !== 'pendiente';
                    }).length;

                    return (
                        <div key={category} className="overflow-hidden rounded-xl border border-border-medium bg-surface-secondary">
                            <button
                                onClick={() => toggleCategoryExpanded(category)}
                                className={cn(
                                    'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-tertiary',
                                    'border-l-4',
                                    getCategoryColor(category),
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-text-secondary" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-text-secondary" />
                                    )}
                                    <span className="font-bold">{getCategoryTitle(category)}</span>
                                    <span className="text-sm text-text-secondary">
                                        ({categoryCompleted}/{items.length} {t('com_ui_evaluated', 'evaluados')})
                                    </span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="divide-y divide-border-light">
                                    {items.map((item) => {
                                        const status = getItemStatus(item.id);
                                        const isItemExpanded = expandedItems.has(item.id);

                                        return (
                                            <div key={item.id} className="bg-surface-primary/50">
                                                <div className="flex items-start gap-4 p-4">
                                                    <button
                                                        onClick={() => toggleItemExpanded(item.id)}
                                                        className="mt-1 flex-shrink-0 text-text-secondary hover:text-text-primary"
                                                    >
                                                        <HelpCircle className="h-4 w-4" />
                                                    </button>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="font-medium text-text-primary">
                                                                    <span className="mr-2 text-text-secondary">{item.code}</span>
                                                                    {item.name}
                                                                </p>
                                                                <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                                                                <p className="mt-1 text-xs text-text-tertiary">
                                                                    {t('com_ui_points', 'Puntaje')}: {item.points} pts | {item.subcategory}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-shrink-0 gap-1">
                                                                {STATUS_OPTIONS.map(opt => {
                                                                    const Icon = opt.icon;
                                                                    const isSelected = status === opt.value;

                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => handleStatusChange(item.id, opt.value)}
                                                                            className={cn(
                                                                                'rounded-lg p-2 transition-all',
                                                                                isSelected ? opt.color : 'text-text-tertiary hover:bg-surface-tertiary',
                                                                            )}
                                                                            title={opt.label}
                                                                        >
                                                                            <Icon className="h-5 w-5" />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {isItemExpanded && (
                                                            <div className="mt-3 rounded-lg border border-border-light bg-surface-secondary p-3">
                                                                <p className="mb-2 text-sm font-medium text-text-primary">
                                                                    {t('com_ui_how_eval', '¿Cómo se evalúa?')}
                                                                </p>
                                                                <p className="text-sm text-text-secondary">{item.evaluation}</p>
                                                            </div>
                                                        )}

                                                        {/* Observations field for parcial/no_aplica */}
                                                        {(status === 'parcial' || status === 'no_aplica') && (
                                                            <div className="mt-2">
                                                                <textarea
                                                                    placeholder={t('com_ui_add_obs', 'Agregar observación...')}
                                                                    value={observations[item.id] || ''}
                                                                    onChange={(e) => setObservations(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-yellow-500 focus:outline-none resize-none"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Analysis Report - Editable */}
            {analysisReport && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-light">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-text-secondary" />
                            <h3 className="font-semibold text-text-primary">{t('com_ui_manager_report', 'Informe Gerencial')}</h3>
                        </div>
                    </div>
                    <div style={{ minHeight: '400px', overflowX: 'auto' }}>
                        <LiveEditor
                            initialContent={analysisReport}
                            onUpdate={(content) => setEditorContent(content)}
                            onSave={handleSave}
                        />
                    </div>
                    <style>{`
                        [contenteditable] table {
                            width: 100%;
                            max-width: 100%;
                            border-collapse: collapse;
                            table-layout: auto;
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                        }
                        [contenteditable] table td,
                        [contenteditable] table th {
                            padding: 8px 12px;
                            border: 1px solid var(--border-medium, #ddd);
                        }
                    `}</style>
                </div>
            )}

            {/* Report History Panel */}
            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-diagnostico']}
            />
        </div>
    );
};

export default DiagnosticoChecklist;
