import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Sparkles, Save, History, Loader2,
    ChevronDown, ChevronRight, QrCode, FileText, LayoutList, Database,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { QRCodeSVG } from 'qrcode.react';

// ─── Types ────────────────────────────────────────────────────────────
interface WorkerEntry {
    id: string;
    nombre: string;
    identificacion: string;
    edad: number | '';
    genero: string;
    estadoCivil: string;
    nivelEscolaridad: string;
    direccion: string;
    telefono: string;
    cargo: string;
    fechaExamenMedico: string;
    fechaCursoAlturasAutorizado: string;
    fechaCursoAlturasCoordinador: string;
    completedByAI: boolean;
}

const EMPTY_WORKER: Omit<WorkerEntry, 'id'> = {
    nombre: '', identificacion: '', edad: '', genero: '', estadoCivil: '',
    nivelEscolaridad: '', direccion: '', telefono: '', cargo: '',
    fechaExamenMedico: '', fechaCursoAlturasAutorizado: '', fechaCursoAlturasCoordinador: '',
    completedByAI: false,
};

const PerfilSociodemografico = () => {
    const { token, user } = useAuthContext();
    const { showToast } = useToastContext();

    const [trabajadores, setTrabajadores] = useState<WorkerEntry[]>([]);
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro-exp-03-25');
    const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Report state
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // QR Code Modal State
    const [selectedQrWorker, setSelectedQrWorker] = useState<WorkerEntry | null>(null);

    // ─── Load Data ──────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/sgsst/perfil-sociodemografico/data', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.trabajadores?.length) setTrabajadores(data.trabajadores);
                }
            } catch (err) {
                console.error('Error loading perfil sociodemografico:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/company-info', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(info => { if (info && info.companyName) setCompanyInfo(info); })
            .catch(() => { });
    }, [token]);

    // ─── Handlers ───────────────────────────────────────────────
    const handleAddWorker = () => {
        const newWorker: WorkerEntry = { id: crypto.randomUUID(), ...EMPTY_WORKER };
        setTrabajadores(prev => [...prev, newWorker]);
        setExpandedWorkers(prev => new Set(prev).add(newWorker.id));
    };

    const handleDeleteWorker = (workerId: string) => {
        setTrabajadores(prev => prev.filter(w => w.id !== workerId));
    };

    const updateWorkerField = (workerId: string, field: keyof WorkerEntry, value: any) => {
        setTrabajadores(prev => prev.map(w => w.id === workerId ? { ...w, [field]: value } : w));
    };

    // ─── Save & Generate ────────────────────────────────────────
    const handleGenerateDummy = async () => {
        if (!token) return;
        setIsGeneratingFull(true);
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/generate-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ modelName: selectedModel }),
            });
            if (!res.ok) throw new Error('Error al generar perfil con IA');
            const data = await res.json();
            if (data.trabajadores) {
                setTrabajadores(data.trabajadores);
                showToast({ message: '10 trabajadores generados con éxito', status: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsGeneratingFull(false);
        }
    };

    const handleSaveData = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ trabajadores }),
            });
            if (res.ok) showToast({ message: 'Perfil sociodemográfico guardado', status: 'success' });
            else throw new Error('Error al guardar');
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!trabajadores.length) {
            showToast({ message: 'No hay trabajadores para generar reporte', status: 'warning' });
            return;
        }
        setIsAnalyzing(true);
        try {
            const payload = {
                trabajadores,
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                userName: user?.name || user?.username || 'Usuario',
                modelName: selectedModel,
            };
            const res = await fetch('/api/sgsst/perfil-sociodemografico/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Error al generar informe con IA');
            const data = await res.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);
            setConversationId('new');
            setReportMessageId(null);
            showToast({ message: 'Informe sociodemográfico generado con éxito', status: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [trabajadores, showToast, token, user, selectedModel]);

    const handleSaveReport = useCallback(async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;
        try {
            const isNew = !conversationId || conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(isNew ? {
                    content,
                    title: `Perfil Sociodemográfico - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-perfil-sociodemografico'],
                } : { conversationId, messageId: reportMessageId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
                setRefreshTrigger(prev => prev + 1);
                setIsHistoryOpen(false);
                showToast({ message: 'Informe guardado', status: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast]);

    const handleSelectReport = async (reportOrId: any) => {
        let content = '', convId = '', msgId = '';
        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                const res = await fetch(`/api/messages/${convId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const messages = await res.json();
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' || (m.isCreatedByUser === false && m.text?.length > 100)
                    );
                    if (reportMsg) { content = reportMsg.text; msgId = reportMsg.messageId; }
                }
            } catch { /* ignore */ }
        } else if (reportOrId?.content) {
            content = reportOrId.content; convId = reportOrId.conversationId; msgId = reportOrId.messageId;
        }
        if (content) {
            setGeneratedReport(content); setEditorContent(content);
            setConversationId(convId); setReportMessageId(msgId);
            setIsHistoryOpen(false);
        }
    };

    const toggleWorker = (id: string) => {
        setExpandedWorkers(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    // ─── QR: URL corta al perfil público del backend ─────────────────────
    // (data:URI era demasiado grande — QR tiene límite ~4KB)
    const getQrValue = (w: WorkerEntry) => {
        const base = window.location.origin;
        return `${base}/api/sgsst/perfil-sociodemografico/profile/${w.id}`;
    };

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ═══ Toolbar ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                        <LayoutList className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Perfil Sociodemográfico</h2>
                        <span className="text-sm text-text-secondary">{trabajadores.length} Trabajadores Registrados</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleGenerateDummy} disabled={isGeneratingFull}
                        className="group flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50">
                        {isGeneratingFull ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar con IA</span>
                    </button>
                    <button onClick={handleSaveData} disabled={isSaving}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-gray-500" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Guardar</span>
                    </button>
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-surface-primary text-text-primary'}`}>
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Historial</span>
                    </button>
                    {trabajadores.length > 0 && (
                        <button onClick={handleAnalyze} disabled={isAnalyzing}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50">
                            {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <Sparkles className="h-5 w-5 text-indigo-500" />}
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Generar Informe</span>
                        </button>
                    )}
                    <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
                    {generatedReport && (
                        <ExportDropdown
                            content={editorContent || generatedReport || ''}
                            fileName="Perfil_Sociodemografico"
                        />
                    )}
                </div>
            </div>

            {/* ═══ History Panel ═══ */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-perfil-sociodemografico']}
                    />
                </div>
            )}

            {/* ═══ Workers List ═══ */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-text-secondary">
                        <Loader2 className="h-8 w-8 animate-spin mr-3 text-teal-500" /> Cargando base de datos...
                    </div>
                ) : (
                    <>
                        {trabajadores.map((w, wIdx) => (
                            <div key={w.id} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden border-l-4 border-l-teal-500 transition-all">
                                {/* Worker Header */}
                                <div className="flex items-center justify-between p-4 bg-surface-tertiary/30 cursor-pointer" onClick={() => toggleWorker(w.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="text-teal-500">
                                            {expandedWorkers.has(w.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-base">
                                                {wIdx + 1}. {w.nombre || 'Nuevo Trabajador'}
                                                <span className="ml-2 text-xs font-normal text-text-secondary">— {w.cargo || 'Sin cargo asignado'}</span>
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-0.5">CC: {w.identificacion || 'N/A'} | {w.genero || '—'} | {w.edad ? `${w.edad} años` : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedQrWorker(w); }}
                                            className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                                            title="Ver Carnet QR">
                                            <QrCode className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id); }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Worker Body */}
                                {expandedWorkers.has(w.id) && (
                                    <div className="p-4 border-t border-border-light animate-in fade-in duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Col 1 */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Nombre Completo</label>
                                                <input type="text" value={w.nombre} onChange={e => updateWorkerField(w.id, 'nombre', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary font-medium" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Identificación (CC)</label>
                                                <input type="text" value={w.identificacion} onChange={e => updateWorkerField(w.id, 'identificacion', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Cargo</label>
                                                <input type="text" value={w.cargo} onChange={e => updateWorkerField(w.id, 'cargo', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Teléfono</label>
                                                <input type="text" value={w.telefono} onChange={e => updateWorkerField(w.id, 'telefono', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>

                                            {/* Col 2 */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Edad</label>
                                                <input type="number" value={w.edad} onChange={e => updateWorkerField(w.id, 'edad', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Género</label>
                                                <select value={w.genero} onChange={e => updateWorkerField(w.id, 'genero', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                    <option value="">Seleccione...</option>
                                                    <option>Masculino</option>
                                                    <option>Femenino</option>
                                                    <option>Otro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Estado Civil</label>
                                                <select value={w.estadoCivil} onChange={e => updateWorkerField(w.id, 'estadoCivil', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                    <option value="">Seleccione...</option>
                                                    <option>Soltero/a</option>
                                                    <option>Casado/a</option>
                                                    <option>Unión Libre</option>
                                                    <option>Separado/a</option>
                                                    <option>Viudo/a</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Nivel Escolaridad</label>
                                                <select value={w.nivelEscolaridad} onChange={e => updateWorkerField(w.id, 'nivelEscolaridad', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                    <option value="">Seleccione...</option>
                                                    <option>Ninguna</option>
                                                    <option>Primaria</option>
                                                    <option>Secundaria</option>
                                                    <option>Técnico</option>
                                                    <option>Tecnólogo</option>
                                                    <option>Profesional</option>
                                                    <option>Especialización / Postgrado</option>
                                                </select>
                                            </div>

                                            {/* Dirección - full row */}
                                            <div className="space-y-1 lg:col-span-2">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Dirección (Google Maps)</label>
                                                <input type="text" value={w.direccion} onChange={e => updateWorkerField(w.id, 'direccion', e.target.value)}
                                                    placeholder="Ej: Calle 123 #45-67, Medellín, Antioquia"
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>

                                            {/* Dates */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Último Examen Médico</label>
                                                <input type="date" value={w.fechaExamenMedico} onChange={e => updateWorkerField(w.id, 'fechaExamenMedico', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-orange-200 bg-orange-50/10 dark:bg-orange-900/10 text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase leading-tight">Alturas — Trab. Autorizado</label>
                                                <input type="date" value={w.fechaCursoAlturasAutorizado} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasAutorizado', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-blue-200 bg-blue-50/10 dark:bg-blue-900/10 text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase leading-tight">Alturas — Coordinador</label>
                                                <input type="date" value={w.fechaCursoAlturasCoordinador} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasCoordinador', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-blue-200 bg-blue-50/10 dark:bg-blue-900/10 text-text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Worker Button */}
                        <button onClick={handleAddWorker}
                            className="w-full p-4 border-2 border-dashed border-border-medium rounded-2xl flex items-center justify-center gap-2 text-text-secondary hover:bg-surface-secondary/50 hover:text-teal-500 transition-all">
                            <Plus className="h-5 w-5" />
                            <span className="font-bold">Agregar Nuevo Trabajador</span>
                        </button>
                    </>
                )}
            </div>

            {/* ═══ Report Viewer (inline, igual que MatrizPeligros) ═══ */}
            {generatedReport && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-500" />
                            Vista Previa del Informe Sociodemográfico
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSaveReport}
                                className="group flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-300 text-sm font-bold shadow-sm">
                                <Save className="h-4 w-4" />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Informe</span>
                            </button>
                            <ExportDropdown
                                content={editorContent || generatedReport || ''}
                                fileName="Perfil_Sociodemografico"
                            />
                        </div>
                    </div>
                    <div className="rounded-xl border border-border-medium bg-white dark:bg-gray-900 p-1 overflow-hidden">
                        <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor initialContent={generatedReport} onUpdate={setEditorContent} />
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
                            [contenteditable] table th:last-child { border-right: none; }
                            [contenteditable] table tr:last-child td { border-bottom: none; }
                        `}</style>
                    </div>
                </div>
            )}

            {/* ═══ QR Modal ═══ */}
            {selectedQrWorker && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedQrWorker(null)}>
                    <div
                        className="bg-surface-primary w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border-medium"
                        onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white p-5 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-lg">{selectedQrWorker.nombre || 'Trabajador'}</h3>
                            <p className="text-sm text-slate-300 mt-1">{selectedQrWorker.cargo || 'Sin cargo'}</p>
                        </div>

                        {/* QR Code */}
                        <div className="p-8 flex flex-col items-center bg-white space-y-4">
                            <div className="p-3 border-4 border-slate-200 rounded-2xl shadow-inner">
                                <QRCodeSVG
                                    value={getQrValue(selectedQrWorker)}
                                    size={192}
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>
                            <div className="text-center text-slate-600 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Escanea para ver el perfil completo</p>
                                <p className="text-sm font-bold text-slate-700">CC: {selectedQrWorker.identificacion || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedQrWorker(null)}
                                className="px-6 py-2 rounded-lg font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PerfilSociodemografico;
