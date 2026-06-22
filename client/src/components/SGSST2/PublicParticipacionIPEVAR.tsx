import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Camera,
  UserCircle,
  Key,
  Send,
  CheckCircle,
  RefreshCcw,
  X,
  HardHat,
  ClipboardList,
  FileText,
} from 'lucide-react';
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
    foto3: null,
  });
  const [controlesExistentes, setControlesExistentes] = useState('');
  const [suficientes, setSuficientes] = useState(true);

  // Step 4 Data
  const [sugeridoIngenieria, setSugeridoIngenieria] = useState('');
  const [sugeridoAdministrativo, setSugeridoAdministrativo] = useState('');
  const [sugeridoEPP, setSugeridoEPP] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingWorker, setIsValidatingWorker] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
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
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const resizedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setImages((prev) => ({ ...prev, [field]: resizedImageBase64 }));
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  const removeImage = (field: string) => {
    setImages((prev) => ({ ...prev, [field]: null }));
  };

  const validateIdentity = async () => {
    if (!nombre.trim() || !cedula.trim()) {
      alert('Por favor ingrese su nombre y cédula para continuar.');
      return;
    }

    setIsValidatingWorker(true);
    setSubmitResult(null);

    try {
      const payload = { cedula, nombre };
      await axios.post(`/api/public-sgsst/validate-worker/${companyId}`, payload);
      setStep(2);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        'Error al validar la identidad en la base de datos de la empresa.';
      setSubmitResult({ success: false, message: errorMsg });
    } finally {
      setIsValidatingWorker(false);
    }
  };

  const validateTaskDetails = () => {
    if (!tarea.trim() || !peligros.trim()) {
      alert('Por favor describa la tarea y los peligros.');
      return;
    }
    setStep(3);
  };

  const validateControls = () => {
    if (!controlesExistentes.trim()) {
      alert('Por favor indique los controles existentes.');
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
          ...images,
          controlesExistentes,
          suficientes,
          sugeridoIngenieria,
          sugeridoAdministrativo,
          sugeridoEPP,
        },
      };
      const response = await axios.post(
        `/api/public-sgsst/participacion-ipevar/${companyId}`,
        payload,
      );
      setSubmitResult({ success: true, message: response.data.message });
      setStep(5);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al enviar el reporte.';
      setSubmitResult({ success: false, message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Shield className="mb-4 h-16 w-16 animate-bounce text-[#0f766e]" />
        <h2 className="text-xl font-bold text-gray-800">Cargando Portal SG-SST...</h2>
        <p className="mt-2 text-gray-500">Conectando de forma segura</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Enlace Inválido</h2>
        <p className="mt-2 text-gray-500">
          El código QR escaneado no está asociado a una empresa válida.
        </p>
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f766e]/10">
              <Shield className="h-5 w-5 text-[#0f766e]" />
            </div>
          )}
          <div>
            <h1 className="truncate text-sm font-bold leading-tight text-gray-900">
              {company.companyName}
            </h1>
            <p className="text-xs text-gray-500">Participación Activa IPEVAR</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto p-5">
        {/* Step Indicator */}
        {step < 5 && (
          <div className="relative mb-8 flex items-center justify-between px-2">
            <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 rounded-full bg-gray-200"></div>
            <div
              className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 rounded-full bg-[#0f766e] transition-all duration-300"
              style={{ width: `${(step - 1) * 33.33}%` }}
            ></div>

            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2 bg-gray-50 px-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${step === s ? 'border-2 border-[#0f766e] bg-[#0f766e] text-white shadow-lg shadow-[#0f766e]/30' : step > s ? 'border border-[#0f766e]/30 bg-[#0f766e]/20 text-[#0f766e]' : 'border border-gray-200 bg-white text-gray-400'}`}
                >
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wizard Container */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-[#0f766e]">
                <UserCircle className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black text-gray-900">Participación SST</h2>
                  <p className="text-xs text-gray-500">Identifícate para iniciar</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 font-medium transition-all focus:border-[#0f766e] focus:ring-[#0f766e]"
                    placeholder="Tu nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Key className="h-4 w-4 text-[#0f766e]" /> Cédula de Ciudadanía
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 font-medium transition-all focus:border-[#0f766e] focus:ring-[#0f766e]"
                    placeholder="Número de documento"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
              </div>

              {submitResult && !submitResult.success && step === 1 && (
                <div className="mt-4 rounded-r border-y border-l-4 border-r border-red-100 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                  <strong className="mb-1 block">Autorización Denegada</strong>
                  {submitResult.message}
                </div>
              )}

              <div className="mt-auto pt-8">
                <button
                  onClick={validateIdentity}
                  disabled={isValidatingWorker}
                  className="w-full rounded-xl bg-[#0f172a] py-3.5 font-bold tracking-wide text-white shadow-md transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
                >
                  {isValidatingWorker ? 'Validando...' : 'Comenzar'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contexto Tarea */}
          {step === 2 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-cyan-600">
                <ClipboardList className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Labor y Peligros
                  </h2>
                  <p className="text-xs text-gray-500">¿Qué tarea realizas hoy?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Labor o Tarea Realizada
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Soldadura de tubería, limpieza en altura..."
                    value={tarea}
                    onChange={(e) => setTarea(e.target.value)}
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 text-sm font-medium focus:border-cyan-600 focus:ring-cyan-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Peligros Identificados
                  </label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 py-3 text-sm font-medium leading-relaxed focus:border-cyan-600 focus:ring-cyan-600"
                    placeholder="Ej: Inhalación de humos metálicos, exposición a radiación, chispas proyectadas..."
                    value={peligros}
                    onChange={(e) => setPeligros(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Evidencia Fotográfica (Opcional)
                  </label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {['foto1', 'foto2', 'foto3'].map((imgKey, idx) => (
                      <div
                        key={imgKey}
                        className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-cyan-400 hover:bg-cyan-50"
                      >
                        {images[imgKey] ? (
                          <div className="relative h-full w-full">
                            <img
                              src={images[imgKey] as string}
                              alt={`Evidencia ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(imgKey);
                              }}
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-400 group-hover:text-cyan-600">
                              <Camera className="h-5 w-5" />
                              Foto {idx + 1}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              onChange={(e) => handleImageUpload(e, imgKey)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-auto flex gap-3 pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700 hover:bg-gray-200"
                >
                  Atrás
                </button>
                <button
                  onClick={validateTaskDetails}
                  className="flex-1 rounded-xl bg-[#0f766e] py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#115e59] active:scale-[0.98]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Controles Actuales */}
          {step === 3 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-amber-500">
                <Shield className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Controles Actuales
                  </h2>
                  <p className="text-xs text-gray-500">¿Cómo te proteges hoy?</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Controles Existentes en la tarea
                  </label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 py-3 text-sm font-medium leading-relaxed focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Ej: Uso guantes de carnaza, careta de soldadura y hay un extractor prendido."
                    value={controlesExistentes}
                    onChange={(e) => setControlesExistentes(e.target.value)}
                  ></textarea>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <label className="mb-3 block text-sm font-bold text-amber-900">
                    ¿Crees que los controles actuales son suficientes para evitar un accidente o
                    enfermedad?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSuficientes(true)}
                      className={`flex-1 rounded-lg border py-3 font-bold transition-all ${suficientes ? 'border-amber-500 bg-amber-500 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Sí, son seguros
                    </button>
                    <button
                      onClick={() => setSuficientes(false)}
                      className={`flex-1 rounded-lg border py-3 font-bold transition-all ${!suficientes ? 'border-red-500 bg-red-500 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      No, faltan controles
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700 hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Atrás
                </button>
                <button
                  onClick={validateControls}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl py-3.5 font-bold text-white shadow-md transition-all active:scale-[0.98] ${suficientes ? 'bg-[#0f766e] hover:bg-[#115e59]' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {isSubmitting
                    ? 'Enviando...'
                    : suficientes
                      ? 'Enviar Reporte'
                      : 'Sugerir Controles'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Sugerencias (Opcional, si suficientes = false) */}
          {step === 4 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-indigo-500">
                <HardHat className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Sugerir Mejoras
                  </h2>
                  <p className="text-xs text-gray-500">Ayúdanos a protegerte</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pb-2 pr-2">
                <p className="mb-2 text-xs font-semibold text-gray-600">
                  Comenta qué sugieres implementar en cada categoría (puedes dejar en blanco las que
                  no apliquen):
                </p>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    1. Controles de Ingeniería (Máquinas, equipos)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ej: Guardas, sensores, ventilación..."
                    value={sugeridoIngenieria}
                    onChange={(e) => setSugeridoIngenieria(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    2. Administrativos (Señalización, Rotación)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ej: Capacitación, señalización, rotación..."
                    value={sugeridoAdministrativo}
                    onChange={(e) => setSugeridoAdministrativo(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    3. Elementos de Protección Personal (EPP)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ej: Casco, guantes, protección auditiva..."
                    value={sugeridoEPP}
                    onChange={(e) => setSugeridoEPP(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {submitResult && !submitResult.success && step === 4 && (
                <div className="mt-2 shrink-0 rounded-r border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                  <strong className="mb-1 block">Error</strong>
                  {submitResult.message}
                </div>
              )}

              <div className="mt-auto flex shrink-0 gap-3 pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700 hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Procesando...'
                  ) : (
                    <>
                      <Send className="h-5 w-5" /> Enviar Participación
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success Message */}
          {step === 5 && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center duration-500 animate-in zoom-in-95">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
                <CheckCircle className="h-10 w-10 text-teal-600" />
              </div>
              <h2 className="mb-2 text-2xl font-black text-gray-900">¡Gracias por participar!</h2>
              <p className="mx-auto mb-8 max-w-[250px] text-sm leading-relaxed text-gray-600">
                {submitResult?.message} Tu contribución es clave para mantener un ambiente de
                trabajo seguro.
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  setTarea('');
                  setPeligros('');
                  setImages({ foto1: null, foto2: null, foto3: null });
                  setControlesExistentes('');
                  setSuficientes(true);
                  setSugeridoIngenieria('');
                  setSugeridoAdministrativo('');
                  setSugeridoEPP('');
                  setSubmitResult(null);
                }}
                className="rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-800 hover:bg-gray-200"
              >
                Registrar Nueva Tarea
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer Security Notice */}
      <footer className="shrink-0 p-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <Shield className="h-3 w-3 text-[#0f766e]" /> Módulo SG-SST • Wappy IPEVAR
        </div>
      </footer>
    </div>
  );
}
