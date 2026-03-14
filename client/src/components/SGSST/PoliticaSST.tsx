import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Download,
    Loader2,
    History,
    AlertTriangle,
    Shield,
    Target,
    ScrollText,
    Scale,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';

const PoliticaSST = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [hazards, setHazards] = useState('');
    const [scope, setScope] = useState('');
    const [commitments, setCommitments] = useState('');
    const [objectives, setObjectives] = useState('');
    const [additionalNorms, setAdditionalNorms] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // Generated policy
    const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Expand/collapse form
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleDummyData = () => {
        setHazards('Riesgo biomecánico por posturas prolongadas y levantamiento de cargas, riesgo eléctrico en áreas de producción, riesgo locativo por pisos húmedos y desniveles, riesgo químico por manipulación de solventes.');
        setScope('Aplica a todos los trabajadores directos, contratistas, subcontratistas y visitantes en todas las instalaciones de la empresa.');
        setCommitments('Destinación de recursos financieros, técnicos y humanos; cumplimiento estricto de la normativa colombiana vigente; mejora continua del desempeño en SST; protección de la salud física y mental.');
        setObjectives('Reducir la tasa de accidentalidad en un 20% anual, implementar programa de pausas activas, mantener el SG-SST actualizado conforme a la Res 0312 de 2019.');
        setAdditionalNorms('Decreto 1072 de 2015, Resolución 0312 de 2019, Ley 1562 de 2012');
        showToast({ message: 'Datos de política simulados generados exitosamente.', status: 'success' });
    };

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/politica/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    hazards,
                    scope,
                    commitments,
                    objectives,
                    additionalNorms,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar la política');
            }

            const data = await response.json();
            setGeneratedPolicy(data.policy);
            setEditorContent(data.policy);
            setIsFormExpanded(false);
            showToast({ message: 'Política SST generada exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Policy generation error:', error);
            showToast({ message: error.message || 'Error al generar la política', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [hazards, scope, commitments, objectives, additionalNorms, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedPolicy;
        if (!contentToSave) {
            showToast({ message: 'No hay política para guardar', status: 'warning' });
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
                    showToast({ message: 'Política actualizada exitosamente', status: 'success' });
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
                    title: `Política SST - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-politica'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Política guardada exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedPolicy, conversationId, reportMessageId, token, showToast]);



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
                setGeneratedPolicy(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Política cargada correctamente', status: 'success' });
            }
        } catch (e) {
            console.error('Load policy error:', e);
            showToast({ message: 'Error al cargar la política', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    const formFields = [
        {
            id: 'hazards',
            label: 'Peligros y Riesgos Asociados a la Actividad',
            icon: AlertTriangle,
            value: hazards,
            setter: setHazards,
            placeholder: 'Ej: Riesgo biomecánico por posturas prolongadas... (Si deja en blanco, la IA usará automáticamente los peligros guardados en su Matriz de Peligros).',
            rows: 4,
        },
        {
            id: 'scope',
            label: 'Alcance de la Política',
            icon: Target,
            value: scope,
            setter: setScope,
            placeholder: 'Ej: Aplica a todos los trabajadores, contratistas y visitantes en todas las sedes (dejar vacío para generar automáticamente)',
            rows: 2,
        },
        {
            id: 'commitments',
            label: 'Compromisos de la Dirección',
            icon: Shield,
            value: commitments,
            setter: setCommitments,
            placeholder: 'Ej: Asignación de recursos, cumplimiento normativo, mejora continua (dejar vacío para generar automáticamente)',
            rows: 2,
        },
        {
            id: 'objectives',
            label: 'Objetivos Principales',
            icon: ScrollText,
            value: objectives,
            setter: setObjectives,
            placeholder: 'Ej: Reducir accidentes laborales, implementar programa de pausas activas (dejar vacío para generar automáticamente)',
            rows: 2,
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
                    <DummyGenerateButton onClick={handleDummyData} />
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        {t('com_ui_history', 'Historial')}
                    </span>
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <AnimatedIcon name="sparkles" size={20} />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Generar Política IA
                    </span>
                </button>
                <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    disabled={isGenerating}
                />
                {generatedPolicy && (
                    <>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="database" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                {t('com_ui_save', 'Guardar Datos')}
                            </span>
                        </button>
                        <ExportDropdown
                            content={editorContent || generatedPolicy || ''}
                            fileName="Politica_SST"
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
                        tags={['sgsst-politica']}
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
                        <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <span className="font-semibold text-text-primary">Datos para Generar la Política</span>
                    </div>
                    {hazards.trim() && (
                        <span className="text-xs text-green-600 font-medium">✓ Datos ingresados</span>
                    )}
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800/30 shadow-sm transition-all duration-300">
                            <h4 className="text-sm text-teal-800 dark:text-teal-300 mb-2 font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 animate-pulse text-teal-500" />
                                Generación Inteligente
                            </h4>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Puede dejar <strong>todos los campos vacíos</strong>. Si no ingresa información, la IA buscará y utilizará automáticamente los peligros de su <strong>Matriz de Peligros GTC 45</strong>. Si no ingresa la normatividad, se tomará por defecto el <strong>Decreto 1072 de 2015</strong> y <strong>Resolución 0312 de 2019</strong>.
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
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        id={field.id}
                                        value={field.value}
                                        onChange={(e) => field.setter(e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows}
                                        className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-center pt-2 gap-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Política con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Policy - LiveEditor */}
            {generatedPolicy && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                            Política SST Generada
                        </h3>
                        <span className="text-xs text-text-secondary">Puedes editar el contenido directamente</span>
                    </div>
                    <div className="rounded-xl p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new'}
                                    initialContent={generatedPolicy}
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

export default PoliticaSST;
