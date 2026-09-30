import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Shield,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PenTool,
  RotateCcw,
  Send,
  Calendar,
  Award,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  Flame,
  Car,
  FileText,
  Clock,
  MapPin,
  X,
  FileCheck,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

export default function PublicComites() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Form State
  const [tipoComite, setTipoComite] = useState<'copasst' | 'cocolab' | 'brigada' | 'pesv'>('copasst');
  const [accion, setAccion] = useState<'asistencia_reunion' | 'inspeccion_seguridad' | 'simulacro_brigada'>('asistencia_reunion');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [cargo, setCargo] = useState('');
  const [rolEnComite, setRolEnComite] = useState('Presidente');
  const [temasTratados, setTemasTratados] = useState('');
  const [compromisos, setCompromisos] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  // Canvas para asistencia manual
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Mode: actas_pendientes vs asistencia_general
  const [activeTab, setActiveTab] = useState<'actas' | 'general'>('actas');
  const [actasPendientes, setActasPendientes] = useState<any[]>([]);
  const [actasFirmadas, setActasFirmadas] = useState<any[]>([]);
  const [loadingActas, setLoadingActas] = useState(false);
  const [selectedActaForSign, setSelectedActaForSign] = useState<any | null>(null);
  const [submittingActaFirma, setSubmittingActaFirma] = useState(false);
  const [actaFirmaSuccess, setActaFirmaSuccess] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  // Canvas para firma de Acta Oficial
  const actaCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingActa, setIsDrawingActa] = useState(false);
  const [hasActaSignature, setHasActaSignature] = useState(false);

  // Auto-fill worker details when session or URL query is available
  useEffect(() => {
    const qCedula = searchParams.get('cedula');
    if (qCedula && !cedula) {
      setCedula(qCedula.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && worker) {
      if (worker.nombre) setNombre(worker.nombre);
      if (worker.cedula) setCedula(worker.cedula);
      if (worker.cargo) setCargo(worker.cargo);
    }
  }, [isAuthenticated, worker]);

  // Cargar actas pendientes cuando haya cédula
  const fetchActasPendientes = useCallback(async (ced: string) => {
    if (!companyId || !ced.trim()) return;
    setLoadingActas(true);
    try {
      const res = await axios.get(`/api/public-sgsst/actas-pendientes/${companyId}?cedula=${encodeURIComponent(ced.trim())}`);
      const list = res.data.actasPendientes || res.data.actas || [];
      setActasPendientes(list);
      setActasFirmadas(res.data.actasFirmadas || []);
      if (list.length > 0) {
        setActiveTab('actas');
      }
    } catch (err) {
      console.error('Error fetching actas pendientes:', err);
    } finally {
      setLoadingActas(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (cedula.trim()) {
      fetchActasPendientes(cedula.trim());
    }
  }, [cedula, fetchActasPendientes]);


  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
        setCompany(res.data);
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setLoadingCompany(false);
      }
    };
    if (companyId) fetchCompany();
  }, [companyId]);

  // Canvas drawing handlers (mouse & touch)
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
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
  };

  // Canvas drawing handlers para acta oficial
  const startDrawingActa = (e: any) => {
    const canvas = actaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    setIsDrawingActa(true);
    setHasActaSignature(true);
  };

  const drawActa = (e: any) => {
    if (!isDrawingActa) return;
    const canvas = actaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawingActa = () => {
    setIsDrawingActa(false);
  };

  const clearActaSignature = () => {
    const canvas = actaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasActaSignature(false);
  };

  const handleSubmitActaFirma = async () => {
    if (!selectedActaForSign) return;
    if (!hasActaSignature || !actaCanvasRef.current) {
      alert('Por favor dibuja tu firma antes de confirmar.');
      return;
    }

    const signatureData = actaCanvasRef.current.toDataURL('image/png');
    setSubmittingActaFirma(true);

    try {
      const payload = {
        actaId: selectedActaForSign._id,
        tipoComite: selectedActaForSign.tipoComite,
        cedula: cedula.trim(),
        firma: signatureData,
      };

      const res = await axios.post(`/api/public-sgsst/actas/${companyId}/firmar`, payload);
      setActaFirmaSuccess(res.data.message || 'Firma registrada con éxito');
      fetchActasPendientes(cedula.trim());
      setSelectedActaForSign(null);
      clearActaSignature();
    } catch (err: any) {
      console.error('Error submitting acta firma:', err);
      alert(err.response?.data?.error || 'Error al registrar tu firma en el acta.');
    } finally {
      setSubmittingActaFirma(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim()) {
      alert('Por favor ingresa tu nombre y cédula.');
      return;
    }

    const signatureData = hasSignature && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;

    setSubmitting(true);
    try {
      const payload = {
        tipoComite,
        accion,
        trabajadorNombre: nombre.trim(),
        trabajadorCedula: cedula.trim(),
        trabajadorCargo: cargo.trim(),
        rolEnComite,
        temasTratados: temasTratados.trim(),
        compromisos: compromisos.trim(),
        firma: signatureData,
      };

      const res = await axios.post(`/api/public-sgsst/comites/${companyId}`, payload);
      setSubmittedResult({ success: true, recordId: res.data.recordId });
      localStorage.setItem('wappy_worker_cedula', cedula.trim());
      saveSession({
        companyId,
        companyName: company?.companyName,
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        cargo: cargo.trim(),
      });
    } catch (err: any) {
      console.error('Error submitting comite record:', err);
      alert(err.response?.data?.error || 'Error al enviar el registro de asistencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const comitesMetadata = {
    copasst: {
      name: 'COPASST',
      fullName: 'Comité Paritario de Seguridad y Salud en el Trabajo',
      norm: 'Res. 2013/1986 • Dec. 1072/15 Art. 2.2.4.6.8',
      icon: Users,
      color: 'from-teal-600 to-emerald-600',
      pts: '+25 pts',
      roles: ['Presidente', 'Secretario', 'Miembro Principal Trabajadores', 'Miembro Suplente Trabajadores', 'Representante Empleador', 'Asistente Invitado'],
    },
    cocolab: {
      name: 'COCOLAB',
      fullName: 'Comité de Convivencia Laboral',
      norm: 'Res. 3461/2025 • Ley 1010/2006 • Ley 2365/2024',
      icon: HeartHandshake,
      color: 'from-indigo-600 to-violet-600',
      pts: '+25 pts',
      roles: ['Presidente', 'Secretario', 'Representante Trabajadores', 'Representante Empleador', 'Invitado'],
    },
    brigada: {
      name: 'Brigada de Emergencias',
      fullName: 'Brigada de Prevención y Atención de Emergencias',
      norm: 'Res. 2400/1979 Art. 223 • Dec. 1072/15 Art. 2.2.4.6.25',
      icon: Flame,
      color: 'from-amber-600 to-rose-600',
      pts: '+35 pts',
      roles: ['Líder de Brigada', 'Brigadista Primeros Auxilios', 'Brigadista Evacuación', 'Brigadista Control de Fuego', 'Brigadista Integral'],
    },
    pesv: {
      name: 'Comité PESV',
      fullName: 'Comité de Seguridad Vial (Plan Estratégico)',
      norm: 'Res. 20223040040595 de 2022 (Paso 2) • Ley 2050/2020',
      icon: Car,
      color: 'from-cyan-600 to-blue-600',
      pts: '+40 pts',
      roles: ['Líder del PESV', 'Representante de Conductores', 'Jefe de Operaciones / Mantenimiento', 'Miembro del Comité'],
    },
  };

  const activeMeta = comitesMetadata[tipoComite];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={company?.companyName || 'Somos SST'}
        companyLogo={company?.logoUrl}
        currentModule="comites"
        workerCedula={cedula}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Banner de éxito de firma de acta */}
        {actaFirmaSuccess && (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-sm">{actaFirmaSuccess}</p>
                <p className="text-[11px] opacity-80">El acta ha sido sellada digitalmente con tu identidad y fecha exacta.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActaFirmaSuccess(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pantalla de éxito de asistencia general */}
        {submittedResult && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">¡Asistencia Registrada!</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md mx-auto">
                Tu firma y participación en el <strong>{activeMeta.fullName}</strong> han sido recibidas con éxito y selladas con fecha y hora.
              </p>
            </div>

            <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs text-teal-900 dark:text-teal-200 text-left flex items-start gap-3">
              <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Puntos de Gamificación</p>
                <p className="mt-0.5 text-teal-800 dark:text-teal-300">
                  Tu participación sumará <strong>{activeMeta.pts}</strong> a tu Pasaporte SST una vez validada la lista de asistencia por el coordinador.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmittedResult(null)}
                className="flex-1 py-3 rounded-2xl font-semibold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-primary transition-colors"
              >
                Registrar otra persona
              </button>
              <button
                type="button"
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
                className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Ver Mi Pasaporte SST</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Selector de Pestañas: Actas Convocadas vs Registro Manual */}
        {!submittedResult && (
          <div className="flex p-1.5 rounded-2xl bg-surface-primary dark:bg-zinc-900 border border-border-medium shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('actas')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'actas'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-200 dark:border-teal-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>Actas por Firmar {actasPendientes.length > 0 ? `(${actasPendientes.length})` : ''}</span>
              {actasPendientes.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'general'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-200 dark:border-teal-800'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Asistencia Manual</span>
            </button>
          </div>
        )}

        {/* ═══ VISTA DE ACTAS PENDIENTES DE FIRMA ═══ */}
        {!submittedResult && activeTab === 'actas' && (
          <div className="space-y-4">
            {/* Si no hay cédula, solicitarla para buscar actas */}
            {!cedula.trim() ? (
              <div className="bg-surface-primary dark:bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">Firma de Actas de Comité</h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                    Ingresa tu número de cédula para consultar las actas de COPASST o Convivencia que requieren tu firma digital obligatoria.
                  </p>
                </div>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    id="cedula-input-search"
                    placeholder="Número de cédula sin puntos"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setCedula(val);
                          fetchActasPendientes(val);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inp = document.getElementById('cedula-input-search') as HTMLInputElement;
                      if (inp && inp.value.trim()) {
                        setCedula(inp.value.trim());
                        fetchActasPendientes(inp.value.trim());
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs shadow-md active:scale-95 transition-all"
                  >
                    Consultar
                  </button>
                </div>
              </div>
            ) : loadingActas ? (
              <div className="p-12 text-center bg-surface-primary dark:bg-slate-900 rounded-3xl border border-border-medium space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                <p className="text-xs text-text-secondary font-bold">Buscando actas oficiales convocadas...</p>
              </div>
            ) : actasPendientes.length === 0 ? (
              <div className="p-8 text-center bg-surface-primary dark:bg-slate-900 rounded-3xl border border-border-medium shadow-md space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">¡Estás al día!</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    No tienes actas pendientes de firma para la cédula <strong>{cedula}</strong>.
                  </p>
                </div>

                {actasFirmadas.length > 0 && (
                  <div className="pt-3 border-t border-border-medium/40 text-left space-y-2">
                    <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                      Actas ya firmadas por ti ({actasFirmadas.length}):
                    </span>
                    <div className="space-y-1.5">
                      {actasFirmadas.map((af: any) => (
                        <div key={af._id} className="p-3 rounded-2xl bg-surface-secondary/40 border border-border-medium/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-text-primary">{af.consecutivo}</span>
                            <span className="text-[10px] text-text-tertiary block">{af.tituloComite} • {af.periodo}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            ✓ Firmada
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                  >
                    Registrar Asistencia Manual &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-transparent p-4 rounded-3xl border border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
                      <PenTool className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-amber-900 dark:text-amber-200">
                        Actas Oficiales Requeridas para tu Firma ({actasPendientes.length})
                      </h2>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Como miembro o participante convocado, estampa tu firma digital para validar jurídicamente el acta.
                      </p>
                    </div>
                  </div>
                </div>

                {actasPendientes.map((acta: any) => (
                  <div
                    key={acta._id}
                    className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-5 shadow-xl space-y-4 transition-all hover:border-teal-500/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <FileText className="w-3 h-3" /> {acta.tituloComite}
                        </span>
                        <h3 className="text-base font-black text-text-primary">{acta.consecutivo}</h3>
                        <p className="text-xs font-semibold text-text-secondary">{acta.periodo} • {acta.tipo}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                        Pendiente tu firma
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-2xl bg-surface-secondary/40 border border-border-medium/40">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{new Date(acta.fecha).toLocaleDateString('es-CO')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{acta.hora}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-text-secondary truncate">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{acta.lugar || 'Sede Principal / Virtual'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-xs">
                      <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5">
                        Tu rol convocado: <strong>{acta.miRol}</strong>
                      </span>
                      <p className="text-[11px] text-text-secondary">
                        Firmas registradas: {acta.firmasCompletadas} de {acta.totalAsistentes} participantes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedActaForSign(acta);
                        clearActaSignature();
                      }}
                      className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>Revisar y Firmar Acta Digitalmente</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulario de Asistencia Manual */}
        {!submittedResult && activeTab === 'general' && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Comités & Liderazgo SST
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary mt-1">
                Firma de Asistencia & Actas
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Registra formalmente tu participación en los comités institucionales y brigadas de emergencia.
              </p>
            </div>

            {nombre && cedula && (
              <WorkerSessionBadge
                nombre={nombre}
                cedula={cedula}
                cargo={cargo}
                companyName={company?.companyName}
                onClear={() => {
                  clearSession();
                  setNombre('');
                  setCedula('');
                  setCargo('');
                }}
              />
            )}

            {/* Selector de Comité */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">1. Selecciona el Comité</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['copasst', 'cocolab', 'brigada', 'pesv'] as const).map(c => {
                  const item = comitesMetadata[c];
                  const isSelected = tipoComite === c;
                  const Icon = item.icon;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setTipoComite(c);
                        setRolEnComite(item.roles[0]);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                          : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">{item.pts}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-secondary/40 border border-border-medium/60 text-xs">
                <span className="text-text-secondary font-medium truncate">{activeMeta.fullName}</span>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold">
                  {activeMeta.norm}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tipo de Actividad */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
                  2. Tipo de Actividad
                </label>
                <select
                  value={accion}
                  onChange={e => setAccion(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="asistencia_reunion">Reunión Mensual / Ordinaria</option>
                  <option value="inspeccion_seguridad">Inspección Periódica de Seguridad</option>
                  <option value="simulacro_brigada">Entrenamiento o Práctica de Emergencia</option>
                </select>
              </div>

              {/* Datos del Participante */}
              <div className="space-y-3 pt-2 border-t border-border-medium/60">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  3. Datos del Participante
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Nombre Completo:</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Laura Gómez"
                      required
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Cédula:</span>
                    <input
                      type="text"
                      value={cedula}
                      onChange={e => setCedula(e.target.value)}
                      placeholder="Número sin puntos"
                      required
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Cargo en la Empresa:</span>
                    <input
                      type="text"
                      value={cargo}
                      onChange={e => setCargo(e.target.value)}
                      placeholder="Ej: Operario de Ensamble"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Rol en este Comité:</span>
                    <select
                      value={rolEnComite}
                      onChange={e => setRolEnComite(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      {activeMeta.roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Temas Tratados / Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  4. Temas Tratados / Compromisos
                </label>
                <textarea
                  rows={2}
                  value={temasTratados}
                  onChange={e => setTemasTratados(e.target.value)}
                  placeholder="Resumen de puntos abordados en la reunión..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Firma Manuscrita */}
              <div className="space-y-2 pt-2 border-t border-border-medium/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-teal-600" /> 5. Firma Digital Manuscrita
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Limpiar firma
                    </button>
                  )}
                </div>

                <div className="border border-border-medium rounded-2xl overflow-hidden bg-white shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair"
                  />
                </div>
                <p className="text-[10px] text-text-tertiary text-center">
                  Dibuja tu firma con el dedo o puntero sobre el recuadro blanco.
                </p>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Guardando Asistencia...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Firmar y Registrar Asistencia
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ═══ MODAL OFICIAL PARA FIRMA DIGITAL DE ACTA ═══ */}
      {selectedActaForSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-medium">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600">
                  <FileCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Firmar {selectedActaForSign.consecutivo}
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    {selectedActaForSign.tituloComite}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActaForSign(null)}
                className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-surface-secondary/50 border border-border-medium/60 space-y-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Participante Convocado:</span>
                  <strong className="text-text-primary">{selectedActaForSign.miNombre}</strong>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Cédula de Ciudadanía:</span>
                  <strong className="text-text-primary">{cedula}</strong>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Rol en la Sesión:</span>
                  <strong className="text-teal-600 dark:text-teal-400">{selectedActaForSign.miRol}</strong>
                </div>
              </div>

              {selectedActaForSign.compromisos && selectedActaForSign.compromisos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wide block">
                    Compromisos Asignados en el Acta:
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {selectedActaForSign.compromisos.map((c: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-surface-secondary/40 border border-border-medium/40 text-[11px] flex justify-between gap-2">
                        <span className="text-text-primary font-medium">{c.accion}</span>
                        <span className="text-text-tertiary shrink-0 font-bold">{c.responsable}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Asistentes Convocados y Estado */}
              {Array.isArray(selectedActaForSign.asistentes) && selectedActaForSign.asistentes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wide block">
                    Participantes de la Sesión:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {selectedActaForSign.asistentes.map((asist: any, aIdx: number) => (
                      <div key={aIdx} className="p-2 rounded-xl bg-surface-secondary/40 border border-border-medium/30 flex items-center justify-between text-[11px]">
                        <div className="min-w-0 truncate">
                          <p className="font-bold truncate">{asist.nombre}</p>
                          <p className="text-[9px] text-text-tertiary truncate">{asist.rol}</p>
                        </div>
                        {asist.haFirmado ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-bold shrink-0">
                            ✓ Firmado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold shrink-0">
                            Pendiente
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declaración de validez y aceptación legal */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 shrink-0"
                />
                <span className="leading-tight">
                  Certifico bajo la gravedad de juramento mi asistencia y participación en la sesión paritaria, y estampo voluntariamente mi firma digital conforme al <strong>Dec. 1072/2015</strong>.
                </span>
              </label>

              {/* Lienzo de Firma */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wide flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-teal-600" /> Dibuja tu firma a continuación
                  </span>
                  {hasActaSignature && (
                    <button
                      type="button"
                      onClick={clearActaSignature}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Borrar
                    </button>
                  )}
                </div>

                <div className="border border-teal-500/40 rounded-2xl overflow-hidden bg-white shadow-inner">
                  <canvas
                    ref={actaCanvasRef}
                    width={460}
                    height={140}
                    onMouseDown={startDrawingActa}
                    onMouseMove={drawActa}
                    onMouseUp={stopDrawingActa}
                    onMouseLeave={stopDrawingActa}
                    onTouchStart={startDrawingActa}
                    onTouchMove={drawActa}
                    onTouchEnd={stopDrawingActa}
                    className="w-full h-32 touch-none cursor-crosshair bg-white"
                  />
                </div>
                <p className="text-[10px] text-text-tertiary text-center">
                  Usa tu dedo en pantalla táctil o el ratón para firmar
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-medium">
              <button
                type="button"
                onClick={() => {
                  setSelectedActaForSign(null);
                  setHasAcceptedTerms(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-border-medium hover:bg-surface-hover text-text-secondary font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitActaFirma}
                disabled={submittingActaFirma || !hasActaSignature || !hasAcceptedTerms}
                className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md active:scale-95 transition-all text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingActaFirma ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sellando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar y Sellar Firma (+50 pts)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Unificado WAPPY */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
