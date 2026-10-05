import React, { useState, useEffect, useRef } from 'react';
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
  Printer,
  RefreshCw,
  Copy,
  Check,
  History,
  Save,
  Database,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import SignaturePad from './SignaturePad';
import ExpandingButton from './ExpandingButton';
import WorkerAutocomplete from './WorkerAutocomplete';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ExportDropdown from './ExportDropdown';
import ReportHistory from '~/components/Liva/ReportHistory';
import { syncCommitteeSignaturesInHtml } from './committeeSignaturesHtml';

export default function ConvivenciaWorkspace() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'casos' | 'actas' | 'comites' | 'elecciones'>('casos');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [casos, setCasos] = useState<any[]>([]);
  const [actas, setActas] = useState<any[]>([]);
  const [elecciones, setElecciones] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);

  // Pestaña activa dentro del modal de Acta: Diligenciamiento ('form') o Informe Oficial membretado ('report')
  const [actaModalTab, setActaModalTab] = useState<'form' | 'report'>('form');
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportFileName, setReportFileName] = useState<string>('Acta-Comite-Convivencia');
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  // Guardado de datos, Guardado de Informe e Historial
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    lugar: 'Sala Confidencial de Convivencia / Híbrida',
    horaInicio: '09:00',
    horaFin: '11:00',
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
      lecturaActaAnterior: '',
      seguimientoCompromisos: '',
      revisionQuejasTrimestre: '',
      campanasPreventivasAcoso: '',
      climaLaboralPsicosocial: '',
      recomendacionesAltaDireccion: '',
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

  // Modal Designación Directa Empleador CCL (Res. 652/2012 y Res. 3461/2025)
  const [showDesignarEmpleadorModal, setShowDesignarEmpleadorModal] = useState(false);
  const [representantesEmpleadorList, setRepresentantesEmpleadorList] = useState<any[]>([]);
  const [newRepEmpleador, setNewRepEmpleador] = useState<any>({
    nombre: '',
    cargo: '',
    cedula: '',
    rol: 'Principal',
  });
  const [savingEmpleador, setSavingEmpleador] = useState(false);

  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resConfig, resCasos, resActas, resElecciones, resWorkers] = await Promise.all([
        axios.get('/api/sgsst/convivencia/config', { headers }),
        axios.get('/api/sgsst/convivencia/casos', { headers }),
        axios.get('/api/sgsst/convivencia/actas', { headers }),
        axios.get('/api/sgsst/convivencia/elecciones', { headers }),
        axios.get('/api/sgsst/convivencia/trabajadores', { headers }).catch(() => ({ data: { workers: [] } })),
      ]);

      setConfig(resConfig.data);
      setCasos(resCasos.data.casos || []);
      setActas(resActas.data.actas || []);
      setElecciones(resElecciones.data.elecciones || []);

      let loadedWorkers = resWorkers.data?.workers || [];
      try {
        const resSocio = await axios.get('/api/sgsst/perfil-sociodemografico/data', { headers });
        if (resSocio.data?.trabajadores?.length) {
          const cedulas = new Set(loadedWorkers.map((w: any) => String(w.cedula || w.identificacion || '').trim()));
          resSocio.data.trabajadores.forEach((tw: any) => {
            const c = String(tw.identificacion || '').trim();
            if (c && !cedulas.has(c)) {
              cedulas.add(c);
              loadedWorkers.push({
                nombre: tw.nombre,
                cedula: c,
                identificacion: c,
                cargo: tw.cargo || '',
                area: tw.area || '',
              });
            }
          });
        }
      } catch (e) {
        // Fallback silencioso
      }
      setWorkers(loadedWorkers);
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
    const currentYear = new Date().getFullYear();
    const existingForQuarter = actas.find((a) => Number(a.trimestre) === Number(trimestreNum) && Number(a.anio || currentYear) === currentYear);
    if (existingForQuarter) {
      handleEditActa(existingForQuarter);
      return;
    }

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
      anio: currentYear,
      tipo: 'ordinaria_trimestral',
      centroTrabajo: activeComite?.centroTrabajo || 'Sede Principal',
      lugar: 'Sala Confidencial de Convivencia / Híbrida',
      horaInicio: '09:00',
      horaFin: '11:00',
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
        lecturaActaAnterior: 'Se dio lectura al acta ordinaria anterior siendo aprobada por unanimidad de los asistentes.',
        seguimientoCompromisos: 'Se verificaron los acuerdos y compromisos suscritos en la sesión precedente, reportando avance satisfactorio.',
        revisionQuejasTrimestre: 'Se analizaron los radicados confidenciales garantizando la reserva de ley y sin mención de nombres propios.',
        campanasPreventivasAcoso: 'Ejecución de talleres de resolución asertiva de conflictos, prevención del acoso laboral y sensibilización Ley 2365 de 2024.',
        climaLaboralPsicosocial: 'Monitoreo preventivo del clima intralaboral y relaciones de mando en coordinación con el área de Talento Humano y SGSST.',
        recomendacionesAltaDireccion: 'Recomendaciones dirigidas a la Gerencia General y Talento Humano para fortalecer la cultura de respeto y diálogo.',
        proposicionesVarios: 'Coordinación y fecha tentativa para la próxima sesión ordinaria trimestral del CCL.',
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
    setReportHtml('');
    setSelectedActa(null);
    setActaModalTab('form');
    setShowActaModal(true);
  };

  const handleEditActa = (acta: any) => {
    setSelectedActa(acta);
    setActaForm({
      id: acta._id,
      ...acta,
      lugar: acta.lugar || 'Sala Confidencial de Convivencia / Híbrida',
      horaInicio: acta.horaInicio || '09:00',
      horaFin: acta.horaFin || '11:00',
      quorumVerificado: acta.quorumVerificado !== false,
      asistentes: acta.asistentes || [],
      estadisticasQuejas: acta.estadisticasQuejas || {
        quejasRecibidasTrimestre: 0,
        enTramite: 0,
        acuerdosConciliatorios: 0,
        archivadasSinMerito: 0,
        remitidasAltaDireccion: 0,
        casosAcosoSexualLey2365: 0,
      },
      desarrollo: acta.desarrollo || {},
      compromisos: acta.compromisos || [],
    });
    if (acta.reporteOficialHtml) {
      setReportHtml(syncCommitteeSignaturesInHtml(acta.reporteOficialHtml, acta.asistentes || [], 'Convivencia'));
    } else {
      setReportHtml('');
    }
    setActaModalTab('form');
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

  const handleOpenOfficialReport = async (actaIdOrData?: any, fromTable = false) => {
    setReportLoading(true);
    setActaModalTab('report');
    setShowActaModal(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const isExistingId = typeof actaIdOrData === 'string' && actaIdOrData !== 'preview';
      const actaId = isExistingId ? actaIdOrData : (selectedActa?._id || actaForm?.id || 'preview');
      const bodyPayload = fromTable && isExistingId ? {} : actaForm;

      if (fromTable && isExistingId) {
        const found = actas.find((a) => a._id === actaIdOrData);
        if (found) {
          setSelectedActa(found);
          setActaForm({
            id: found._id,
            ...found,
            lugar: found.lugar || 'Sala Confidencial de Convivencia / Híbrida',
            horaInicio: found.horaInicio || '09:00',
            horaFin: found.horaFin || '11:00',
            quorumVerificado: found.quorumVerificado !== false,
            asistentes: found.asistentes || [],
            estadisticasQuejas: found.estadisticasQuejas || {
              quejasRecibidasTrimestre: 0,
              enTramite: 0,
              acuerdosConciliatorios: 0,
              archivadasSinMerito: 0,
              remitidasAltaDireccion: 0,
              casosAcosoSexualLey2365: 0,
            },
            desarrollo: found.desarrollo || {},
            compromisos: found.compromisos || [],
          });
        }
      }

      const res = await axios.post(`/api/sgsst/convivencia/actas/${actaId}/reporte-oficial`, bodyPayload, { headers });
      if (res.data?.acta) {
        setSelectedActa(res.data.acta);
        setActaForm((prev: any) => ({
          ...prev,
          id: res.data.acta._id,
          consecutivo: res.data.acta.consecutivo || prev.consecutivo,
        }));
        fetchAllData();
      }
      if (res.data?.desarrolloEnriquecido) {
        setActaForm((prev: any) => ({
          ...prev,
          desarrollo: {
            ...prev.desarrollo,
            ...res.data.desarrolloEnriquecido,
          },
        }));
      }
      if (res.data?.html) {
        setReportHtml(res.data.html);
        const fileName = res.data.fileName || (selectedActa?.consecutivo ? `Acta-COCOLAB-${selectedActa.consecutivo}` : `Acta-COCOLAB-Q${actaForm.trimestre}-${actaForm.anio}`);
        setReportFileName(fileName);
        showToast({ message: '¡Informe Oficial confidencial complementado, estructurado y guardado con Tenshi IA!', status: 'success' });
      }
    } catch (err: any) {
      console.error('Error opening official convivencia acta report:', err);
      showToast({ message: err.response?.data?.error || 'Error al generar el acta oficial con firmas', status: 'error' });
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopySigningLink = () => {
    const link = `${window.location.origin}/sgsst-public/comites/${config?.company?.id || ''}`;
    navigator.clipboard.writeText(link);
    showToast({ message: 'Enlace copiado. Compártelo con los miembros del comité para firmar desde su dispositivo.', status: 'success' });
  };

  // Sincroniza asistentes tanto en el formulario como en el Informe Oficial existente sin regenerar IA
  const handleUpdateAsistentes = async (updatedAsistentes: any[], persistToDb = true) => {
    const baseHtml = liveEditorRef.current?.getHTML() || reportHtml || selectedActa?.reporteOficialHtml || actaForm?.reporteOficialHtml || '';
    const updatedHtml = baseHtml ? syncCommitteeSignaturesInHtml(baseHtml, updatedAsistentes, 'Convivencia') : '';

    setActaForm((prev: any) => ({
      ...prev,
      asistentes: updatedAsistentes,
      ...(updatedHtml ? { reporteOficialHtml: updatedHtml } : {}),
    }));

    if (updatedHtml) {
      setReportHtml(updatedHtml);
      if (liveEditorRef.current) {
        liveEditorRef.current.setHTML(updatedHtml);
      }
    }

    const existingId = selectedActa?._id || actaForm?.id;
    if (persistToDb && existingId && token) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.post(
          '/api/sgsst/convivencia/actas',
          {
            ...actaForm,
            id: existingId,
            asistentes: updatedAsistentes,
            ...(updatedHtml ? { reporteOficialHtml: updatedHtml } : {}),
          },
          { headers },
        );
        if (res.data?.acta) {
          setSelectedActa(res.data.acta);
        }
      } catch (e) {
        // Silencioso en auto-sync
      }
    }
  };

  const handleSyncCommitteeMembersToActa = () => {
    const list: any[] = [];
    const activeComite = config?.comite || config?.comites?.find((c: any) => c.estado === 'activo') || config?.comites?.[0];
    if (activeComite) {
      (activeComite.representantesEmpleador || []).forEach((r: any) => {
        list.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Empleador (${r.rol || 'Principal'})`,
          asistio: true,
          firma: null,
        });
      });
      (activeComite.representantesTrabajadores || []).forEach((r: any) => {
        list.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Trabajadores (${r.rol || 'Principal'})`,
          asistio: true,
          firma: null,
        });
      });
    }
    if (list.length === 0) {
      showToast({ message: 'No hay miembros registrados en la conformación oficial del Comité de Convivencia. Registra primero los representantes o abre votaciones.', status: 'warning' });
      return;
    }
    const existingCedulas = new Set((actaForm.asistentes || []).map((a: any) => String(a.cedula).trim()));
    const nuevos = list.filter((m) => !existingCedulas.has(String(m.cedula).trim()));
    if (nuevos.length === 0) {
      showToast({ message: 'Todos los miembros oficiales del Comité de Convivencia ya están convocados en el acta.', status: 'info' });
      return;
    }
    const merged = [...(actaForm.asistentes || []), ...nuevos];
    handleUpdateAsistentes(merged, true);
    showToast({ message: `Se convocaron ${nuevos.length} miembros oficiales del Comité de Convivencia (sincronizados con el Informe Oficial)`, status: 'success' });
  };

  const handleCopyWorkerSignLink = async (cedula: string) => {
    const existingId = selectedActa?._id || actaForm?.id;
    if (!existingId && token) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.post('/api/sgsst/convivencia/actas', { ...actaForm }, { headers });
        if (res.data?.acta) {
          setSelectedActa(res.data.acta);
          setActaForm((prev: any) => ({ ...prev, id: res.data.acta._id, consecutivo: res.data.acta.consecutivo }));
        }
      } catch (e) {
        // continuar
      }
    }
    const origin = window.location.origin;
    const companyId = config?.company?.id || '';
    const url = `${origin}/sgsst-public/comites/${companyId}?cedula=${encodeURIComponent(cedula)}`;
    navigator.clipboard.writeText(url);
    showToast({ message: 'Enlace de firma copiado. Puedes enviarlo por WhatsApp al trabajador.', status: 'success' });
  };

  const handleSaveActa = async (closeModal = true) => {
    setIsSavingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...actaForm,
        id: selectedActa?._id || actaForm.id,
        reporteOficialHtml: reportHtml || actaForm.reporteOficialHtml || '',
      };
      const res = await axios.post('/api/sgsst/convivencia/actas', payload, { headers });
      if (res.data?.acta) {
        setSelectedActa(res.data.acta);
        setActaForm((prev: any) => ({
          ...prev,
          id: res.data.acta._id,
          consecutivo: res.data.acta.consecutivo || prev.consecutivo,
        }));
      }
      showToast({
        message: closeModal
          ? 'Acta trimestral guardada con éxito (Compromisos sincronizados con el Centro de Control)'
          : 'Datos del acta guardados en la base de datos',
        status: 'success',
      });
      if (closeModal) {
        setShowActaModal(false);
      }
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al guardar acta', status: 'error' });
    } finally {
      setIsSavingData(false);
    }
  };

  const handleSaveReport = async () => {
    const currentHtml = liveEditorRef.current?.getHTML() || reportHtml;
    if (!currentHtml) {
      showToast({ message: 'No hay informe generado para guardar', status: 'warning' });
      return;
    }
    setIsSavingReport(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const title = `Acta Comité Convivencia Q${actaForm.trimestre}/${actaForm.anio} - ${actaForm.consecutivo || 'Oficial'}`;

      // 1. Guardar el acta y su HTML en la colección de Convivencia
      const resActa = await axios.post(
        '/api/sgsst/convivencia/actas',
        {
          ...actaForm,
          id: selectedActa?._id || actaForm.id,
          reporteOficialHtml: currentHtml,
        },
        { headers },
      );
      if (resActa.data?.acta) {
        setSelectedActa(resActa.data.acta);
        setActaForm((prev: any) => ({ ...prev, id: resActa.data.acta._id }));
      }

      // 2. Guardar en el Historial Central de Informes SGSST
      const resHist = await axios.post(
        '/api/sgsst/diagnostico/save-report',
        {
          conversationId,
          messageId: reportMessageId,
          content: currentHtml,
          title,
          tags: ['sgsst-convivencia'],
        },
        { headers },
      );
      if (resHist.data?.conversationId) setConversationId(resHist.data.conversationId);
      if (resHist.data?.messageId) setReportMessageId(resHist.data.messageId);
      setRefreshTrigger((prev) => prev + 1);
      fetchAllData();
      showToast({ message: 'Informe Oficial y datos del acta guardados en el historial', status: 'success' });
    } catch (err: any) {
      console.error('Error saving convivencia report:', err);
      showToast({ message: 'Error al guardar el informe oficial', status: 'error' });
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleSelectReportFromHistory = async (convId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/messages/${convId}`, { headers });
      const messages = res.data;
      if (Array.isArray(messages) && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.text) {
          const syncedHtml = syncCommitteeSignaturesInHtml(lastMsg.text, actaForm.asistentes || [], 'Convivencia');
          setReportHtml(syncedHtml);
          liveEditorRef.current?.setHTML(syncedHtml);
          setConversationId(convId);
          setReportMessageId(lastMsg.messageId);
          setActaModalTab('report');
          setShowActaModal(true);
          setIsHistoryOpen(false);
          showToast({ message: 'Informe cargado desde el historial', status: 'info' });
        }
      }
    } catch (err) {
      showToast({ message: 'Error al cargar el informe del historial', status: 'error' });
    }
  };

  // Sincronización reactiva automática de firmas en el informe cada vez que cambian los asistentes o se abre la pestaña de informe
  useEffect(() => {
    if (!showActaModal) return;
    const baseHtml = reportHtml || selectedActa?.reporteOficialHtml || actaForm?.reporteOficialHtml || '';
    if (!baseHtml) return;
    const synced = syncCommitteeSignaturesInHtml(baseHtml, actaForm.asistentes || [], 'Convivencia');
    if (synced !== reportHtml) {
      setReportHtml(synced);
    }
    if (actaModalTab === 'report' && liveEditorRef.current) {
      liveEditorRef.current.setHTML(synced);
    }
  }, [actaForm.asistentes, actaModalTab, showActaModal]);

  const handleOpenDesignarEmpleadorModal = () => {
    const activeComite = config?.comites?.find((c: any) => c.estado === 'activo') || config?.comites?.[0];
    const actuales = (activeComite?.representantesEmpleador || []).map((r: any) => ({
      nombre: r.nombre || '',
      cargo: r.cargo || '',
      cedula: r.cedula || '',
      rol: r.rol || 'Principal',
    }));
    setRepresentantesEmpleadorList(actuales);
    setNewRepEmpleador({ nombre: '', cargo: '', cedula: '', rol: 'Principal' });
    setShowDesignarEmpleadorModal(true);
  };

  const handleSaveRepresentantesEmpleador = async () => {
    setSavingEmpleador(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const activeComite = config?.comites?.find((c: any) => c.estado === 'activo') || config?.comites?.[0];
      const payload = {
        comiteId: activeComite?._id,
        centroTrabajo: activeComite?.centroTrabajo || 'Sede Principal',
        periodoInicio: activeComite?.periodoInicio || new Date().toISOString(),
        periodoFin: activeComite?.periodoFin || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        representantesEmpleador: representantesEmpleadorList.map((r: any) => ({
          nombre: String(r.nombre || '').trim(),
          cargo: String(r.cargo || 'Directivo / Representante').trim(),
          cedula: String(r.cedula || '').trim(),
          rol: r.rol || 'Principal',
        })),
        representantesTrabajadores: activeComite?.representantesTrabajadores || [],
      };

      await axios.post('/api/sgsst/convivencia/comite', payload, { headers });
      showToast({ message: 'Representantes del empleador designados y guardados con éxito', status: 'success' });
      setShowDesignarEmpleadorModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al guardar designación del empleador', status: 'error' });
    } finally {
      setSavingEmpleador(false);
    }
  };

  const handleCreateEleccion = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const rawCandidatos = Array.isArray(eleccionForm.candidatos) ? eleccionForm.candidatos : [];
      const cleanCandidatos = rawCandidatos.map((c: any, idx: number) => {
        const fallbackId = c.id || c.cedula || `cand-${Date.now()}-${idx}`;
        return {
          id: String(fallbackId),
          nombre: String(c.nombre || `Candidato ${idx + 1}`).trim(),
          cargo: String(c.cargo || 'Trabajador').trim(),
          cedula: String(c.cedula || fallbackId).trim(),
          propuesta: String(c.propuesta || 'Representar activamente a los trabajadores en convivencia laboral').trim(),
          votos: Number(c.votos) || 0,
        };
      });

      if (cleanCandidatos.length === 0) {
        showToast({ message: 'Debe añadir al menos un candidato para abrir la elección', status: 'warning' });
        return;
      }

      await axios.post(
        '/api/sgsst/convivencia/elecciones',
        {
          ...eleccionForm,
          candidatos: cleanCandidatos,
        },
        { headers }
      );
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
          ...actaForm,
          id: selectedActa?._id || actaForm.id,
          trimestre: actaForm.trimestre,
          anio: actaForm.anio,
          desarrolloActual: actaForm.desarrollo,
        },
        { headers }
      );

      if (res.data.borrador) {
        const savedActa = res.data.acta;
        if (savedActa) {
          setSelectedActa(savedActa);
        }
        setActaForm((prev: any) => ({
          ...prev,
          id: savedActa?._id || prev.id,
          consecutivo: savedActa?.consecutivo || prev.consecutivo,
          desarrollo: {
            ...prev.desarrollo,
            ...res.data.borrador,
          },
          compromisos: savedActa?.compromisos || [
            ...(prev.compromisos || []),
            ...(res.data.borrador.compromisosSugeridos || []).map((c: any) => ({
              ...c,
              estado: 'pendiente',
            })),
          ],
        }));
        fetchAllData();
        showToast({ message: '¡Los 7 puntos del acta trimestral fueron redactados por Tenshi IA y guardados automáticamente!', status: 'success' });
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
                {/* Res. 0312 Est. 1.1.8: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="1.1.8"
                  label="Res. 0312 Est. 1.1.8: CUMPLE"
                  tooltip="Res. 0312/2019 Estándar 1.1.8 — Conformación y funcionamiento del Comité de Convivencia Laboral (Res. 652/12, Res. 1356/12 y Res. 3461/25)"
                  moduleName="Comité de Convivencia Laboral"
                />
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
          {
            id: 'tb-convivencia-history',
            onClick: () => setIsHistoryOpen(!isHistoryOpen),
            label: 'Historial de Informes',
            icon: History,
            title: 'Consultar historial de actas e informes oficiales del Comité de Convivencia',
            variant: 'history',
            active: isHistoryOpen,
          },
        ]}
        customSections={[
          <div key="ccl-actions-bar" className="flex items-center gap-1.5">
            {activeTab === 'casos' && (
              <ToolbarButton
                id="tb-nuevo-caso"
                onClick={() => {
                  const link = `${window.location.origin}/sgsst-public/convivencia/${config?.company?.id || ''}`;
                  setQrModalUrl(link);
                }}
                label="Canal de Quejas"
                icon={QrCode}
                title="Compartir enlace o QR del Canal Confidencial de Quejas de Acoso Laboral"
                variant="save"
              />
            )}
            {activeTab === 'actas' && (
              <ToolbarButton
                id="tb-nueva-acta"
                onClick={() => handleOpenNewActa(1)}
                label="Nueva Acta Trimestral"
                icon={Plus}
                title="Registrar o Continuar Acta Trimestral Ordinaria del CCL"
                variant="ai"
              />
            )}
            {activeTab === 'comites' && (
              <>
                <ToolbarButton
                  id="tb-designar-empleador-ccl"
                  onClick={handleOpenDesignarEmpleadorModal}
                  label="Designar Empleador"
                  icon={Shield}
                  title="Designar Directamente Representantes del Empleador (Presidente, Principales y Suplentes)"
                  variant="history"
                />
                <ToolbarButton
                  id="tb-convocar-ccl"
                  onClick={() => setActiveTab('elecciones')}
                  label="Convocar Votación Secreta"
                  icon={Vote}
                  title="Iniciar Convocatoria Electoral del CCL"
                  variant="dummy"
                />
              </>
            )}
            {activeTab === 'elecciones' && (
              <ToolbarButton
                id="tb-convocatoria-electoral"
                onClick={() => {
                  const defaultCandidatos = (workers.slice(0, 4) || []).map((w: any, idx: number) => {
                    const ced = String(w.cedula || w.documento || w.identificacion || `cand-${idx + 1}`).trim();
                    return {
                      id: ced,
                      nombre: w.nombre || `Candidato ${idx + 1}`,
                      cargo: w.cargo || 'Trabajador',
                      cedula: ced,
                      propuesta: 'Representar activamente a los trabajadores en convivencia laboral',
                      votos: 0,
                    };
                  });
                  setEleccionForm({
                    titulo: `Elecciones Comité de Convivencia ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                    candidatos: defaultCandidatos,
                  });
                  setShowEleccionModal(true);
                }}
                label="Nueva Convocatoria Electoral"
                icon={Plus}
                title="Crear Nueva Convocatoria a Elecciones"
                variant="dummy"
              />
            )}
          </div>
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
                          <ExpandingButton
                            onClick={() => {
                              setSelectedCaso(caso);
                              setShowMedidasModal(true);
                            }}
                            label="Medidas Cautelares"
                            icon={ShieldAlert}
                            variant="rose"
                            title="Gestionar Medidas Cautelares Urgentes Ley 2365"
                          />
                        )}

                        <ExpandingButton
                          onClick={() => {
                            setSelectedCaso(caso);
                            setShowCasoModal(true);
                          }}
                          label={`Expediente (${caso.actuaciones?.length || 0})`}
                          icon={MessageSquare}
                          variant="secondary"
                          title="Ver Expediente Confidencial y Actuaciones"
                        />
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
                      <div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 truncate font-semibold">
                          {actaQ.consecutivo}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {(() => {
                            const totalAsist = actaQ.asistentes?.length || 0;
                            const totalFirmas = actaQ.asistentes?.filter((a: any) => a.firma || a.firmadoEn)?.length || 0;
                            const allSigned = totalAsist > 0 && totalFirmas === totalAsist;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                allSigned
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                <PenTool className="w-2.5 h-2.5" />
                                Firmas: {totalFirmas}/{totalAsist} {allSigned ? '✓' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2 italic">Sin acta registrada aún.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    {actaQ ? (
                      <>
                        <button
                          onClick={() => {
                            handleEditActa(actaQ);
                            setActaModalTab('report');
                          }}
                          className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100"
                          title="Ver Informe Oficial del Acta"
                        >
                          <Printer className="w-3.5 h-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Informe Oficial</span>
                          </div>
                        </button>

                        <button
                          onClick={handleCopySigningLink}
                          className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-1.5 shadow-sm active:scale-95 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                          title="Copiar Enlace de Firma para Miembros"
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Copiar Link</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleEditActa(actaQ)}
                          className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-1.5 shadow-sm active:scale-95 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                          title="Examinar y Editar Acta"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Examinar</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteActa(actaQ._id)}
                          className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                          title="Eliminar Acta"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Eliminar</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenNewActa(q)}
                        className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-2 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-600 dark:text-teal-300"
                        title={`Diligenciar Acta Q${q}`}
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
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

            <div className="flex items-center gap-2">
              <ExpandingButton
                onClick={handleOpenDesignarEmpleadorModal}
                label="Designar Empleador"
                icon={Shield}
                variant="teal"
                title="Designar directamente representantes del empleador (Presidente, Principales y Suplentes)"
              />
              <ExpandingButton
                onClick={() => setActiveTab('elecciones')}
                label="Convocar Votación Trabajadores"
                icon={Vote}
                variant="orange"
                title="Iniciar Convocatoria y Votación Secreta Digital"
              />
            </div>
          </div>

          <div className="space-y-4">
            {(!config?.comites || config.comites.length === 0) ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Sin comités de convivencia conformados</p>
                <p className="text-xs mb-3">Convoque a elecciones o designe los representantes del empleador para formalizar el comité.</p>
                <div className="flex items-center justify-center gap-2">
                  <ExpandingButton
                    onClick={handleOpenDesignarEmpleadorModal}
                    label="Designar Empleador"
                    icon={Shield}
                    variant="teal"
                    title="Designar representantes del empleador"
                  />
                  <ExpandingButton
                    onClick={() => setActiveTab('elecciones')}
                    label="Convocar Votación Trabajadores"
                    icon={Vote}
                    variant="orange"
                    title="Iniciar Convocatoria Electoral"
                  />
                </div>
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
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {comite.estado?.toUpperCase() || 'ACTIVO'}
                      </span>
                    </div>
                  </div>

                  {/* Representantes Empleador */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> Representantes del Empleador (Designados por Gerencia)
                      </h5>
                      <ExpandingButton
                        onClick={handleOpenDesignarEmpleadorModal}
                        label="Gestionar Designación"
                        icon={Shield}
                        variant="outline-teal"
                        title="Modificar o agregar representantes del empleador"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(comite.representantesEmpleador || []).length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs text-slate-400 text-center flex flex-col items-center justify-center gap-2 col-span-2">
                          <span>Sin representantes del empleador designados.</span>
                          <ExpandingButton
                            onClick={handleOpenDesignarEmpleadorModal}
                            label="+ Designar Ahora"
                            icon={Plus}
                            variant="teal"
                            title="Designar representantes del empleador directamente"
                          />
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

            <ExpandingButton
              onClick={() => {
                setEleccionForm({
                  titulo: `Elecciones Comité de Convivencia ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  candidatos: [],
                });
                setShowEleccionModal(true);
              }}
              label="Nueva Convocatoria Electoral"
              icon={Plus}
              variant="orange"
              title="Publicar Nueva Convocatoria a Elecciones"
            />
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
                            <ExpandingButton
                              onClick={() => setQrModalUrl(votingUrl)}
                              label="QR Urna"
                              icon={QrCode}
                              variant="secondary"
                              title="Mostrar Código QR de Votación"
                            />

                            <ExpandingButton
                              onClick={() => {
                                navigator.clipboard.writeText(votingUrl);
                                showToast({ message: 'Enlace de votación copiado al portapapeles', status: 'success' });
                              }}
                              label="Copiar Link"
                              icon={Share2}
                              variant="secondary"
                              title="Copiar Link de la Urna Digital"
                            />

                            <ExpandingButton
                              onClick={() => handleEscrutinio(e._id)}
                              label="Cerrar & Escrutar"
                              icon={CheckCircle2}
                              variant="orange"
                              title="Finalizar Votación y Generar Acta de Escrutinio"
                            />
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
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
              <ExpandingButton
                variant="secondary"
                icon={<X className="w-4 h-4" />}
                label="Cerrar"
                onClick={() => setShowCasoModal(false)}
              />
              <ExpandingButton
                variant="teal"
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Guardar Actuación"
                onClick={handleAddActuacion}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL MEDIDAS CAUTELARES URGENTES LEY 2365 ═══ */}
      {showMedidasModal && selectedCaso && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
              <ExpandingButton
                variant="secondary"
                icon={<X className="w-4 h-4" />}
                label="Cancelar"
                onClick={() => setShowMedidasModal(false)}
              />
              <ExpandingButton
                variant="rose"
                icon={<AlertOctagon className="w-4 h-4" />}
                label="Activar Medidas Urgentes"
                onClick={handleApplyMedidas}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CREAR / EDITAR ACTA TRIMESTRAL CON LIVEEDITOR E INFORME OFICIAL ═══ */}
      {showActaModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">
                    {selectedActa ? 'Examinar / Editar Acta CCL' : 'Diligenciar Nueva Acta Trimestral CCL'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Trimestre Q{actaForm.trimestre} de {actaForm.anio} • Resolución 3461 de 2025 y Ley 2365 de 2024
                  </p>
                </div>
              </div>

              {/* Botonera Flotante Cápsula en el Modal (WAPPY Design System) */}
              <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
                <ToolbarButton
                  id="ccl-modal-tab-form"
                  onClick={() => setActaModalTab('form')}
                  label="Diligenciamiento"
                  icon={PenTool}
                  title="Diligenciar campos estructurados del acta trimestral"
                  variant="history"
                  active={actaModalTab === 'form'}
                />
                <ToolbarButton
                  id="ccl-modal-tab-report"
                  onClick={() => {
                    const sourceHtml = reportHtml || selectedActa?.reporteOficialHtml || actaForm?.reporteOficialHtml || '';
                    if (sourceHtml) {
                      const synced = syncCommitteeSignaturesInHtml(sourceHtml, actaForm.asistentes || [], 'Convivencia');
                      setReportHtml(synced);
                    }
                    setActaModalTab('report');
                  }}
                  label="Informe Oficial"
                  icon={Printer}
                  title="Ver campo de Informe Oficial del Acta"
                  variant="history"
                  active={actaModalTab === 'report'}
                />

                <div className="h-5 w-px bg-slate-200 dark:bg-zinc-700 mx-0.5" />

                {actaModalTab === 'report' ? (
                  <>
                    <ToolbarButton
                      id="ccl-modal-btn-generate-report-ai"
                      onClick={() => handleOpenOfficialReport(selectedActa?._id || 'preview', false)}
                      isLoading={reportLoading}
                      label={reportLoading ? 'Generando...' : 'Generar Informe con Tenshi IA'}
                      icon="sparkles"
                      title="Generar o complementar el Informe Oficial membretado con Tenshi IA"
                      variant="dummy"
                    />
                    <ToolbarButton
                      id="ccl-modal-btn-history"
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      label="Historial"
                      icon={History}
                      title="Ver Historial de Informes guardados"
                      variant="history"
                      active={isHistoryOpen}
                    />
                    <ToolbarButton
                      id="ccl-modal-btn-save-report"
                      onClick={handleSaveReport}
                      isLoading={isSavingReport}
                      label="Guardar Informe"
                      icon={Save}
                      title="Guardar Informe Oficial en el Historial"
                      variant="save"
                    />
                    <ExportDropdown
                      content={reportHtml}
                      fileName={reportFileName}
                      reportType="general"
                    />
                  </>
                ) : (
                  <>
                    <ToolbarButton
                      id="ccl-modal-btn-save-data"
                      onClick={() => handleSaveActa(false)}
                      isLoading={isSavingData}
                      label="Guardar Datos"
                      icon="database"
                      title="Guardar datos del formulario en base de datos sin cerrar"
                      variant="database"
                    />
                    {selectedActa && (
                      <ToolbarButton
                        id="ccl-modal-btn-share-link"
                        onClick={handleCopySigningLink}
                        label="Link de Firma"
                        icon={Share2}
                        title="Copiar enlace para que los miembros firmen desde su portal"
                        variant="history"
                      />
                    )}
                    <ToolbarButton
                      id="ccl-modal-btn-ai-draft"
                      onClick={handleGenerateActaIA}
                      isLoading={isGeneratingIA}
                      label={isGeneratingIA ? 'Redactando...' : 'Redactar con Tenshi IA'}
                      icon="sparkles"
                      title="Redactar borrador del acta con Tenshi IA y guardar automáticamente"
                      variant="dummy"
                    />
                    <ToolbarButton
                      id="ccl-modal-btn-history"
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      label="Historial"
                      icon={History}
                      title="Ver Historial de Informes guardados"
                      variant="history"
                      active={isHistoryOpen}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowActaModal(false);
                    setActaModalTab('form');
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all shadow-2xs active:scale-95"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {actaModalTab === 'report' ? (
              <div className="space-y-4">
                {reportLoading ? (
                  <div className="flex flex-col items-center justify-center p-16 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-bold">
                      Tenshi IA está redactando, complementando y estructurando el Informe Oficial confidencial con firmas...
                    </p>
                  </div>
                ) : !reportHtml ? (
                  <div className="flex flex-col items-center justify-center p-14 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-center space-y-3">
                    <Sparkles className="w-10 h-10 text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                        Aún no se ha generado el Informe Oficial para esta acta trimestral
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md">
                        Usa el botón superior de Tenshi IA (o haz clic abajo) para estructurar el Informe Oficial confidencial en papel membretado A4 con las firmas de los asistentes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenOfficialReport(selectedActa?._id || 'preview', false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Informe con Tenshi IA</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-slate-100 dark:bg-zinc-950 p-2 sm:p-4 rounded-3xl overflow-y-auto max-h-[70vh]">
                    <LiveEditor
                      ref={liveEditorRef}
                      paperMode={true}
                      initialContent={reportHtml}
                      onUpdate={(html) => setReportHtml(html)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
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
                    >
                    </input>
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

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Lugar de la Sesión</label>
                    <input
                      type="text"
                      value={actaForm.lugar || 'Sala Confidencial de Convivencia / Híbrida'}
                      onChange={(e) => setActaForm({ ...actaForm, lugar: e.target.value })}
                      placeholder="Sala de juntas, sala confidencial o enlace virtual..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Horario (Inicio - Fin)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={actaForm.horaInicio || '09:00'}
                        onChange={(e) => setActaForm({ ...actaForm, horaInicio: e.target.value })}
                        className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                      />
                      <input
                        type="time"
                        value={actaForm.horaFin || '11:00'}
                        onChange={(e) => setActaForm({ ...actaForm, horaFin: e.target.value })}
                        className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={actaForm.quorumVerificado !== false}
                        onChange={(e) => setActaForm({ ...actaForm, quorumVerificado: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Quórum Verificado (Mitad + 1)</span>
                    </label>
                  </div>
                </div>

                {/* Balance Estadístico Confidencial de Quejas */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Balance Estadístico Confidencial de Casos (Res. 3461/2025)
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                      Sin nombres propios (Reserva de ley)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Recibidas</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.quejasRecibidasTrimestre || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              quejasRecibidasTrimestre: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-slate-800 dark:text-zinc-100 bg-transparent"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-sky-600 block mb-1">En Trámite</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.enTramite || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              enTramite: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-sky-600 bg-transparent"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-emerald-600 block mb-1">Conciliadas</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.acuerdosConciliatorios || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              acuerdosConciliatorios: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-emerald-600 bg-transparent"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Archivadas</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.archivadasSinMerito || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              archivadasSinMerito: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-slate-600 bg-transparent"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-amber-600 block mb-1">Remitidas Dir.</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.remitidasAltaDireccion || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              remitidasAltaDireccion: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-amber-600 bg-transparent"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                      <label className="text-[10px] font-bold text-purple-600 block mb-1">Ley 2365</label>
                      <input
                        type="number"
                        min={0}
                        value={actaForm.estadisticasQuejas?.casosAcosoSexualLey2365 || 0}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            estadisticasQuejas: {
                              ...actaForm.estadisticasQuejas,
                              casosAcosoSexualLey2365: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full text-center text-sm font-black text-purple-600 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Asistentes y Firmas Digitales */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Asistentes y Firmas Digitales ({actaForm.asistentes?.length || 0})
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                        Los miembros del comité pueden firmar en esta pantalla o directamente desde su portal de colaborador
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <ExpandingButton
                        variant="secondary"
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                        label="Sincronizar Miembros"
                        size="sm"
                        onClick={handleSyncCommitteeMembersToActa}
                        title="Convocatoria obligatoria a todos los miembros oficiales del CCL"
                      />
                      <div className="w-48 sm:w-64">
                        <WorkerAutocomplete
                          value=""
                          onChange={() => {}}
                          onSelect={(w) => {
                            const exists = (actaForm.asistentes || []).some(
                              (a: any) => String(a.cedula).trim() === String(w.identificacion || w.cedula).trim()
                            );
                            if (exists) {
                              showToast({ message: 'Este colaborador ya está en la lista de asistentes', status: 'warning' });
                              return;
                            }
                            const nextAsistentes = [
                              ...(actaForm.asistentes || []),
                              {
                                nombre: w.nombre,
                                cedula: w.identificacion || w.cedula || '',
                                rol: w.cargo || 'Miembro CCL',
                                asistio: true,
                                firma: null,
                              },
                            ];
                            handleUpdateAsistentes(nextAsistentes, true);
                            showToast({ message: 'Participante agregado y sincronizado en el Informe Oficial', status: 'success' });
                          }}
                          data={workers}
                          placeholder="+ Añadir trabajador a lista..."
                          className="py-1 px-2.5 text-[11px] h-7"
                        />
                      </div>
                    </div>
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
                            <div className="flex items-center gap-1.5">
                              <img src={asistente.firma} alt="Firma" className="h-7 max-w-[70px] border border-teal-500/30 rounded bg-white px-1 object-contain" />
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {asistente.firmadoDesde === 'portal_trabajador' ? 'Portal' : 'Firmado'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = actaForm.asistentes.map((item: any, idx: number) =>
                                    idx === aIdx ? { ...item, firma: null } : item
                                  );
                                  handleUpdateAsistentes(updated, true);
                                }}
                                className="text-slate-400 hover:text-red-500 p-1"
                                title="Borrar firma para volver a firmar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyWorkerSignLink(asistente.cedula)}
                                className="flex h-7 items-center justify-center rounded-lg px-2 shadow-xs active:scale-95 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-bold border border-amber-200/80 dark:border-amber-800/80"
                                title="Copiar enlace para enviar por WhatsApp o correo al trabajador"
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                <span>Link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSigningAssistantIndex(aIdx)}
                                className="flex h-7 items-center justify-center rounded-lg px-2 shadow-xs active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 text-[10px] font-bold border border-teal-200/80 dark:border-teal-800/80"
                                title="Firmar en pantalla táctil / ratón en vivo"
                              >
                                <PenTool className="w-3 h-3 mr-1" />
                                <span>Firmar</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = actaForm.asistentes.filter((_: any, idx: number) => idx !== aIdx);
                              handleUpdateAsistentes(updated, true);
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

                {/* Desarrollo Temático del Acta con los 7 Puntos Estatutarios */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Desarrollo del Orden del Día (Res. 3461/2025, Ley 1010/2006 y Ley 2365/2024)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        1. Lectura y Aprobación del Acta Anterior
                      </label>
                      <textarea
                        rows={2}
                        value={actaForm.desarrollo?.lecturaActaAnterior || ''}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            desarrollo: { ...actaForm.desarrollo, lecturaActaAnterior: e.target.value },
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Lectura del acta ordinaria anterior y verificación de aprobación..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        2. Seguimiento a Compromisos y Fórmulas de Concertación Previas
                      </label>
                      <textarea
                        rows={2}
                        value={actaForm.desarrollo?.seguimientoCompromisos || ''}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            desarrollo: { ...actaForm.desarrollo, seguimientoCompromisos: e.target.value },
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Revisión del cumplimiento de fórmulas de diálogo y compromisos previos..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      3. Revisión Confidencial de Casos y Trámites Conciliatorios (Sin Nombres Propios)
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
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                      placeholder="Análisis general de radicados atendidos, mediaciones y estado de trámites..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        4. Campañas Preventivas contra Acoso Laboral y Sexual (Ley 2365/2024)
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
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Talleres de comunicación asertiva, respeto y rutas frente a violencias de género..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        5. Monitoreo de Clima Laboral y Factores de Riesgo Psicosocial
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
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Diagnóstico de relaciones laborales, cargas de trabajo y bienestar intralaboral..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        6. Recomendaciones Preventivas y Correctivas a la Alta Dirección
                      </label>
                      <textarea
                        rows={2}
                        value={actaForm.desarrollo?.recomendacionesAltaDireccion || ''}
                        onChange={(e) =>
                          setActaForm({
                            ...actaForm,
                            desarrollo: { ...actaForm.desarrollo, recomendacionesAltaDireccion: e.target.value },
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Medidas recomendadas a la Gerencia y Talento Humano para mitigar tensiones..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                        7. Proposiciones, Varios y Acuerdos de Cierre
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
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        placeholder="Asuntos varios y programación de la próxima reunión ordinaria trimestral..."
                      />
                    </div>
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
                    <ExpandingButton
                      variant="outline-teal"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      label="Agregar Compromiso"
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
                    />
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL CONVOCATORIA ELECCIONES CONVIVENCIA ═══ */}
      {showEleccionModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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

                {/* Formulario con Autocompletado de Trabajadores para Postulación CCL */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <WorkerAutocomplete
                    value={newCandidato.nombre}
                    onChange={(val) => setNewCandidato({ ...newCandidato, nombre: val })}
                    onSelect={(w) => {
                      setNewCandidato({
                        nombre: w.nombre,
                        cedula: w.identificacion || w.cedula || '',
                        cargo: w.cargo || '',
                      });
                    }}
                    data={workers}
                    placeholder="Buscar o escribir trabajador..."
                    wrapperClassName="flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Cédula..."
                    value={newCandidato.cedula}
                    onChange={(e) => setNewCandidato({ ...newCandidato, cedula: e.target.value })}
                    className="w-full sm:w-28 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                  />
                  <input
                    type="text"
                    placeholder="Cargo..."
                    value={newCandidato.cargo}
                    onChange={(e) => setNewCandidato({ ...newCandidato, cargo: e.target.value })}
                    className="w-full sm:w-28 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                  />
                  <ExpandingButton
                    variant="teal"
                    icon={Plus}
                    label="Añadir Candidato"
                    onClick={() => {
                      if (!newCandidato.nombre.trim()) return;
                      const candId = newCandidato.cedula?.trim() || `cand-${Date.now()}`;
                      setEleccionForm({
                        ...eleccionForm,
                        candidatos: [
                          ...(eleccionForm.candidatos || []),
                          {
                            id: candId,
                            nombre: newCandidato.nombre.trim(),
                            cargo: newCandidato.cargo?.trim() || 'Trabajador',
                            cedula: newCandidato.cedula?.trim() || candId,
                            propuesta: 'Representar activamente a los trabajadores en convivencia laboral',
                            votos: 0,
                          },
                        ],
                      });
                      setNewCandidato({ nombre: '', cargo: '', cedula: '' });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <ExpandingButton
                variant="secondary"
                icon={X}
                label="Cancelar"
                onClick={() => setShowEleccionModal(false)}
              />
              <ExpandingButton
                variant="orange"
                icon={Vote}
                label="Abrir Urna Digital"
                onClick={handleCreateEleccion}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DESIGNACIÓN DIRECTA DEL EMPLEADOR CONVIVENCIA ═══ */}
      {showDesignarEmpleadorModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    Designación Directa de Representantes del Empleador (CCL)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Resolución 652/2012 y Res. 3461/2025: El empleador designa directamente a sus representantes (Presidente, Principales y Suplentes) sin someterlos a votación.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesignarEmpleadorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Representantes del Empleador Actuales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Representantes Designados ({representantesEmpleadorList.length})
                </h4>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                  Designación Empresarial
                </span>
              </div>

              {representantesEmpleadorList.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30">
                  <p className="text-xs font-medium text-slate-500">
                    Aún no se han registrado representantes del empleador para el Comité de Convivencia. Añade al Presidente y a los representantes principales o suplentes abajo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {representantesEmpleadorList.map((rep, idx) => (
                    <div
                      key={rep.cedula || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {rep.rol === 'Presidente' ? '👑' : '👔'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                            {rep.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {rep.cargo || 'Cargo no especificado'} {rep.cedula ? `• C.C. ${rep.cedula}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <select
                          value={rep.rol}
                          onChange={(e) => {
                            const updated = [...representantesEmpleadorList];
                            updated[idx].rol = e.target.value;
                            setRepresentantesEmpleadorList(updated);
                          }}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                        >
                          <option value="Presidente">Presidente</option>
                          <option value="Principal">Principal</option>
                          <option value="Suplente">Suplente</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setRepresentantesEmpleadorList(representantesEmpleadorList.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para Añadir Nuevo Representante */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 space-y-2.5">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  + Agregar Nuevo Representante del Empleador
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <WorkerAutocomplete
                      value={newRepEmpleador.nombre}
                      onChange={(val) => setNewRepEmpleador({ ...newRepEmpleador, nombre: val })}
                      onSelect={(w) => {
                        setNewRepEmpleador({
                          ...newRepEmpleador,
                          nombre: w.nombre,
                          cedula: w.identificacion || w.cedula || w.documento || '',
                          cargo: w.cargo || '',
                        });
                      }}
                      data={workers}
                      placeholder="Buscar o escribir trabajador..."
                      wrapperClassName="w-full"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Cédula..."
                      value={newRepEmpleador.cedula}
                      onChange={(e) => setNewRepEmpleador({ ...newRepEmpleador, cedula: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Cargo..."
                      value={newRepEmpleador.cargo}
                      onChange={(e) => setNewRepEmpleador({ ...newRepEmpleador, cargo: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Rol:</label>
                    <select
                      value={newRepEmpleador.rol}
                      onChange={(e) => setNewRepEmpleador({ ...newRepEmpleador, rol: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <option value="Presidente">Presidente</option>
                      <option value="Principal">Principal</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                  </div>
                  <ExpandingButton
                    onClick={() => {
                      if (!newRepEmpleador.nombre.trim()) {
                        showToast({ message: 'Ingresa o selecciona el nombre del representante', status: 'warning' });
                        return;
                      }
                      setRepresentantesEmpleadorList([
                        ...representantesEmpleadorList,
                        {
                          ...newRepEmpleador,
                          nombre: newRepEmpleador.nombre.trim(),
                          cedula: newRepEmpleador.cedula?.trim() || `cc-${Date.now()}`,
                          cargo: newRepEmpleador.cargo?.trim() || 'Directivo / Representante',
                        },
                      ]);
                      setNewRepEmpleador({ nombre: '', cargo: '', cedula: '', rol: 'Principal' });
                    }}
                    label="Agregar a la Lista"
                    icon={Plus}
                    variant="teal"
                    title="Añadir a la lista temporal de designación"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <ExpandingButton
                onClick={() => setShowDesignarEmpleadorModal(false)}
                label="Cancelar"
                icon={X}
                variant="secondary"
                title="Descartar cambios"
              />
              <ExpandingButton
                onClick={handleSaveRepresentantesEmpleador}
                label={savingEmpleador ? 'Guardando...' : 'Guardar Designación Oficial'}
                icon={CheckCircle2}
                variant="teal"
                disabled={savingEmpleador}
                title="Guardar y asentar representantes del empleador en el comité de convivencia"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL QR VOTACIÓN ═══ */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
              <ExpandingButton
                variant="secondary"
                icon={X}
                label="Cerrar"
                onClick={() => setQrModalUrl(null)}
              />
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
            const updated = actaForm.asistentes.map((item: any, idx: number) =>
              idx === signingAssistantIndex ? { ...item, firma: b64 } : item
            );
            handleUpdateAsistentes(updated, true);
            setSigningAssistantIndex(null);
            showToast({ message: 'Firma registrada y sincronizada en el Informe Oficial', status: 'success' });
          }
        }}
      />

      {/* ═══ PANEL LATERAL DE HISTORIAL DE INFORMES ═══ */}
      <ReportHistory
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(false)}
        onSelectReport={handleSelectReportFromHistory}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-convivencia']}
      />
    </div>
  );
}
