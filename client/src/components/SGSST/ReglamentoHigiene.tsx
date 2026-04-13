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
, Download } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { useAutoLoadReport } from './useAutoLoadReport';
import SGSSTToolbar from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';

const ReglamentoHigiene = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [identifiedRisks, setIdentifiedRisks] = useState('');
    const [workShifts, setWorkShifts] = useState('');
    const [additionalRules, setAdditionalRules] = useState('');
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview');

    React.useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user?.personalization?.geminiModels?.sstManagement]);

    // Generated content
    const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Expand/collapse form
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleDummyData = () => {
        setIdentifiedRisks('Riesgo biomecánico: manejo manual de cargas (>25kg). Riesgo químico: exposición a solventes orgánicos en área de pintura. Riesgo eléctrico: instalaciones de baja tensión en bodega. Riesgo locativo: superficies irregulares en zona de cargue.');
        setWorkShifts('Jornada diurna: 7:00am a 5:00pm. Turno nocturno de vigilancia: 10:00pm a 6:00am. Personal administrativo: 8:00am a 5:00pm.');
        setAdditionalRules('Prohibición absoluta de consumo de alcohol o sustancias psicoactivas en instalaciones. Uso obligatorio de EPP en planta. Reporte inmediato de todo incidente o condición insegura al jefe inmediato.');
        showToast({ message: 'Datos de reglamento simulados generados exitosamente.', status: 'success', severity: 'success' });
    };

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
            setEditorKey(Date.now().toString());
            setConversationId(null);
            setReportMessageId(null);
            setIsFormExpanded(false);
            showToast({ message: 'Reglamento generado exitosamente', status: 'success', severity: 'success' });
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
                    showToast({ message: 'Reglamento actualizado exitosamente', status: 'success', severity: 'success' });
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
                showToast({ message: 'Guardado correctamente. Puedes seguir editando', status: 'success', status: 'success', severity: 'success' });
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
                setEditorKey(Date.now().toString());
            
            setIsFormExpanded(false);
                showToast({ message: 'Reglamento cargado correctamente', status: 'success', severity: 'success' });
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


    useAutoLoadReport({
        token,
        tags: ['sgsst-rhs'],
        generatedReport: generatedDocument,
        handleSelectReport
    });

    return (
        <div className="flex flex-col gap-4">
            <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleGenerate}
                isAnalyzing={isGenerating}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onSaveLocal={() => handleSave()}
                onSave={handleSave}
                hasContent={!!editorContent}
                exportContent={editorContent || ''}
                exportFileName="Reglamento_Higiene_Seguridad_Industrial"
                onDummy={handleDummyData}
            />

            {isHistoryOpen && (
                <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-rhs']}
                    />
                </div>
            )}

            <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <ShieldAlert className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <span className="font-semibold text-text-primary">Datos para el Reglamento de Higiene y Seguridad Industrial</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800/30 shadow-sm transition-all duration-300">
                            <h4 className="text-sm text-teal-800 dark:text-teal-300 mb-2 font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 animate-pulse text-teal-500" />
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
                                        className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-center pt-2 gap-4">
                            <button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating}
                                className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Reglamento con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

                <CollapsibleReportBox
                    title="Reglamento de Higiene y Seguridad Industrial"
                    icon={<ShieldAlert className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                    actions={
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
                            title="Guardar Reglamente"
                        >
                            <Save size={16} />
                            Guardar
                        </button>
                    }
                >
                    <div className="rounded-xl p-1 overflow-visible">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={editorKey}
                                    initialContent={generatedDocument}
                                    onUpdate={(html) => setEditorContent(html)}
                                    onSave={handleSave}
                                    reportSourceData={{ identifiedRisks, workShifts, additionalRules }}
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
                </CollapsibleReportBox>
        </div>
    );
};

export default ReglamentoHigiene;
