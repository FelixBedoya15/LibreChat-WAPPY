import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

const EstadisticasATEL = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [periodo, setPeriodo] = useState('');
    const [numTrabajadores, setNumTrabajadores] = useState<number | ''>('');
    const [numAT, setNumAT] = useState<number | ''>('');
    const [diasIncapacidadAT, setDiasIncapacidadAT] = useState<number | ''>('');
    const [diasCargados, setDiasCargados] = useState<number | ''>('');
    const [numATMortales, setNumATMortales] = useState<number | ''>('');
    const [totalATAnual, setTotalATAnual] = useState<number | ''>('');
    const [casosNuevosEL, setCasosNuevosEL] = useState<number | ''>('');
    const [casosAntiguosEL, setCasosAntiguosEL] = useState<number | ''>('');
    const [diasAusencia, setDiasAusencia] = useState<number | ''>('');
    const [diasProgramados, setDiasProgramados] = useState<number | ''>('');

    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleGenerate = useCallback(async () => {
        if (!numTrabajadores) {
            showToast({ message: 'El número de trabajadores es obligatorio', status: 'warning' });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/estadisticas/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    periodo,
                    numTrabajadores,
                    numAT,
                    diasIncapacidadAT,
                    diasCargados,
                    numATMortales,
                    totalATAnual,
                    casosNuevosEL,
                    casosAntiguosEL,
                    diasAusencia,
                    diasProgramados,
                    modelName: selectedModel,
                    userName: user?.name,
                }),
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

            showToast({ message: 'Informe de Estadísticas generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Statistics generation error:', error);
            showToast({ message: error.message || 'Error al generar el informe', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [
        periodo, numTrabajadores, numAT, diasIncapacidadAT, diasCargados,
        numATMortales, totalATAnual, casosNuevosEL, casosAntiguosEL,
        diasAusencia, diasProgramados, selectedModel, token, user, showToast
    ]);

    const handleSave = useCallback(async () => {
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
            // Updated Logic: Always use POST if conversationId is 'new'
            const isNew = !conversationId || conversationId === 'new';
            const method = isNew ? 'POST' : 'PUT';

            const body = {
                content: contentToSave,
                ...(isNew ? {
                    title: `Estadísticas ATEL - ${periodo || new Date().toLocaleDateString('es-CO')}`,
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
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, t, periodo]);

    const handleSelectReport = (report: any) => {
        if (report && report.content) {
            setGeneratedReport(report.content);
            setEditorContent(report.content);
            setConversationId(report.conversationId);
            setReportMessageId(report.messageId);
            setIsHistoryOpen(false);
            showToast({ message: t('com_ui_report_loaded', 'Informe cargado'), status: 'info' });
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
                        <h2 className="text-lg font-bold text-text-primary">Estadísticas ATEL (Res. 0312 Art. 30)</h2>
                        <p className="text-sm text-text-secondary">Cálculo y análisis de indicadores mínimos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                        onClick={handleGenerate}
                        disabled={isGenerating || !numTrabajadores}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="h-5 w-5" />
                        )}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Generar Informe IA
                        </span>
                    </button>
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
                    {generatedReport && (
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
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName={`Estadisticas_ATEL_${periodo || 'SGSST'}`}
                            />
                        </>
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
                        tags={['sgsst-estadisticas-atel']}
                    />
                </div>
            )}

            {/* Input Form */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary flex items-center gap-2">
                            Datos para Cálculo de Indicadores
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">Res 0312</span>
                        </span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-primary">Periodo Evaluado</label>
                                <input
                                    type="text"
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value)}
                                    placeholder="Ej: Febrero 2026"
                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-primary">N° Trabajadores (Promedio) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={numTrabajadores}
                                    onChange={(e) => setNumTrabajadores(Number(e.target.value))}
                                    placeholder="Ej: 50"
                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-border-medium/50">
                            {/* Accidentes Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Accidentes de Trabajo (AT)
                                </h4>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">N° AT en el mes</label>
                                    <input type="number" value={numAT} onChange={(e) => setNumAT(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Días Incapacidad por AT</label>
                                    <input type="number" value={diasIncapacidadAT} onChange={(e) => setDiasIncapacidadAT(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Días Cargados (Muerte/Invalidez)</label>
                                    <input type="number" value={diasCargados} onChange={(e) => setDiasCargados(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">N° AT Mortales (Año) - Anual</label>
                                    <input type="number" value={numATMortales} onChange={(e) => setNumATMortales(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Total AT (Año) - Anual</label>
                                    <input type="number" value={totalATAnual} onChange={(e) => setTotalATAnual(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                            </div>

                            {/* Enfermedad Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Enfermedad Laboral (EL)
                                </h4>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Casos Nuevos EL (Periodo)</label>
                                    <input type="number" value={casosNuevosEL} onChange={(e) => setCasosNuevosEL(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Casos Antiguos EL (Activos)</label>
                                    <input type="number" value={casosAntiguosEL} onChange={(e) => setCasosAntiguosEL(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                            </div>

                            {/* Ausentismo Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Ausentismo Médico
                                </h4>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Días Ausencia (Incapacidad)</label>
                                    <input type="number" value={diasAusencia} onChange={(e) => setDiasAusencia(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-text-secondary">Días Programados (Trabajo)</label>
                                    <input type="number" value={diasProgramados} onChange={(e) => setDiasProgramados(Number(e.target.value))} className="w-full rounded border border-border-medium bg-surface-primary px-2 py-1.5 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !numTrabajadores}
                                className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                                )}
                                Generar Informe de Indicadores
                            </button>
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
                            Informe de Estadísticas Generado
                        </h3>
                        <span className="text-xs text-text-secondary">Edita directamente el informe</span>
                    </div>
                    <div className="h-[800px]">
                        <LiveEditor
                            initialContent={generatedReport}
                            onUpdate={(html) => setEditorContent(html)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstadisticasATEL;
