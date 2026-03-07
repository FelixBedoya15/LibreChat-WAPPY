import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    ShieldAlert,
    ScrollText,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Users
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

const ReglamentoHigiene = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [identifiedRisks, setIdentifiedRisks] = useState('');
    const [workShifts, setWorkShifts] = useState('');
    const [additionalRules, setAdditionalRules] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // Generated content
    const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
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
            const response = await fetch('/api/sgsst/rhs/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    identifiedRisks,
                    workShifts,
                    additionalRules,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el Reglamento');
            }

            const data = await response.json();
            setGeneratedDocument(data.document);
            setEditorContent(data.document);
            setIsFormExpanded(false);
            showToast({ message: 'Reglamento generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('RHS generation error:', error);
            showToast({ message: error.message || 'Error al generar el reglamento', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [identifiedRisks, workShifts, additionalRules, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedDocument;
        if (!contentToSave) {
            showToast({ message: 'No hay documento para guardar', status: 'warning' });
            return;
        }
        if (!token) {
            showToast({ message: 'Error: No autorizado', status: 'error' });
            return;
        }

        try {
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
                    showToast({ message: 'Reglamento actualizado exitosamente', status: 'success' });
                } else {
                    const err = await res.json();
                    showToast({ message: `Error al actualizar: ${err.error || res.status}`, status: 'error' });
                }
                return;
            }

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Reglamento de Higiene y Seguridad Industrial - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-rhs'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Reglamento guardado exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedDocument, conversationId, reportMessageId, token, showToast]);

    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        if (!selectedConvoId) return;

        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();

            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setGeneratedDocument(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Reglamento cargado correctamente', status: 'success' });
            }
        } catch (e) {
            console.error('Load report error:', e);
            showToast({ message: 'Error al cargar el reglamento', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    const formFields = [
        {
            id: 'identifiedRisks',
            label: 'Riesgos Críticos Identificados',
            icon: AlertTriangle,
            value: identifiedRisks,
            setter: setIdentifiedRisks,
            placeholder: 'La IA los buscará desde su Matriz de Peligros, pero puede indicar prioridades aquí. (Opcional)',
            rows: 3,
        },
        {
            id: 'workShifts',
            label: 'Jornadas laborales, Turnos y Áreas especiales',
            icon: Users,
            value: workShifts,
            setter: setWorkShifts,
            placeholder: 'Ej: Turnos rotativos 24/7, Trabajo en campo, etc. (Opcional)',
            rows: 2,
        },
        {
            id: 'additionalRules',
            label: 'Directrices Internas o Disposiciones Adicionales',
            icon: ScrollText,
            value: additionalRules,
            setter: setAdditionalRules,
            placeholder: 'Ej: Prácticas cero tolerancia con sustancias estupefacientes... (Opcional)',
            rows: 3,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <History className="h-5 w-5" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                        Historial
                    </span>
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="h-5 w-5" />
                    )}
                    <span>Generar Reglamento con IA</span>
                </button>
                <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    disabled={isGenerating}
                />
                {generatedDocument && (
                    <>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <Save className="h-5 w-5" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                Guardar
                            </span>
                        </button>
                        <ExportDropdown
                            content={editorContent || generatedDocument || ''}
                            fileName="Reglamento_Higiene_Seguridad_Industrial"
                        />
                    </>
                )}
            </div>

            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-rhs']}
                    />
                </div>
            )}

            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos para el Reglamento de Higiene y Seguridad Industrial</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm transition-all duration-300">
                            <h4 className="text-sm text-blue-800 dark:text-blue-300 mb-2 font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 animate-pulse text-blue-500" />
                                Generación Inteligente
                            </h4>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                La IA elaborará el Reglamento cumpliendo con el Marco Legal vigente (Ley 9 de 1979 y normas complementarias) incluyendo la integración directa de los peligros presentes en los procesos de la empresa. Todos los campos a continuación son opcionales para complementar la IA.
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
                                className="group flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-5 w-5" />
                                )}
                                <span>Generar Reglamento con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {generatedDocument && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Reglamento de Higiene y Seguridad Industrial
                        </h3>
                        <span className="text-xs text-text-secondary">Edita el reglamento generado directamente</span>
                    </div>

                    <div className="rounded-xl p-1 overflow-visible">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    initialContent={generatedDocument}
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

export default ReglamentoHigiene;
