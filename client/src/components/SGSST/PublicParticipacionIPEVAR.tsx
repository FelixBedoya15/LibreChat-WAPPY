import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Shield,
    AlertTriangle,
    Camera,
    UserCircle,
    Key,
    Send,
    CheckCircle,
    X,
    HardHat,
    Loader2,
    Award,
    Mic,
    MicOff,
    Sparkles,
    ChevronDown,
    ChevronUp,
    MapPin,
    Briefcase,
    Building2,
    Building,
    Layers,
    AlertOctagon,
    ThumbsUp,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import axios from 'axios';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

// Ciudades principales de Colombia para el Centro de Trabajo
const CIUDADES_COLOMBIA = [
    'Bogotá D.C.',
    'Medellín (Antioquia)',
    'Cali (Valle del Cauca)',
    'Barranquilla (Atlántico)',
    'Cartagena (Bolívar)',
    'Bucaramanga (Santander)',
    'Cúcuta (Norte de Santander)',
    'Pereira (Risaralda)',
    'Santa Marta (Magdalena)',
    'Ibagué (Tolima)',
    'Manizales (Caldas)',
    'Pasto (Nariño)',
    'Villavicencio (Meta)',
    'Montería (Córdoba)',
    'Neiva (Huila)',
    'Armenia (Quindío)',
    'Popayán (Cauca)',
    'Valledupar (Cesar)',
    'Tunja (Boyacá)',
    'Sincelejo (Sucre)',
    'Riohacha (La Guajira)',
    'Yopal (Casanare)',
    'Florencia (Caquetá)',
    'Quibdó (Chocó)',
    'San Andrés Isla',
    'Palmira (Valle)',
    'Buenaventura (Valle)',
    'Bello (Antioquia)',
    'Itagüí (Antioquia)',
    'Envigado (Antioquia)',
    'Soacha (Cundinamarca)',
    'Dosquebradas (Risaralda)',
    'Floridablanca (Santander)',
    'Barrancabermeja (Santander)',
    'Duitama (Boyacá)',
    'Sogamoso (Boyacá)',
    'Rionegro (Antioquia)',
    'Chía (Cundinamarca)',
    'Zipaquirá (Cundinamarca)'
];

// Sugerencias para el Área (casilla manual)
const SUGERENCIAS_AREA = [
    'Auditoría y revisoría Fiscal',
    'Servicios legales',
    'BPO',
    'Impuestos',
    'Administración',
    'Cumplimiento',
    'Dirección',
    'Operaciones / Producción',
    'Mantenimiento e Infraestructura',
    'Logística y Almacén',
    'Comercial y Ventas',
    'Talento Humano / SST',
    'Tecnología y Sistemas',
    'Financiera y Contable',
    'Obras y Proyectos'
];

// Sugerencias para la Actividad (casilla manual)
const SUGERENCIAS_ACTIVIDAD = [
    'Administrativa',
    'Operativa',
    'Servicios generales',
    'Mantenimiento a infraestructura',
    'Atención al cliente / Ventas',
    'Logística y mensajería',
    'Auditoría y revisión',
    'Obras civiles y campo'
];

// Sugerencias para la Tarea del PDF (casilla manual asistida)
const SUGERENCIAS_TAREA = [
    'Planificar, controlar y hacer seguimiento a actividades.',
    'Digitar, elaborar informes, verificar datos.',
    'Coordinar, dirigir y asignar funciones.',
    'Atender clientes.',
    'Labores administrativas, propias del ejercicio.',
    'Diligencias administrativas, (mensajería).',
    'Visitar empresas.',
    'Limpieza de instalaciones.',
    'Servicio de mantenimiento a infraestructura.',
    'Cargue y descargue de materiales y suministros.'
];

// Catálogo GTC-45 Oficial del PDF (Preguntas 8 a 14)
const CATALOGO_PELIGROS_GTC45: Record<string, { label: string; icon: string; items: string[] }> = {
    'Biomecánicos': {
        label: 'Biomecánicos',
        icon: '🦴',
        items: [
            'Postura (prolongada mantenida, forzada, antigravitaciones)',
            'Esfuerzo',
            'Movimiento repetitivo',
            'Manipulación manual de cargas (Levantamiento o tracción de cargas)'
        ]
    },
    'Condiciones de Seguridad': {
        label: 'Condiciones de Seguridad',
        icon: '🦺',
        items: [
            'Mecánico (Herramienta manual de oficina / equipos)',
            'Eléctrico: Baja tensión',
            'Locativo: Superficies de trabajo, Mobiliario, Instalaciones, orden y aseo',
            'Público: Robos, atracos, asaltos, atentados de orden público',
            'Accidentes de tránsito',
            'Tecnológico: Incendio',
            'Alturas: caída libre / distintos niveles'
        ]
    },
    'Físico': {
        label: 'Físico',
        icon: '🔊',
        items: [
            'Ruido (De impacto, continuo)',
            'Iluminación deficiente o excesiva',
            'Temperaturas Extremas (Calor o frío)',
            'Radiaciones no ionizantes (Rayos ultravioletas)'
        ]
    },
    'Biológico': {
        label: 'Biológico',
        icon: '🦠',
        items: [
            'Virus (Coronavirus / virus respiratorios)',
            'Bacterias',
            'Hongos',
            'Parásitos',
            'Picaduras'
        ]
    },
    'Psicosociales': {
        label: 'Psicosociales',
        icon: '🧠',
        items: [
            'Relaciones humanas: Relación con jefe y compañeros',
            'Condiciones de la tarea (Comunicación, tecnología, organización del trabajo)',
            'Gestión organizacional (Remuneración, estilo de mando, contratación, participación, manejo de cambios)'
        ]
    },
    'Químico': {
        label: 'Químico',
        icon: '🧪',
        items: [
            'Polvos (orgánicos e inorgánicos)',
            'Líquidos (nieblas y rocíos)'
        ]
    },
    'Fenómenos Naturales': {
        label: 'Fenómenos Naturales',
        icon: '⛈️',
        items: [
            'Tormenta eléctrica',
            'Sismo',
            'Vendaval',
            'Inundación'
        ]
    }
};

const CHIPS_EFECTOS = [
    { label: 'Fatiga / Dolor lumbar / Espalda', icon: '🏋️' },
    { label: 'Túnel del carpo / Lesión repetitiva', icon: '🖐️' },
    { label: 'Estrés laboral / Agotamiento', icon: '🧠' },
    { label: 'Caída de alturas / Distinto nivel', icon: '🧗' },
    { label: 'Golpes / Fracturas / Traumatismo', icon: '🔨' },
    { label: 'Cortes / Heridas con herramientas', icon: '🩹' },
    { label: 'Atrapamiento en equipos o muebles', icon: '⚙️' },
    { label: 'Descarga eléctrica / Contacto', icon: '⚡' },
    { label: 'Fatiga visual / Cefalea por luz', icon: '👁️' },
    { label: 'Hipoacusia / Molestia por ruido', icon: '🔊' },
    { label: 'Alergias / Inhalación de polvo', icon: '😷' },
    { label: 'Accidente de tránsito en diligencia', icon: '🚗' },
];

export default function PublicParticipacionIPEVAR() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State - Identificación y Ubicación
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [centroTrabajo, setCentroTrabajo] = useState('Bogotá D.C.');
    const [otraCiudad, setOtraCiudad] = useState('');
    const [area, setArea] = useState('');
    const [cargo, setCargo] = useState('');

    // Auto-advance if authenticated worker arrives
    useEffect(() => {
        if (isAuthenticated && worker) {
            setNombre(worker.nombre || '');
            setCedula(worker.cedula || '');
            if (worker.cargo) setCargo(worker.cargo);
            if ((worker as any).area) setArea((worker as any).area);
            if ((worker as any).centroTrabajo || (worker as any).ciudad) {
                setCentroTrabajo((worker as any).centroTrabajo || (worker as any).ciudad);
            }
            setStep((prev) => (prev === 1 ? 2 : prev));
        }
    }, [isAuthenticated, worker]);
    
    // Step 2 Data - Lugar, Actividad, Tarea y Peligros
    const [zona, setZona] = useState('');
    const [actividad, setActividad] = useState('');
    const [tarea, setTarea] = useState('');
    const [rutinaria, setRutinaria] = useState<'Sí' | 'No'>('Sí');
    
    // GTC-45 Catálogo del PDF
    const [categoriaPeligroActiva, setCategoriaPeligroActiva] = useState<string>('Biomecánicos');
    const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([]);
    const [peligros, setPeligros] = useState('');
    const [consecuencias, setConsecuencias] = useState('');
    const [severidadPercibida, setSeveridadPercibida] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
    
    // Evidencia Fotográfica
    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });

    // Step 3 Data - Sustitución de Controles: Solo 2 Descripciones
    const [controlesExistentes, setControlesExistentes] = useState('');
    const [propuestaControl, setPropuestaControl] = useState('');
    
    // Estado de envío y voz
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidatingWorker, setIsValidatingWorker] = useState(false);
    const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);

    // Reconocimiento de Voz
    const [isListening, setIsListening] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState<'peligros' | 'consecuencias' | 'controlesExistentes' | 'propuestaMejora' | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
                setCompany(res.data);
            } catch (error) {
                console.error('Error fetching company info:', error);
            } finally {
                setLoadingCompany(false);
            }
        };
        fetchCompany();
    }, [companyId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const resizedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setImages(prev => ({ ...prev, [field]: resizedImageBase64 }));
            };
            img.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (field: string) => {
        setImages(prev => ({ ...prev, [field]: null }));
    };

    const startVoiceDictation = (field: 'peligros' | 'consecuencias' | 'controlesExistentes' | 'propuestaMejora') => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Tu navegador no soporta reconocimiento de voz. Te recomendamos usar Google Chrome en tu celular.');
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
            setIsListening(false);
            setActiveVoiceField(null);
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
                setActiveVoiceField(field);
            };

            recognition.onresult = (event: any) => {
                let finalTrans = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTrans += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTrans) {
                    if (field === 'peligros') {
                        setPeligros(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
                    } else if (field === 'consecuencias') {
                        setConsecuencias(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
                    } else if (field === 'controlesExistentes') {
                        setControlesExistentes(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
                    } else if (field === 'propuestaMejora') {
                        setPropuestaControl(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
                    }
                }
            };

            recognition.onerror = () => {
                setIsListening(false);
                setActiveVoiceField(null);
            };

            recognition.onend = () => {
                setIsListening(false);
                setActiveVoiceField(null);
            };

            recognition.start();
        } catch (e) {
            setIsListening(false);
            setActiveVoiceField(null);
        }
    };

    const toggleEfectoChip = (label: string) => {
        setConsecuencias(prev => {
            if (!prev) return label;
            if (prev.includes(label)) {
                return prev.replace(label, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
            }
            return `${prev}, ${label}`;
        });
    };

    const validateIdentity = async () => {
        if (!nombre.trim() || !cedula.trim()) {
            alert("Por favor ingresa tu nombre y cédula para continuar.");
            return;
        }

        setIsValidatingWorker(true);
        setSubmitResult(null);

        try {
            const payload = { cedula, nombre };
            const res = await axios.post(`/api/public-sgsst/validate-worker/${companyId}`, payload);
            if (res.data?.companyName) {
                setCompany((prev: any) => ({
                    ...prev,
                    _id: res.data.companyId || prev?._id,
                    companyName: res.data.companyName
                }));
            }
            saveSession({
                companyId,
                companyName: res.data?.companyName || company?.companyName,
                nombre: nombre.trim(),
                cedula: cedula.trim(),
            });
            setStep(2);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Error al validar la identidad en la base de datos de la empresa.";
            setSubmitResult({ success: false, message: errorMsg });
        } finally {
            setIsValidatingWorker(false);
        }
    };

    const validateStep2 = () => {
        if (!zona.trim()) {
            alert("Por favor indica el lugar o zona donde trabajas.");
            return;
        }
        if (!actividad.trim()) {
            alert("Por favor indica la actividad relacionada a tu función.");
            return;
        }
        if (!tarea.trim()) {
            alert("Por favor indica la tarea recurrente que realizas.");
            return;
        }
        if (factoresSeleccionados.length === 0 && !peligros.trim()) {
            alert("Por favor selecciona al menos un factor de peligro o describe la condición observada.");
            return;
        }
        setStep(3);
    };

    async function handleSubmit() {
        if (!controlesExistentes.trim()) {
            alert("Por favor completa los Controles Existentes (lo que hace la empresa actualmente).");
            return;
        }
        if (!propuestaControl.trim()) {
            alert("Por favor completa tu Propuesta de Control (lo que consideras necesario implementar).");
            return;
        }

        if (isListening && recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
            setIsListening(false);
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        const ciudadFinal = centroTrabajo === 'Otra' && otraCiudad.trim() ? otraCiudad.trim() : centroTrabajo;

        const textoPeligrosFinal = [
            factoresSeleccionados.length > 0 ? `Factores identificados (${categoriaPeligroActiva}): ${factoresSeleccionados.join(', ')}.` : '',
            peligros.trim()
        ].filter(Boolean).join(' ');

        try {
            const payload = {
                cedula,
                nombre,
                data: {
                    fecha: new Date().toISOString(),
                    centroTrabajo: ciudadFinal,
                    area: area.trim(),
                    cargo: cargo.trim() || worker?.cargo || '',
                    proceso: area.trim() || 'General',
                    zona: zona.trim(),
                    actividad: actividad.trim(),
                    tarea: tarea.trim(),
                    rutinaria,
                    peligroClasificacion: categoriaPeligroActiva,
                    factoresSeleccionados,
                    peligros: textoPeligrosFinal,
                    consecuencias: consecuencias.trim(),
                    efectosPosibles: consecuencias.trim() || 'Riesgo de accidente o afectación de salud',
                    severidadPercibida,
                    ...images,
                    controlesExistentes: controlesExistentes.trim(),
                    suficientes: true,
                    propuestaMejora: propuestaControl.trim(),
                    // Campos de compatibilidad interna para que la matriz general mantenga coherencia:
                    sugeridoIngenieria: propuestaControl.trim(),
                    sugeridoEliminacion: '',
                    sugeridoAdministrativo: '',
                    sugeridoEPP: ''
                }
            };
            const targetCompanyId = company?._id || companyId;
            const response = await axios.post(`/api/public-sgsst/participacion-ipevar/${targetCompanyId}`, payload);
            setSubmitResult({ success: true, message: response.data.message });
            setStep(4);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Ocurrió un error al enviar el reporte.";
            setSubmitResult({ success: false, message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-14 h-14 text-teal-600 animate-bounce mb-4" />
                <h2 className="text-xl font-bold text-text-primary">Conectando con Portal SG-SST...</h2>
                <p className="text-xs text-text-secondary mt-2">Identificación de Peligros y Seguridad en el Trabajo</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-14 h-14 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-text-primary">Enlace Inválido</h2>
                <p className="text-xs text-text-secondary mt-2">El código QR escaneado no está asociado a una empresa registrada en WAPPY.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-text-primary flex flex-col transition-colors">
            {/* Header Universal WAPPY */}
            <PublicWorkerHeader
                companyId={companyId || ''}
                companyName={company.companyName}
                companyLogo={company.logo}
                currentModule="ipevar"
                workerCedula={cedula}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full max-w-lg mx-auto flex flex-col">
                {/* Step Indicator (3 Pasos Claros) */}
                {step < 4 && (
                    <div className="flex items-center justify-between mb-5 px-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-medium/60 -z-10 -translate-y-1/2 rounded-full"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-teal-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
                            style={{ width: `${(step - 1) * 50}%` }}
                        ></div>
                        
                        {[
                            { num: 1, label: 'Identidad y Ubicación' },
                            { num: 2, label: 'Peligro GTC-45' },
                            { num: 3, label: 'Controles y Solución' }
                        ].map(({ num, label }) => (
                            <div key={num} className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                    step === num
                                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-500/30 border-2 border-teal-500 scale-105'
                                        : step > num
                                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-300 dark:border-teal-700'
                                        : 'bg-surface-secondary text-text-tertiary border border-border-medium'
                                }`}>
                                    {step > num ? <CheckCircle className="w-4 h-4" /> : num}
                                </div>
                                <span className={`text-[10px] font-bold ${step === num ? 'text-teal-600 dark:text-teal-400' : 'text-text-tertiary'}`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wizard Container */}
                <div className="bg-surface-primary dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-border-medium flex-1 relative overflow-hidden flex flex-col">
                    
                    {/* ────────────────── STEP 1: IDENTIFICACIÓN Y UBICACIÓN ────────────────── */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-2xs">
                                    <Award className="w-3.5 h-3.5" /> +150 pts Pasaporte SST
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold border border-border-medium">
                                    GTC-45 / Dec. 1072
                                </span>
                            </div>

                            <div className="mb-4 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                                    <UserCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary leading-tight">Actualización Matriz de Peligros</h2>
                                    <p className="text-xs text-text-secondary">Identificación y reporte de condiciones de trabajo (GTC-45)</p>
                                </div>
                            </div>

                            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                                        Nombre y Apellidos *
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Ej: Carlos Alberto Ramírez"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-2">
                                        <Key className="w-4 h-4 text-teal-600" /> No. de Documento (Cédula) *
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Número de documento sin puntos"
                                        value={cedula}
                                        onChange={(e) => setCedula(e.target.value)}
                                    />
                                </div>

                                {/* Centro de Trabajo (Ciudades Principales de Colombia) */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-teal-600" /> Centro de Trabajo (Ciudad / Sede) *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={centroTrabajo}
                                            onChange={(e) => setCentroTrabajo(e.target.value)}
                                            className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all font-medium appearance-none cursor-pointer"
                                        >
                                            {CIUDADES_COLOMBIA.map((ciudad) => (
                                                <option key={ciudad} value={ciudad}>
                                                    {ciudad}
                                                </option>
                                            ))}
                                            <option value="Otra">Otra ciudad / Sede específica...</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                    {centroTrabajo === 'Otra' && (
                                        <input
                                            type="text"
                                            placeholder="Escribe el nombre de la ciudad o sede"
                                            value={otraCiudad}
                                            onChange={(e) => setOtraCiudad(e.target.value)}
                                            className="w-full mt-2 rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 text-text-primary px-4 py-2.5 text-sm font-medium"
                                        />
                                    )}
                                </div>

                                {/* Área (Casilla manual) */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-teal-600" /> Área a la que pertenece *
                                    </label>
                                    <input 
                                        type="text" 
                                        list="lista-areas-sugeridas"
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Ej: Auditoría y revisoría Fiscal, Impuestos, Operaciones..."
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                    />
                                    <datalist id="lista-areas-sugeridas">
                                        {SUGERENCIAS_AREA.map((sug, i) => (
                                            <option key={i} value={sug} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Cargo */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-teal-600" /> Cargo *
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Ej: Auditor Senior, Auxiliar Administrativo, Analista..."
                                        value={cargo}
                                        onChange={(e) => setCargo(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {submitResult && !submitResult.success && step === 1 && (
                                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-xs text-rose-700 dark:text-rose-300 rounded-r border-y border-r border-rose-200 dark:border-rose-800">
                                    <strong className="block mb-1">Autorización Denegada</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-4">
                                <button 
                                    onClick={validateIdentity}
                                    disabled={isValidatingWorker}
                                    className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md active:scale-95 transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isValidatingWorker ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Validando en la empresa...
                                        </>
                                    ) : (
                                        <>
                                            <span>Comenzar Participación</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── STEP 2: ¿DÓNDE Y QUÉ PELIGRO VISTE? ────────────────── */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            {nombre && cedula && (
                                <WorkerSessionBadge
                                    nombre={nombre}
                                    cedula={cedula}
                                    cargo={cargo || worker?.cargo}
                                    companyName={company?.companyName}
                                    onClear={() => {
                                        clearSession();
                                        setNombre('');
                                        setCedula('');
                                        setStep(1);
                                    }}
                                    className="mb-3 shrink-0"
                                />
                            )}

                            <div className="mb-3 flex items-center gap-2.5 text-teal-600 dark:text-teal-400 shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                    <AlertOctagon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-text-primary leading-tight">Identificación de Peligros (GTC-45)</h2>
                                    <p className="text-[11px] text-text-secondary">Selecciona los factores que aplican a tu actividad y describe la situación</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 pb-2 text-xs">
                                
                                {/* Lugar y Actividad (Manuales) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-teal-600" /> ¿En qué lugar o zona? *
                                        </label>
                                        <input 
                                            type="text" 
                                            list="zonas-sugeridas"
                                            placeholder="Ej: Oficina 402, Archivo central, Bodega..." 
                                            value={zona} 
                                            onChange={e => setZona(e.target.value)} 
                                            className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2.5 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium" 
                                        />
                                        <datalist id="zonas-sugeridas">
                                            <option value="Oficina Principal" />
                                            <option value="Área de Sistemas / Servidores" />
                                            <option value="Archivo y Documentación" />
                                            <option value="Recepción / Atención al Público" />
                                            <option value="Bodega / Almacén" />
                                            <option value="Puesto de Trabajo Remoto / Casa" />
                                            <option value="Trabajo de Campo / Visita a Clientes" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-teal-600" /> Actividad (Relacionada a su función) *
                                        </label>
                                        <input 
                                            type="text" 
                                            list="actividades-sugeridas"
                                            placeholder="Ej: Administrativa, Operativa, Servicios generales..." 
                                            value={actividad} 
                                            onChange={e => setActividad(e.target.value)} 
                                            className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2.5 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium" 
                                        />
                                        <datalist id="actividades-sugeridas">
                                            {SUGERENCIAS_ACTIVIDAD.map((act, i) => (
                                                <option key={i} value={act} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* TAREA (Casilla manual con sugerencias del PDF) */}
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Briefcase className="w-3 h-3 text-teal-600" /> Tarea (Seleccione o escriba la más recurrente) *
                                    </label>
                                    <input 
                                        type="text" 
                                        list="tareas-sugeridas"
                                        placeholder="Ej: Digitar, elaborar informes, verificar datos..." 
                                        value={tarea} 
                                        onChange={e => setTarea(e.target.value)} 
                                        className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2.5 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium mb-1.5" 
                                    />
                                    <datalist id="tareas-sugeridas">
                                        {SUGERENCIAS_TAREA.map((tar, i) => (
                                            <option key={i} value={tar} />
                                        ))}
                                    </datalist>
                                    
                                    {/* Botones de selección rápida del PDF */}
                                    <div className="flex flex-wrap gap-1">
                                        {SUGERENCIAS_TAREA.slice(0, 5).map((sug, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setTarea(sug)}
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                                                    tarea === sug
                                                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 font-bold'
                                                        : 'bg-surface-secondary/60 border-border-medium text-text-secondary hover:border-teal-400'
                                                }`}
                                            >
                                                {sug.split(',')[0]}...
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ¿Es Rutinaria? */}
                                <div className="p-2.5 bg-surface-secondary/50 rounded-xl border border-border-medium flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-text-secondary">
                                        ¿Haces este trabajo frecuentemente?
                                    </span>
                                    <div className="flex gap-1.5 bg-surface-primary dark:bg-zinc-800 p-0.5 rounded-lg border border-border-medium">
                                        <button
                                            type="button"
                                            onClick={() => setRutinaria('Sí')}
                                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                rutinaria === 'Sí'
                                                    ? 'bg-teal-600 text-white shadow-2xs'
                                                    : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                        >
                                            Sí, rutinario
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRutinaria('No')}
                                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                rutinaria === 'No'
                                                    ? 'bg-amber-600 text-white shadow-2xs'
                                                    : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                        >
                                            No, ocasional
                                        </button>
                                    </div>
                                </div>

                                {/* PELIGROS Y FACTORES DE RIESGO: Catálogo GTC-45 del PDF */}
                                <div className="pt-2 border-t border-border-medium/60">
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Clasificación del Peligro (GTC-45) *
                                    </label>
                                    {/* Selector de Familias de Peligro */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                                        {Object.keys(CATALOGO_PELIGROS_GTC45).map((catKey) => {
                                            const cat = CATALOGO_PELIGROS_GTC45[catKey];
                                            const isSelected = categoriaPeligroActiva === catKey;
                                            const countSelectedInCat = factoresSeleccionados.filter(f => cat.items.includes(f)).length;
                                            return (
                                                <button
                                                    key={catKey}
                                                    type="button"
                                                    onClick={() => setCategoriaPeligroActiva(catKey)}
                                                    className={`p-2 rounded-xl border text-left transition-all active:scale-95 flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                                                            : 'bg-surface-secondary/40 border-border-medium text-text-secondary hover:bg-surface-hover'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <span>{cat.icon}</span>
                                                        <span className="text-[10px] font-bold truncate">{cat.label}</span>
                                                    </span>
                                                    {countSelectedInCat > 0 && (
                                                        <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                                            {countSelectedInCat}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Factores específicos de la familia seleccionada (Casillas interactivas del PDF) */}
                                    <div className="p-3 bg-teal-50/30 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-2xl mb-3 space-y-1.5">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1">
                                            <span>{CATALOGO_PELIGROS_GTC45[categoriaPeligroActiva]?.icon}</span>
                                            <span>Factores específicos: {CATALOGO_PELIGROS_GTC45[categoriaPeligroActiva]?.label}</span>
                                        </p>
                                        <div className="space-y-1.5">
                                            {CATALOGO_PELIGROS_GTC45[categoriaPeligroActiva]?.items.map((item, idx) => {
                                                const isChecked = factoresSeleccionados.includes(item);
                                                return (
                                                    <label
                                                        key={idx}
                                                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                                            isChecked
                                                                ? 'bg-teal-100/70 dark:bg-teal-900/50 border-teal-400 text-teal-900 dark:text-teal-100 font-semibold shadow-2xs'
                                                                : 'bg-surface-primary dark:bg-zinc-800/80 border-border-medium/70 text-text-secondary hover:bg-surface-hover'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                setFactoresSeleccionados(prev => 
                                                                    prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
                                                                );
                                                            }}
                                                            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                                        />
                                                        <span className="text-[11px] leading-tight flex-1">{item}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Descripción del Peligro con Dictado de Voz */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                                            Describe el Peligro o Condición Insegura *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => startVoiceDictation('peligros')}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
                                                isListening && activeVoiceField === 'peligros'
                                                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                                                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                                            }`}
                                        >
                                            {isListening && activeVoiceField === 'peligros' ? (
                                                <>
                                                    <MicOff className="w-3.5 h-3.5 animate-spin" /> Escuchando...
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Dictar por Voz
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <textarea 
                                        rows={3} 
                                        className="w-full border border-border-medium rounded-xl bg-surface-secondary/40 text-xs p-3 focus:ring-2 focus:ring-teal-500 text-text-primary resize-none font-medium leading-relaxed placeholder:text-text-tertiary" 
                                        placeholder="Ej: La silla de trabajo tiene el espaldar vencido y la pantalla del computador genera reflejos molestos en los ojos..."
                                        value={peligros}
                                        onChange={e => setPeligros(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Consecuencias (Pregunta 17 del PDF) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                                            Consecuencias: posibles daños causados por la actividad *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => startVoiceDictation('consecuencias')}
                                            className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Mic className="w-3 h-3" /> Dictar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {CHIPS_EFECTOS.map(({ label, icon }) => {
                                            const isSelected = consecuencias.includes(label);
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => toggleEfectoChip(label)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                                            : 'bg-surface-secondary/80 border-border-medium text-text-secondary hover:border-teal-400'
                                                    }`}
                                                >
                                                    <span>{icon}</span>
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="O escribe otras consecuencias: ej: Fatiga visual, dolor en cuello y hombros..." 
                                        value={consecuencias} 
                                        onChange={e => setConsecuencias(e.target.value)} 
                                        className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium" 
                                    />
                                </div>

                                {/* Severidad / Gravedad Percibida */}
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                                        ¿Qué tan grave o urgente consideras este peligro?
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { id: 'Baja', label: 'Baja', color: 'emerald' },
                                            { id: 'Media', label: 'Media', color: 'amber' },
                                            { id: 'Alta', label: 'Alta', color: 'orange' },
                                            { id: 'Crítica', label: 'Crítica', color: 'rose' },
                                        ].map(sev => (
                                            <button
                                                key={sev.id}
                                                type="button"
                                                onClick={() => setSeveridadPercibida(sev.id as any)}
                                                className={`py-2 px-1 text-[11px] font-extrabold rounded-xl border transition-all active:scale-95 cursor-pointer text-center ${
                                                    severidadPercibida === sev.id
                                                        ? sev.id === 'Crítica'
                                                            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                                                            : sev.id === 'Alta'
                                                            ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                                            : sev.id === 'Media'
                                                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                            : 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                        : 'bg-surface-secondary/60 border-border-medium text-text-secondary hover:bg-surface-hover'
                                                }`}
                                            >
                                                {sev.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fotos de Evidencia */}
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                                        Foto del Peligro (Opcional pero muy útil)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['foto1', 'foto2', 'foto3'].map((imgKey, idx) => (
                                            <div key={imgKey} className="relative w-full h-20 rounded-xl overflow-hidden border-2 border-dashed border-border-medium bg-surface-secondary/40 hover:bg-teal-50/20 hover:border-teal-400 transition-colors flex items-center justify-center group">
                                                {images[imgKey] ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={images[imgKey] as string} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removeImage(imgKey); }} 
                                                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-rose-500 transition-colors cursor-pointer"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] font-bold text-text-tertiary group-hover:text-teal-600 flex flex-col items-center gap-1">
                                                            <Camera className="w-4 h-4 text-teal-600" />
                                                            Foto {idx + 1}
                                                        </span>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            capture="environment" 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                            onChange={(e) => handleImageUpload(e, imgKey)} 
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Botonera WAPPY */}
                            <div className="mt-auto pt-3 flex gap-2.5 shrink-0 border-t border-border-medium/60">
                                <button 
                                    onClick={() => setStep(1)} 
                                    className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-primary dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all text-xs active:scale-95 shadow-2xs cursor-pointer"
                                >
                                    Atrás
                                </button>
                                <button 
                                    onClick={validateStep2} 
                                    className="flex-1 py-3 px-6 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Continuar: Controles y Solución</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── STEP 3: CONTROLES EXISTENTES Y PROPUESTA DE CONTROL ────────────────── */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="mb-3 flex items-center gap-2.5 text-teal-600 dark:text-teal-400 shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-text-primary leading-tight">Controles y Solución</h2>
                                    <p className="text-[11px] text-text-secondary">Tu criterio ayuda a definir mejoras reales en tu puesto</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2 text-xs">
                                
                                {/* 18. CONTROLES EXISTENTES */}
                                <div className="space-y-1.5 p-3.5 bg-surface-secondary/40 border border-border-medium rounded-2xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                                            18. Controles Existentes *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => startVoiceDictation('controlesExistentes')}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
                                                isListening && activeVoiceField === 'controlesExistentes'
                                                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                                                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                                            }`}
                                        >
                                            {isListening && activeVoiceField === 'controlesExistentes' ? (
                                                <>
                                                    <MicOff className="w-3.5 h-3.5 animate-spin" /> Escuchando...
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Dictar por Voz
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-text-secondary mb-1">
                                        Lo que evidencia que hace la empresa actualmente para controlar el riesgo:
                                    </p>
                                    <textarea 
                                        rows={3} 
                                        className="w-full rounded-xl border border-border-medium bg-surface-primary text-text-primary px-3.5 py-2.5 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none leading-relaxed focus:ring-2 focus:ring-teal-500" 
                                        placeholder="Ej: Se realizan pausas activas y se entregaron elementos básicos, pero no hay apoya-muñecas ni revisión ergonómica del puesto..."
                                        value={controlesExistentes}
                                        onChange={e => setControlesExistentes(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* 19. PROPUESTA DE CONTROL */}
                                <div className="space-y-1.5 p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-2xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                                            <Lightbulb className="w-4 h-4 text-amber-500" /> 19. Propuesta de Control *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => startVoiceDictation('propuestaMejora')}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
                                                isListening && activeVoiceField === 'propuestaMejora'
                                                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                                                    : 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50'
                                            }`}
                                        >
                                            {isListening && activeVoiceField === 'propuestaMejora' ? (
                                                <>
                                                    <MicOff className="w-3.5 h-3.5 animate-spin" /> Escuchando...
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-3.5 h-3.5 text-teal-600" /> Dictar Solución
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mb-1">
                                        Lo que considera necesario implementar para reforzar o mejorar el control existente:
                                    </p>
                                    <textarea 
                                        rows={3} 
                                        className="w-full rounded-xl border border-teal-300 dark:border-teal-700 bg-surface-primary text-text-primary px-3.5 py-2.5 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none leading-relaxed focus:ring-2 focus:ring-teal-500" 
                                        placeholder="Ej: Suministrar pad mouse ergonómico, programar mantenimiento de luminarias y realizar inspección de puesto de trabajo..."
                                        value={propuestaControl}
                                        onChange={e => setPropuestaControl(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {submitResult && !submitResult.success && (
                                <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-xs text-rose-700 dark:text-rose-300 rounded-r border-y border-r border-rose-200 dark:border-rose-800 shrink-0">
                                    <strong className="block mb-1">Error al Enviar</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            {/* Botonera WAPPY */}
                            <div className="mt-auto pt-3 flex gap-2.5 shrink-0 border-t border-border-medium/60">
                                <button 
                                    onClick={() => setStep(2)} 
                                    disabled={isSubmitting}
                                    className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-primary dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all text-xs active:scale-95 shadow-2xs cursor-pointer"
                                >
                                    Atrás
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-6 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Guardando tu reporte...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Enviar Mi Participación</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── STEP 4: MENSAJE DE ÉXITO Y PASAPORTE ────────────────── */}
                    {step === 4 && (
                        <div className="animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center h-full text-center py-6">
                            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-950/60 rounded-3xl flex items-center justify-center mb-4 text-teal-600 border border-teal-200 dark:border-teal-800 shadow-sm">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-black text-text-primary mb-1.5">¡Reporte Enviado con Éxito!</h2>
                            <p className="text-xs text-text-secondary mb-5 max-w-sm mx-auto leading-relaxed">
                                {submitResult?.message || 'Tu aporte ha sido registrado formalmente y alimenta la Matriz Oficial de Peligros de la empresa.'}
                            </p>
                            
                            <div className="w-full max-w-sm rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-left text-xs text-teal-900 mb-5 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                                <div className="flex items-start gap-2.5">
                                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                                    <div>
                                        <strong className="block text-xs font-bold text-teal-800 dark:text-teal-300">Puntos de Gamificación SST</strong>
                                        <span className="text-[11px]">Tu participación suma <strong>+150 puntos</strong> a tu Pasaporte SST una vez validado por el coordinador.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex w-full max-w-sm flex-col gap-2.5">
                                <button
                                    onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 py-3.5 font-bold text-white shadow-md transition-all active:scale-95 hover:from-teal-500 hover:to-teal-600 text-xs cursor-pointer"
                                >
                                    <Award className="h-4 w-4" /> Ver Mi Pasaporte SST y Mis Puntos
                                </button>

                                <button 
                                    onClick={() => {
                                        setStep(2);
                                        setZona('');
                                        setTarea('');
                                        setActividad('');
                                        setPeligros('');
                                        setFactoresSeleccionados([]);
                                        setConsecuencias('');
                                        setSeveridadPercibida('Media');
                                        setImages({ foto1: null, foto2: null, foto3: null }); 
                                        setControlesExistentes('');
                                        setPropuestaControl('');
                                        setSubmitResult(null);
                                    }} 
                                    className="w-full rounded-2xl border border-border-medium bg-surface-primary dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 py-3 font-bold text-text-secondary transition-colors text-xs active:scale-95 cursor-pointer shadow-2xs"
                                >
                                    Reportar Otro Peligro
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Footer Unificado WAPPY */}
            <footer className="py-3 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
                Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
            </footer>
        </div>
    );
}
