import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    CheckCircle2, XCircle, AlertCircle, MinusCircle,
    ChevronDown, ChevronRight, FileText, Sparkles, History,
    Loader2, HelpCircle, QrCode, Inbox, CheckCheck, X,
    Info, Building2, Shield, User, AlertTriangle,
    ClipboardCheck, Trash2, Plus,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import {
    ALTA_DIRECCION_ITEMS,
    CATEGORY_TITLES,
    AltaDireccionItem,
    AltaDireccionStatus,
} from './altaDireccionData';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { useAuthContext } from '~/hooks';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import { useAutoLoadReport } from './useAutoLoadReport';
import QRCode from 'qrcode';
import CollapsibleReportBox from './CollapsibleReportBox';

const STATUS_OPTIONS = [
    { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
    { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { value: 'parcial' as const, label: 'Parcial', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
    { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10' },
];

const CATEGORY_COLORS: Record<string, string> = {
    insumos: 'border-teal-500 text-teal-600',
    revision: 'border-indigo-500 text-indigo-600',
    seguimiento: 'border-orange-500 text-orange-600',
};

export default function AltaDireccionChecklist() {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Checklist state
    const [statuses, setStatuses] = useState<AltaDireccionStatus[]>([]);
    const [observations, setObservations] = useState<Record<string, string>>({});
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['insumos', 'revision', 'seguimiento'])
    );

    // QR Modal state
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [portalUrl, setPortalUrl] = useState('');

    // Inbox (public submissions) state
    const [showInbox, setShowInbox] = useState(false);
    const [inboxPublico, setInboxPublico] = useState<any[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(false);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    // History & save state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [editorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview');

    // Grouped items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, AltaDireccionItem[]> = {
            insumos: [],
            revision: [],
            seguimiento: [],
        };
        ALTA_DIRECCION_ITEMS.forEach(item => {
            groups[item.category].push(item);
        });
        return groups;
    }, []);

    // Progress
    const completedCount = useMemo(() =>
        (statuses || []).filter(s => s.status !== 'pendiente').length,
        [statuses]
    );

    // Listen for cross-component inbox open requests (from notifications)
    useEffect(() => {
        const handleOpenInbox = (e: Event) => {
            const { module } = (e as CustomEvent).detail || {};
            if (module === 'alta_direccion') {
                // Must mock the callback call here as handleShowInbox is defined below
                // Actually, handleShowInbox just sets state and loads. We can just set state here and rely on the UI opening
                setShowInbox(true);
                setLoadingInbox(true);
                axios.get('/api/sgsst/alta-direccion/data', {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => {
                    setInboxPublico(res.data.inboxPublico || []);
                }).catch(() => {
                    // silent
                }).finally(() => setLoadingInbox(false));
            }
        };
        window.addEventListener('sgsst-open-inbox', handleOpenInbox);
        return () => window.removeEventListener('sgsst-open-inbox', handleOpenInbox);
    }, [token]);

    // Load saved data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await axios.get('/api/sgsst/alta-direccion/data', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.statusData?.length) {
                    const loadedStatuses: AltaDireccionStatus[] = res.data.statusData.map((s: any) => ({
                        itemId: s.itemId,
                        status: s.status,
                    }));
                    const loadedObs: Record<string, string> = {};
                    res.data.statusData.forEach((s: any) => {
                        if (s.observation) loadedObs[s.itemId] = s.observation;
                    });
                    setStatuses(loadedStatuses);
                    setObservations(loadedObs);
                }
                if (res.data.inboxPublico) setInboxPublico(res.data.inboxPublico);
            } catch (e) {
                // Silently fail if no data yet
            }
        };
        if (token) loadData();
    }, [token]);

    const getItemStatus = useCallback((itemId: string): AltaDireccionStatus['status'] =>
        statuses.find(s => s.itemId === itemId)?.status || 'pendiente',
        [statuses]
    );

    const handleStatusChange = useCallback((itemId: string, status: AltaDireccionStatus['status']) => {
        setStatuses(prev => {
            const existing = prev.find(s => s.itemId === itemId);
            if (existing) return prev.map(s => s.itemId === itemId ? { ...s, status } : s);
            return [...prev, { itemId, status }];
        });
    }, []);

    const toggleItemExpanded = useCallback((itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
            return next;
        });
    }, []);

    const toggleCategoryExpanded = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category); else next.add(category);
            return next;
        });
    }, []);

    // Save current state to backend
    const handleSaveData = useCallback(async () => {
        try {
            const statusData = ALTA_DIRECCION_ITEMS.map(item => ({
                itemId: item.id,
                status: getItemStatus(item.id),
                observation: observations[item.id] || '',
            }));
            await axios.post('/api/sgsst/alta-direccion/save', { statusData }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast({ message: 'Calificación de Alta Dirección guardada', status: 'success', severity: 'success' });
        } catch (e) {
            showToast({ message: 'Error al guardar calificación', status: 'error' });
        }
    }, [statuses, observations, token, showToast, getItemStatus]);

    // Generate QR code for public portal
    const handleShowQR = useCallback(async () => {
        try {
            const userId = (user as any)?.id || (user as any)?._id;
            if (!userId) {
                showToast({ message: 'Error: no se encontró ID de usuario', status: 'error' });
                return;
            }
            const portalUrl = `${window.location.origin}/sgsst-public/alta-direccion/${userId}`;
            const dataUrl = await QRCode.toDataURL(portalUrl, { width: 280, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
            setPortalUrl(portalUrl);
            setQrDataUrl(dataUrl);
            setShowQrModal(true);
        } catch (e) {
            showToast({ message: 'Error al generar código QR', status: 'error' });
        }
    }, [user, showToast]);

    // Load inbox
    const handleShowInbox = useCallback(async () => {
        setLoadingInbox(true);
        setShowInbox(true);
        try {
            const res = await axios.get('/api/sgsst/alta-direccion/data', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInboxPublico(res.data.inboxPublico || []);
        } catch (e) {
            showToast({ message: 'Error al cargar reportes', status: 'error' });
        } finally {
            setLoadingInbox(false);
        }
    }, [token, showToast]);

    // Approve inbox item → load statuses into form
    const handleApproveInbox = useCallback(async (reportId: string) => {
        try {
            const res = await axios.post('/api/sgsst/alta-direccion/inbox/approve', { reportId }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { statusData, inboxPublico: newInbox } = res.data;
            if (statusData) {
                const loadedStatuses: AltaDireccionStatus[] = statusData.map((s: any) => ({
                    itemId: s.itemId,
                    status: s.status,
                }));
                const loadedObs: Record<string, string> = {};
                statusData.forEach((s: any) => {
                    if (s.observation) loadedObs[s.itemId] = s.observation;
                });
                setStatuses(loadedStatuses);
                setObservations(loadedObs);
            }
            setInboxPublico(newInbox || []);
            setShowInbox(false);
            showToast({
                message: '✅ Evaluación aprobada y cargada en el formulario. ¡Ya puedes generar el informe!',
                status: 'success', severity: 'success',
                duration: 5000,
            });
        } catch (e) {
            showToast({ message: 'Error al aprobar la evaluación', status: 'error' });
        }
    }, [token, showToast]);

    // Dismiss inbox item
    const handleDismissInbox = useCallback(async (reportId: string) => {
        try {
            const res = await axios.post('/api/sgsst/alta-direccion/inbox/dismiss', { reportId }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInboxPublico(res.data.inboxPublico || []);
        } catch (e) {
            showToast({ message: 'Error al descartar reporte', status: 'error' });
        }
    }, [token, showToast]);

    // AI analysis
    const handleAnalyze = useCallback(async () => {
        if (completedCount === 0) {
            showToast({ message: 'Complete al menos un ítem antes de analizar', status: 'warning' });
            return;
        }
        setIsAnalyzing(true);
        try {
            const checklistWithStatuses = ALTA_DIRECCION_ITEMS.map(item => ({
                ...item,
                status: getItemStatus(item.id),
            }));

            const completedItems = checklistWithStatuses.filter(i => i.status === 'cumple');
            const nonCompliantItems = checklistWithStatuses.filter(i => i.status === 'no_cumple');
            const partialItems = checklistWithStatuses.filter(i => i.status === 'parcial');
            const naItems = checklistWithStatuses.filter(i => i.status === 'no_aplica');

            const analysisData = {
                checklist: checklistWithStatuses,
                score: completedItems.length,
                totalPoints: ALTA_DIRECCION_ITEMS.length,
                complianceLevel: {
                    level: completedItems.length >= 20 ? 'adecuado' : completedItems.length >= 14 ? 'moderado' : 'crítico',
                    percentage: ((completedItems.length / ALTA_DIRECCION_ITEMS.length) * 100).toFixed(1),
                },
                observations: Object.fromEntries(
                    Object.entries(observations).map(([k, v]) => [k, v])
                ),
                modelName: selectedModel,
                userName: user?.name || user?.username || 'Usuario',
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                type: 'alta_direccion',
            };

            const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 200000,
            });

            const signatureIcon = '<div class="flex flex-col items-center justify-center my-4 opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-teal-900"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg><span class="text-xs text-teal-900 mt-1 font-semibold tracking-wider uppercase">Firmado Digitalmente</span></div>';
            const cleanReport = response.data.report.replace(/<img[^>]*>/gi, signatureIcon);

            setAnalysisReport(cleanReport);
            setEditorContent(cleanReport);
            setConversationId('new');
            setReportMessageId(null);
            showToast({ message: 'Informe de Alta Dirección generado exitosamente', status: 'success', severity: 'success' });
        } catch (error: any) {
            let errorMsg = 'Error al generar el análisis';
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMsg = 'El informe tardó demasiado. Intente de nuevo.';
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }
            showToast({ message: `Error: ${errorMsg}`, status: 'error', duration: 8000 });
        } finally {
            setIsAnalyzing(false);
        }
    }, [completedCount, ALTA_DIRECCION_ITEMS, getItemStatus, observations, selectedModel, user, token, showToast]);

    // Save report to history
    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || analysisReport;
        if (!contentToSave) {
            showToast({ message: 'No hay informe para guardar', status: 'warning' });
            return;
        }
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) {
                    setRefreshTrigger(p => p + 1);
                    showToast({ message: 'Informe actualizado exitosamente', status: 'success', severity: 'success' });
                }
                return;
            }
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Revisión Alta Dirección SG-SST - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-alta-direccion'],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(p => p + 1);
                showToast({ message: 'Informe de Alta Dirección guardado', status: 'success', severity: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error de red al guardar el informe', status: 'error' });
        }
    }, [editorContent, analysisReport, token, conversationId, reportMessageId, showToast]);

    // Load from history
    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { Authorization: `Bearer ${token}` },
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
                showToast({ message: 'Informe cargado exitosamente', status: 'success', severity: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el informe', status: 'error' });
        }
    }, [token, showToast]);

    useAutoLoadReport({
        token,
        tags: ['sgsst-alta-direccion'],
        generatedReport: analysisReport,
        handleSelectReport,
    });

    const pendingInboxCount = inboxPublico.filter(i => !i.status || i.status === 'pending').length;

    return (
        <div className="flex flex-col gap-6">
            {/* ─── Header Banner ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-teal-50/50 p-5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-md shrink-0">
                        <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-text-primary text-lg leading-tight">
                            Revisión por la Alta Dirección
                        </h3>
                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                            Decreto 1072 de 2015 — Art. 2.2.4.6.31 · Los 24 aspectos que la alta dirección debe revisar anualmente en el SG-SST.
                            <span className="ml-2 inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                <Shield className="w-3 h-3" /> Acceso restringido via QR a Representante Legal / Gerencia
                            </span>
                        </p>
                    </div>
                </div>
                {/* Evaluation summary pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        { label: 'Cumplen', count: statuses.filter(s => s.status === 'cumple').length, color: 'bg-green-100 text-green-800' },
                        { label: 'No Cumplen', count: statuses.filter(s => s.status === 'no_cumple').length, color: 'bg-red-100 text-red-800' },
                        { label: 'Parciales', count: statuses.filter(s => s.status === 'parcial').length, color: 'bg-yellow-100 text-yellow-800' },
                        { label: 'No Aplican', count: statuses.filter(s => s.status === 'no_aplica').length, color: 'bg-gray-100 text-gray-600' },
                        { label: 'Pendientes', count: ALTA_DIRECCION_ITEMS.length - completedCount, color: 'bg-teal-100 text-teal-700' },
                    ].map(pill => (
                        <span key={pill.label} className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', pill.color)}>
                            {pill.label}: {pill.count}
                        </span>
                    ))}
                </div>
            </div>

            {/* ─── Progress Card ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs text-text-secondary">Progreso</p>
                            <p className="text-2xl font-bold text-text-primary">{completedCount}/{ALTA_DIRECCION_ITEMS.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Evaluados</p>
                            <p className="text-2xl font-bold text-text-primary">
                                {((completedCount / ALTA_DIRECCION_ITEMS.length) * 100).toFixed(0)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Estado</p>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
                                completedCount >= 20 ? 'bg-green-100 text-green-700' :
                                    completedCount >= 14 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                            )}>
                                {completedCount >= 20 ? 'ADECUADO' : completedCount >= 14 ? 'MODERADO' : 'CRÍTICO'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 px-4 hidden md:block">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-100 dark:border-teal-800/30">
                            <h4 className="text-xs text-teal-800 dark:text-teal-300 mb-1 font-bold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 animate-pulse text-teal-500" />
                                Informe de Revisión por IA
                            </h4>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                La IA generará el <strong>Informe de Revisión por la Alta Dirección</strong> con base en los 24 aspectos evaluados, incluyendo análisis por grupos y un plan de acción normativo según el <strong>Decreto 1072 de 2015, Art. 2.2.4.6.31</strong>.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                        className={cn(
                            'h-full transition-all duration-300',
                            completedCount >= 20 ? 'bg-green-500' :
                                completedCount >= 14 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${(completedCount / ALTA_DIRECCION_ITEMS.length) * 100}%` }}
                    />
                </div>

                {/* ─── Toolbar ─── */}
                <SGSSTToolbar
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                    isHistoryOpen={isHistoryOpen}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    onSaveLocal={handleSaveData}
                    onSave={handleSave}
                    hasContent={!!editorContent}
                    exportContent={editorContent || ''}
                    exportFileName="Revision_Alta_Direccion"
                    customSections={[
                        <div className="flex items-center gap-2" key="custom-buttons">
                            <ToolbarButton
                                id="inbox-public"
                                onClick={handleShowInbox}
                                label={`Reportes (${pendingInboxCount})`}
                                icon="inbox"
                                badge={pendingInboxCount || undefined}
                                active={showInbox}
                            />
                            <ToolbarButton
                                id="qr-portal"
                                onClick={handleShowQR}
                                label="Portal & Código QR"
                                icon="qrcode"
                            />
                        </div>
                    ]}
                />

            </div>

            {/* ─── QR Modal ─────────────────────────────────────────────── */}
            {showQrModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowQrModal(false)}>
                    <div className="bg-surface-primary w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-border-medium animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-4 text-center relative">
                            <button onClick={() => setShowQrModal(false)} className="absolute top-3 right-3 text-teal-100 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-2 shadow-inner backdrop-blur-sm">
                                <QrCode className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Portal Público SGSST</h3>
                        </div>

                        {/* QR Code Body */}
                        <div className="p-4 flex flex-col items-center bg-white dark:bg-surface-primary space-y-4">
                            <p className="text-[12px] text-center text-gray-600 dark:text-gray-300 leading-relaxed max-w-[240px]">
                                Comparte este QR exclusivamente con el <strong>Representante Legal</strong> o personal de <strong>Gerencia</strong>.
                            </p>
                            
                            <div className="p-2 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="QR Portal Alta Dirección" className="w-32 h-32 mx-auto" />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center bg-gray-50">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                                    </div>
                                )}
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-left w-full flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    Solo podrán acceder los trabajadores con cargo de <strong>Representante Legal</strong>, <strong>Gerente</strong> o <strong>Director</strong> registrados en el Perfil Sociodemográfico.
                                </p>
                            </div>

                            {/* Public Link Section */}
                            <div className="w-full space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 text-center">Enlace de acceso público</p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        readOnly 
                                        value={portalUrl}
                                        className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-600 dark:text-gray-300 ring-0"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(portalUrl);
                                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success', severity: 'success' });
                                        }}
                                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-surface-secondary border-t border-gray-100 dark:border-border-medium flex justify-end">
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="px-6 py-2 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* ─── Inbox Panel ───────────────────────────────────────────── */}
            {showInbox && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 overflow-hidden shadow-inner p-4 animate-in fade-in slide-in-from-top-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-blue-800 dark:text-blue-400 flex items-center gap-2">
                            <Inbox className="w-5 h-5" /> Evaluaciones Recibidas (Alta Dirección)
                        </h3>
                        <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {loadingInbox ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                        </div>
                    ) : inboxPublico.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3 opacity-50" />
                            <p>No hay evaluaciones pendientes por revisar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inboxPublico.map((item: any) => {
                                const statusCounts = item.data?.statusData || [];
                                const cumple = statusCounts.filter((s: any) => s.status === 'cumple').length;
                                const noCumple = statusCounts.filter((s: any) => s.status === 'no_cumple').length;
                                const parcial = statusCounts.filter((s: any) => s.status === 'parcial').length;
                                const isApproved = item.status === 'approved';

                                return (
                                <div key={item.id} className={cn(
                                    "rounded-xl border p-4 relative flex flex-col transition-colors shadow-sm",
                                    isApproved ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-70' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300'
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate pr-6 flex items-center gap-2" title={item.trabajador?.nombre}>
                                                {item.trabajador?.nombre || 'Desconocido'}
                                                {isApproved && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                            </h4>
                                            <p className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-[180px]">Cargo: {item.trabajador?.cargo}</p>
                                        </div>
                                        <button onClick={() => handleDismissInbox(item.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-1.5 mb-3 flex-wrap">
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">✅ {cumple}</span>
                                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">❌ {noCumple}</span>
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">⚠️ {parcial}</span>
                                    </div>

                                    <div className="text-[10px] text-gray-400 mb-3 flex justify-between">
                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                                        <span>📍 Oficina</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => !isApproved && handleApproveInbox(item.id)}
                                        disabled={isApproved}
                                        className={cn(
                                            "w-full py-2 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2",
                                            isApproved ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50'
                                        )}
                                    >
                                        {isApproved ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                                        {isApproved ? 'Ya cargado' : 'Cargar evaluación'}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Checklist Items ────────────────────────────────────────── */}
            <div className="space-y-4">
                {(['insumos', 'revision', 'seguimiento'] as const).map(category => {
                    const items = groupedItems[category] || [];
                    if (items.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);
                    const categoryCompleted = items.filter(item => getItemStatus(item.id) !== 'pendiente').length;

                    return (
                        <div key={category} className="overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                            <button
                                onClick={() => toggleCategoryExpanded(category)}
                                className={cn(
                                    'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-tertiary',
                                    'border-l-4',
                                    CATEGORY_COLORS[category]
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-text-secondary" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-text-secondary" />
                                    )}
                                    <span className="font-bold">{CATEGORY_TITLES[category]}</span>
                                    <span className="text-sm text-text-secondary">
                                        ({categoryCompleted}/{items.length} evaluados)
                                    </span>
                                </div>
                                {categoryCompleted === items.length && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="divide-y divide-border-light">
                                    {items.map((item) => {
                                        const status = getItemStatus(item.id);
                                        const isItemExpanded = expandedItems.has(item.id);

                                        return (
                                            <div key={item.id} className="bg-surface-primary/50">
                                                <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                                                    {/* Help toggle */}
                                                    <button
                                                        onClick={() => toggleItemExpanded(item.id)}
                                                        className="hidden sm:block mt-1 flex-shrink-0 text-text-secondary hover:text-text-primary"
                                                        title="Ver indicaciones de evaluación"
                                                    >
                                                        <HelpCircle className="h-4 w-4" />
                                                    </button>

                                                    <div className="min-w-0 flex-1 w-full">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-start gap-2">
                                                                    <button
                                                                        onClick={() => toggleItemExpanded(item.id)}
                                                                        className="sm:hidden mt-1 flex-shrink-0 text-text-secondary hover:text-text-primary"
                                                                    >
                                                                        <HelpCircle className="h-4 w-4" />
                                                                    </button>
                                                                    <div>
                                                                        <p className="font-medium text-text-primary">
                                                                            <span className="mr-2 text-text-secondary font-mono bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">{item.code}</span>
                                                                            {item.name}
                                                                        </p>
                                                                        <p className="mt-1 text-sm text-text-secondary leading-relaxed">{item.description}</p>
                                                                        <p className="mt-2 text-xs text-text-tertiary flex items-center gap-2">
                                                                            <span className="uppercase tracking-wide opacity-75">{item.subcategory}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Status Buttons */}
                                                            <div className="flex sm:flex-col lg:flex-row flex-wrap gap-1 sm:ml-4 sm:flex-shrink-0 border-t sm:border-t-0 border-border-light pt-3 sm:pt-0 justify-between sm:justify-end">
                                                                {STATUS_OPTIONS.map(opt => {
                                                                    const Icon = opt.icon;
                                                                    const isSelected = status === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => handleStatusChange(item.id, opt.value)}
                                                                            className={cn(
                                                                                'rounded-xl p-2 transition-all',
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

                                                        {/* Expanded: how to evaluate */}
                                                        {isItemExpanded && (
                                                            <div className="mt-3 rounded-2xl border border-border-light bg-surface-secondary p-3">
                                                                <p className="mb-2 text-sm font-medium text-text-primary flex items-center gap-2">
                                                                    <Info className="w-4 h-4 text-teal-500" />
                                                                    ¿Cómo se evalúa?
                                                                </p>
                                                                <p className="text-sm text-text-secondary">{item.evaluation}</p>
                                                            </div>
                                                        )}

                                                        {/* Observations for partial/no_cumple */}
                                                        {(status === 'parcial' || status === 'no_cumple' || status === 'no_aplica') && (
                                                            <div className="mt-2">
                                                                <textarea
                                                                    placeholder="Agregar observación o evidencia..."
                                                                    value={observations[item.id] || ''}
                                                                    onChange={e => setObservations(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-yellow-500 focus:outline-none resize-none"
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

            {/* ─── Bottom Analyze Button ───────────────────────────────── */}
            <div className="flex justify-center mt-2 mb-4 gap-4">
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || completedCount === 0}
                    className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {isAnalyzing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <AnimatedIcon name="sparkles" size={20} />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Generar Informe con IA
                    </span>
                </button>
            </div>

            {/* ─── Analysis Report ──────────────────────────────────────── */}
                <div className="mt-4">
                    <CollapsibleReportBox
                        title="Revisión Alta Dirección"
                        icon={<FileText className="h-5 w-5 text-text-secondary" />}
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSave()}
                                    className="group flex items-center px-3 py-1.5 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-lg transition-all duration-300 shadow-sm font-medium text-sm"
                                    title="Guardar"
                                >
                                    <AnimatedIcon name="save" size={16} className="text-gray-500" />
                                    <span className="ml-2">Guardar Informe</span>
                                </button>
                                <ExportDropdown
                                    content={editorContent || analysisReport || ''}
                                    fileName="Informe_Alta_Direccion"
                                    reportType="checklist"
                                />
                            </div>
                        }
                    >
                        <div style={{ minHeight: '400px', overflowX: 'auto' }}>
                            <div style={{ minWidth: '900px' }}>
                                <LiveEditor
                                    key={editorKey}
                                    reportType="checklist"
                                    initialContent={analysisReport}
                                    onUpdate={(content) => setEditorContent(content)}
                                    onSave={handleSave}
                                    reportSourceData={{ statuses, observations }}
                                />
                            </div>
                        </div>
                    </CollapsibleReportBox>
                </div>

            {/* ─── Report History Panel ─────────────────────────────────── */}
            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-alta-direccion']}
            />
        </div>
    );
}
