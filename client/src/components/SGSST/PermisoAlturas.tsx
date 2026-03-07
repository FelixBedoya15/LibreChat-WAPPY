import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    Target,
    ChevronDown,
    ChevronRight,
    Camera,
    Image as ImageIcon,
    X,
    FileText
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

const PermisoAlturas = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [formData, setFormData] = useState({
        trabajadores: '',
        actividad: '',
        altura: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        seguridadSocial: 'Sí',
        aptitudMedica: 'Sí',
        certificacionAlturas: 'Sí',
        sistemaAcceso: '',
        puntosAnclaje: 'Verificados',
        proteccionCaidas: '',
        epp: '',
        herramientas: '',
        condicionesAmbientales: '',
        procedimiento: '',
        responsables: '',
        foto1Desc: '',
        foto2Desc: '',
        foto3Desc: '',
    });

    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });

    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [generatedObjectives, setGeneratedObjectives] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                setImages(prev => ({ ...prev, [field]: readerEvent.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (field: string) => {
        setImages(prev => ({ ...prev, [field]: null }));
    };

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/sgsst/permiso-alturas/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    formData,
                    images,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el Permiso');
            }

            const data = await response.json();
            setGeneratedObjectives(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            showToast({ message: 'Permiso generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, images, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedObjectives;
        if (!contentToSave) return;
        if (!token) return;

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
                    showToast({ message: 'Permiso actualizado exitosamente', status: 'success' });
                }
                return;
            }

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Permiso Alturas - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-permiso-alturas'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Permiso guardado exitosamente', status: 'success' });
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
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setGeneratedObjectives(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Permiso cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el permiso', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="group flex items-center gap-2 px-4 py-2 bg-surface-primary hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                >
                    <History className="h-5 w-5" />
                    <span>Historial</span>
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    <span>Generar TSA</span>
                </button>
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
                {generatedObjectives && (
                    <>
                        <button onClick={handleSave} className="group flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all shadow-sm font-medium text-sm">
                            <Save className="h-5 w-5" />
                            <span>Guardar</span>
                        </button>
                        <ExportDropdown content={editorContent || ''} fileName="Permiso_Alturas" />
                    </>
                )}
            </div>

            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-permiso-alturas']} />
                </div>
            )}

            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Datos para el Permiso de Alturas</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Trabajadores</label>
                                <input type="text" value={formData.trabajadores} onChange={e => handleInputChange('trabajadores', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Nombres completos" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Actividad</label>
                                <input type="text" value={formData.actividad} onChange={e => handleInputChange('actividad', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Descripción detallada" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Altura Aprox (metros)</label>
                                <input type="number" value={formData.altura} onChange={e => handleInputChange('altura', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Ej: 3.5" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Fecha</label>
                                <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-1 w-1/2">
                                    <label className="text-sm font-medium">Hora Inicio</label>
                                    <input type="time" value={formData.horaInicio} onChange={e => handleInputChange('horaInicio', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1 w-1/2">
                                    <label className="text-sm font-medium">Hora Fin</label>
                                    <input type="time" value={formData.horaFin} onChange={e => handleInputChange('horaFin', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Seguridad Social Vigente</label>
                                <select value={formData.seguridadSocial} onChange={e => handleInputChange('seguridadSocial', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Aptitud Médica</label>
                                <select value={formData.aptitudMedica} onChange={e => handleInputChange('aptitudMedica', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Certificación Alturas</label>
                                <select value={formData.certificacionAlturas} onChange={e => handleInputChange('certificacionAlturas', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold border-b pb-2">Equipos y Procedimiento</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Sistema de Acceso</label>
                                    <input type="text" value={formData.sistemaAcceso} onChange={e => handleInputChange('sistemaAcceso', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Ej: Andamio certificado" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Puntos de Anclaje</label>
                                    <select value={formData.puntosAnclaje} onChange={e => handleInputChange('puntosAnclaje', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                        <option>Verificados</option><option>No verificados</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Protección Caídas</label>
                                    <input type="text" value={formData.proteccionCaidas} onChange={e => handleInputChange('proteccionCaidas', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Ej: Línea de vida, arnés" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">EPP Especifico</label>
                                    <input type="text" value={formData.epp} onChange={e => handleInputChange('epp', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Casco con barboquejo, etc" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Herramientas a Utilizar</label>
                                <input type="text" value={formData.herramientas} onChange={e => handleInputChange('herramientas', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Condiciones Eléctricas/Ambientales</label>
                                <input type="text" value={formData.condicionesAmbientales} onChange={e => handleInputChange('condicionesAmbientales', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Procedimiento Paso a Paso</label>
                                <textarea value={formData.procedimiento} onChange={e => handleInputChange('procedimiento', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary min-h-[80px]" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Responsables Adicionales</label>
                                <input type="text" value={formData.responsables} onChange={e => handleInputChange('responsables', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Autoriza, Coordinador, Rescatista..." />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold border-b pb-2">Documentación Fotográfica</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                                    const labels = ['Lugar de Trabajo', 'Sistema de Acceso', 'Trabajador con EPP'];
                                    const fieldName = foto as 'foto1'|'foto2'|'foto3';
                                    const descName = `${foto}Desc`;
                                    return (
                                        <div key={foto} className="flex flex-col items-center gap-3">
                                            <span className="font-semibold text-sm">{labels[idx]}</span>
                                            <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium flex flex-col items-center justify-center overflow-hidden hover:bg-surface-hover transition-colors">
                                                {images[fieldName] ? (
                                                    <>
                                                        <img src={images[fieldName] as string} className="w-full h-full object-cover" alt={foto} />
                                                        <button onClick={() => removeImage(fieldName)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-blue-500">
                                                        <Camera className="h-8 w-8 mb-2" />
                                                        <span className="text-xs text-center px-4">Tocar para tomar/subir foto</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(fieldName, e)} />
                                                    </label>
                                                )}
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Descripción breve..." 
                                                value={(formData as any)[descName]} 
                                                onChange={e => handleInputChange(descName, e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-xs bg-surface-primary text-text-primary"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-md">
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                <span>Generar Permiso Mágico</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {generatedObjectives && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Permiso de Alturas Generado</h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor initialContent={generatedObjectives} onUpdate={setEditorContent} onSave={handleSave} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermisoAlturas;
