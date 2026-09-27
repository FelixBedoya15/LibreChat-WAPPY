import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  HeartHandshake,
  Lock,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Users,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  QrCode,
  Share2,
  Vote,
  AlertTriangle,
  Building2,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';

export default function ConvivenciaWorkspace() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'casos' | 'actas' | 'comites' | 'elecciones'>('casos');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [casos, setCasos] = useState<any[]>([]);
  const [actas, setActas] = useState<any[]>([]);
  const [elecciones, setElecciones] = useState<any[]>([]);

  // Modal Caso State
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [actuacionForm, setActuacionForm] = useState({
    tipo: 'citacion_parte',
    descripcion: '',
    responsable: 'Secretario del Comité',
    nuevoEstado: '',
  });

  // Modal Medidas Cautelares Ley 2365
  const [showMedidasModal, setShowMedidasModal] = useState(false);
  const [medidasForm, setMedidasForm] = useState({
    reubicacionFisica: true,
    cambioHorarioOModalidad: false,
    prohibicionContacto: true,
    apoyoPsicologicoArlEps: true,
    detalleMedidas: 'Medidas cautelares de protección integral dictadas bajo la Ley 2365 de 2024.',
  });

  // Modal Acta Trimestral State
  const [showActaModal, setShowActaModal] = useState(false);
  const [actaForm, setActaForm] = useState<any>({
    trimestre: 1,
    anio: new Date().getFullYear(),
    consecutivo: '',
    tipo: 'ordinaria_trimestral',
    centroTrabajo: 'Sede Principal',
    quorumVerificado: true,
    asistentes: [],
    estadisticasQuejas: {
      quejasRecibidasTrimestre: 0,
      enTramite: 0,
      acuerdosConciliatorios: 0,
      archivadasSinMerito: 0,
      remitidasAltaDireccion: 0,
    },
    desarrollo: {
      revisionQuejasTrimestre: '',
      campanasPreventivasAcoso: '',
      climaLaboralPsicosocial: '',
      proposicionesVarios: '',
    },
    compromisos: [],
  });

  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resConfig, resCasos, resActas, resElecciones] = await Promise.all([
        axios.get('/api/sgsst/convivencia/config', { headers }),
        axios.get('/api/sgsst/convivencia/casos', { headers }),
        axios.get('/api/sgsst/convivencia/actas', { headers }),
        axios.get('/api/sgsst/convivencia/elecciones', { headers }),
      ]);

      setConfig(resConfig.data);
      setCasos(resCasos.data.casos || []);
      setActas(resActas.data.actas || []);
      setElecciones(resElecciones.data.elecciones || []);
    } catch (err) {
      console.error('Error fetching convivencia data:', err);
      showToast({ message: 'Error al cargar datos de Convivencia Laboral', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Manejo de actuaciones confidenciales
  const handleAddActuacion = async () => {
    if (!selectedCaso || !actuacionForm.descripcion.trim()) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/sgsst/convivencia/casos/${selectedCaso._id}/actuacion`, actuacionForm, { headers });
      showToast({ message: 'Actuación registrada en el expediente confidencial', status: 'success' });
      setShowCasoModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: 'Error al registrar actuación', status: 'error' });
    }
  };

  // Manejo de medidas urgentes Ley 2365 de 2024
  const handleApplyMedidas = async () => {
    if (!selectedCaso) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/sgsst/convivencia/casos/${selectedCaso._id}/medidas-cautelares`, medidasForm, { headers });
      showToast({ message: '¡Medidas cautelares de protección activadas inmediatamente!', status: 'success' });
      setShowMedidasModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: 'Error al activar medidas cautelares', status: 'error' });
    }
  };

  const handleOpenNewActa = (trimestreNum: number = 1) => {
    setActaForm({
      trimestre: trimestreNum,
      anio: new Date().getFullYear(),
      tipo: 'ordinaria_trimestral',
      centroTrabajo: 'Sede Principal',
      quorumVerificado: true,
      asistentes: [],
      estadisticasQuejas: {
        quejasRecibidasTrimestre: casos.length,
        enTramite: casos.filter((c) => ['radicado', 'en_tramite'].includes(c.estado)).length,
        acuerdosConciliatorios: casos.filter((c) => c.estado === 'acuerdo_conciliatorio').length,
        archivadasSinMerito: casos.filter((c) => c.estado === 'archivado').length,
        remitidasAltaDireccion: casos.filter((c) => c.estado === 'no_acuerdo_alta_direccion').length,
      },
      desarrollo: {
        revisionQuejasTrimestre: 'Se analizaron los radicados confidenciales garantizando la reserva de ley.',
        campanasPreventivasAcoso: 'Ejecución de talleres de resolución asertiva de conflictos y respeto.',
        climaLaboralPsicosocial: 'Monitoreo preventivo del clima intralaboral y relaciones de mando.',
        proposicionesVarios: 'Coordinación de la próxima sesión ordinaria trimestral.',
      },
      compromisos: [],
    });
    setShowActaModal(true);
  };

  const handleSaveActa = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/sgsst/convivencia/actas', actaForm, { headers });
      showToast({ message: 'Acta trimestral guardada con éxito', status: 'success' });
      setShowActaModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al guardar acta', status: 'error' });
    }
  };

  const handleGenerateActaIA = async () => {
    setIsGeneratingIA(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        '/api/sgsst/convivencia/actas/generar-borrador-ia',
        {
          trimestre: actaForm.trimestre,
          anio: actaForm.anio,
        },
        { headers }
      );

      if (res.data.borrador) {
        setActaForm((prev: any) => ({
          ...prev,
          desarrollo: {
            ...prev.desarrollo,
            ...res.data.borrador,
          },
          compromisos: [
            ...(prev.compromisos || []),
            ...(res.data.borrador.compromisosSugeridos || []).map((c: any) => ({
              ...c,
              estado: 'pendiente',
            })),
          ],
        }));
        showToast({ message: '¡Acta trimestral redactada con rigor por Tenshi IA!', status: 'success' });
      }
    } catch (err) {
      showToast({ message: 'Error al generar acta con IA', status: 'error' });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ═══ Header de Convivencia y Prevención de Acoso ═══ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                  Comité de Convivencia Laboral (CCL)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Resolución 3461 de 2025 • Ley 2365 de 2024
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Órgano de prevención del acoso laboral, mediación y trámite expedito en máximo 65 días calendario con ruta prioritaria para acoso sexual
              </p>
            </div>
          </div>

          {/* Semáforo de Casos Badge */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 tracking-wider">Radicados Activos</p>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {config?.estadisticasCasos?.casosEnTramite || 0} en trámite
              </p>
            </div>
            {config?.estadisticasCasos?.casosAcosoSexualUrgente > 0 && (
              <span className="px-2 py-1 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5" /> Ley 2365
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Botonera Flotante Cápsula / Toolbar ═══ */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <button
            onClick={() => setActiveTab('casos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'casos'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            Bandeja Confidencial ({casos.length})
            {casos.some((c) => c.vencido65Dias) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('actas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'actas'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Actas Trimestrales ({actas.length})
          </button>

          <button
            onClick={() => setActiveTab('comites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'comites'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Comités por Sede (Res. 3461)
          </button>

          <button
            onClick={() => setActiveTab('elecciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'elecciones'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Vote className="w-4 h-4" />
            Votación Secreta
          </button>
        </div>
      </div>

      {/* ═══ TAB 1: BANDEJA CONFIDENCIAL & CONTADOR 65 DÍAS ═══ */}
      {activeTab === 'casos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Bandeja de Quejas y Expedientes con Reserva Legal
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Resolución 3461 de 2025: Máximo <strong>65 días calendario</strong> no prorrogables para conciliar, archivar o remitir a la Alta Dirección.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {casos.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Sin quejas radicadas actualmente</p>
                <p className="text-xs">El canal confidencial de convivencia en el portal del colaborador está activo y monitoreado.</p>
              </div>
            ) : (
              casos.map((caso) => {
                const isAcosoSexual = caso.tipoAcoso === 'sexual_ley_2365';
                const diasRestantes = caso.diasRestantes ?? 65;
                const isUrgentExpiration = diasRestantes <= 15 && diasRestantes >= 0;
                const isExpired = diasRestantes < 0 && !['acuerdo_conciliatorio', 'no_acuerdo_alta_direccion', 'archivado'].includes(caso.estado);

                return (
                  <div
                    key={caso._id}
                    className={`rounded-3xl border p-5 transition-all shadow-sm space-y-4 ${
                      isAcosoSexual
                        ? 'border-rose-500/40 bg-rose-500/[0.02] dark:bg-rose-950/10'
                        : isExpired
                        ? 'border-red-500/50 bg-red-500/[0.03]'
                        : isUrgentExpiration
                        ? 'border-amber-500/50 bg-amber-500/[0.02]'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-slate-800 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                            {caso.radicado}
                          </span>

                          {isAcosoSexual ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-1 shadow-sm">
                              <AlertOctagon className="w-3 h-3" /> ACOSO SEXUAL (LEY 2365/2024 - NO CONCILIABLE)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              ACOSO LABORAL (LEY 1010/2006)
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                            {caso.estado.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
                          Radicado: {new Date(caso.fechaRadicacion || caso.createdAt).toLocaleDateString('es-CO')} • Denunciante: {caso.denuncianteNombre} • Reportado: {caso.personaReportada} ({caso.cargoPersonaReportada || 'Cargo no especificado'})
                        </p>
                      </div>

                      {/* Semáforo de los 65 días */}
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-2xl border text-right ${
                          isExpired
                            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                            : isUrgentExpiration
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <p className="text-[9px] uppercase font-black tracking-wider">Término Res. 3461</p>
                          <p className="text-xs font-black flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {isExpired ? `VENCIDO (${Math.abs(diasRestantes)}d)` : `${diasRestantes} días restantes`}
                          </p>
                        </div>

                        {/* Botón de medidas urgentes si es acoso sexual */}
                        {isAcosoSexual && (
                          <button
                            onClick={() => {
                              setSelectedCaso(caso);
                              setShowMedidasModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold shadow-md hover:from-rose-700 active:scale-95"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Medidas Cautelares
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCaso(caso);
                            setShowCasoModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Expediente ({caso.actuaciones?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Resumen de Hechos */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                      <p className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">Descripción de los hechos:</p>
                      <p className="line-clamp-2 italic">{caso.descripcionHechos}</p>
                    </div>

                    {/* Medidas de protección activadas si existen */}
                    {caso.medidasProteccionUrgentes?.fechaActivacion && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Medidas Cautelares de Protección Activas (Ley 2365 de 2024)
                        </span>
                        <span className="text-[11px] font-medium">
                          {caso.medidasProteccionUrgentes.detalleMedidas}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 2: ACTAS TRIMESTRALES (Q1, Q2, Q3, Q4) ═══ */}
      {activeTab === 'actas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                Actas Trimestrales Obligatorias ({new Date().getFullYear()})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Resolución 3461 de 2025: Mínimo 1 reunión ordinaria cada 3 meses para monitoreo de quejas y prevención.
              </p>
            </div>

            <button
              onClick={() => handleOpenNewActa(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Nueva Acta Trimestral
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((q) => {
              const actaQ = actas.find((a) => a.trimestre === q);
              const nombresTrimestre = ['Trimestre 1 (Ene-Mar)', 'Trimestre 2 (Abr-Jun)', 'Trimestre 3 (Jul-Sep)', 'Trimestre 4 (Oct-Dic)'];

              return (
                <div
                  key={q}
                  className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                    actaQ
                      ? 'bg-white dark:bg-zinc-900 border-teal-500/40 shadow-sm hover:border-teal-500'
                      : 'bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800 border-dashed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase text-slate-400">Q{q}</span>
                      {actaQ ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {actaQ.estadoActa?.toUpperCase() || 'APROBADA'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          PENDIENTE
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 mb-1">
                      {nombresTrimestre[q - 1]}
                    </h4>

                    {actaQ ? (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 truncate font-semibold">
                        {actaQ.consecutivo}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2 italic">Sin acta registrada aún.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    {actaQ ? (
                      <button
                        onClick={() => {
                          setActaForm(actaQ);
                          setShowActaModal(true);
                        }}
                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 hover:bg-teal-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Examinar</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenNewActa(q)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold hover:bg-teal-50 hover:text-teal-600"
                      >
                        <Plus className="w-3 h-3" /> Diligenciar Q{q}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: COMITÉS POR SEDE / CENTRO DE TRABAJO ═══ */}
      {activeTab === 'comites' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                Comités por Centros de Trabajo (Resolución 3461 de 2025)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                El nuevo marco normativo permite e incentiva la conformación de comités de convivencia específicos por centro de trabajo o sucursal.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> Sedes y Centros Registrados:
              </p>
              <p>• Sede Principal ({config?.company?.companyName || 'Empresa Activa'}) — Comité Central Activo</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: VOTACIONES DEMOCRÁTICAS ═══ */}
      {activeTab === 'elecciones' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                Elección Democrática y Secreta de Convivencia
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Los colaboradores eligen de forma libre y 100% anónima a sus representantes ante el Comité de Convivencia Laboral.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {elecciones.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <Vote className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold">No hay elecciones creadas para Convivencia.</p>
              </div>
            ) : (
              elecciones.map((e) => {
                const votingUrl = `${window.location.origin}/sgsst-public/votaciones/${config?.company?.id || ''}?eleccionId=${e._id}`;

                return (
                  <div key={e._id} className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">{e.titulo}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Periodo: {e.periodo} • Habilitados: {e.totalVotantesHabilitados} • Votos: {e.totalVotosEmitidos}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrModalUrl(votingUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                        >
                          <QrCode className="w-4 h-4 text-indigo-600" /> QR Votación
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL EXPEDIENTE CONFIDENCIAL & ACTUACIONES ═══ */}
      {showCasoModal && selectedCaso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    Expediente Confidencial: {selectedCaso.radicado}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trámite conforme a la Resolución 3461 de 2025 • Término: 65 días
                  </p>
                </div>
              </div>
            </div>

            {/* Hechos y Denunciante */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 space-y-2 text-xs">
              <p><strong>Persona Denunciante:</strong> {selectedCaso.denuncianteNombre} ({selectedCaso.denuncianteCargo || 'Cargo reservado'})</p>
              <p><strong>Persona Reportada:</strong> {selectedCaso.personaReportada} ({selectedCaso.cargoPersonaReportada || 'N/A'})</p>
              <p><strong>Hechos Denunciados:</strong> {selectedCaso.descripcionHechos}</p>
            </div>

            {/* Historial de Actuaciones */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600">
                Bitácora de Actuaciones Registradas ({selectedCaso.actuaciones?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selectedCaso.actuaciones || []).map((act: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-indigo-600 uppercase">{act.tipo.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.fecha).toLocaleDateString('es-CO')}</span>
                    </div>
                    <p className="text-slate-700 dark:text-zinc-300">{act.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario Agregar Actuación */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Registrar Nueva Actuación / Diligencia
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tipo de Actuación</label>
                  <select
                    value={actuacionForm.tipo}
                    onChange={(e) => setActuacionForm({ ...actuacionForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                  >
                    <option value="citacion_parte">Citación a Audiencia Individual</option>
                    <option value="audiencia_conjunta">Audiencia de Mediación y Diálogo</option>
                    <option value="acta_acuerdo">Suscripción de Acta de Compromiso</option>
                    <option value="remision_alta_direccion">Remisión a Alta Dirección (Sin Acuerdo)</option>
                    <option value="archivo_sin_merito">Auto de Archivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Actualizar Estado del Caso</label>
                  <select
                    value={actuacionForm.nuevoEstado}
                    onChange={(e) => setActuacionForm({ ...actuacionForm, nuevoEstado: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                  >
                    <option value="">Mantener estado actual</option>
                    <option value="en_tramite">En Trámite</option>
                    <option value="audiencia_conciliacion">Audiencia Convocada</option>
                    <option value="acuerdo_conciliatorio">Acuerdo Conciliatorio (Cerrar)</option>
                    <option value="no_acuerdo_alta_direccion">Remitir a Alta Dirección</option>
                    <option value="archivado">Archivar Caso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Detalle / Conclusiones de la Actuación</label>
                <textarea
                  rows={3}
                  value={actuacionForm.descripcion}
                  onChange={(e) => setActuacionForm({ ...actuacionForm, descripcion: e.target.value })}
                  placeholder="Detalla lo tratado en la sesión o la citación..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCasoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleAddActuacion}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md active:scale-95"
              >
                Guardar Actuación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL MEDIDAS CAUTELARES URGENTES LEY 2365 ═══ */}
      {showMedidasModal && selectedCaso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">
                  Activación Inmediata de Medidas Cautelares
                </h3>
                <p className="text-xs text-slate-500">
                  Ley 2365 de 2024: Protección inmediata e integral a la víctima de acoso sexual
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medidasForm.reubicacionFisica}
                  onChange={(e) => setMedidasForm({ ...medidasForm, reubicacionFisica: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span className="font-bold">Reubicación física inmediata de puesto de trabajo o área</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medidasForm.prohibicionContacto}
                  onChange={(e) => setMedidasForm({ ...medidasForm, prohibicionContacto: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span className="font-bold">Orden estricta de prohibición de contacto e interacción laboral</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medidasForm.apoyoPsicologicoArlEps}
                  onChange={(e) => setMedidasForm({ ...medidasForm, apoyoPsicologicoArlEps: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span className="font-bold">Activación de acompañamiento psicológico con ARL / EPS</span>
              </label>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Detalle de las medidas dictadas</label>
                <textarea
                  rows={2}
                  value={medidasForm.detalleMedidas}
                  onChange={(e) => setMedidasForm({ ...medidasForm, detalleMedidas: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowMedidasModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyMedidas}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-md hover:bg-rose-700 active:scale-95"
              >
                Activar Medidas Urgentes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CREAR / EDITAR ACTA TRIMESTRAL ═══ */}
      {showActaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">
                    Acta Trimestral Ordinaria del CCL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trimestre Q{actaForm.trimestre} de {actaForm.anio} • Resolución 3461 de 2025
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateActaIA}
                disabled={isGeneratingIA}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
              >
                {isGeneratingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Redactar con Tenshi IA
              </button>
            </div>

            {/* Campos del Acta */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  1. Revisión Estadística Confidencial de Quejas del Trimestre
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.revisionQuejasTrimestre || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, revisionQuejasTrimestre: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  2. Campañas Preventivas y Talleres de Convivencia
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.campanasPreventivasAcoso || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, campanasPreventivasAcoso: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  3. Diagnóstico de Clima Laboral y Factores Psicosociales
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.climaLaboralPsicosocial || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, climaLaboralPsicosocial: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowActaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveActa}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md active:scale-95"
              >
                Guardar Acta Trimestral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL QR VOTACIÓN ═══ */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
              Código QR de Votación Secreta
            </h3>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCodeSVG value={qrModalUrl} size={180} level="H" />
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setQrModalUrl(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
