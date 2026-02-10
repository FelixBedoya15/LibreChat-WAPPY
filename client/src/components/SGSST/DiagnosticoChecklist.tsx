import React, { useState, useCallback, useMemo } from 'react';
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
    const { showToast } = useToastContext();

    // Filters
    const [companySize, setCompanySize] = useState<CompanySize>(CompanySize.MEDIUM);
    const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.III);

    // Checklist state
    const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['planear', 'hacer', 'verificar', 'actuar']));

    // Analysis state  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);

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
            showToast({ message: 'Complete al menos un ítem antes de analizar', status: 'warning' });
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
            };

            // Call analysis API
            const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData);

            const result = response.data;
            setAnalysisReport(result.report);
            onAnalysisComplete?.(result.report);
            showToast({ message: 'Análisis generado exitosamente', status: 'success' });
        } catch (error) {
            console.error('Analysis error:', error);
            showToast({ message: 'Error al generar el análisis', status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [completedCount, companySize, riskLevel, applicableArticle, checklist, currentScore, totalPoints, complianceLevel, getItemStatus, onAnalysisComplete, showToast]);

    const handleExportWord = useCallback(async () => {
        if (!analysisReport) {
            showToast({ message: 'Primero genere el análisis', status: 'warning' });
            return;
        }

        // Dynamic import of word export
        const { exportToWord } = await import('~/utils/wordExport');

        await exportToWord(analysisReport, {
            documentTitle: 'Informe Diagnóstico SG-SST',
            fontFamily: 'Arial',
            fontSize: 11,
            margins: 1,
            logoUrl: '',
            showPagination: true,
            coverTitle: 'Informe de Diagnóstico Inicial\nSistema de Gestión de Seguridad y Salud en el Trabajo',
            messageTitle: 'Evaluación según Resolución 0312 de 2019',
        });

        showToast({ message: 'Informe exportado a Word', status: 'success' });
    }, [analysisReport, showToast]);

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
                    <h3 className="font-semibold text-text-primary">Filtros de Evaluación</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">
                            Número de Trabajadores
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
                            Nivel de Riesgo
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
                        Aplica <strong>Artículo {applicableArticle}</strong> de la Resolución 0312/2019
                        ({checklist.length} estándares)
                    </span>
                </div>
            </div>

            {/* Progress Card */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-sm text-text-secondary">Progreso</p>
                            <p className="text-2xl font-bold text-text-primary">
                                {completedCount}/{checklist.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Puntuación</p>
                            <p className="text-2xl font-bold text-text-primary">
                                {currentScore.toFixed(1)}/{Math.round(totalPoints)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Nivel</p>
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

                    <div className="flex gap-2">
                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || completedCount === 0}
                            className="gap-2"
                        >
                            {isAnalyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Generar Análisis IA
                        </Button>
                        {analysisReport && (
                            <Button onClick={handleExportWord} variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Exportar Word
                            </Button>
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
                                        ({categoryCompleted}/{items.length} evaluados)
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
                                                                    Puntaje: {item.points} pts | {item.subcategory}
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
                                                                    ¿Cómo se evalúa?
                                                                </p>
                                                                <p className="text-sm text-text-secondary">{item.evaluation}</p>
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

            {/* Analysis Report */}
            {analysisReport && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-text-secondary" />
                        <h3 className="font-semibold text-text-primary">Informe Gerencial</h3>
                    </div>
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: analysisReport }}
                    />
                </div>
            )}
        </div>
    );
};

export default DiagnosticoChecklist;
