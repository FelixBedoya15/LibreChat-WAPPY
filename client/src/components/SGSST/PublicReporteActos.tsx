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
  Video,
  Film,
  Loader2,
} from 'lucide-react';
import axios from 'axios';

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
  const { companyId } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [step, setStep] = useState(1);

  // Form State
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
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
      const response = await axios.post(`/api/public-sgsst/reporte-acto/${companyId}`, payload);
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
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src={company.logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10">
              <Shield className="h-5 w-5 text-[#10b981]" />
            </div>
          )}
          <div>
            <h1 className="truncate text-sm font-bold leading-tight text-gray-900">
              {company.companyName}
            </h1>
            <p className="text-xs text-gray-500">Canal Confidencial SG-SST</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto p-5">
        {/* Step Indicator */}
        {step < 4 && (
          <div className="mb-8 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${step === s ? 'border-2 border-[#10b981] bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30' : step > s ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wizard Container */}
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-[#10b981]">
                <UserCircle className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black text-gray-900">Validar Cédula</h2>
                  <p className="text-xs text-gray-500">Protocolo de seguridad</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-sm font-bold text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 font-medium transition-all focus:border-[#10b981] focus:ring-[#10b981]"
                    placeholder="Ej. Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Key className="h-4 w-4 text-[#10b981]" /> Cédula de Ciudadanía
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-3 font-medium transition-all focus:border-[#10b981] focus:ring-[#10b981]"
                    placeholder="Número sin puntos ni comas"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                  {esTercero ? (
                    <p className="mt-2 text-justify text-xs font-semibold leading-relaxed text-blue-600">
                      Reportarás como tercero/visitante. No se requiere estar registrado en el
                      perfil sociodemográfico.
                    </p>
                  ) : (
                    <p className="mt-2 text-justify text-xs leading-relaxed text-gray-400">
                      Sus datos serán validados contra el Perfil Sociodemográfico de la empresa para
                      habilitar el reporte.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all hover:bg-gray-100/50">
                  <input
                    type="checkbox"
                    id="esTercero"
                    checked={esTercero}
                    onChange={(e) => setEsTercero(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#10b981] focus:ring-[#10b981]"
                  />
                  <label
                    htmlFor="esTercero"
                    className="flex-1 cursor-pointer select-none text-xs font-bold leading-tight text-gray-700"
                  >
                    Reportar como tercero (visitante, contratista o cliente)
                  </label>
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
                  className="w-full rounded-xl bg-gray-900 py-3.5 font-bold tracking-wide text-white shadow-md transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
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
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full rounded-xl border-gray-300 bg-gray-50 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Hora (Aprox)
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full rounded-xl border-gray-300 bg-gray-50 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Ubicación Exacta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Bodega 2, Pasillo A"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="w-full rounded-xl border-gray-300 bg-gray-50 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Descripción Detallada
                  </label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-xl border-gray-300 bg-gray-50 py-3 text-sm font-medium leading-relaxed focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Describe el acto o condición insegura con la mayor cantidad de detalles posible..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  ></textarea>
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
                  onClick={validateDetails}
                  className="flex-1 rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98]"
                >
                  Adjuntar Evidencia
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidencia Fotográfica */}
          {step === 3 && (
            <div className="flex h-full flex-col duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 text-blue-500">
                <Camera className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-black leading-tight text-gray-900">
                    Evidencia Visual
                  </h2>
                  <p className="text-xs text-gray-500">Tomar o subir foto en el sitio</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center space-y-4 overflow-y-auto pb-4 pr-2">
                {[
                  {
                    id: 'foto1' as const,
                    file: foto1,
                    desc: foto1Desc,
                    setDesc: setFoto1Desc,
                    label: 'Panorámica / Área',
                  },
                  {
                    id: 'foto2' as const,
                    file: foto2,
                    desc: foto2Desc,
                    setDesc: setFoto2Desc,
                    label: 'Detalle Específico',
                  },
                  {
                    id: 'foto3' as const,
                    file: foto3,
                    desc: foto3Desc,
                    setDesc: setFoto3Desc,
                    label: 'Contexto Adicional',
                  },
                ].map((item) => (
                  <div key={item.id} className="w-full">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-gray-500">
                        {item.label}
                      </span>
                    </div>
                    {item.file ? (
                      <div className="relative flex flex-col items-center overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-gray-900">
                        <img
                          src={item.file}
                          alt="Evidencia"
                          className="h-40 w-full object-cover opacity-80"
                        />
                        <button
                          onClick={() => {
                            if (item.id === 'foto1') setFoto1(null);
                            if (item.id === 'foto2') setFoto2(null);
                            if (item.id === 'foto3') setFoto3(null);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 to-transparent px-2 pb-2 pt-6">
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(e) => item.setDesc(e.target.value)}
                            placeholder="Descripción breve..."
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
                        className="group flex h-24 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
                          <Camera className="h-5 w-5 opacity-70" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-600">
                          Agregar foto
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

                <p className="mt-2 text-center text-[10px] leading-tight text-gray-400">
                  Podrás subir fotos para brindar un reporte completo del hallazgo.
                </p>
              </div>

              {submitResult && !submitResult.success && step === 3 && (
                <div className="mt-4 shrink-0 rounded-r border-y border-l-4 border-r border-red-100 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                  <strong className="mb-1 block">Error al enviar el reporte</strong>
                  {submitResult.message}
                </div>
              )}

              <div className="mt-4 flex shrink-0 gap-3 border-t border-gray-100 pt-4">
                <button
                  onClick={() => {
                    setStep(2);
                    setSubmitResult(null);
                  }}
                  className="rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-700 hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Enviando y Validando...'
                  ) : (
                    <>
                      <Send className="h-5 w-5" /> Enviar Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Message */}
          {step === 4 && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center duration-500 animate-in zoom-in-95">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="mb-2 text-2xl font-black text-gray-900">¡Reporte Exitoso!</h2>
              <p className="mx-auto mb-8 max-w-[250px] text-sm leading-relaxed text-gray-600">
                {submitResult?.message} Ya se remitió al buzón del Administrador SG-SST. Gracias por
                tu compromiso con la seguridad corporativa.
              </p>
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
                className="rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-800 hover:bg-gray-200"
              >
                Iniciar un nuevo reporte
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer Security Notice */}
      <footer className="shrink-0 p-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <Shield className="h-3 w-3 text-[#10b981]" /> Protegido por Wappy
        </div>
      </footer>
    </div>
  );
}
