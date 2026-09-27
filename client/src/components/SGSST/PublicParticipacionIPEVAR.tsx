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
    AlertOctagon,
    ThumbsUp,
    Lightbulb
} from 'lucide-react';
import axios from 'axios';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

const CHIPS_EFECTOS = [
    { label: 'Caída de alturas', icon: '🧗' },
    { label: 'Golpes / Fracturas', icon: '🔨' },
    { label: 'Cortes / Heridas', icon: '🩹' },
    { label: 'Atrapamiento en máquinas', icon: '⚙️' },
    { label: 'Dolor de espalda / Esfuerzo', icon: '🏋️' },
    { label: 'Descarga eléctrica', icon: '⚡' },
    { label: 'Caída de objetos / Aplastamiento', icon: '🧱' },
    { label: 'Inhalación de polvos / gases', icon: '😷' },
];

function deducirClasificacionPeligro(peligroText: string, efectosText: string, actual: string): string {
    const combined = `${peligroText} ${efectosText}`.toLowerCase();
    if (combined.match(/andamio|altura|caída|caida|piso|escalera|tablón|tablon|máquina|maquina|polea|guarda|atrap|corte|herramienta|mecánic|mecanic|locativ|choque|volcam/)) {
        return 'Condiciones de Seguridad';
    }
    if (combined.match(/carga|peso|bulto|espalda|lumbar|postura|fuerza|ergonóm|ergonom|biomecán|biomecan/)) {
        return 'Biomecánico';
    }
    if (combined.match(/ruido|calor|frío|frio|temperatura|vibrac|iluminac|sol|uv/)) {
        return 'Físico';
    }
    if (combined.match(/químic|quimic|polvo|cemento|humo|gas|vapor|solvente|pintura/)) {
        return 'Químico';
    }
    if (combined.match(/estrés|estres|sobrecarga|turno|acoso|fatiga/)) {
        return 'Psicosocial';
    }
    if (combined.match(/virus|bacteria|hongo|picadura|animal|infecc/)) {
        return 'Biológico';
    }
    return actual || 'Condiciones de Seguridad';
}

export default function PublicParticipacionIPEVAR() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State - Identificación
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');

    // Auto-advance if authenticated worker arrives
    useEffect(() => {
        if (isAuthenticated && worker) {
            setNombre(worker.nombre);
            setCedula(worker.cedula);
            setStep((prev) => (prev === 1 ? 2 : prev));
        }
    }, [isAuthenticated, worker]);
    
    // Step 2 Data - Lugar y Peligro
    const [proceso, setProceso] = useState('');
    const [zona, setZona] = useState('');
    const [actividad, setActividad] = useState('');
    const [tarea, setTarea] = useState('');
    const [rutinaria, setRutinaria] = useState<'Sí' | 'No'>('Sí');
    const [peligros, setPeligros] = useState('');
    const [efectosPosibles, setEfectosPosibles] = useState('');
    const [severidadPercibida, setSeveridadPercibida] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
    const [peligroClasificacion, setPeligroClasificacion] = useState('Condiciones de Seguridad');
    
    // Evidencia Fotográfica
    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });

    // Step 3 Data - Protección y Solución
    const [controlesExistentes, setControlesExistentes] = useState('');
    const [suficientes, setSuficientes] = useState(false);
    const [propuestaMejora, setPropuestaMejora] = useState('');
    
    // Desglose técnico avanzado (opcional)
    const [showAdvancedHierarchy, setShowAdvancedHierarchy] = useState(false);
    const [sugeridoEliminacion, setSugeridoEliminacion] = useState('');
    const [sugeridoIngenieria, setSugeridoIngenieria] = useState('');
    const [sugeridoAdministrativo, setSugeridoAdministrativo] = useState('');
    const [sugeridoEPP, setSugeridoEPP] = useState('');
    
    // Estado de envío y voz
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidatingWorker, setIsValidatingWorker] = useState(false);
    const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);

    // Reconocimiento de Voz
    const [isListening, setIsListening] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState<'peligros' | 'controlesExistentes' | 'propuestaMejora' | null>(null);
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

    const startVoiceDictation = (field: 'peligros' | 'controlesExistentes' | 'propuestaMejora') => {
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
                    } else if (field === 'controlesExistentes') {
                        setControlesExistentes(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
                    } else if (field === 'propuestaMejora') {
                        setPropuestaMejora(prev => (prev ? `${prev.trim()} ${finalTrans.trim()}` : finalTrans.trim()));
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
        setEfectosPosibles(prev => {
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
            alert("Por favor indica el lugar o zona donde trabajas (ej: Torre 2 - Piso 4).");
            return;
        }
        if (!tarea.trim()) {
            alert("Por favor indica la labor o trabajo que estabas realizando.");
            return;
        }
        if (!peligros.trim()) {
            alert("Por favor describe el peligro o condición insegura que observaste.");
            return;
        }
        setStep(3);
    };

    async function handleSubmit() {
        if (isListening && recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
            setIsListening(false);
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        const clasificacionCalculada = deducirClasificacionPeligro(peligros, efectosPosibles, peligroClasificacion);

        try {
            const payload = {
                cedula,
                nombre,
                data: {
                    proceso: proceso.trim() || (worker?.cargo ? `Operativo / ${worker.cargo}` : 'Operativo / Obra Civil'),
                    zona: zona.trim(),
                    actividad: actividad.trim() || tarea.trim(),
                    tarea: tarea.trim(),
                    rutinaria,
                    peligroClasificacion: clasificacionCalculada,
                    peligros: peligros.trim(),
                    efectosPosibles: efectosPosibles.trim() || 'Riesgo de accidente con incapacidad',
                    severidadPercibida,
                    ...images,
                    controlesExistentes: controlesExistentes.trim() || 'Sin controles específicos observados',
                    suficientes,
                    sugeridoEliminacion: sugeridoEliminacion.trim(),
                    sugeridoIngenieria: propuestaMejora.trim() || sugeridoIngenieria.trim(),
                    sugeridoAdministrativo: sugeridoAdministrativo.trim(),
                    sugeridoEPP: sugeridoEPP.trim()
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
                            { num: 1, label: 'Identidad' },
                            { num: 2, label: 'Peligro' },
                            { num: 3, label: 'Solución' }
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
                    
                    {/* ────────────────── STEP 1: IDENTIFICACIÓN ────────────────── */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-2xs">
                                    <Award className="w-3.5 h-3.5" /> +150 pts Pasaporte SST
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold border border-border-medium">
                                    Dec. 1072/15 Art. 2.2.4.6.15
                                </span>
                            </div>

                            <div className="mb-5 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                                    <UserCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary leading-tight">Reportar Peligro</h2>
                                    <p className="text-xs text-text-secondary">Tu reporte ayuda a prevenir accidentes en el trabajo</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                                        Nombre Completo
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Ej: Carlos Pérez"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                        <Key className="w-4 h-4 text-teal-600" /> Cédula de Ciudadanía
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium" 
                                        placeholder="Número de documento sin puntos"
                                        value={cedula}
                                        onChange={(e) => setCedula(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {submitResult && !submitResult.success && step === 1 && (
                                <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-xs text-rose-700 dark:text-rose-300 rounded-r border-y border-r border-rose-200 dark:border-rose-800">
                                    <strong className="block mb-1">Autorización Denegada</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-6">
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
                                            <span>Comenzar Reporte</span>
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
                                    cargo={worker?.cargo}
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
                                    <h2 className="text-base font-extrabold text-text-primary leading-tight">¿Qué peligro o riesgo viste?</h2>
                                    <p className="text-[11px] text-text-secondary">Cuéntanos con tus propias palabras o con tu voz</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 pb-2 text-xs">
                                
                                {/* Lugar y Labor */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-teal-600" /> ¿En qué lugar o zona? *
                                        </label>
                                        <input 
                                            type="text" 
                                            list="zonas-sugeridas"
                                            placeholder="Ej: Torre 2 - Piso 4, Bodega, Taller..." 
                                            value={zona} 
                                            onChange={e => setZona(e.target.value)} 
                                            className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2.5 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium" 
                                        />
                                        <datalist id="zonas-sugeridas">
                                            <option value="Torre 2 - Piso 4" />
                                            <option value="Planta Principal" />
                                            <option value="Bodega / Almacén" />
                                            <option value="Taller de Mantenimiento" />
                                            <option value="Fachada Exterior" />
                                            <option value="Área de Vaciado de Concreto" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3 text-teal-600" /> ¿Qué trabajo realizabas? *
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Vaciado de mezcla sobre andamio..." 
                                            value={tarea} 
                                            onChange={e => {
                                                setTarea(e.target.value);
                                                if (!actividad) setActividad(e.target.value);
                                            }} 
                                            className="w-full border border-border-medium rounded-xl text-xs bg-surface-secondary/40 py-2.5 px-3 focus:ring-2 focus:ring-teal-500 text-text-primary font-medium" 
                                        />
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
                                                    <MicOff className="w-3.5 h-3.5 animate-spin" /> Escuchando... (Tocar para parar)
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
                                        placeholder="Ej: La plataforma del andamio no tiene pasadores de seguridad y los tablones se mueven al caminar cargando baldes con mezcla..."
                                        value={peligros}
                                        onChange={e => setPeligros(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Daño o Efectos Posibles con Chips Rápidos */}
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                                        ¿Qué podría pasar si no se controla? (Toca los que apliquen)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {CHIPS_EFECTOS.map(({ label, icon }) => {
                                            const isSelected = efectosPosibles.includes(label);
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => toggleEfectoChip(label)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
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
                                        placeholder="O escribe otros efectos: ej: Caída de altura (piso 4), golpe en la cabeza..." 
                                        value={efectosPosibles} 
                                        onChange={e => setEfectosPosibles(e.target.value)} 
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
                                    <span>Continuar: Protección y Solución</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── STEP 3: PROTECCIÓN Y PROPUESTA DE MEJORA ────────────────── */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="mb-3 flex items-center gap-2.5 text-amber-500 shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-text-primary leading-tight">Protección y Solución</h2>
                                    <p className="text-[11px] text-text-secondary">Tu experiencia es clave para prevenir accidentes</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2 text-xs">
                                
                                {/* Controles Existentes */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                                            ¿Con qué te estás protegiendo hoy en esa labor?
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
                                    <textarea 
                                        rows={3} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 text-text-primary px-3.5 py-2.5 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none leading-relaxed" 
                                        placeholder="Ej: Tengo casco y botas, pero la plataforma de madera está improvisada sin fijación y no hay línea de vida conectada..."
                                        value={controlesExistentes}
                                        onChange={e => setControlesExistentes(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* ¿Son suficientes? */}
                                <div className="p-3.5 bg-surface-secondary/60 rounded-2xl border border-border-medium">
                                    <label className="block text-xs font-bold text-text-primary mb-2">
                                        ¿Consideras que la protección actual es suficiente o segura?
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setSuficientes(true)}
                                            className={`py-2.5 px-3 font-bold text-xs rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                                suficientes 
                                                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 border-teal-600 text-white shadow-md' 
                                                    : 'bg-surface-primary border-border-medium text-text-secondary hover:bg-surface-hover'
                                            }`}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>Sí, es seguro</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setSuficientes(false)}
                                            className={`py-2.5 px-3 font-bold text-xs rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                                !suficientes 
                                                    ? 'bg-gradient-to-r from-rose-500 to-red-600 border-rose-500 text-white shadow-md' 
                                                    : 'bg-surface-primary border-border-medium text-text-secondary hover:bg-surface-hover'
                                            }`}
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>No, falta protección</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Propuesta de Mejora (Campo Humano Directo) */}
                                {!suficientes && (
                                    <div className="space-y-3 p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-2xl animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                                                <Lightbulb className="w-4 h-4 text-amber-500" /> ¿Qué propones para solucionar este peligro?
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
                                        <textarea 
                                            rows={3} 
                                            className="w-full rounded-xl border border-teal-300 dark:border-teal-700 bg-surface-primary text-text-primary px-3.5 py-2.5 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none leading-relaxed focus:ring-2 focus:ring-teal-500" 
                                            placeholder="Ej: Instalar tablones metálicos con pasadores de seguridad, barandas perimetrales y habilitar línea de vida anclada para el arnés..."
                                            value={propuestaMejora}
                                            onChange={e => {
                                                setPropuestaMejora(e.target.value);
                                                if (!sugeridoIngenieria) setSugeridoIngenieria(e.target.value);
                                            }}
                                        ></textarea>
                                        <p className="text-[10.5px] text-teal-700 dark:text-teal-300 flex items-start gap-1">
                                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                                            <span>
                                                El equipo SST y la IA de WAPPY categorizarán tu propuesta en la Matriz Oficial GTC-45 (Ingeniería, Procedimientos y EPP).
                                            </span>
                                        </p>

                                        {/* Acordeón Opcional para Supervisores o Técnicos */}
                                        <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/60">
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedHierarchy(!showAdvancedHierarchy)}
                                                className="w-full flex items-center justify-between text-[11px] font-bold text-text-secondary hover:text-teal-600 transition-colors py-1 cursor-pointer"
                                            >
                                                <span>¿Deseas desglosar por jerarquía técnica GTC-45? (Opcional)</span>
                                                {showAdvancedHierarchy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>

                                            {showAdvancedHierarchy && (
                                                <div className="space-y-2 mt-2 pt-2 border-t border-border-medium animate-in fade-in duration-200">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-text-secondary mb-0.5">1. Eliminación / Sustitución</label>
                                                        <input 
                                                            type="text" 
                                                            value={sugeridoEliminacion} 
                                                            onChange={e => setSugeridoEliminacion(e.target.value)} 
                                                            placeholder="Ej: Reemplazar andamio tubular por andamio certificado multidireccional" 
                                                            className="w-full rounded-lg border border-border-medium px-2.5 py-1.5 text-xs bg-surface-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-text-secondary mb-0.5">2. Controles de Ingeniería</label>
                                                        <input 
                                                            type="text" 
                                                            value={sugeridoIngenieria} 
                                                            onChange={e => setSugeridoIngenieria(e.target.value)} 
                                                            placeholder="Ej: Pasadores de bloqueo, rodapiés y barandas" 
                                                            className="w-full rounded-lg border border-border-medium px-2.5 py-1.5 text-xs bg-surface-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-text-secondary mb-0.5">3. Controles Administrativos</label>
                                                        <input 
                                                            type="text" 
                                                            value={sugeridoAdministrativo} 
                                                            onChange={e => setSugeridoAdministrativo(e.target.value)} 
                                                            placeholder="Ej: Permiso de trabajo en alturas e inspección diaria" 
                                                            className="w-full rounded-lg border border-border-medium px-2.5 py-1.5 text-xs bg-surface-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-text-secondary mb-0.5">4. Elementos de Protección Personal (EPP)</label>
                                                        <input 
                                                            type="text" 
                                                            value={sugeridoEPP} 
                                                            onChange={e => setSugeridoEPP(e.target.value)} 
                                                            placeholder="Ej: Arnés de 4 argollas con eslinga de posicionamiento" 
                                                            className="w-full rounded-lg border border-border-medium px-2.5 py-1.5 text-xs bg-surface-primary"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                        setEfectosPosibles('');
                                        setSeveridadPercibida('Media');
                                        setImages({ foto1: null, foto2: null, foto3: null }); 
                                        setControlesExistentes('');
                                        setSuficientes(false);
                                        setPropuestaMejora('');
                                        setSugeridoEliminacion('');
                                        setSugeridoIngenieria('');
                                        setSugeridoAdministrativo('');
                                        setSugeridoEPP('');
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
