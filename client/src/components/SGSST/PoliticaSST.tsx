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
import SGSSTToolbar from './SGSSTToolbar';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { useAutoLoadReport } from './useAutoLoadReport';
import CollapsibleReportBox from './CollapsibleReportBox';

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
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview');

    React.useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user?.personalization?.geminiModels?.sstManagement]);

    // Generated policy
    const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);
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
        setHazards('Riesgo biomecánico por posturas prolongadas y levantamiento de cargas, riesgo eléctrico en áreas de producción, riesgo locativo por pisos húmedos y desniveles, riesgo químico por manipulación de solventes.');
        setScope('Aplica a todos los trabajadores directos, contratistas, subcontratistas y visitantes en todas las instalaciones de la empresa.');
        setCommitments('Destinación de recursos financieros, técnicos y humanos; cumplimiento estricto de la normativa colombiana vigente; mejora continua del desempeño en SST; protección de la salud física y mental.');
        setObjectives('Reducir la tasa de accidentalidad en un 20% anual, implementar programa de pausas activas, mantener el SG-SST actualizado conforme a la Res 0312 de 2019.');
        setAdditionalNorms('Decreto 1072 de 2015, Resolución 0312 de 2019, Ley 1562 de 2012');
        showToast({ message: 'Datos de política simulados generados exitosamente.', status: 'success', severity: 'success' });
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
            setEditorKey(Date.now().toString());
            setConversationId('new');  // 'new' marker so handleSave uses POST
            setReportMessageId(null);
            setIsFormExpanded(false);
            showToast({ message: 'Política SST generada exitosamente', status: 'success', severity: 'success' });
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
                    showToast({ message: 'Política actualizada exitosamente', status: 'success', severity: 'success' });
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
                showToast({ message: 'Política guardada exitosamente', status: 'success', severity: 'success' });
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
                setEditorKey(Date.now().toString());
            
            setIsFormExpanded(false);
                showToast({ message: 'Política cargada correctamente', status: 'success', severity: 'success' });
            }
        } catch (e) {
            console.error('Load policy error:', e);
            showToast({ message: 'Error al cargar la política', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    const LOCAL_STORAGE_KEY = 'sgsst_politica_form';

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.hazards) setHazards(data.hazards);
                if (data.scope) setScope(data.scope);
                if (data.commitments) setCommitments(data.commitments);
            }
        } catch(e) {}
    }, []);

    const handleSaveData = () => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ hazards, scope, commitments }));
            showToast({ message: 'Datos guardados exitosamente', status: 'success', severity: 'success' });
        } catch(e) {
            showToast({ message: 'Error al guardar datos', status: 'error' });
        }
    };

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


    useAutoLoadReport({
        token,
        tags: ['sgsst-politica'],
        generatedReport: generatedPolicy,
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
                onSaveLocal={handleSaveData}
                onSave={handleSave}
                hasContent={!!editorContent}
                exportContent={editorContent || ''}
                exportFileName="Politica_SST"
                onDummy={handleDummyData}
            />


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
                                        {(field as any).required && <span className="text-red-500">*</span>}
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
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Política con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Policy - LiveEditor */}
            {generatedPolicy && (
                <CollapsibleReportBox
                    title="Política SST Generada"
                    icon={<ScrollText className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                    actions={
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
                            title="Guardar Política"
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
                                    initialContent={generatedPolicy}
                                    onUpdate={(html) => setEditorContent(html)}
                                    onSave={handleSave}
                                    reportSourceData={{ hazards, scope, commitments, objectives, additionalNorms }}
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
            )}
        </div>
    );
};

export default PoliticaSST;
