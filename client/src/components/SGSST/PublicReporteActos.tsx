import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, AlertTriangle, Camera, UserCircle, Key, Send, CheckCircle, RefreshCcw, X } from 'lucide-react';
import axios from 'axios';

export default function PublicReporteActos() {
    const { companyId } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [hora, setHora] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [foto1, setFoto1] = useState<string | null>(null);
    const [foto2, setFoto2] = useState<string | null>(null);
    const [foto3, setFoto3] = useState<string | null>(null);
    const [foto1Desc, setFoto1Desc] = useState('');
    const [foto2Desc, setFoto2Desc] = useState('');
    const [foto3Desc, setFoto3Desc] = useState('');
    
    // To handle which image is currently being uploaded
    const [activePhotoField, setActivePhotoField] = useState<'foto1'|'foto2'|'foto3'>('foto1');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
             const result = reader.result as string;
             if (activePhotoField === 'foto1') setFoto1(result);
             if (activePhotoField === 'foto2') setFoto2(result);
             if (activePhotoField === 'foto3') setFoto3(result);
        };
        reader.readAsDataURL(file);
    };

    const validateIdentity = () => {
        if (!nombre.trim() || !cedula.trim()) {
            alert("Por favor ingrese su nombre y cédula para continuar.");
            return;
        }
        setStep(2);
    };

    const validateDetails = () => {
        if (!fecha || !hora || !ubicacion.trim() || !descripcion.trim()) {
            alert("Por favor complete todos los datos del hallazgo.");
            return;
        }
        setStep(3);
    };

    const handleSubmit = async () => {
        if (!foto1 && !foto2 && !foto3) {
            const confirmNoPhoto = window.confirm("¿Está seguro de enviar el reporte sin fotografía? (Es altamente recomendable adjuntar evidencia visual).");
            if (!confirmNoPhoto) return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                cedula,
                nombre,
                data: {
                    fecha,
                    hora,
                    ubicacion,
                    descripcion,
                    foto1,
                    foto2,
                    foto3,
                    foto1Desc,
                    foto2Desc,
                    foto3Desc
                }
            };
            const response = await axios.post(`/api/public-sgsst/reporte-acto/${companyId}`, payload);
            setSubmitResult({ success: true, message: response.data.message });
            setStep(4);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Ocurrió un error al procesar el reporte de seguridad.";
            setSubmitResult({ success: false, message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-16 h-16 text-[#10b981] animate-bounce mb-4" />
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
                <p className="text-gray-500 mt-2">El código QR o enlace que escaneó no está asociado a una empresa válida en el sistema gestor.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200 p-4 shrink-0">
                <div className="flex items-center gap-3">
                    {company.logo ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-[#10b981]" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm text-gray-900 leading-tight truncate">{company.companyName}</h1>
                        <p className="text-xs text-gray-500">Canal Confidencial SG-SST</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-5 overflow-y-auto w-full max-w-md mx-auto flex flex-col">
                {/* Step Indicator */}
                {step < 4 && (
                    <div className="flex items-center justify-between mb-8 px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step === s ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30 border-2 border-[#10b981]' : step > s ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wizard Container */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 relative overflow-hidden">
                    
                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-[#10b981]">
                                <UserCircle className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Validar Cédula</h2>
                                    <p className="text-xs text-gray-500">Protocolo de seguridad</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                       Nombre Completo
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full border-gray-300 rounded-xl focus:ring-[#10b981] focus:border-[#10b981] py-3 bg-gray-50 transition-all font-medium" 
                                        placeholder="Ej. Juan Pérez"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                       <Key className="w-4 h-4 text-[#10b981]" /> Cédula de Ciudadanía
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full border-gray-300 rounded-xl focus:ring-[#10b981] focus:border-[#10b981] py-3 bg-gray-50 transition-all font-medium" 
                                        placeholder="Número sin puntos ni comas"
                                        value={cedula}
                                        onChange={(e) => setCedula(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400 mt-2 text-justify leading-relaxed">Sus datos serán validados contra el Perfil Sociodemográfico de la empresa para habilitar el reporte.</p>
                                </div>
                            </div>
                            
                            {submitResult && !submitResult.success && (
                                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 rounded-r border-y border-r border-red-100">
                                    <strong className="block mb-1">Autorización Denegada</strong>
                                    {submitResult.message}
                                </div>
                            )}

                            <div className="mt-auto pt-8">
                                <button 
                                    onClick={validateIdentity}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold tracking-wide shadow-md transition-all active:scale-[0.98]"
                                >
                                    Continuar e Identificarme
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Detalles del Hallazgo */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-orange-500">
                                <AlertTriangle className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Acto / Condición Insegura</h2>
                                    <p className="text-xs text-gray-500">¿Qué observaste de peligro?</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
                                        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm bg-gray-50 py-2.5 focus:ring-orange-500 focus:border-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hora (Aprox)</label>
                                        <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm bg-gray-50 py-2.5 focus:ring-orange-500 focus:border-orange-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ubicación Exacta</label>
                                    <input type="text" placeholder="Ej: Bodega 2, Pasillo A" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm bg-gray-50 py-2.5 focus:ring-orange-500 focus:border-orange-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción Detallada</label>
                                    <textarea 
                                        rows={4} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm py-3 focus:ring-orange-500 focus:border-orange-500 resize-none font-medium leading-relaxed" 
                                        placeholder="Describe el acto o condición insegura con la mayor cantidad de detalles posible..."
                                        value={descripcion}
                                        onChange={e=>setDescripcion(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">Atrás</button>
                                <button onClick={validateDetails} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all">Adjuntar Evidencia</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Evidencia Fotográfica */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-blue-500">
                                <Camera className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Evidencia Visual</h2>
                                    <p className="text-xs text-gray-500">Tomar o subir foto en el sitio</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-4 overflow-y-auto pr-2 pb-4">
                                {[
                                    { id: 'foto1' as const, file: foto1, desc: foto1Desc, setDesc: setFoto1Desc, label: 'Panorámica / Área' },
                                    { id: 'foto2' as const, file: foto2, desc: foto2Desc, setDesc: setFoto2Desc, label: 'Detalle Específico' },
                                    { id: 'foto3' as const, file: foto3, desc: foto3Desc, setDesc: setFoto3Desc, label: 'Contexto Adicional' }
                                ].map((item) => (
                                    <div key={item.id} className="w-full">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase">{item.label}</span>
                                        </div>
                                        {item.file ? (
                                            <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-blue-200 bg-gray-900 flex flex-col items-center">
                                                <img src={item.file} alt="Evidencia" className="h-40 w-full object-cover opacity-80" />
                                                <button 
                                                    onClick={() => {
                                                        if (item.id === 'foto1') setFoto1(null);
                                                        if (item.id === 'foto2') setFoto2(null);
                                                        if (item.id === 'foto3') setFoto3(null);
                                                    }} 
                                                    className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900 to-transparent pt-6 pb-2 px-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.desc} 
                                                        onChange={(e) => item.setDesc(e.target.value)}
                                                        placeholder="Descripción breve..." 
                                                        className="w-full text-xs bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded px-2 py-1 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setActivePhotoField(item.id); fileInputRef.current?.click(); }}
                                                className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors group"
                                            >
                                                <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                                                    <Camera className="w-5 h-5 opacity-70" />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-600">Agregar foto</span>
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                <p className="text-[10px] text-gray-400 text-center mt-2 leading-tight">Podrás subir hasta 3 imágenes en total para brindar mejor contexto visual del hallazgo.</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                                <button onClick={() => setStep(2)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200" disabled={isSubmitting}>Atrás</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center gap-2 hover:opacity-90 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando y Validando...' : <><Send className="w-5 h-5" /> Enviar Reporte</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success Message */}
                    {step === 4 && (
                        <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Reporte Exitoso!</h2>
                            <p className="text-sm text-gray-600 mb-8 max-w-[250px] mx-auto leading-relaxed">
                                {submitResult?.message} Ya se remitió al buzón del Administrador SG-SST. Gracias por tu compromiso con la seguridad corporativa.
                            </p>
                            <button 
                                onClick={() => {
                                    setStep(1);
                                    setDescripcion(''); setUbicacion(''); setFoto1(''); setFoto2(''); setFoto3('');
                                    setFoto1Desc(''); setFoto2Desc(''); setFoto3Desc('');
                                    setSubmitResult(null);
                                }} 
                                className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                                Iniciar un nuevo reporte
                            </button>
                        </div>
                    )}

                </div>
            </main>

            {/* Sticky Footer Security Notice */}
            <footer className="shrink-0 p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#10b981]" /> Protegido por Wappy
                </div>
            </footer>
        </div>
    );
}
