import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, MessageSquare, Camera, UserCircle, Key, Send, CheckCircle, AlertTriangle, X, Video, Film, Loader2, Mic } from 'lucide-react';
import axios from 'axios';

export default function PublicAtelTestimonio() {
    const { companyId } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1);
    
    // Form State
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [cargo, setCargo] = useState('');
    const [testimonio, setTestimonio] = useState('');
    const [foto1, setFoto1] = useState<string | null>(null);
    const [foto2, setFoto2] = useState<string | null>(null);
    const [video, setVideo] = useState<string | null>(null);
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    
    const [activePhotoField, setActivePhotoField] = useState<'foto1'|'foto2'>('foto1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);
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
        };
        reader.readAsDataURL(file);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            alert('El video es demasiado pesado. Máximo 20MB.');
            return;
        }

        setIsVideoUploading(true);
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';

        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            if (videoElement.duration > 10.5) {
                alert('El video excede los 10 segundos permitidos.');
                setIsVideoUploading(false);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                setVideo(readerEvent.target?.result as string);
                setIsVideoUploading(false);
            };
            reader.onerror = () => setIsVideoUploading(false);
            reader.readAsDataURL(file);
        };

        videoElement.onerror = () => {
            alert('Error al procesar el video.');
            setIsVideoUploading(false);
        };

        videoElement.src = URL.createObjectURL(file);
    };

    const removeVideo = () => setVideo(null);

    const validateIdentity = () => {
        if (!nombre.trim() || !cedula.trim()) {
            alert("Por favor ingrese su nombre y cédula para continuar.");
            return;
        }
        setStep(2);
    };

    const validateTestimony = () => {
        if (!testimonio.trim()) {
            alert("Por favor ingrese su testimonio detallado.");
            return;
        }
        setStep(3);
    };

    const handleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
            setIsListening(false);
            setInterimText('');
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Su navegador no soporta reconocimiento de voz. Intente con Chrome.');
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
                    setTestimonio(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + newFinal);
                }
                setInterimText(currentInterim);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech error:', event.error);
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
            alert('Error al iniciar reconocimiento');
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
                    cargo,
                    testimonio,
                    foto1,
                    foto2,
                    video
                }
            };
            const response = await axios.post(`/api/public-sgsst/investigacion-atel/testimonio/${companyId}`, payload);
            setSubmitResult({ success: true, message: response.data.message });
            setStep(4);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Ocurrió un error al enviar el testimonio.";
            setSubmitResult({ success: false, message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-16 h-16 text-teal-500 animate-bounce mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Cargando Portal de Testigos...</h2>
                <p className="text-gray-500 mt-2">Conexión Segura WAPPY</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Enlace Inválido</h2>
                <p className="text-gray-500 mt-2">El código QR o enlace no es válido.</p>
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
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-teal-600" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm text-gray-900 leading-tight truncate">{company.companyName}</h1>
                        <p className="text-xs text-gray-500">Buzón de Testimonios ATEL</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-5 overflow-y-auto w-full max-w-md mx-auto flex flex-col">
                {step < 4 && (
                    <div className="flex items-center justify-between mb-8 px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === s ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : step > s ? 'bg-teal-100 text-teal-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 relative overflow-hidden flex flex-col">
                    
                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-teal-600">
                                <UserCircle className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Identificación</h2>
                                    <p className="text-xs text-gray-500">¿Quién presenta el testimonio?</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre Completo</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl focus:ring-teal-500 py-3 bg-gray-50 font-medium" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><Key className="w-4 h-4 text-teal-600" /> Cédula</label>
                                    <input type="number" className="w-full border-gray-300 rounded-xl focus:ring-teal-500 py-3 bg-gray-50" placeholder="Cédula de ciudadanía" value={cedula} onChange={(e) => setCedula(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Cargo / Relación</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl focus:ring-teal-500 py-3 bg-gray-50" placeholder="Tu cargo en la empresa" value={cargo} onChange={(e) => setCargo(e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-auto pt-8">
                                <button onClick={validateIdentity} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-[0.98]">Continuar</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Testimonio */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-teal-600">
                                <MessageSquare className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Tu Versión</h2>
                                    <p className="text-xs text-gray-500">Describe lo que presenciaste</p>
                                </div>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="relative">
                                    <textarea 
                                        rows={8} 
                                        className="w-full border-gray-300 rounded-xl bg-gray-50 text-sm py-4 focus:ring-teal-500 resize-none font-medium leading-relaxed" 
                                        placeholder="Escribe de forma clara y detallada todo lo que viste, escuchaste o percibiste durante el evento..."
                                        value={testimonio}
                                        onChange={e=>setTestimonio(e.target.value)}
                                    ></textarea>
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        {interimText && <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 animate-pulse max-w-[150px] truncate">{interimText}</span>}
                                        <button 
                                            onClick={handleVoiceInput}
                                            className={`p-2 rounded-full transition-all cursor-pointer shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-100 text-teal-600 hover:bg-teal-200'}`}
                                            title={isListening ? 'Detener dictado' : 'Dictar testimonio'}
                                        >
                                            <Mic className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 italic">Recuerda ser lo más objetivo posible en tu relato.</p>
                            </div>
                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700">Atrás</button>
                                <button onClick={validateTestimony} className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all">Siguiente</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Evidencia */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 text-teal-600">
                                <Camera className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Evidencia Visual</h2>
                                    <p className="text-xs text-gray-500">Fotos o video (Opcional)</p>
                                </div>
                            </div>
                            <div className="space-y-4 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'foto1' as const, file: foto1, label: 'Foto 1' },
                                        { id: 'foto2' as const, file: foto2, label: 'Foto 2' }
                                    ].map((item) => (
                                        <div key={item.id} className="relative aspect-square">
                                            {item.file ? (
                                                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm">
                                                    <img src={item.file} className="w-full h-full object-cover" alt="Evidencia" />
                                                    <button onClick={() => item.id === 'foto1' ? setFoto1(null) : setFoto2(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setActivePhotoField(item.id); fileInputRef.current?.click(); }} className="w-full h-full rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-teal-50 transition-colors">
                                                    <Camera className="w-6 h-6 text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4">
                                    {!video ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                                                {isVideoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                                            </div>
                                            <label className="cursor-pointer bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold">
                                                {isVideoUploading ? 'Procesando...' : 'Grabar Video (Max 10s)'}
                                                <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleVideoUpload} disabled={isVideoUploading} />
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full">
                                            <video src={video} controls className="w-full h-full px-1" />
                                            <button onClick={removeVideo} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"><X className="h-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button onClick={() => setStep(2)} className="px-5 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700">Atrás</button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting ? 'Enviando...' : <><Send className="w-4 h-4" /> Radicar Testimonio</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success Message */}
                    {step === 4 && (
                        <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center h-full text-center p-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Radicación Exitosa!</h2>
                            <p className="text-sm text-gray-600 leading-relaxed mb-8">
                                {submitResult?.message} Tu versión ha sido enviada de forma segura al responsable de la investigación.
                            </p>
                            <button onClick={() => window.location.reload()} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold">Cerrar</button>
                        </div>
                    )}
                </div>
            </main>

            <footer className="p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                    <Shield className="w-3 h-3 text-teal-600" /> Portal Seguro SG-SST
                </div>
            </footer>
        </div>
    );
}
