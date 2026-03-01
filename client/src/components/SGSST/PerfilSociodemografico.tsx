import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Sparkles, Save, History, Loader2,
    ChevronDown, ChevronRight, QrCode, FileText, LayoutList, MapPin
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
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
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
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
        const newWorker: WorkerEntry = {
            id: crypto.randomUUID(),
            ...EMPTY_WORKER,
        };
        setTrabajadores(prev => [...prev, newWorker]);
        setExpandedWorkers(prev => new Set(prev).add(newWorker.id));
    };

    const handleDeleteWorker = (workerId: string) => {
        setTrabajadores(prev => prev.filter(w => w.id !== workerId));
    };

    const updateWorkerField = (workerId: string, field: keyof WorkerEntry, value: any) => {
        setTrabajadores(prev => prev.map(w => w.id === workerId ? { ...w, [field]: value } : w));
    };

    // ─── Save & Generate Logic ───────────────────────────────────────────────
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
    }, [trabajadores, companyInfo, showToast, token, user, selectedModel]);

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

    // ─── Generate QR Data URI ──────────────────────────────────────────
    const getQrDataUri = (w: WorkerEntry) => {
        const mapsLink = w.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.direccion)}` : '#';

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Perfil: ${w.nombre}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; line-height: 1.5; }
  .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 5px 0; color: #1d4ed8; }
  .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
  .info-group { margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
  .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
  .value { font-size: 15px; font-weight: 500; }
  .btn { display: block; width: 100%; padding: 10px; background: #2563eb; color: white; text-align: center; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; box-sizing: border-box; }
</style>
</head>
<body>
<div class="card">
  <h1>${w.nombre || 'Sin Nombre'}</h1>
  <div class="badge">${w.cargo || 'Sin Cargo'}</div>
  
  <div class="info-group"><div class="label">Identificación</div><div class="value">${w.identificacion || '-'}</div></div>
  <div class="info-group"><div class="label">Edad / Género</div><div class="value">${w.edad || '-'} / ${w.genero || '-'}</div></div>
  <div class="info-group"><div class="label">Estado Civil / Escolaridad</div><div class="value">${w.estadoCivil || '-'} / ${w.nivelEscolaridad || '-'}</div></div>
  <div class="info-group"><div class="label">Teléfono</div><div class="value">${w.telefono || '-'}</div></div>
  
  <div class="info-group" style="margin-top: 20px;">
    <div class="label">Fechas Importantes</div>
    <div class="value" style="font-size: 13px;">
      Examen Médico: <strong>${w.fechaExamenMedico || 'No reportado'}</strong><br/>
      Alturas (Autorizado): <strong>${w.fechaCursoAlturasAutorizado || 'No reportado'}</strong><br/>
      Alturas (Coordinador): <strong>${w.fechaCursoAlturasCoordinador || 'No reportado'}</strong>
    </div>
  </div>

  ${w.direccion ? `<a href="${mapsLink}" class="btn" target="_blank" rel="noopener">Ver Dirección en Maps</a>` : '<div class="btn" style="background:#cbd5e1; color:#475569;">Sin dirección</div>'}
</div>
</body>
</html>`;

        // We use encodeURIComponent to ensure valid URL chars
        return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
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
                    <button onClick={handleAddWorker}
                        className="group flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm">
                        <Plus className="h-5 w-5 mr-1" />
                        Añadir Trabajador
                    </button>
                    <button onClick={handleGenerateDummy} disabled={isGeneratingFull}
                        className="group flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50">
                        {isGeneratingFull ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">10 Dummys (IA)</span>
                    </button>
                    <button onClick={handleSaveData} disabled={isSaving}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 text-gray-500" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Guardar</span>
                    </button>
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary'}`}>
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Historial</span>
                    </button>
                    {trabajadores.length > 0 && (
                        <button onClick={handleAnalyze} disabled={isAnalyzing}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50">
                            {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <FileText className="h-5 w-5 text-indigo-500" />}
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
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger}
                        tags={['sgsst-perfil-sociodemografico']} />
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
                                            <p className="text-xs text-text-secondary mt-0.5">ID: {w.identificacion || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedQrWorker(w); }}
                                            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                                            title="Generar Carnet QR">
                                            <QrCode className="h-5 w-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id); }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Worker Body */}
                                {expandedWorkers.has(w.id) && (
                                    <div className="p-4 space-y-4 animate-in fade-in duration-300 border-t border-border-light">

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Nombre Completo</label>
                                                <input type="text" value={w.nombre} onChange={e => updateWorkerField(w.id, 'nombre', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary font-medium" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Identificación</label>
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
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Femenino">Femenino</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Estado Civil</label>
                                                <select value={w.estadoCivil} onChange={e => updateWorkerField(w.id, 'estadoCivil', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                    <option value="">Seleccione...</option>
                                                    <option value="Soltero/a">Soltero/a</option>
                                                    <option value="Casado/a">Casado/a</option>
                                                    <option value="Unión Libre">Unión Libre</option>
                                                    <option value="Separado/a">Separado/a</option>
                                                    <option value="Viudo/a">Viudo/a</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Nivel Escolaridad</label>
                                                <select value={w.nivelEscolaridad} onChange={e => updateWorkerField(w.id, 'nivelEscolaridad', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                    <option value="">Seleccione...</option>
                                                    <option value="Ninguna">Ninguna</option>
                                                    <option value="Primaria">Primaria</option>
                                                    <option value="Secundaria">Secundaria</option>
                                                    <option value="Técnico">Técnico</option>
                                                    <option value="Tecnólogo">Tecnólogo</option>
                                                    <option value="Profesional">Profesional</option>
                                                    <option value="Especialización / Postgrado">Especialización / Postgrado</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1 lg:col-span-2">
                                                <label className="text-xs font-bold text-text-secondary uppercase">Dirección (Para Google Maps)</label>
                                                <input type="text" value={w.direccion} onChange={e => updateWorkerField(w.id, 'direccion', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary"
                                                    placeholder="Ej: Calle 123 #45-67, Ciudad" />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Fecha Examen Med.</label>
                                                <input type="date" value={w.fechaExamenMedico} onChange={e => updateWorkerField(w.id, 'fechaExamenMedico', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-orange-200 bg-orange-50/10 text-text-primary" />
                                            </div>
                                            <div className="space-y-1 border-l pl-4 border-border-light">
                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase leading-tight">Curso Alturas<br />(Trabajador)</label>
                                                <input type="date" value={w.fechaCursoAlturasAutorizado} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasAutorizado', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-blue-200 bg-blue-50/10 text-text-primary mt-1" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase leading-tight">Curso Alturas<br />(Coordinador)</label>
                                                <input type="date" value={w.fechaCursoAlturasCoordinador} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasCoordinador', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-blue-200 bg-blue-50/10 text-text-primary mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* ═══ QR Modal ═══ */}
            {selectedQrWorker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedQrWorker(null)}>
                    <div className="bg-surface-primary w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border-medium" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-800 text-white p-4 text-center">
                            <h3 className="font-bold text-lg leading-tight">Carnet Digital</h3>
                            <p className="text-xs text-slate-300">{selectedQrWorker.nombre}</p>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center bg-white space-y-6">
                            <div className="p-4 border-[3px] border-slate-200 rounded-xl relative">
                                <QRCodeSVG
                                    value={getQrDataUri(selectedQrWorker)}
                                    size={200}
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="text-center space-y-1 w-full text-slate-800">
                                <p className="font-bold text-lg">{selectedQrWorker.cargo || 'Sin cargo'}</p>
                                <p className="text-sm font-medium">CC: {selectedQrWorker.identificacion || 'N/A'}</p>
                                <hr className="my-3 border-slate-200" />
                                <p className="text-xs text-slate-500 font-medium">Escanea este código para ver el perfil completo y ubicación en el mapa.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button onClick={() => setSelectedQrWorker(null)} className="px-5 py-2 rounded-lg font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Report Viewer ═══ */}
            {generatedReport && !isHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-surface-primary animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-medium bg-surface-secondary shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h2 className="font-bold text-lg text-text-primary">Informe Ejecutivo Sociodemográfico</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setGeneratedReport(null)}
                                className="px-4 py-2 hover:bg-surface-hover text-text-secondary rounded-lg font-medium text-sm transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    // Let user copy html natively somehow, or just handleSaveReport?
                                    // Oh wait, the MatrizPeligros doesn't have a save button in the header, it uses handleSaveReport
                                    // Actually we just provide "save" in the dropdown, but we should add a save button here.
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                                Copiar al Portapapeles (Opcional)
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#f8fafc] dark:bg-gray-900 p-4 md:p-8">
                        <div className="mx-auto max-w-[900px] bg-white text-black p-8 md:p-12 shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0">
                            <div dangerouslySetInnerHTML={{ __html: generatedReport }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerfilSociodemografico;
