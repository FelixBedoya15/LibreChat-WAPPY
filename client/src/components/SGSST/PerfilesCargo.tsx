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

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerfilCargoData {
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
    'Manejo de Sustancias Químicas (GHS)',
    'Trabajo Seguro en Alturas (Básico/Avanzado/Reentrenamiento)',
    'Manejo Seguro de Herramientas Eléctricas y Manuales',
    'Ergonomía y Pausas Activas (Higiene Postural)',
    'Identificación de Peligros y Riesgos (GTC 45)',
    'Primeros Auxilios Básicos',
    'Prevención y Control de Incendios (Uso de Extintores)',
    'Plan de Emergencias y Evacuación',
    'Manejo de Residuos Sólidos y Cuidado Ambiental',
    'Riesgo Psicosocial y Manejo del Estrés',
    'Seguridad Vial (Plan Estratégico de Seguridad Vial)',
    'Uso y Mantenimiento de EPP',
    'Reporte de Actos y Condiciones Inseguras',
    'Prevención de Accidentes de Trabajo y Enfermedades Laborales',
    'Mantenimiento Preventivo de Equipos',
    'Buenas Prácticas de Manufactura (BPM)',
];

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM: PerfilCargoData = {
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
};

// ─── Field config for quick rendering ─────────────────────────────────────────
const FIELD_SECTIONS = [
    {
        title: 'Identificación del Cargo',
        icon: <Briefcase className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'nombreCargo', label: 'Nombre del Cargo *', placeholder: 'Ej: Auxiliar de Bodega, Contador Público, Técnico SST...', type: 'text', required: true },
            { key: 'area', label: 'Área / Departamento *', placeholder: 'Ej: Logística, Contabilidad, Producción, RRHH...', type: 'text', required: true },
            { key: 'jefeInmediato', label: 'Cargo del Jefe Inmediato', placeholder: 'Ej: Jefe de Bodega, Gerente Financiero...', type: 'text' },
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
            { key: 'escalasSalarial', label: 'Escala Salarial / Rango', placeholder: 'Ej: 1.5 SMMLV - 2 SMMLV, o $2.000.000 - $3.000.000', type: 'text' },
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
                className="min-h-[42px] w-full rounded-lg border border-border-medium px-3 py-1.5 text-sm bg-surface-primary text-text-primary flex flex-wrap gap-1.5 cursor-pointer hover:border-teal-400 transition-all"
            >
                {selected.length === 0 && <span className="text-text-tertiary">{placeholder}</span>}
                {selected.map(val => (
                    <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 rounded-md text-xs font-medium border border-teal-200 dark:border-teal-800">
                        {val}
                        <X className="h-3 w-3 hover:text-teal-900 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(val); }} />
                    </span>
                ))}
                <div className="ml-auto">
                    <ChevronDown className={cn("h-4 w-4 text-text-tertiary transition-transform", isOpen && "rotate-180")} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[60] mt-1 w-full max-h-64 overflow-y-auto bg-surface-secondary border border-border-medium rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                        {options.map(opt => (
                            <div
                                key={opt}
                                onClick={() => toggle(opt)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                                    selected.includes(opt) ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" : "hover:bg-surface-hover text-text-primary"
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

    const [perfiles, setPerfiles] = useState<(PerfilCargoData & { id: string; report?: string })[]>([]);
    const [activePerfilId, setActivePerfilId] = useState<string | null>(null);
    const [formData, setFormData] = useState<PerfilCargoData>(EMPTY_FORM);
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);

    // ─── Load saved data ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/perfiles-cargo/data', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.perfilesList?.length) {
                    setPerfiles(data.perfilesList);
                    setFormData({ ...EMPTY_FORM, ...data.perfilesList[0] });
                    setActivePerfilId(data.perfilesList[0].id);
                }
            })
            .catch(err => console.error('[PerfilesCargo] Error loading data:', err));
    }, [token]);

    // ─── Field helpers ────────────────────────────────────────────────────────
    const handleInput = (key: keyof PerfilCargoData, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAddPerfil = () => {
        const newId = crypto.randomUUID();
        const newPerfil = { ...EMPTY_FORM, id: newId };
        setPerfiles(prev => [...prev, newPerfil]);
        setActivePerfilId(newId);
        setFormData(EMPTY_FORM);
        setGeneratedReport(null);
        setEditorContent(null);
        setIsFormExpanded(true);
        showToast({ message: 'Nuevo perfil de cargo creado', status: 'info' });
    };

    const handleDeletePerfil = (id: string) => {
        const updated = perfiles.filter(p => p.id !== id);
        setPerfiles(updated);
        if (activePerfilId === id) {
            setActivePerfilId(updated[0]?.id || null);
            setFormData(updated[0] ? { ...EMPTY_FORM, ...updated[0] } : EMPTY_FORM);
            setGeneratedReport(null);
            setEditorContent(null);
        }
    };

    const handleSelectPerfil = (id: string) => {
        const perfil = perfiles.find(p => p.id === id);
        if (perfil) {
            setActivePerfilId(id);
            setFormData({ ...EMPTY_FORM, ...perfil });
            setGeneratedReport(perfil.report || null);
            setEditorContent(perfil.report || null);
            setIsFormExpanded(true);
        }
    };

    // ─── Voice Input Handler ──────────────────────────────────────────
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
                console.error("Speech error:", event.error);
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

    // ─── Save ─────────────────────────────────────────────────────────────────
    const handleSaveData = async (silent = false) => {
        if (!token) return;
        const updated = activePerfilId
            ? perfiles.map(p => (p.id === activePerfilId ? { ...p, ...formData } : p))
            : [...perfiles, { ...formData, id: crypto.randomUUID() }];
        setPerfiles(updated);
        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilesList: updated }),
            });
            if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente', status: 'success' });
        } catch {
            if (!silent) showToast({ message: 'Error al guardar', status: 'error' });
        }
    };

    // ─── Dummy data ───────────────────────────────────────────────────────────
    const handleDummyData = () => {
        const dummy: PerfilCargoData = {
            nombreCargo: 'Técnico en Seguridad y Salud en el Trabajo',
            area: 'Gestión Humana y SST',
            nivelCargo: 'Profesional / Técnico',
            tipoContrato: 'Término indefinido',
            jornada: 'Tiempo completo (8 horas/día)',
            jefeInmediato: 'Gerente de Operaciones',
            escalasSalarial: '1.8 SMMLV - 2.5 SMMLV',
            numVacantes: '1',
            contextoAdicional:
                'El cargo es responsable de implementar y mantener el SG-SST, realizar inspecciones de seguridad, liderar investigaciones de accidentes y capacitar a los trabajadores en prevención de riesgos laborales.',
            eppSeleccionados: ['Casco de seguridad (Dieléctrico/Tipo I/II)', 'Gafas de seguridad (Claras/Oscuras/Antiempañantes)', 'Botas de seguridad con puntera (Dieléctrica)'],
            entrenamientosSeleccionados: ['Inducción y Reinducción en SST', 'Identificación de Peligros y Riesgos (GTC 45)', 'Uso y Mantenimiento de EPP'],
        };
        setFormData(dummy);
        showToast({ message: 'Datos de ejemplo cargados', status: 'success' });
    };

    // ─── Generate ─────────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!formData.nombreCargo.trim()) {
            showToast({ message: 'Por favor ingresa el nombre del cargo antes de generar', status: 'warning' });
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
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al generar el perfil');
            }
            const data = await res.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            if (activePerfilId) {
                setPerfiles(prev => prev.map(p => p.id === activePerfilId ? { ...p, ...formData, report: data.report } : p));
            }
            showToast({ message: 'Perfil de cargo generado exitosamente ✅', status: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, selectedModel, token, showToast, activePerfilId]);

    // ─── Save Report ──────────────────────────────────────────────────────────
    const handleSaveReport = useCallback(async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;
        setIsSaving(true);
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Perfil actualizado exitosamente', status: 'success' });
                }
                return;
            }
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    title: `Perfil de Cargo: ${formData.nombreCargo} - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-perfil-cargo'],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Perfil guardado en historial exitosamente', status: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, formData.nombreCargo]);

    const handleSelectReport = useCallback(
        async (selectedConvoId: string) => {
            if (!selectedConvoId) return;
            try {
                const res = await fetch(`/api/messages/${selectedConvoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to load');
                const messages = await res.json();
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.text) {
                    setGeneratedReport(lastMsg.text);
                    setEditorContent(lastMsg.text);
                    setConversationId(selectedConvoId);
                    setReportMessageId(lastMsg.messageId);
                    setIsFormExpanded(false);
                    showToast({ message: 'Perfil cargado correctamente', status: 'success' });
                }
            } catch {
                showToast({ message: 'Error al cargar el perfil', status: 'error' });
            }
            setIsHistoryOpen(false);
        },
        [token, showToast],
    );

    // ─── Render field ─────────────────────────────────────────────────────────
    const renderField = (field: any) => {
        const baseClass =
            'w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all';
        if (field.type === 'select') {
            return (
                <select
                    value={(formData as any)[field.key]}
                    onChange={e => handleInput(field.key as keyof PerfilCargoData, e.target.value)}
                    className={baseClass}
                >
                    {field.options.map((opt: string) => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>
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

    // ─── Info badges ─────────────────────────────────
    const generationBadges = [
        { icon: <ClipboardList className="h-4 w-4" />, label: 'Funciones y Responsabilidades', color: 'teal' },
        { icon: <Brain className="h-4 w-4" />, label: 'Habilidades y Competencias', color: 'violet' },
        { icon: <BookOpen className="h-4 w-4" />, label: 'Requisitos Físicos, Mentales y Técnicos', color: 'blue' },
        { icon: <AlertTriangle className="h-4 w-4" />, label: 'Riesgos Laborales GTC 45', color: 'orange' },
        { icon: <Shield className="h-4 w-4" />, label: 'Medidas Preventivas y Controles', color: 'green' },
        { icon: <Target className="h-4 w-4" />, label: 'Indicadores de Desempeño (KPIs)', color: 'rose' },
    ];

    const colorMap: Record<string, string> = {
        teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/40',
        violet: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/40',
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/40',
        green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40',
        rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40',
    };

    // ─── Main render ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <DummyGenerateButton onClick={handleDummyData} />

                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Historial
                    </span>
                </button>

                <button
                    onClick={() => handleSaveData(false)}
                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                >
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Guardar Datos
                    </span>
                </button>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Generar Perfil con IA
                    </span>
                </button>

                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />

                {generatedReport && (
                    <>
                        <button
                            onClick={handleSaveReport}
                            disabled={isSaving}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="save" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                Guardar Perfil
                            </span>
                        </button>
                        <ExportDropdown
                            content={editorContent || ''}
                            fileName={`Perfil_Cargo_${formData.nombreCargo.replace(/\s+/g, '_') || 'Cargo'}`}
                        />
                    </>
                )}
            </div>

            {/* ── History ── */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-perfil-cargo']}
                    />
                </div>
            )}

            {/* ── Profiles list ── */}
            {perfiles.length > 1 && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary p-3 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Perfiles Guardados</span>
                        <button
                            onClick={handleAddPerfil}
                            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                            <Plus className="h-4 w-4" /> Nuevo Perfil
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perfiles.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                                <button
                                    onClick={() => handleSelectPerfil(p.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${activePerfilId === p.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-surface-primary text-text-primary border-border-medium hover:bg-surface-hover'}`}
                                >
                                    {p.nombreCargo || 'Sin nombre'}
                                </button>
                                <button
                                    onClick={() => handleDeletePerfil(p.id)}
                                    className="p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Coverage badges ── */}
            <div className="rounded-xl border border-teal-200 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-900/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <AnimatedIcon name="sparkles" size={18} className="text-teal-600 animate-pulse" />
                    <h4 className="text-sm font-bold text-teal-800 dark:text-teal-300">
                        Contenido generado por IA — <span className="bg-teal-200 px-2 py-0.5 rounded-full text-[11px] border border-teal-300 shadow-sm ml-1 text-teal-900 font-black animate-pulse">Cumple Art. 16 de la Resolución 1843 de 2025</span>
                    </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {generationBadges.map((b, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${colorMap[b.color]}`}
                        >
                            {b.icon}
                            {b.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Form ── */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary hover:bg-surface-hover transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <FileText className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold">
                            {formData.nombreCargo ? `Perfil: ${formData.nombreCargo}` : 'Datos del Perfil de Cargo'}
                        </span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">
                        {FIELD_SECTIONS.map(section => (
                            <div key={section.title} className="space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-border-medium">
                                    {section.icon}
                                    <h4 className="font-semibold text-sm text-text-primary">{section.title}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.fields.map(field => (
                                        <div key={field.key} className="space-y-1">
                                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-tight">
                                                {field.label}
                                            </label>
                                            {renderField(field)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Multi-Select Sections */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border-medium">
                                <Shield className="h-4 w-4 text-teal-600" />
                                <h4 className="font-semibold text-sm text-text-primary">Equipos y Formación</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MultiSelect
                                    label="EPP Requeridos (GTC 45)"
                                    placeholder="Seleccionar EPP..."
                                    options={EPP_OPTIONS}
                                    selected={formData.eppSeleccionados}
                                    onChange={(val) => handleInput('eppSeleccionados', val)}
                                />
                                <MultiSelect
                                    label="Entrenamiento / Capacitación (SST)"
                                    placeholder="Seleccionar entrenamientos..."
                                    options={ENTRENAMIENTO_OPTIONS}
                                    selected={formData.entrenamientosSeleccionados}
                                    onChange={(val) => handleInput('entrenamientosSeleccionados', val)}
                                />
                            </div>
                        </div>

                        {/* Context additional with Microphone */}
                        <div className="space-y-2 pt-2 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-tight">
                                    Descripción del Cargo / Contexto Adicional
                                </label>
                                <button
                                    onClick={handleVoiceInput}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                                        isListening
                                            ? "bg-red-100 text-red-600 border-red-300 animate-pulse"
                                            : "bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100"
                                    )}
                                >
                                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                                    {isListening ? 'Detener Micrófono' : 'Activar Micrófono'}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={formData.contextoAdicional}
                                    onChange={e => handleInput('contextoAdicional', e.target.value)}
                                    placeholder="Ej: El cargo es responsable de coordinar las entregas en bodega, manejar montacargas, operar el sistema ERP de inventarios..."
                                    className={cn(
                                        "w-full rounded-xl border-2 border-dashed bg-teal-50/10 p-4 text-sm text-text-primary min-h-[140px] resize-y transition-all focus:outline-none",
                                        isListening ? "border-red-400 bg-red-50/5 shadow-inner" : "border-teal-200 focus:bg-teal-50/30 focus:border-teal-400"
                                    )}
                                />
                                {interimText && (
                                    <div className="absolute bottom-4 left-4 right-4 p-2 bg-white/80 dark:bg-black/40 backdrop-blur rounded italic text-xs text-text-secondary border border-border-light">
                                        {interimText}...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.nombreCargo.trim()}
                                className="group flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <AnimatedIcon name="sparkles" size={20} />}
                                <span className="ml-2">
                                    {isGenerating ? 'Generando perfil extenso (GTC 45)...' : 'Generar Perfil de Cargo con IA'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Editor */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Perfil de Cargo: {formData.nombreCargo || 'Generado'}
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new-editor'}
                                    initialContent={generatedReport}
                                    onUpdate={setEditorContent}
                                    onSave={handleSaveReport}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerfilesCargo;
