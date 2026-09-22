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
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import PublicWorkerHeader from './PublicWorkerHeader';
import { useWorkerSession } from '../../hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

export default function PublicAtelTestimonio() {
  const { companyId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const investigacionId = searchParams.get('investigacionId') || undefined;

  const { session, worker: sessionWorker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

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

  // Auto-populate & auto-advance when worker session is detected
  useEffect(() => {
    if ((sessionWorker || session) && step === 1) {
      const wName = sessionWorker?.nombre || session?.nombre || '';
      const wCed = sessionWorker?.cedula || session?.cedula || '';
      const wCargo = sessionWorker?.cargo || session?.cargo || '';
      if (wName && wCed) {
        setNombre(wName);
        setCedula(wCed);
        if (wCargo) setCargo(wCargo);
        setStep(2);
      }
    }
  }, [sessionWorker, session, step]);

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
    saveSession(cedula.trim(), nombre.trim(), cargo.trim());
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
        investigacionId,
        data: {
          cargo,
          testimonio,
          foto1,
          foto2,
        },
      };
      const targetCompanyId = company?._id || companyId;
      const response = await axios.post(
        `/api/public-sgsst/investigacion-atel/testimonio/${targetCompanyId}`,
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
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans text-text-primary antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Header Unificado WAPPY */}
      <PublicWorkerHeader
        companyName={company.companyName}
        companyLogo={company.logo}
        companyId={company._id || companyId}
        currentModule="atel"
        currentApp="atel"
        title="Buzón de Testimonios ATEL"
        subtitle="Declaración confidencial en investigación de incidentes y accidentes"
      />

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto p-5">
        {step < 4 && (
          <div className="mb-6 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    step === s
                      ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-600/30'
                      : step > s
                      ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                      : 'bg-surface-tertiary text-text-tertiary'
                  }`}
                >
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md">
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <Sparkles className="w-3.5 h-3.5" /> +30 pts Pasaporte SST
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Res. 1401 de 2007 • Dec. 1072/15 Art. 2.2.4.6.32
                </span>
              </div>

              <div className="mb-6 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <UserCircle className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black text-text-primary">Identificación</h2>
                  <p className="text-xs text-text-secondary">¿Quién presenta el testimonio?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary px-3.5 py-3 text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm font-medium transition-all"
                    placeholder="Ej. Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <Key className="h-3.5 w-3.5 text-teal-600" /> Cédula de Ciudadanía
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary px-3.5 py-3 text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all"
                    placeholder="Número de cédula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Cargo / Relación con el Evento
                  </label>
                  {company.cargos && company.cargos.length > 0 ? (
                    <select
                      className="w-full appearance-none rounded-2xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary px-3.5 py-3 text-text-primary font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all"
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
                      className="w-full rounded-2xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary px-3.5 py-3 text-text-primary font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all"
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
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Testimonio */}
          {step === 2 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              {/* Worker Session Badge */}
              {cedula && nombre && (
                <WorkerSessionBadge
                  nombre={nombre}
                  cedula={cedula}
                  cargo={cargo}
                  onClear={() => {
                    clearSession();
                    setNombre('');
                    setCedula('');
                    setCargo('');
                    setStep(1);
                  }}
                  className="mb-4"
                />
              )}

              <div className="mb-6 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <MessageSquare className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-text-primary">Tu Versión</h2>
                  <p className="text-xs text-text-secondary">Describe lo que presenciaste</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="relative">
                  <textarea
                    rows={8}
                    className="w-full resize-none rounded-2xl border border-border-light dark:border-border-medium bg-surface-primary dark:bg-surface-secondary px-3.5 py-3.5 text-text-primary text-sm font-medium leading-relaxed focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    placeholder="Escribe de forma clara y detallada todo lo que viste, escuchaste o percibiste durante el evento..."
                    value={testimonio}
                    onChange={(e) => setTestimonio(e.target.value)}
                  ></textarea>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {interimText && (
                      <span className="max-w-[150px] animate-pulse truncate rounded-lg border border-teal-200 bg-teal-50 dark:bg-teal-950/40 px-2 py-1 text-[10px] text-teal-600 dark:text-teal-300">
                        {interimText}
                      </span>
                    )}
                    <button
                      onClick={handleVoiceInput}
                      className={`cursor-pointer rounded-full p-2.5 shadow-sm transition-all ${isListening ? 'animate-pulse bg-rose-500 text-white' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-200'}`}
                      title={isListening ? 'Detener dictado' : 'Dictar testimonio'}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] italic text-text-tertiary">
                  Recuerda ser lo más objetivo posible en tu relato. La información es protegida bajo reserva.
                </p>
              </div>
              <div className="mt-auto flex gap-3 pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-2xl border border-border-medium bg-surface-secondary px-5 py-3.5 font-bold text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={validateTestimony}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidencia */}
          {step === 3 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <Camera className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-text-primary">
                    Evidencia Visual
                  </h2>
                  <p className="text-xs text-text-secondary">Fotos (Opcional)</p>
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
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePhotoField(item.id);
                            fileInputRef.current?.click();
                          }}
                          className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border-medium hover:border-teal-500 bg-surface-secondary/40 hover:bg-surface-hover transition-colors"
                        >
                          <Camera className="h-6 w-6 text-text-tertiary" />
                          <span className="text-[10px] font-bold text-text-secondary">{item.label}</span>
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
                  className="rounded-2xl border border-border-medium bg-surface-secondary px-5 py-3.5 font-bold text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
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
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="mb-2 text-2xl font-black text-text-primary">¡Radicación Exitosa!</h2>
              <p className="mb-5 text-sm leading-relaxed text-text-secondary">
                {submitResult?.message || 'Tu versión ha sido enviada de forma segura al equipo de investigación.'}
              </p>

              <div className="mb-6 w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-left space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">🎯</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">¡+30 Puntos Acreditados a tu Pasaporte SST!</h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">Tu colaboración en la investigación previene la repetición de incidentes laborales.</p>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2.5">
                <a
                  href={`/sgsst-public/colaborador/${company?._id || companyId}/${cedula.trim() || ''}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Ver Mi Pasaporte SST</span>
                  <span>→</span>
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-2xl border border-border-medium py-3 text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Unificado */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
