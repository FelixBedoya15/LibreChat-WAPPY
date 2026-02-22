import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    History,
    BarChart,
    ChevronDown,
    ChevronRight,
    Calculator,
    Loader2,
    Calendar,
    CalendarDays,
    Database, // New icon for data persistence
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import EventLogger, { ATELContext } from './EventLogger';

interface MonthData {
    numTrabajadores: number | '';
    diasProgramados: number | '';
    events: ATELContext[];
    // Cached totals (optional, can be calculated on fly)
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const EstadisticasATEL = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Annual State: 0-11 index
    const [year, setYear] = useState(new Date().getFullYear());
    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
    const [annualData, setAnnualData] = useState<Record<number, MonthData>>(() => {
        const initial: Record<number, MonthData> = {};
        MONTHS.forEach((_, i) => {
            initial[i] = { numTrabajadores: '', diasProgramados: '', events: [] };
        });
        return initial;
    });

    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingData, setIsSavingData] = useState(false); // New persistence state
    const [isLoadingData, setIsLoadingData] = useState(false); // New persistence state
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Load Data Effect
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setIsLoadingData(true);
            try {
                const res = await fetch(`/api/sgsst/atel-data/${year}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.months) {
                        // Merge loaded data with default structure to ensure all months exist
                        setAnnualData(prev => {
                            const merged: Record<number, MonthData> = { ...prev };
                            Object.keys(data.months).forEach(key => {
                                merged[Number(key)] = data.months[key];
                            });
                            return merged;
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading annual data:', error);
                showToast({ message: 'Error al cargar datos guardados', status: 'error' });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [year, token, showToast]);

    // Helpers to update current month data
    const updateMonthData = (field: keyof MonthData, value: any) => {
        setAnnualData(prev => ({
            ...prev,
            [currentMonthIndex]: { ...prev[currentMonthIndex], [field]: value }
        }));
    };

    // Calculate totals for current month based on events
    const currentData = annualData[currentMonthIndex];
    const stats = useMemo(() => {
        const events = currentData.events || [];
        return {
            numAT: events.filter(e => e.tipo === 'AT').length,
            diasIncapacidadAT: events.filter(e => e.tipo === 'AT').reduce((sum, e) => sum + (e.diasIncapacidad || 0), 0),
            diasCargados: events.filter(e => e.tipo === 'AT').reduce((sum, e) => sum + (e.diasCargados || 0), 0),
            casosNuevosEL: events.filter(e => e.tipo === 'EL').length,
            casosAntiguosEL: 0,
            diasAusencia: events.filter(e => e.tipo === 'Ausentismo').reduce((sum, e) => sum + (e.diasIncapacidad || 0), 0),
        };
    }, [currentData.events]); // Use specific dependency to avoid loop

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
                showToast({ message: 'Datos guardados correctamente', status: 'success' });
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

        // Basic validation
        if (scope === 'MONTH' && !currentMonthData.numTrabajadores) {
            showToast({ message: 'Ingrese el N° de trabajadores para este mes', status: 'warning' });
            return;
        }

        // Auto-save data before generating to ensure consistency
        handleSaveData();

        setIsGenerating(true);
        try {
            // Prepare payload
            const payload = {
                scope,
                year,
                targetMonthIndex: currentMonthIndex,
                monthName: MONTHS[currentMonthIndex],
                annualData, // Send all months
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
            setEditorContent(data.report);
            setIsFormExpanded(false);

            // Reset context for new save
            setConversationId('new');
            setReportMessageId(null);

            showToast({ message: `Informe ${scope === 'ANNUAL' ? 'Anual' : 'Mensual'} generado exitosamente`, status: 'success' });
        } catch (error: any) {
            console.error('Statistics generation error:', error);
            showToast({ message: error.message || 'Error al generar el informe', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [annualData, currentMonthIndex, year, selectedModel, token, user, showToast]);

    const handleSaveReport = useCallback(async () => {
        const contentToSave = editorContent || generatedReport;
        if (!contentToSave) {
            showToast({ message: t('com_ui_no_report_save', 'No hay informe para guardar'), status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: t('com_ui_error_unauthorized', 'Error: No autorizado'), status: 'error' });
            return;
        }

        try {
            const isNew = !conversationId || conversationId === 'new';
            const method = isNew ? 'POST' : 'PUT';

            const body = {
                content: contentToSave,
                ...(isNew ? {
                    title: `Estadísticas ATEL (Informe) - ${MONTHS[currentMonthIndex]} ${year}`,
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
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Informe guardado exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, t, currentMonthIndex, year]);

    const handleSelectReport = async (reportOrId: any) => {
        let content = '';
        let convId = '';
        let msgId = '';

        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                // Fetch messages for this conversation
                const res = await fetch(`/api/messages/${convId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const messages = await res.json();

                    // Logic to find the correct message with content
                    // Usually the last assistant message is the report
                    // Or filter by sender 'SGSST Diagnóstico'
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' ||
                        (m.isCreatedByUser === false && m.text && m.text.includes('<html')) ||
                        (m.isCreatedByUser === false && m.text && m.text.length > 100)
                    );

                    if (reportMsg) {
                        content = reportMsg.text;
                        msgId = reportMsg.messageId;
                    } else {
                        // Fallback: try taking the very last message text
                        const last = messages[0]; // reversed
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
            showToast({ message: t('com_ui_report_loaded', 'Informe cargado'), status: 'info' });
        } else {
            showToast({ message: 'No se encontró contenido válido en el informe', status: 'warning' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <BarChart className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Gestión de Indicadores ATEL</h2>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="text-sm font-semibold bg-transparent border-none w-16 p-0 focus:ring-0 text-text-secondary"
                            />
                            <span className="text-sm text-text-secondary">| Res. 0312 Art. 30</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Guardar Datos (Persistencia) */}
                    <button
                        onClick={handleSaveData}
                        disabled={isSavingData}
                        title="Guardar cambios en los datos (eventos)"
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                    >
                        {isSavingData ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-gray-500 group-hover:text-blue-500" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Guardar Datos
                        </span>
                    </button>

                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                    >
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            {t('com_ui_history', 'Historial Informes')}
                        </span>
                    </button>
                    {generatedReport && (
                        <>
                            <button
                                onClick={handleSaveReport}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                            >
                                <Save className="h-5 w-5" />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                    {t('com_ui_save', 'Guardar Informe')}
                                </span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Estadisticas_ATEL_${MONTHS[currentMonthIndex]}_${year}`}
                            />
                        </>
                    )}
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
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
                        tags={['sgsst-estadisticas-atel']}
                    />
                </div>
            )}

            {/* MAIN DASHBOARD */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">
                            Registro Mensual de Eventos
                        </span>
                        {isLoadingData && <span className="text-xs text-text-secondary animate-pulse ml-2">(Cargando datos...)</span>}
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="flex flex-col md:flex-row min-h-[500px] overflow-hidden">
                        {/* Month Selector Sidebar (Desktop) or Scroll (Mobile) */}
                        <div className="w-full md:w-48 bg-surface-tertiary/20 border-b md:border-b-0 md:border-r border-border-medium flex md:flex-col overflow-x-auto md:overflow-visible">
                            {MONTHS.map((month, index) => {
                                const mData = annualData[index];
                                const hasData = mData && (mData.events?.length > 0 || (mData.numTrabajadores !== '' && mData.numTrabajadores > 0));
                                return (
                                    <button
                                        key={month}
                                        onClick={() => setCurrentMonthIndex(index)}
                                        className={`flex-shrink-0 flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-4 ${currentMonthIndex === index
                                            ? 'bg-surface-primary border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'border-transparent text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                                            }`}
                                    >
                                        <span>{month}</span>
                                        {hasData && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-4 md:p-6 space-y-6 bg-surface-primary/10 overflow-auto">
                            {/* 1. Basic Stats Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-text-secondary">N° Trabajadores (Promedio) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={currentData?.numTrabajadores || ''}
                                        onChange={(e) => updateMonthData('numTrabajadores', Number(e.target.value))}
                                        placeholder="Ej: 50"
                                        className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-text-secondary">N° Días Programados (Trabajo)</label>
                                    <input
                                        type="number"
                                        value={currentData?.diasProgramados || ''}
                                        onChange={(e) => updateMonthData('diasProgramados', Number(e.target.value))}
                                        placeholder="Ej: 24"
                                        className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* 2. Event Logger */}
                            <EventLogger
                                events={currentData?.events || []}
                                onChange={(events) => updateMonthData('events', events)}
                                monthName={MONTHS[currentMonthIndex]}
                            />

                            {/* 3. Auto-calculated Summary Badge */}
                            <div className="flex flex-wrap gap-2 text-xs text-text-secondary p-3 bg-surface-tertiary rounded-lg border border-border-medium">
                                <span className="font-semibold text-text-primary">Resumen Mes:</span>
                                <span>AT: <strong className="text-blue-600">{stats.numAT}</strong></span> •
                                <span>EL: <strong className="text-green-600">{stats.casosNuevosEL}</strong></span> •
                                <span>Incap: <strong className="text-amber-600">{stats.diasIncapacidadAT + stats.diasAusencia}</strong> días</span>
                            </div>

                            {/* 4. Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-medium/50">
                                <button
                                    onClick={() => handleGenerate('MONTH')}
                                    disabled={isGenerating || !currentData.numTrabajadores}
                                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Calendar className="h-5 w-5" />
                                    )}
                                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                        Informe Mensual ({MONTHS[currentMonthIndex]})
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleGenerate('ANNUAL')}
                                    disabled={isGenerating || !currentData.numTrabajadores}
                                    className="group flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-transparent rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-5 w-5" />
                                    )}
                                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                        Informe Anual Acumulado {year}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Report - LiveEditor */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Informe Generado ({MONTHS[currentMonthIndex]})
                        </h3>
                        <span className="text-xs text-text-secondary">Edita directamente antes de guardar</span>
                    </div>
                    <div className="h-[800px]">
                        <LiveEditor
                            key={reportMessageId || 'editor'}
                            initialContent={generatedReport}
                            onUpdate={(html) => setEditorContent(html)}
                            onSave={handleSaveReport}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstadisticasATEL;
