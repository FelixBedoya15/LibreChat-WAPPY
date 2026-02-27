import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    Target,
    ScrollText,
    Scale,
    ChevronDown,
    ChevronRight,
    Stethoscope
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

const ObjetivosSST = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [policySummary, setPolicySummary] = useState('');
    const [diagnosticSummary, setDiagnosticSummary] = useState('');
    const [additionalNorms, setAdditionalNorms] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // Generated objectives
    const [generatedObjectives, setGeneratedObjectives] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Expand/collapse form
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/objetivos/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    policySummary,
                    diagnosticSummary,
                    additionalNorms,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar los Objetivos');
            }

            const data = await response.json();
            setGeneratedObjectives(data.objectives);
            setEditorContent(data.objectives);
            setIsFormExpanded(false);
            showToast({ message: 'Objetivos SST generados exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Objectives generation error:', error);
            showToast({ message: error.message || 'Error al generar los objetivos', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [policySummary, diagnosticSummary, additionalNorms, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedObjectives;
        if (!contentToSave) {
            showToast({ message: 'No hay objetivos para guardar', status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: 'Error: No autorizado', status: 'error' });
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
                    showToast({ message: 'Objetivos actualizados exitosamente', status: 'success' });
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
                    title: `Objetivos SST - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-objetivos'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Objetivos guardados exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedObjectives, conversationId, reportMessageId, token, showToast]);

    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        if (!selectedConvoId) return;

        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();

            // Find the last message with content
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setGeneratedObjectives(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Objetivos cargados correctamente', status: 'success' });
            }
        } catch (e) {
            console.error('Load objectives error:', e);
            showToast({ message: 'Error al cargar los objetivos', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    const formFields = [
        {
            id: 'policySummary',
            label: 'Resumen o Directrices de la Política SST',
            icon: ScrollText,
            value: policySummary,
            setter: setPolicySummary,
            placeholder: 'Ej: Prevención de accidentes, cuidado de la salud mental... (Si lo deja en blanco, la IA inferirá objetivos genéricos de la norma)',
            rows: 3,
        },
        {
            id: 'diagnosticSummary',
            label: 'Resultados del Diagnóstico Inicial',
            icon: Stethoscope,
            value: diagnosticSummary,
            setter: setDiagnosticSummary,
            placeholder: 'Ej: Debilidades en el plan de emergencias, falta de capacitaciones... (Opcional)',
            rows: 3,
        },
        {
            id: 'additionalNorms',
            label: 'Marco Normativo Adicional',
            icon: Scale,
            value: additionalNorms,
            setter: setAdditionalNorms,
            placeholder: 'Ej: Decreto 1072 de 2015, Resolución 0312 de 2019 (dejar vacío para usar el estándar)',
            rows: 2,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
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
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="h-5 w-5" />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                        Generar Objetivos IA
                    </span>
                </button>
                <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    disabled={isGenerating}
                />
                {generatedObjectives && (
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
                            content={editorContent || generatedObjectives || ''}
                            fileName="Objetivos_SST"
                        />
                    </>
                )}
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-objetivos']}
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
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos para Generar los Objetivos</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <p className="text-sm text-blue-800 dark:text-blue-300 mb-1 font-medium flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Integración Automática de Módulos
                            </p>
                            <p className="text-sm text-text-secondary">
                                La IA buscará automáticamente los peligros desde su <strong>Matriz de Peligros</strong> y la información de accidentabilidad desde el módulo <strong>Estadísticas ATEL</strong> para cruzarlos e inyectarlos directamente en la formulación de los Objetivos, cumpliendo con los requisitos del Decreto 1072. Todos los campos a continuación son opcionales.
                            </p>
                        </div>

                        {formFields.map((field) => {
                            const Icon = field.icon;
                            return (
                                <div key={field.id} className="space-y-1.5">
                                    <label
                                        htmlFor={field.id}
                                        className="flex items-center gap-2 text-sm font-medium text-text-primary"
                                    >
                                        <Icon className="h-4 w-4 text-text-secondary" />
                                        {field.label}
                                    </label>
                                    <textarea
                                        id={field.id}
                                        value={field.value}
                                        onChange={(e) => field.setter(e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows}
                                        className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-center pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-5 w-5" />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                    Generar Objetivos con IA
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Objectives - LiveEditor */}
            {generatedObjectives && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Objetivos SST Generados
                        </h3>
                        <span className="text-xs text-text-secondary">Puedes editar el contenido directamente</span>
                    </div>

                    <div className="rounded-xl p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    initialContent={generatedObjectives}
                                    onUpdate={(html) => setEditorContent(html)}
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                        <style>{`
                            [contenteditable] table {
                                width: 100%;
                                min-width: 650px;
                                border-collapse: separate;
                                border-spacing: 0;
                                table-layout: auto;
                                border-radius: 12px;
                                overflow: hidden;
                                border: 1px solid var(--border-medium, #ddd);
                            }
                            [contenteditable] table td,
                            [contenteditable] table th {
                                padding: 8px 12px;
                                border-bottom: 1px solid var(--border-medium, #ddd);
                                border-right: 1px solid var(--border-medium, #eee);
                                word-wrap: break-word;
                            }
                            [contenteditable] table td:last-child,
                            [contenteditable] table th:last-child {
                                border-right: none;
                            }
                            [contenteditable] table tr:last-child td {
                                border-bottom: none;
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObjetivosSST;
