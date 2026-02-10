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

    const handleGenerate = useCallback(async () => {
        if (!hazards.trim()) {
            showToast({ message: 'Ingrese los peligros asociados a la actividad', status: 'warning' });
            return;
        }

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

    const handleExportWord = useCallback(async () => {
        const contentForExport = editorContent || generatedPolicy;
        if (!contentForExport) {
            showToast({ message: 'Primero genere la política', status: 'warning' });
            return;
        }

        const htmlToMarkdown = (html: string): string => {
            let body = html;
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) body = bodyMatch[1];

            body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
            body = body.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
            body = body.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
            body = body.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
            body = body.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');

            body = body.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
                const rows: string[] = [];
                const rowMatches = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rowMatches.forEach((row: string, idx: number) => {
                    const cells = (row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || []).map((cell: string) =>
                        cell.replace(/<t[hd][^>]*>/i, '').replace(/<\/t[hd]>/i, '').replace(/<[^>]+>/g, '').trim()
                    );
                    rows.push('| ' + cells.join(' | ') + ' |');
                    if (idx === 0) {
                        rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
                    }
                });
                return rows.join('\n') + '\n';
            });

            body = body.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
            body = body.replace(/<\/?[uo]l[^>]*>/gi, '\n');
            body = body.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            body = body.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            body = body.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
            body = body.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
            body = body.replace(/<br\s*\/?>/gi, '\n');
            body = body.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
            body = body.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
            body = body.replace(/<[^>]+>/g, '');
            body = body.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
            body = body.replace(/\n{3,}/g, '\n\n').trim();
            return body;
        };

        const markdownContent = htmlToMarkdown(contentForExport);
        const { exportToWord } = await import('~/utils/wordExport');

        await exportToWord(markdownContent, {
            documentTitle: 'Política SST',
            fontFamily: 'Arial',
            fontSize: 11,
            margins: 1,
            logoUrl: '',
            showPagination: true,
            coverTitle: 'Política de Seguridad y Salud en el Trabajo',
            messageTitle: 'Sistema de Gestión SST',
        });

        showToast({ message: 'Documento Word exportado', status: 'success' });
    }, [editorContent, generatedPolicy, showToast]);

    const handleSelectReport = useCallback((report: any) => {
        if (report?.text) {
            setGeneratedPolicy(report.text);
            setEditorContent(report.text);
            setConversationId(report.conversationId || null);
            setReportMessageId(report.messageId || null);
            setIsFormExpanded(false);
        }
        setIsHistoryOpen(false);
    }, []);

    const formFields = [
        {
            id: 'hazards',
            label: 'Peligros y Riesgos Asociados a la Actividad',
            icon: AlertTriangle,
            value: hazards,
            setter: setHazards,
            placeholder: 'Ej: Riesgo biomecánico por posturas prolongadas, riesgo psicosocial por carga laboral, riesgo físico por ruido, riesgo químico por manejo de sustancias...',
            required: true,
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
                    disabled={isGenerating || !hazards.trim()}
                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="h-5 w-5" />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                        Generar Política IA
                    </span>
                </button>
                {generatedPolicy && (
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

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-diagnostico']}
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
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-text-primary">Datos para Generar la Política</span>
                    </div>
                    {hazards.trim() && (
                        <span className="text-xs text-green-600 font-medium">✓ Datos ingresados</span>
                    )}
                </button>

                {isFormExpanded && (
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-text-secondary mb-4">
                            Complete los campos a continuación. Solo los <strong>peligros</strong> son obligatorios — los demás campos se generarán automáticamente si se dejan vacíos.
                            Los datos de la empresa se cargan automáticamente desde la configuración.
                        </p>

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
                                        className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !hazards.trim()}
                                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Generar Política con IA
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
                            <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Política SST Generada
                        </h3>
                        <span className="text-xs text-text-secondary">Puedes editar el contenido directamente</span>
                    </div>
                    <div className="h-[600px]">
                        <LiveEditor
                            initialContent={generatedPolicy}
                            onUpdate={(html) => setEditorContent(html)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PoliticaSST;
