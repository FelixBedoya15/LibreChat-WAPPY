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
import * as XLSX from 'xlsx';
import './sst-bit.css';

// ─── 8-Bit Helpers ────────────────────────────────────────────────────────────
const PixelAvatar = ({ level }: { level: string }) => (
    <div className="flex flex-col items-center justify-center p-4 border-4 border-white bg-[#000] w-32 h-32 ml-4 mb-4">
        <div className="w-16 h-16 bg-green-500 rounded-sm mb-2 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.5)] flex items-center justify-center">
            <span className="font-pixel text-white text-3xl">P</span>
        </div>
        <span className="font-pixel text-[8px] text-green-400 uppercase">LVL 99</span>
    </div>
);

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
    controlesFuenteSeleccionados?: string[];
    controlesMedioSeleccionados?: string[];
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

const CONTROLES_FUENTE_OPTIONS = [
    'Mantenimiento preventivo periódico de maquinaria',
    'Aislamiento de la fuente generadora (Cabinas/Encerramientos)',
    'Sustitución de herramientas convencionales por ergonómicas/aisladas',
    'Automatización de procesos críticos o peligrosos',
    'Rediseño del puesto de trabajo o ergonomía física',
    'Protecciones mecánicas fijas o móviles en poleas y partes móviles',
    'Sistemas de parada de emergencia activa',
    'Voltaje extra bajo de seguridad (SELV / VRD en soldadura)',
];

const CONTROLES_MEDIO_OPTIONS = [
    'Sistemas de ventilación mecánica localizada o extracción',
    'Aislamiento acústico de áreas ruidosas',
    'Barandas, delimitación y demarcación de zonas de peligro',
    'Instalación de mamparas, pantallas térmicas o pantallas de soldadura',
    'Sistemas de iluminación artificial focalizada y antideslumbrante',
    'Limpieza profunda y control de polvo en el ambiente de trabajo',
    'Señalización de seguridad fotoluminiscente y advertencia de riesgos',
    'Diseño de rutas de evacuación y pasillos despejados',
    'Monitoreo ambiental periódico de contaminantes (Aire/Vibración/Ruido)',
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
    controlesFuenteSeleccionados: [],
    controlesMedioSeleccionados: [],
});

// ─── Field config for rendering ─────────────────────────────────────────────
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
            <label className="text-[10px] text-green-400 font-pixel uppercase tracking-tight mb-2 block">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[42px] w-full border-4 border-white px-3 py-2 text-[10px] font-pixel bg-black text-green-400 flex flex-wrap gap-2 cursor-pointer hover:border-green-400 transition-all"
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
    const [selectedModel, setSelectedModel] = useState(user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite');
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // ─── Excel Import/Export ──────────────────────────────────────────────────
    const safeJoin = (val: any): string => {
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'string') return val;
        return '';
    };

    const safeText = (val: any, isHTML = false): string => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        if (isHTML) {
            str = str.replace(/<[^>]*>/g, '');
        }
        if (str.length > 32760) {
            return str.substring(0, 32750) + '... [TRUNCADO]';
        }
        return str;
    };

    const handleExportExcel = () => {
        try {
            if (!perfiles || perfiles.length === 0) {
                showToast({ message: 'No hay perfiles de cargo para exportar', status: 'error' });
                return;
            }
            const dataToExport = perfiles.map(p => ({
                'Nombre del Cargo': safeText(p.nombreCargo),
                'Área': safeText(p.area),
                'Nivel del Cargo': safeText(p.nivelCargo),
                'Tipo de Contrato': safeText(p.tipoContrato),
                'Jornada': safeText(p.jornada),
                'Jefe Inmediato': safeText(p.jefeInmediato),
                'Escala Salarial': safeText(p.escalasSalarial),
                'Número de Vacantes': safeText(p.numVacantes),
                'Exigencia Física': safeText(p.exigenciaFisica),
                'Exigencia Mental': safeText(p.exigenciaMental),
                'Opera Maquinaria': safeText(p.operaMaquinaria),
                'Descripción Detallada': safeText(p.contextoAdicional),
                'EPP Requeridos': safeText(safeJoin(p.eppSeleccionados)),
                'Entrenamientos Requeridos': safeText(safeJoin(p.entrenamientosSeleccionados)),
                'Controles en la Fuente': safeText(safeJoin(p.controlesFuenteSeleccionados)),
                'Controles en el Medio': safeText(safeJoin(p.controlesMedioSeleccionados))
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Perfiles de Cargo");
            XLSX.writeFile(workbook, "Perfiles_de_Cargo.xlsx");
            showToast({ message: 'Archivo Excel exportado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Error al exportar Excel:', error);
            showToast({ message: `Error al exportar Excel: ${error.message || error}`, status: 'error' });
        }
    };

    const saveImportedPerfiles = async (list: PerfilCargoData[]) => {
        if (!token) return;
        try {
            await fetch('/api/sgsst/perfiles-cargo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilesList: list }),
            });
        } catch (e) {
            console.error('Error saving imported profiles:', e);
        }
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

                const newPerfiles: PerfilCargoData[] = importedData.map((row: any) => {
                    const eppStr = row['EPP Requeridos'] || row.eppSeleccionados || '';
                    const entrenamientosStr = row['Entrenamientos Requeridos'] || row.entrenamientosSeleccionados || '';
                    const controlesFuenteStr = row['Controles en la Fuente'] || row.controlesFuenteSeleccionados || '';
                    const controlesMedioStr = row['Controles en el Medio'] || row.controlesMedioSeleccionados || '';

                    return {
                        id: crypto.randomUUID(),
                        nombreCargo: row['Nombre del Cargo'] || row.nombreCargo || '',
                        area: row['Área'] || row.area || '',
                        nivelCargo: row['Nivel del Cargo'] || row.nivelCargo || 'Operativo',
                        tipoContrato: row['Tipo de Contrato'] || row.tipoContrato || 'Término indefinido',
                        jornada: row['Jornada'] || row.jornada || 'Tiempo completo (8 horas/día)',
                        jefeInmediato: row['Jefe Inmediato'] || row.jefeInmediato || '',
                        escalasSalarial: row['Escala Salarial'] || row.escalasSalarial || '',
                        numVacantes: row['Número de Vacantes'] || row.numVacantes || '',
                        contextoAdicional: row['Descripción Detallada'] || row.contextoAdicional || '',
                        exigenciaFisica: row['Exigencia Física'] || row.exigenciaFisica || '',
                        exigenciaMental: row['Exigencia Mental'] || row.exigenciaMental || '',
                        operaMaquinaria: row['Opera Maquinaria'] || row.operaMaquinaria || '',
                        eppSeleccionados: eppStr ? eppStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                        entrenamientosSeleccionados: entrenamientosStr ? entrenamientosStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                        controlesFuenteSeleccionados: controlesFuenteStr ? controlesFuenteStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                        controlesMedioSeleccionados: controlesMedioStr ? controlesMedioStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                        report: row['Reporte Generado'] || row.report || '',
                        images: {},
                        video: null
                    };
                });

                setPerfiles(prev => {
                    const cleanPrev = (prev.length === 1 && !prev[0].nombreCargo) ? [] : prev;
                    const combined = [...cleanPrev, ...newPerfiles];
                    if (combined.length > 0 && (!activePerfilId || !prev.find(p => p.id === activePerfilId)?.nombreCargo)) {
                        setActivePerfilId(combined[0].id);
                        setFormData(combined[0]);
                        setGeneratedReport(combined[0].report || null);
                        setEditorContent(combined[0].report || null);
                    }
                    saveImportedPerfiles(combined);
                    return combined;
                });

                showToast({ message: `${newPerfiles.length} perfiles de cargo importados correctamente`, status: 'success' });
            } catch (err) {
                console.error("Error importing Excel:", err);
                showToast({ message: 'Error al importar archivo Excel. Verifica el formato.', status: 'error' });
            }
        };
        reader.readAsArrayBuffer(file);
        if (e.target) e.target.value = '';
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
            if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente', status: 'success' });
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
            showToast({ message: 'Perfil generado con éxito ✅', status: 'success' });
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
                showToast({ message: 'Perfil guardado en el historial', status: 'success' });
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
                    showToast({ message: 'Reporte cargado desde el historial', status: 'success' });
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
            'w-full border-4 border-white px-3 py-2 text-[10px] bg-black text-green-400 focus:outline-none focus:border-green-400 font-pixel uppercase';
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
                        entrenamientosSeleccionados: ['Coordinador de Trabajo Seguro en Alturas', 'Supervisor de Trabajo en Espacios Confinados', 'Inducción y Reinducción en SST'],
                        controlesFuenteSeleccionados: ['Sustitución de herramientas convencionales por ergonómicas/aisladas'],
                        controlesMedioSeleccionados: ['Aislamiento acústico de áreas ruidosas', 'Señalización de seguridad fotoluminiscente y advertencia de riesgos']
                    };
                    setFormData(dummy);
                    showToast({ message: 'Ejemplo cargado', status: 'success' });
                }}
                onImportExcel={() => fileInputRef.current?.click()}
                onExportExcel={handleExportExcel}
                hasData={perfiles.length > 0}
            />

            {/* ── History (Filtered by Profile ID) ── */}
            {isHistoryOpen && (
                <div className="rounded-2xl border-2 border-teal-100 dark:border-teal-900/30 bg-surface-secondary shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(false)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-perfil-cargo', `sgsst-perfil-cargo-${activePerfilId}`]}
                    />
                </div>
            )}

            {/* ── Profiles Quick Access (Save Slots) ── */}
            <div className="pixel-box">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-white" />
                        <span className="text-[10px] font-pixel text-white uppercase tracking-widest">Select Save Slot</span>
                    </div>
                    <button
                        onClick={handleAddPerfil}
                        className="pixel-btn bg-blue-600 border-white text-[10px] flex items-center gap-2"
                    >
                        <Plus className="h-3.5 w-3.5" /> NEW CHARACTER
                    </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {perfiles.map(p => (
                        <div key={p.id} className="group flex items-center gap-1">
                            <button
                                onClick={() => handleSelectPerfil(p.id)}
                                className={cn(
                                    "px-4 py-3 text-[10px] font-pixel transition-all border-4 uppercase truncate max-w-[250px]",
                                    activePerfilId === p.id 
                                        ? "bg-green-600 text-white border-white scale-105" 
                                        : "bg-black text-green-400 border-green-600 hover:border-white"
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

            {/* ── Core Form (Character Sheet) ── */}
            <div className="pixel-box-dark mt-8 p-6">
                <div className="flex flex-col md:flex-row gap-6 border-b-4 border-white pb-6 mb-6">
                     <PixelAvatar level={formData.nivelCargo} />
                     <div className="flex-1 space-y-4">
                         <h2 className="font-pixel text-2xl text-green-400 uppercase">Character Sheet</h2>
                         <div className="space-y-2">
                             <div className="flex justify-between font-pixel text-[10px] text-white">
                                 <span>HP (Health Status)</span>
                                 <span>100/100</span>
                             </div>
                             <div className="pixel-progress-bg"><div className="pixel-progress-fill" style={{width: '100%'}}></div></div>
                         </div>
                     </div>
                </div>

                <div className="space-y-10">
                    {FIELD_SECTIONS.map(section => (
                        <div key={section.title} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <h4 className="font-pixel text-[12px] text-white uppercase tracking-wider">{section.title}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {section.fields.map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-[10px] font-pixel text-green-400 uppercase tracking-tighter">
                                            {field.label}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-4 border-green-800 pb-2">
                            <h4 className="font-pixel text-[12px] text-white uppercase tracking-wider">SKILL TREE & INVENTORY</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <MultiSelect
                                label="Controles en la Fuente (Ingeniería / Diseño)"
                                placeholder="Seleccionar controles en la fuente..."
                                options={CONTROLES_FUENTE_OPTIONS}
                                selected={formData.controlesFuenteSeleccionados || []}
                                onChange={(val) => handleInput('controlesFuenteSeleccionados', val)}
                            />
                            <MultiSelect
                                label="Controles en el Medio (Organización / Entorno)"
                                placeholder="Seleccionar controles en el medio..."
                                options={CONTROLES_MEDIO_OPTIONS}
                                selected={formData.controlesMedioSeleccionados || []}
                                onChange={(val) => handleInput('controlesMedioSeleccionados', val)}
                            />
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

                    {/* Microphone Interface */}
                    <div className="space-y-4 pt-8 border-t-4 border-white mt-8">
                        <div className="flex items-center justify-between">
                            <h4 className="font-pixel text-white text-[10px]">
                                CHARACTER LORE (Context)
                            </h4>
                            <button
                                onClick={handleVoiceInput}
                                className={cn(
                                    "pixel-btn",
                                    isListening ? "bg-red-600" : "bg-blue-600"
                                )}
                            >
                                {isListening ? 'RECORDING...' : 'VOICE RECORD'}
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
                                    "w-full border-4 p-5 text-[10px] font-pixel uppercase min-h-[180px] transition-all duration-300 focus:outline-none",
                                    isListening 
                                        ? "border-red-500 bg-black text-red-500" 
                                        : "border-white bg-black text-green-400 focus:border-green-400"
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
                <div className="mt-8 px-6 py-4 bg-black border-4 border-white flex items-center gap-3">
                    <span className="text-[10px] font-pixel text-white uppercase">
                        QUEST VALID: COMPLIES WITH RES 1843 (2025) & GTC 45 (2012)
                    </span>
                </div>
            </div>

            {/* Generated Report View */}
            {generatedReport && (
                <div className="rounded-2xl border border-border-medium bg-surface-primary shadow-2xl overflow-hidden animate-in fade-in duration-500">
                    <div className="border-b border-border-medium bg-surface-tertiary px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-teal-600 rounded-xl text-white"><FileText className="h-5 w-5" /></div>
                        <h3 className="font-black text-base tracking-tight">INFORME TÉCNICO GENERADO</h3>
                    </div>
                    <div className="p-1">
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
                    </div>
                </div>
            )}

            {/* ═══ Excel Import Hidden Input ═══ */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
            />
        </div>
    );
};

export default PerfilesCargo;
