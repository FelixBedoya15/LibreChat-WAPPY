import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Download,
    Loader2,
    History,
    Scale,
    ChevronDown,
    ChevronRight,
    Search,
    BookOpen,
    CheckCircle2,
    XCircle,
    MinusCircle,
    FileText,
    Database
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { MATRIZ_LEGAL_ITEMS, MatrizLegalItem } from './matrizLegalData';

interface ComplianceStatus {
    itemId: string;
    status: 'cumple' | 'no_cumple' | 'no_aplica' | 'pendiente';
}

const STATUS_OPTIONS = [
    { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
    { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10' },
];

const MatrizLegal = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [activity, setActivity] = useState('');
    const [location, setLocation] = useState('');
    const [entityType, setEntityType] = useState('private');

    // Fetch company info to auto-fill
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/company-info', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setActivity(prev => prev || data.economicActivity || '');
                    setLocation(prev => prev || data.city || '');
                }
            })
            .catch(err => console.error('Error fetching company info', err));
    }, [token]);

    // Checklist State
    const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
    const [seguimientos, setSeguimientos] = useState<Record<string, string>>({});
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Analysis state  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedMatrix, setGeneratedMatrix] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);

    // History & save state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filter out any orphaned statuses
    const validStatuses = useMemo(() => {
        const itemIds = new Set(MATRIZ_LEGAL_ITEMS.map(i => i.id));
        return statuses.filter(s => itemIds.has(s.itemId));
    }, [statuses]);

    // Calculate progress
    const totalItems = MATRIZ_LEGAL_ITEMS.length;
    const completedCount = useMemo(() => {
        return validStatuses.filter(s => s.status !== 'pendiente').length;
    }, [validStatuses]);
    const compliantCount = useMemo(() => {
        return validStatuses.filter(s => s.status === 'cumple').length;
    }, [validStatuses]);

    const compliancePercentage = useMemo(() => {
        const noAplicaCount = validStatuses.filter(s => s.status === 'no_aplica').length;
        if (totalItems === 0) return 0;
        const percentage = ((compliantCount + noAplicaCount) / totalItems) * 100;
        return Math.min(percentage, 100);
    }, [validStatuses, compliantCount, totalItems]);

    // Group items by category
    const itemsByCategory = useMemo(() => {
        return MATRIZ_LEGAL_ITEMS.reduce((acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            acc[item.categoria].push(item);
            return acc;
        }, {} as Record<string, MatrizLegalItem[]>);
    }, []);

    const getItemStatus = useCallback((id: string) => {
        return validStatuses.find(s => s.itemId === id)?.status || 'pendiente';
    }, [validStatuses]);

    const handleStatusChange = useCallback((id: string, status: ComplianceStatus['status']) => {
        setStatuses(prev => {
            const existing = prev.findIndex(s => s.itemId === id);
            if (existing >= 0) {
                const newStatuses = [...prev];
                newStatuses[existing] = { itemId: id, status };
                return newStatuses;
            }
            return [...prev, { itemId: id, status }];
        });
    }, []);

    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) newSet.delete(category);
            else newSet.add(category);
            return newSet;
        });
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!activity.trim()) {
            showToast({ message: 'Ingrese la actividad económica e inicie la calificación', status: 'warning' });
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/sgsst/matriz/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    activity,
                    location,
                    entityType,
                    statuses: validStatuses.map(s => {
                        const definition = MATRIZ_LEGAL_ITEMS.find(i => i.id === s.itemId) || {};
                        return { ...s, ...definition };
                    }),
                    seguimientos,
                    compliancePercentage: Math.round(compliancePercentage),
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar la matriz legal');
            }

            const data = await response.json();
            setGeneratedMatrix(data.matrix);
            setEditorContent(data.matrix);
            setConversationId('new');
            setReportMessageId(null);
            showToast({ message: 'Matriz Legal generada exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Matrix generation error:', error);
            showToast({ message: error.message || 'Error al generar la matriz', status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [activity, location, entityType, selectedModel, token, showToast, validStatuses, seguimientos, compliancePercentage]);

    const handleSave = useCallback(async () => {
        let contentToSave = editorContent || generatedMatrix;
        if (!contentToSave) return;
        if (!token) {
            showToast({ message: 'Error: No autorizado', status: 'error' });
            return;
        }

        const stateData = {
            statuses: validStatuses,
            seguimientos,
            activity,
            location,
            entityType
        };
        const stateString = `<!-- SGSST_MATRIZ_DATA_V1:${JSON.stringify(stateData)} -->`;

        contentToSave = contentToSave.replace(/<!-- SGSST_MATRIZ_DATA_V1:.*? -->/g, '');
        contentToSave += stateString;

        try {
            const body = {
                content: contentToSave,
                title: `Matriz Legal SST - ${new Date().toLocaleDateString('es-CO')}`,
                tags: ['sgsst-matriz-legal'],
                ...(conversationId !== 'new' ? { conversationId, messageId: reportMessageId } : {})
            };

            const method = conversationId !== 'new' ? 'PUT' : 'POST';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                if (method === 'POST') {
                    setConversationId(data.conversationId);
                    setReportMessageId(data.messageId);
                }
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Matriz guardada exitosamente', status: 'success' });
            } else {
                showToast({ message: 'Error al guardar matriz', status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedMatrix, conversationId, reportMessageId, token, showToast, validStatuses, seguimientos, activity, location, entityType]);

    const handleSelectReport = (report: any) => {
        if (report && report.content) {
            setGeneratedMatrix(report.content);
            setEditorContent(report.content);
            setConversationId(report.conversationId);
            setReportMessageId(report.messageId);

            const stateMatch = report.content.match(/<!-- SGSST_MATRIZ_DATA_V1:(.*?) -->/);
            if (stateMatch && stateMatch[1]) {
                try {
                    const parsedState = JSON.parse(stateMatch[1]);
                    if (parsedState.statuses) setStatuses(parsedState.statuses);
                    if (parsedState.seguimientos) setSeguimientos(parsedState.seguimientos);
                    if (parsedState.activity) setActivity(parsedState.activity);
                    if (parsedState.location) setLocation(parsedState.location);
                    if (parsedState.entityType) setEntityType(parsedState.entityType);
                } catch (e) {
                    console.error('Error parsing matrix state:', e);
                }
            }

            setIsHistoryOpen(false);
            showToast({ message: t('com_ui_report_loaded', 'Matriz cargada'), status: 'info' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Scale className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Matriz Legal SG-SST</h2>
                        <p className="text-sm text-text-secondary">Resolución 0312 de 2019 / Decreto 1072 de 2015</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleGenerate}
                        disabled={isAnalyzing || completedCount === 0}
                        className="group flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                            Generar Documento IA
                        </span>
                    </button>
                    {generatedMatrix && (
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <Database className="h-5 w-5 text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Guardar</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                    >
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Historial
                        </span>
                    </button>
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isAnalyzing}
                    />
                    {generatedMatrix && (
                        <ExportDropdown
                            content={editorContent || generatedMatrix || ''}
                            fileName="Matriz_Legal_SGSST"
                        />
                    )}
                </div>
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-matriz-legal']}
                    />
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Checklist */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Progress Overview Card */}
                    <div className="p-5 rounded-xl border border-border-medium bg-surface-secondary shadow-sm flex items-center gap-6">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - compliancePercentage / 100)}`}
                                    className="text-blue-500 transition-all duration-1000 ease-in-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-text-primary">{Math.round(compliancePercentage)}%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-text-primary mb-1">Cumplimiento Legal Inicial</h3>
                            <p className="text-sm text-text-secondary">
                                Progreso de evaluación: {completedCount} de {totalItems} ítems evaluados.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isAnalyzing || completedCount === 0}
                            className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                            {generatedMatrix ? 'Regenerar Documento IA' : 'Generar Documento IA'}
                        </button>
                    </div>

                    {/* Metadata Form */}
                    <div className="p-4 rounded-xl border border-border-medium bg-surface-secondary shadow-sm">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Variables Organizacionales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-text-secondary">Actividad Económica <span className="text-red-500">*</span></label>
                                <input type="text" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ej: Construcción residencial..." className="w-full rounded-md border border-border-medium bg-surface-primary px-3 py-1.5 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Ciudad / Depto</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Bogotá" className="w-full rounded-md border border-border-medium bg-surface-primary px-3 py-1.5 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Tipo de Entidad</label>
                                <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full rounded-md border border-border-medium bg-surface-primary px-3 py-1.5 text-sm">
                                    <option value="private">Privada</option>
                                    <option value="public">Pública</option>
                                    <option value="mixed">Mixta</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Checklist Accordion */}
                    <div className="space-y-3">
                        {Object.entries(itemsByCategory).map(([category, items]) => {
                            const isExpanded = expandedCategories.has(category);
                            const categoryItemsCount = items.length;
                            const categoryCompletedCount = items.filter(i => getItemStatus(i.id) !== 'pendiente').length;

                            return (
                                <div key={category} className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between p-4 bg-surface-tertiary/30 hover:bg-surface-tertiary transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                                            <div className="text-left">
                                                <h3 className="font-semibold text-text-primary">{category}</h3>
                                                <div className="text-xs text-text-secondary mt-0.5">
                                                    Avance: {categoryCompletedCount} / {categoryItemsCount}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="divide-y divide-border-medium">
                                            {items.map((item) => {
                                                const status = getItemStatus(item.id);
                                                return (
                                                    <div key={item.id} className="p-4 hover:bg-surface-tertiary/10 transition-colors">
                                                        <div className="flex flex-col gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded uppercase">{item.norma} - {item.articulo}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-text-primary leading-snug">{item.descripcion}</p>
                                                                <p className="text-xs text-text-secondary mt-1">Evidencia: {item.evidencia}</p>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row gap-3 mt-1 items-start sm:items-center">
                                                                {/* Status Buttons */}
                                                                <div className="flex rounded-lg border border-border-medium overflow-hidden shrink-0">
                                                                    {STATUS_OPTIONS.map((opt) => {
                                                                        const isSelected = status === opt.value;
                                                                        const Icon = opt.icon;
                                                                        return (
                                                                            <button
                                                                                key={opt.value}
                                                                                onClick={() => handleStatusChange(item.id, opt.value)}
                                                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-r border-border-medium last:border-r-0 hover:bg-surface-hover ${isSelected ? opt.color : 'text-text-secondary bg-surface-primary'
                                                                                    }`}
                                                                                title={opt.label}
                                                                            >
                                                                                <Icon className="h-3.5 w-3.5" />
                                                                                <span className="hidden sm:inline">{opt.label}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {/* Seguimiento Input */}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Notas de seguimiento o justificación..."
                                                                    value={seguimientos[item.id] || ''}
                                                                    onChange={(e) => setSeguimientos({ ...seguimientos, [item.id]: e.target.value })}
                                                                    className="w-full rounded text-xs border border-border-medium bg-surface-primary px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                                                />
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
                </div>

                {/* Right Column: LiveEditor */}
                <div className="lg:col-span-1 border border-border-medium rounded-xl bg-surface-primary overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-4">
                    <div className="p-3 bg-surface-tertiary/50 border-b border-border-medium flex justify-between items-center shrink-0">
                        <span className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Documento de Matriz</span>
                    </div>
                    {generatedMatrix ? (
                        <div className="flex-1 overflow-hidden" style={{ height: '0', minHeight: '400px' }}>
                            <LiveEditor
                                initialContent={generatedMatrix}
                                onUpdate={(html) => setEditorContent(html)}
                                onSave={handleSave}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-text-secondary">
                            <Scale className="h-12 w-12 mb-3 opacity-20" />
                            <p className="font-medium">No hay matriz generada</p>
                            <p className="text-sm mt-1">Califica los criterios en los paneles de la izquierda y haz clic en "Generar Documento IA".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatrizLegal;
