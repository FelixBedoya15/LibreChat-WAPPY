import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Upload,
    Download,
    X,
    Inbox,
    CheckCircle,
    PenTool,
    Briefcase,
    AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import SignaturePad from '~/components/SGSST/SignaturePad';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import SingleSelect from './SingleSelect';
import ReportHistory from '~/components/Liva/ReportHistory';
import { QRCodeSVG } from 'qrcode.react';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { useAutoLoadReport } from './useAutoLoadReport';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import cn from '~/utils/cn';

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
    diagnosticoMedico: string;
    recomendacionesMedicas: string;
    fechaSeguimiento: string;
    // New Demographic / Medical Fields
    emergenciaContacto: string;
    tipoSangre: string;
    enfermedades: string;
    medicamentos: string;
    fuma: string;
    alcohol: string;
    terapiaPsicologica: string;
    personasCargo: number | '';
    estrato: string;
    vivienda: string;
    // New Conditional Fields (Conductor)
    soatVencimiento: string;
    tecnicomecanicaVencimiento: string;
    // New Conditional Fields (SGSST)
    licenciaSST: string;
    licenciaVencimiento: string;
    curso50h: string;
    curso20h: string;

    completedByAI: boolean;
    consentimientoFirmaDigital: string;
    firmaDigital: string | null;
}

const EMPTY_WORKER: Omit<WorkerEntry, 'id'> = {
    nombre: '', identificacion: '', edad: '', genero: '', estadoCivil: '',
    nivelEscolaridad: '', direccion: '', telefono: '', cargo: '',
    fechaExamenMedico: '', fechaCursoAlturasAutorizado: '', fechaCursoAlturasCoordinador: '',
    diagnosticoMedico: '', recomendacionesMedicas: '', fechaSeguimiento: '',
    emergenciaContacto: '', tipoSangre: '', enfermedades: '', medicamentos: '',
    fuma: '', alcohol: '', terapiaPsicologica: '', personasCargo: '',
    estrato: '', vivienda: '', soatVencimiento: '', tecnicomecanicaVencimiento: '',
    licenciaSST: '', licenciaVencimiento: '', curso50h: '', curso20h: '',
    completedByAI: false, consentimientoFirmaDigital: 'No', firmaDigital: null,
};

const PerfilSociodemografico = () => {
    const { token, user } = useAuthContext();
    const { showToast } = useToastContext();

    const [trabajadores, setTrabajadores] = useState<WorkerEntry[]>([]);
    const [workerTabs, setWorkerTabs] = useState<Record<string, string>>({});
    const [activeSignatureWorkerId, setActiveSignatureWorkerId] = useState<string | null>(null);

    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview');

    useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user?.personalization?.geminiModels?.sstManagement]);
    const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [cargosDisponibles, setCargosDisponibles] = useState<any[]>([]);

    // Report state
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // QR Code Modal State
    const [selectedQrWorker, setSelectedQrWorker] = useState<WorkerEntry | null>(null);
    const [qrTab, setQrTab] = useState<'profile' | 'update'>('profile');

    // Inbox: pending profile updates from workers
    const [showInboxPerfil, setShowInboxPerfil] = useState(false);
    const [inboxPerfil, setInboxPerfil] = useState<any[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(false);

    // Public portal QR modal state
    const [showPortalQr, setShowPortalQr] = useState(false);
    // ─── Sync Signatures ────────────────────────────────────────
    const syncWorkersSignaturesToStorage = (workers: WorkerEntry[]) => {
        try {
            const namedSigsStr = localStorage.getItem('wappy_signatures');
            const namedSignatures: Record<string, string> = namedSigsStr ? JSON.parse(namedSigsStr) : {};
            let updated = false;

            for (const w of workers) {
                if (w.consentimientoFirmaDigital === 'Sí' && w.firmaDigital && w.nombre) {
                    namedSignatures[w.nombre.trim().toUpperCase()] = w.firmaDigital;
                    updated = true;
                }
            }

            if (updated) {
                localStorage.setItem('wappy_signatures', JSON.stringify(namedSignatures));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Error syncing worker signatures', e);
        }
    };

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
                    if (data.trabajadores?.length) {
                        setTrabajadores(data.trabajadores);
                        syncWorkersSignaturesToStorage(data.trabajadores);
                    }
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

        // Load available Cargo Profiles
        fetch('/api/sgsst/perfiles-cargo/data', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.perfilesList) {
                    setCargosDisponibles(data.perfilesList);
                }
            })
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

    const handleFirmaUpload = (workerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                updateWorkerField(workerId, 'firmaDigital', readerEvent.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // ─── Excel Import/Export ───────────────────────────────────
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportExcel = () => {
        const dataToExport = trabajadores.map(w => ({
            'Nombre': w.nombre,
            'Identificación': w.identificacion,
            'Edad': w.edad,
            'Género': w.genero,
            'Estado Civil': w.estadoCivil,
            'Nivel Escolaridad': w.nivelEscolaridad,
            'Dirección': w.direccion,
            'Teléfono': w.telefono,
            'Cargo': w.cargo,
            'Contacto de Emergencia': w.emergenciaContacto,
            'Tipo de Sangre': w.tipoSangre,
            'Personas a Cargo': w.personasCargo,
            'Estrato': w.estrato,
            'Tipo de Vivienda': w.vivienda,
            'Fecha Examen Médico': w.fechaExamenMedico,
            'Curso Alturas Autorizado': w.fechaCursoAlturasAutorizado,
            'Curso Alturas Coordinador': w.fechaCursoAlturasCoordinador,
            'Diagnóstico Médico': w.diagnosticoMedico,
            'Recomendaciones Medicas': w.recomendacionesMedicas,
            'Enfermedades Actuales': w.enfermedades,
            'Medicamentos': w.medicamentos,
            'Fuma': w.fuma,
            'Alcohol': w.alcohol,
            'Terapia Psicológica': w.terapiaPsicologica,
            'Fecha Seguimiento': w.fechaSeguimiento,
            'Vencimiento SOAT': w.soatVencimiento,
            'Vencimiento Tecnicomecánica': w.tecnicomecanicaVencimiento,
            'N° Licencia SGSST': w.licenciaSST,
            'Venc. Licencia SGSST': w.licenciaVencimiento,
            'Curso 50h': w.curso50h,
            'Curso 20h': w.curso20h,
            'Consentimiento Firma': w.consentimientoFirmaDigital
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Trabajadores");
        XLSX.writeFile(workbook, "Perfil_Sociodemografico.xlsx");
        showToast({ message: 'Archivo Excel exportado exitosamente', status: 'success' });
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (eEvent) => {
            try {
                const data = eEvent.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const importedData = XLSX.utils.sheet_to_json<any>(sheet);

                if (!importedData || importedData.length === 0) {
                    throw new Error("El archivo no contiene datos.");
                }

                const newWorkers: WorkerEntry[] = importedData.map((row: any) => {
                    return {
                        ...EMPTY_WORKER,
                        id: crypto.randomUUID(),
                        nombre: row['Nombre'] || row.nombre || '',
                        identificacion: row['Identificación'] || row.identificacion || '',
                        edad: row['Edad'] || row.edad || '',
                        genero: row['Género'] || row.genero || '',
                        estadoCivil: row['Estado Civil'] || row.estadoCivil || '',
                        nivelEscolaridad: row['Nivel Escolaridad'] || row.nivelEscolaridad || '',
                        direccion: row['Dirección'] || row.direccion || '',
                        telefono: row['Teléfono'] || row.telefono || '',
                        cargo: row['Cargo'] || row.cargo || '',
                        fechaExamenMedico: row['Fecha Examen Médico'] || row.fechaExamenMedico || '',
                        fechaCursoAlturasAutorizado: row['Curso Alturas Autorizado'] || row.fechaCursoAlturasAutorizado || '',
                        fechaCursoAlturasCoordinador: row['Curso Alturas Coordinador'] || row.fechaCursoAlturasCoordinador || '',
                        diagnosticoMedico: row['Diagnóstico Médico'] || row.diagnosticoMedico || '',
                        recomendacionesMedicas: row['Recomendaciones Medicas'] || row.recomendacionesMedicas || '',
                        fechaSeguimiento: row['Fecha Seguimiento'] || row.fechaSeguimiento || '',
                        emergenciaContacto: row['Contacto de Emergencia'] || row.emergenciaContacto || '',
                        tipoSangre: row['Tipo de Sangre'] || row.tipoSangre || '',
                        enfermedades: row['Enfermedades Actuales'] || row.enfermedades || '',
                        medicamentos: row['Medicamentos'] || row.medicamentos || '',
                        fuma: row['Fuma'] || row.fuma || '',
                        alcohol: row['Alcohol'] || row.alcohol || '',
                        terapiaPsicologica: row['Terapia Psicológica'] || row.terapiaPsicologica || '',
                        personasCargo: row['Personas a Cargo'] || row.personasCargo || '',
                        estrato: row['Estrato'] || row.estrato || '',
                        vivienda: row['Tipo de Vivienda'] || row.vivienda || '',
                        soatVencimiento: row['Vencimiento SOAT'] || row.soatVencimiento || '',
                        tecnicomecanicaVencimiento: row['Vencimiento Tecnicomecánica'] || row.tecnicomecanicaVencimiento || '',
                        licenciaSST: row['N° Licencia SGSST'] || row.licenciaSST || '',
                        licenciaVencimiento: row['Venc. Licencia SGSST'] || row.licenciaVencimiento || '',
                        curso50h: row['Curso 50h'] || row.curso50h || '',
                        curso20h: row['Curso 20h'] || row.curso20h || '',
                        consentimientoFirmaDigital: row['Consentimiento Firma'] || row.consentimientoFirmaDigital || 'No',
                        firmaDigital: null,
                        completedByAI: false,
                    };
                });

                setTrabajadores(prev => [...prev, ...newWorkers]);
                showToast({ message: `${newWorkers.length} trabajadores importados correctamente`, status: 'success' });
            } catch (err) {
                console.error("Error importing Excel:", err);
                showToast({ message: 'Error al importar Excel. Verifique el formato del archivo.', status: 'error' });
            }
        };
        reader.readAsArrayBuffer(file);
        if (e.target) e.target.value = '';
    };

    // ─── Save & Generate ────────────────────────────────────────
    const handleDummyData = () => {
        const dummyWorkers = generateDummyData.perfilSociodemografico();
        if (cargosDisponibles.length > 0) {
            dummyWorkers.forEach(w => w.cargo = cargosDisponibles[0].nombreCargo);
        }
        setTrabajadores(prev => [...prev, ...dummyWorkers]);
        showToast({ message: `${dummyWorkers.length} trabajadores simulados generados con éxito`, status: 'success' });
    };

    const handleSaveData = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            syncWorkersSignaturesToStorage(trabajadores);

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
            const trabajadoresConRol = trabajadores.map(w => ({
                ...w,
                perfilCargoData: cargosDisponibles.find(c => c.nombreCargo === w.cargo) || null
            }));

            const payload = {
                trabajadores: trabajadoresConRol,
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
    }, [trabajadores, cargosDisponibles, showToast, token, user, selectedModel]);

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

                // Synchronize state
                setGeneratedReport(content);
                setEditorContent(content);

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

    // ─── QR: Portal de auto-actualización por el propio trabajador ───────
    const getUpdateQrValue = (w: WorkerEntry) => {
        const base = window.location.origin;
        return `${base}/sgsst-public/perfil-update/${user?.id || ''}/${w.id}`;
    };

    // ─── Bio-Fit Engine ──────────────────────────────────────────
    const calculateBiocentricFit = (w: WorkerEntry) => {
        let score = 100;
        let alerts: string[] = [];
        let isLethal = false;

        const cargo = cargosDisponibles.find(c => c.nombreCargo === w.cargo);
        if (!cargo) return { score: 0, alerts: ['No hay rol asignado'], isLethal: false };

        // Física
        if (cargo.exigenciaFisica === 'Alta') {
            if (w.edad && Number(w.edad) > 55) {
                score -= 15;
                alerts.push('Edad avanzada para Alta Exigencia Física');
            }
            if (w.enfermedades?.trim()) {
                score -= 20;
                alerts.push('Enfermedad detectada en rol de alta carga física');
            }
        }

        // Mental/Psicosocial
        if (cargo.exigenciaMental === 'Alta') {
            if (w.terapiaPsicologica === 'Sí') {
                score -= 10;
                alerts.push('Alerta de Burnout: Rol de alta demanda mental + Terapia reportada');
            }
            if (w.personasCargo && Number(w.personasCargo) >= 3 && ['1', '2'].includes(w.estrato)) {
                score -= 10;
                alerts.push('Alerta Psicosocial: Alta carga familiar/económica y rol estresante');
            }
        }

        // Maquinaria (Lethal)
        if (cargo.operaMaquinaria === 'Sí') {
            if (w.medicamentos?.toLowerCase().includes('psiquiátrico') || 
                w.medicamentos?.toLowerCase().includes('dormir') ||
                w.alcohol === 'Sí (Frecuente)') {
                score -= 50;
                isLethal = true;
                alerts.push('BLOQUEO PREVENTIVO: Sustancias/Medicamentos + Maquinaria Peligrosa');
            }
        }

        // Brechas de Entrenamiento
        if (cargo.entrenamientosSeleccionados && cargo.entrenamientosSeleccionados.length > 0) {
            const missing = cargo.entrenamientosSeleccionados.length; // Simplification for now
            if (missing > 0 && !w.curso50h && !w.curso20h) {
                score -= 5;
                alerts.push('Brecha de Entrenamiento detectada');
            }
        }

        return { score: Math.max(0, score), alerts, isLethal };
    };

    // ─── Render ──────────────────────────────────────────────────

    useAutoLoadReport({
        token,
        tags: ['sgsst-perfil-sociodemografico'],
        generatedReport: generatedReport,
        handleSelectReport
    });

    // Load inbox on open
    const handleLoadInbox = async () => {
        setLoadingInbox(true);
        setShowInboxPerfil(true);
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setInboxPerfil(json.actualizacionesPendientes || []);
        } catch (e) {
            showToast({ message: 'Error al cargar actualizaciones pendientes', status: 'error' });
        } finally {
            setLoadingInbox(false);
        }
    };

    // Approve a pending update: merge into worker
    const handleApproveUpdate = async (update: any) => {
        const { workerId, changes } = update;
        setTrabajadores(prev => prev.map(w => w.id === workerId ? { ...w, ...changes } : w));
        setInboxPerfil(prev => prev.filter(u => u.id !== update.id));
        showToast({ message: 'Actualización aprobada y aplicada al perfil', status: 'success' });
    };

    // Dismiss a pending update
    const handleDismissUpdate = (updateId: string) => {
        setInboxPerfil(prev => prev.filter(u => u.id !== updateId));
        showToast({ message: 'Solicitud descartada', status: 'success' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onSaveLocal={handleSaveData}
                isSavingLocal={isSaving}
                onSave={handleSaveReport}
                hasContent={!!generatedReport}
                exportContent={editorContent || generatedReport || ''}
                exportFileName="Perfil_Sociodemografico"
                onDummy={handleDummyData}
                onImportExcel={() => fileInputRef.current?.click()}
                onExportExcel={handleExportExcel}
                hasData={trabajadores.length > 0}
                customSections={[
                    <div className="flex items-center gap-2">
                        <ToolbarButton
                            id="inbox-perfil"
                            onClick={handleLoadInbox}
                            label={`Reportes (${inboxPerfil.length})`}
                            icon="inbox"
                            badge={inboxPerfil.length || undefined}
                            active={showInboxPerfil}
                        />
                        <ToolbarButton
                            id="portal-perfil-qr"
                            onClick={() => setShowPortalQr(true)}
                            label="Portal Público"
                            icon="qrcode"
                        />
                    </div>
                ]}
            />

            {/* ═══ Inbox Panel: Pending Profile Updates ═══ */}
            {showInboxPerfil && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInboxPerfil(false)}>
                    <div className="w-full max-w-5xl rounded-xl border border-cyan-200 bg-surface-primary dark:bg-surface-primary overflow-hidden shadow-2xl p-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-cyan-800 dark:text-cyan-400 flex items-center gap-2">
                            <Inbox className="w-5 h-5" /> Actualizaciones de Perfil Recibidas
                        </h3>
                        <button onClick={() => setShowInboxPerfil(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {loadingInbox ? (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin mr-2 text-cyan-500" /> Cargando...
                        </div>
                    ) : inboxPerfil.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3 opacity-50" />
                            <p>No hay actualizaciones pendientes por revisar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inboxPerfil.map((item: any, idx: number) => (
                                <div key={idx} className="rounded-xl shadow border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.workerName || 'Trabajador'}</p>
                                            <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('es-CO')}</p>
                                        </div>
                                        <button onClick={() => handleDismissUpdate(item.id)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                                        {Object.entries(item.changes || {}).slice(0, 5).map(([k, v]: any) => (
                                            <p key={k}><span className="font-semibold capitalize">{k}:</span> {String(v)}</p>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleApproveUpdate(item)}
                                        className="mt-auto w-full py-2 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 transition-colors"
                                    >
                                        ✓ Aprobar y Aplicar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>,
                document.body
            )}

            {/* ═══ History Modal (Popup) ═══ */}
            <ReportHistory
                onSelectReport={handleSelectReport}
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-perfil-sociodemografico']}
            />

            {/* ═══ Workers List ═══ */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-text-secondary">
                        <Loader2 className="h-8 w-8 animate-spin mr-3 text-teal-500" /> Cargando base de datos...
                    </div>
                ) : (
                    <>
                        {trabajadores.map((w, wIdx) => {
                            const fitData = calculateBiocentricFit(w);
                            const scoreColor = fitData.score >= 80 ? 'text-green-500' : fitData.score >= 60 ? 'text-yellow-500' : 'text-red-500';
                            const scoreBg = fitData.score >= 80 ? 'bg-green-50 dark:bg-green-900/20 shadow-green-500/20' : fitData.score >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-500/20' : 'bg-red-50 dark:bg-red-900/20 shadow-red-500/20';
                            
                            return (
                            <div key={w.id} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden border-l-4 border-l-teal-500 transition-all">
                                {/* Worker Header */}
                                <div className="flex items-center justify-between p-4 bg-surface-tertiary/30 cursor-pointer" onClick={() => toggleWorker(w.id)}>
                                    <div className="flex flex-wrap items-center gap-3 w-full">
                                        <div className="text-teal-500">
                                            {expandedWorkers.has(w.id) ? <AnimatedIcon name="chevron-down" size={20} /> : <AnimatedIcon name="chevron-right" size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-base">
                                                {wIdx + 1}. {w.nombre || 'Nuevo Trabajador'}
                                                <span className="ml-2 text-xs font-normal text-text-secondary">— {w.cargo || 'Sin cargo asignado'}</span>
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-0.5">CC: {w.identificacion || 'N/A'} | {w.genero || '—'} | {w.edad ? `${w.edad} años` : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 w-full">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedQrWorker(w); }}
                                            className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors">
                                            <AnimatedIcon name="qrcode" size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id); }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                            <AnimatedIcon name="trash" size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Worker Body */}
                                {expandedWorkers.has(w.id) && (
                                    <div className="p-0 border-t border-border-light animate-in fade-in duration-200 bg-surface-primary/30">
                                        
                                        {/* Bio-Fit Dashboard */}
                                        {w.cargo && cargosDisponibles.length > 0 && (
                                            <div className="p-4 border-b border-border-light bg-surface-secondary/50">
                                                <div className={`p-4 rounded-2xl border ${scoreBg} shadow-sm backdrop-blur-sm transition-all relative overflow-hidden`}>
                                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-md ${scoreColor} font-black text-2xl border-4 ${fitData.score >= 80 ? 'border-green-400' : fitData.score >= 60 ? 'border-yellow-400' : 'border-red-400'}`}>
                                                                {fitData.score}%
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
                                                                    <Sparkles className="w-4 h-4 text-teal-600"/> Fit Biocéntrico
                                                                </h4>
                                                                <p className="text-xs font-medium text-text-secondary">Compatibilidad calculada entre vulnerabilidad humana y exigencias del rol: <span className="font-bold text-text-primary">{w.cargo}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 w-full md:w-1/2">
                                                            {fitData.alerts.length === 0 ? (
                                                                <div className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 p-2 rounded-lg">
                                                                    <CheckCircle className="w-4 h-4"/> Bio-compatibilidad óptima. Sin alertas de riesgo cruzado.
                                                                </div>
                                                            ) : (
                                                                fitData.alerts.map((alert, idx) => (
                                                                    <div key={idx} className={`flex text-xs font-bold p-2 rounded-lg gap-2 items-center ${alert.includes('BLOQUEO') ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0"/> {alert}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tabs Header */}
                                        <div className="flex items-center overflow-x-auto border-b border-border-light bg-surface-secondary px-4 pt-1 hide-scrollbar">
                                            <button
                                                onClick={(e) => { e.preventDefault(); setWorkerTabs(prev => ({ ...prev, [w.id]: 'general' })); }}
                                                className={cn("px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors", (workerTabs[w.id] || 'general') === 'general' ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-text-secondary hover:text-text-primary")}
                                            > General & Laboral </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); setWorkerTabs(prev => ({ ...prev, [w.id]: 'salud' })); }}
                                                className={cn("px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors", (workerTabs[w.id] || 'general') === 'salud' ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-text-secondary hover:text-text-primary")}
                                            > Salud & Hábitos </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); setWorkerTabs(prev => ({ ...prev, [w.id]: 'roles' })); }}
                                                className={cn("px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors", (workerTabs[w.id] || 'general') === 'roles' ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-text-secondary hover:text-text-primary")}
                                            > Roles & Especialidades </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="p-4">
                                            {/* TAB 1: GENERAL */}
                                            {(workerTabs[w.id] || 'general') === 'general' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Nombre Completo</label>
                                                        <input type="text" value={w.nombre} onChange={e => updateWorkerField(w.id, 'nombre', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary font-medium" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Identificación (CC)</label>
                                                        <input type="text" value={w.identificacion} onChange={e => updateWorkerField(w.id, 'identificacion', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tighter flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Perfil de Cargo</label>
                                                        <SingleSelect value={w.cargo || ''} onChange={val => updateWorkerField(w.id, 'cargo', val)} placeholder="Seleccione el Rol..." options={cargosDisponibles.map(c => c.nombreCargo)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Teléfono</label>
                                                        <input type="text" value={w.telefono} onChange={e => updateWorkerField(w.id, 'telefono', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Edad</label>
                                                        <input type="number" value={w.edad} onChange={e => updateWorkerField(w.id, 'edad', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Género</label>
                                                        <SingleSelect value={w.genero || ''} onChange={val => updateWorkerField(w.id, 'genero', val)} placeholder="Seleccione..." options={['Masculino', 'Femenino', 'Otro']} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Estado Civil</label>
                                                        <SingleSelect value={w.estadoCivil || ''} onChange={val => updateWorkerField(w.id, 'estadoCivil', val)} placeholder="Seleccione..." options={['Soltero/a', 'Casado/a', 'Unión Libre', 'Separado/a', 'Viudo/a']} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Nivel Escolaridad</label>
                                                        <SingleSelect value={w.nivelEscolaridad || ''} onChange={val => updateWorkerField(w.id, 'nivelEscolaridad', val)} placeholder="Seleccione..." options={['Ninguna', 'Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Profesional', 'Especialización / Postgrado']} />
                                                    </div>

                                                    <div className="space-y-1 lg:col-span-2">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Dirección (Google Maps)</label>
                                                        <input type="text" value={w.direccion} onChange={e => updateWorkerField(w.id, 'direccion', e.target.value)}
                                                            placeholder="Ej: Calle 123 #45-67, Medellín"
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Vivienda</label>
                                                        <SingleSelect value={w.vivienda || ''} onChange={val => updateWorkerField(w.id, 'vivienda', val)} placeholder="Seleccione..." options={['Propia', 'Arrendada', 'Familiar']} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Estrato</label>
                                                        <SingleSelect value={w.estrato || ''} onChange={val => updateWorkerField(w.id, 'estrato', val)} placeholder="Seleccione..." options={['1', '2', '3', '4', '5', '6']} />
                                                    </div>

                                                    <div className="space-y-1 lg:col-span-2">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Contacto de Emergencia</label>
                                                        <input type="text" value={w.emergenciaContacto} onChange={e => updateWorkerField(w.id, 'emergenciaContacto', e.target.value)}
                                                            placeholder="Nombre y Teléfono"
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>
                                                    <div className="space-y-1 lg:col-span-2">
                                                        <label className="text-xs font-bold text-text-secondary uppercase">Personas a Cargo</label>
                                                        <input type="number" value={w.personasCargo} onChange={e => updateWorkerField(w.id, 'personasCargo', e.target.value)}
                                                            placeholder="Número de personas"
                                                            className="w-full text-sm p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 2: SALUD Y HÁBITOS */}
                                            {(workerTabs[w.id] || 'general') === 'salud' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    {/* Grupo 1: Fisiológicos */}
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Tipo de Sangre</label>
                                                        <SingleSelect value={w.tipoSangre || ''} onChange={val => updateWorkerField(w.id, 'tipoSangre', val)} placeholder="Seleccione..." options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} />
                                                    </div>
                                                    <div className="space-y-1 lg:col-span-3">
                                                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Enfermedades Actuales (Preexistencias)</label>
                                                        <input type="text" value={w.enfermedades} onChange={e => updateWorkerField(w.id, 'enfermedades', e.target.value)}
                                                            placeholder="Indique si sufre alguna enfermedad diagnosticada..."
                                                            className="w-full text-sm p-2 rounded-xl border border-rose-200 bg-rose-50/10 dark:bg-rose-900/10 text-text-primary" />
                                                    </div>

                                                    <div className="space-y-1 lg:col-span-2">
                                                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Diagnóstico / Hallazgos Ocupacionales</label>
                                                        <SingleSelect value={w.diagnosticoMedico || '' || ''} onChange={val => updateWorkerField(w.id, 'diagnosticoMedico', val)} placeholder="Seleccione..." options={['Apto / Sin Hallazgos / Ninguno', 'Espalda: Lumbalgia / Cervicalgia / Hernias', 'M. Superiores: Túnel carpiano / Epicondilitis / Manguito', 'Vicios de refracción', 'Hipoacusia', 'Otros (No categorizado)']} />
                                                    </div>
                                                    <div className="space-y-1 lg:col-span-2">
                                                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Medicamentos Estrictos</label>
                                                        <input type="text" value={w.medicamentos} onChange={e => updateWorkerField(w.id, 'medicamentos', e.target.value)}
                                                            placeholder="Fármacos de consumo habitual"
                                                            className="w-full text-sm p-2 rounded-xl border border-rose-200 bg-rose-50/10 dark:bg-rose-900/10 text-text-primary" />
                                                    </div>

                                                    <div className="space-y-1 lg:col-span-3">
                                                        <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Recomendaciones Médicas</label>
                                                        <input type="text" value={w.recomendacionesMedicas || ''} onChange={e => updateWorkerField(w.id, 'recomendacionesMedicas', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-rose-200 bg-rose-50/10 dark:bg-rose-900/10 text-text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Último Examen</label>
                                                        <input type="date" value={w.fechaExamenMedico} onChange={e => updateWorkerField(w.id, 'fechaExamenMedico', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-orange-200 bg-orange-50/10 dark:bg-orange-900/10 text-text-primary" />
                                                    </div>

                                                    {/* Grupo Hábitos */}
                                                    <div className="space-y-1 border-t border-border-light pt-4 mt-2">
                                                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Fuma</label>
                                                        <SingleSelect value={w.fuma || ''} onChange={val => updateWorkerField(w.id, 'fuma', val)} placeholder="Seleccione..." options={['No', 'Sí, diario', 'Ocasional']} />
                                                    </div>
                                                    <div className="space-y-1 border-t border-border-light pt-4 mt-2">
                                                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Consumo de Alcohol</label>
                                                        <SingleSelect value={w.alcohol || ''} onChange={val => updateWorkerField(w.id, 'alcohol', val)} placeholder="Seleccione..." options={['No', 'Mensual', 'Semanal', 'Diario']} />
                                                    </div>
                                                    <div className="space-y-1 border-t border-border-light pt-4 mt-2">
                                                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Terapia Psicológica</label>
                                                        <SingleSelect value={w.terapiaPsicologica || ''} onChange={val => updateWorkerField(w.id, 'terapiaPsicologica', val)} placeholder="Seleccione..." options={['No', 'Sí, actualmente', 'Anteriormente']} />
                                                    </div>
                                                    <div className="space-y-1 border-t border-border-light pt-4 mt-2">
                                                        <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Próximo Segumiento</label>
                                                        <input type="date" value={w.fechaSeguimiento} onChange={e => updateWorkerField(w.id, 'fechaSeguimiento', e.target.value)}
                                                            className="w-full text-sm p-2 rounded-xl border border-orange-200 bg-orange-50/10 dark:bg-orange-900/10 text-text-primary" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 3: ROLES Y FIRMA */}
                                            {(workerTabs[w.id] || 'general') === 'roles' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    
                                                    {/* Alturas (Default) */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase leading-tight">Alturas — Trab. Autorizado</label>
                                                            <input type="date" value={w.fechaCursoAlturasAutorizado} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasAutorizado', e.target.value)}
                                                                className="w-full text-sm p-2 rounded-xl border border-teal-200 bg-teal-50/10 dark:bg-teal-900/10 text-text-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase leading-tight">Alturas — Coordinador</label>
                                                            <input type="date" value={w.fechaCursoAlturasCoordinador} onChange={e => updateWorkerField(w.id, 'fechaCursoAlturasCoordinador', e.target.value)}
                                                                className="w-full text-sm p-2 rounded-xl border border-teal-200 bg-teal-50/10 dark:bg-teal-900/10 text-text-primary" />
                                                        </div>
                                                    </div>

                                                    {/* Conductor Conditional */}
                                                    {w.cargo && w.cargo.toLowerCase().includes('conductor') && (
                                                        <div className="p-4 border border-blue-200 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <h4 className="md:col-span-2 text-blue-700 dark:text-blue-400 font-bold text-sm uppercase">Requisitos de Conductor</h4>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Vencimiento SOAT</label>
                                                                <input type="date" value={w.soatVencimiento} onChange={e => updateWorkerField(w.id, 'soatVencimiento', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-blue-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Vencimiento Tecnicomecánica</label>
                                                                <input type="date" value={w.tecnicomecanicaVencimiento} onChange={e => updateWorkerField(w.id, 'tecnicomecanicaVencimiento', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-blue-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* SST Conditional */}
                                                    {w.cargo && ['sst', 'hseq', 'seguridad', 'salud', 'ocupacional'].some(kw => w.cargo.toLowerCase().includes(kw)) && (
                                                        <div className="p-4 border border-purple-200 bg-purple-50/30 dark:bg-purple-900/20 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <h4 className="md:col-span-4 lg:col-span-4 text-purple-700 dark:text-purple-400 font-bold text-sm uppercase">Perfil SST Exigido</h4>
                                                            <div className="space-y-1 lg:col-span-2">
                                                                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Nº Licencia SST</label>
                                                                <input type="text" value={w.licenciaSST} onChange={e => updateWorkerField(w.id, 'licenciaSST', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-purple-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                            <div className="space-y-1 lg:col-span-2">
                                                                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Vencimiento Licencia</label>
                                                                <input type="date" value={w.licenciaVencimiento} onChange={e => updateWorkerField(w.id, 'licenciaVencimiento', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-purple-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                            <div className="space-y-1 lg:col-span-2">
                                                                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Curso de 50 Horas (Expedición)</label>
                                                                <input type="date" value={w.curso50h} onChange={e => updateWorkerField(w.id, 'curso50h', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-purple-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                            <div className="space-y-1 lg:col-span-2">
                                                                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Curso de 20 Horas (Expedición)</label>
                                                                <input type="date" value={w.curso20h} onChange={e => updateWorkerField(w.id, 'curso20h', e.target.value)}
                                                                    className="w-full text-sm p-2 rounded-xl border border-purple-200 bg-white dark:bg-gray-800 text-text-primary" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Firma Digital */}
                                                    <div className="space-y-1 lg:col-span-4 p-4 border rounded-xl bg-surface-tertiary/30 border-border-medium">
                                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                            <div className="space-y-1 w-full md:w-1/2">
                                                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-tight">Consentimiento Informado (Firma Digital)</label>
                                                                <SingleSelect value={w.consentimientoFirmaDigital || 'No' || ''} onChange={val => updateWorkerField(w.id, 'consentimientoFirmaDigital', val)} placeholder="Seleccione..." options={['Sí', 'No']} />
                                                                <p className="text-[10px] text-text-secondary mt-1 max-w-[280px]">Muestra la firma en el Código QR y la habilita para reportar.</p>
                                                            </div>

                                                            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-medium rounded-xl relative hover:bg-surface-secondary/50 transition-colors">
                                                                {w.firmaDigital ? (
                                                                    <div className="relative group w-full flex items-center justify-center">
                                                                        <img src={w.firmaDigital} alt="Firma" className="max-h-16 object-contain" />
                                                                        <button
                                                                            onClick={() => updateWorkerField(w.id, 'firmaDigital', null)}
                                                                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"
                                                                        >
                                                                            <AnimatedIcon name="trash" size={14} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2 w-full">
                                                                        <label className="cursor-pointer text-center flex items-center justify-center gap-2 px-3 py-2 bg-surface-hover hover:bg-surface-tertiary rounded-lg text-text-secondary w-full transition-colors font-medium border border-border-light">
                                                                            <ImageIcon size={16} className="text-indigo-400" />
                                                                            <span className="text-xs uppercase">Cargar Archivo</span>
                                                                            <input type="file" accept="image/*" onChange={(e) => handleFirmaUpload(w.id, e)} className="hidden" />
                                                                        </label>
                                                                        <button 
                                                                            onClick={(e) => { e.preventDefault(); setActiveSignatureWorkerId(w.id); }}
                                                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg w-full transition-colors font-medium border border-indigo-200 dark:border-indigo-800"
                                                                        >
                                                                            <PenTool size={16} />
                                                                            <span className="text-xs uppercase">Dibujar en Pantalla</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                        })}

                        {/* Add Worker Button */}
                        <button onClick={handleAddWorker}
                            className="w-full p-4 border-2 border-dashed border-border-medium rounded-2xl flex items-center justify-center gap-2 text-text-secondary hover:bg-surface-secondary/50 hover:text-teal-500 transition-all">
                            <AnimatedIcon name="plus" size={20} />
                            <span className="font-bold">Agregar Nuevo Trabajador</span>
                        </button>
                    </>
                )}
            </div>

            {/* ═══ Report Viewer (inline, igual que ResponsableSGSST) ═══ */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm mt-8">
                    <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <AnimatedIcon name="file-text" size={16} className="text-indigo-500" />
                            Documento de Perfil Sociodemográfico Generado
                        </h3>
                        <span className="text-xs text-text-secondary">Edita si es necesario</span>
                    </div>
                    <div className="rounded-xl p-1 overflow-hidden">
                        <LiveEditor 
                            key={editorKey} 
                            initialContent={generatedReport} 
                            onUpdate={setEditorContent} 
                            onSave={handleSaveReport} 
                            reportSourceData={trabajadores} 
                        />
                    </div>
                </div>
            )}

            {/* ═══ QR Modal ═══ */}
            {selectedQrWorker && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => { setSelectedQrWorker(null); setQrTab('profile'); }}>
                    <div
                        className="bg-surface-primary w-full max-w-[280px] rounded-2xl shadow-2xl overflow-hidden border border-border-medium"
                        onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-4 text-center relative">
                            <button onClick={() => { setSelectedQrWorker(null); setQrTab('profile'); }} className="absolute top-3 right-3 text-teal-100 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full mb-2 shadow-inner backdrop-blur-sm">
                                <AnimatedIcon name="qrcode" size={20} className="text-white" />
                            </div>
                            <h3 className="font-bold text-sm">{selectedQrWorker.nombre || 'Trabajador'}</h3>
                            <p className="text-[10px] text-teal-100 mt-0.5 opacity-90">{selectedQrWorker.cargo || 'Sin cargo'}</p>
                        </div>

                        {/* QR Tab Switcher */}
                        <div className="flex border-b border-gray-100 dark:border-border-medium bg-white dark:bg-surface-primary">
                            <button
                                onClick={() => setQrTab('profile')}
                                className={cn('flex-1 py-2 text-[10px] font-bold transition-colors', qrTab === 'profile' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-400 hover:text-gray-600')}>
                                Ver Perfil
                            </button>
                            <button
                                onClick={() => setQrTab('update')}
                                className={cn('flex-1 py-2 text-[10px] font-bold transition-colors', qrTab === 'update' ? 'border-b-2 border-cyan-500 text-cyan-600' : 'text-gray-400 hover:text-gray-600')}>
                                Actualizar Datos
                            </button>
                        </div>

                        {/* QR Code Body */}
                        <div className="p-6 flex flex-col items-center bg-white dark:bg-surface-primary space-y-5">
                            {qrTab === 'profile' ? (
                                <>
                                    <p className="text-sm text-center text-gray-600 dark:text-gray-300 leading-relaxed max-w-[260px]">
                                        Escanea este código para ver el perfil público del trabajador.
                                    </p>
                                    <div className="p-3 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                        <QRCodeSVG value={getQrValue(selectedQrWorker)} size={120} style={{ width: '120px', height: '120px' }} className="mx-auto" level="L" includeMargin={false} />
                                    </div>
                                    <div className="text-center text-gray-600 dark:text-gray-400 space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Identificación (CC)</p>
                                        <p className="text-base font-bold text-gray-700 dark:text-gray-200">{selectedQrWorker.identificacion || 'N/A'}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-center text-gray-600 dark:text-gray-300 leading-relaxed max-w-[260px]">
                                        El trabajador escanea este QR o usa el enlace para actualizar su información sociodemográfica.
                                    </p>
                                    <div className="p-3 border-4 border-cyan-100 dark:border-cyan-800 rounded-2xl shadow-inner bg-white">
                                        <QRCodeSVG value={getUpdateQrValue(selectedQrWorker)} size={120} style={{ width: '120px', height: '120px' }} className="mx-auto" level="L" includeMargin={false} />
                                    </div>
                                    <div className="w-full space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600 text-center">Enlace de acceso personal</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                readOnly
                                                value={getUpdateQrValue(selectedQrWorker)}
                                                className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-600 dark:text-gray-300"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(getUpdateQrValue(selectedQrWorker));
                                                    showToast({ message: 'Enlace copiado al portapapeles', status: 'success' });
                                                }}
                                                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">Los cambios requerirán aprobación del admin SST</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-surface-secondary border-t border-gray-100 dark:border-border-medium flex justify-end">
                            <button
                                onClick={() => { setSelectedQrWorker(null); setQrTab('profile'); }}
                                className="px-6 py-2 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══ General Public Portal QR Modal ═══ */}
            {showPortalQr && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowPortalQr(false)}>
                    <div
                        className="bg-surface-primary w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-border-medium"
                        onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-4 text-center relative">
                            <button onClick={() => setShowPortalQr(false)} className="absolute top-3 right-3 text-teal-100 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-2 shadow-inner backdrop-blur-sm">
                                <AnimatedIcon name="qrcode" size={24} className="text-white" />
                            </div>
                            <h3 className="font-bold text-lg uppercase tracking-tighter">Portal Público SGSST</h3>
                            <p className="text-[11px] text-teal-100 mt-0.5 opacity-90">Auto-Actualización de Perfil</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 flex flex-col items-center bg-white dark:bg-surface-primary space-y-4 text-center">
                            <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed max-w-[240px]">
                                Comparte este código o enlace. Los trabajadores podrán actualizar su información sociodemográfica desde su celular.
                            </p>

                            <div className="p-2 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                <QRCodeSVG value={`${window.location.origin}/sgsst-public/perfil-update/${user?.id || ''}`} size={120} style={{ width: '120px', height: '120px' }} className="mx-auto" level="L" includeMargin={false} />
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Enlace de acceso público</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={`${window.location.origin}/sgsst-public/perfil-update/${user?.id || ''}`}
                                        className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-600 dark:text-gray-300 ring-0"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/sgsst-public/perfil-update/${user?.id || ''}`);
                                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success' });
                                        }}
                                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-surface-secondary border-t border-gray-100 dark:border-border-medium flex justify-end">
                            <button
                                onClick={() => setShowPortalQr(false)}
                                className="px-6 py-2 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══ Excel Import Hidden Input ═══ */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
            />

            <SignaturePad
                isOpen={!!activeSignatureWorkerId}
                onClose={() => setActiveSignatureWorkerId(null)}
                title={`Firma digital del trabajador`}
                onSave={(base64) => {
                    if (activeSignatureWorkerId) {
                        updateWorkerField(activeSignatureWorkerId, 'firmaDigital', base64);
                    }
                }}
            />
        </div>
    );
};

export default PerfilSociodemografico;
