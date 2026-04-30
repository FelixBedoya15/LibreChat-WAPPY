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
    AlertTriangle,
    Activity,
    Stethoscope,
    UserCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import SignaturePad from '~/components/SGSST/SignaturePad';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import SingleSelect from './SingleSelect';
import ReportHistory from '~/components/Liva/ReportHistory';
import { QRCodeSVG } from 'qrcode.react';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { useAutoLoadReport } from './useAutoLoadReport';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import cn from '~/utils/cn';
import CollapsibleReportBox from './CollapsibleReportBox';
import BioFitAuditModal from './BioFitAuditModal';

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
    licenciaConduccion: string;
    licenciaConduccionVencimiento: string;

    // New Conditional Fields (SGSST)
    licenciaSST: string;
    licenciaVencimiento: string;
    curso50h: string;
    curso20h: string;

    // Comités
    esCopasst: string;
    esComiteConvivencia: string;
    esBrigadista: string;
    esComiteSeguridadVial: string;

    // Formación (lista JSON o similar)
    formacion: any[];

    // New Biomonitoring Fields
    peso: string;
    talla: string;
    imc: string;
    presionArterial: string;
    frecuenciaCardiaca: string;
    limitacionesBiomecanicas: string;
    alergiasQuimicas: string;

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
    licenciaConduccion: '', licenciaConduccionVencimiento: '',
    licenciaSST: '', licenciaVencimiento: '', curso50h: '', curso20h: '',
    esCopasst: 'No', esComiteConvivencia: 'No', esBrigadista: 'No', esComiteSeguridadVial: 'No',
    formacion: [],
    peso: '', talla: '', imc: '', presionArterial: '', frecuenciaCardiaca: '',
    limitacionesBiomecanicas: '', alergiasQuimicas: '',
    completedByAI: false, consentimientoFirmaDigital: 'No', firmaDigital: null,
};

const CondicionesSalud = () => {
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
    const editorContentRef = useRef<string>('');
    const liveEditorRef = useRef<LiveEditorHandle>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // QR Code Modal State
    const [selectedQrWorker, setSelectedQrWorker] = useState<WorkerEntry | null>(null);
    const [qrTab, setQrTab] = useState<'profile' | 'update'>('profile');
    const [activeAuditWorker, setActiveAuditWorker] = useState<WorkerEntry | null>(null);

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
        setTrabajadores(prev => prev.map(w => {
            if (w.id !== workerId) return w;
            const updated = { ...w, [field]: value };
            
            // Auto calculate IMC if peso or talla is updated
            if (field === 'peso' || field === 'talla') {
                const { peso, talla } = updated;
                if (peso && talla) {
                    const p = parseFloat(String(peso).replace(',', '.'));
                    const t = parseFloat(String(talla).replace(',', '.'));
                    if (p > 0 && t > 0) {
                        const tMeters = t > 3 ? t / 100 : t; 
                        updated.imc = (p / (tMeters * tMeters)).toFixed(1);
                    } else {
                        updated.imc = '';
                    }
                } else {
                    updated.imc = '';
                }
            }
            return updated;
        }));
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
            'Licencia Conducción': w.licenciaConduccion,
            'Vencimiento Licencia Cond': w.licenciaConduccionVencimiento,
            'N° Licencia SGSST': w.licenciaSST,
            'Venc. Licencia SGSST': w.licenciaVencimiento,
            'Curso 50h': w.curso50h,
            'Curso 20h': w.curso20h,
            'COPASST': w.esCopasst,
            'Comité Convivencia': w.esComiteConvivencia,
            'Brigadista': w.esBrigadista,
            'Comité Seg. Vial': w.esComiteSeguridadVial,
            'Peso (kg)': w.peso,
            'Talla (m)': w.talla,
            'IMC': w.imc,
            'Presión Arterial': w.presionArterial,
            'Frecuencia Cardíaca': w.frecuenciaCardiaca,
            'Limitaciones Biomecánicas': w.limitacionesBiomecanicas,
            'Alergias / Sensibilidad Química': w.alergiasQuimicas,
            'Consentimiento Firma': w.consentimientoFirmaDigital
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Trabajadores");
        XLSX.writeFile(workbook, "Perfil_Sociodemografico.xlsx");
        showToast({ message: 'Archivo Excel exportado exitosamente', status: 'success', severity: 'success' });
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
                        licenciaConduccion: row['Licencia Conducción'] || row.licenciaConduccion || '',
                        licenciaConduccionVencimiento: row['Vencimiento Licencia Cond'] || row.licenciaConduccionVencimiento || '',
                        licenciaSST: row['N° Licencia SGSST'] || row.licenciaSST || '',
                        licenciaVencimiento: row['Venc. Licencia SGSST'] || row.licenciaVencimiento || '',
                        curso50h: row['Curso 50h'] || row.curso50h || '',
                        curso20h: row['Curso 20h'] || row.curso20h || '',
                        esCopasst: row['COPASST'] || row.esCopasst || 'No',
                        esComiteConvivencia: row['Comité Convivencia'] || row.esComiteConvivencia || 'No',
                        esBrigadista: row['Brigadista'] || row.esBrigadista || 'No',
                        esComiteSeguridadVial: row['Comité Seg. Vial'] || row.esComiteSeguridadVial || 'No',
                        formacion: row.formacion || [],
                        peso: row['Peso (kg)'] || row.peso || '',
                        talla: row['Talla (m)'] || row.talla || '',
                        imc: row['IMC'] || row.imc || '',
                        presionArterial: row['Presión Arterial'] || row.presionArterial || '',
                        frecuenciaCardiaca: row['Frecuencia Cardíaca'] || row.frecuenciaCardiaca || '',
                        limitacionesBiomecanicas: row['Limitaciones Biomecánicas'] || row.limitacionesBiomecanicas || '',
                        alergiasQuimicas: row['Alergias / Sensibilidad Química'] || row.alergiasQuimicas || '',
                        consentimientoFirmaDigital: row['Consentimiento Firma'] || row.consentimientoFirmaDigital || 'No',
                        firmaDigital: null,
                        completedByAI: false,
                    };
                });

                setTrabajadores(prev => [...prev, ...newWorkers]);
                showToast({ message: `${newWorkers.length} trabajadores importados correctamente`, status: 'success', severity: 'success' });
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
        setTrabajadores(prev => [...prev, ...dummyWorkers]);
        showToast({ message: `${dummyWorkers.length} trabajadores simulados generados con éxito`, status: 'success', severity: 'success' });
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
            if (res.ok) showToast({ message: 'Perfil sociodemográfico guardado', status: 'success', severity: 'success' });
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
            editorContentRef.current = data.report;
            liveEditorRef.current?.setHTML(data.report);
            setConversationId('new');
            setReportMessageId(null);
            showToast({ message: 'Informe sociodemográfico generado con éxito', status: 'success', severity: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [trabajadores, cargosDisponibles, showToast, token, user, selectedModel]);

    const handleSaveReport = useCallback(async () => {
        const content = editorContentRef.current || generatedReport;
        if (!content || !token) return;
        try {
            const isNew = !conversationId || conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(isNew ? {
                    content,
                    title: `Informe Condiciones de Salud - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-condiciones-salud'],
                } : { conversationId, messageId: reportMessageId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }

                // Synchronize state
                setGeneratedReport(content);
                editorContentRef.current = content;
            liveEditorRef.current?.setHTML(content);

                setRefreshTrigger(prev => prev + 1);
                setIsHistoryOpen(false);
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        }
    }, [editorContentRef.current, generatedReport, conversationId, reportMessageId, token, showToast]);

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
            setGeneratedReport(content); editorContentRef.current = content;
            liveEditorRef.current?.setHTML(content);
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
        return `${base}/api/sgsst/perfil-sociodemografico/profile/${w.id}?type=health`;
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
        const auditItems: { category: string, title: string, description: string, pointsDeducted: number, severity: 'info'|'warning'|'critical' }[] = [];

        const addAudit = (cat: string, title: string, desc: string, pts: number, sev: 'info'|'warning'|'critical') => {
            score -= pts;
            alerts.push(title);
            auditItems.push({ category: cat, title, description: desc, pointsDeducted: pts, severity: sev });
        };

        const cargo = cargosDisponibles.find(c => c.nombreCargo === w.cargo);
        if (!cargo) return { score: 0, alerts: ['No hay rol asignado'], auditItems: [], isLethal: false };

        // 1. Biometría y Signos Vitales
        if (w.imc) {
            const imc = parseFloat(w.imc);
            if (imc >= 30) addAudit('Clínico', 'Obesidad detectada', `El IMC de ${imc} indica obesidad, aumentando el riesgo cardiovascular y metabólico.`, 10, 'warning');
            else if (imc < 18.5) addAudit('Clínico', 'Bajo peso', `El IMC de ${imc} sugiere déficit nutricional o patología subyacente.`, 5, 'info');
        }

        if (w.presionArterial) {
            const [sisStr, diaStr] = w.presionArterial.split('/');
            const sis = parseInt(sisStr || '0');
            const dia = parseInt(diaStr || '0');
            if (sis >= 135 || dia >= 90) addAudit('Clínico', 'Riesgo de Hipertensión', `Presión de ${w.presionArterial} por encima de rangos óptimos. Requiere seguimiento médico.`, 15, 'warning');
        }

        if (w.frecuenciaCardiaca) {
            const fc = parseInt(w.frecuenciaCardiaca);
            if (fc > 100) addAudit('Clínico', 'Taquicardia en reposo', `Frecuencia cardíaca de ${fc} lpm indica posible estrés cardiovascular o metabólico.`, 10, 'warning');
            else if (fc < 50) addAudit('Clínico', 'Bradicardia', `Frecuencia inusualmente baja (${fc} lpm), puede requerir valoración cardiológica.`, 5, 'info');
        }

        // 2. Hábitos
        if (w.fuma === 'Sí, diario') addAudit('Clínico', 'Tabaquismo Activo', 'Consumo diario de tabaco impacta la capacidad pulmonar y oxigenación celular.', 10, 'warning');
        if (w.alcohol === 'Sí (Frecuente)') addAudit('Psicosocial', 'Etilismo Frecuente', 'Aumenta significativamente la accidentabilidad y vulnerabilidad hepática.', 15, 'warning');

        // 3. Patologías y Restricciones
        const hasEnfermedad = w.enfermedades?.trim() && !w.enfermedades.toLowerCase().includes('ningun');
        if (hasEnfermedad) addAudit('Clínico', 'Patología Base', `Condición reportada: ${w.enfermedades}. Requiere matriz de compatibilidad con el rol.`, 10, 'warning');

        const hasDiagnostico = w.diagnosticoMedico?.trim() && !w.diagnosticoMedico.toLowerCase().includes('ningun');
        if (hasDiagnostico && !hasEnfermedad) addAudit('Clínico', 'Diagnóstico Médico Reciente', `Se ha emitido un diagnóstico que amerita vigilancia médica.`, 5, 'info');

        const hasBiomecanica = w.limitacionesBiomecanicas && w.limitacionesBiomecanicas.length > 2 && !w.limitacionesBiomecanicas.toLowerCase().includes('ningun');
        if (hasBiomecanica) addAudit('Físico', 'Limitación Biomecánica', `Restricción reportada: ${w.limitacionesBiomecanicas}.`, 10, 'warning');

        const hasAlergia = w.alergiasQuimicas && w.alergiasQuimicas.length > 2 && !w.alergiasQuimicas.toLowerCase().includes('ningun');
        if (hasAlergia) addAudit('Clínico', 'Sensibilidad Inmunológica', `Alergia a químicos/elementos detectada. Peligro de anafilaxia o dermatitis.`, 10, 'warning');

        // 4. Vulnerabilidad Sociodemográfica y Psicosocial
        let vulnerabilidadSocial = 0;
        let socialDesc = [];
        if (['1', '2'].includes(w.estrato)) { vulnerabilidadSocial++; socialDesc.push('estrato socioeconómico bajo'); }
        if (w.personasCargo && Number(w.personasCargo) >= 3) { vulnerabilidadSocial++; socialDesc.push('alta carga de dependientes'); }
        if (w.estadoCivil?.toLowerCase().includes('solter') || w.estadoCivil?.toLowerCase().includes('viud') || w.estadoCivil?.toLowerCase().includes('divorciad')) {
            if (w.personasCargo && Number(w.personasCargo) > 0) { vulnerabilidadSocial++; socialDesc.push('monoparentalidad'); }
        }
        if (w.vivienda?.toLowerCase().includes('arrendada') || w.vivienda?.toLowerCase().includes('invasión')) { vulnerabilidadSocial++; socialDesc.push('inestabilidad habitacional'); }
        
        if (vulnerabilidadSocial >= 3) {
            addAudit('Psicosocial', 'Alta Vulnerabilidad Sociodemográfica', `Factores estresores crónicos: ${socialDesc.join(', ')}. Disminuye la resiliencia psicológica.`, 15, 'warning');
        } else if (vulnerabilidadSocial >= 2) {
            addAudit('Psicosocial', 'Riesgo Psicosocial Moderado', `Presencia de múltiples factores de presión externa.`, 5, 'info');
        }

        if (w.nivelEscolaridad?.toLowerCase().includes('primaria')) {
            addAudit('Sociodemográfico', 'Escolaridad Básica', 'Puede requerir métodos de capacitación más visuales y acompañamiento cercano en SST.', 5, 'info');
        }

        // 5. Cruce vs. Exigencias del Cargo
        if (cargo.exigenciaFisica === 'Alta') {
            if (w.edad && Number(w.edad) > 55) addAudit('Operativo', 'Desajuste Etario', 'La edad avanzada es factor de riesgo ante altas exigencias de carga física.', 10, 'warning');
            if (hasEnfermedad || hasDiagnostico) addAudit('Operativo', 'Patología en Rol Exigente', 'La carga física intensa puede agravar la patología base.', 10, 'critical');
            if (hasBiomecanica) addAudit('Operativo', 'Restricción Biomecánica Crítica', 'Peligro inminente de lesión osteomuscular por incompatibilidad con el esfuerzo.', 20, 'critical');
            if (w.presionArterial && parseInt(w.presionArterial.split('/')[0]) >= 135) {
                addAudit('Operativo', 'Hipertensión en Esfuerzo', 'Riesgo agudo de evento cardiovascular durante el esfuerzo físico intenso.', 15, 'critical');
            }
        }

        if (cargo.exigenciaMental === 'Alta') {
            if (w.terapiaPsicologica === 'Sí') addAudit('Psicosocial', 'Alerta de Burnout', 'Rol de alta tensión mental sumado a necesidad clínica de psicoterapia.', 15, 'critical');
            if (vulnerabilidadSocial >= 2) addAudit('Psicosocial', 'Sobrecarga Cognitiva', 'La vulnerabilidad social severa sumada al rol estresante aumenta el riesgo de error humano.', 10, 'warning');
        }

        if (cargo.operaMaquinaria === 'Sí') {
            const hasMedsLethal = w.medicamentos?.toLowerCase().includes('psiquiátrico') || w.medicamentos?.toLowerCase().includes('dormir');
            if (hasMedsLethal || w.alcohol === 'Sí (Frecuente)') {
                isLethal = true;
                addAudit('Operativo', '🛑 BLOQUEO PREVENTIVO', 'Uso de sustancias depresoras del SNC es incompatible con operación de maquinaria.', 40, 'critical');
            }
        }

        // 6. Entrenamiento y Formación Legal
        if (cargo.entrenamientosSeleccionados && cargo.entrenamientosSeleccionados.length > 0) {
            const req = cargo.entrenamientosSeleccionados.length;
            if (req > 0 && !w.curso50h && !w.curso20h) {
                addAudit('Entrenamiento', 'Brecha Formativa SST', 'Ausencia de certificados obligatorios exigidos por el perfil de cargo.', 5, 'warning');
            }
        }

        return { score: Math.max(0, score), alerts: Array.from(new Set(alerts)), auditItems, isLethal };
    };

    // ─── Render ──────────────────────────────────────────────────

    useAutoLoadReport({
        token,
        tags: ['sgsst-condiciones-salud'],
        generatedReport: generatedReport,
        handleSelectReport
    });

    // Auto-load y carga reactiva de la bandeja biomédica
    React.useEffect(() => {
        handleLoadInbox(true); // silent fetch on mount

        // Opcional: Escuchar cuando una notificación en Head nos pida abrir
        const handleOpenInbox = (e: Event) => {
            const { module } = (e as CustomEvent).detail || {};
            if (module === 'condiciones_salud') {
                setShowInboxPerfil(true);
                handleLoadInbox(true);
            }
        };
        window.addEventListener('sgsst-open-inbox', handleOpenInbox);
        return () => window.removeEventListener('sgsst-open-inbox', handleOpenInbox);
    }, []);

    // Load inbox
    const handleLoadInbox = async (silent = false) => {
        if (!silent) setLoadingInbox(true);
        if (!silent) setShowInboxPerfil(true);
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setInboxPerfil(json.actualizacionesPendientesSalud || []);
        } catch (e) {
            showToast({ message: 'Error al cargar actualizaciones pendientes', status: 'error' });
        } finally {
            setLoadingInbox(false);
        }
    };

    // Approve a pending health update by hitting endpoint
    const handleApproveUpdate = async (update: any) => {
        const { workerId, changes, id: updateId } = update;
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/inbox/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ updateId, workerId, changes, inboxType: 'health' })
            });
            if (res.ok) {
                const json = await res.json();
                setTrabajadores(prev => prev.map(w => w.id === workerId ? { ...w, ...changes } : w));
                setInboxPerfil(json.actualizacionesPendientesSalud || []);
                showToast({ message: 'Condición médica actualizada permanentemente', status: 'success', severity: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al actualizar', status: 'error' });
        }
    };

    // Dismiss a pending health update by hitting endpoint
    const handleDismissUpdate = async (updateId: string) => {
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/inbox/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ updateId, inboxType: 'health' })
            });
            if (res.ok) {
                const json = await res.json();
                setInboxPerfil(json.actualizacionesPendientesSalud || []);
                showToast({ message: 'Solicitud descartada permanentemente', status: 'success', severity: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al descartar', status: 'error' });
        }
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
                exportContent={editorContentRef.current || generatedReport || ''}
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
                tags={['sgsst-condiciones-salud']}
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
                                <div className="flex items-center justify-between p-4 bg-surface-tertiary/30 cursor-pointer gap-4" onClick={() => toggleWorker(w.id)}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="text-teal-500 shrink-0">
                                            {expandedWorkers.has(w.id) ? <AnimatedIcon name="chevron-down" size={20} /> : <AnimatedIcon name="chevron-right" size={20} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-text-primary text-base truncate">
                                                {wIdx + 1}. {w.nombre || 'Nuevo Trabajador'}
                                                <span className="ml-2 text-xs font-normal text-text-secondary">— {w.cargo || 'Sin cargo asignado'}</span>
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-0.5 truncate">CC: {w.identificacion || 'N/A'} | {w.genero || '—'} | {w.edad ? `${w.edad} años` : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
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

                                {/* Worker Body, Premium Medical Dashboard UI */}
                                {expandedWorkers.has(w.id) && (
                                    <div className="p-0 border-t border-border-light animate-in fade-in duration-300 bg-surface-primary/20 relative">
                                        
                                        {/* Bio-Fit Radar Premium Card */}
                                        {w.cargo && cargosDisponibles.length > 0 && (
                                            <div className="p-5 md:p-8 border-b border-border-light bg-gradient-to-br from-surface-secondary/80 to-surface-primary relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none ${scoreBg}`}></div>
                                                
                                                <div className={`p-6 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:shadow-lg relative overflow-hidden bg-white/40 dark:bg-[#1a1a1a]/40 group`}>
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-700 ${fitData.score >= 80 ? 'bg-gradient-to-b from-green-400 to-emerald-600' : fitData.score >= 60 ? 'bg-gradient-to-b from-yellow-400 to-orange-500' : 'bg-gradient-to-b from-red-500 to-rose-700'}`}></div>

                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pl-4">
                                                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                                            <div 
                                                                className="relative group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                                                                onClick={() => setActiveAuditWorker(w)}
                                                                title="Ver Auditoría Detallada"
                                                            >
                                                                <svg className="w-28 h-28 transform -rotate-90 filter drop-shadow-md">
                                                                    <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="6" className="text-border-light dark:text-white/5" />
                                                                    <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="314.159" strokeDashoffset={314.159 - (fitData.score / 100) * 314.159} className={`transition-all duration-1000 ease-out ${scoreColor}`} strokeLinecap="round" />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className={`text-3xl font-black tracking-tighter ${scoreColor}`}>{fitData.score}%</span>
                                                                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary">FIT</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-center md:text-left cursor-pointer" onClick={() => setActiveAuditWorker(w)}>
                                                                <h4 className="text-lg font-black text-text-primary uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start gap-2 hover:text-teal-600 transition-colors">
                                                                    <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse"/> Índice Biocéntrico Integral
                                                                </h4>
                                                                <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-sm">Evaluación clínica vs exigencias del rol: <span className="font-bold text-text-primary p-1 bg-surface-secondary rounded-md border border-border-light">{w.cargo}</span>.</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2.5 w-full md:flex-1 md:max-w-md">
                                                            {fitData.alerts.length === 0 ? (
                                                                <div className="flex items-center gap-3 text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-2xl shadow-sm">
                                                                    <div className="p-2bg-green-100 dark:bg-green-800/50 rounded-full"><CheckCircle className="w-5 h-5"/></div>
                                                                    Aptitud Operativa Óptima.
                                                                </div>
                                                            ) : (
                                                                fitData.alerts.map((alert, idx) => (
                                                                    <div key={idx} className={`flex text-xs font-bold px-4 py-3 rounded-2xl gap-3 items-center border transition-all duration-300 hover:-translate-x-1 ${alert.includes('BLOQUEO') ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg animate-[pulse_2s_ease-in-out_infinite] border-red-400' : 'text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50'}`}>
                                                                         <AlertTriangle className="w-5 h-5 flex-shrink-0 opacity-90"/> <span className="leading-tight">{alert}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Clinical Database Forms */}
                                        <div className="p-5 md:p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                
                                                {/* Grupo 1: Fisiología */}
                                                <div className="lg:col-span-4 pb-3 mb-2 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                                            <Stethoscope className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Línea Base Fisiológica</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 ">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Peso (kg)</label>
                                                    <input type="number" value={w.peso} onChange={e => updateWorkerField(w.id, 'peso', e.target.value)}
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary font-medium outline-none" />
                                                </div>
                                                <div className="space-y-1.5 ">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Talla (m)</label>
                                                    <input type="number" value={w.talla} onChange={e => updateWorkerField(w.id, 'talla', e.target.value)} step="0.01" placeholder="Ej: 1.75"
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary font-medium outline-none" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">IMC (Calculado)</label>
                                                    <div className="relative">
                                                        <input type="text" readOnly value={w.imc} placeholder="Automático"
                                                            className={`w-full text-sm font-black py-2.5 px-3 rounded-xl border outline-none ${w.imc && parseFloat(w.imc) > 25 ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 shadow-[inset_0_2px_10px_rgba(251,146,60,0.1)]' : 'border-border-light bg-surface-tertiary text-text-tertiary'}`} />
                                                        {w.imc && <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-2 h-2 bg-current opacity-50"></div>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Tipo Sangre</label>
                                                    <SingleSelect value={w.tipoSangre || ''} onChange={val => updateWorkerField(w.id, 'tipoSangre', val)} placeholder="Seleccione..." options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} />
                                                </div>
                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Presión Arterial</label>
                                                    <input type="text" value={w.presionArterial} onChange={e => updateWorkerField(w.id, 'presionArterial', e.target.value)}
                                                        placeholder="Sistólica / Diastólica (Ej: 120/80)" className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>
                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Frec. Cardíaca (lpm)</label>
                                                    <input type="number" value={w.frecuenciaCardiaca} onChange={e => updateWorkerField(w.id, 'frecuenciaCardiaca', e.target.value)}
                                                        placeholder="Latidos por minuto" className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>

                                                {/* Grupo 2: Patológico */}
                                                <div className="lg:col-span-4 pb-3 mb-2 mt-6 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                                                            <Activity className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Restricciones Clínicas y Patológicas</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Alergias Químicas / Asma</label>
                                                    <input type="text" value={w.alergiasQuimicas} onChange={e => updateWorkerField(w.id, 'alergiasQuimicas', e.target.value)}
                                                        placeholder="Riesgo de choque anafiláctico / respiratorio..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Limitaciones Biomecánicas</label>
                                                    <input type="text" value={w.limitacionesBiomecanicas} onChange={e => updateWorkerField(w.id, 'limitacionesBiomecanicas', e.target.value)}
                                                        placeholder="Hernia, manguito rotador, rodillas..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-4">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Enfermedades Preexistentes Diagnosticadas</label>
                                                    <input type="text" value={w.enfermedades} onChange={e => updateWorkerField(w.id, 'enfermedades', e.target.value)}
                                                        placeholder="Patologías metabólicas, diabetes, cardíacas..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Hallazgos Examen Ocupacional</label>
                                                    <div className="[&>div>div]:border-rose-200/50 dark:[&>div>div]:border-rose-900/30 [&>div>div]:bg-rose-50/30 dark:[&>div>div]:bg-rose-900/10">
                                                        <SingleSelect value={w.diagnosticoMedico || ''} onChange={val => updateWorkerField(w.id, 'diagnosticoMedico', val)} placeholder="Seleccione dictamen principal..." options={['Apto / Sin Hallazgos / Ninguno', 'Espalda: Lumbalgia / Cervicalgia / Hernias', 'M. Superiores: Túnel carpiano / Epicondilitis / Manguito', 'Vicios de refracción', 'Hipoacusia', 'Otros Clínicos']} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Medicamentos de Consumo</label>
                                                    <input type="text" value={w.medicamentos} onChange={e => updateWorkerField(w.id, 'medicamentos', e.target.value)}
                                                        placeholder="Psiquiátricos, dopaminérgicos, relajantes (riesgo maquinaria)..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-3">
                                                    <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Recomendaciones & Restricciones Médicas (SST)</label>
                                                    <input type="text" value={w.recomendacionesMedicas || ''} onChange={e => updateWorkerField(w.id, 'recomendacionesMedicas', e.target.value)}
                                                        placeholder="Pautas del médico para reubicación laboral..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-orange-200/50 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-text-primary dark:border-orange-900/30 dark:bg-orange-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Fecha Evaluación</label>
                                                    <input type="date" value={w.fechaExamenMedico} onChange={e => updateWorkerField(w.id, 'fechaExamenMedico', e.target.value)}
                                                        className="w-full text-sm py-[9px] px-3 rounded-xl border border-orange-200/50 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-text-primary dark:border-orange-900/30 dark:bg-orange-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                {/* Grupo 3: Estilos de Vida Inadecuados */}
                                                <div className="lg:col-span-4 pb-3 mb-2 mt-6 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                                                            <UserCircle className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Estilos de Vida & Carga Mental</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider block truncate">Tabaquismo</label>
                                                    <div className="[&>div>div]:border-amber-200/50 [&>div>div]:bg-amber-50/30 dark:[&>div>div]:border-amber-900/30  dark:[&>div>div]:bg-amber-900/10">
                                                        <SingleSelect value={w.fuma || ''} onChange={val => updateWorkerField(w.id, 'fuma', val)} placeholder="Seleccione..." options={['No', 'Sí, diario', 'Ocasional']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider block truncate">Etilismo (Alcohol)</label>
                                                    <div className="[&>div>div]:border-amber-200/50 [&>div>div]:bg-amber-50/30 dark:[&>div>div]:border-amber-900/30  dark:[&>div>div]:bg-amber-900/10">
                                                        <SingleSelect value={w.alcohol || ''} onChange={val => updateWorkerField(w.id, 'alcohol', val)} placeholder="Anotador de Riesgo Letal..." options={['No', 'Mensual', 'Semanal', 'Sí (Frecuente)']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block truncate" title="Acompañamiento Psicológico">Acompañ. Psicológico</label>
                                                    <div className="[&>div>div]:border-indigo-200/50 [&>div>div]:bg-indigo-50/30 dark:[&>div>div]:border-indigo-900/30  dark:[&>div>div]:bg-indigo-900/10">
                                                        <SingleSelect value={w.terapiaPsicologica || ''} onChange={val => updateWorkerField(w.id, 'terapiaPsicologica', val)} placeholder="Indicador de Burnout..." options={['No', 'Sí', 'Anteriormente']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block truncate">Próximo Segumiento</label>
                                                    <input type="date" value={w.fechaSeguimiento} onChange={e => updateWorkerField(w.id, 'fechaSeguimiento', e.target.value)}
                                                        className="w-full text-sm py-2 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>

                                            </div>
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
                <div className="mt-8">
                    <CollapsibleReportBox
                        title="Informe Condiciones de Salud"
                        icon={<AnimatedIcon name="file-text" size={16} className="text-indigo-500" />}
                    actions={
                        <ExportDropdown
                            content={editorContentRef.current || generatedReport || ''}
                            fileName="Informe_CondicionesSalud"
                            reportType="general"
                        />
                    }
                >
                        <div className="rounded-xl p-1 overflow-hidden">
                            <LiveEditor 
                                ref={liveEditorRef} 
                                initialContent={generatedReport} 
                                onUpdate={(html) => { editorContentRef.current = html; }} 
                                onSave={handleSaveReport} 
                                reportSourceData={trabajadores} 
                            />
                        </div>
                    </CollapsibleReportBox>
                </div>
            )}

            {/* ═══ QR Modal ═══ */}
            {selectedQrWorker && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => { setSelectedQrWorker(null); setQrTab('profile'); }}>
                    <div
                        className="bg-surface-primary w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-border-medium"
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
                                        Escanea para ver la <strong>Tarjeta de Emergencia</strong> del trabajador.
                                    </p>
                                    <div className="p-3 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                        <QRCodeSVG value={getQrValue(selectedQrWorker)} size={120} style={{ width: '120px', height: '120px' }} className="mx-auto" level="L" includeMargin={false} />
                                    </div>
                                    <div className="w-full space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 text-center">Enlace de acceso al perfil</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                readOnly
                                                value={getQrValue(selectedQrWorker)}
                                                className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-600 dark:text-gray-300"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(getQrValue(selectedQrWorker));
                                                    showToast({ message: 'Enlace copiado al portapapeles', status: 'success', severity: 'success' });
                                                }}
                                                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 text-center">Identificación (CC): {selectedQrWorker.identificacion || 'N/A'}</p>
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
                                                    showToast({ message: 'Enlace copiado al portapapeles', status: 'success', severity: 'success' });
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
                                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success', severity: 'success' });
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

            <BioFitAuditModal 
                isOpen={!!activeAuditWorker}
                onClose={() => setActiveAuditWorker(null)}
                workerName={activeAuditWorker?.nombre || 'Trabajador'}
                cargoName={activeAuditWorker?.cargo || 'Sin cargo'}
                score={activeAuditWorker ? calculateBiocentricFit(activeAuditWorker).score : 100}
                auditItems={activeAuditWorker ? calculateBiocentricFit(activeAuditWorker).auditItems : []}
            />
        </div>
    );
};

export default CondicionesSalud;
