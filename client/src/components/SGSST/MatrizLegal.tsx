import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';

const MatrizLegal = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [activity, setActivity] = useState('');
    const [location, setLocation] = useState(''); // Specific city/department can affect norms
    const [entityType, setEntityType] = useState('private'); // private, public, mixed
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMatrix, setGeneratedMatrix] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleGenerate = useCallback(async () => {
        if (!activity.trim()) {
            showToast({ message: 'Ingrese la actividad económica específica', status: 'warning' });
            return;
        }

        setIsGenerating(true);
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
            setIsFormExpanded(false);
            showToast({ message: 'Matriz Legal generada exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Matrix generation error:', error);
            showToast({ message: error.message || 'Error al generar la matriz', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [activity, location, entityType, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedMatrix;
        if (!contentToSave) {
            showToast({ message: t('com_ui_no_report_save', 'No hay matriz para guardar'), status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: t('com_ui_error_unauthorized', 'Error: No autorizado'), status: 'error' });
            return;
        }

        try {
            // Update existing
            if (conversationId && conversationId !== 'new' && reportMessageId) {
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
                    showToast({ message: 'Matriz actualizada exitosamente', status: 'success' });
                } else {
                    const err = await res.json();
                    showToast({ message: `Error al actualizar: ${err.error || res.status}`, status: 'error' });
                }
                return;
            }

            // Create new
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Matriz Legal - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-matriz-legal'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Matriz guardada exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedMatrix, conversationId, reportMessageId, token, showToast, t]);

    const handleExportWord = useCallback(async () => {
        const contentForExport = editorContent || generatedMatrix;
        if (!contentForExport) return;

        try {
            const { exportToWord } = await import('~/utils/wordExport');
            await exportToWord(contentForExport, `Matriz_Legal_SGSST_${new Date().toISOString().split('T')[0]}`);
            showToast({ message: t('com_ui_export_success', 'Exportación exitosa'), status: 'success' });
        } catch (error) {
            console.error('Export error:', error);
            showToast({ message: t('com_ui_export_error', 'Error al exportar'), status: 'error' });
        }
    }, [editorContent, generatedMatrix, showToast, t]);

    const handleSelectReport = (report: any) => {
        if (report && report.content) {
            setGeneratedMatrix(report.content);
            setEditorContent(report.content);
            setConversationId(report.conversationId);
            setReportMessageId(report.messageId);
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
                        <p className="text-sm text-text-secondary">Identificación de requisitos normativos</p>
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
                        disabled={isGenerating || !activity.trim()}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="h-5 w-5" />
                        )}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Generar Matriz IA
                        </span>
                    </button>
                    <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        disabled={isGenerating}
                    />
                    {generatedMatrix && (
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

            {/* Input Form */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos para Generar la Matriz Legal</span>
                    </div>
                    {activity.trim() && (
                        <span className="text-xs text-green-600 font-medium">✓ Datos ingresados</span>
                    )}
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-text-secondary mb-4">
                            Complete la información para generar la Matriz Legal personalizada. La <strong>Actividad Económica</strong> es obligatoria para identificar las normas sectoriales aplicables.
                        </p>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                                <Search className="h-4 w-4 text-text-secondary" />
                                Actividad Económica Específica <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                                placeholder="Ej: Construcción de edificios residenciales, Transporte de carga terrestre..."
                                rows={2}
                                className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-primary">Ubicación (Ciudad/Depto) - Opcional</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Ej: Bogotá D.C."
                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-primary">Tipo de Entidad</label>
                                <select
                                    value={entityType}
                                    onChange={(e) => setEntityType(e.target.value)}
                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="private">Privada</option>
                                    <option value="public">Pública</option>
                                    <option value="mixed">Mixta</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !activity.trim()}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-5 w-5" />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                    Generar Matriz con IA
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Matrix - LiveEditor */}
            {generatedMatrix && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Matriz Legal Generada
                        </h3>
                        <span className="text-xs text-text-secondary">Edita directamente en la tabla</span>
                    </div>
                    <div className="h-[600px]">
                        <LiveEditor
                            initialContent={generatedMatrix}
                            onUpdate={(html) => setEditorContent(html)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatrizLegal;
