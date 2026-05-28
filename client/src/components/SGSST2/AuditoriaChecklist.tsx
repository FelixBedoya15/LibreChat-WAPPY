import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
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
    AlertTriangle,
} from 'lucide-react';
import { Button, useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { AUDITORIA_ITEMS, AuditoriaItem } from './auditoriaData';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { useAuthContext } from '~/hooks';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';

import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { useAutoLoadReport } from './useAutoLoadReport';
import SGSSTToolbar from './SGSSTToolbar';
import './sst-bit.css';


interface AuditoriaChecklistProps {
    onAnalysisComplete?: (report: string) => void;
}


interface ComplianceStatus {
    itemId: string;
    status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
}

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

    // Checklist state
    const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([])); // Initially collapsed

    // Observations state
    const [observations, setObservations] = useState<Record<string, string>>({});

    // Analysis state  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    const [selectedModel, setSelectedModel] = useState<string>(() => user?.personalization?.geminiModels?.sstManagement || AI_MODELS[0].id);

    useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user]);

    // History & save state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const AUDIT_STORAGE_KEY = 'sgsst_auditoria_form';
    const refreshData = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

    // Load draft from local storage
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.statuses) setStatuses(data.statuses);
                if (data.observations) setObservations(data.observations);
            }
        } catch(e) {
            console.error('[SGSST Audit Storage] Load error:', e);
        }
    }, []);

    // Filter out any orphaned statuses (from old saved audits)
    const validStatuses = useMemo(() => {
        const itemIds = new Set(AUDITORIA_ITEMS.map(i => i.id));
        return statuses.filter(s => itemIds.has(s.itemId));
    }, [statuses]);

    // Calculate progress
    const totalItems = AUDITORIA_ITEMS.length;
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
        return Math.min(percentage, 100); // Cap at 100% as a safety measure
    }, [validStatuses, compliantCount, totalItems]);

    // Weighted Score (Res 0312) Calculation
    const weightedScore = useMemo(() => {
        return validStatuses.reduce((acc, status) => {
            if (status.status === 'cumple' || status.status === 'no_aplica') {
                const item = AUDITORIA_ITEMS.find(i => i.id === status.itemId);
                return acc + (item?.points || 0);
            }
            return acc;
        }, 0);
    }, [validStatuses]);

    // Maximum possible score (all items)
    const maxPossibleScore = useMemo(() => {
        return AUDITORIA_ITEMS.reduce((sum, item) => sum + (item.points || 0), 0);
    }, []);

    const handleSaveData = useCallback(() => {
        try {
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify({ statuses: validStatuses, observations }));
            showToast({ message: 'Calificación de auditoría guardada localmente', status: 'success' });
        } catch(e) {
            showToast({ message: 'Error al guardar calificación', status: 'error' });
        }
    }, [validStatuses, observations, showToast]);

    // Res 0312 Compliance Percentage (Weighted)
    const weightedPercentage = useMemo(() => {
        if (maxPossibleScore === 0) return 0;
        return (weightedScore / maxPossibleScore) * 100;
    }, [weightedScore, maxPossibleScore]);

    // Compliance Level (Visual)
    const complianceLevel = useMemo(() => {
        if (weightedPercentage >= 85) return { level: 'aceptable', label: 'Aceptable', color: 'text-green-600 bg-green-100' };
        if (weightedPercentage >= 60) return { level: 'moderado', label: 'Moderado', color: 'text-yellow-600 bg-yellow-100' };
        return { level: 'crítico', label: 'Crítico', color: 'text-red-600 bg-red-100' };
    }, [weightedPercentage]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, AuditoriaItem[]> = {
            planear: [],
            hacer: [],
            verificar: [],
            actuar: [],
        };
        AUDITORIA_ITEMS.forEach(item => {
            if (groups[item.category]) {
                groups[item.category].push(item);
            }
        });
        return groups;
    }, []);

    const handleStatusChange = useCallback((itemId: string, status: ComplianceStatus['status']) => {
        setStatuses(prev => {
            const existing = prev.find(s => s.itemId === itemId);
            if (existing) {
                return prev.map(s => s.itemId === itemId ? { ...s, status } : s);
            }
            return [...prev, { itemId, status }];
        });
    }, []);

    const handleDummyData = () => {
        const dummyItems = generateDummyData.checklist(AUDITORIA_ITEMS);
        const newStatuses: ComplianceStatus[] = dummyItems.map((item: any) => ({
            itemId: item.id,
            status: item.estado === 'Cumple' ? 'cumple' : item.estado === 'No Cumple' ? 'no_cumple' : 'no_aplica',
        }));
        const newObservations: Record<string, string> = {};
        dummyItems.forEach((item: any) => {
            if (item.evidencia) newObservations[item.id] = item.evidencia;
        });
        
        setStatuses(newStatuses);
        setObservations(newObservations);
        showToast({ message: 'Resultados de auditoría simulados generados correctamente', status: 'success' });
    };

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
            showToast({ message: 'Complete al menos un ítem antes de generar el informe', status: 'warning' });
            return;
        }

        setIsAnalyzing(true);

        try {
            // Prepare data for audit analysis
            const analysisData = {
                type: 'auditoria', // Trigger audit prompt in backend
                checklist: AUDITORIA_ITEMS.map(item => ({
                    ...item,
                    status: getItemStatus(item.id),
                    // Ensure points are included for backend context if needed
                    points: item.points || 0
                })),
                score: compliantCount,
                totalPoints: validStatuses.filter(s => s.status !== 'pendiente' && s.status !== 'no_aplica').length, // Total applicable items evaluated

                // Use the Weighted Level (Res 0312) for consistency with UI
                complianceLevel: { level: complianceLevel.label },

                // New Fields for Dual Scoring
                weightedScore: weightedScore || 0,
                weightedPercentage: weightedPercentage || 0,

                userName: user?.name || user?.username || 'Auditor',
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                observations,
                model: selectedModel,
            };

            const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, {
                timeout: 200000, // 200 seconds timeout
            });

            const result = response.data;

            // Post-process report: Replace broken images with Signature Icon
            const signatureIcon = '<div class="flex flex-col items-center justify-center my-4 opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-teal-900"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg><span class="text-xs text-teal-900 mt-1 font-semibold tracking-wider uppercase">Firmado Digitalmente</span></div>';

            const cleanReport = result.report.replace(/<img[^>]*>/gi, signatureIcon);

            setAnalysisReport(cleanReport);
            setEditorContent(cleanReport);
            // Always reset for a fresh save after regeneration
            setConversationId('new');
            setReportMessageId(null);
            onAnalysisComplete?.(result.report);
            showToast({ message: 'Informe de Auditoría generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Audit Analysis error:', error);
            let errorMsg: string;
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMsg = 'El informe tardó demasiado en generarse. Intente de nuevo.';
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            } else {
                errorMsg = error.message || 'Error desconocido';
            }
            showToast({ message: `Error al generar informe: ${errorMsg}`, status: 'error', duration: 8000 });
        } finally {
            setIsAnalyzing(false);
        }
    }, [completedCount, compliantCount, complianceLevel, weightedScore, weightedPercentage, getItemStatus, onAnalysisComplete, showToast, user, validStatuses, observations, selectedModel, conversationId]);



    // Save report
    const handleSave = useCallback(async () => {
        let contentToSave = editorContent || analysisReport;
        if (!contentToSave) return;
        if (!token) {
            showToast({ message: 'Error: No autorizado', status: 'error' });
            return;
        }

        // Embed state data as a hidden comment
        const stateData = {
            statuses: validStatuses,
            observations
        };
        const stateString = `<!-- SGSST_AUDIT_DATA_V1:${JSON.stringify(stateData)} -->`;

        // Remove any existing state data before appending new
        contentToSave = contentToSave.replace(/<!-- SGSST_AUDIT_DATA_V1:.*? -->/g, '');
        contentToSave += stateString;

        try {
            const body = {
                content: contentToSave,
                title: `Auditoría SST - ${new Date().toLocaleDateString('es-CO')}`,
                tags: ['sgsst-auditoria'],
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
                // Synchronize state
                setAnalysisReport(contentToSave);
                setEditorContent(contentToSave);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Auditoría guardada exitosamente', status: 'success' });
            } else {
                showToast({ message: 'Error al guardar auditoría', status: 'error' });
            }
        } catch (e) {
            console.error('Save error:', e);
            showToast({ message: 'Error de red al guardar', status: 'error' });
        }
    }, [editorContent, analysisReport, token, conversationId, reportMessageId, showToast, validStatuses, observations]);

    // Load report from history
    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                // Extract embedded state data
                const stateMatch = lastMsg.text.match(/<!-- SGSST_AUDIT_DATA_V1:(.*?) -->/);
                let loadedContent = lastMsg.text;

                if (stateMatch && stateMatch[1]) {
                    try {
                        const stateData = JSON.parse(stateMatch[1]);
                        if (stateData) {
                            console.log('[SGSST Audit Load] Restoring state:', stateData);
                            if (stateData.statuses) setStatuses(stateData.statuses);
                            if (stateData.observations) setObservations(stateData.observations);

                            // Remove hidden data from editor view
                            loadedContent = loadedContent.replace(/<!-- SGSST_AUDIT_DATA_V1:.*? -->/g, '');
                        }
                    } catch (err) {
                        console.error('[SGSST Audit Load] Error parsing state data:', err);
                    }
                }

                // Clean up content: Replace broken images with Signature Icon
                const signatureIcon = '<div class="flex flex-col items-center justify-center my-4 opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-teal-900"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg><span class="text-xs text-teal-900 mt-1 font-semibold tracking-wider uppercase">Firmado Digitalmente</span></div>';

                loadedContent = loadedContent.replace(/<img[^>]*>/gi, signatureIcon);

                setAnalysisReport(loadedContent);
                setEditorContent(loadedContent);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsHistoryOpen(false);
                showToast({ message: 'Auditoría cargada y restaurada', status: 'success' });
            }
        } catch (e) {
            console.error('Load error:', e);
            showToast({ message: 'Error al cargar auditoría', status: 'error' });
        }
    }, [token, showToast]);

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
            planear: 'border-teal-500 text-teal-600',
            hacer: 'border-yellow-500 text-yellow-600',
            verificar: 'border-red-500 text-red-600',
            actuar: 'border-green-500 text-green-600',
        };
        return colors[category] || '';
    };


    useAutoLoadReport({
        token,
        tags: ['sgsst-auditoria'],
        generatedReport: analysisReport,
        handleSelectReport
    });

    // ─── Arcade Rank ────────────────────────────────────────────────────────────────
    const arcadeRank = weightedPercentage >= 85 ? { rank: 'S', color: '#4ade80', label: 'EXCEPCIONAL' }
        : weightedPercentage >= 70 ? { rank: 'A', color: '#60a5fa', label: 'ACEPTABLE' }
        : weightedPercentage >= 55 ? { rank: 'B', color: '#fbbf24', label: 'MODERADO' }
        : weightedPercentage >= 40 ? { rank: 'C', color: '#f97316', label: 'DÉBIL' }
        : { rank: 'D', color: '#ef4444', label: 'CRÍTICO' };

    const nonConformCount = validStatuses.filter(s => s.status === 'no_cumple').length;
    const parcialCount    = validStatuses.filter(s => s.status === 'parcial').length;

    return (
        <div className="flex flex-col gap-6">
            {/* ─── ARCADE SCOREBOARD HUD ─── */}
            <div className="pixel-box overflow-hidden bg-[#0a0a0a]" style={{ borderColor:'#f87171' }}>
                {/* Header strip */}
                <div className="flex items-center justify-between px-4 py-2 border-b-4 border-red-700 bg-[#1a0000]">
                    <span className="font-pixel text-red-400" style={{ fontSize:'10px' }}>&#9632; VERIFICAR &mdash; AUDIT ARCADE</span>
                    <span className="font-pixel text-gray-500" style={{ fontSize:'6px' }}>DEC 1072 · RES 0312</span>
                </div>

                {/* Score grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x-4 divide-red-900">
                    {/* RANK */}
                    <div className="flex flex-col items-center justify-center py-4 px-2">
                        <span className="font-pixel text-gray-500 mb-1" style={{ fontSize:'5px' }}>RANK</span>
                        <span className="font-pixel" style={{ fontSize:'36px', color: arcadeRank.color, lineHeight:'1' }}>{arcadeRank.rank}</span>
                        <span className="font-pixel mt-1" style={{ fontSize:'6px', color: arcadeRank.color }}>{arcadeRank.label}</span>
                    </div>
                    {/* SCORE */}
                    <div className="flex flex-col items-center justify-center py-4 px-2">
                        <span className="font-pixel text-gray-500 mb-1" style={{ fontSize:'5px' }}>SCORE (RES 0312)</span>
                        <span className="font-pixel text-white" style={{ fontSize:'24px', lineHeight:'1' }}>
                            {weightedScore.toFixed(0)}
                            <span style={{ fontSize:'10px', color:'#6b7280' }}>/100</span>
                        </span>
                        <div className="w-full mt-2 h-2 bg-black border border-gray-700">
                            <div className="h-full transition-all" style={{ width:`${weightedPercentage}%`, backgroundColor: arcadeRank.color }} />
                        </div>
                    </div>
                    {/* HITS / MISSES */}
                    <div className="flex flex-col items-center justify-center py-4 px-2">
                        <span className="font-pixel text-gray-500 mb-2" style={{ fontSize:'5px' }}>CONFORMIDADES</span>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between items-center">
                                <span className="font-pixel text-green-400" style={{ fontSize:'6px' }}>&#x2713; CUMPLE</span>
                                <span className="font-pixel text-green-400" style={{ fontSize:'8px' }}>{compliantCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-pixel text-yellow-400" style={{ fontSize:'6px' }}>~ PARCIAL</span>
                                <span className="font-pixel text-yellow-400" style={{ fontSize:'8px' }}>{parcialCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-pixel text-red-400" style={{ fontSize:'6px' }}>&#x2715; NO CUMPLE</span>
                                <span className="font-pixel text-red-400" style={{ fontSize:'8px' }}>{nonConformCount}</span>
                            </div>
                        </div>
                    </div>
                    {/* COMPLETION */}
                    <div className="flex flex-col items-center justify-center py-4 px-2">
                        <span className="font-pixel text-gray-500 mb-1" style={{ fontSize:'5px' }}>&#205;TEMS EVALUADOS</span>
                        <span className="font-pixel text-white" style={{ fontSize:'20px', lineHeight:'1' }}>
                            {completedCount}
                            <span style={{ fontSize:'8px', color:'#6b7280' }}>/{totalItems}</span>
                        </span>
                        <div className="w-full mt-2 h-2 bg-black border border-gray-700">
                            <div className="h-full bg-red-500 transition-all" style={{ width:`${(completedCount/totalItems)*100}%` }} />
                        </div>
                        <span className="font-pixel text-gray-600 mt-1" style={{ fontSize:'5px' }}>{((completedCount/totalItems)*100).toFixed(0)}% COMPLETADO</span>
                    </div>
                </div>
            </div>

            {/* Original header area (toolbar only) */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary p-4">
                <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                selectedModel={selectedModel}

                onSelectModel={setSelectedModel}
                onSaveLocal={handleSaveData}
                onSave={handleSave}
                hasContent={!!(editorContent || analysisReport)}
                exportContent={editorContent || analysisReport || ''}
                exportFileName="Informe_Auditoria_SST"
                onDummy={handleDummyData}
            />
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
                                            <div key={item.id} className="bg-surface-primary/50">
                                                <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                                                    <div className="flex-1 w-full">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <h4 className="font-medium text-text-primary text-base">
                                                                        <span className="font-bold text-teal-600 mr-2">{item.code}</span>
                                                                        {item.name}
                                                                    </h4>
                                                                    <div className="group relative w-fit">
                                                                        <span className="inline-block font-mono text-[10px] uppercase tracking-wide font-bold text-text-tertiary bg-surface-tertiary px-2 py-1 rounded cursor-help border border-border-light hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
                                                                            {item.criteria}
                                                                        </span>
                                                                        {item.normativeText && (
                                                                            <div className="absolute top-full left-0 mt-2 w-96 p-4 rounded-xl shadow-xl bg-surface-secondary border border-border-medium text-xs text-text-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-pre-wrap text-left max-h-[300px] overflow-y-auto">
                                                                                <div className="font-semibold mb-1 text-teal-500">Fundamento Legal:</div>
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
                                                                    className="mt-1 text-xs text-teal-500 hover:underline flex items-center gap-1"
                                                                >
                                                                    <HelpCircle className="h-3 w-3" /> Ver criterio de evaluación
                                                                </button>
                                                            </div>

                                                            <div className="flex sm:flex-col lg:flex-row flex-wrap gap-1 sm:ml-4 sm:flex-shrink-0 border-t sm:border-t-0 border-border-light pt-3 sm:pt-0 justify-between sm:justify-end">
                                                                {STATUS_OPTIONS.map(opt => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => handleStatusChange(item.id, opt.value)}
                                                                        className={cn(
                                                                            'rounded-xl p-2 transition-all flex-1 sm:flex-none flex justify-center',
                                                                            status === opt.value ? opt.color : 'text-text-tertiary hover:bg-surface-tertiary'
                                                                        )}
                                                                        title={opt.label}
                                                                    >
                                                                        <opt.icon className="h-5 w-5" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(status === 'parcial' || status === 'no_cumple' || status === 'no_aplica') && (
                                                    <div className="mt-3">
                                                        <textarea
                                                            placeholder="Describa el hallazgo, evidencia o motivo de no aplicabilidad..."
                                                            value={observations[item.id] || ''}
                                                            onChange={(e) => setObservations(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-teal-500 focus:outline-none resize-none"
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





            {analysisReport && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">

                    <div style={{ minHeight: '400px', overflowX: 'auto' }}>
                        <div style={{ minWidth: '900px' }}>
                            <LiveEditor
                                key={editorKey}
                                reportType="checklist"
                                initialContent={analysisReport}
                                onUpdate={(content) => setEditorContent(content)}
                                onSave={handleSave}
                                reportSourceData={{ statuses: validStatuses, observations, weightedScore, weightedPercentage, complianceLevel }}
                            />
                        </div>
                    </div>
                    <style>{`
                        [contenteditable] table {
                            width: 100%;
                            min-width: 800px;
                            border-collapse: separate;
                            border-spacing: 0;
                            border-radius: 12px;
                            overflow: hidden;
                            border: 1px solid var(--border-medium, #ddd);
                        }
                    `}</style>
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
