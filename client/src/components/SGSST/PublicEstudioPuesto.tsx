import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Camera,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  Video,
  FileText,
  ChevronLeft,
  Printer,
  Play,
  Check,
  Calendar,
  Clock,
  Lock,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';
import { VoiceModal } from '~/components/Voice';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';

interface AppointmentStatusData {
  canStart: boolean;
  isBusy: boolean;
  status: 'ready' | 'turn_ready' | 'busy_session' | 'no_appointment' | 'future_appointment';
  requireAppointment: boolean;
  hasAppointment: boolean;
  appointment?: any;
  companyConfig?: any;
  message: string;
}

interface CompanyData {
  id: string;
  name: string;
  logo: string | null;
  city: string;
}

interface WorkerBasic {
  nombre: string;
  identificacion: string;
  cargo: string;
}

const RISK_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  Crítico: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-800' },
  Alto: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  Medio: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  Bajo: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800' },
};

export default function PublicEstudioPuesto() {
  const { companyId } = useParams<{ companyId: string }>();
  const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [workers, setWorkers] = useState<WorkerBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState<number>(1);
  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [cargo, setCargo] = useState('');
  const [actividad, setActividad] = useState('');

  // Auto-advance if authenticated worker arrives
  useEffect(() => {
    if (isAuthenticated && worker) {
      setWorkerName(worker.nombre);
      setWorkerId(worker.cedula);
      if (worker.cargo) setCargo(worker.cargo);
      setStep((prev) => (prev === 1 ? 2 : prev));
    }
  }, [isAuthenticated, worker]);

  // Ergonomic Quick Checks
  const [pantallaOjos, setPantallaOjos] = useState<boolean | null>(null);
  const [piesApoyados, setPiesApoyados] = useState<boolean | null>(null);
  const [codosAngulo, setCodosAngulo] = useState<boolean | null>(null);
  const [soporteLumbar, setSoporteLumbar] = useState<boolean | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Photo
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modo Live State
  const [isStartingLive, setIsStartingLive] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveSessionToken, setLiveSessionToken] = useState<string | null>(null);
  const [liveConversationId, setLiveConversationId] = useState<string | null>(null);
  const [liveAgentId, setLiveAgentId] = useState<string>('fisioterapeuta_laboral');

  // Report & LiveEditor State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportHtml, setReportHtml] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<'Bajo' | 'Medio' | 'Alto' | 'Crítico'>('Bajo');
  const [actionLevel, setActionLevel] = useState<string>('Nivel 1 - Aceptable');
  const [rulaScore, setRulaScore] = useState<number | null>(null);
  const [rebaScore, setRebaScore] = useState<number | null>(null);
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  // Appointment & Concurrency Status for 1 a 1 Worker Rule
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatusData | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Consulta el estado de turno y concurrencia 1 a 1
  const fetchAppointmentStatus = async (targetId?: string) => {
    const idToQuery = String(targetId || workerId || '').trim();
    if (!companyId || !idToQuery) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/public-sgsst/estudio-puesto/appointment-status/${companyId}/${idToQuery}`);
      if (res.ok) {
        const data: AppointmentStatusData = await res.json();
        setAppointmentStatus(data);
      }
    } catch (e) {
      console.warn('[Public EPT] Error fetching appointment status:', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (!companyId) {
      setError('Enlace inválido o incompleto.');
      setLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        const res = await fetch(`/api/public-sgsst/estudio-puesto/${companyId}`);
        if (!res.ok) throw new Error('Empresa no encontrada.');
        const data = await res.json();
        setCompany(data.company);
        const wList = data.workers || [];
        setWorkers(wList);

        // Si viene con parámetro ?cedula= (desde invitación WhatsApp)
        const urlParams = new URLSearchParams(window.location.search);
        const cedulaParam = urlParams.get('cedula');
        if (cedulaParam) {
          const cleanCed = cedulaParam.trim();
          setWorkerId(cleanCed);
          const match = wList.find((w: any) => String(w.identificacion).trim() === cleanCed);
          if (match) {
            setWorkerName(match.nombre);
            if (match.cargo) setCargo(match.cargo);
          }
          setStep(2);
          fetchAppointmentStatus(cleanCed);
        }
      } catch (err: any) {
        setError(err.message || 'No fue posible validar la empresa.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  // Verificar turno al entrar al paso 2
  useEffect(() => {
    if (step === 2 && workerId && workerId.trim().length >= 5) {
      fetchAppointmentStatus(workerId);
    }
  }, [step, workerId, companyId]);

  // Polling si la sala está ocupada para habilitar cuando termine el compañero
  useEffect(() => {
    if (step === 2 && appointmentStatus?.isBusy) {
      const timer = setInterval(() => {
        fetchAppointmentStatus(workerId);
      }, 12000);
      return () => clearInterval(timer);
    }
  }, [step, appointmentStatus?.isBusy, workerId]);

  // Cerrar modal Live y liberar concurrencia
  const handleCloseLiveModal = async () => {
    setIsLiveModalOpen(false);
    try {
      await fetch(`/api/public-sgsst/estudio-puesto/release-session/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: workerId.trim() }),
      });
      fetchAppointmentStatus(workerId);
    } catch (e) {
      console.warn('[Public EPT] Error releasing session on modal close:', e);
    }
  };

  // Autocomplete matching by Cédula
  const handleCedulaChange = (val: string) => {
    setWorkerId(val);
    const clean = val.trim();
    if (clean.length >= 5) {
      const match = workers.find((w) => String(w.identificacion).trim() === clean);
      if (match) {
        setWorkerName(match.nombre);
        if (match.cargo) setCargo(match.cargo);
      }
    }
  };

  // Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Iniciar Modo Live con Fisioterapeuta Laboral ──
  const handleStartLiveMode = async () => {
    if (!workerName || !workerId || !cargo) {
      alert('Por favor completa Nombre, Cédula y Cargo.');
      return;
    }

    // Persistir sesión del trabajador localmente
    saveSession({
      companyId,
      companyName: company?.name,
      nombre: workerName.trim(),
      cedula: workerId.trim(),
      cargo: cargo.trim(),
    });

    setIsStartingLive(true);
    try {
      const res = await fetch(`/api/public-sgsst/estudio-puesto/session/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerName: workerName.trim(),
          workerId: workerId.trim(),
          cargo: cargo.trim(),
          actividad: actividad.trim() || 'Evaluación de puesto de trabajo',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        await fetchAppointmentStatus(workerId);
        throw new Error(errData.message || errData.error || 'Error al inicializar sesión con el Fisioterapeuta IA.');
      }
      const data = await res.json();

      setLiveSessionToken(data.token);
      setLiveConversationId(data.conversationId);
      setLiveAgentId(data.agentId || 'fisioterapeuta_laboral');
      setIsLiveModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'No se pudo iniciar el Modo Live. Puedes optar por el chequeo rápido.');
    } finally {
      setIsStartingLive(false);
    }
  };

  // ── Callback al recibir el reporte generado desde el Modo Live o Formulario ──
  const handleReportCompleted = ({
    reportHtml: generatedHtml,
    riskLevel: finalRisk,
    actionLevel: finalAction,
    rulaScore: rScore,
    rebaScore: rbScore,
  }: {
    reportHtml: string;
    studyId?: string;
    riskLevel?: string;
    actionLevel?: string;
    rulaScore?: number | null;
    rebaScore?: number | null;
  }) => {
    setReportHtml(generatedHtml);
    if (finalRisk) setRiskLevel(finalRisk as any);
    if (finalAction) setActionLevel(finalAction);
    if (rScore) setRulaScore(rScore);
    if (rbScore) setRebaScore(rbScore);
    setSubmitted(true);
    setIsLiveModalOpen(false);
  };

  // ── Enviar Cuestionario Rápido (con Generación IA y Sincronización) ──
  const handleSubmitForm = async () => {
    if (!workerName || !workerId || !cargo) {
      alert('Por favor completa Nombre, Cédula y Cargo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const checks = [pantallaOjos, piesApoyados, codosAngulo, soporteLumbar];
      const falseCount = checks.filter((c) => c === false).length;
      let calculatedRisk: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
      let estActionLevel = 'Nivel 1 - Postura Aceptable';
      let estRula = 3;

      if (falseCount >= 3) {
        calculatedRisk = 'Alto';
        estActionLevel = 'Nivel 3 - Acción Pronta Requerida';
        estRula = 6;
      } else if (falseCount >= 1) {
        calculatedRisk = 'Medio';
        estActionLevel = 'Nivel 2 - Requiere Ajustes Posturales';
        estRula = 4;
      }

      const evidences = photoBase64
        ? [
            {
              phase: 1,
              label: 'Auto-reporte de Puesto',
              url: photoBase64,
              telemetry: {
                pantallaOjos: pantallaOjos ? 'Adecuada' : 'Inadecuada',
                piesApoyados: piesApoyados ? 'Apoyo completo' : 'Pies colgando',
                codosAngulo: codosAngulo ? '90 grados' : 'Sin apoyo',
                soporteLumbar: soporteLumbar ? 'Con soporte' : 'Sin soporte',
              },
            },
          ]
        : [];

      const notes = `Verificación ergonómica auto-reportada:
- Pantalla a nivel de ojos: ${pantallaOjos ? 'Sí' : 'No'}
- Pies planos en el suelo o reposapiés: ${piesApoyados ? 'Sí' : 'No'}
- Codos y antebrazos a 90°: ${codosAngulo ? 'Sí' : 'No'}
- Soporte lumbar en la silla: ${soporteLumbar ? 'Sí' : 'No'}`;

      const res = await fetch(`/api/public-sgsst/estudio-puesto/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerName: workerName.trim(),
          workerId: workerId.trim(),
          cargo: cargo.trim(),
          actividad: actividad.trim() || 'Labor cotidiana en puesto de trabajo',
          evidences,
          riskLevel: calculatedRisk,
          actionLevel: estActionLevel,
          rulaScore: estRula,
          notes,
        }),
      });

      if (!res.ok) throw new Error('Error al procesar la auto-evaluación.');
      const data = await res.json();

      handleReportCompleted({
        reportHtml: data.reportHtml || '',
        riskLevel: data.riskLevel || calculatedRisk,
        actionLevel: data.actionLevel || estActionLevel,
        rulaScore: data.rulaScore || estRula,
        rebaScore: data.rebaScore || 4,
      });
    } catch (err: any) {
      alert(err.message || 'Error al enviar la auto-evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
          Cargando portal de auto-evaluación...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-red-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Enlace no disponible</h2>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-text-primary flex flex-col transition-colors">
      <PublicWorkerHeader
        companyName={company?.name || 'Somos SST'}
        companyLogo={company?.logo || undefined}
        companyId={company?.id || companyId || ''}
        currentModule="estudio_puesto"
        currentApp="estudio_puesto"
        title="Auto-evaluación Ergonómica (EPT)"
        subtitle="Verificación biomecánica y hábitos ergonómicos de puesto"
      />

      <main className={`flex-1 p-4 sm:p-6 w-full ${submitted && showLiveEditor ? 'max-w-5xl' : 'max-w-xl'} mx-auto flex flex-col justify-center transition-all duration-300`}>
        <div className="w-full bg-surface-primary dark:bg-slate-900 rounded-3xl shadow-xl border border-border-medium overflow-hidden">
          {/* ─── PANTALLA 3: ÉXITO Y/O VISOR EN EDITOR LIVE ─────────────────── */}
          {submitted ? (
            <div className="p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
              {showLiveEditor ? (
                /* ── Visor y Editor Live del Colaborador ── */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowLiveEditor(false)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all flex items-center gap-1 text-xs font-semibold"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Volver al resumen</span>
                      </button>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span>Tu Informe Técnico de Ergonomía</span>
                        </h3>
                        <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                          Generado por Fisioterapeuta Laboral IA • Métodos RULA / REBA
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold hover:bg-teal-100 transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Componente LiveEditor en Formato Papel */}
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white shadow-inner">
                    <LiveEditor
                      ref={liveEditorRef}
                      paperMode={true}
                      initialContent={reportHtml || '<p>Cargando informe técnico...</p>'}
                      onUpdate={(html) => setReportHtml(html)}
                      hideFullscreen={false}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <a
                      href={`/sgsst-public/colaborador/${company?.id || companyId}/${workerId.trim() || ''}`}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      <span>Ir a Mi Pasaporte SST</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                /* ── Tarjeta de Resumen y Acreditación de Puntos ── */
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-100 dark:bg-teal-950/60 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-black text-text-primary">
                    ¡Auto-evaluación Recibida y Analizada!
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                    Excelente trabajo, <strong>{workerName}</strong>. Tu análisis ergonómico ha sido compilado por el <strong>Fisioterapeuta Laboral IA</strong> y sincronizado con el SG-SST de <strong>{company?.name}</strong>.
                  </p>

                  {/* Gamificación +40 Puntos */}
                  <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-left text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold">🎯</span>
                      <div>
                        <h4 className="font-bold text-teal-900 dark:text-teal-200">¡+40 Puntos Acreditados a tu Pasaporte SST!</h4>
                        <p className="text-[11px] text-teal-700 dark:text-teal-400">Gracias por registrar tus hábitos posturales y cuidar tu salud osteomuscular.</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Hallazgos y Métricas Ergonómicas */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className={`p-3 rounded-2xl border ${RISK_BADGES[riskLevel]?.border || 'border-slate-200'} ${RISK_BADGES[riskLevel]?.bg || 'bg-slate-50'}`}>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Nivel de Riesgo</span>
                      <p className={`text-base font-black ${RISK_BADGES[riskLevel]?.text || 'text-slate-800'}`}>
                        {riskLevel}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {actionLevel}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20">
                      <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">Puntuación RULA / REBA</span>
                      <p className="text-base font-black text-teal-800 dark:text-teal-200">
                        {rulaScore || '4'}/7 <span className="text-xs font-normal text-teal-600 dark:text-teal-400">RULA</span> • {rebaScore || '4'}/15 <span className="text-xs font-normal text-teal-600 dark:text-teal-400">REBA</span>
                      </p>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        Biomecánica Postural IA
                      </span>
                    </div>
                  </div>

                  {/* Recomendaciones Inmediatas */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-left text-xs space-y-2">
                    <p className="font-bold text-slate-800 dark:text-zinc-200">💡 Hábitos Ergonómicos Recomendados:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                      <li>Realiza pausas activas cada 2 horas (estiramientos cervicales y muñecas).</li>
                      <li>Mantén el borde superior de la pantalla a la altura de tus ojos.</li>
                      <li>Apoya siempre los antebrazos sobre la mesa manteniendo un ángulo de 90°.</li>
                    </ul>
                  </div>

                  {/* Botones Principales de Acción */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setShowLiveEditor(true)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Ver Mi Informe en Editor Live</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>

                    <a
                      href={`/sgsst-public/colaborador/${company?.id || companyId}/${workerId.trim() || ''}`}
                      className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span>Ver Mi Pasaporte SST</span>
                    </a>

                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setShowLiveEditor(false);
                        setStep(1);
                        setPhotoBase64(null);
                        setReportHtml('');
                      }}
                      className="w-full py-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-400 text-xs font-semibold transition-all"
                    >
                      Realizar otra evaluación
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-5 text-xs">
              {/* Indicador de Pasos */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    step === 1
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
                  }`}
                >
                  1
                </div>
                <div className="w-8 h-0.5 bg-slate-200 dark:bg-zinc-800" />
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    step === 2
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'
                  }`}
                >
                  2
                </div>
              </div>

              {/* ─── PASO 1: Identificación del Colaborador ─── */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-center mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      1. Identificación del Trabajador
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ingresa tus datos para vincular el estudio ergonómico a tu expediente laboral.
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-xs">
                        <Award className="w-3.5 h-3.5" /> +40 pts Pasaporte SST
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-border-medium">
                        Res. 2400 de 1979 • ISO 11226 • Dec. 1072/15
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Cédula / Documento de Identidad *
                    </label>
                    <input
                      type="text"
                      placeholder="Digita tu número de documento"
                      value={workerId}
                      onChange={(e) => handleCedulaChange(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Cargo o Puesto de Trabajo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Auxiliar Administrativo, Analista, Operario"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Descripción de tu labor cotidiana (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Digitación en computador, digitación y archivo"
                      value={actividad}
                      onChange={(e) => setActividad(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!workerId || !workerName || !cargo}
                    onClick={() => {
                      saveSession({
                        companyId,
                        companyName: company?.name,
                        nombre: workerName.trim(),
                        cedula: workerId.trim(),
                        cargo: cargo.trim(),
                      });
                      setStep(2);
                    }}
                    className="w-full mt-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <span>Siguiente: Evaluación Ergonómica</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ─── PASO 2: Selección de Modo (Live con Fisioterapeuta / Chequeo Guiado) ─── */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {workerName && workerId && (
                    <WorkerSessionBadge
                      nombre={workerName}
                      cedula={workerId}
                      cargo={cargo}
                      companyName={company?.name}
                      onClear={() => {
                        clearSession();
                        setWorkerName('');
                        setWorkerId('');
                        setCargo('');
                        setStep(1);
                      }}
                      className="mb-2"
                    />
                  )}

                  {!showManualForm ? (
                    <div className="space-y-4">
                      <div className="text-center mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          2. Evaluación Postural y Biomecánica
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Selecciona cómo deseas realizar tu auto-evaluación ergonómica.
                        </p>
                      </div>

                      {/* ── Notificación de Turno y Control de Concurrencia 1 a 1 ── */}
                      {isCheckingStatus ? (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                          <span>Verificando disponibilidad de turno con el Fisioterapeuta IA...</span>
                        </div>
                      ) : appointmentStatus && (
                        <div>
                          {/* CASO 1: Requiere programación previa obligatoria y no tiene turno */}
                          {appointmentStatus.requireAppointment && appointmentStatus.status === 'no_appointment' && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Programación Previa Requerida</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                Tu empresa requiere programación previa para realizar la autoevaluación. Comunícate con tu responsable de SST para asignar tu fecha y hora.
                              </p>
                              <div className="pt-1 flex items-center justify-end text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => fetchAppointmentStatus(workerId)}
                                  className="underline font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900"
                                >
                                  Volver a verificar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* CASO 2: Turno programado para fecha futura */}
                          {appointmentStatus.status === 'future_appointment' && (
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Autoevaluación Programada Próximamente</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                                {appointmentStatus.message}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-blue-700 dark:text-blue-400 font-semibold pt-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>La sala de autoevaluación se habilitará el día de tu turno.</span>
                              </div>
                            </div>
                          )}

                          {/* CASO 3: Sala ocupada en este instante por otro compañero */}
                          {appointmentStatus.isBusy && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold text-xs">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span>Fisioterapeuta en Consulta Individual</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold animate-pulse">
                                  En atención previa
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                El Fisioterapeuta Laboral IA está finalizando la autoevaluación con otro colaborador. Las evaluaciones se atienden uno a uno para garantizar una atención personalizada.
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                  Reintentando automáticamente cada 12 segundos...
                                </span>
                                <button
                                  type="button"
                                  onClick={() => fetchAppointmentStatus(workerId)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-xs transition-all flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Comprobar ahora</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* CASO 4: Turno activo para hoy / Sala lista */}
                          {appointmentStatus.canStart && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-bold">
                                  {appointmentStatus.status === 'turn_ready'
                                    ? '¡Tu turno está habilitado para hoy!'
                                    : '¡Fisioterapeuta Laboral IA listo para tu sesión!'}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                                Disponible 1 a 1
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Tarjeta Destacada: Modo Live con Fisioterapeuta IA ── */}
                      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/5 border-2 border-teal-500/40 relative overflow-hidden shadow-lg hover:border-teal-500 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black tracking-wide uppercase shadow-xs">
                            <Sparkles className="w-3 h-3" /> Recomendado WAPPY IA
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Modo Live en Tiempo Real
                          </span>
                        </div>

                        <div className="flex items-start gap-3 my-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              Evaluación en Vivo con Fisioterapeuta Laboral IA
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                              Activa tu cámara y micrófono para un análisis ergonómico guiado por voz.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 py-2 text-[11px] text-slate-600 dark:text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>Visión computacional y esqueleto biomecánico en pantalla</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>Interacción conversacional fluida con el Fisioterapeuta</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>Generación automática del informe oficial al culminar</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isStartingLive ||
                            (appointmentStatus !== null && !appointmentStatus.canStart)
                          }
                          onClick={handleStartLiveMode}
                          className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                          {isStartingLive ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Conectando con Fisioterapeuta Laboral...</span>
                            </>
                          ) : appointmentStatus && !appointmentStatus.canStart ? (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>
                                {appointmentStatus.isBusy
                                  ? 'Sala en Atención (Espera tu turno)'
                                  : appointmentStatus.status === 'future_appointment'
                                  ? 'Turno Programado para Otra Fecha'
                                  : 'Programación Previa Requerida'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-white" />
                              <span>Iniciar Evaluación Live (Cámara & Voz)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* ── Opción Alternativa: Chequeo Guiado Manual ── */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                            ¿No dispones de cámara o micrófono en este momento?
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Puedes responder 4 preguntas rápidas sobre tu puesto y subir una foto.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualForm(true)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-all shrink-0"
                        >
                          Chequeo Rápido
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-xs font-semibold"
                      >
                        Atrás: Modificar mis datos
                      </button>
                    </div>
                  ) : (
                    /* ── Formulario Manual de 4 Preguntas y Foto ── */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            Chequeo Rápido de Puesto
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Responde cómo sientes tu estación de trabajo actual.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowManualForm(false)}
                          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                        >
                          Cambiar a Modo Live
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Pregunta 1: Pantalla */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                          <span className="text-xs font-semibold pr-2">
                            ¿El borde superior de tu pantalla está a la altura de tus ojos?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPantallaOjos(true)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                pantallaOjos === true
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setPantallaOjos(false)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                pantallaOjos === false
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {/* Pregunta 2: Pies */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                          <span className="text-xs font-semibold pr-2">
                            ¿Tus pies descansan completamente planos sobre el piso o reposapiés?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPiesApoyados(true)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                piesApoyados === true
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setPiesApoyados(false)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                piesApoyados === false
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {/* Pregunta 3: Codos */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                          <span className="text-xs font-semibold pr-2">
                            ¿Tus antebrazos y muñecas quedan apoyados de forma recta al escribir?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCodosAngulo(true)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                codosAngulo === true
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setCodosAngulo(false)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                codosAngulo === false
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {/* Pregunta 4: Soporte Lumbar */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                          <span className="text-xs font-semibold pr-2">
                            ¿Tu silla te brinda un buen soporte en la espalda baja (zona lumbar)?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSoporteLumbar(true)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                soporteLumbar === true
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setSoporteLumbar(false)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                soporteLumbar === false
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subir Foto del Puesto */}
                      <div className="pt-1">
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                          Foto de tu puesto de trabajo (Opcional)
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageChange}
                          className="hidden"
                        />

                        {photoBase64 ? (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 max-h-48 flex items-center justify-center bg-black">
                            <img
                              src={photoBase64}
                              alt="Foto Puesto"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setPhotoBase64(null)}
                              className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold"
                            >
                              Cambiar foto
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-4 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 flex flex-col items-center justify-center text-teal-700 dark:text-teal-300 transition-colors"
                          >
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="font-bold">Tomar foto o subir imagen de tu puesto</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">Captura lateral o frontal</span>
                          </button>
                        )}
                      </div>

                      {/* Botones de Navegación */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setShowManualForm(false)}
                          className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-300 text-xs"
                        >
                          Atrás
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleSubmitForm}
                          className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Compilando informe con IA...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Generar Auto-evaluación</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL DEL MODO LIVE CON FISIOTERAPEUTA LABORAL IA ───────────────── */}
      {isLiveModalOpen && (
        <VoiceModal
          isOpen={isLiveModalOpen}
          onClose={handleCloseLiveModal}
          conversationId={liveConversationId || undefined}
          token={liveSessionToken || undefined}
          agentId={liveAgentId}
          companyId={company?.id || companyId}
          workerData={{
            workerName,
            workerId,
            cargo,
            actividad,
          }}
          onReportGenerated={(html, messageId) => {
            handleReportCompleted({
              reportHtml: html,
              studyId: messageId,
              riskLevel: 'Medio',
              actionLevel: 'Nivel 2 - Requiere Ajustes Posturales',
              rulaScore: 4,
              rebaScore: 4,
            });
          }}
        />
      )}

      {/* Footer Unificado WAPPY */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
