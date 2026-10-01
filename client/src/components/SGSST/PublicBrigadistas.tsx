import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Shield,
  Flame,
  HeartPulse,
  Award,
  AlertTriangle,
  CheckCircle2,
  PenTool,
  RotateCcw,
  Printer,
  Phone,
  ArrowRight,
  Clock,
  Users,
  Radio,
  FileText,
  Sparkles,
  MapPin,
  Calendar,
  Lock,
  Loader2,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';
import { useToastContext } from '@librechat/client';

interface DotacionItem {
  item: string;
  entregado: boolean;
  fechaEntrega?: string;
  observacion?: string;
}

interface CapacitacionItem {
  tema: string;
  fecha?: string;
  horas: number;
  institucion: string;
  estado: string;
}

interface SimulacroItem {
  nombre: string;
  fecha?: string;
  rolDesempenado: string;
}

export default function PublicBrigadistas() {
  const { companyId, cedula: paramCedula } = useParams<{ companyId: string; cedula?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { worker: sessionWorker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchCedula, setSearchCedula] = useState('');
  const [activeTab, setActiveTab] = useState<'credencial' | 'dotacion' | 'formacion' | 'firma'>('credencial');
  const [isDraft, setIsDraft] = useState(true);

  // Datos principales de la Ficha del Brigadista
  const [cedula, setCedula] = useState(paramCedula || searchParams.get('cedula') || '');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [sede, setSede] = useState('Sede Principal');
  const [area, setArea] = useState('');
  const [grupoEspecialidad, setGrupoEspecialidad] = useState('Primeros Auxilios');
  const [rolSCI, setRolSCI] = useState('Brigadista Operativo');
  const [estadoMembresia, setEstadoMembresia] = useState('Activo');
  const [rh, setRh] = useState('O+');
  const [alergiasMedicas, setAlergiasMedicas] = useState('Ninguna conocida');
  const [condicionesMedicas, setCondicionesMedicas] = useState('');
  const [aptitudEmergencias, setAptitudEmergencias] = useState('Apto sin restricciones para atención de emergencias');

  // Contacto de Emergencia en Terreno
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState('');
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState('Familiar');
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState('');

  // Dotación & Equipos Asignados
  const [dotacion, setDotacion] = useState<DotacionItem[]>([
    { item: 'Chaleco reflectivo de brigadista con distintivo', entregado: true, observacion: 'Dotación reglamentaria' },
    { item: 'Brazalete reflectivo de brigada SCI', entregado: true, observacion: 'Identificación rápida' },
    { item: 'Silbato de advertencia y evacuación', entregado: true, observacion: 'Señalización acústica' },
    { item: 'Linterna táctica recargable de alta potencia', entregado: false, observacion: 'Pendiente de entrega' },
    { item: 'Botiquín personal de primeros auxilios y trauma', entregado: false, observacion: 'Dotación por sede' },
    { item: 'Guantes de nitrilo y protección ocular', entregado: true, observacion: 'Bioseguridad' },
  ]);

  // Capacitaciones acreditadas
  const [capacitaciones, setCapacitaciones] = useState<CapacitacionItem[]>([
    { tema: 'Primer Respondiente & Soporte Vital Básico (SVB)', horas: 8, institucion: 'ARL / Organismo de Socorro', estado: 'Certificado' },
    { tema: 'Prevención, Control de Conatos y Manejo de Extintores', horas: 6, institucion: 'Cuerpo de Bomberos', estado: 'Certificado' },
    { tema: 'Procedimientos Operativos Normalizados (PON) de Evacuación', horas: 4, institucion: 'SST Empresa', estado: 'Certificado' },
    { tema: 'Sistema Comando de Incidentes (SCI) en Terreno', horas: 8, institucion: 'Defensa Civil / Cruz Roja', estado: 'En curso' },
  ]);

  // Simulacros
  const [simulacros, setSimulacros] = useState<SimulacroItem[]>([
    { nombre: 'Simulacro Nacional de Respuesta a Emergencias', rolDesempenado: 'Coordinador de Evacuación y Conteo' },
  ]);

  const [observaciones, setObservaciones] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas de Firma Digital
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [existingSignature, setExistingSignature] = useState<string | null>(null);

  // Inicializar cédula desde sesión si existe
  useEffect(() => {
    if (isAuthenticated && sessionWorker?.identificacion && !cedula) {
      setCedula(sessionWorker.identificacion);
    }
  }, [isAuthenticated, sessionWorker, cedula]);

  // Cargar información del Brigadista
  const fetchBrigadistaData = useCallback(async (ced: string) => {
    if (!companyId || !ced.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/public-sgsst/brigadista/${companyId}?cedula=${encodeURIComponent(ced.trim())}`);
      const data = res.data;
      if (data.company) {
        setCompany(data.company);
      }
      setIsDraft(!!data.isDraft);

      const b = data.brigadista;
      if (b) {
        if (b.nombre) setNombre(b.nombre);
        if (b.cargo) setCargo(b.cargo);
        if (b.sede) setSede(b.sede);
        if (b.area) setArea(b.area);
        if (b.grupoEspecialidad) setGrupoEspecialidad(b.grupoEspecialidad);
        if (b.rolSCI) setRolSCI(b.rolSCI);
        if (b.estadoMembresia) setEstadoMembresia(b.estadoMembresia);
        if (b.rh) setRh(b.rh);
        if (b.alergiasMedicas) setAlergiasMedicas(b.alergiasMedicas);
        if (b.condicionesMedicas) setCondicionesMedicas(b.condicionesMedicas);
        if (b.aptitudEmergencias) setAptitudEmergencias(b.aptitudEmergencias);
        if (b.contactoEmergenciaNombre) setContactoEmergenciaNombre(b.contactoEmergenciaNombre);
        if (b.contactoEmergenciaParentesco) setContactoEmergenciaParentesco(b.contactoEmergenciaParentesco);
        if (b.contactoEmergenciaTelefono) setContactoEmergenciaTelefono(b.contactoEmergenciaTelefono);
        if (Array.isArray(b.dotacion) && b.dotacion.length > 0) setDotacion(b.dotacion);
        if (Array.isArray(b.capacitaciones) && b.capacitaciones.length > 0) setCapacitaciones(b.capacitaciones);
        if (Array.isArray(b.simulacrosParticipados) && b.simulacrosParticipados.length > 0) {
          setSimulacros(b.simulacrosParticipados);
        }
        if (b.firmaDigital) {
          setExistingSignature(b.firmaDigital);
          setHasSignature(true);
        }
        if (b.observaciones) setObservaciones(b.observaciones);
      }
    } catch (err) {
      console.error('Error fetching brigadista:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (cedula.trim()) {
      fetchBrigadistaData(cedula.trim());
    } else {
      setLoading(false);
    }
  }, [cedula, fetchBrigadistaData]);

  // Manejo de Canvas de Firma
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setExistingSignature(null);
  };

  const handleToggleDotacion = (idx: number) => {
    setDotacion(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], entregado: !copy[idx].entregado };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!cedula.trim()) {
      showToast({ message: 'Por favor ingresa tu número de cédula', status: 'warning' });
      return;
    }
    if (!nombre.trim()) {
      showToast({ message: 'Por favor ingresa tu nombre completo', status: 'warning' });
      return;
    }

    setSaving(true);
    try {
      let finalSignature = existingSignature;
      if (canvasRef.current && hasSignature && !existingSignature) {
        finalSignature = canvasRef.current.toDataURL('image/png');
      }

      const payload = {
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        sede: sede.trim(),
        area: area.trim(),
        grupoEspecialidad,
        rolSCI,
        estadoMembresia,
        rh,
        alergiasMedicas,
        condicionesMedicas,
        aptitudEmergencias,
        contactoEmergenciaNombre,
        contactoEmergenciaParentesco,
        contactoEmergenciaTelefono,
        dotacion,
        capacitaciones,
        simulacrosParticipados: simulacros,
        firmaDigital: finalSignature,
        observaciones,
      };

      const res = await axios.post(`/api/public-sgsst/brigadista/${companyId}`, payload);
      if (res.data.success) {
        setSavedSuccess(true);
        setIsDraft(false);
        saveSession({ identificacion: cedula.trim(), nombre: nombre.trim(), cargo: cargo.trim() });
        showToast({
          message: '¡Hoja de Vida de Brigadista guardada exitosamente! (+40 pts)',
          status: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error saving brigadista:', err);
      showToast({
        message: err.response?.data?.error || 'Error al guardar hoja de vida de brigadista',
        status: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Color e ícono según especialidad
  const getEspecialidadMeta = (esp: string) => {
    switch (esp) {
      case 'Prevención y Control de Incendios':
        return { icon: Flame, color: 'from-amber-500 to-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' };
      case 'Evacuación y Rescate':
        return { icon: Users, color: 'from-emerald-500 to-teal-600', badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' };
      case 'Comando de Incidentes (SCI)':
        return { icon: Award, color: 'from-blue-600 to-indigo-700', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' };
      case 'Manejo de Sustancias Químicas (HAZMAT)':
        return { icon: AlertTriangle, color: 'from-yellow-500 to-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' };
      default:
        return { icon: HeartPulse, color: 'from-red-500 to-rose-600', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300' };
    }
  };

  const meta = getEspecialidadMeta(grupoEspecialidad);
  const MetaIcon = meta.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={company?.companyName || 'Somos SST'}
        companyLogo={company?.logoUrl}
        currentModule="comites"
        workerCedula={cedula}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Banner de Bienvenida y Gamificación */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-600 text-white p-6 sm:p-8 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30">
                <Shield className="w-3.5 h-3.5" />
                <span>Sistema Comando de Incidentes (SCI) • Dec. 1072</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Hoja de Vida del Brigadista
              </h1>
              <p className="text-xs sm:text-sm text-rose-100 max-w-lg leading-relaxed">
                Credencial oficial digital, unidad de respuesta, dotación táctica y ficha médica para atención de emergencias en la empresa.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-rose-200">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Puntos Pasaporte SST</span>
              </div>
              <span className="text-2xl font-black text-amber-300">+40 pts</span>
              <span className="text-[10px] text-rose-200 hidden sm:block">Al ratificar membrete</span>
            </div>
          </div>
        </div>

        {/* Si no hay cédula, solicitar búsqueda rápida */}
        {!cedula && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-text-primary">Consulta tu Ficha de Brigadista</h2>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                Ingresa tu número de cédula para consultar tu credencial, dotación asignada y carné digital.
              </p>
            </div>
            <div className="flex max-w-md mx-auto gap-2">
              <input
                type="text"
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchCedula.trim()) {
                    setCedula(searchCedula.trim());
                  }
                }}
                placeholder="Número de cédula..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-medium bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchCedula.trim()) {
                    setCedula(searchCedula.trim());
                  }
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 text-white shadow-md active:scale-95 transition-all"
              >
                Consultar
              </button>
            </div>
          </div>
        )}

        {/* Barra de Sesión de Trabajador Identificado */}
        {cedula && nombre && (
          <WorkerSessionBadge
            nombre={nombre}
            cedula={cedula}
            cargo={cargo}
            companyName={company?.companyName}
            onClear={() => {
              clearSession();
              setCedula('');
              setNombre('');
              setCargo('');
            }}
          />
        )}

        {/* Notificación de Guardado Exitoso */}
        {savedSuccess && (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-sm">¡Hoja de Vida de Brigadista Sincronizada!</p>
                <p className="text-[11px] opacity-80">
                  Tu credencial digital y dotación han sido registradas en el SG-SST y se otorgaron <strong>+40 pts</strong> a tu Pasaporte SST.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Ver Pasaporte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ═══ SELECTOR DE PESTAÑAS WAPPY ═══ */}
        {cedula && (
          <div className="flex p-1.5 rounded-2xl bg-surface-primary dark:bg-zinc-900 border border-border-medium shadow-sm overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('credencial')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'credencial'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200 dark:border-rose-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Shield className="w-4 h-4 text-rose-600" />
              <span>Credencial Digital</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dotacion')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dotacion'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200 dark:border-amber-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-600" />
              <span>Dotación ({dotacion.filter(d => d.entregado).length}/{dotacion.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formacion')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'formacion'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-200 dark:border-teal-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Award className="w-4 h-4 text-teal-600" />
              <span>Capacitación</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('firma')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'firma'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <PenTool className="w-4 h-4 text-indigo-600" />
              <span>Ratificar Firma</span>
            </button>
          </div>
        )}

        {/* ═══ TAB 1: CARNÉ & CREDENCIAL DIGITAL SCI ═══ */}
        {cedula && activeTab === 'credencial' && (
          <div className="space-y-6">
            {/* CARNÉ TÁCTICO DE BRIGADISTA */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-surface-primary via-surface-secondary to-rose-500/5 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border-light pb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${meta.color} text-white flex items-center justify-center shadow-xl shadow-rose-500/20 shrink-0`}>
                    <MetaIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                      {company?.companyName || 'Somos SST'} • SG-SST
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-text-primary">
                      {nombre || 'Nombre del Brigadista'}
                    </h2>
                    <p className="text-xs font-semibold text-text-secondary mt-0.5">
                      {cargo || 'Cargo en la empresa'} • CC: {cedula}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${meta.badge}`}>
                        <MetaIcon className="w-3 h-3" /> {grupoEspecialidad}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {rolSCI}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300">
                        RH: {rh}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{estadoMembresia.toUpperCase()}</span>
                    </span>
                    <span className="text-[9px] text-text-tertiary block mt-1">Vigencia Anual SG-SST</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-border-medium bg-surface-primary hover:bg-surface-secondary text-text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4 text-teal-600" />
                    <span>Imprimir Carné</span>
                  </button>
                </div>
              </div>

              {/* DETALLES MÉDICOS Y COBERTURA EN TERRENO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-border-light space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" /> Cobertura Inmediata
                  </h3>
                  <div className="text-xs space-y-1">
                    <p className="text-text-secondary">Sede: <strong className="text-text-primary">{sede}</strong></p>
                    <p className="text-text-secondary">Área Asignada: <strong className="text-text-primary">{area || 'Planta / Operaciones'}</strong></p>
                    <p className="text-text-secondary">Aptitud Física: <strong className="text-emerald-600 dark:text-emerald-400">{aptitudEmergencias}</strong></p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-border-light space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Contacto de Emergencia Familiar
                  </h3>
                  <div className="text-xs space-y-1">
                    <p className="text-text-secondary">Nombre: <strong className="text-text-primary">{contactoEmergenciaNombre || 'No registrado'}</strong></p>
                    <p className="text-text-secondary">Parentesco: <strong className="text-text-primary">{contactoEmergenciaParentesco}</strong></p>
                    {contactoEmergenciaTelefono ? (
                      <a
                        href={`tel:${contactoEmergenciaTelefono}`}
                        className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold hover:underline mt-1"
                      >
                        <Phone className="w-3 h-3" /> Llamar: {contactoEmergenciaTelefono}
                      </a>
                    ) : (
                      <p className="text-text-tertiary italic">Teléfono no registrado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* EDICIÓN RÁPIDA DE DATOS */}
              <div className="mt-6 pt-6 border-t border-border-light space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                  Actualizar Datos de la Ficha
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Cargo</label>
                    <input
                      type="text"
                      value={cargo}
                      onChange={e => setCargo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Unidad / Especialidad Técnica</label>
                    <select
                      value={grupoEspecialidad}
                      onChange={e => setGrupoEspecialidad(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    >
                      <option value="Primeros Auxilios">Primeros Auxilios y Soporte Básico</option>
                      <option value="Prevención y Control de Incendios">Prevención y Control de Incendios</option>
                      <option value="Evacuación y Rescate">Evacuación y Rescate</option>
                      <option value="Comando de Incidentes (SCI)">Comando de Incidentes (SCI)</option>
                      <option value="Manejo de Sustancias Químicas (HAZMAT)">Manejo de Sustancias Químicas (HAZMAT)</option>
                      <option value="Integral / Polivalente">Integral / Polivalente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Rol en Emergencias (SCI)</label>
                    <select
                      value={rolSCI}
                      onChange={e => setRolSCI(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    >
                      <option value="Brigadista Operativo">Brigadista Operativo</option>
                      <option value="Coordinador de Evacuación">Coordinador de Evacuación</option>
                      <option value="Líder de Primeros Auxilios">Líder de Primeros Auxilios</option>
                      <option value="Comandante del Incidente">Comandante del Incidente / Jefe de Brigada</option>
                      <option value="Primer Respondiente">Primer Respondiente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Factor Sanguíneo RH</label>
                    <select
                      value={rh}
                      onChange={e => setRh(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Teléfono Contacto de Emergencia</label>
                    <input
                      type="text"
                      value={contactoEmergenciaTelefono}
                      onChange={e => setContactoEmergenciaTelefono(e.target.value)}
                      placeholder="Ej: 310 123 4567"
                      className="w-full px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: CONTROL DE DOTACIÓN Y EQUIPOS ASIGNADOS ═══ */}
        {cedula && activeTab === 'dotacion' && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div>
              <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4" /> Equipamiento Táctico
              </span>
              <h2 className="text-xl font-black text-text-primary mt-1">
                Dotación y Equipos Asignados al Brigadista
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Verifica los elementos de respuesta entregados por la empresa para la atención oportuna de incidentes.
              </p>
            </div>

            <div className="space-y-3">
              {dotacion.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleDotacion(idx)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    item.entregado
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-surface-secondary/40 border-border-light hover:border-border-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      item.entregado
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-surface-primary'
                    }`}>
                      {item.entregado && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${item.entregado ? 'text-emerald-900 dark:text-emerald-200' : 'text-text-primary'}`}>
                        {item.item}
                      </p>
                      <p className="text-[11px] text-text-tertiary">{item.observacion || 'Equipo estándar'}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    item.entregado
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.entregado ? 'Asignado' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 3: CAPACITACIONES & SIMULACROS ═══ */}
        {cedula && activeTab === 'formacion' && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Competencias Normativas
              </span>
              <h2 className="text-xl font-black text-text-primary mt-1">
                Capacitaciones y Simulacros Certificados
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Horas de formación acumuladas y participación en simulacros de evacuación según Dec. 1072 de 2015.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">Cursos Acreditados</h3>
              {capacitaciones.map((c, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-surface-secondary/60 border border-border-light flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-text-primary">{c.tema}</p>
                    <p className="text-[11px] text-text-secondary">{c.institucion} • {c.horas} Horas</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200">
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">Simulacros de Evacuación</h3>
              {simulacros.map((s, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-surface-secondary/60 border border-border-light flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-text-primary">{s.nombre}</p>
                    <p className="text-[11px] text-text-secondary">Rol asignado: {s.rolDesempenado}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Participó
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 4: RATIFICAR FIRMA & COMPROMISO VOLUNTARIO ═══ */}
        {cedula && activeTab === 'firma' && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-4 h-4" /> Juramento y Voluntariado
              </span>
              <h2 className="text-xl font-black text-text-primary mt-1">
                Ratificación de Voluntariado en la Brigada
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                De conformidad con el <strong>Decreto 1072 de 2015 Art. 2.2.4.6.25</strong>, ratifico mi compromiso voluntario y vocación de servicio para proteger vidas humanas e infraestructura empresarial ante emergencias.
              </p>
            </div>

            {existingSignature ? (
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Firma Digital Ya Registrada en la Hoja de Vida</span>
                </div>
                <img
                  src={existingSignature}
                  alt="Firma Brigadista"
                  className="max-h-24 mx-auto object-contain bg-white dark:bg-zinc-900 p-2 rounded-xl border border-teal-300"
                />
                <button
                  type="button"
                  onClick={() => clearSignature()}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Volver a firmar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span>Dibuja tu firma digital abajo:</span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-text-tertiary hover:text-text-primary flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpiar
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-surface-secondary/40 border-2 border-dashed border-teal-400/50 rounded-2xl touch-none cursor-crosshair"
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ BOTONES DE ACCIÓN PRINCIPALES (WAPPY DESIGN SYSTEM) ═══ */}
        {cedula && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 text-white shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>{saving ? 'Guardando...' : 'Guardar y Certificar Hoja de Vida'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
              className="py-3.5 px-6 rounded-2xl font-semibold text-sm border border-border-medium bg-surface-primary hover:bg-surface-secondary text-text-primary shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Volver a Mi Pasaporte</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
