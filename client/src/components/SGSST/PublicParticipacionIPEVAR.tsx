import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Camera, UserCircle, Key, Send, CheckCircle, RefreshCcw, X, HardHat, ClipboardList, FileText, Video, Film, Loader2, Award, ArrowRight } from 'lucide-react';
import axios from 'axios';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

export default function PublicParticipacionIPEVAR() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State
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
    
    // Step 2 Data
    const [proceso, setProceso] = useState('');
    const [zona, setZona] = useState('');
    const [actividad, setActividad] = useState('');
    const [tarea, setTarea] = useState('');
    const [rutinaria, setRutinaria] = useState<'Sí' | 'No'>('Sí');
    const [peligroClasificacion, setPeligroClasificacion] = useState('Condiciones de Seguridad');
    const [peligros, setPeligros] = useState('');
    const [efectosPosibles, setEfectosPosibles] = useState('');
    const [severidadPercibida, setSeveridadPercibida] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
    
    // Step 3 Data
    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });
    const [controlesExistentes, setControlesExistentes] = useState('');
    const [suficientes, setSuficientes] = useState(true);
    
    // Step 4 Data
    const [sugeridoEliminacion, setSugeridoEliminacion] = useState('');
    const [sugeridoIngenieria, setSugeridoIngenieria] = useState('');
    const [sugeridoAdministrativo, setSugeridoAdministrativo] = useState('');
    const [sugeridoEPP, setSugeridoEPP] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidatingWorker, setIsValidatingWorker] = useState(false);
    const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const validateIdentity = async () => {
        if (!nombre.trim() || !cedula.trim()) {
            alert("Por favor ingrese su nombre y cédula para continuar.");
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

    const validateTaskDetails = () => {
        if (!tarea.trim() || !peligros.trim()) {
            alert("Por favor describa la tarea y los peligros identificados.");
            return;
        }
        setStep(3);
    };

    const validateControls = () => {
        if (!controlesExistentes.trim()) {
            alert("Por favor indique los controles existentes.");
            return;
        }
        if (suficientes) {
            handleSubmit(); // Si son suficientes, no necesita sugerir nada y manda directo.
        } else {
            setStep(4); // Si NO son suficientes, pasa al paso de sugerencias.
        }
    };

    async function handleSubmit() {
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                cedula,
                nombre,
                data: {
                    proceso: proceso.trim() || 'Operativo',
                    zona: zona.trim() || 'Área de trabajo',
                    actividad: actividad.trim() || tarea.trim(),
                    tarea: tarea.trim(),
                    rutinaria,
                    peligroClasificacion,
                    peligros: peligros.trim(),
                    efectosPosibles: efectosPosibles.trim(),
                    severidadPercibida,
                    ...images,
                    controlesExistentes,
                    suficientes,
                    sugeridoEliminacion,
                    sugeridoIngenieria,
                    sugeridoAdministrativo,
                    sugeridoEPP
                }
            };
            const targetCompanyId = company?._id || companyId;
            const response = await axios.post(`/api/public-sgsst/participacion-ipevar/${targetCompanyId}`, payload);
            setSubmitResult({ success: true, message: response.data.message });
            setStep(5);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Ocurrió un error al enviar el reporte.";
            setSubmitResult({ success: false, message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-16 h-16 text-[#0f766e] animate-bounce mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Cargando Portal SG-SST...</h2>
                <p className="text-gray-500 mt-2">Conectando de forma segura</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Enlace Inválido</h2>
                <p className="text-gray-500 mt-2">El código QR escaneado no está asociado a una empresa válida.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-text-primary flex flex-col transition-colors">
            {/* Header Universal */}
            <PublicWorkerHeader
                companyId={companyId || ''}
                companyName={company.companyName}
                companyLogo={company.logo}
                currentModule="ipevar"
                workerCedula={cedula}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full max-w-lg mx-auto flex flex-col">
                {/* Step Indicator */}
                {step < 5 && (
                    <div className="flex items-center justify-between mb-6 px-3 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-medium/60 -z-10 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 bg-teal-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
                        
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${step === s ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 border-2 border-teal-500' : step > s ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-300 dark:border-teal-700' : 'bg-surface-secondary text-text-tertiary border border-border-medium'}`}>
                                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wizard Container */}
                <div className="bg-surface-primary dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-border-medium flex-1 relative overflow-hidden flex flex-col">
                    
                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="flex items-center gap-2 flex-wrap mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-xs">
                                    <Award className="w-3.5 h-3.5" /> +150 pts Pasaporte SST
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-border-medium">
                                    GTC-45 (2ª Act.) • Dec. 1072/15 Art. 2.2.4.6.15
                                </span>
                            </div>

                            <div className="mb-5 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary">Participación IPEVAR</h2>
                                    <p className="text-xs text-text-secondary">Identificación de Peligros y Valoración de Riesgos</p>
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
                                        placeholder="Tu nombre completo"
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
                                    className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isValidatingWorker ? 'Validando...' : 'Comenzar Participación'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contexto Tarea y Peligros GTC-45 */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            {nombre && cedula && (
                                <WorkerSessionBadge
                                    nombre={nombre}
                                    cedula={cedula}
                                    cargo={worker?.cargo}
                                    onClear={() => {
                                        clearSession();
                                        setNombre('');
                                        setCedula('');
                                        setStep(1);
                                    }}
                                    className="mb-3"
                                />
                            )}
                            <div className="mb-4 flex items-center gap-3 text-cyan-600 shrink-0">
                                <ClipboardList className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Labor y Peligros GTC-45</h2>
                                    <p className="text-xs text-gray-500">Describe el puesto, tarea y riesgos observados</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 pb-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Proceso / Área
                                        </label>
                                        <input 
                                            type="text" 
                                            list="procesos-list"
                                            placeholder="Ej: Operativo, Mantenimiento, Logística..." 
                                            value={proceso} 
                                            onChange={e => setProceso(e.target.value)} 
                                            className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2.5 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" 
                                        />
                                        <datalist id="procesos-list">
                                            <option value="Operaciones / Planta" />
                                            <option value="Mantenimiento" />
                                            <option value="Almacén y Bodega" />
                                            <option value="Logística y Transporte" />
                                            <option value="Administración" />
                                            <option value="Servicios Generales" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Zona / Lugar Físico
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Bodega 2, Taller central, Planta..." 
                                            value={zona} 
                                            onChange={e => setZona(e.target.value)} 
                                            className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2.5 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Actividad General
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Mantenimiento electromecánico preventivo..." 
                                            value={actividad} 
                                            onChange={e => setActividad(e.target.value)} 
                                            className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2.5 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            ¿Es Rutinaria?
                                        </label>
                                        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setRutinaria('Sí')}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${rutinaria === 'Sí' ? 'bg-white shadow text-[#0f766e]' : 'text-gray-500'}`}
                                            >
                                                Sí
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRutinaria('No')}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${rutinaria === 'No' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Labor o Tarea Específica <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Cambio de rodamientos y lubricación de poleas en compresor..." 
                                        value={tarea} 
                                        onChange={e => setTarea(e.target.value)} 
                                        className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2.5 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Clasificación Peligro (GTC 45)
                                        </label>
                                        <select
                                            value={peligroClasificacion}
                                            onChange={e => setPeligroClasificacion(e.target.value)}
                                            className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2.5 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium"
                                        >
                                            <option value="Condiciones de Seguridad">Condiciones de Seguridad (Mecánico, Eléctrico, Alturas, Locativo)</option>
                                            <option value="Biomecánico">Biomecánico (Posturas, Cargas, Movimientos Repetitivos)</option>
                                            <option value="Físico">Físico (Ruido, Iluminación, Temperaturas, Vibración)</option>
                                            <option value="Químico">Químico (Gases, Vapores, Polvos, Solventes)</option>
                                            <option value="Psicosocial">Psicosocial (Estrés, Turnos, Sobrecarga mental)</option>
                                            <option value="Biológico">Biológico (Virus, Bacterias, Picaduras, Hongos)</option>
                                            <option value="Fenómenos Naturales">Fenómenos Naturales (Sismos, Precipitaciones)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Severidad / Urgencia Percibida
                                        </label>
                                        <div className="grid grid-cols-4 gap-1">
                                            {(['Baja', 'Media', 'Alta', 'Crítica'] as const).map(sev => (
                                                <button
                                                    key={sev}
                                                    type="button"
                                                    onClick={() => setSeveridadPercibida(sev)}
                                                    className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                                                        severidadPercibida === sev
                                                            ? sev === 'Crítica' ? 'bg-red-600 border-red-600 text-white shadow'
                                                                : sev === 'Alta' ? 'bg-orange-500 border-orange-500 text-white shadow'
                                                                : sev === 'Media' ? 'bg-amber-500 border-amber-500 text-white shadow'
                                                                : 'bg-emerald-600 border-emerald-600 text-white shadow'
                                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {sev}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Descripción del Peligro <span className="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        rows={3} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-xs p-2.5 focus:ring-cyan-600 focus:border-cyan-600 resize-none font-medium leading-relaxed" 
                                        placeholder="Ej: Inhalación de humos, atrapamiento en poleas sin guarda protectora, trabajo sobre escalera inestable..."
                                        value={peligros}
                                        onChange={e => setPeligros(e.target.value)}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Efectos Posibles en la Salud o Daños
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Atrapamiento, heridas lacerantes, lumbalgia, quemaduras..." 
                                        value={efectosPosibles} 
                                        onChange={e => setEfectosPosibles(e.target.value)} 
                                        className="w-full border-gray-300 rounded-xl text-xs bg-gray-50 py-2 px-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Evidencia Fotográfica (Opcional)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['foto1', 'foto2', 'foto3'].map((imgKey, idx) => (
                                            <div key={imgKey} className="relative w-full h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-cyan-50 hover:border-cyan-400 transition-colors flex items-center justify-center group">
                                                {images[imgKey] ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={images[imgKey] as string} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removeImage(imgKey); }} 
                                                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-cyan-600 flex flex-col items-center gap-1">
                                                            <Camera className="w-4 h-4" />
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
                            <div className="mt-auto pt-4 flex gap-3 shrink-0">
                                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-secondary transition-all text-xs">Atrás</button>
                                <button onClick={validateTaskDetails} className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-xs">Siguiente</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Controles Actuales */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-5 flex items-center gap-3 text-amber-500">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary leading-tight">Controles Actuales</h2>
                                    <p className="text-xs text-text-secondary">¿Cómo te proteges hoy en esta labor?</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Controles Existentes en la tarea</label>
                                    <textarea 
                                        rows={4} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none leading-relaxed" 
                                        placeholder="Ej: Uso guantes de carnaza, careta de soldadura y hay un extractor prendido."
                                        value={controlesExistentes}
                                        onChange={e=>setControlesExistentes(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="p-4 bg-surface-secondary/50 dark:bg-slate-800/40 border border-border-medium rounded-2xl">
                                    <label className="block text-xs font-bold text-text-primary mb-2.5">
                                        ¿Crees que los controles actuales son suficientes para evitar un accidente o enfermedad?
                                    </label>
                                    <div className="flex gap-2.5">
                                        <button 
                                            onClick={() => setSuficientes(true)}
                                            className={`flex-1 py-3 font-bold text-xs rounded-xl border transition-all ${suficientes ? 'bg-gradient-to-r from-teal-600 to-emerald-600 border-teal-600 text-white shadow-md' : 'bg-surface-primary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                                        >
                                            Sí, son seguros
                                        </button>
                                        <button 
                                            onClick={() => setSuficientes(false)}
                                            className={`flex-1 py-3 font-bold text-xs rounded-xl border transition-all ${!suficientes ? 'bg-gradient-to-r from-rose-500 to-red-600 border-rose-500 text-white shadow-md' : 'bg-surface-primary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                                        >
                                            No, faltan controles
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setStep(2)} className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-secondary transition-all text-xs" disabled={isSubmitting}>Atrás</button>
                                <button 
                                    onClick={validateControls} 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-xs"
                                >
                                    {isSubmitting ? 'Enviando...' : suficientes ? 'Enviar Reporte' : 'Sugerir Controles'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Sugerencias (Opcional, si suficientes = false) */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-4 flex items-center gap-3 text-indigo-500 shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                    <HardHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary leading-tight">Sugerir Mejoras</h2>
                                    <p className="text-xs text-text-secondary">Jerarquía de Controles GTC-45 (Colombia)</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 overflow-y-auto pr-2 pb-2 flex-1">
                                <p className="text-xs font-semibold text-text-secondary">Comenta qué sugieres implementar en cada nivel según tu experiencia:</p>
                                
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">1. Eliminación / Sustitución (Fuente)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-3 py-2 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none" 
                                        placeholder="Ej: Eliminar el químico inflamable, automatizar labor..."
                                        value={sugeridoEliminacion}
                                        onChange={e=>setSugeridoEliminacion(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">2. Controles de Ingeniería (Máquinas, instalaciones)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-3 py-2 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none" 
                                        placeholder="Ej: Guardas protectoras, sistema de extracción, sensores..."
                                        value={sugeridoIngenieria}
                                        onChange={e=>setSugeridoIngenieria(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">3. Administrativos (Señalización, Rotación, Capacitación)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-3 py-2 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none" 
                                        placeholder="Ej: Capacitación técnica, rotación horaria..."
                                        value={sugeridoAdministrativo}
                                        onChange={e=>setSugeridoAdministrativo(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">4. Elementos de Protección Personal (EPP)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-3 py-2 text-xs transition-all placeholder:text-text-tertiary font-medium resize-none" 
                                        placeholder="Ej: Casco dieléctrico, guantes de nitrilo..."
                                        value={sugeridoEPP}
                                        onChange={e=>setSugeridoEPP(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {submitResult && !submitResult.success && step === 4 && (
                                <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-xs text-rose-700 dark:text-rose-300 rounded-r border-y border-r border-rose-200 dark:border-rose-800 shrink-0">
                                    <strong className="block mb-1">Error</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-4 flex gap-3 shrink-0">
                                <button onClick={() => setStep(3)} className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-secondary transition-all text-xs" disabled={isSubmitting}>Atrás</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Procesando...' : <><Send className="w-4 h-4" /> Enviar Participación</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success Message */}
                    {step === 5 && (
                        <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center h-full text-center py-6">
                            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-950/60 rounded-3xl flex items-center justify-center mb-5 text-teal-600 border border-teal-200 dark:border-teal-800">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-black text-text-primary mb-2">¡Gracias por participar!</h2>
                            <p className="text-xs text-text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
                                {submitResult?.message || 'Tu aporte ha sido registrado formalmente y alimenta la Matriz Oficial de Peligros de la organización.'}
                            </p>
                            <div className="w-full max-w-sm rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-left text-xs text-teal-900 mb-6 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                                <div className="flex items-start gap-2.5">
                                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                                    <div>
                                        <strong className="block text-xs font-bold text-teal-800 dark:text-teal-300">Puntos de Gamificación SST</strong>
                                        <span className="text-[11px]">Tu reporte sumará <strong>+150 puntos</strong> a tu Pasaporte SST una vez validado por el coordinador.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex w-full max-w-sm flex-col gap-2.5">
                                <button
                                    onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 font-bold text-white shadow-md transition-all active:scale-95 hover:from-teal-700 hover:to-emerald-700 text-xs"
                                >
                                    <Award className="h-4 w-4" /> Ver Mi Pasaporte SST y Mis Puntos
                                </button>

                                <button 
                                    onClick={() => {
                                        setStep(1);
                                        setProceso('');
                                        setZona('');
                                        setActividad('');
                                        setTarea('');
                                        setRutinaria('Sí');
                                        setPeligroClasificacion('Condiciones de Seguridad');
                                        setPeligros('');
                                        setEfectosPosibles('');
                                        setSeveridadPercibida('Media');
                                        setImages({ foto1: null, foto2: null, foto3: null }); 
                                        setControlesExistentes('');
                                        setSuficientes(true);
                                        setSugeridoEliminacion('');
                                        setSugeridoIngenieria('');
                                        setSugeridoAdministrativo('');
                                        setSugeridoEPP('');
                                        setSubmitResult(null);
                                    }} 
                                    className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 py-2.5 font-bold text-text-secondary transition-colors hover:bg-surface-hover text-xs"
                                >
                                    Registrar Nueva Tarea
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Footer Unificado WAPPY */}
            <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
                Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
            </footer>
        </div>
    );
}
