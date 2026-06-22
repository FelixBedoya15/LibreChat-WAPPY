import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  MessageSquare,
  Camera,
  UserCircle,
  Key,
  Send,
  CheckCircle,
  AlertTriangle,
  X,
  Mic,
} from 'lucide-react';
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

  const [activePhotoField, setActivePhotoField] = useState<'foto1' | 'foto2'>('foto1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
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

  const validateIdentity = () => {
    if (!nombre.trim() || !cedula.trim()) {
      alert('Por favor ingrese su nombre y cédula para continuar.');
      return;
    }
    if (company?.cargos?.length > 0 && !cargo) {
      alert('Por favor seleccione su cargo antes de continuar.');
      return;
    }
    setStep(2);
  };

  const validateTestimony = () => {
    if (!testimonio.trim()) {
      alert('Por favor ingrese su testimonio detallado.');
      return;
    }
    setStep(3);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
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
          setTestimonio((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + newFinal);
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
        },
      };
      const response = await axios.post(
        `/api/public-sgsst/investigacion-atel/testimonio/${companyId}`,
        payload,
      );
      setSubmitResult({ success: true, message: response.data.message });
      setStep(4);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al enviar el testimonio.';
      setSubmitResult({ success: false, message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Shield className="mb-4 h-16 w-16 animate-bounce text-teal-500" />
        <h2 className="text-xl font-bold text-gray-800">Cargando Portal de Testigos...</h2>
        <p className="mt-2 text-gray-500">Conexión Segura WAPPY</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Enlace Inválido</h2>
        <p className="mt-2 text-gray-500">El código QR o enlace no es válido.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src={company.logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
              <Shield className="h-5 w-5 text-teal-600" />
            </div>
          )}
          <div>
            <h1 className="truncate text-sm font-bold leading-tight text-gray-900">
              {company.companyName}
            </h1>
            <p className="text-xs text-gray-500">Buzón de Testimonios ATEL</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto p-5">
        {step < 4 && (
          <div className="mb-8 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${step === s ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : step > s ? 'bg-teal-100 text-teal-600' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-teal-600">
                <UserCircle className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black text-gray-900">Identificación</h2>
                  <p className="text-xs text-gray-500">¿Quién presenta el testimonio?</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 font-medium focus:ring-teal-500"
                    placeholder="Ej. Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Key className="h-4 w-4 text-teal-600" /> Cédula
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 focus:ring-teal-500"
                    placeholder="Cédula de ciudadanía"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">
                    Cargo / Relación
                  </label>
                  {company.cargos && company.cargos.length > 0 ? (
                    <select
                      className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 font-medium text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                    >
                      <option value="">Selecciona tu cargo...</option>
                      {company.cargos.map((c: string) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 focus:ring-2 focus:ring-teal-500"
                      placeholder="Tu cargo en la empresa"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div className="mt-auto pt-8">
                <button
                  onClick={validateIdentity}
                  className="w-full rounded-xl bg-gray-900 py-3.5 font-bold text-white shadow-md transition-all active:scale-[0.98]"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Testimonio */}
          {step === 2 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-teal-600">
                <MessageSquare className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">Tu Versión</h2>
                  <p className="text-xs text-gray-500">Describe lo que presenciaste</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="relative">
                  <textarea
                    rows={8}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 py-4 text-sm font-medium leading-relaxed focus:ring-teal-500"
                    placeholder="Escribe de forma clara y detallada todo lo que viste, escuchaste o percibiste durante el evento..."
                    value={testimonio}
                    onChange={(e) => setTestimonio(e.target.value)}
                  ></textarea>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {interimText && (
                      <span className="max-w-[150px] animate-pulse truncate rounded-lg border border-teal-100 bg-teal-50 px-2 py-1 text-[10px] text-teal-600">
                        {interimText}
                      </span>
                    )}
                    <button
                      onClick={handleVoiceInput}
                      className={`cursor-pointer rounded-full p-2 shadow-sm transition-all ${isListening ? 'animate-pulse bg-red-500 text-white' : 'bg-teal-100 text-teal-600 hover:bg-teal-200'}`}
                      title={isListening ? 'Detener dictado' : 'Dictar testimonio'}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] italic text-gray-400">
                  Recuerda ser lo más objetivo posible en tu relato.
                </p>
              </div>
              <div className="mt-auto flex gap-3 pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700"
                >
                  Atrás
                </button>
                <button
                  onClick={validateTestimony}
                  className="flex-1 rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-md transition-all active:scale-[0.98]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidencia */}
          {step === 3 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-teal-600">
                <Camera className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Evidencia Visual
                  </h2>
                  <p className="text-xs text-gray-500">Fotos (Opcional)</p>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'foto1' as const, file: foto1, label: 'Foto 1' },
                    { id: 'foto2' as const, file: foto2, label: 'Foto 2' },
                  ].map((item) => (
                    <div key={item.id} className="relative aspect-square">
                      {item.file ? (
                        <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-sm">
                          <img
                            src={item.file}
                            className="h-full w-full object-cover"
                            alt="Evidencia"
                          />
                          <button
                            onClick={() => (item.id === 'foto1' ? setFoto1(null) : setFoto2(null))}
                            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePhotoField(item.id);
                            fileInputRef.current?.click();
                          }}
                          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:bg-teal-50"
                        >
                          <Camera className="h-6 w-6 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Radicar Testimonio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Message */}
          {step === 4 && (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center duration-500 animate-in zoom-in-95">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="mb-2 text-2xl font-black text-gray-900">¡Radicación Exitosa!</h2>
              <p className="mb-8 text-sm leading-relaxed text-gray-600">
                {submitResult?.message} Tu versión ha sido enviada de forma segura al responsable de
                la investigación.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-xl bg-gray-900 py-4 font-bold text-white"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <Shield className="h-3 w-3 text-teal-600" /> Portal Seguro SG-SST
        </div>
      </footer>
    </div>
  );
}
