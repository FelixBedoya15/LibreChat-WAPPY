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
  Shield,
  PenTool,
  X,
  Award,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import SignaturePad from './SignaturePad';

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
  const [selectedActa, setSelectedActa] = useState<any>(null);
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
      casosAcosoSexualLey2365: 0,
    },
    desarrollo: {
      revisionQuejasTrimestre: '',
      campanasPreventivasAcoso: '',
      climaLaboralPsicosocial: '',
      proposicionesVarios: '',
    },
    compromisos: [],
  });

  // Firma digital
  const [signingAssistantIndex, setSigningAssistantIndex] = useState<number | null>(null);

  // Modal Convocatoria Elecciones
  const [showEleccionModal, setShowEleccionModal] = useState(false);
  const [eleccionForm, setEleccionForm] = useState<any>({
    titulo: `Elecciones Comité de Convivencia ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
    candidatos: [],
  });
  const [newCandidato, setNewCandidato] = useState({ nombre: '', cargo: '', cedula: '' });

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
    const defaultAsistentes: any[] = [];
    const activeComite = config?.comites?.find((c: any) => c.estado === 'activo') || config?.comites?.[0];
    if (activeComite) {
      (activeComite.representantesEmpleador || []).forEach((r: any) => {
        defaultAsistentes.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Empleador (${r.rol})`,
          asistio: true,
          firma: null,
        });
      });
      (activeComite.representantesTrabajadores || []).forEach((r: any) => {
        defaultAsistentes.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Trabajadores (${r.rol})`,
          asistio: true,
          firma: null,
        });
      });
    }

    setActaForm({
      trimestre: trimestreNum,
      anio: new Date().getFullYear(),
      tipo: 'ordinaria_trimestral',
      centroTrabajo: activeComite?.centroTrabajo || 'Sede Principal',
      quorumVerificado: true,
      asistentes: defaultAsistentes,
      estadisticasQuejas: {
        quejasRecibidasTrimestre: casos.length,
        enTramite: casos.filter((c) => ['radicado', 'en_tramite'].includes(c.estado)).length,
        acuerdosConciliatorios: casos.filter((c) => c.estado === 'acuerdo_conciliatorio').length,
        archivadasSinMerito: casos.filter((c) => c.estado === 'archivado').length,
        remitidasAltaDireccion: casos.filter((c) => c.estado === 'no_acuerdo_alta_direccion').length,
        casosAcosoSexualLey2365: casos.filter((c) => c.tipoAcoso === 'sexual_ley_2365').length,
      },
      desarrollo: {
        revisionQuejasTrimestre: 'Se analizaron los radicados confidenciales garantizando la reserva de ley.',
        campanasPreventivasAcoso: 'Ejecución de talleres de resolución asertiva de conflictos y respeto.',
        climaLaboralPsicosocial: 'Monitoreo preventivo del clima intralaboral y relaciones de mando.',
        proposicionesVarios: 'Coordinación de la próxima sesión ordinaria trimestral.',
      },
      compromisos: [
        {
          accion: 'Seguimiento a clima psicosocial y acciones preventivas del trimestre',
          responsable: defaultAsistentes[0]?.nombre || 'Secretario del CCL',
          fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estado: 'pendiente',
        },
      ],
    });
    setSelectedActa(null);
    setShowActaModal(true);
  };

  const handleEditActa = (acta: any) => {
    setSelectedActa(acta);
    setActaForm({
      id: acta._id,
      ...acta,
      asistentes: acta.asistentes || [],
      compromisos: acta.compromisos || [],
    });
    setShowActaModal(true);
  };

  const handleDeleteActa = async (actaId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta acta trimestral? Esta acción también cancelará los compromisos vinculados en el Centro de Control.')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/sgsst/convivencia/actas/${actaId}`, { headers });
      showToast({ message: 'Acta eliminada con éxito', status: 'success' });
      fetchAllData();
    } catch (err: any) {
      showToast({ message: 'Error al eliminar acta', status: 'error' });
    }
  };

  const handleSaveActa = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/sgsst/convivencia/actas', actaForm, { headers });
      showToast({ message: 'Acta trimestral guardada con éxito (Compromisos sincronizados con el Centro de Control)', status: 'success' });
      setShowActaModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al guardar acta', status: 'error' });
    }
  };

  const handleCreateEleccion = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/sgsst/convivencia/elecciones', eleccionForm, { headers });
      showToast({ message: 'Convocatoria a elecciones creada y activa', status: 'success' });
      setShowEleccionModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al crear elección', status: 'error' });
    }
  };

  const handleEscrutinio = async (eleccionId: string) => {
    if (!window.confirm('¿Desea cerrar la votación y generar el acta oficial de escrutinio?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/sgsst/convivencia/elecciones/${eleccionId}/escrutinio`, {}, { headers });
      showToast({ message: 'Escrutinio completado con éxito', status: 'success' });
      fetchAllData();
    } catch (err) {
      showToast({ message: 'Error al realizar escrutinio', status: 'error' });
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

      {/* ═══ Botonera Flotante Cápsula / Toolbar (WAPPY Design System) ═══ */}
      <SGSSTToolbar
        historyButtons={[
          {
            id: 'tb-convivencia-casos',
            onClick: () => setActiveTab('casos'),
            label: `Bandeja Confidencial (${casos.length})`,
            icon: Lock,
            title: 'Ver Casos y Quejas con Reserva Legal (Res. 3461/2025)',
            variant: 'history',
            active: activeTab === 'casos',
            badge: casos.some((c) => c.vencido65Dias) ? '!' : casos.length > 0 ? casos.length : undefined,
          },
          {
            id: 'tb-convivencia-actas',
            onClick: () => setActiveTab('actas'),
            label: `Actas Trimestrales (${actas.length})`,
            icon: FileText,
            title: 'Ver Actas Trimestrales Ordinarias y Extraordinarias',
            variant: 'history',
            active: activeTab === 'actas',
            badge: actas.length > 0 ? actas.length : undefined,
          },
          {
            id: 'tb-convivencia-comites',
            onClick: () => setActiveTab('comites'),
            label: 'Comités por Sede',
            icon: Building2,
            title: 'Conformación Paritaria y Comités por Centro de Trabajo',
            variant: 'history',
            active: activeTab === 'comites',
          },
          {
            id: 'tb-convivencia-elecciones',
            onClick: () => setActiveTab('elecciones'),
            label: 'Votación Secreta Digital',
            icon: Vote,
            title: 'Procesos de Elección Democrática y Secreta',
            variant: 'history',
            active: activeTab === 'elecciones',
            badge: config?.eleccionActiva ? '!' : undefined,
          },
        ]}
      />

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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
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
                      <>
                        <button
                          onClick={() => handleEditActa(actaQ)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100"
                          title="Examinar y Editar Acta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Examinar</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteActa(actaQ._id)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                          title="Eliminar Acta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Eliminar</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenNewActa(q)}
                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-600 dark:text-teal-300"
                        title={`Diligenciar Acta Q${q}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Diligenciar Q{q}</span>
                        </div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                Comités por Centros de Trabajo (Resolución 3461 de 2025)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                El nuevo marco normativo permite e incentiva la conformación de comités de convivencia específicos por sede o centro de trabajo.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('elecciones')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Vote className="w-4 h-4" />
              Convocar Votación Secreta
            </button>
          </div>

          <div className="space-y-4">
            {(!config?.comites || config.comites.length === 0) ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Sin comités de convivencia conformados</p>
                <p className="text-xs">Convoque a elecciones o registre los representantes para formalizar el comité.</p>
              </div>
            ) : (
              config.comites.map((comite: any, cIdx: number) => (
                <div key={comite._id || cIdx} className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">
                          {comite.centroTrabajo || 'Sede Principal'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Periodo: {new Date(comite.periodoInicio).toLocaleDateString('es-CO')} – {new Date(comite.periodoFin).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {comite.estado?.toUpperCase() || 'ACTIVO'}
                    </span>
                  </div>

                  {/* Representantes Empleador */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Representantes del Empleador (Designados por Gerencia)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(comite.representantesEmpleador || []).length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs text-slate-400 italic">
                          Sin representantes del empleador designados.
                        </div>
                      ) : (
                        comite.representantesEmpleador.map((r: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{r.nombre}</p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">{r.cargo} • C.C. {r.cedula}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              {r.rol}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Representantes Trabajadores */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Representantes de los Trabajadores (Elegidos por Votación Libre y Secreta)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(comite.representantesTrabajadores || []).length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs text-slate-400 italic">
                          Sin representantes de los trabajadores electos.
                        </div>
                      ) : (
                        comite.representantesTrabajadores.map((r: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{r.nombre}</p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">{r.cargo} • C.C. {r.cedula}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                              {r.rol}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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

            <button
              onClick={() => {
                setEleccionForm({
                  titulo: `Elecciones Comité de Convivencia ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  candidatos: [],
                });
                setShowEleccionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Vote className="w-4 h-4" />
              Nueva Convocatoria
            </button>
          </div>

          <div className="space-y-4">
            {elecciones.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <Vote className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No hay elecciones creadas para Convivencia.</p>
                <p className="text-xs">Haga clic en Nueva Convocatoria para iniciar un proceso electoral.</p>
              </div>
            ) : (
              elecciones.map((e) => {
                const votingUrl = `${window.location.origin}/sgsst-public/votaciones/${config?.company?.id || ''}?eleccionId=${e._id}`;

                return (
                  <div key={e._id} className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">{e.titulo}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            e.estado === 'activa'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}>
                            {e.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Periodo: {e.periodo} • Habilitados: {e.totalVotantesHabilitados} • Votos Emitidos: {e.totalVotosEmitidos}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {e.estado === 'activa' && (
                          <>
                            <button
                              onClick={() => setQrModalUrl(votingUrl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all"
                            >
                              <QrCode className="w-4 h-4 text-indigo-600" /> QR Urna
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(votingUrl);
                                showToast({ message: 'Enlace de votación copiado al portapapeles', status: 'success' });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all"
                            >
                              <Share2 className="w-4 h-4 text-indigo-600" />
                              Copiar Link
                            </button>

                            <button
                              onClick={() => handleEscrutinio(e._id)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Cerrar & Escrutar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Candidatos y Resultados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {(e.candidatos || []).map((cand: any) => (
                        <div key={cand.id || cand.cedula} className="p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{cand.nombre}</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400">{cand.cargo} • CC: {cand.cedula}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                              {cand.votos || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 block">votos</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {e.actaEscrutinioTexto && (
                      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-700 dark:text-zinc-300">
                        <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Acta Oficial de Escrutinio:
                        </p>
                        <p>{e.actaEscrutinioTexto}</p>
                      </div>
                    )}
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
              <button
                type="button"
                onClick={() => setShowCasoModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleAddActuacion}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
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
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">
                    Activación Inmediata de Medidas Cautelares
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Ley 2365 de 2024: Protección inmediata e integral a la víctima de acoso sexual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMedidasModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyMedidas}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white active:scale-95 transition-all"
              >
                <AlertOctagon className="w-4 h-4" />
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

              {/* Botón IA Tenshi + Botón Cerrar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateActaIA}
                  disabled={isGeneratingIA}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
                >
                  {isGeneratingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Redactar con Tenshi IA
                </button>
                <button
                  type="button"
                  onClick={() => setShowActaModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metadatos del Acta */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Trimestre</label>
                <select
                  value={actaForm.trimestre}
                  onChange={(e) => setActaForm({ ...actaForm, trimestre: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                >
                  <option value={1}>Q1 (Ene - Mar)</option>
                  <option value={2}>Q2 (Abr - Jun)</option>
                  <option value={3}>Q3 (Jul - Sep)</option>
                  <option value={4}>Q4 (Oct - Dic)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Año</label>
                <input
                  type="number"
                  value={actaForm.anio}
                  onChange={(e) => setActaForm({ ...actaForm, anio: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Consecutivo</label>
                <input
                  type="text"
                  placeholder={`ACTA-COCOLAB-${actaForm.anio}-Q${actaForm.trimestre}`}
                  value={actaForm.consecutivo || ''}
                  onChange={(e) => setActaForm({ ...actaForm, consecutivo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Sede / Centro</label>
                <input
                  type="text"
                  value={actaForm.centroTrabajo || 'Sede Principal'}
                  onChange={(e) => setActaForm({ ...actaForm, centroTrabajo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Asistentes y Firmas Digitales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Asistentes y Firmas Digitales ({actaForm.asistentes?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                    Validez jurídica conforme al Dec. 1072/2015 Art. 2.2.4.6.12 para actas oficiales
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nombre = prompt('Nombre completo del asistente:');
                    if (!nombre) return;
                    const cedula = prompt('Número de identificación (C.C.):') || '';
                    const rol = prompt('Rol o estamento (ej: Representante Empleador, Representante Trabajadores, Asesor Externo):') || 'Miembro CCL';
                    setActaForm({
                      ...actaForm,
                      asistentes: [
                        ...(actaForm.asistentes || []),
                        { nombre, cedula, rol, asistio: true, firma: null },
                      ],
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Asistente
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(actaForm.asistentes || []).map((asistente: any, aIdx: number) => (
                  <div key={aIdx} className="p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{asistente.nombre}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{asistente.rol} • C.C. {asistente.cedula}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {asistente.firma ? (
                        <div className="flex items-center gap-1">
                          <img src={asistente.firma} alt="Firma" className="h-7 max-w-[70px] border border-teal-500/30 rounded bg-white px-1 object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...actaForm.asistentes];
                              updated[aIdx].firma = null;
                              setActaForm({ ...actaForm, asistentes: updated });
                            }}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Borrar firma para volver a firmar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSigningAssistantIndex(aIdx)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 text-[10px] font-bold"
                          title="Firmar en pantalla táctil / ratón"
                        >
                          <PenTool className="w-3 h-3 mr-1" />
                          <span>Firmar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const updated = actaForm.asistentes.filter((_: any, idx: number) => idx !== aIdx);
                          setActaForm({ ...actaForm, asistentes: updated });
                        }}
                        className="text-slate-300 hover:text-red-400 p-1"
                        title="Quitar asistente"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desarrollo Temático del Acta */}
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

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  4. Proposiciones, Varios y Próxima Sesión Ordinaria
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.proposicionesVarios || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, proposicionesVarios: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            {/* Compromisos del Acta (Sincronizados con Kanban ACPM) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Plan de Acción / Compromisos Asumidos ({actaForm.compromisos?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                    Los compromisos se sincronizan automáticamente como tarjetas de acción en el Centro de Control (Kanban ACPM)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActaForm({
                      ...actaForm,
                      compromisos: [
                        ...(actaForm.compromisos || []),
                        {
                          accion: '',
                          responsable: '',
                          fechaLimite: new Date().toISOString().split('T')[0],
                          estado: 'pendiente',
                        },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Compromiso
                </button>
              </div>

              {(actaForm.compromisos || []).map((comp: any, cIdx: number) => (
                <div key={cIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40">
                  <input
                    type="text"
                    placeholder="Acción preventiva o acuerdo..."
                    value={comp.accion || ''}
                    onChange={(e) => {
                      const updated = [...actaForm.compromisos];
                      updated[cIdx].accion = e.target.value;
                      setActaForm({ ...actaForm, compromisos: updated });
                    }}
                    className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Responsable..."
                    value={comp.responsable || ''}
                    onChange={(e) => {
                      const updated = [...actaForm.compromisos];
                      updated[cIdx].responsable = e.target.value;
                      setActaForm({ ...actaForm, compromisos: updated });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={comp.fechaLimite || ''}
                      onChange={(e) => {
                        const updated = [...actaForm.compromisos];
                        updated[cIdx].fechaLimite = e.target.value;
                        setActaForm({ ...actaForm, compromisos: updated });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = actaForm.compromisos.filter((_: any, idx: number) => idx !== cIdx);
                        setActaForm({ ...actaForm, compromisos: updated });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowActaModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveActa}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Acta Trimestral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CONVOCATORIA ELECCIONES CONVIVENCIA ═══ */}
      {showEleccionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Vote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    Nueva Convocatoria Electoral — Convivencia
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Abre la urna digital anónima para que todos los trabajadores elijan a sus representantes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEleccionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Título de la Convocatoria</label>
                <input
                  type="text"
                  value={eleccionForm.titulo}
                  onChange={(e) => setEleccionForm({ ...eleccionForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Periodo Constitucional</label>
                <input
                  type="text"
                  value={eleccionForm.periodo}
                  onChange={(e) => setEleccionForm({ ...eleccionForm, periodo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                  Candidatos Postulados ({eleccionForm.candidatos?.length || 0})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                  {(eleccionForm.candidatos || []).map((cand: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-200">{cand.nombre}</p>
                        <p className="text-[11px] text-slate-500">{cand.cargo} • CC: {cand.cedula}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = eleccionForm.candidatos.filter((_: any, i: number) => i !== idx);
                          setEleccionForm({ ...eleccionForm, candidatos: updated });
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Formulario rápido para añadir candidato */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre completo..."
                    value={newCandidato.nombre}
                    onChange={(e) => setNewCandidato({ ...newCandidato, nombre: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                  />
                  <input
                    type="text"
                    placeholder="Cédula..."
                    value={newCandidato.cedula}
                    onChange={(e) => setNewCandidato({ ...newCandidato, cedula: e.target.value })}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                  />
                  <input
                    type="text"
                    placeholder="Cargo..."
                    value={newCandidato.cargo}
                    onChange={(e) => setNewCandidato({ ...newCandidato, cargo: e.target.value })}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCandidato.nombre.trim()) return;
                      setEleccionForm({
                        ...eleccionForm,
                        candidatos: [
                          ...(eleccionForm.candidatos || []),
                          { ...newCandidato, id: Date.now().toString() },
                        ],
                      });
                      setNewCandidato({ nombre: '', cargo: '', cedula: '' });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEleccionModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateEleccion}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white active:scale-95 transition-all"
              >
                <Vote className="w-4 h-4" />
                Publicar Convocatoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL QR VOTACIÓN ═══ */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setQrModalUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
              Código QR de Votación Secreta
            </h3>
            <p className="text-xs text-slate-500">
              Imprime o proyecta este código para que los trabajadores voten de forma anónima desde su celular
            </p>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCodeSVG value={qrModalUrl} size={180} level="H" />
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setQrModalUrl(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL LIENZO DE FIRMA DIGITAL ═══ */}
      <SignaturePad
        isOpen={signingAssistantIndex !== null}
        onClose={() => setSigningAssistantIndex(null)}
        title={`Firma Digital de ${actaForm.asistentes?.[signingAssistantIndex ?? 0]?.nombre || 'Participante'}`}
        onSave={(b64) => {
          if (signingAssistantIndex !== null) {
            const updated = [...actaForm.asistentes];
            updated[signingAssistantIndex].firma = b64;
            setActaForm({ ...actaForm, asistentes: updated });
            setSigningAssistantIndex(null);
            showToast({ message: 'Firma registrada correctamente', status: 'success' });
          }
        }}
      />
    </div>
  );
}
