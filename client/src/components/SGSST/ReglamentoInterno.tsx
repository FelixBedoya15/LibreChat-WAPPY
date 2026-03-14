import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    Briefcase,
    ScrollText,
    Clock,
    ChevronDown,
    ChevronRight,
    HeartHandshake
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';

const ReglamentoInterno = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state: 8 Chapters
    const [chapters, setChapters] = useState({
        cap1_admision: '',
        cap2_horarios: '',
        cap3_descansos: '',
        cap4_salarios: '',
        cap5_sgsst: '',
        cap6_obligaciones: '',
        cap7_sanciones: '',
        cap8_convivencia: ''
    });
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // Generated content
    const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingProgress, setGeneratingProgress] = useState<{current: number, total: number, title: string} | null>(null);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Expand/collapse form
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        setIsFormExpanded(false);
        setGeneratedDocument('');
        setEditorContent('');
        
        const RIT_CHAPTERS_DEF = [
            { key: 'cap1_admision', title: 'Condiciones de Admisión y Contrato' },
            { key: 'cap2_horarios', title: 'Horarios, Jornadas y Desconexión Laboral' },
            { key: 'cap3_descansos', title: 'Descansos, Permisos y Licencias' },
            { key: 'cap4_salarios', title: 'Salarios y Pagos' },
            { key: 'cap5_sgsst', title: 'Seguridad y Salud en el Trabajo (SG-SST)' },
            { key: 'cap6_obligaciones', title: 'Obligaciones y Prohibiciones (Empresa/Empleado)' },
            { key: 'cap7_sanciones', title: 'Faltas y Escala de Sanciones Disciplinarias' },
            { key: 'cap8_convivencia', title: 'Convivencia y Prevención Acoso Laboral' },
        ];

        let accumulatedHtml = '';

        try {
            for (let i = 0; i < RIT_CHAPTERS_DEF.length; i++) {
                const chapDef = RIT_CHAPTERS_DEF[i];
                const userInput = chapters[chapDef.key as keyof typeof chapters];
                
                setGeneratingProgress({ current: i + 1, total: RIT_CHAPTERS_DEF.length, title: chapDef.title });

                const response = await fetch('/api/sgsst/rit/generate-chapter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        chapterTitle: chapDef.title,
                        userInput: userInput,
                        chapterIndex: i,
                        isLast: i === RIT_CHAPTERS_DEF.length - 1,
                        previousHtml: accumulatedHtml, // Provide context
                        modelName: selectedModel,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Error en el Capítulo: ${chapDef.title}`);
                }

                const data = await response.json();
                accumulatedHtml += (i > 0 ? '\\n' : '') + data.chapterHtml;
                
                // Show progressive writing in UI
                setGeneratedDocument(accumulatedHtml);
                setEditorContent(accumulatedHtml);
            }

            // Finally, generate signatures block and append
            setGeneratingProgress({ current: RIT_CHAPTERS_DEF.length, total: RIT_CHAPTERS_DEF.length, title: 'Generando Firmas...' });
            const sigResponse = await fetch('/api/sgsst/rit/generate-signature', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (sigResponse.ok) {
                const sigData = await sigResponse.json();
                accumulatedHtml += '\\n' + sigData.signatureHtml;
                setGeneratedDocument(accumulatedHtml);
                setEditorContent(accumulatedHtml);
            }

            showToast({ message: 'Reglamento generado exitosamente capítulo por capítulo', status: 'success' });
        } catch (error: any) {
            console.error('RIT generation error:', error);
            showToast({ message: error.message || 'Error al generar el reglamento', status: 'error' });
        } finally {
            setIsGenerating(false);
            setGeneratingProgress(null);
        }
    }, [chapters, selectedModel, token, showToast]);

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
                    title: `Reglamento Interno de Trabajo - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-rit'],
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
            id: 'cap1_admision',
            label: 'Capítulo 1: Condiciones de Admisión y Contrato',
            icon: ScrollText,
            value: chapters.cap1_admision,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap1_admision: val })),
            placeholder: 'Ej: Período de prueba de 2 meses. Contratos a término fijo e indefinido.',
            rows: 2,
        },
        {
            id: 'cap2_horarios',
            label: 'Capítulo 2: Horarios, Jornadas y Desconexión Laboral',
            icon: Clock,
            value: chapters.cap2_horarios,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap2_horarios: val })),
            placeholder: 'Ej: Lunes a Viernes 8am-5pm. Política estricta de desconexión fines de semana.',
            rows: 2,
        },
        {
            id: 'cap3_descansos',
            label: 'Capítulo 3: Descansos, Permisos y Licencias',
            icon: Briefcase,
            value: chapters.cap3_descansos,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap3_descansos: val })),
            placeholder: 'Ej: Permisos por calamidad doméstica (5 días). Descansos dominicales.',
            rows: 2,
        },
        {
            id: 'cap4_salarios',
            label: 'Capítulo 4: Salarios y Pagos',
            icon: ScrollText,
            value: chapters.cap4_salarios,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap4_salarios: val })),
            placeholder: 'Ej: Pagos quincenales por transferencia bancaria.',
            rows: 2,
        },
        {
            id: 'cap5_sgsst',
            label: 'Capítulo 5: Seguridad y Salud en el Trabajo (SG-SST)',
            icon: HeartHandshake,
            value: chapters.cap5_sgsst,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap5_sgsst: val })),
            placeholder: 'Ej: Uso estricto de EPP. Reporte inmediato de accidentes de trabajo. Prohibición de alcohol.',
            rows: 3,
        },
        {
            id: 'cap6_obligaciones',
            label: 'Capítulo 6: Obligaciones y Prohibiciones (Empresa/Empleado)',
            icon: ScrollText,
            value: chapters.cap6_obligaciones,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap6_obligaciones: val })),
            placeholder: 'Ej: Confidencialidad obligatoria. Prohibición de usar equipos de empresa para uso personal.',
            rows: 2,
        },
        {
            id: 'cap7_sanciones',
            label: 'Capítulo 7: Faltas y Escala de Sanciones Disciplinarias',
            icon: ScrollText,
            value: chapters.cap7_sanciones,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap7_sanciones: val })),
            placeholder: 'Ej: Faltas leves: Llegadas tarde (llamados de atención). Faltas graves (justa causa): Violar SGSST, robo.',
            rows: 3,
        },
        {
            id: 'cap8_convivencia',
            label: 'Capítulo 8: Convivencia y Prevención Acoso Laboral',
            icon: HeartHandshake,
            value: chapters.cap8_convivencia,
            setter: (val: string) => setChapters(prev => ({ ...prev, cap8_convivencia: val })),
            placeholder: 'Ej: Comité de Convivencia sesionará trimestralmente. Aplicación rigurosa de Ley 1010 de 2006.',
            rows: 2,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Historial
                    </span>
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <AnimatedIcon name="sparkles" size={20} />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        {isGenerating && generatingProgress ? `Cap. ${generatingProgress.current}/${generatingProgress.total}: ${generatingProgress.title}` : 'Generar Reglamento IA'}
                    </span>
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
                            <AnimatedIcon name="database" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                Guardar Datos
                            </span>
                        </button>
                        <ExportDropdown
                            content={editorContent || generatedDocument || ''}
                            fileName="Reglamento_Interno_De_Trabajo"
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
                        tags={['sgsst-rit']}
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
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos para el Reglamento Interno de Trabajo</span>
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
                                La IA elaborará el Reglamento basándose en el Código Sustantivo del Trabajo y las reformas laborales recientes (incluyendo Ley 2466 de 2025). Integrará los datos generales de la empresa de forma automática. Todos los campos a continuación son opcionales para personalizar el documento.
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
                                className="group flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                    {isGenerating && generatingProgress ? `Redactando: ${generatingProgress.title}` : 'Generar Reglamento con IA'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {generatedDocument && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Reglamento Interno de Trabajo
                        </h3>
                        <span className="text-xs text-text-secondary">Edita el reglamento generado directamente</span>
                    </div>

                    <div className="rounded-xl p-1 overflow-visible">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new'}
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

export default ReglamentoInterno;
