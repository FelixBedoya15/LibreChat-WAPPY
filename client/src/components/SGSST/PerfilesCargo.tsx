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
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
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
    const containerRef = useRef<HTMLDivElement>(null);

    const toggle = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter(s => s !== val));
        } else {
            onChange([...selected, val]);
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
                <div className="absolute z-[60] mt-1 w-full max-h-64 overflow-y-auto bg-surface-secondary border border-border-medium rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                        {options.map(opt => (
                            <div
                                key={opt}
                                onClick={() => toggle(opt)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                                    selected.includes(opt) ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold" : "hover:bg-surface-hover text-text-primary"
                                )}
                            >
                                <span>{opt}</span>
                                {selected.includes(opt) && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                            </div>
                        ))}
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
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

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
                    setEditorContent(first.report || null);
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
        setEditorContent(null);
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
                setEditorContent(updated[0].report || null);
            }
        }
    };

    const handleSelectPerfil = (id: string) => {
        const perfil = perfiles.find(p => p.id === id);
        if (perfil) {
            setActivePerfilId(id);
            setFormData(perfil);
            setGeneratedReport(perfil.report || null);
            setEditorContent(perfil.report || null);
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
            setEditorContent(data.report);
            setEditorKey(Date.now().toString());
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
        const content = editorContent || generatedReport;
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
    }, [editorContent, generatedReport, token, activePerfilId, formData.nombreCargo, showToast]);

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
                    setEditorContent(lastMsg.text);
                    setEditorKey(Date.now().toString());
            
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
                exportContent={editorContent || ''}
                exportFileName={`Perfil_${formData.nombreCargo.replace(/\s+/g, '_')}`}
                onDummy={() => {
                    const dummy = {
                        ...formData,
                        nombreCargo: 'Coordinador de Seguridad y Salud en el Trabajo',
                        area: 'Recursos Humanos / SST',
                        nivelCargo: 'Profesional / Técnico',
                        escalasSalarial: '3.5 - 4.5 SMMLV',
                        contextoAdicional: 'Liderar el programa de alturas, coordinar capacitación de espacios confinados y supervisar brigadas de emergencia.',
                        eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)'],
                        entrenamientosSeleccionados: ['Coordinador de Trabajo Seguro en Alturas', 'Supervisor de Trabajo en Espacios Confinados', 'Inducción y Reinducción en SST']
                    };
                    setFormData(dummy);
                    showToast({ message: 'Ejemplo cargado', status: 'success', severity: 'success' });
                }}
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
                    
                    
                >
                    <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
                         <div style={{ minWidth: '100%', padding: '24px' }}>
                            <LiveEditor
                                key={`${editorKey}-${refreshTrigger}`}
                                initialContent={generatedReport}
                                onUpdate={setEditorContent}
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
