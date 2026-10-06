import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Car,
  Truck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSignature,
  Calendar,
  Gauge,
  Camera,
  History,
  Send,
  Loader2,
  Award,
  Search,
  Check,
  X,
  Info,
  Clock,
  Wrench,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import { useWorkerSession } from '../../hooks/useWorkerSession';
import { SignaturePad } from './SignaturePad';

interface VehicleFleetItem {
  _id: string;
  placa: string;
  marca: string;
  referencia: string;
  modelo: string;
  anio?: number;
  tipo: string;
  conductorId?: string;
  conductorNombre?: string;
  soatVencimiento?: string;
  tecnomecanicaVencimiento?: string;
  kilometrajeActual?: number;
  ultimoMantenimiento?: string;
}

interface ChecklistItem {
  id: string;
  categoria: string;
  item: string;
  critico: boolean;
  estado: 'Bueno' | 'Malo';
  observacion?: string;
}

function ColombianPlateBadge({ placa, className }: { placa: string; className?: string }) {
  const cleanPlaca = (placa || '').toUpperCase().trim();
  return (
    <div className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-2 border-slate-900 shadow-sm shrink-0 select-none ${className || ''}`}>
      <div className="flex items-center gap-1 font-mono font-black text-sm tracking-widest leading-none">
        <span>{cleanPlaca}</span>
      </div>
      <span className="text-[7px] font-sans font-black uppercase tracking-widest text-slate-900 leading-none mt-0.5">
        COLOMBIA
      </span>
    </div>
  );
}

function getDaysUntil(dateStr?: string): { days: number | null; isExpired: boolean; text: string } {
  if (!dateStr) return { days: null, isExpired: false, text: 'No registrado' };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(target.getTime())) return { days: null, isExpired: false, text: dateStr };
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { days: diffDays, isExpired: true, text: `Vencido hace ${Math.abs(diffDays)} días` };
    }
    if (diffDays <= 30) {
      return { days: diffDays, isExpired: false, text: `Vence en ${diffDays} días` };
    }
    return { days: diffDays, isExpired: false, text: `Vigente (${diffDays} días)` };
  } catch (e) {
    return { days: null, isExpired: false, text: dateStr };
  }
}

// Checklists normativos colombianos según estándar PESV (Res. 20223040040595 - Paso 16)
const GET_CHECKLIST_TEMPLATE = (tipo: string): ChecklistItem[] => {
  const t = (tipo || '').toLowerCase();

  if (t.includes('moto')) {
    return [
      { id: 'm1', categoria: 'EPP de Seguridad', item: 'Casco reglamentario certificado con visor sin fisuras ni rayones', critico: true, estado: 'Bueno' },
      { id: 'm2', categoria: 'EPP de Seguridad', item: 'Chaleco o prenda reflectiva con visibilidad reglamentaria', critico: true, estado: 'Bueno' },
      { id: 'm3', categoria: 'EPP de Seguridad', item: 'Guantes de protección con refuerzo en palmas y nudillos', critico: false, estado: 'Bueno' },
      { id: 'm4', categoria: 'Sistema de Frenos', item: 'Freno delantero (manigueta firme, nivel de líquido en visor)', critico: true, estado: 'Bueno' },
      { id: 'm5', categoria: 'Sistema de Frenos', item: 'Freno trasero (pedal con adecuada resistencia y frenado)', critico: true, estado: 'Bueno' },
      { id: 'm6', categoria: 'Llantas y Rines', item: 'Presión y profundidad de labrado de llantas (mín 1.0 mm)', critico: true, estado: 'Bueno' },
      { id: 'm7', categoria: 'Transmisión', item: 'Cadena de transmisión (tensión adecuada, lubricada, sin juego)', critico: false, estado: 'Bueno' },
      { id: 'm8', categoria: 'Luces y Señalización', item: 'Faro delantero (luz baja y alta operativas)', critico: true, estado: 'Bueno' },
      { id: 'm9', categoria: 'Luces y Señalización', item: 'Luz trasera y stop de frenado operativo', critico: true, estado: 'Bueno' },
      { id: 'm10', categoria: 'Luces y Señalización', item: 'Direccionales delanteras y traseras operativas', critico: false, estado: 'Bueno' },
      { id: 'm11', categoria: 'Cabina y Control', item: 'Espejos retrovisores (izquierdo y derecho limpios y firmes)', critico: true, estado: 'Bueno' },
      { id: 'm12', categoria: 'Cabina y Control', item: 'Pito / bocina sonora en buen estado', critico: false, estado: 'Bueno' },
      { id: 'm13', categoria: 'Mecánica y Fluidos', item: 'Nivel de aceite motor y ausencia de fugas visibles', critico: true, estado: 'Bueno' },
    ];
  }

  if (t.includes('camión') || t.includes('camion') || t.includes('furgón') || t.includes('furgon') || t.includes('pesado')) {
    return [
      { id: 'p1', categoria: 'Sistema de Frenos', item: 'Frenos de aire (manómetro con presión de servicio > 90 PSI y sin fugas)', critico: true, estado: 'Bueno' },
      { id: 'p2', categoria: 'Sistema de Frenos', item: 'Freno de estacionamiento / emergencia operativo', critico: true, estado: 'Bueno' },
      { id: 'p3', categoria: 'Llantas y Rodaje', item: 'Llantas duales traseras (sin piedras atrapadas, labrado > 2.0 mm)', critico: true, estado: 'Bueno' },
      { id: 'p4', categoria: 'Llantas y Rodaje', item: 'Llanta de repuesto con soporte seguro y presión correcta', critico: true, estado: 'Bueno' },
      { id: 'p5', categoria: 'Luces y Visibilidad', item: 'Luces principales (altas, bajas, direccionales y freno)', critico: true, estado: 'Bueno' },
      { id: 'p6', categoria: 'Luces y Visibilidad', item: 'Luces de gálibo / trocha y cintas reflectivas perimetrales', critico: true, estado: 'Bueno' },
      { id: 'p7', categoria: 'Luces y Visibilidad', item: 'Alarma sonora de reversa y luz de retroceso', critico: true, estado: 'Bueno' },
      { id: 'p8', categoria: 'Fluidos y Motor', item: 'Niveles de aceite, refrigerante y líquido de embrague/frenos', critico: true, estado: 'Bueno' },
      { id: 'p9', categoria: 'Seguridad Pasiva', item: 'Cinturones de seguridad en todos los puestos operativos', critico: true, estado: 'Bueno' },
      { id: 'p10', categoria: 'Carrocería y Carga', item: 'Compuertas de furgón/carrocería, cerraduras y amarres', critico: false, estado: 'Bueno' },
      { id: 'p11', categoria: 'Equipo de Carretera Pesado', item: 'Extintor de 20 lbs BC/ABC con soporte fijo, manómetro en verde', critico: true, estado: 'Bueno' },
      { id: 'p12', categoria: 'Equipo de Carretera Pesado', item: 'Cuñas o calzas pesadas de bloqueo (mínimo 2 unidades)', critico: true, estado: 'Bueno' },
      { id: 'p13', categoria: 'Equipo de Carretera Pesado', item: 'Gato hidráulico de capacidad acorde, cruceta y señales de advertencia', critico: true, estado: 'Bueno' },
    ];
  }

  // Automóvil, Camioneta, Campero
  const is4x4 = t.includes('campero') || t.includes('camioneta');
  const baseItems: ChecklistItem[] = [
    { id: 'a1', categoria: 'Frenos y Dirección', item: 'Freno de servicio (pedal con buena presión y sin esponjosidad)', critico: true, estado: 'Bueno' },
    { id: 'a2', categoria: 'Frenos y Dirección', item: 'Freno de mano / estacionamiento operativo y ajustado', critico: true, estado: 'Bueno' },
    { id: 'a3', categoria: 'Llantas y Rodaje', item: 'Labrado y presión de llantas principales (profundidad > 1.6 mm)', critico: true, estado: 'Bueno' },
    { id: 'a4', categoria: 'Llantas y Rodaje', item: 'Llanta de repuesto en buen estado y con presión de aire', critico: true, estado: 'Bueno' },
    { id: 'a5', categoria: 'Luces y Señalización', item: 'Luces delanteras (altas y bajas funcionales)', critico: true, estado: 'Bueno' },
    { id: 'a6', categoria: 'Luces y Señalización', item: 'Luces direccionales, estacionarias, freno y reversa', critico: true, estado: 'Bueno' },
    { id: 'a7', categoria: 'Niveles de Fluidos', item: 'Nivel de aceite de motor y líquido refrigerante en rango', critico: true, estado: 'Bueno' },
    { id: 'a8', categoria: 'Niveles de Fluidos', item: 'Nivel de líquido de frenos y agua limpiaparabrisas', critico: true, estado: 'Bueno' },
    { id: 'a9', categoria: 'Seguridad Pasiva y Cabina', item: 'Cinturones de seguridad de 3 puntos en todos los puestos', critico: true, estado: 'Bueno' },
    { id: 'a10', categoria: 'Seguridad Pasiva y Cabina', item: 'Limpiaparabrisas (plumillas en buen estado, sin rayar vidrio)', critico: false, estado: 'Bueno' },
    { id: 'a11', categoria: 'Seguridad Pasiva y Cabina', item: 'Espejos retrovisores (central, izquierdo y derecho sin fisuras)', critico: false, estado: 'Bueno' },
    { id: 'a12', categoria: 'Seguridad Pasiva y Cabina', item: 'Pito / bocina operativa y testigos del tablero sin alertas rojas', critico: true, estado: 'Bueno' },
    { id: 'a13', categoria: 'Equipo de Carretera (Art. 30 Ley 769)', item: 'Extintor vigente con aguja en verde y pasador de seguridad', critico: true, estado: 'Bueno' },
    { id: 'a14', categoria: 'Equipo de Carretera (Art. 30 Ley 769)', item: 'Gato, cruceta, 2 señales reflectivas, botiquín de primeros auxilios y tacos', critico: true, estado: 'Bueno' },
  ];

  if (is4x4) {
    baseItems.push({
      id: 'a15',
      categoria: 'Mecánica 4x4 y Carrocería',
      item: 'Caja de transferencia 4x4 / doble tracción, compuerta o platón seguro',
      critico: false,
      estado: 'Bueno'
    });
  }

  return baseItems;
};

export default function PublicInspeccionVehicular() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { session, worker: sessionWorker, isAuthenticated, saveSession } = useWorkerSession(companyId);

  const [fleet, setFleet] = useState<VehicleFleetItem[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [selectedPlaca, setSelectedPlaca] = useState('');
  
  // Driver Data
  const [conductorCedula, setConductorCedula] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');
  
  // Inspection Data
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [kilometraje, setKilometraje] = useState<number>(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [firmaConductor, setFirmaConductor] = useState<string | null>(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Sync worker session
  useEffect(() => {
    if (sessionWorker || session) {
      setConductorCedula(sessionWorker?.cedula || session?.cedula || '');
      setConductorNombre(sessionWorker?.nombre || session?.nombre || '');
    }
  }, [sessionWorker, session]);

  // Load authorized fleet
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        setLoadingFleet(true);
        const res = await axios.get(`/api/public-sgsst/pesv/vehiculos-activos/${companyId}`);
        const list = res.data?.vehiculos || [];
        setFleet(list);
        if (list.length > 0 && !selectedPlaca) {
          setSelectedPlaca(list[0].placa);
        }
      } catch (err) {
        console.error('Error fetching fleet:', err);
      } finally {
        setLoadingFleet(false);
      }
    };
    if (companyId) fetchFleet();
  }, [companyId]);

  // Selected vehicle object
  const currentVehicle = useMemo(() => {
    return fleet.find(v => (v.placa || '').toUpperCase().trim() === (selectedPlaca || '').toUpperCase().trim()) || null;
  }, [fleet, selectedPlaca]);

  // Whenever vehicle changes, initialize checklist and mileage
  useEffect(() => {
    if (currentVehicle) {
      const template = GET_CHECKLIST_TEMPLATE(currentVehicle.tipo || 'Automóvil');
      setChecklist(template);
      setKilometraje(currentVehicle.kilometrajeActual ? currentVehicle.kilometrajeActual + 5 : 0);
    } else if (!loadingFleet && fleet.length === 0) {
      // Si no hay vehículos registrados, cargar la plantilla estándar para demostración y guía técnica
      const demoTemplate = GET_CHECKLIST_TEMPLATE('Automóvil');
      setChecklist(demoTemplate);
    }
  }, [currentVehicle, loadingFleet, fleet.length]);

  // Calculate legal document statuses
  const soatStatus = useMemo(() => getDaysUntil(currentVehicle?.soatVencimiento), [currentVehicle]);
  const tecnoStatus = useMemo(() => getDaysUntil(currentVehicle?.tecnomecanicaVencimiento), [currentVehicle]);

  // Calculate inspection outcome:
  // If ANY critical item is 'Malo', or SOAT is expired, or Tecno is expired -> 'Rechazado'
  const computedResultado = useMemo(() => {
    if (!currentVehicle) {
      return 'Sin Vehículo';
    }
    const hasCriticalFail = checklist.some(item => item.critico && item.estado === 'Malo');
    if (hasCriticalFail || soatStatus.isExpired || tecnoStatus.isExpired) {
      return 'Rechazado';
    }
    return 'Aprobado';
  }, [checklist, soatStatus, tecnoStatus, currentVehicle]);

  const handleToggleItem = (id: string, nuevoEstado: 'Bueno' | 'Malo') => {
    setChecklist(prev => prev.map(it => it.id === id ? { ...it, estado: nuevoEstado } : it));
  };

  const handleUpdateItemObs = (id: string, obs: string) => {
    setChecklist(prev => prev.map(it => it.id === id ? { ...it, observacion: obs } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) {
      alert('Debe seleccionar un vehículo válido de la flota autorizada.');
      return;
    }
    if (!conductorCedula.trim() || !conductorNombre.trim()) {
      alert('Por favor ingrese su documento y nombre de conductor.');
      return;
    }
    if (!firmaConductor) {
      alert('Debe estampar su firma digital como conductor antes de radicar la inspección.');
      setIsSignatureOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      saveSession(conductorCedula.trim(), conductorNombre.trim());

      const payload = {
        placa: currentVehicle.placa,
        conductorCedula: conductorCedula.trim(),
        conductorNombre: conductorNombre.trim(),
        fecha,
        kilometraje: Number(kilometraje) || 0,
        checklist: {
          items: checklist,
          luces: checklist.find(c => c.categoria.includes('Luces'))?.estado || 'Bueno',
          frenos: checklist.find(c => c.categoria.includes('Frenos'))?.estado || 'Bueno',
          llantas: checklist.find(c => c.categoria.includes('Llantas'))?.estado || 'Bueno',
          direccion: checklist.find(c => c.categoria.includes('Dirección') || c.categoria.includes('Control'))?.estado || 'Bueno',
          cinturones: checklist.find(c => c.categoria.includes('Cinturones') || c.categoria.includes('Seguridad'))?.estado || 'Bueno',
        },
        resultado: computedResultado,
        observaciones,
        firmaConductor,
        fotos
      };

      const res = await axios.post(`/api/public-sgsst/pesv/inspeccion-diaria/${companyId}`, payload);
      setSubmitSuccess(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al radicar la inspección preoperacional');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans">
      <PublicWorkerHeader 
        companyId={companyId || ''}
        currentModule="pesv"
        title="Inspección Preoperacional Diaria PESV"
        subtitle="Paso 16 • Res. 20223040040595"
        workerCedula={conductorCedula}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Banner Superior PESV */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-blue-300" /> PESV Paso 16 • Res. 20223040040595
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Inspección Preoperacional Diaria
            </h1>
            <p className="text-blue-100/90 text-sm max-w-xl">
              Verificación técnica y documental diaria antes de iniciar la marcha. Cruzada estrictamente con la Hoja de Vida oficial del automotor.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-blue-200">Recompensa</span>
              <span className="text-xl font-black text-amber-300">+40 Puntos</span>
              <span className="block text-[10px] text-blue-100">Seguridad Vial</span>
            </div>
          </div>
        </div>

        {/* Modal de Firma Pad */}
        <SignaturePad
          isOpen={isSignatureOpen}
          onClose={() => setIsSignatureOpen(false)}
          onSave={(base64) => {
            setFirmaConductor(base64);
            setIsSignatureOpen(false);
          }}
          title="Firma Digital del Conductor (Ley 527/1999)"
        />

        {/* Pantalla de Éxito al Radicar */}
        {submitSuccess ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-lg text-center space-y-5 animate-in fade-in">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              submitSuccess.inspeccion?.resultado === 'Rechazado'
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
            }`}>
              {submitSuccess.inspeccion?.resultado === 'Rechazado' ? (
                <AlertOctagon className="w-9 h-9" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                {submitSuccess.inspeccion?.resultado === 'Rechazado'
                  ? 'Vehículo No Conforme - Inmovilizado'
                  : 'Inspección Aprobada con Éxito'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                {submitSuccess.message}
              </p>
            </div>

            <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <ColombianPlateBadge placa={currentVehicle?.placa || ''} />
              <div className="text-left text-xs">
                <p className="font-bold text-slate-900 dark:text-zinc-100">{currentVehicle?.marca} {currentVehicle?.referencia}</p>
                <p className="text-slate-500">Conductor: {conductorNombre} • Odómetro: {submitSuccess.kilometrajeActual} km</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitSuccess(null);
                  setFirmaConductor(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all"
              >
                Nueva Inspección
              </button>
              <button
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}`)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md"
              >
                Volver al Portal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Selección y Validación de Flota Autorizada */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" /> Automotor de la Flota (Hoja de Vida)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Selecciona el vehículo asignado registrado en el PESV de la empresa.
                  </p>
                </div>
                {fleet.length > 0 && (
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {fleet.length} Vehículos en Flota
                  </span>
                )}
              </div>

              {loadingFleet ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500">Cargando flota autorizada...</p>
                </div>
              ) : fleet.length === 0 ? (
                <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    No hay vehículos registrados en la Hoja de Vida de la empresa.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    El área de SST/Seguridad Vial debe ingresar los vehículos en el módulo administrativo de Vehículos antes de poder realizar inspecciones preoperacionales.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selector de Placa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      Placa del Vehículo a Operar *
                    </label>
                    <select
                      value={selectedPlaca}
                      onChange={e => setSelectedPlaca(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {fleet.map((v, idx) => (
                        <option key={idx} value={v.placa}>
                          {v.placa} — {v.tipo}: {v.marca} {v.referencia} ({v.modelo || v.anio || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ficha Técnica Rápida del Vehículo Seleccionado */}
                  {currentVehicle && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ColombianPlateBadge placa={currentVehicle.placa} />
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                              {currentVehicle.marca} {currentVehicle.referencia}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Tipo: <strong className="text-slate-800 dark:text-zinc-200">{currentVehicle.tipo}</strong> • Modelo/Año: {currentVehicle.modelo || currentVehicle.anio || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Badge SOAT */}
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                            soatStatus.isExpired
                              ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          }`}>
                            SOAT: {soatStatus.text}
                          </span>

                          {/* Badge RTM */}
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                            tecnoStatus.isExpired
                              ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          }`}>
                            RTM: {tecnoStatus.text}
                          </span>
                        </div>
                      </div>

                      {/* Alerta Crítica si hay documento vencido */}
                      {(soatStatus.isExpired || tecnoStatus.isExpired) && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>
                            ALERTA PESV: Este automotor tiene documentación obligatoria vencida. Según el Código Nacional de Tránsito y el PESV, este vehículo NO debe circular en la vía pública.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Datos del Conductor y Odómetro */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600" /> Operador / Conductor y Lectura de Odómetro
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Cédula del Conductor *
                  </label>
                  <input
                    type="text"
                    required
                    value={conductorCedula}
                    onChange={e => setConductorCedula(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Nombre Completo del Conductor *
                  </label>
                  <input
                    type="text"
                    required
                    value={conductorNombre}
                    onChange={e => setConductorNombre(e.target.value)}
                    placeholder="Ej. Carlos Fernando Reyes"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Kilometraje Actual (Odómetro) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={kilometraje}
                      onChange={e => setKilometraje(Number(e.target.value))}
                      placeholder="Ej. 45200"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">km</span>
                  </div>
                  {currentVehicle?.kilometrajeActual && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Último registro previo: {currentVehicle.kilometrajeActual} km
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Lista de Chequeo Preoperacional Adaptativa */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Lista de Chequeo Técnico (Paso 16 PESV)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {currentVehicle ? (
                      <>Adaptada automáticamente para: <strong className="text-slate-800 dark:text-zinc-200">{currentVehicle.tipo}</strong> ({currentVehicle.placa})</>
                    ) : (
                      <>Plantilla modelo de referencia: <strong className="text-slate-800 dark:text-zinc-200">Automóvil / Camioneta</strong> (Modo Guía PESV)</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentVehicle ? (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      computedResultado === 'Aprobado'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
                    }`}>
                      {computedResultado === 'Aprobado' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      Resultado: {computedResultado}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> Modo Guía (Sin Vehículo)
                    </span>
                  )}
                </div>
              </div>

              {fleet.length === 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold">Vista previa de la lista de chequeo estándar según Paso 16 del PESV</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      Actualmente no hay vehículos registrados en la Hoja de Vida PESV de la empresa. Para radicar una inspección oficial, el área de SST debe ingresar los automotores en el aplicativo o activar la <strong>Flota Modelo PESV</strong>. Abajo puedes explorar los ítems obligatorios.
                    </p>
                  </div>
                </div>
              )}

              {/* Items del Checklist agrupados */}
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {checklist.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">
                          {item.categoria}
                        </span>
                        {item.critico && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40">
                            Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                        {item.item}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id, 'Bueno')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          item.estado === 'Bueno'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Bueno
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id, 'Malo')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          item.estado === 'Malo'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Malo / No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Observaciones y Firma Digital */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-blue-600" /> Observaciones y Firma del Conductor
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  Observaciones de la Inspección
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Detalla cualquier ruido extraño, golpe en carrocería, desgaste o novedad en la ruta..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Firma Pad */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  Firma Digital del Conductor * (Ley 527 de 1999)
                </label>
                {firmaConductor ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/40">
                    <div className="flex items-center gap-3">
                      <img src={firmaConductor} alt="Firma Conductor" className="h-12 bg-white rounded p-1 border" />
                      <div>
                        <p className="text-xs font-bold text-teal-800 dark:text-teal-200">Firma Registrada</p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400">{conductorNombre} • {conductorCedula}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSignatureOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Modificar Firma
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSignatureOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 text-xs font-bold transition-all"
                  >
                    <FileSignature className="w-4 h-4 text-blue-600" />
                    Haga clic aquí para estampar su firma digital en pantalla
                  </button>
                )}
              </div>
            </div>

            {/* Botón de Radicación */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !currentVehicle}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  !currentVehicle
                    ? 'bg-slate-500 cursor-not-allowed'
                    : computedResultado === 'Aprobado'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando Inspección...
                  </>
                ) : !currentVehicle ? (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Registra o selecciona un vehículo para radicar
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Radicar Inspección Preoperacional PESV (+40 pts)
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
