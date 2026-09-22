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
  RefreshCcw,
  X,
  Video,
  Film,
  Loader2,
  Award,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

const resizeImage = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.7,
): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    };
    reader.readAsDataURL(file);
  });
};

export default function PublicReporteActos() {
  const { companyId } = useParams<{ companyId: string }>();
  const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);
  const navigate = useNavigate();
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
  const [esTercero, setEsTercero] = useState(false);
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
  const [activePhotoField, setActivePhotoField] = useState<'foto1' | 'foto2' | 'foto3'>('foto1');

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBase64 = await resizeImage(file);
      if (activePhotoField === 'foto1') setFoto1(resizedBase64);
      if (activePhotoField === 'foto2') setFoto2(resizedBase64);
      if (activePhotoField === 'foto3') setFoto3(resizedBase64);
    } catch (err) {
      console.error('Error resizing image, falling back to original:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (activePhotoField === 'foto1') setFoto1(result);
        if (activePhotoField === 'foto2') setFoto2(result);
        if (activePhotoField === 'foto3') setFoto3(result);
      };
      reader.readAsDataURL(file);
    }
  };



  const validateIdentity = async () => {
    if (!nombre.trim() || !cedula.trim()) {
      alert('Por favor ingrese su nombre y cédula para continuar.');
      return;
    }

    if (esTercero) {
      setStep(2);
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
          companyName: res.data.companyName,
        }));
      }
      if (!esTercero) {
        saveSession({
          companyId,
          companyName: res.data?.companyName || company?.companyName,
          nombre: nombre.trim(),
          cedula: cedula.trim(),
        });
      }
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

  const validateDetails = () => {
    if (!fecha || !hora || !ubicacion.trim() || !descripcion.trim()) {
      alert('Por favor complete todos los datos del hallazgo.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!foto1 && !foto2 && !foto3) {
      const confirmNoMedia = window.confirm(
        '¿Está seguro de enviar el reporte sin evidencia (fotos)? (Es altamente recomendable adjuntar evidencia visual).',
      );
      if (!confirmNoMedia) return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        cedula,
        nombre,
        esTercero,
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
          foto3Desc,
        },
      };
      const targetCompanyId = company?._id || companyId;
      const response = await axios.post(`/api/public-sgsst/reporte-acto/${targetCompanyId}`, payload);
      setSubmitResult({ success: true, message: response.data.message });
      setStep(4);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || 'Ocurrió un error al procesar el reporte de seguridad.';
      setSubmitResult({ success: false, message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Shield className="mb-4 h-16 w-16 animate-bounce text-[#10b981]" />
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
          El código QR o enlace que escaneó no está asociado a una empresa válida en el sistema
          gestor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans text-text-primary transition-colors">
      {/* Header Universal */}
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={company.companyName}
        companyLogo={company.logo}
        currentModule="reportar"
        workerCedula={cedula}
      />

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        {/* Step Indicator */}
        {step < 4 && (
          <div className="mb-6 flex items-center justify-between px-3 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-medium/60 -z-10 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-0.5 bg-teal-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${(step - 1) * 50}%` }}></div>

            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${step === s ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 border-2 border-teal-500' : step > s ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-300 dark:border-teal-700' : 'bg-surface-secondary text-text-tertiary border border-border-medium'}`}
                >
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wizard Container */}
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-border-medium bg-surface-primary dark:bg-slate-900 p-6 sm:p-7 shadow-xl">
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-xs">
                  <Award className="w-3.5 h-3.5" /> +50 pts Pasaporte SST
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-border-medium">
                  Dec. 1072/15 Art. 2.2.4.6.10 Num. 5 • Res. 0312/19
                </span>
              </div>

              <div className="mb-5 flex items-center gap-3 text-amber-500">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-primary">Reporte de Actos y Condiciones</h2>
                  <p className="text-xs text-text-secondary">Prevención y control de condiciones inseguras</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium"
                    placeholder="Ej. Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                    <Key className="h-4 w-4 text-teal-600" /> Cédula de Ciudadanía
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-text-primary px-4 py-3 text-sm transition-all placeholder:text-text-tertiary font-medium"
                    placeholder="Número sin puntos ni comas"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                  {esTercero ? (
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-teal-600 dark:text-teal-400">
                      Reportarás como tercero/visitante. No se requiere registro previo en el perfil sociodemográfico.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
                      Tus datos serán validados contra el Perfil Sociodemográfico de la empresa para habilitar el reporte y sumar puntos.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border-medium bg-surface-secondary/50 p-3.5 transition-all hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    id="esTercero"
                    checked={esTercero}
                    onChange={(e) => setEsTercero(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-border-medium text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="esTercero"
                    className="flex-1 cursor-pointer select-none text-xs font-bold leading-tight text-text-primary"
                  >
                    Reportar como tercero (visitante, contratista o cliente)
                  </label>
                </div>
              </div>

              {submitResult && !submitResult.success && step === 1 && (
                <div className="mt-4 rounded-r border-y border-l-4 border-r border-rose-200 border-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                  <strong className="mb-1 block">Autorización Denegada</strong>
                  {submitResult.message}
                </div>
              )}

              <div className="mt-auto pt-6">
                <button
                  onClick={validateIdentity}
                  disabled={isValidatingWorker}
                  className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isValidatingWorker
                    ? 'Validando...'
                    : esTercero
                      ? 'Continuar'
                      : 'Continuar e Identificarme'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Detalles del Hallazgo */}
          {step === 2 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              {nombre && cedula && !esTercero && (
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
                  className="mb-4"
                />
              )}
              <div className="mb-6 flex items-center gap-3 text-orange-500">
                <AlertTriangle className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Acto / Condición Insegura
                  </h2>
                  <p className="text-xs text-gray-500">¿Qué observaste de peligro?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 px-4 py-3 text-sm font-medium text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Hora (Aprox)
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 px-4 py-3 text-sm font-medium text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Ubicación Exacta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Bodega 2, Pasillo A"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 px-4 py-3 text-sm font-medium text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Descripción Detallada
                  </label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-border-medium bg-surface-secondary/40 px-4 py-3 text-sm font-medium leading-relaxed text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    placeholder="Describe el acto o condición insegura con la mayor cantidad de detalles posible..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="mt-auto flex gap-3 pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-secondary transition-all text-xs"
                >
                  Atrás
                </button>
                <button
                  onClick={validateDetails}
                  className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all text-xs"
                >
                  Adjuntar Evidencia
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidencia Fotográfica */}
          {step === 3 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-primary leading-tight">
                    Evidencia Visual
                  </h2>
                  <p className="text-xs text-text-secondary">Tomar o subir foto en el sitio</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center space-y-4 overflow-y-auto pb-4 pr-2">
                {[
                  { id: 'foto1' as const, data: foto1, desc: foto1Desc, setDesc: setFoto1Desc },
                  { id: 'foto2' as const, data: foto2, desc: foto2Desc, setDesc: setFoto2Desc },
                  { id: 'foto3' as const, data: foto3, desc: foto3Desc, setDesc: setFoto3Desc },
                ].map((item, idx) => (
                  <div key={item.id} className="relative">
                    {item.data ? (
                      <div className="group relative h-28 w-full overflow-hidden rounded-2xl border border-border-medium">
                        <img
                          src={item.data}
                          alt={`Evidencia ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => {
                            if (item.id === 'foto1') setFoto1(null);
                            if (item.id === 'foto2') setFoto2(null);
                            if (item.id === 'foto3') setFoto3(null);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white shadow-md hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5">
                          <input
                            type="text"
                            placeholder="Comentario breve..."
                            value={item.desc}
                            onChange={(e) => item.setDesc(e.target.value)}
                            className="w-full rounded border border-gray-600 bg-black/50 px-2 py-1 text-xs text-white placeholder-gray-400 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActivePhotoField(item.id);
                          fileInputRef.current?.click();
                        }}
                        className="group flex h-24 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-medium bg-surface-secondary/40 transition-colors hover:border-teal-500 hover:bg-teal-50/20"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-primary shadow-xs transition-transform group-hover:scale-105">
                          <Camera className="h-5 w-5 text-teal-600 opacity-80" />
                        </div>
                        <span className="text-xs font-semibold text-text-secondary group-hover:text-teal-600">
                          Agregar foto {idx + 1}
                        </span>
                      </button>
                    )}
                  </div>
                ))}

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />

                <p className="mt-2 text-center text-[11px] leading-tight text-text-tertiary">
                  Puedes adjuntar fotografías para respaldar la condición reportada.
                </p>
              </div>

              {submitResult && !submitResult.success && step === 3 && (
                <div className="mt-4 shrink-0 rounded-r border-y border-l-4 border-r border-rose-200 border-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                  <strong className="mb-1 block">Error al enviar el reporte</strong>
                  {submitResult.message}
                </div>
              )}

              <div className="mt-4 flex shrink-0 gap-3 border-t border-border-medium/60 pt-4">
                <button
                  onClick={() => {
                    setStep(2);
                    setSubmitResult(null);
                  }}
                  className="px-5 py-3 rounded-2xl font-bold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-secondary transition-all text-xs"
                  disabled={isSubmitting}
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 font-bold text-white shadow-md transition-all hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Enviando y Validando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Enviar Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Message */}
          {step === 4 && (
            <div className="flex h-full flex-col items-center justify-center py-6 text-center duration-500 animate-in zoom-in-95">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 border border-teal-200 dark:border-teal-800">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-black text-text-primary">¡Reporte Exitoso!</h2>
              <p className="mx-auto mb-6 max-w-sm text-xs leading-relaxed text-text-secondary">
                {submitResult?.message || 'Tu reporte ha sido remitido al buzón del Administrador SG-SST. Gracias por tu compromiso con la prevención.'}
              </p>
              <div className="mb-6 w-full max-w-sm rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-left text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                <div className="flex items-start gap-2.5">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  <div>
                    <strong className="block text-xs font-bold text-teal-800 dark:text-teal-300">Puntos de Gamificación SST</strong>
                    <span className="text-[11px]">Tu reporte preventivo sumará <strong>+50 puntos</strong> a tu Pasaporte SST una vez validado por el coordinador.</span>
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
                    setDescripcion('');
                    setUbicacion('');
                    setFoto1('');
                    setFoto2('');
                    setFoto3('');
                    setFoto1Desc('');
                    setFoto2Desc('');
                    setFoto3Desc('');
                    setSubmitResult(null);
                  }}
                  className="w-full rounded-2xl border border-border-medium bg-surface-secondary/40 py-2.5 font-bold text-text-secondary transition-colors hover:bg-surface-hover text-xs"
                >
                  Iniciar un nuevo reporte
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
