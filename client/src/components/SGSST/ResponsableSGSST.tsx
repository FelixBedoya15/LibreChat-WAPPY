import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Download,
    Loader2,
    History,
    FileText,
    UserCheck,
    ScrollText,
    Scale,
    ChevronDown,
    ChevronRight,
    Briefcase,
    Calendar,
    Award
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

const ResponsableSGSST = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // Form state
    const [responsableName, setResponsableName] = useState('');
    const [formationLevel, setFormationLevel] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [courseStatus, setCourseStatus] = useState('');
    const [additionalNorms, setAdditionalNorms] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

    // Generated document
    const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Expand/collapse form
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    // Auto-fill from company info
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/company-info', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.responsibleSST) setResponsableName(prev => prev || data.responsibleSST);
                    if (data.formationLevel) setFormationLevel(prev => prev || data.formationLevel);
                    if (data.licenseNumber) setLicenseNumber(prev => prev || data.licenseNumber);
                    if (data.licenseExpiry) setLicenseExpiry(prev => prev || data.licenseExpiry);
                    if (data.courseStatus) setCourseStatus(prev => prev || data.courseStatus);
                }
            })
            .catch(err => console.error('Error fetching company info for auto-fill:', err));
    }, [token]);

    const handleGenerate = useCallback(async () => {

        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/responsable/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    responsableName,
                    formationLevel,
                    licenseNumber,
                    licenseExpiry,
                    courseStatus,
                    additionalNorms,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el documento');
            }

            const data = await response.json();
            setGeneratedDoc(data.document);
            setEditorContent(data.document);
            setIsFormExpanded(false);
            showToast({ message: 'Documento generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar el documento', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [responsableName, formationLevel, licenseNumber, licenseExpiry, courseStatus, additionalNorms, token, showToast, selectedModel]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedDoc;
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
                    showToast({ message: 'Documento actualizado exitosamente', status: 'success' });
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
                    title: `Responsable SG-SST - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-responsable'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Documento guardado exitosamente', status: 'success' });
            } else {
                const err = await res.json();
                showToast({ message: `Error al guardar: ${err.error || res.status}`, status: 'error' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedDoc, conversationId, reportMessageId, token, showToast]);

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
                setGeneratedDoc(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Documento cargado correctamente', status: 'success' });
            }
        } catch (e) {
            console.error('Load document error:', e);
            showToast({ message: 'Error al cargar el documento', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    const formFields = [
        {
            id: 'responsableName',
            label: 'Nombre del Responsable',
            icon: UserCheck,
            value: responsableName,
            setter: setResponsableName,
            placeholder: 'Nombre completo de la persona asignada',
            rows: 1,
        },
        {
            id: 'formationLevel',
            label: 'Nivel de Formación',
            icon: Briefcase,
            value: formationLevel,
            setter: setFormationLevel,
            placeholder: 'Técnico, Tecnólogo, Profesional, Especialista en SST',
            rows: 1,
        },
        {
            id: 'licenseNumber',
            label: 'Número de Licencia SST',
            icon: Award,
            value: licenseNumber,
            setter: setLicenseNumber,
            placeholder: 'Ej: 12345 de 2024 - Secretaría de Salud',
            rows: 1,
        },
        {
            id: 'licenseExpiry',
            label: 'Vigencia de Licencia',
            icon: Calendar,
            value: licenseExpiry,
            setter: setLicenseExpiry,
            placeholder: 'Fecha de vencimiento de la licencia',
            rows: 1,
        },
        {
            id: 'courseStatus',
            label: 'Curso 50 Horas / Actualización 20 Horas',
            icon: FileText,
            value: courseStatus,
            setter: setCourseStatus,
            placeholder: 'Certificado vigente (Año de expedición)',
            rows: 1,
        },
        {
            id: 'additionalNorms',
            label: 'Observaciones / Normativa Adicional',
            icon: Scale,
            value: additionalNorms,
            setter: setAdditionalNorms,
            placeholder: 'Ej: Resolución 908 de 2025 para el ejercicio de la licencia',
            rows: 2,
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
                        Generar Asignación IA
                    </span>
                </button>
                <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    disabled={isGenerating}
                />
                {generatedDoc && (
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
                            content={editorContent || generatedDoc || ''}
                            fileName="Asignacion_Responsable_SGSST"
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
                        tags={['sgsst-responsable']}
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
                        <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos del Responsable SG-SST</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <input
                                            type="text"
                                            id={field.id}
                                            value={field.value}
                                            onChange={(e) => field.setter(e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                );
                            })}
                        </div>
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
                                    Generar con IA
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {generatedDoc && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Documento de Asignación Generado
                        </h3>
                        <span className="text-xs text-text-secondary">Edita si es necesario</span>
                    </div>
                    <div className="rounded-xl p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    initialContent={generatedDoc}
                                    onUpdate={(html) => setEditorContent(html)}
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResponsableSGSST;
