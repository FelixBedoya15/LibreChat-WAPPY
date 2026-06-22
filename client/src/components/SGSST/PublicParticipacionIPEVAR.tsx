import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, AlertTriangle, Camera, UserCircle, Key, Send, CheckCircle, RefreshCcw, X, HardHat, ClipboardList, FileText, Video, Film, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function PublicParticipacionIPEVAR() {
    const { companyId } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    
    // Step 2 Data
    const [tarea, setTarea] = useState('');
    const [peligros, setPeligros] = useState('');
    
    // Step 3 Data
    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });
    const [controlesExistentes, setControlesExistentes] = useState('');
    const [suficientes, setSuficientes] = useState(true);
    
    // Step 4 Data
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
            await axios.post(`/api/public-sgsst/validate-worker/${companyId}`, payload);
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
            alert("Por favor describa la tarea y los peligros.");
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                cedula,
                nombre,
                data: {
                    tarea,
                    peligros,
                    ...images,
                    controlesExistentes,
                    suficientes,
                    sugeridoIngenieria,
                    sugeridoAdministrativo,
                    sugeridoEPP
                }
            };
            const response = await axios.post(`/api/public-sgsst/participacion-ipevar/${companyId}`, payload);
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
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200 p-4 shrink-0">
                <div className="flex items-center gap-3">
                    {company.logo ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-white">
                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#0f766e]/10 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-[#0f766e]" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm text-gray-900 leading-tight truncate">{company.companyName}</h1>
                        <p className="text-xs text-gray-500">Participación Activa IPEVAR</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-5 overflow-y-auto w-full max-w-md mx-auto flex flex-col">
                {/* Step Indicator */}
                {step < 5 && (
                    <div className="flex items-center justify-between mb-8 px-2 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 bg-[#0f766e] -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
                        
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 bg-gray-50 px-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step === s ? 'bg-[#0f766e] text-white shadow-lg shadow-[#0f766e]/30 border-2 border-[#0f766e]' : step > s ? 'bg-[#0f766e]/20 text-[#0f766e] border border-[#0f766e]/30' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wizard Container */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 relative overflow-hidden flex flex-col">
                    
                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-[#0f766e]">
                                <UserCircle className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Participación SST</h2>
                                    <p className="text-xs text-gray-500">Identifícate para iniciar</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                       Nombre Completo
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full border-gray-300 rounded-xl focus:ring-[#0f766e] focus:border-[#0f766e] py-3 bg-gray-50 transition-all font-medium" 
                                        placeholder="Tu nombre completo"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                       <Key className="w-4 h-4 text-[#0f766e]" /> Cédula de Ciudadanía
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full border-gray-300 rounded-xl focus:ring-[#0f766e] focus:border-[#0f766e] py-3 bg-gray-50 transition-all font-medium" 
                                        placeholder="Número de documento"
                                        value={cedula}
                                        onChange={(e) => setCedula(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {submitResult && !submitResult.success && step === 1 && (
                                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 rounded-r border-y border-r border-red-100">
                                    <strong className="block mb-1">Autorización Denegada</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-8">
                                <button 
                                    onClick={validateIdentity}
                                    disabled={isValidatingWorker}
                                    className="w-full bg-[#0f172a] hover:bg-black text-white py-3.5 rounded-xl font-bold tracking-wide shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isValidatingWorker ? 'Validando...' : 'Comenzar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contexto Tarea */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-cyan-600">
                                <ClipboardList className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Labor y Peligros</h2>
                                    <p className="text-xs text-gray-500">¿Qué tarea realizas hoy?</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Labor o Tarea Realizada</label>
                                    <input type="text" placeholder="Ej: Soldadura de tubería, limpieza en altura..." value={tarea} onChange={e=>setTarea(e.target.value)} className="w-full border-gray-300 rounded-xl text-sm bg-gray-50 py-3 focus:ring-cyan-600 focus:border-cyan-600 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Peligros Identificados</label>
                                    <textarea 
                                        rows={4} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm py-3 focus:ring-cyan-600 focus:border-cyan-600 resize-none font-medium leading-relaxed" 
                                        placeholder="Ej: Inhalación de humos metálicos, exposición a radiación, chispas proyectadas..."
                                        value={peligros}
                                        onChange={e=>setPeligros(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Evidencia Fotográfica (Opcional)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {['foto1', 'foto2', 'foto3'].map((imgKey, idx) => (
                                            <div key={imgKey} className="relative w-full h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-cyan-50 hover:border-cyan-400 transition-colors flex items-center justify-center group">
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
                                                            <Camera className="w-5 h-5" />
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
                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">Atrás</button>
                                <button onClick={validateTaskDetails} className="flex-1 bg-[#0f766e] hover:bg-[#115e59] text-white py-3.5 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all">Siguiente</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Controles Actuales */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-amber-500">
                                <Shield className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Controles Actuales</h2>
                                    <p className="text-xs text-gray-500">¿Cómo te proteges hoy?</p>
                                </div>
                            </div>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Controles Existentes en la tarea</label>
                                    <textarea 
                                        rows={4} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm py-3 focus:ring-amber-500 focus:border-amber-500 resize-none font-medium leading-relaxed" 
                                        placeholder="Ej: Uso guantes de carnaza, careta de soldadura y hay un extractor prendido."
                                        value={controlesExistentes}
                                        onChange={e=>setControlesExistentes(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <label className="block text-sm font-bold text-amber-900 mb-3">
                                        ¿Crees que los controles actuales son suficientes para evitar un accidente o enfermedad?
                                    </label>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setSuficientes(true)}
                                            className={`flex-1 py-3 font-bold rounded-lg border transition-all ${suficientes ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Sí, son seguros
                                        </button>
                                        <button 
                                            onClick={() => setSuficientes(false)}
                                            className={`flex-1 py-3 font-bold rounded-lg border transition-all ${!suficientes ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            No, faltan controles
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setStep(2)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200" disabled={isSubmitting}>Atrás</button>
                                <button 
                                    onClick={validateControls} 
                                    disabled={isSubmitting}
                                    className={`flex-1 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all ${suficientes ? 'bg-[#0f766e] hover:bg-[#115e59]' : 'bg-orange-500 hover:bg-orange-600'}`}
                                >
                                    {isSubmitting ? 'Enviando...' : suficientes ? 'Enviar Reporte' : 'Sugerir Controles'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Sugerencias (Opcional, si suficientes = false) */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-indigo-500">
                                <HardHat className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Sugerir Mejoras</h2>
                                    <p className="text-xs text-gray-500">Ayúdanos a protegerte</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 overflow-y-auto pr-2 pb-2 flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Comenta qué sugieres implementar en cada categoría (puedes dejar en blanco las que no apliquen):</p>
                                
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">1. Controles de Ingeniería (Máquinas, equipos)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium" 
                                        placeholder="Ej: Guardas, sensores, ventilación..."
                                        value={sugeridoIngenieria}
                                        onChange={e=>setSugeridoIngenieria(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">2. Administrativos (Señalización, Rotación)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium" 
                                        placeholder="Ej: Capacitación, señalización, rotación..."
                                        value={sugeridoAdministrativo}
                                        onChange={e=>setSugeridoAdministrativo(e.target.value)}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">3. Elementos de Protección Personal (EPP)</label>
                                    <textarea 
                                        rows={2} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium" 
                                        placeholder="Ej: Casco, guantes, protección auditiva..."
                                        value={sugeridoEPP}
                                        onChange={e=>setSugeridoEPP(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {submitResult && !submitResult.success && step === 4 && (
                                <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 rounded-r shrink-0">
                                    <strong className="block mb-1">Error</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-4 flex gap-3 shrink-0">
                                <button onClick={() => setStep(3)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200" disabled={isSubmitting}>Atrás</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center gap-2 hover:opacity-90 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Procesando...' : <><Send className="w-5 h-5" /> Enviar Participación</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success Message */}
                    {step === 5 && (
                        <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-teal-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Gracias por participar!</h2>
                            <p className="text-sm text-gray-600 mb-8 max-w-[250px] mx-auto leading-relaxed">
                                {submitResult?.message} Tu contribución es clave para mantener un ambiente de trabajo seguro.
                            </p>
                            <button 
                                onClick={() => {
                                    setStep(1);
                                    setTarea(''); setPeligros(''); setImages({ foto1: null, foto2: null, foto3: null }); 
                                    setControlesExistentes(''); setSuficientes(true);
                                    setSugeridoIngenieria(''); setSugeridoAdministrativo(''); setSugeridoEPP('');
                                    setSubmitResult(null);
                                }} 
                                className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                                Registrar Nueva Tarea
                            </button>
                        </div>
                    )}

                </div>
            </main>

            {/* Sticky Footer Security Notice */}
            <footer className="shrink-0 p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#0f766e]" /> Módulo SG-SST • Wappy IPEVAR
                </div>
            </footer>
        </div>
    );
}
