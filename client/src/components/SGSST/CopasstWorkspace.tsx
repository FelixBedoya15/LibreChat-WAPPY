import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Download,
  Share2,
  Clock,
  Printer,
  ChevronRight,
  UserCheck,
  Shield,
  QrCode,
  ExternalLink,
  Loader2,
  Vote,
  BarChart3,
  Search,
  PenTool,
  X,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
import { SignaturePad } from './SignaturePad';

interface CopasstWorkspaceProps {
  // Optional props
}

export default function CopasstWorkspace({}: CopasstWorkspaceProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'actas' | 'conformacion' | 'inspecciones' | 'elecciones'>('actas');
  const [signingAssistantIndex, setSigningAssistantIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [actas, setActas] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [elecciones, setElecciones] = useState<any[]>([]);

  // Modal Acta State
  const [showActaModal, setShowActaModal] = useState(false);
  const [selectedActa, setSelectedActa] = useState<any>(null);
  const [actaForm, setActaForm] = useState<any>({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    tipo: 'ordinaria_mensual',
    lugar: 'Sala Principal de Reuniones / Híbrida',
    horaInicio: '08:00',
    horaFin: '10:00',
    quorumVerificado: true,
    asistentes: [],
    desarrollo: {
      lecturaActaAnterior: 'Aprobada sin observaciones.',
      analisisAccidentalidad: '',
      inspeccionesSeguridad: '',
      capacitacionesYCampanas: '',
      proposicionesVarios: '',
    },
    compromisos: [],
  });

  // Modal Elección State
  const [showEleccionModal, setShowEleccionModal] = useState(false);
  const [eleccionForm, setEleccionForm] = useState<any>({
    titulo: 'Elección de Representantes de los Trabajadores COPASST',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
    candidatos: [],
  });

  // IA Generation loading
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resConfig, resActas, resWorkers, resElecciones] = await Promise.all([
        axios.get('/api/sgsst/copasst/config', { headers }),
        axios.get('/api/sgsst/copasst/actas', { headers }),
        axios.get('/api/sgsst/copasst/trabajadores', { headers }),
        axios.get('/api/sgsst/copasst/elecciones', { headers }),
      ]);

      setConfig(resConfig.data);
      setActas(resActas.data.actas || []);
      setWorkers(resWorkers.data.workers || []);
      setElecciones(resElecciones.data.elecciones || []);
    } catch (err) {
      console.error('Error fetching copasst data:', err);
      showToast({ message: 'Error al cargar datos del COPASST', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Handle open Acta creation
  const handleOpenNewActa = () => {
    // Inicializar asistentes con los miembros del comité activo
    const defaultAsistentes: any[] = [];
    if (config?.comite) {
      (config.comite.representantesEmpleador || []).forEach((r: any) => {
        defaultAsistentes.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Empleador (${r.rol})`,
          asistio: true,
        });
      });
      (config.comite.representantesTrabajadores || []).forEach((r: any) => {
        defaultAsistentes.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Trabajadores (${r.rol})`,
          asistio: true,
        });
      });
      if (config.comite.vigia?.nombre) {
        defaultAsistentes.push({
          nombre: config.comite.vigia.nombre,
          cedula: config.comite.vigia.cedula,
          cargo: config.comite.vigia.cargo,
          rol: 'Vigía de SST',
          asistio: true,
        });
      }
    }

    setActaForm({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      tipo: 'ordinaria_mensual',
      lugar: 'Sala Principal de Reuniones / Híbrida',
      horaInicio: '08:00',
      horaFin: '10:00',
      quorumVerificado: true,
      asistentes: defaultAsistentes,
      desarrollo: {
        lecturaActaAnterior: 'Aprobada sin modificaciones.',
        analisisAccidentalidad: 'Cero accidentes de trabajo en el periodo analizado.',
        inspeccionesSeguridad: 'Ronda de inspección de extintores y botiquines sin hallazgos críticos.',
        capacitacionesYCampanas: 'Seguimiento satisfactorio al cronograma anual de capacitaciones.',
        proposicionesVarios: 'Se coordina la fecha de la próxima sesión ordinaria.',
      },
      compromisos: [
        {
          accion: 'Seguimiento a inspección de botiquines y reposición de insumos',
          responsable: defaultAsistentes[0]?.nombre || 'Coordinador SST',
          fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      consecutivo: acta.consecutivo,
      mes: acta.mes,
      anio: acta.anio,
      tipo: acta.tipo,
      fecha: acta.fecha ? new Date(acta.fecha).toISOString().split('T')[0] : '',
      horaInicio: acta.horaInicio,
      horaFin: acta.horaFin,
      lugar: acta.lugar,
      quorumVerificado: acta.quorumVerificado,
      asistentes: acta.asistentes || [],
      desarrollo: acta.desarrollo || {},
      compromisos: acta.compromisos || [],
      estadoActa: acta.estadoActa,
    });
    setShowActaModal(true);
  };

  const handleSaveActa = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/sgsst/copasst/actas', actaForm, { headers });
      showToast({ message: 'Acta guardada exitosamente', status: 'success' });
      setShowActaModal(false);
      fetchAllData();
    } catch (err: any) {
      console.error('Error saving acta:', err);
      showToast({ message: err.response?.data?.error || 'Error al guardar el acta', status: 'error' });
    }
  };

  const handleDeleteActa = async (actaId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta acta mensual?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/sgsst/copasst/actas/${actaId}`, { headers });
      showToast({ message: 'Acta eliminada', status: 'success' });
      fetchAllData();
    } catch (err) {
      showToast({ message: 'Error al eliminar acta', status: 'error' });
    }
  };

  const handleGenerateWithAI = async () => {
    setIsGeneratingIA(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        '/api/sgsst/copasst/actas/generar-borrador-ia',
        {
          mes: actaForm.mes,
          anio: actaForm.anio,
          accidentalidadReportada: actaForm.desarrollo?.analisisAccidentalidad,
          inspeccionesRealizadas: actaForm.desarrollo?.inspeccionesSeguridad,
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
        showToast({ message: '¡Acta redactada con éxito por Tenshi IA!', status: 'success' });
      }
    } catch (err) {
      console.error('Error generating with AI:', err);
      showToast({ message: 'Error al redactar con IA', status: 'error' });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const handleCreateEleccion = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/sgsst/copasst/elecciones', eleccionForm, { headers });
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
      await axios.post(`/api/sgsst/copasst/elecciones/${eleccionId}/escrutinio`, {}, { headers });
      showToast({ message: 'Escrutinio completado con éxito', status: 'success' });
      fetchAllData();
    } catch (err) {
      showToast({ message: 'Error al realizar escrutinio', status: 'error' });
    }
  };

  const isVigia = config?.company?.modalidadSugerida === 'vigia';

  return (
    <div className="w-full space-y-6">
      {/* ═══ Header de Gobernanza Paritaria ═══ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                  {isVigia ? 'Vigía de Seguridad y Salud en el Trabajo' : 'COPASST (Comité Paritario SST)'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  {isVigia ? 'Menos de 10 Trabajadores' : `${config?.company?.workerCount || 0} Trabajadores • ${config?.company?.representantesPorParte || 1} Miembro(s) por parte`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Órgano paritario de promoción, vigilancia y consulta de la salud laboral • Resolución 2013/1986 • Dec. 1072/2015 Art. 2.2.4.6.8 • Res. 0312/2019
              </p>
            </div>
          </div>

          {/* Cumplimiento Anual Badge */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 tracking-wider">Actas Anuales</p>
              <p className="text-base font-black text-teal-600 dark:text-teal-400">
                {config?.actasCompletadas || 0} / 12 ({config?.porcentajeCumplimiento || 0}%)
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-xs">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Botonera Flotante Cápsula / Toolbar (WAPPY Design System) ═══ */}
      <SGSSTToolbar
        historyButtons={[
          {
            id: 'tb-tab-actas',
            onClick: () => setActiveTab('actas'),
            label: `Actas Mensuales (${actas.length})`,
            icon: FileText,
            title: 'Ver Actas Mensuales Ordinarias del COPASST',
            variant: 'history',
            active: activeTab === 'actas',
            badge: actas.length > 0 ? actas.length : undefined,
          },
          {
            id: 'tb-tab-conformacion',
            onClick: () => setActiveTab('conformacion'),
            label: 'Conformación & Miembros',
            icon: Users,
            title: 'Estructura Paritaria y Miembros Oficiales',
            variant: 'history',
            active: activeTab === 'conformacion',
          },
          {
            id: 'tb-tab-elecciones',
            onClick: () => setActiveTab('elecciones'),
            label: 'Votación Secreta Digital',
            icon: Vote,
            title: 'Convocatorias y Procesos Electorales',
            variant: 'history',
            active: activeTab === 'elecciones',
            badge: config?.eleccionActiva ? '!' : undefined,
          },
        ]}
        customSections={[
          <div key="copasst-actions-bar" className="flex items-center gap-1.5">
            <ToolbarButton
              id="tb-nueva-acta"
              onClick={handleOpenNewActa}
              label="Nueva Acta Mensual"
              icon={Plus}
              title="Registrar nueva acta ordinaria o extraordinaria"
              variant="ai"
            />
            <ToolbarButton
              id="tb-convocar-eleccion"
              onClick={() => {
                setEleccionForm({
                  titulo: `Elecciones COPASST ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  candidatos: [],
                });
                setShowEleccionModal(true);
              }}
              label="Convocar Elección"
              icon={Vote}
              title="Abrir nuevo proceso electoral con votación anónima"
              variant="dummy"
            />
          </div>,
        ]}
      />

      {/* ═══ TAB 1: ACTAS MENSUALES ═══ */}
      {activeTab === 'actas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                12 Actas Ordinarias Obligatorias ({new Date().getFullYear()})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Art. 2.2.4.6.8 Dec. 1072/15: Mínimo una reunión mensual con verificación de quórum y archivo por 20 años.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNewActa}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
              >
                <Plus className="w-4 h-4" />
                Nueva Acta Mensual
              </button>
            </div>
          </div>

          {/* Grid de las 12 Actas del Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mesNum) => {
              const meses = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ];
              const actaDelMes = actas.find((a) => a.mes === mesNum);
              const isPassed = mesNum <= new Date().getMonth() + 1;

              return (
                <div
                  key={mesNum}
                  className={`rounded-2xl border p-4 transition-all duration-300 relative group flex flex-col justify-between ${
                    actaDelMes
                      ? 'bg-white dark:bg-zinc-900 border-teal-500/40 shadow-sm hover:border-teal-500 hover:shadow-md'
                      : isPassed
                      ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.02] border-amber-500/30 border-dashed'
                      : 'bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Mes {String(mesNum).padStart(2, '0')}
                      </span>
                      {actaDelMes ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {actaDelMes.estadoActa?.toUpperCase() || 'REGISTRADA'}
                        </span>
                      ) : isPassed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          PENDIENTE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                          PROGRAMADA
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 mb-1">
                      {meses[mesNum - 1]}
                    </h4>

                    {actaDelMes ? (
                      <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400 mt-2">
                        <p className="font-semibold text-slate-700 dark:text-zinc-300 truncate">
                          {actaDelMes.consecutivo}
                        </p>
                        <p className="text-[11px]">
                          Asistentes: {actaDelMes.asistentes?.length || 0} • Compromisos: {actaDelMes.compromisos?.length || 0}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 italic">
                        Sin acta registrada para este periodo.
                      </p>
                    )}
                  </div>

                  {/* Micro-Botones Expansibles al Hover */}
                  <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    {actaDelMes ? (
                      <>
                        <button
                          onClick={() => handleEditActa(actaDelMes)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100"
                          title="Ver y Editar Acta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Examinar</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDeleteActa(actaDelMes._id)}
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
                        onClick={() => {
                          setActaForm((prev: any) => ({ ...prev, mes: mesNum }));
                          handleOpenNewActa();
                        }}
                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-600 dark:text-teal-300"
                        title="Diligenciar Acta del Mes"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Diligenciar</span>
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

      {/* ═══ TAB 2: CONFORMACIÓN & MIEMBROS ═══ */}
      {activeTab === 'conformacion' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                  Representación Paritaria (Periodo de 2 Años)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Garantía de 4 horas semanales laborales para labores del COPASST (Decreto 1295 de 1994, Art. 63).
                </p>
              </div>

              <button
                onClick={() => setActiveTab('elecciones')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Vote className="w-4 h-4" />
                Convocar Votación Secreta
              </button>
            </div>

            {/* Representantes Empleador */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Representantes del Empleador (Designados por Gerencia)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(config?.comite?.representantesEmpleador || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-xs text-slate-400 italic">
                    Sin representantes del empleador designados aún.
                  </div>
                ) : (
                  (config.comite.representantesEmpleador || []).map((r: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{r.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{r.cargo} • CC: {r.cedula}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        {r.rol}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Representantes Trabajadores */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Representantes de los Trabajadores (Elegidos por Votación Libre y Secreta)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(config?.comite?.representantesTrabajadores || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-xs text-slate-400 italic">
                    Sin representantes de los trabajadores registrados. Inicia un proceso electoral.
                  </div>
                ) : (
                  (config.comite.representantesTrabajadores || []).map((r: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{r.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{r.cargo} • CC: {r.cedula}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 block mb-1">
                          {r.rol}
                        </span>
                        {r.votosObtenidos > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {r.votosObtenidos} votos
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: VOTACIONES DEMOCRÁTICAS SECRETAS ═══ */}
      {activeTab === 'elecciones' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                Procesos de Elección Democrática y Secreta
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Garantiza el voto libre, secreto y anónimo exigido por la Resolución 2013/1986. Los colaboradores sufragan desde el portal del trabajador.
              </p>
            </div>

            <button
              onClick={() => {
                setEleccionForm({
                  titulo: `Elección COPASST ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  candidatos: workers.slice(0, 4).map((w) => ({
                    id: w.cedula,
                    nombre: w.nombre,
                    cedula: w.cedula,
                    cargo: w.cargo,
                    propuesta: 'Compromiso por la prevención y el bienestar de todos.',
                    votos: 0,
                  })),
                });
                setShowEleccionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Nueva Convocatoria Electoral
            </button>
          </div>

          <div className="space-y-4">
            {elecciones.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <Vote className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                <p className="text-sm font-bold">No hay elecciones creadas.</p>
                <p className="text-xs">Crea una nueva convocatoria para abrir la votación digital anónima a tus trabajadores.</p>
              </div>
            ) : (
              elecciones.map((e) => {
                const votingUrl = `${window.location.origin}/sgsst-public/votaciones/${config?.company?.id || ''}?eleccionId=${e._id}`;

                return (
                  <div
                    key={e._id}
                    className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">{e.titulo}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            e.estado === 'activa'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                          }`}>
                            {e.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          Periodo: {e.periodo} • Habilitados: {e.totalVotantesHabilitados} • Votos Emitidos: {e.totalVotosEmitidos}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {e.estado === 'activa' && (
                          <>
                            <button
                              onClick={() => setQrModalUrl(votingUrl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100"
                            >
                              <QrCode className="w-4 h-4 text-teal-600" />
                              Código QR
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(votingUrl);
                                showToast({ message: 'Enlace de votación copiado al portapapeles', status: 'success' });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100"
                            >
                              <Share2 className="w-4 h-4 text-teal-600" />
                              Copiar Link
                            </button>

                            <button
                              onClick={() => handleEscrutinio(e._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-sm hover:from-orange-600 active:scale-95"
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
                        <div key={cand.id} className="p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{cand.nombre}</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400">{cand.cargo}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-teal-600 dark:text-teal-400">
                              {cand.votos || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 block">votos</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {e.actaEscrutinioTexto && (
                      <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-xs text-slate-700 dark:text-zinc-300">
                        <p className="font-bold text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1">
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

      {/* ═══ MODAL CREAR / EDITAR ACTA MENSUAL ═══ */}
      {showActaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">
                    {selectedActa ? 'Examinar / Editar Acta COPASST' : 'Diligenciar Nueva Acta Ordinaria'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Mes {actaForm.mes} de {actaForm.anio} • Quórum Reglamentario y Tareas
                  </p>
                </div>
              </div>

              {/* Botón IA Tenshi */}
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingIA}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
              >
                {isGeneratingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Redactar con Tenshi IA
              </button>
            </div>

            {/* Metadatos Básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Consecutivo</label>
                <input
                  type="text"
                  value={actaForm.consecutivo || ''}
                  onChange={(e) => setActaForm({ ...actaForm, consecutivo: e.target.value })}
                  placeholder="ACTA-COPASST-2025-001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Lugar de la Sesión</label>
                <input
                  type="text"
                  value={actaForm.lugar || ''}
                  onChange={(e) => setActaForm({ ...actaForm, lugar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Horario (Inicio - Fin)</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={actaForm.horaInicio || '08:00'}
                    onChange={(e) => setActaForm({ ...actaForm, horaInicio: e.target.value })}
                    className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                  />
                  <input
                    type="time"
                    value={actaForm.horaFin || '10:00'}
                    onChange={(e) => setActaForm({ ...actaForm, horaFin: e.target.value })}
                    className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Asistentes y Firmas Digitales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" /> Asistentes y Firmas Digitales de los Participantes ({actaForm.asistentes?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const nombre = prompt('Nombre completo del nuevo participante:');
                    if (!nombre) return;
                    const cedula = prompt('Número de identificación (Cédula):') || '';
                    const rol = prompt('Rol o estamento (ej: Invitado, Asesor SST, Vocal):') || 'Participante';
                    setActaForm({
                      ...actaForm,
                      asistentes: [
                        ...(actaForm.asistentes || []),
                        { nombre, cedula, rol, asistio: true, firma: null },
                      ],
                    });
                  }}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
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
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Desarrollo de los Puntos del Orden del Día
              </h4>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  1. Análisis de Accidentalidad, Incidentes y Ausentismo ATEL
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.analisisAccidentalidad || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, analisisAccidentalidad: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                  placeholder="Comportamiento del mes, días de incapacidad y causas de incidentes..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  2. Inspecciones Planeadas de Seguridad y Hallazgos en Terreno
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.inspeccionesSeguridad || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, inspeccionesSeguridad: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                  placeholder="Inspecciones de extintores, rutas de evacuación, orden y aseo..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  3. Capacitaciones SG-SST y Campañas de Sensibilización
                </label>
                <textarea
                  rows={2}
                  value={actaForm.desarrollo?.capacitacionesYCampanas || ''}
                  onChange={(e) =>
                    setActaForm({
                      ...actaForm,
                      desarrollo: { ...actaForm.desarrollo, capacitacionesYCampanas: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                  placeholder="Cursos ejecutados, asistencia de colaboradores y plan del mes..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  4. Proposiciones, Varios y Próxima Sesión
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
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                />
              </div>
            </div>

            {/* Compromisos del Acta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Plan de Acción / Compromisos Asumidos ({actaForm.compromisos?.length || 0})
                </h4>
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
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Compromiso
                </button>
              </div>

              {(actaForm.compromisos || []).map((comp: any, cIdx: number) => (
                <div key={cIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40">
                  <input
                    type="text"
                    placeholder="Acción correctiva o preventiva..."
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

            {/* Footer Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowActaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveActa}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Acta Reglamentaria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CONVOCATORIA ELECCIONES ═══ */}
      {showEleccionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                  Nueva Convocatoria Electoral
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Abre la urna digital anónima para que todos los trabajadores elijan sus representantes
                </p>
              </div>
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
                <div className="max-h-48 overflow-y-auto space-y-2">
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
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEleccionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateEleccion}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md active:scale-95"
              >
                Abrir Urna Digital
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
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Imprime o proyecta este código para que los trabajadores escaneen y voten desde su celular de forma anónima
            </p>

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
