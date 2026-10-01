import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ClipboardCheck,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Send,
  Loader2,
  PenTool,
  Check,
  Eye,
  FileText,
  Flame,
  Zap,
  Sparkles,
  Award,
  Layers,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  History,
  Info,
} from 'lucide-react';
import axios from 'axios';
import { PublicWorkerHeader } from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import { SignaturePad } from './SignaturePad';

// Helper de compresión y redimensionamiento de fotos para carga rápida en móviles
const resizeImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
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
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
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

// Plantillas temáticas preconfiguradas con ítems clave para inspección ágil
const PLANTILLAS_TEMATICAS: Record<string, { label: string; icon: string; items: string[] }> = {
  equipos_emergencia: {
    label: 'Equipos de Emergencia',
    icon: '🧯',
    items: [
      'Extintores presurizados, con manómetro en verde y señalización visible',
      'Extintores con fecha de recarga y prueba hidrostática vigentes',
      'Botiquín de primeros auxilios dotado y sin medicamentos vencidos',
      'Camilla rígida, inmovilizador cervical y arnés de fijación despejados',
      'Rutas de evacuación y salidas de emergencia 100% libres de obstáculos',
      'Luces de emergencia operativas y señalización reflectiva en buen estado',
    ],
  },
  locativa_orden_aseo: {
    label: 'Orden, Aseo y Locativa (5S)',
    icon: '🧹',
    items: [
      'Pisos limpios, secos, sin grasa y con material antideslizante en escaleras',
      'Pasillos de tránsito peatonal demarcados y con ancho suficiente',
      'Techos, cubiertas y canaletas sin goteras, fisuras ni desprendimientos',
      'Iluminación general y focalizada suficiente, sin bombillas quemadas',
      'Almacenamiento de materiales ordenado y con alturas seguras',
      'Puntos ecológicos y canecas de residuos debidamente rotuladas',
    ],
  },
  riesgo_electrico: {
    label: 'Riesgo Eléctrico',
    icon: '⚡',
    items: [
      'Tableros eléctricos señalizados con peligro eléctrico y cerrados con llave',
      'Tableros con diagrama unifilar e identificación de breakers/circuitos',
      'Tomas y enchufes firmes, sin recalentamiento ni cables a la vista',
      'Cables canalizados correctamente, sin empalmes artesanales expuestos',
      'Distancia de seguridad mínima de 1 metro frente a tableros y subestaciones',
    ],
  },
  puestos_ergonomia: {
    label: 'Puestos de Trabajo & Ergonomía',
    icon: '🪑',
    items: [
      'Sillas ergonómicas con ajuste de altura, espaldar y soporte lumbar funcional',
      'Pantallas ubicadas a la altura de la vista (distancia de 45-70 cm)',
      'Espacio inferior libre bajo el escritorio para movilidad de piernas',
      'Teclado y ratón ubicados al mismo nivel, permitiendo descanso de muñecas',
      'Condiciones ambientales confortables (ventilación, ruido y temperatura)',
    ],
  },
  epp_comportamiento: {
    label: 'EPP & Conductas Seguras',
    icon: '🦺',
    items: [
      'Trabajadores portan la dotación y EPP reglamentarios para su labor',
      'Elementos de protección limpios, en buen estado y bien almacenados',
      'Respeto de normas de seguridad, velocidades y no uso de celular en zonas operativas',
      'Disponibilidad de agua potable y áreas adecuadas para hidratación',
    ],
  },
  maquinaria_herramientas: {
    label: 'Maquinaria & Herramientas',
    icon: '⚙️',
    items: [
      'Guardas de seguridad y protecciones en partes móviles o cortantes operativas',
      'Botones de parada de emergencia (setas rojas) accesibles y funcionales',
      'Herramientas manuales sin mangos astillados, rebabas ni deformaciones',
      'Herramientas eléctricas con doble aislamiento y cables sin daños',
      'Fichas técnicas y manuales de operación visibles en el puesto',
    ],
  },
  ronda_abierta: {
    label: 'Ronda Abierta General COPASST',
    icon: '📝',
    items: [
      'Condiciones generales de seguridad en el entorno de trabajo',
      'Identificación de actos subestándar observados en trabajadores',
      'Identificación de condiciones subestándar en instalaciones o equipos',
      'Interacción con trabajadores para recibir sugerencias y reportes de seguridad',
    ],
  },
};

interface HallazgoItem {
  id: string;
  titulo: string;
  descripcion: string;
  criticidad: 'bajo' | 'medio' | 'alto' | 'critico';
  clasificacionPeligro: string;
  fotoEvidencia: string | null;
  medidaSugerida: string;
  responsableAccion: string;
}

export default function PublicInspeccionesCopasst() {
  const { companyId, cedula: urlCedula } = useParams<{ companyId: string; cedula?: string }>();
  const navigate = useNavigate();
  const { worker, isAuthenticated } = useWorkerSession(companyId);

  // Estados de datos
  const [loadingContext, setLoadingContext] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [miembrosComite, setMiembrosComite] = useState<any[]>([]);
  const [inspeccionesRecientes, setInspeccionesRecientes] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Stepper: 1: Configurar Ronda, 2: Hallazgos & Checklist, 3: Resumen & Firmas, 4: Éxito
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State: Configuración
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );
  const [sede, setSede] = useState('Sede Principal');
  const [area, setArea] = useState('');
  const [tipoInspeccion, setTipoInspeccion] = useState<string>('locativa_orden_aseo');
  const [modo, setModo] = useState<'fotografico_rapido' | 'checklist_tematico'>('fotografico_rapido');

  // Inspector State
  const [inspectorNombre, setInspectorNombre] = useState('');
  const [inspectorCedula, setInspectorCedula] = useState(urlCedula || '');
  const [inspectorCargo, setInspectorCargo] = useState('');
  const [inspectorRol, setInspectorRol] = useState('Miembro COPASST');
  const [inspectorFirma, setInspectorFirma] = useState<string | null>(null);

  // Acompañante y Responsable
  const [acompananteNombre, setAcompananteNombre] = useState('');
  const [responsableAreaNombre, setResponsableAreaNombre] = useState('');
  const [responsableAreaFirma, setResponsableAreaFirma] = useState<string | null>(null);

  // Hallazgos State
  const [hallazgos, setHallazgos] = useState<HallazgoItem[]>([]);
  const [activePhotoUploadIndex, setActivePhotoUploadIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checklist Items State
  const [checklistResponses, setChecklistResponses] = useState<
    Record<string, { estado: 'cumple' | 'no_cumple' | 'no_aplica'; observacion: string; foto: string | null }>
  >({});

  // Evaluación General
  const [semaforoGeneral, setSemaforoGeneral] = useState<'seguro' | 'atencion' | 'critico'>('seguro');
  const [conclusiones, setConclusiones] = useState('');

  // Modales de Firma
  const [isSignInspectorOpen, setIsSignInspectorOpen] = useState(false);
  const [isSignResponsableOpen, setIsSignResponsableOpen] = useState(false);

  // Estado de Envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedConsecutivo, setSubmittedConsecutivo] = useState('');

  // Cargar contexto inicial
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await axios.get(
          `/api/public-sgsst/copasst-inspecciones/${companyId}${urlCedula ? `?cedula=${urlCedula}` : ''}`
        );
        if (res.data?.company) {
          setCompanyData(res.data.company);
          if (res.data.company.sedes?.length) setSede(res.data.company.sedes[0]);
          if (res.data.company.areas?.length) setArea(res.data.company.areas[0]);
        }
        if (Array.isArray(res.data?.miembrosComite)) {
          setMiembrosComite(res.data.miembrosComite);
        }
        if (Array.isArray(res.data?.recientes)) {
          setInspeccionesRecientes(res.data.recientes);
        }
      } catch (err) {
        console.error('Error loading inspection context:', err);
      } finally {
        setLoadingContext(false);
      }
    };
    fetchContext();
  }, [companyId, urlCedula]);

  // Si el trabajador está logueado en la sesión pública, auto-rellenar inspector
  useEffect(() => {
    if (isAuthenticated && worker) {
      setInspectorNombre(worker.nombre || '');
      setInspectorCedula(worker.cedula || '');
      setInspectorCargo(worker.cargo || 'Miembro del Comité');
    }
  }, [isAuthenticated, worker]);

  // Si cambia el tipo de inspección, inicializar respuestas del checklist
  useEffect(() => {
    const plantilla = PLANTILLAS_TEMATICAS[tipoInspeccion];
    if (plantilla) {
      const initialMap: Record<
        string,
        { estado: 'cumple' | 'no_cumple' | 'no_aplica'; observacion: string; foto: string | null }
      > = {};
      plantilla.items.forEach((it) => {
        initialMap[it] = { estado: 'cumple', observacion: '', foto: null };
      });
      setChecklistResponses(initialMap);
    }
  }, [tipoInspeccion]);

  // Manejador para agregar un hallazgo nuevo
  const handleAddHallazgo = () => {
    const nuevo: HallazgoItem = {
      id: Math.random().toString(36).substring(2, 9),
      titulo: `Hallazgo #${hallazgos.length + 1}`,
      descripcion: '',
      criticidad: 'medio',
      clasificacionPeligro: 'Locativo',
      fotoEvidencia: null,
      medidaSugerida: '',
      responsableAccion: '',
    };
    setHallazgos([...hallazgos, nuevo]);
  };

  const handleUpdateHallazgo = (index: number, field: keyof HallazgoItem, value: any) => {
    const updated = [...hallazgos];
    updated[index] = { ...updated[index], [field]: value };
    setHallazgos(updated);
  };

  const handleRemoveHallazgo = (index: number) => {
    setHallazgos(hallazgos.filter((_, i) => i !== index));
  };

  // Subida de imagen
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activePhotoUploadIndex === null) return;
    try {
      const base64 = await resizeImage(file);
      handleUpdateHallazgo(activePhotoUploadIndex, 'fotoEvidencia', base64);
    } catch (err) {
      console.error('Error processing photo:', err);
    } finally {
      setActivePhotoUploadIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Validaciones antes de avanzar
  const handleNextStep1 = () => {
    if (!inspectorNombre.trim() || !inspectorCedula.trim()) {
      alert('Por favor ingrese el nombre y cédula del inspector del COPASST.');
      return;
    }
    if (!area.trim()) {
      alert('Por favor especifique o seleccione el área a inspeccionar.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    // Si eligió modo checklist, convertir automáticamente los ítems que NO CUMPLEN a hallazgos
    if (modo === 'checklist_tematico') {
      const failedItems = Object.entries(checklistResponses).filter(([_, val]) => val.estado === 'no_cumple');
      if (failedItems.length > 0 && hallazgos.length === 0) {
        const nuevosHallazgos: HallazgoItem[] = failedItems.map(([itemText, val], idx) => ({
          id: Math.random().toString(36).substring(2, 9),
          titulo: `Punto No Cumplido #${idx + 1}`,
          descripcion: val.observacion || itemText,
          criticidad: 'medio',
          clasificacionPeligro: 'Locativo',
          fotoEvidencia: val.foto,
          medidaSugerida: 'Subsanar condición detectada en la lista de chequeo',
          responsableAccion: '',
        }));
        setHallazgos(nuevosHallazgos);
      }
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Envío final
  const handleSubmit = async () => {
    if (!inspectorFirma) {
      const proceedWithoutSig = window.confirm(
        '¿Desea radicar la inspección sin la firma digital del inspector? (Se recomienda estampar la firma para validez reglamentaria).'
      );
      if (!proceedWithoutSig) return;
    }

    setIsSubmitting(true);
    try {
      const plantillaMeta = PLANTILLAS_TEMATICAS[tipoInspeccion];
      const checklistArray = Object.entries(checklistResponses).map(([it, val]) => ({
        item: it,
        estado: val.estado,
        observacion: val.observacion,
        foto: val.foto,
      }));

      const payload = {
        fecha,
        hora,
        sede,
        area,
        tipoInspeccion,
        tipoLabel: plantillaMeta?.label || 'Inspección de Seguridad',
        modo,
        inspector: {
          nombre: inspectorNombre.trim(),
          cedula: inspectorCedula.trim(),
          cargo: inspectorCargo.trim(),
          rolComite: inspectorRol,
          firma: inspectorFirma,
        },
        acompanantes: acompananteNombre.trim() ? [{ nombre: acompananteNombre.trim(), cargo: '' }] : [],
        responsableArea: {
          nombre: responsableAreaNombre.trim(),
          cargo: '',
          firma: responsableAreaFirma,
        },
        hallazgos,
        checklistItems: modo === 'checklist_tematico' ? checklistArray : [],
        semaforoGeneral,
        conclusiones: conclusiones.trim(),
      };

      const res = await axios.post(`/api/public-sgsst/copasst-inspeccion/${companyId}`, payload);
      setSubmittedConsecutivo(res.data?.consecutivo || 'INSP-COPASST-REGISTRADA');
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting inspection:', err);
      alert(err.response?.data?.error || 'Error al radicar la inspección. Verifique los datos e intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingContext) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <Shield className="w-16 h-16 text-teal-600 animate-pulse" />
          <ClipboardCheck className="w-8 h-8 text-teal-500 absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          Cargando Aplicativo de Inspecciones COPASST...
        </h2>
        <p className="text-sm text-slate-500 mt-2">Conectando de forma segura con el SG-SST</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col">
      {/* Header Público con navegación */}
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={companyData?.companyName || 'Somos SST'}
        companyLogo={companyData?.logo}
        currentModule="comites"
        title="Inspecciones de Seguridad COPASST"
        subtitle="Rondas preventivas ágiles para miembros de comité y vigías"
        workerCedula={inspectorCedula}
      />

      {/* Input oculto para carga de fotos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* Banner Superior con Puntos y Botón de Historial */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Res. 2013/1986 · Dec. 1072/2015
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Award className="w-3 h-3" /> +50 pts Bioindividuo
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Ronda de Inspección de Seguridad
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 transition-all active:scale-95"
            >
              <History className="w-3.5 h-3.5 text-teal-600" />
              {showHistory ? 'Ocultar Historial' : `Historial (${inspeccionesRecientes.length})`}
            </button>
          </div>
        </div>

        {/* Acordeón de Historial de Inspecciones Recientes */}
        {showHistory && (
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-900/50 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Inspecciones Recientes en {companyData?.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cerrar ✕
              </button>
            </div>
            {inspeccionesRecientes.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Aún no hay inspecciones radicadas recientemente. ¡Sé el primero en completar una ronda!
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {inspeccionesRecientes.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-xs flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{r.consecutivo}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.semaforoGeneral === 'seguro'
                              ? 'bg-emerald-100 text-emerald-700'
                              : r.semaforoGeneral === 'critico'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.semaforoGeneral === 'seguro' ? '🟢 Seguro' : r.semaforoGeneral === 'critico' ? '🔴 Crítico' : '🟡 Atención'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">
                        {r.area} · <span className="font-normal text-slate-500">{r.sede}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{r.tipoLabel}</div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-zinc-700/50 pt-1.5">
                      <span>👤 {r.inspector?.nombre || 'Inspector'}</span>
                      <span>{new Date(r.fecha).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stepper Visual (Pasos) */}
        {step < 4 && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {[
              { num: 1, label: '1. Configuración', desc: 'Inspector y Zona' },
              { num: 2, label: '2. Hallazgos', desc: 'Fotos y Evidencias' },
              { num: 3, label: '3. Firmas', desc: 'Validación Oficial' },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < step) setStep(s.num as any);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  step === s.num
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                    : step > s.num
                    ? 'bg-white dark:bg-zinc-900 border-emerald-400 text-emerald-600 dark:text-emerald-400 cursor-pointer'
                    : 'bg-white/60 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold">{s.label}</div>
                <div className="hidden sm:block text-[10px] opacity-75 truncate">{s.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── PASO 1: CONFIGURACIÓN DE LA RONDA ─── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tarjeta de Datos del Inspector */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                Miembro del COPASST / Vigía Inspector
              </h2>

              {/* Selector si hay miembros precargados del comité */}
              {miembrosComite.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Seleccionar Miembro del Comité Registrado (Opcional):
                  </label>
                  <select
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onChange={(e) => {
                      const sel = miembrosComite.find((m) => m.cedula === e.target.value);
                      if (sel) {
                        setInspectorNombre(sel.nombre);
                        setInspectorCedula(sel.cedula);
                        setInspectorCargo(sel.cargo || 'Miembro del Comité');
                        setInspectorRol(sel.rolComite || 'Miembro COPASST');
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      -- Seleccionar o escribir manualmente abajo --
                    </option>
                    {miembrosComite.map((m, idx) => (
                      <option key={idx} value={m.cedula}>
                        {m.nombre} - CC: {m.cedula} ({m.rolComite})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Nombre Completo del Inspector *
                  </label>
                  <input
                    type="text"
                    value={inspectorNombre}
                    onChange={(e) => setInspectorNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez Gómez"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Número de Cédula *
                  </label>
                  <input
                    type="text"
                    value={inspectorCedula}
                    onChange={(e) => setInspectorCedula(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Cargo en la Empresa
                  </label>
                  <input
                    type="text"
                    value={inspectorCargo}
                    onChange={(e) => setInspectorCargo(e.target.value)}
                    placeholder="Ej. Operario Líder / Asistente OHS"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Rol en el Comité
                  </label>
                  <select
                    value={inspectorRol}
                    onChange={(e) => setInspectorRol(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Presidente COPASST">Presidente COPASST</option>
                    <option value="Secretario COPASST">Secretario COPASST</option>
                    <option value="Principal COPASST">Representante Principal COPASST</option>
                    <option value="Suplente COPASST">Representante Suplente COPASST</option>
                    <option value="Vigía de SST">Vigía de SST</option>
                    <option value="Miembro COPASST">Miembro COPASST</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tarjeta de Ubicación y Fecha */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                Lugar, Fecha y Horario de la Ronda
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Sede / Centro de Trabajo
                  </label>
                  {companyData?.sedes?.length > 1 ? (
                    <select
                      value={sede}
                      onChange={(e) => setSede(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {companyData.sedes.map((s: string, idx: number) => (
                        <option key={idx} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={sede}
                      onChange={(e) => setSede(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Área o Zona a Inspeccionar *
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Almacén Central / Taller de Corte"
                    list="areas-sugeridas"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="areas-sugeridas">
                    {(companyData?.areas || []).map((a: string, idx: number) => (
                      <option key={idx} value={a} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Fecha de la Inspección
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="text"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    placeholder="Ej. 09:30 AM"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Selector de Enfoque / Plantilla Temática */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Enfoque Temático de la Inspección
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Selecciona la temática principal para adaptar los puntos clave de verificación:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(PLANTILLAS_TEMATICAS).map(([key, item]) => {
                  const isSelected = tipoInspeccion === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipoInspeccion(key)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700/80 hover:bg-slate-100 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selector de Modo de Inspección */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                  ¿Cómo prefieres registrar la inspección?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setModo('fotografico_rapido')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      modo === 'fotografico_rapido'
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                    }`}
                  >
                    <Camera className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Ronda Fotográfica Ágil (Recomendado)</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        Camina por la zona y agrega fotos de hallazgos puntuales con semáforo de riesgo de 1 toque.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setModo('checklist_tematico')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      modo === 'checklist_tematico'
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Micro-Checklist Guiado</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        Lista de 5-6 preguntas clave del tema con botones Cumple / No Cumple.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Siguiente */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNextStep1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md transition-all active:scale-95"
              >
                <span>Continuar a Hallazgos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 2: HALLAZGOS Y EVIDENCIAS FOTOGRÁFICAS ─── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header del Paso 2 con Resumen Rápido */}
            <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">{PLANTILLAS_TEMATICAS[tipoInspeccion]?.icon}</span>
                <div>
                  <span className="font-bold text-teal-900 dark:text-teal-200">
                    {PLANTILLAS_TEMATICAS[tipoInspeccion]?.label}
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400 ml-2">
                    · Área: <strong>{area}</strong> ({sede})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-teal-700 dark:text-teal-300 font-bold hover:underline"
              >
                Cambiar ✎
              </button>
            </div>

            {/* SECCIÓN MODO CHECKLIST TEMÁTICO */}
            {modo === 'checklist_tematico' && (
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-teal-600" />
                    Puntos Clave de Verificación ({PLANTILLAS_TEMATICAS[tipoInspeccion]?.label})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Marca cada ítem con un toque. Si marcas <strong>No Cumple</strong>, podrás añadir foto y observación:
                  </p>
                </div>

                <div className="space-y-3">
                  {PLANTILLAS_TEMATICAS[tipoInspeccion]?.items.map((itemText, idx) => {
                    const resp = checklistResponses[itemText] || {
                      estado: 'cumple',
                      observacion: '',
                      foto: null,
                    };
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          resp.estado === 'cumple'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            : resp.estado === 'no_cumple'
                            ? 'bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-900'
                            : 'bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex-1">
                            {idx + 1}. {itemText}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setChecklistResponses({
                                  ...checklistResponses,
                                  [itemText]: { ...resp, estado: 'cumple' },
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                resp.estado === 'cumple'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-slate-600 hover:bg-emerald-50 border border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              ✓ Cumple
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChecklistResponses({
                                  ...checklistResponses,
                                  [itemText]: { ...resp, estado: 'no_cumple' },
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                resp.estado === 'no_cumple'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-slate-600 hover:bg-red-50 border border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              ✗ No Cumple
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChecklistResponses({
                                  ...checklistResponses,
                                  [itemText]: { ...resp, estado: 'no_aplica' },
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                resp.estado === 'no_aplica'
                                  ? 'bg-slate-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {/* Despliegue si No Cumple */}
                        {resp.estado === 'no_cumple' && (
                          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={resp.observacion}
                                onChange={(e) => {
                                  setChecklistResponses({
                                    ...checklistResponses,
                                    [itemText]: { ...resp, observacion: e.target.value },
                                  });
                                }}
                                placeholder="Describe qué condición insegura o daño observaste..."
                                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  // Asignar a un hallazgo temporal
                                  const nuevoId = Math.random().toString(36).substring(2, 9);
                                  const nuevoH: HallazgoItem = {
                                    id: nuevoId,
                                    titulo: `Falla: ${itemText.substring(0, 30)}...`,
                                    descripcion: resp.observacion || itemText,
                                    criticidad: 'medio',
                                    clasificacionPeligro: 'Locativo',
                                    fotoEvidencia: null,
                                    medidaSugerida: 'Subsanar de inmediato',
                                    responsableAccion: '',
                                  };
                                  setHallazgos([...hallazgos, nuevoH]);
                                  setActivePhotoUploadIndex(hallazgos.length);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>+ Foto Evidencia</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN DE HALLAZGOS FOTOGRÁFICOS MULTI-REGISTRO */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-teal-600" />
                    Hallazgos y Evidencias Visuales ({hallazgos.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Captura fotos en terreno y define la criticidad del riesgo de forma inmediata:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddHallazgo}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Hallazgo</span>
                </button>
              </div>

              {hallazgos.length === 0 ? (
                <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    No se han registrado hallazgos específicos aún
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Si observas una condición insegura, presiona el botón para tomar una fotografía y redactar la acción correctiva.
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHallazgo}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Capturar Primer Hallazgo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {hallazgos.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/30 space-y-3 relative group"
                    >
                      {/* Cabecera del Hallazgo */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Hallazgo #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Selector de Criticidad con 3 píldoras */}
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800">
                            {[
                              { key: 'bajo', label: 'Bajo', color: 'bg-emerald-500 text-white' },
                              { key: 'medio', label: 'Medio', color: 'bg-amber-500 text-white' },
                              { key: 'critico', label: 'Crítico', color: 'bg-red-600 text-white' },
                            ].map((crit) => (
                              <button
                                key={crit.key}
                                type="button"
                                onClick={() => handleUpdateHallazgo(idx, 'criticidad', crit.key)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                  h.criticidad === crit.key ? crit.color : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {crit.label}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveHallazgo(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            title="Eliminar hallazgo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Cuerpo: Foto y Campos */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                        {/* Recuadro de Foto */}
                        <div className="sm:col-span-1">
                          {h.fotoEvidencia ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-black aspect-video sm:aspect-square flex items-center justify-center">
                              <img
                                src={h.fotoEvidencia}
                                alt="Evidencia"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateHallazgo(idx, 'fotoEvidencia', null)}
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePhotoUploadIndex(idx);
                                fileInputRef.current?.click();
                              }}
                              className="w-full aspect-video sm:aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-teal-500 bg-white dark:bg-zinc-800 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-teal-600 transition-all active:scale-95"
                            >
                              <Camera className="w-6 h-6" />
                              <span className="text-[11px] font-bold">+ Tomar Foto</span>
                            </button>
                          )}
                        </div>

                        {/* Campos de Texto del Hallazgo */}
                        <div className="sm:col-span-2 space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                              Descripción del Peligro / Condición Observada *
                            </label>
                            <textarea
                              rows={2}
                              value={h.descripcion}
                              onChange={(e) => handleUpdateHallazgo(idx, 'descripcion', e.target.value)}
                              placeholder="Ej. Extintor con manómetro despresurizado y bloqueado por cajas de cartón en pasillo sur."
                              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                                Clasificación GTC 45
                              </label>
                              <select
                                value={h.clasificacionPeligro}
                                onChange={(e) => handleUpdateHallazgo(idx, 'clasificacionPeligro', e.target.value)}
                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none"
                              >
                                <option value="Locativo">Locativo (Pisos/Orden)</option>
                                <option value="Emergencias">Equipos de Emergencia</option>
                                <option value="Eléctrico">Riesgo Eléctrico</option>
                                <option value="Mecánico">Mecánico (Máquinas/Herramientas)</option>
                                <option value="Biomecánico">Biomecánico (Ergonomía)</option>
                                <option value="Físico">Físico (Ruido/Luz)</option>
                                <option value="Químico">Químico (SGA)</option>
                                <option value="Biológico">Biológico</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                                Medida Correctiva Propuesta
                              </label>
                              <input
                                type="text"
                                value={h.medidaSugerida}
                                onChange={(e) => handleUpdateHallazgo(idx, 'medidaSugerida', e.target.value)}
                                placeholder="Ej. Retirar cajas y recargar extintor"
                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calificación General de la Zona */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Semáforo General de la Zona Inspeccionada:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'seguro',
                    label: '🟢 Zona Segura',
                    sub: 'Condiciones controladas',
                    color: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                  },
                  {
                    key: 'atencion',
                    label: '🟡 Requiere Atención',
                    sub: 'Hallazgos menores/medios',
                    color: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                  },
                  {
                    key: 'critico',
                    label: '🔴 Riesgo Crítico',
                    sub: 'Peligro inminente de daño',
                    color: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSemaforoGeneral(item.key as any)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      semaforoGeneral === item.key ? `${item.color} ring-2 ring-teal-500/20 shadow-xs font-bold` : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de Navegación */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Configuración</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep2}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md transition-all active:scale-95"
              >
                <span>Avanzar a Firmas y Cierre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 3: FIRMAS Y VALIDACIÓN OFICIAL ─── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Resumen Ejecutivo de la Inspección */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Resumen de la Ronda de Inspección
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                  <span className="text-[10px] text-slate-400 block">Sede & Área</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{sede} / {area}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                  <span className="text-[10px] text-slate-400 block">Fecha y Hora</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{fecha} ({hora})</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                  <span className="text-[10px] text-slate-400 block">Total Hallazgos</span>
                  <span className="font-bold text-teal-600">{hallazgos.length} registrados</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                  <span className="text-[10px] text-slate-400 block">Semáforo Área</span>
                  <span className="font-bold">
                    {semaforoGeneral === 'seguro' ? '🟢 Seguro' : semaforoGeneral === 'critico' ? '🔴 Crítico' : '🟡 Atención'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Conclusiones u Observaciones Generales del Inspector:
                </label>
                <textarea
                  rows={2}
                  value={conclusiones}
                  onChange={(e) => setConclusiones(e.target.value)}
                  placeholder="Ej. Se coordina con mantenimiento la recarga de extintores y señalización de pasillos en un plazo de 48 horas..."
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Bloque de Firmas Digitales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Firma del Inspector COPASST */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-teal-600" />
                      Firma del Inspector COPASST *
                    </span>
                    {inspectorFirma && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Firmado
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {inspectorNombre} (CC: {inspectorCedula})
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 h-28 flex items-center justify-center overflow-hidden">
                  {inspectorFirma ? (
                    <img src={inspectorFirma} alt="Firma Inspector" className="h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic">Pendiente de firma</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignInspectorOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-teal-500/40 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 font-bold text-xs hover:bg-teal-100 transition-all"
                >
                  {inspectorFirma ? 'Cambiar Firma' : 'Dibujar Firma en Pantalla'}
                </button>
              </div>

              {/* Firma del Responsable del Área */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-slate-600" />
                      Responsable / Jefe de Área (Opcional)
                    </span>
                    {responsableAreaFirma && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Firmado
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={responsableAreaNombre}
                    onChange={(e) => setResponsableAreaNombre(e.target.value)}
                    placeholder="Nombre del jefe o responsable visitado"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none"
                  />
                </div>

                <div className="border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 h-28 flex items-center justify-center overflow-hidden">
                  {responsableAreaFirma ? (
                    <img src={responsableAreaFirma} alt="Firma Responsable" className="h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic">Opcional para entrega</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignResponsableOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-100 transition-all"
                >
                  {responsableAreaFirma ? 'Cambiar Firma' : 'Dibujar Firma Responsable'}
                </button>
              </div>
            </div>

            {/* Botón de Radicación Final */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Hallazgos</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Radicando Inspección Oficial...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Radicar Inspección Oficial COPASST (+50 pts)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 4: ÉXITO Y GAMIFICACIÓN ─── */}
        {step === 4 && (
          <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-900/60 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 text-3xl">
              ✓
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                <Award className="w-3.5 h-3.5" /> +50 Puntos Pasaporte SST Acreditados
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-3">
                ¡Inspección de Seguridad Radicada!
              </h2>
              <div className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mt-1">
                Consecutivo Oficial: {submittedConsecutivo}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
                La inspección en el área <strong>{area}</strong> ha quedado registrada en el SG-SST y está lista para ser analizada e integrada en el Acta mensual de reunión ordinaria del COPASST.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Inspector:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{inspectorNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zona / Sede:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{area} ({sede})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hallazgos registrados:</span>
                <span className="font-bold text-teal-600">{hallazgos.length}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setHallazgos([]);
                  setArea('');
                  setInspectorFirma(null);
                  setResponsableAreaFirma(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 transition-all active:scale-95"
              >
                + Realizar Otra Inspección
              </button>

              <button
                type="button"
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${inspectorCedula}`)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all active:scale-95"
              >
                Volver al Hub del Colaborador
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Firma para el Inspector */}
      <SignaturePad
        isOpen={isSignInspectorOpen}
        onClose={() => setIsSignInspectorOpen(false)}
        onSave={(data) => {
          setInspectorFirma(data);
          setIsSignInspectorOpen(false);
        }}
        title="Firma del Inspector COPASST / Vigía"
      />

      {/* Modal de Firma para el Responsable del Área */}
      <SignaturePad
        isOpen={isSignResponsableOpen}
        onClose={() => setIsSignResponsableOpen(false)}
        onSave={(data) => {
          setResponsableAreaFirma(data);
          setIsSignResponsableOpen(false);
        }}
        title="Firma del Responsable del Área Visitada"
      />
    </div>
  );
}
