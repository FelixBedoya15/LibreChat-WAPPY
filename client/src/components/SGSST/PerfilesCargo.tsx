import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Sparkles,
    Loader2,
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    Trash2,
    Briefcase,
    UserCheck,
    AlertTriangle,
    Shield,
    Brain,
    Target,
    BookOpen,
    ClipboardList,
    Mic,
    MicOff,
    CheckCircle2,
    X,
    Database,
    History,
    Save,
    Camera,
    Video,
    Film,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { cn } from '~/utils';
import SGSSTToolbar from './SGSSTToolbar';
import SingleSelect from './SingleSelect';
import CollapsibleReportBox from './CollapsibleReportBox';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerfilCargoData {
    id: string;
    nombreCargo: string;
    area: string;
    nivelCargo: string;
    tipoContrato: string;
    jornada: string;
    jefeInmediato: string;
    escalasSalarial: string;
    numVacantes: string;
    contextoAdicional: string;
    eppSeleccionados: string[];
    entrenamientosSeleccionados: string[];
    images?: {
        foto1?: string | null;
        foto2?: string | null;
        foto3?: string | null;
        foto1Desc?: string;
        foto2Desc?: string;
        foto3Desc?: string;
    };
    video?: string | null;
    exigenciaFisica?: string;
    exigenciaMental?: string;
    operaMaquinaria?: string;
    report?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NIVEL_CARGO_OPTIONS = [
    'Estratégico / Directivo',
    'Táctico / Mando Medio',
    'Profesional / Técnico',
    'Operativo',
    'Auxiliar / Asistencial',
];

const TIPO_CONTRATO_OPTIONS = [
    'Término indefinido',
    'Término fijo',
    'Prestación de servicios',
    'Obra o labor',
    'Temporal/ETT',
    'Aprendizaje (SENA)',
];

const JORNADA_OPTIONS = [
    'Tiempo completo (8 horas/día)',
    'Medio tiempo (4 horas/día)',
    'Turnos rotativos',
    'Turno nocturno',
    'Jornada flexible',
];

const EPP_OPTIONS = [
    'Casco de seguridad (Dieléctrico/Tipo I/II)',
    'Gafas de seguridad (Claras/Oscuras/Antiempañantes)',
    'Protección auditiva (Inserción/Copa)',
    'Mascarilla para material particulado (N95/P100)',
    'Respirador con filtros químicos',
    'Guantes de nitrilo/látex/vaqueta/carnaza',
    'Guantes de protección mecánica/corte',
    'Botas de seguridad con puntera (Dieléctrica)',
    'Overol de trabajo / Chaleco reflectivo',
    'Arnés de cuerpo completo (4 argollas)',
    'Eslinga de posicionamiento / Protección de caídas',
    'Protector solar',
    'Capas impermeables',
];

const ENTRENAMIENTO_OPTIONS = [
    'Inducción y Reinducción en SST',
    'Identificación de Peligros y Riesgos (GTC 45)',
    'Uso y Mantenimiento de EPP',
    'Primeros Auxilios Básicos',
    'Prevención y Control de Incendios (Extintores)',
    'Plan de Emergencias y Evacuación',
    'Ergonomía y Pausas Activas',
    'Manejo de Sustancias Químicas (GHS)',
    'Riesgo Psicosocial y Manejo del Estrés',
    'Seguridad Vial (PESV)',
    'Reporte de Actos y Condiciones Inseguras',
    // Alturas - Res. 4272/2021
    'Trabajador Autorizado para Trabajo en Alturas',
    'Coordinador de Trabajo Seguro en Alturas',
    'Administrador del Programa de Protección Contra Caídas',
    // Espacios Confinados - Res. 0491/2020
    'Trabajador Entrante para Espacios Confinados',
    'Vigía de Seguridad para Espacios Confinados',
    'Supervisor de Trabajo en Espacios Confinados',
    'Administrador de Programa para Espacios Confinados',
    // Otros
    'Manejo Seguro de Herramientas Eléctricas y Manuales',
    'Mantenimiento Preventivo de Equipos',
    'Buenas Prácticas de Manufactura (BPM)',
];

// ─── Empty form ───────────────────────────────────────────────────────────────
const createInitialPerfil = (): PerfilCargoData => ({
    id: crypto.randomUUID(),
    nombreCargo: '',
    area: '',
    nivelCargo: 'Operativo',
    tipoContrato: 'Término indefinido',
    jornada: 'Tiempo completo (8 horas/día)',
    jefeInmediato: '',
    escalasSalarial: '',
    numVacantes: '1',
    contextoAdicional: '',
    eppSeleccionados: [],
    entrenamientosSeleccionados: [],
    images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
    video: null,
    exigenciaFisica: 'Media',
    exigenciaMental: 'Media',
    operaMaquinaria: 'No',
});

// ─── Field config for rendering ─────────────────────────────────────────────
const EXIGENCIA_OPTIONS = ['Baja', 'Media', 'Alta'];
const SINO_OPTIONS = ['Sí', 'No'];

const FIELD_SECTIONS = [
    {
        title: 'Identificación del Cargo',
        icon: <Briefcase className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'nombreCargo', label: 'Nombre del Cargo *', placeholder: 'Ej: Auxiliar de Bodega, Contador Público...', type: 'text', required: true },
            { key: 'area', label: 'Área / Departamento *', placeholder: 'Logística, Contabilidad...', type: 'text', required: true },
            { key: 'jefeInmediato', label: 'Cargo Jefe Inmediato', placeholder: 'Jefe de Bodega...', type: 'text' },
            { key: 'numVacantes', label: 'N° de Vacantes', placeholder: '1', type: 'number' },
        ]
    },
    {
        title: 'Condiciones Laborales',
        icon: <UserCheck className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'nivelCargo', label: 'Nivel del Cargo', type: 'select', options: NIVEL_CARGO_OPTIONS },
            { key: 'tipoContrato', label: 'Tipo de Contrato', type: 'select', options: TIPO_CONTRATO_OPTIONS },
            { key: 'jornada', label: 'Jornada Laboral', type: 'select', options: JORNADA_OPTIONS },
            { key: 'escalasSalarial', label: 'Escala Salarial', placeholder: '1.8 SMMLV - 2.5 SMMLV', type: 'text' },
        ]
    },
    {
        title: 'Exigencias Biocéntricas del Entorno',
        icon: <Brain className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'exigenciaFisica', label: 'Carga Física Esperada', type: 'select', options: EXIGENCIA_OPTIONS },
            { key: 'exigenciaMental', label: 'Carga Mental / Toma Decisiones', type: 'select', options: EXIGENCIA_OPTIONS },
            { key: 'operaMaquinaria', label: '¿Opera Maquinaria Peligrosa / Vehículos?', type: 'select', options: SINO_OPTIONS },
        ]
    },
];

// ─── MultiSelect Component ────────────────────────────────────────────────────
const MultiSelect = ({ options, selected, onChange, label, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, label: string, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const toggle = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter(s => s !== val));
        } else {
            onChange([...selected, val]);
        }
    };

    const handleAddCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = inputValue.trim();
            if (val && !selected.includes(val)) {
                onChange([...selected, val]);
                setInputValue('');
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allOptions = Array.from(new Set([...options, ...selected]));

    return (
        <div className="space-y-1 relative" ref={containerRef}>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-tight">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[42px] w-full rounded-xl border border-border-medium px-3 py-1.5 text-sm bg-surface-primary text-text-primary flex flex-wrap gap-1.5 cursor-pointer hover:border-teal-400 transition-all shadow-sm"
            >
                {selected.length === 0 && <span className="text-text-tertiary">{placeholder}</span>}
                {selected.map(val => (
                    <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 rounded-md text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                        {val}
                        <X className="h-3 w-3 hover:text-teal-900 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(val); }} />
                    </span>
                ))}
                <div className="ml-auto flex items-center">
                    <ChevronDown className={cn("h-4 w-4 text-text-tertiary transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[60] mt-1 w-full max-h-72 overflow-hidden bg-surface-secondary border border-border-medium rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 flex flex-col">
                    <div className="p-2 border-b border-border-medium bg-surface-primary sticky top-0 z-10 shrink-0">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleAddCustom}
                            placeholder="Buscar o presionar Enter para crear..."
                            className="w-full text-xs font-medium rounded-lg bg-surface-secondary border border-border-light px-3 py-2.5 text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all placeholder:text-text-tertiary shadow-inner"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="p-1.5 flex-1 overflow-y-auto">
                        {allOptions.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase())).map(opt => (
                            <div
                                key={opt}
                                onClick={() => toggle(opt)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors mb-0.5",
                                    selected.includes(opt) ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold" : "hover:bg-surface-hover text-text-primary"
                                )}
                            >
                                <span className="leading-snug">{opt}</span>
                                {selected.includes(opt) && <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 ml-2" />}
                            </div>
                        ))}
                        {inputValue.trim() && !allOptions.some(opt => opt.toLowerCase() === inputValue.toLowerCase().trim()) && (
                             <div 
                                className="px-3 py-2.5 text-sm rounded-lg cursor-pointer text-teal-600 bg-teal-50/50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 font-bold flex items-center justify-between border border-dashed border-teal-300 dark:border-teal-700 transition-all mt-1"
                                onClick={() => {
                                    onChange([...selected, inputValue.trim()]);
                                    setInputValue('');
                                }}
                             >
                                 <span className="truncate mr-2">Agregar "{inputValue.trim()}"</span>
                                 <Plus className="h-4 w-4 flex-shrink-0"/> 
                             </div>
                        )}
                        {allOptions.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase())).length === 0 && !inputValue.trim() && (
                            <div className="px-3 py-4 text-center text-xs text-text-tertiary italic">
                                No hay opciones disponibles
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
// ─── Component ────────────────────────────────────────────────────────────────
const PerfilesCargo = () => {
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [perfiles, setPerfiles] = useState<PerfilCargoData[]>([]);
    const [activePerfilId, setActivePerfilId] = useState<string | null>(null);
    const [formData, setFormData] = useState<PerfilCargoData>(createInitialPerfil());
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const editorContentRef = useRef<string>('');
    const liveEditorRef = useRef<LiveEditorHandle>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const [isVideoUploading, setIsVideoUploading] = useState(false);

    const handleImageUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({
                ...prev,
                images: {
                    ...(prev.images || {}),
                    [key]: base64String
                }
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (key: string) => {
        setFormData(prev => ({
            ...prev,
            images: {
                ...(prev.images || {}),
                [key]: null,
                [`${key}Desc`]: ''
            }
        }));
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsVideoUploading(true);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 10) {
                showToast({ message: 'El video no debe superar los 10 segundos.', status: 'error' });
                setIsVideoUploading(false);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, video: base64String }));
                setIsVideoUploading(false);
            };
            reader.readAsDataURL(file);
        };
        video.src = URL.createObjectURL(file);
    };

    const removeVideo = () => {
        setFormData(prev => ({ ...prev, video: null }));
    };

    const handleImageDescUpdate = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            images: {
                ...(prev.images || {}),
                [key]: value
            }
        }));
    };

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);

    // ─── Load saved profiles ────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/perfiles-cargo/data', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.perfilesList?.length) {
                    setPerfiles(data.perfilesList);
                    const first = data.perfilesList[0];
                    setActivePerfilId(first.id);
                    setFormData(first);
                    setGeneratedReport(first.report || null);
                    editorContentRef.current = first.report || '';
                    liveEditorRef.current?.setHTML(first.report || '');
                } else {
                    const initial = createInitialPerfil();
                    setPerfiles([initial]);
                    setActivePerfilId(initial.id);
                    setFormData(initial);
                }
            })
            .catch(err => console.error('[PerfilesCargo] Error loading data:', err));
    }, [token]);

    const handleInput = (key: keyof PerfilCargoData, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAddPerfil = () => {
        const newPerfil = createInitialPerfil();
        setPerfiles(prev => [...prev, newPerfil]);
        setActivePerfilId(newPerfil.id);
        setFormData(newPerfil);
        setGeneratedReport(null);
        editorContentRef.current = '';
        liveEditorRef.current?.setHTML('');
        setIsFormExpanded(true);
        showToast({ message: 'Nuevo perfil de cargo creado', status: 'info' });
    };

    const handleDeletePerfil = (id: string) => {
        const updated = perfiles.filter(p => p.id !== id);
        if (updated.length === 0) {
            const initial = createInitialPerfil();
            setPerfiles([initial]);
            setActivePerfilId(initial.id);
            setFormData(initial);
        } else {
            setPerfiles(updated);
            if (activePerfilId === id) {
                setActivePerfilId(updated[0].id);
                setFormData(updated[0]);
                setGeneratedReport(updated[0].report || null);
                editorContentRef.current = updated[0].report || '';
                liveEditorRef.current?.setHTML(updated[0].report || '');
            }
        }
    };

    const handleSelectPerfil = (id: string) => {
        const perfil = perfiles.find(p => p.id === id);
        if (perfil) {
            setActivePerfilId(id);
            setFormData(perfil);
            setGeneratedReport(perfil.report || null);
            editorContentRef.current = perfil.report || '';
            liveEditorRef.current?.setHTML(perfil.report || '');
            setIsFormExpanded(true);
            // Reset conversation tracking when switching profiles
            setConversationId(null);
            setReportMessageId(null);
            setRefreshTrigger(p => p + 1);
        }
    };

    // ─── Voice Input (Same interface as Heights Permit) ────────────────────
    const handleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            setIsListening(false);
            setInterimText('');
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast({ message: 'Su navegador no soporta reconocimiento de voz. Intente con Chrome.', status: 'error' });
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.lang = 'es-CO';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsListening(true);
                setInterimText('');
            };

            recognition.onresult = (event: any) => {
                let currentInterim = '';
                let newFinal = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newFinal += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                if (newFinal) {
                    setFormData(prev => ({
                        ...prev,
                        contextoAdicional: prev.contextoAdicional + (prev.contextoAdicional && !prev.contextoAdicional.endsWith(' ') ? ' ' : '') + newFinal
                    }));
                }
                setInterimText(currentInterim);
            };

            recognition.onerror = (event: any) => {
                showToast({ message: 'Error en reconocimiento de voz', status: 'error' });
                setIsListening(false);
                setInterimText('');
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimText('');
            };

            recognition.start();
        } catch (e) {
            setIsListening(false);
            showToast({ message: 'Error al iniciar reconocimiento', status: 'error' });
        }
    };

    // ─── Save Data ────────────────────────────────────────────────────────────
    const handleSaveData = async (silent = false) => {
        if (!token) return;
        const updatedPerfiles = perfiles.map(p => (p.id === activePerfilId ? { ...formData, report: generatedReport || p.report } : p));
        setPerfiles(updatedPerfiles);
        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilesList: updatedPerfiles }),
            });
            if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente', status: 'success', severity: 'success' });
        } catch {
            if (!silent) showToast({ message: 'Error al guardar', status: 'error' });
        }
    };

    // ─── Generation ─────────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!formData.nombreCargo.trim()) {
            showToast({ message: 'Por favor ingresa el nombre del cargo', status: 'warning' });
            return;
        }
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilData: formData, modelName: selectedModel }),
            });
            if (!res.ok) throw new Error('Error al generar el perfil');
            const data = await res.json();
            setGeneratedReport(data.report);
            editorContentRef.current = data.report;
            liveEditorRef.current?.setHTML(data.report);
            setConversationId(null);
            setReportMessageId(null);
            setIsFormExpanded(false);
            // Persist report in list immediately
            setPerfiles(prev => prev.map(p => p.id === activePerfilId ? { ...p, report: data.report } : p));
            showToast({ message: 'Perfil generado con éxito ✅', status: 'success', severity: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, selectedModel, token, showToast, activePerfilId]);

    // ─── Report History (Independent) ──────────────────────────────────────────
    const handleSaveReport = useCallback(async () => {
        const content = editorContentRef.current || generatedReport;
        if (!content || !token || !activePerfilId) return;
        setIsSaving(true);
        try {
            const reportTag = `sgsst-perfil-cargo-${activePerfilId}`;
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    title: `Perfil: ${formData.nombreCargo} - ${new Date().toLocaleDateString()}`,
                    tags: ['sgsst-perfil-cargo', reportTag],
                }),
            });
            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Perfil guardado en el historial', status: 'success', severity: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [generatedReport, token, activePerfilId, formData.nombreCargo, showToast]);

    const handleSelectReport = useCallback(
        async (selectedConvoId: string) => {
            try {
                const res = await fetch(`/api/messages/${selectedConvoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Load failed');
                const messages = await res.json();
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.text) {
                    setGeneratedReport(lastMsg.text);
                    editorContentRef.current = lastMsg.text;
                    liveEditorRef.current?.setHTML(lastMsg.text);
                    setIsFormExpanded(false);
                    showToast({ message: 'Reporte cargado desde el historial', status: 'success', severity: 'success' });
                }
            } catch {
                showToast({ message: 'Error al cargar reporte', status: 'error' });
            }
            setIsHistoryOpen(false);
        },
        [token, showToast],
    );

    const handleLoadDummyData = async () => {
        const dummyProfiles: PerfilCargoData[] = [
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Gerente General',
                area: 'Gerencia Administrativa',
                nivelCargo: 'Estratégico / Directivo',
                tipoContrato: 'Término indefinido',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Junta Directiva',
                escalasSalarial: '> 10 SMMLV',
                numVacantes: '1',
                contextoAdicional: 'Cargo administrativo y de dirección estratégica de la compañía. Las tareas implican trabajo sedentario prolongado (>6h) frente a video terminales, reuniones constantes de alta presión, negociaciones con proveedores y toma de decisiones presupuestales. El riesgo predominante es el psicosocial, derivado de altas cargas de estrés laboral, responsabilidad por el personal y los activos, y horarios extendidos. El riesgo biomecánico está presente en posturas mantenidas sedentes, trabajo repetitivo en teclado, y posibles disconfortes térmicos o lumínicos en oficina. Ocasionalmente, realiza visitas técnicas de inspección a campo u operaciones, exponiéndose temporalmente a riesgos físicos, químicos y mecánicos.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Botas de seguridad con puntera (Dieléctrica)'],
                entrenamientosSeleccionados: ['Inducción y Reinducción en SST', 'Riesgo Psicosocial y Manejo del Estrés', 'Plan de Emergencias y Evacuación'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Baja',
                exigenciaMental: 'Alta',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Profesional SISO / Líder SST',
                area: 'Seguridad y Salud en el Trabajo',
                nivelCargo: 'Profesional / Técnico',
                tipoContrato: 'Término indefinido',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Gerente General',
                escalasSalarial: '3.5 - 4.5 SMMLV',
                numVacantes: '1',
                contextoAdicional: 'Profesional responsable del diseño, ejecución y auditoría de campo del Sistema de Gestión SST. Combina un 40% de labor administrativa (riesgo biomecánico, visual, posturas sedentes) y un 60% de trabajo directo en campo. En campo, audita zonas de alto riesgo: andamios colgantes, espacios confinados y zanjas. Se expone a ruido continuo (>85 dB), vibraciones de maquinaria pesada, radiación ultravioleta, y alta polución por sílice. Alta carga mental y emocional derivada del manejo de emergencias y accidentes.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Protección auditiva (Inserción/Copa)', 'Botas de seguridad con puntera (Dieléctrica)', 'Overol de trabajo / Chaleco reflectivo'],
                entrenamientosSeleccionados: ['Coordinador de Trabajo Seguro en Alturas', 'Identificación de Peligros y Riesgos (GTC 45)', 'Plan de Emergencias y Evacuación', 'Primeros Auxilios Básicos', 'Supervisor de Trabajo en Espacios Confinados'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Media',
                exigenciaMental: 'Alta',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Ingeniero Residente de Obra',
                area: 'Dirección de Proyectos / Operaciones',
                nivelCargo: 'Táctico / Mando Medio',
                tipoContrato: 'Término fijo',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Gerencia Administrativa',
                escalasSalarial: '5.0 - 7.0 SMMLV',
                numVacantes: '2',
                contextoAdicional: 'Mando técnico encargado de la supervisión total del proyecto. Su jornada exige amplios recorridos a pie por terrenos agrestes o estructuras en construcción, exponiéndose a un altísimo riesgo biomecánico (terreno inestable, caídas). A nivel físico, se expone a radiación solar intensa, ruido repetitivo producido por compresores, y estrés térmico. El riesgo emergente exige altísima carga mental en toma de decisiones críticas inmediatas. Existe riesgo de impactos por caída de objetos o interacción con maquinaria móvil.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Botas de seguridad con puntera (Dieléctrica)'],
                entrenamientosSeleccionados: ['Inducción y Reinducción en SST', 'Identificación de Peligros y Riesgos (GTC 45)', 'Administrador del Programa de Protección Contra Caídas'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Media',
                exigenciaMental: 'Alta',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Conductor de Volqueta y Maquinaria',
                area: 'Logística y Transporte',
                nivelCargo: 'Operativo',
                tipoContrato: 'Obra o labor',
                jornada: 'Turnos rotativos',
                jefeInmediato: 'Ingeniero Residente de Obra',
                escalasSalarial: '1.5 - 2.5 SMMLV',
                numVacantes: '6',
                contextoAdicional: 'Cargo operativo al volante en turnos prolongados. Se expone intensamente a vibraciones de cuerpo entero transmitidas por el terreno, incidiendo directamente en desórdenes musculoesqueléticos lumbares crónicos. Postura sedente fija y movimientos repetitivos articulares. Mantenimiento del nivel máximo de atención ocular (riesgo público, colisión). Existe riesgo biomecánico secundario por manipulación ocasional de llantas, y químico agudo y crónico debido a inhalación de gases tóxicos de motor diésel y polvo.',
                eppSeleccionados: ['Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Botas de seguridad con puntera (Dieléctrica)', 'Overol de trabajo / Chaleco reflectivo', 'Guantes de protección mecánica/corte', 'Protección auditiva (Inserción/Copa)'],
                entrenamientosSeleccionados: ['Seguridad Vial (PESV)', 'Ergonomía y Pausas Activas', 'Primeros Auxilios Básicos'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Media',
                exigenciaMental: 'Alta',
                operaMaquinaria: 'Sí',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Oficial de Obra Blanca y Fachadas',
                area: 'Ejecución y Mantenimiento',
                nivelCargo: 'Operativo',
                tipoContrato: 'Obra o labor',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Ingeniero Residente de Obra',
                escalasSalarial: '1.8 - 2.5 SMMLV',
                numVacantes: '8',
                contextoAdicional: 'Ejecutor demandante de labores sobre andamios tubulares o sistemas por cuerdas sobre espacios vacíos altísimos (riesgo extremo de muerte por precipitación/caída en altura). Expuesto de forma constante por inhalación y afecciones en piel a pinturas a base de solventes orgánicos y vapores VOCs (riesgo químico). Movimientos en extremidades con un alto desgaste por manipulación de bultos > 20kg. Sobreesfuerzo constante en hombros por trabajos sobre cabeza. Exposición a deslumbramientos oculares por refracción solar.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Arnés de cuerpo completo (4 argollas)', 'Eslinga de posicionamiento / Protección de caídas', 'Mascarilla para material particulado (N95/P100)', 'Botas de seguridad con puntera (Dieléctrica)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Protector solar'],
                entrenamientosSeleccionados: ['Trabajador Autorizado para Trabajo en Alturas', 'Uso y Mantenimiento de EPP', 'Prevención y Control de Incendios (Extintores)'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Alta',
                exigenciaMental: 'Media',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Ayudante de Excavación y Redes',
                area: 'Operaciones Internas / Especiales',
                nivelCargo: 'Operativo',
                tipoContrato: 'Obra o labor',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Oficial de Obra Blanca y Fachadas',
                escalasSalarial: '1.2 - 1.5 SMMLV',
                numVacantes: '10',
                contextoAdicional: 'Perfil de exigencia anaeróbica y máxima carga estática/dinámica. Retiro o corte y manejo manual de terrenos en zanjas profundas (>1.5 m). Constante exposición inminente al derrumbe de paredes y atrapamiento, aplastamiento, electrocución subterránea, o asfixia en la fosa (riesgo locativo de espacios confinados o deficientes de ventilación). Inhala polvo de sílice crónicamente, padece dermatosis por barro/cemento vivo (químico) e interactúa físicamente a intemperie en temperaturas hostiles.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Respirador con filtros químicos', 'Guantes de protección mecánica/corte', 'Mascarilla para material particulado (N95/P100)', 'Botas de seguridad con puntera (Dieléctrica)', 'Overol de trabajo / Chaleco reflectivo', 'Capas impermeables'],
                entrenamientosSeleccionados: ['Trabajador Entrante para Espacios Confinados', 'Ergonomía y Pausas Activas', 'Primeros Auxilios Básicos'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Alta',
                exigenciaMental: 'Baja',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Técnico Electricista / Liniero',
                area: 'Mantenimiento Eléctrico',
                nivelCargo: 'Profesional / Técnico',
                tipoContrato: 'Término fijo',
                jornada: 'Turnos rotativos',
                jefeInmediato: 'Ingeniero Residente de Obra',
                escalasSalarial: '2.5 - 3.5 SMMLV',
                numVacantes: '4',
                contextoAdicional: 'Especialista en conexión de tableros eléctricos y acometidas de energía secundaria. Su riesgo primordial y grave es descarga o contacto con fases de baja/media tensión, arco eléctrico letal, o shock con posterior caída de la escalera/poste. Hiperextensión frecuente de cérvix, brazos, posiciones isométricas no confortables, generando tenosinovitis, combinadas con manipulación fina manual con guantes aislantes. Manejo indispensable de herramientas manuales de punción y corte (alicates, navajas mecánicas).',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Guantes de protección mecánica/corte', 'Botas de seguridad con puntera (Dieléctrica)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Arnés de cuerpo completo (4 argollas)', 'Eslinga de posicionamiento / Protección de caídas'],
                entrenamientosSeleccionados: ['Trabajador Autorizado para Trabajo en Alturas', 'Manejo Seguro de Herramientas Eléctricas y Manuales', 'Plan de Emergencias y Evacuación'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Alta',
                exigenciaMental: 'Media',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Soldador Estructural Homologado',
                area: 'Metalmecánica',
                nivelCargo: 'Profesional / Técnico',
                tipoContrato: 'Obra o labor',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Ingeniero Residente de Obra',
                escalasSalarial: '2.8 - 4.0 SMMLV',
                numVacantes: '3',
                contextoAdicional: 'El trabajador presenta exposición aguda y crónica de alta intensidad a agentes cancerígenos (vapores metálicos, formaldehídos de soldadura MIG/MAG). Riesgo grave ocular y de piel por potentes emisiones de radiación visible, infrarroja y ultravioleta proveniente de la chispa eléctrica o de corte térmico, además de proyección masiva y directa de chispas ardientes en tronco y rostro, forzando la asunción prolongada de flexión o cuclillas extremas (riesgo osteomuscular severo).',
                eppSeleccionados: ['Respirador con filtros químicos', 'Guantes de nitrilo/látex/vaqueta/carnaza', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Botas de seguridad con puntera (Dieléctrica)', 'Overol de trabajo / Chaleco reflectivo'],
                entrenamientosSeleccionados: ['Uso y Mantenimiento de EPP', 'Prevención y Control de Incendios (Extintores)', 'Reporte de Actos y Condiciones Inseguras'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Alta',
                exigenciaMental: 'Media',
                operaMaquinaria: 'Sí',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Auxiliar de Almacén y Bodega',
                area: 'Almacén y Compras',
                nivelCargo: 'Auxiliar / Asistencial',
                tipoContrato: 'Término indefinido',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Ingeniero Residente de Obra',
                escalasSalarial: '1.3 - 1.6 SMMLV',
                numVacantes: '2',
                contextoAdicional: 'El principal riesgo es el esfuerzo biomecánico agudo al manipular, levantar o traccionar centenares de cajas, vigas pesadas, bultos y sacos semanalmente. Esta repetitividad desencadena hernias o pinzamientos discales lumbares y daños articulares. Trabaja en micro-entornos de poca circulación (riesgo locativo de aplastamiento) y entre flujos intensivos de transporte vehicular que podría prensar al almacenista de cara a corredores cerrados, al igual que cortaduras en el desembalaje de hierro y flejes con filos cortopunzantes.',
                eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Botas de seguridad con puntera (Dieléctrica)', 'Guantes de protección mecánica/corte', 'Mascarilla para material particulado (N95/P100)'],
                entrenamientosSeleccionados: ['Ergonomía y Pausas Activas', 'Mantenimiento Preventivo de Equipos', 'Reporte de Actos y Condiciones Inseguras'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Media',
                exigenciaMental: 'Baja',
                operaMaquinaria: 'No',
            },
            {
                id: crypto.randomUUID(),
                nombreCargo: 'Auxiliar Contable y Administrativa',
                area: 'Contabilidad y Finanzas',
                nivelCargo: 'Auxiliar / Asistencial',
                tipoContrato: 'Término fijo',
                jornada: 'Tiempo completo (8 horas/día)',
                jefeInmediato: 'Gerencia Administrativa',
                escalasSalarial: '1.5 - 2.0 SMMLV',
                numVacantes: '3',
                contextoAdicional: 'Trabajo sedentario, completamente estático por más de 8 horas, provocando trastornos musculoesqueléticos como inflamación de la región tenar o síndrome del túnel del carpo por impacto reiterativo incesante de teclas/clic de un ratón. Riesgo visual significativo debido el brillo persistente y falta de parpadeo adecuado ante documentos de caracteres microscópicos y resoluciones de pantalla inadecuadas. Concentración numérica demandante, alto riesgo sicosocial de sobrecarga, ansiedad por fechas fiscales obligatorias o presión legal corporativa.',
                eppSeleccionados: [],
                entrenamientosSeleccionados: ['Ergonomía y Pausas Activas', 'Riesgo Psicosocial y Manejo del Estrés', 'Plan de Emergencias y Evacuación'],
                images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
                video: null,
                exigenciaFisica: 'Baja',
                exigenciaMental: 'Media',
                operaMaquinaria: 'No',
            }
        ];

        setPerfiles(dummyProfiles);
        setActivePerfilId(dummyProfiles[0].id);
        setFormData(dummyProfiles[0]);
        setGeneratedReport(null);
        editorContentRef.current = '';
        liveEditorRef.current?.setHTML('');

        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilesList: dummyProfiles }),
            });
            if (res.ok) {
                showToast({ message: 'Base de datos completada con 10 perfiles de cargo', status: 'success', severity: 'success' });
            } else {
                throw new Error('Failed to save to db');
            }
        } catch(e) {
            showToast({ message: 'Error al guardar los perfiles en la base de datos', status: 'error' });
        }
    };

    // ─── Render Field helper ──────────────────────────────────────────────────
    const renderField = (field: any) => {
        const baseClass =
            'w-full rounded-xl border border-border-medium px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all shadow-sm';
        if (field.type === 'select') {
            return (
                <SingleSelect
                    value={(formData as any)[field.key] || ''}
                    onChange={val => handleInput(field.key as keyof PerfilCargoData, val)}
                    options={field.options}
                />
            );
        }
        return (
            <input
                type={field.type || 'text'}
                value={(formData as any)[field.key]}
                onChange={e => handleInput(field.key as keyof PerfilCargoData, e.target.value)}
                placeholder={field.placeholder}
                className={baseClass}
            />
        );
    };

    const actionButtonClass = "group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-semibold text-sm hover:scale-105 active:scale-95 transform cursor-pointer";

    return (
        <div className="w-full overflow-x-hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Toolbar ── */}
            <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleGenerate}
                isAnalyzing={isGenerating}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onSaveLocal={() => handleSaveData(false)}
                onSave={handleSaveReport}
                hasContent={!!generatedReport}
                exportContent={editorContentRef.current || generatedReport || ''}
                exportFileName={`Perfil_${formData.nombreCargo.replace(/\s+/g, '_')}`}
                onDummy={handleLoadDummyData}
            />

            {/* ── History (Filtered by Profile ID) ── */}
            {/* ── History (Filtered by Profile ID) ── */}
            <ReportHistory
                onSelectReport={handleSelectReport}
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-perfil-cargo', `sgsst-perfil-cargo-${activePerfilId}`]}
            />

            {/* ── Profiles Quick Access ── */}
            <div className="rounded-2xl border border-border-medium bg-surface-tertiary p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Listado de Perfiles</span>
                    </div>
                    <button
                        onClick={handleAddPerfil}
                        className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" /> Nuevo Cargo
                    </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {perfiles.map(p => (
                        <div key={p.id} className="group flex items-center gap-1">
                            <button
                                onClick={() => handleSelectPerfil(p.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black transition-all border shadow-sm truncate max-w-[200px]",
                                    activePerfilId === p.id 
                                        ? "bg-teal-600 text-white border-teal-600 ring-2 ring-teal-100 dark:ring-teal-900/40" 
                                        : "bg-surface-primary text-text-primary border-border-medium hover:border-teal-400"
                                )}
                            >
                                {p.nombreCargo || 'Cargo sin nombre'}
                            </button>
                            <button
                                onClick={() => handleDeletePerfil(p.id)}
                                className="p-1.5 text-text-tertiary hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Core Form ── */}
            <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-xl overflow-hidden">
                <div className="p-6 space-y-8">
                    {FIELD_SECTIONS.map(section => (
                        <div key={section.title} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-border-light">
                                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">{section.icon}</div>
                                <h4 className="font-black text-[13px] text-text-primary uppercase tracking-wider">{section.title}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {section.fields.map(field => (
                                    <div key={field.key} className="flex flex-col justify-end h-full space-y-1.5">
                                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-tighter">
                                            {field.label}
                                        </label>
                                        <div className="mt-auto">
                                            {renderField(field)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-border-light">
                            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl"><Shield className="h-4 w-4 text-teal-600" /></div>
                            <h4 className="font-black text-[13px] text-text-primary uppercase tracking-wider">Equipos y Entrenamiento Especializado</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MultiSelect
                                label="EPP Requeridos (GTC 45 / Res. 4272)"
                                placeholder="Seleccionar EPP..."
                                options={EPP_OPTIONS}
                                selected={formData.eppSeleccionados}
                                onChange={(val) => handleInput('eppSeleccionados', val)}
                            />
                            <MultiSelect
                                label="Entrenamiento / Certificación SST"
                                placeholder="Seleccionar capacitación..."
                                options={ENTRENAMIENTO_OPTIONS}
                                selected={formData.entrenamientosSeleccionados}
                                onChange={(val) => handleInput('entrenamientosSeleccionados', val)}
                            />
                        </div>
                    </div>

                    {/* Microphone Interface (Matching Alturas Permit) */}
                    <div className="space-y-4 pt-4 border-t border-border-medium">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-teal-600" /> Descripción Detallada (Dictado o Texto)
                            </h4>
                            <button
                                onClick={handleVoiceInput}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-md border flex items-center gap-2.5 hover:scale-105 active:scale-95 transform",
                                    isListening 
                                        ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                                        : "bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light"
                                )}
                            >
                                <span className="relative flex h-3 w-3">
                                    {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                    <span className={cn("relative inline-flex rounded-full h-3 w-3", isListening ? "bg-red-500" : "bg-teal-500")}></span>
                                </span>
                                {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                            </button>
                        </div>
                        <div className="relative group">
                            <textarea
                                value={formData.contextoAdicional + (interimText ? (formData.contextoAdicional && !formData.contextoAdicional.endsWith(' ') ? ' ' : '') + interimText : '')}
                                onChange={e => {
                                    if (!isListening) {
                                        handleInput('contextoAdicional', e.target.value);
                                    }
                                }}
                                readOnly={isListening}
                                placeholder="Ej: Describe aquí funciones específicas, equipos a operar, o condiciones especiales de riesgo..."
                                className={cn(
                                    "w-full rounded-2xl border-2 p-5 text-sm text-text-primary min-h-[180px] transition-all duration-300 focus:outline-none shadow-inner",
                                    isListening 
                                        ? "border-solid border-red-300 bg-red-50/10 focus:border-red-400" 
                                        : "border-dashed border-teal-200 bg-teal-50/5 focus:bg-teal-50/10 focus:border-teal-400"
                                )}
                            />
                            {!isListening && (
                                <div className="absolute top-4 right-4 text-teal-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FileText className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SECCIÓN: Registro Fotográfico de Evidencias ── */}
                    <div className="space-y-4 pt-4 border-t border-border-medium">
                        <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                            <Camera className="h-4 w-4 text-teal-600" /> Registro Fotográfico del Cargo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                                const labels = ['Actividad Principal', 'Ambiente de Trabajo', 'Controles / Herramientas'];
                                const fieldName = foto as 'foto1' | 'foto2' | 'foto3';
                                const descName = `${foto}Desc`;
                                return (
                                    <div key={foto} className="flex flex-col items-center gap-3">
                                        <span className="font-semibold text-sm text-center">{labels[idx]}</span>
                                        <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium flex flex-col items-center justify-center overflow-hidden hover:border-teal-500 transition-colors">
                                            {formData.images?.[fieldName] ? (
                                                <>
                                                    <img src={formData.images[fieldName] as string} className="w-full h-full object-cover" alt={foto} />
                                                    <button onClick={() => removeImage(fieldName)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-teal-500">
                                                    <Camera className="h-8 w-8 mb-2" />
                                                    <span className="text-xs text-center px-4">Subir foto</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(fieldName, e)} />
                                                </label>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Descripción de la foto..."
                                            value={formData.images?.[descName as keyof typeof formData.images] || ''}
                                            onChange={e => handleImageDescUpdate(descName, e.target.value)}
                                            className="w-full rounded-xl border px-3 py-2 text-xs bg-surface-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── SECCIÓN: Evidencia en Video ── */}
                    <div className="space-y-4 pt-4 border-t border-border-medium">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                <Film className="h-4 w-4 text-teal-600" /> Video de la Actividad (Opcional)
                            </h4>
                            <span className="text-[10px] bg-teal-100/50 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase border border-teal-200">Máximo 10 Segundos</span>
                        </div>

                        <div className="bg-surface-tertiary/10 border-2 border-dashed border-teal-200 rounded-2xl p-6 transition-all hover:bg-surface-tertiary/20">
                            {!formData.video ? (
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                                        {isVideoUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Video className="h-8 w-8" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-text-primary">Sube un video corto de la labor</p>
                                        <p className="text-xs text-text-secondary mt-1">Suministra contexto dinámico para autocompletar la Matriz IPEVAR</p>
                                    </div>
                                    <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
                                        {isVideoUploading ? 'Procesando...' : 'Seleccionar Video'}
                                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isVideoUploading} />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto shadow-2xl border-2 border-teal-400">
                                        <video src={formData.video} controls className="w-full h-full" />
                                        <button onClick={removeVideo} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors z-10">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Normative Badge Re-styled */}
                <div className="px-6 py-4 bg-teal-50/50 dark:bg-teal-900/10 border-t border-border-medium flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    <span className="text-[11px] font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">
                        Cumple Art. 16 de la Resolución 1843 de 2025 & GTC 45 (2012)
                    </span>
                </div>
            </div>

            {/* Generated Report View */}
                <CollapsibleReportBox
                    title="Perfil de Cargos"
                    icon={<FileText className="h-5 w-5" />}
                    actions={
                        <ExportDropdown
                            content={editorContentRef.current || generatedReport || ''}
                            fileName="Informe_PerfilesCargo"
                            reportType="general"
                        />
                    }
                >
                    <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
                         <div style={{ minWidth: '100%', padding: '24px' }}>
                            <LiveEditor
                                ref={liveEditorRef}
                                initialContent={generatedReport}
                                onUpdate={(html) => { editorContentRef.current = html; }}
                                onSave={handleSaveReport}
                                reportSourceData={{ formData, perfiles }}
                            />
                        </div>
                    </div>
                </CollapsibleReportBox>
        </div>
    );
};

export default PerfilesCargo;
