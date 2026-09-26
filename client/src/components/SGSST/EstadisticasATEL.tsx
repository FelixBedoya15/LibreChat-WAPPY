import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { UpgradeWall } from './UpgradeWall';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    History,
    BarChart,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Calculator,
    Loader2,
    Calendar,
    CalendarDays,
    Database,
    Download,
    Building2,
    Activity,
    DollarSign,
    ShieldAlert,
    TrendingDown,
    PieChart,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Coins,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import EventLogger, { ATELContext, calculateEventFinancials } from './EventLogger';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { useAutoLoadReport } from './useAutoLoadReport';
import CollapsibleReportBox from './CollapsibleReportBox';

interface MonthData {
    numTrabajadores: number | '';
    diasProgramados: number | '';
    events: ATELContext[];
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type SubTab = 'novedades' | 'indicadores' | 'financiero';

const EstadisticasATEL = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();
    const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || Boolean(user?.isSubUser);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Annual State: 0-11 index
    const [year, setYear] = useState(new Date().getFullYear());
    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
    const [activeTab, setActiveTab] = useState<SubTab>('novedades');

    const [annualData, setAnnualData] = useState<Record<number, MonthData>>(() => {
        const initial: Record<number, MonthData> = {};
        MONTHS.forEach((_, i) => {
            initial[i] = { numTrabajadores: '', diasProgramados: '', events: [] };
        });
        return initial;
    });

    const [selectedModel, setSelectedModel] = useState(() => user?.personalization?.geminiModels?.sstManagement || 'gemini-3.7-flash');
    
    useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user]);

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingData, setIsSavingData] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const editorContentRef = useRef<string>('');
    const liveEditorRef = useRef<LiveEditorHandle>(null);
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Dynamic list of selectable years
    const currentCalYear = new Date().getFullYear();
    const [availableYears, setAvailableYears] = useState<number[]>([
        currentCalYear - 2,
        currentCalYear - 1,
        currentCalYear,
        currentCalYear + 1
    ]);
    const [activeCompanyInfo, setActiveCompanyInfo] = useState<{ name: string; nit?: string } | null>(null);

    // Fetch active company details
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/company-info', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data?.companyName) {
                    setActiveCompanyInfo({ name: data.companyName, nit: data.nit });
                }
            })
            .catch(() => {});
    }, [token]);

    // Fetch list of years with registered data
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/atel-data/years/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data?.years?.length) {
                    setAvailableYears(prev => {
                        const set = new Set([...prev, ...data.years]);
                        return Array.from(set).sort((a, b) => b - a);
                    });
                }
            })
            .catch(() => {});
    }, [token, refreshTrigger]);

    // Load Data Effect
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setIsLoadingData(true);
            try {
                const res = await fetch(`/api/sgsst/atel-data/${year}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const freshAnnual: Record<number, MonthData> = {};
                MONTHS.forEach((_, i) => {
                    freshAnnual[i] = { numTrabajadores: '', diasProgramados: '', events: [] };
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.months) {
                        Object.keys(data.months).forEach(key => {
                            const m = data.months[key];
                            if (m) {
                                freshAnnual[Number(key)] = {
                                    numTrabajadores: m.numTrabajadores ?? '',
                                    diasProgramados: m.diasProgramados ?? '',
                                    events: Array.isArray(m.events) ? m.events : []
                                };
                            }
                        });
                    }
                }
                setAnnualData(freshAnnual);
            } catch (error) {
                console.error('Error loading annual data:', error);
                showToast({ message: 'Error al cargar datos guardados', status: 'error' });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [year, token]);

    // Calculate total recorded events for active year
    const totalYearEvents = useMemo(() => {
        return Object.values(annualData).reduce((sum, m) => sum + (m.events?.length || 0), 0);
    }, [annualData]);

    const updateMonthData = (field: keyof MonthData, value: any) => {
        setAnnualData(prev => ({
            ...prev,
            [currentMonthIndex]: { ...prev[currentMonthIndex], [field]: value }
        }));
    };

    const handleDummyData = () => {
        const dummy = generateDummyData.estadisticasATEL();
        setAnnualData(prev => ({
            ...prev,
            [currentMonthIndex]: {
                ...prev[currentMonthIndex],
                numTrabajadores: dummy.numTrabajadores,
                diasProgramados: dummy.diasProgramados,
                events: dummy.events as any
            }
        }));
        showToast({ message: 'Datos estadísticos y financieros de prueba cargados.', status: 'success', severity: 'success' });
    };

    const currentData = annualData[currentMonthIndex];

    // Rich Stats Memo
    const stats = useMemo(() => {
        const events = currentData.events || [];
        const workers = Number(currentData.numTrabajadores) || 1;
        const progDays = Number(currentData.diasProgramados) || 0;

        const atEvents = events.filter(e => e.tipo === 'AT');
        const numAT = atEvents.length;
        const diasIncapacidadAT = atEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);
        const diasCargados = atEvents.reduce((sum, e) => sum + (Number(e.diasCargados) || 0), 0);
        const numMortales = atEvents.filter(e => (Number(e.diasCargados) >= 4500) || (e.consecuencia && e.consecuencia.toLowerCase().includes('mortal'))).length;

        const elEvents = events.filter(e => e.tipo === 'EL');
        const casosNuevosEL = elEvents.length;
        const diasIncapacidadEL = elEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

        const medComunEvents = events.filter(e => ['EG_EPS', 'ACC_COMUN', 'Ausentismo', 'CITA_MED'].includes(e.tipo));
        const diasMedComun = medComunEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

        const licEvents = events.filter(e => ['LIC_MAT', 'LIC_PAT', 'LUTO', 'CALAMIDAD', 'SUFRAGIO', 'LEY_2174'].includes(e.tipo));
        const diasLic = licEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

        const permisosEvents = events.filter(e => ['LIC_NO_REM', 'SANCION_DISC', 'SINDICAL', 'PERM_REM'].includes(e.tipo));
        const diasPermisos = permisosEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

        const noJustifEvents = events.filter(e => e.tipo === 'NO_JUSTIF');
        const diasNoJustif = noJustifEvents.reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

        const diasMedicosTotal = diasIncapacidadAT + diasIncapacidadEL + diasMedComun;
        const diasTotal = diasMedicosTotal + diasLic + diasPermisos + diasNoJustif;

        // Res. 0312
        const if_accidentalidad = ((numAT / workers) * 100).toFixed(2);
        const is_severidad = (((diasIncapacidadAT + diasCargados) / workers) * 100).toFixed(2);
        const mortalidad = numAT > 0 ? ((numMortales / numAT) * 100).toFixed(2) : '0.00';
        const prevalenciaEL = ((casosNuevosEL / workers) * 100000).toFixed(2);
        const incidenciaEL = ((casosNuevosEL / workers) * 100000).toFixed(2);
        const ausentismoMedicoPct = progDays > 0 ? ((diasMedicosTotal / progDays) * 100).toFixed(2) : '0.00';
        const ausentismoTotalPct = progDays > 0 ? ((diasTotal / progDays) * 100).toFixed(2) : '0.00';

        // Financieros Mes
        let totalPerdidaNeta = 0;
        let totalRecobroEPS = 0;
        let totalRecobroARL = 0;
        let totalSeguridadSocialEmpresa = 0;
        let totalSeguridadSocialARL = 0;
        let totalPrestaciones = 0;
        let totalReemplazo = 0;
        let totalIndirectos = 0;

        events.forEach(e => {
            const fin = e.financiero || calculateEventFinancials(e);
            totalPerdidaNeta += (fin.perdidaNetaEmpresa || 0);
            totalRecobroEPS += (fin.montoRecobroEPS || 0);
            totalRecobroARL += (fin.montoRecobroARL || 0);
            totalSeguridadSocialEmpresa += (fin.costoSeguridadSocial || 0);
            totalSeguridadSocialARL += (fin.costoSeguridadSocialCubiertoARL || 0);
            totalPrestaciones += (fin.costoPrestacional || 0);
            totalReemplazo += (fin.costoReemplazo || 0);
            totalIndirectos += (fin.costoIndirectoIceberg || 0);
        });

        return {
            numAT,
            diasIncapacidadAT,
            diasCargados,
            numMortales,
            casosNuevosEL,
            diasIncapacidadEL,
            numEventosMedicosComunes: medComunEvents.length,
            diasMedComun,
            numLicencias: licEvents.length,
            diasLic,
            numPermisos: permisosEvents.length,
            diasPermisos,
            numNoJustif: noJustifEvents.length,
            diasNoJustif,
            diasMedicosTotal,
            diasTotal,
            // Indicadores
            if_accidentalidad,
            is_severidad,
            mortalidad,
            prevalenciaEL,
            incidenciaEL,
            ausentismoMedicoPct,
            ausentismoTotalPct,
            // Finanzas
            totalPerdidaNeta,
            totalRecobroEPS,
            totalRecobroARL,
            totalSeguridadSocialEmpresa,
            totalSeguridadSocialARL,
            totalPrestaciones,
            totalReemplazo,
            totalIndirectos
        };
    }, [currentData.events, currentData.numTrabajadores, currentData.diasProgramados]);

    // Save Logic (Persistence)
    const handleSaveData = async () => {
        if (!token) return;
        setIsSavingData(true);
        try {
            const res = await fetch('/api/sgsst/atel-data/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    year,
                    annualData
                }),
            });

            if (res.ok) {
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
            } else {
                throw new Error('Error en respuesta del servidor');
            }
        } catch (error) {
            console.error('Error saving annual data:', error);
            showToast({ message: 'Error al guardar los datos', status: 'error' });
        } finally {
            setIsSavingData(false);
        }
    };

    const handleGenerate = useCallback(async (scope: 'MONTH' | 'ANNUAL') => {
        const currentMonthData = annualData[currentMonthIndex];

        if (scope === 'MONTH' && !currentMonthData.numTrabajadores) {
            showToast({ message: 'Ingrese el N° de trabajadores para este mes', status: 'warning' });
            return;
        }

        handleSaveData();

        setIsGenerating(true);
        try {
            const payload = {
                scope,
                year,
                targetMonthIndex: currentMonthIndex,
                monthName: MONTHS[currentMonthIndex],
                annualData,
                modelName: selectedModel,
                userName: user?.name,
            };

            const response = await fetch('/api/sgsst/estadisticas/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el informe');
            }

            const data = await response.json();
            setGeneratedReport(data.report);
            editorContentRef.current = data.report;
            liveEditorRef.current?.setHTML(data.report);
            setConversationId('new');
            setReportMessageId(null);
            setIsFormExpanded(false);

            showToast({ message: `Informe ${scope === 'ANNUAL' ? 'Anual' : 'Mensual'} de Ausentismo & Pérdidas generado`, status: 'success', severity: 'success' });
        } catch (error: any) {
            console.error('Statistics generation error:', error);
            showToast({ message: error.message || 'Error al generar el informe', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [annualData, currentMonthIndex, year, selectedModel, token, user, showToast]);

    const handleSaveReport = useCallback(async () => {
        const contentToSave = editorContentRef.current || generatedReport;
        if (!contentToSave) {
            showToast({ message: t('com_ui_no_report_save', 'No hay informe para guardar'), status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: t('com_ui_error_unauthorized', 'Error: No autorizado'), status: 'error' });
            return;
        }

        const isNew = !conversationId || conversationId === 'new';
        if (!isPro && isNew) {
            try {
                const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-estadisticas-atel`, { headers: { Authorization: `Bearer ${token}` } });
                if (resCount.ok) {
                    const data = await resCount.json();
                    if (data.conversations?.length >= 1) {
                        setShowUpgradeModal(true);
                        return;
                    }
                }
            } catch (e) {}
        }
        
        try {
            const method = isNew ? 'POST' : 'PUT';

            const body = {
                content: contentToSave,
                ...(isNew ? {
                    title: `Gestión de Ausentismo & Pérdidas Financieras - ${MONTHS[currentMonthIndex]} ${year}`,
                    tags: ['sgsst-estadisticas-atel']
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
                editorContentRef.current = contentToSave;
                liveEditorRef.current?.setHTML(contentToSave);

                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContentRef.current, generatedReport, conversationId, reportMessageId, token, showToast, t, currentMonthIndex, year, isPro]);

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
            editorContentRef.current = content;
            liveEditorRef.current?.setHTML(content);
            setConversationId(convId);
            setReportMessageId(msgId);
            setIsHistoryOpen(false);
            showToast({ message: t('com_ui_report_loaded', 'Informe cargado'), status: 'info' });
        } else {
            showToast({ message: 'No se encontró contenido válido en el informe', status: 'warning' });
        }
    };

    useAutoLoadReport({
        token,
        tags: ['sgsst-estadisticas-atel'],
        generatedReport: generatedReport,
        handleSelectReport
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Toolbar */}
            <div className="flex flex-col items-start justify-center gap-4 p-4 rounded-2xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        <BarChart className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
                            Gestión Integral de Ausentismo, ATEL & Costos Laborales
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setYear(y => y - 1)}
                                    title="Año anterior"
                                    className="w-7 h-7 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 py-0.5 rounded-xl text-xs font-black font-mono bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs">
                                    {year}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setYear(y => y + 1)}
                                    title="Año siguiente"
                                    className="w-7 h-7 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <span className="text-xs text-text-secondary">| Res. 0312 Art. 30 · NTC 3793 · Factor Financiero IBC</span>
                            {activeCompanyInfo?.name && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/20 shadow-xs">
                                    <Building2 className="w-3 h-3 text-teal-500" />
                                    <span>Empresa: <strong>{activeCompanyInfo.name}</strong>{activeCompanyInfo.nit ? ` · NIT: ${activeCompanyInfo.nit}` : ''}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <SGSSTToolbar
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                    isHistoryOpen={isHistoryOpen}
                    aiButtons={[
                        {
                            id: 'generate-annual',
                            onClick: () => handleGenerate('ANNUAL'),
                            disabled: isGenerating,
                            title: `Generar Informe Anual de Ausentismo & Costos ${year}`,
                            label: "Generar Informe Anual",
                            icon: "sparkles",
                            variant: "ai",
                            isLoading: isGenerating
                        }
                    ]}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    onSaveLocal={handleSaveData}
                    isSavingLocal={isSavingData}
                    hasContent={!!(editorContentRef.current || generatedReport)}
                    exportContent={editorContentRef.current || generatedReport || ''}
                    exportFileName={`Informe_Ausentismo_ATEL_${MONTHS[currentMonthIndex]}_${year}`}
                    onDummy={handleDummyData}
                />
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-estadisticas-atel']}
                    />
                </div>
            )}

            {/* MAIN DASHBOARD */}
            <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <CalendarDays className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <span className="font-bold text-text-primary">
                            Consolidado de Ausentismo, ATEL & Finanzas ({year})
                        </span>
                        {isLoadingData && <span className="text-xs text-text-secondary animate-pulse ml-2">(Cargando datos...)</span>}
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="flex flex-col md:flex-row min-h-[550px] overflow-hidden">
                        {/* Month Selector Sidebar */}
                        <div className="w-full md:w-52 bg-surface-tertiary/20 border-b md:border-b-0 md:border-r border-border-medium flex md:flex-col overflow-x-auto md:overflow-visible">
                            <div className="p-3 bg-surface-primary/90 border-b border-border-medium flex flex-col gap-2.5 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-teal-500" />
                                        Año de Registro
                                    </span>
                                    <span className={`font-black text-[10px] px-2 py-0.5 rounded-full border ${totalYearEvents > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300'}`}>
                                        {totalYearEvents} {totalYearEvents === 1 ? 'evento' : 'eventos'}
                                    </span>
                                </div>

                                {/* Botonera Cápsula WAPPY para Selección de Año */}
                                <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm w-full">
                                    <button
                                        type="button"
                                        onClick={() => setYear(y => y - 1)}
                                        title="Año anterior"
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95 shrink-0"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <div className="flex-1 flex items-center justify-center px-1">
                                        <span className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs">
                                            Año {year}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setYear(y => y + 1)}
                                        title="Año siguiente"
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95 shrink-0"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Accesos directos a años registrados con badges estilo cápsula */}
                                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                                    {availableYears.sort().map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => setYear(y)}
                                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                                                year === y
                                                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs font-extrabold'
                                                    : 'border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
                                            }`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {MONTHS.map((month, index) => {
                                const mData = annualData[index];
                                const hasData = mData && (mData.events?.length > 0 || (mData.numTrabajadores !== '' && mData.numTrabajadores > 0));
                                return (
                                    <button
                                        key={month}
                                        onClick={() => setCurrentMonthIndex(index)}
                                        className={`flex-shrink-0 flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-4 ${currentMonthIndex === index
                                            ? 'bg-surface-primary border-teal-500 text-teal-600 dark:text-teal-400 shadow-sm font-bold'
                                            : 'border-transparent text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                                            }`}
                                    >
                                        <span>{month}</span>
                                        {hasData && <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area with Sub-Tabs */}
                        <div className="flex-1 p-4 md:p-6 space-y-5 bg-surface-primary/10 overflow-auto">
                            {/* Navegación por Sub-Tabs (WAPPY Design System) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-medium pb-3">
                                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-md shadow-slate-200/30 dark:shadow-none">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('novedades')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                                            activeTab === 'novedades'
                                                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs'
                                                : 'border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
                                        }`}
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>1. Novedades & Ausencias</span>
                                        {currentData.events?.length > 0 && (
                                            <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                                {currentData.events.length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('indicadores')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                                            activeTab === 'indicadores'
                                                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs'
                                                : 'border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
                                        }`}
                                    >
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>2. Indicadores ATEL (Res. 0312)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('financiero')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                                            activeTab === 'financiero'
                                                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-2xs'
                                                : 'border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
                                        }`}
                                    >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>3. Balance Financiero & Pérdidas por IBC</span>
                                    </button>
                                </div>

                                <div className="text-xs font-semibold text-text-secondary">
                                    Periodo activo: <span className="text-teal-600 dark:text-teal-400 font-bold">{MONTHS[currentMonthIndex]} {year}</span>
                                </div>
                            </div>

                            {/* TAB 1: NOVEDADES & CAPTURA */}
                            {activeTab === 'novedades' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    {/* Inputs de nómina mensual */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-primary/60 p-4 rounded-2xl border border-border-medium shadow-xs">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                                                <span>N° Trabajadores Promedio en el Mes</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={currentData?.numTrabajadores || ''}
                                                onChange={(e) => updateMonthData('numTrabajadores', Number(e.target.value))}
                                                placeholder="Ej: 52"
                                                className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary font-bold focus:border-teal-500 transition-colors"
                                            />
                                            <span className="text-[10px] text-text-tertiary">Muestra poblacional para tasas de frecuencia e incidencia.</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-text-primary">
                                                N° Días Laborales Programados en el Mes
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={currentData?.diasProgramados || ''}
                                                onChange={(e) => updateMonthData('diasProgramados', Number(e.target.value))}
                                                placeholder="Ej: 24"
                                                className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary font-bold focus:border-teal-500 transition-colors"
                                            />
                                            <span className="text-[10px] text-text-tertiary">Jornadas hábiles estándar para el cálculo del índice de ausentismo.</span>
                                        </div>
                                    </div>

                                    {/* Event Logger Mejorado */}
                                    <EventLogger
                                        events={currentData?.events || []}
                                        onChange={(events) => updateMonthData('events', events)}
                                        monthName={MONTHS[currentMonthIndex]}
                                    />
                                </div>
                            )}

                            {/* TAB 2: INDICADORES ATEL (RES. 0312 ART. 30) */}
                            {activeTab === 'indicadores' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {/* 1. Frecuencia */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Frecuencia de AT (IF)</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">Mensual</span>
                                            </div>
                                            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                                                {stats.if_accidentalidad}
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Fórmula: (N° AT / N° Trabajadores) × 100.
                                                <br />
                                                <strong>{stats.numAT}</strong> accidentes sobre <strong>{currentData.numTrabajadores || 1}</strong> trabajadores.
                                            </p>
                                        </div>

                                        {/* 2. Severidad */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Severidad de AT (IS)</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">Mensual</span>
                                            </div>
                                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                                                {stats.is_severidad}
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Fórmula: ((Días Incap AT + Cargados) / N° Trab.) × 100.
                                                <br />
                                                <strong>{stats.diasIncapacidadAT + stats.diasCargados}</strong> días perdidos + cargados.
                                            </p>
                                        </div>

                                        {/* 3. Mortalidad */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Mortalidad de AT</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300">Anual</span>
                                            </div>
                                            <div className="text-2xl font-black text-text-primary font-mono">
                                                {stats.mortalidad}%
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Fórmula: (AT Mortales / Total AT) × 100.
                                                <br />
                                                Meta legal: <strong>0.00%</strong>.
                                            </p>
                                        </div>

                                        {/* 4. Prevalencia EL */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Prevalencia Enf. Laboral</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300">Anual</span>
                                            </div>
                                            <div className="text-2xl font-black text-text-primary font-mono">
                                                {stats.prevalenciaEL}
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Por cada 100.000 trabajadores. Casos activos: <strong>{stats.casosNuevosEL}</strong>.
                                            </p>
                                        </div>

                                        {/* 5. Incidencia EL */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Incidencia Enf. Laboral</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300">Anual</span>
                                            </div>
                                            <div className="text-2xl font-black text-text-primary font-mono">
                                                {stats.incidenciaEL}
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Por cada 100.000 trabajadores. Casos nuevos diagnosticados: <strong>{stats.casosNuevosEL}</strong>.
                                            </p>
                                        </div>

                                        {/* 6. Ausentismo Médico Res. 0312 */}
                                        <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium shadow-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-text-secondary uppercase">Ausentismo por Causa Médica</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">Mensual</span>
                                            </div>
                                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                                                {stats.ausentismoMedicoPct}%
                                            </div>
                                            <p className="text-[11px] text-text-secondary">
                                                Fórmula: (Días Ausencia Médica / Días Programados) × 100.
                                                <br />
                                                Total días incapacidad médica: <strong>{stats.diasMedicosTotal}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: BALANCE FINANCIERO & PÉRDIDAS POR IBC */}
                            {activeTab === 'financiero' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    {/* Tarjetas Principales de Balance Financiero */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 via-surface-primary to-surface-primary border border-red-500/30 shadow-xs space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                                <DollarSign className="w-4 h-4" /> Pérdida Neta Empresa
                                            </span>
                                            <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
                                                ${stats.totalPerdidaNeta.toLocaleString('es-CO')}
                                            </div>
                                            <p className="text-[10px] text-text-secondary">
                                                Costo directo no recuperable asumido por la compañía en el mes.
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-surface-primary to-surface-primary border border-emerald-500/30 shadow-xs space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <Coins className="w-4 h-4" /> Subsidios Radicados / Recobro
                                            </span>
                                            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                                ${(stats.totalRecobroEPS + stats.totalRecobroARL).toLocaleString('es-CO')}
                                            </div>
                                            <p className="text-[10px] text-text-secondary">
                                                EPS: ${stats.totalRecobroEPS.toLocaleString('es-CO')} · ARL: ${stats.totalRecobroARL.toLocaleString('es-CO')}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface-primary to-surface-primary border border-amber-500/30 shadow-xs space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <ShieldAlert className="w-4 h-4" /> Seg. Social Patronal
                                            </span>
                                            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                                                ${stats.totalSeguridadSocialEmpresa.toLocaleString('es-CO')}
                                            </div>
                                            <p className="text-[10px] text-text-secondary">
                                                Aportes patronales EPS/LNR. En ARL: $0 (Ley 776/02 cubre 100%).
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-surface-primary to-surface-primary border border-purple-500/30 shadow-xs space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                                <PieChart className="w-4 h-4" /> Pasivo Prestacional
                                            </span>
                                            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                                                ${stats.totalPrestaciones.toLocaleString('es-CO')}
                                            </div>
                                            <p className="text-[10px] text-text-secondary">
                                                Cesantías, prima, intereses y vacaciones causadas en ausencia.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Cuadro Educativo: EPS vs ARL */}
                                    <div className="p-4 rounded-2xl bg-surface-primary border border-border-medium space-y-3">
                                        <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-teal-500" />
                                            Manejo Diferenciado de Incapacidades en Colombia (EPS vs. ARL)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 rounded-xl bg-surface-secondary border border-border-medium space-y-1.5">
                                                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                    Incapacidad Común (EPS / Decreto 2943/2013)
                                                </div>
                                                <ul className="text-text-secondary space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                                                    <li><strong>Días 1 y 2:</strong> 100% asumidos por la empresa (CST Art. 227).</li>
                                                    <li><strong>Día 3+:</strong> EPS reconoce el 66.67% (piso 1 SMMLV diario).</li>
                                                    <li><strong>Aportes a Pensión (12%):</strong> A cargo exclusivo de la empresa.</li>
                                                    <li><strong>Plazo de giro:</strong> 15 días hábiles tras radicación completa.</li>
                                                </ul>
                                            </div>

                                            <div className="p-3 rounded-xl bg-surface-secondary border border-border-medium space-y-1.5">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    Incapacidad Laboral (ARL / Ley 776 de 2002 Art. 3)
                                                </div>
                                                <ul className="text-text-secondary space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                                                    <li><strong>Subsidio al 100%:</strong> La ARL cubre el 100% del IBC desde el día 1 posterior.</li>
                                                    <li><strong>Seguridad Social:</strong> ¡La ARL asume el 100% de aportes a Salud y Pensión!</li>
                                                    <li><strong>Costo de nómina para la empresa:</strong> $0 COP (la empresa solo financia nómina y recobra).</li>
                                                    <li><strong>Requisito legal:</strong> Radicar FURAT dentro de las 48 horas hábiles.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Generación Inteligente y Botones de Acción */}
                            <div className="pt-4 border-t border-border-medium/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="text-xs text-text-secondary flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                                    <span>Genera un informe con balanza de pérdidas en COP ($) y las 6 fórmulas normativas.</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleGenerate('MONTH')}
                                        disabled={isGenerating || !currentData.numTrabajadores}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                                        ) : (
                                            <Calendar className="h-4 w-4 text-teal-600" />
                                        )}
                                        <span>Informe Mensual ({MONTHS[currentMonthIndex]})</span>
                                    </button>

                                    <button
                                        onClick={() => handleGenerate('ANNUAL')}
                                        disabled={isGenerating || !currentData.numTrabajadores}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                        <span>Informe Anual {year}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Report - LiveEditor */}
            <div className="mt-4">
                <CollapsibleReportBox
                    onSave={handleSaveReport}
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                    isHistoryOpen={isHistoryOpen}
                    title={`Informe de Gestión de Ausentismo & Pérdidas Financieras — ${MONTHS[currentMonthIndex]} ${year}`}
                    icon={<BarChart className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                    actions={
                        <ExportDropdown
                            content={editorContentRef.current || generatedReport || ''}
                            fileName={`Informe_Ausentismo_ATEL_${MONTHS[currentMonthIndex]}_${year}`}
                            reportType="general"
                        />
                    }
                >
                    <div className="w-full min-w-0">
                        <LiveEditor
                            ref={liveEditorRef}
                            paperMode={true}
                            initialContent={generatedReport}
                            onUpdate={(html) => { editorContentRef.current = html; }}
                            reportSourceData={annualData}
                        />
                    </div>
                </CollapsibleReportBox>
            </div>
        
            {/* Upgrade Modal (Freemium Teaser) */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowUpgradeModal(false)} 
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
                        >
                            Cerrar ✕
                        </button>
                        <div className="bg-surface-primary rounded-3xl shadow-2xl overflow-hidden">
                            <UpgradeWall
                                title="Límite Gratuito Alcanzado"
                                description="Has alcanzado el límite para este módulo. Adquiere Premium para generar registros ilimitados."
                                plan="USER_IPEVAR"
                                isCompact={true}
                                hideFeatures={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstadisticasATEL;
