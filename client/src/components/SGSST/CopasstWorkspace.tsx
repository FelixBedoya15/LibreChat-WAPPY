import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Copy,
  RefreshCw,
  Check,
  History,
  Save,
  Database,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
import { SignaturePad } from './SignaturePad';
import ExpandingButton from './ExpandingButton';
import WorkerAutocomplete from './WorkerAutocomplete';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import { syncCommitteeSignaturesInHtml } from './committeeSignaturesHtml';

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
  const [actaModalTab, setActaModalTab] = useState<'form' | 'report'>('form');
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFileName, setReportFileName] = useState('Acta-COPASST');
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  // Guardado e Historial de Informes / Datos
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>('new');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      seguimientoCompromisos: '',
      analisisAccidentalidad: '',
      inspeccionesSeguridad: '',
      capacitacionesYCampanas: '',
      solicitudesTrabajadores: '',
      asesoriaArl: '',
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
  const [newCandidato, setNewCandidato] = useState({ nombre: '', cargo: '', cedula: '' });

  // Modal Designación Directa de Representantes del Empleador (Sin Votación)
  const [showDesignarEmpleadorModal, setShowDesignarEmpleadorModal] = useState(false);
  const [representantesEmpleadorList, setRepresentantesEmpleadorList] = useState<any[]>([]);
  const [newRepEmpleador, setNewRepEmpleador] = useState({ nombre: '', cedula: '', cargo: '', rol: 'Principal' });
  const [savingEmpleador, setSavingEmpleador] = useState(false);

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
      let loadedWorkers = resWorkers.data.workers || [];

      // Fallback a perfil sociodemográfico si workers viene vacío o con pocos registros
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
        // Ignorar si no hay perfil
      }

      setWorkers(loadedWorkers);
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
  const handleOpenNewActa = (targetMonth?: number) => {
    const mesToOpen = typeof targetMonth === 'number' ? targetMonth : (new Date().getMonth() + 1);
    const currentYear = new Date().getFullYear();

    // Si ya existe un acta guardada para ese mes, abrirla en lugar de sobreescribir con blanco
    const existingActa = actas.find((a) => Number(a.mes) === mesToOpen && Number(a.anio) === currentYear);
    if (existingActa) {
      handleEditActa(existingActa);
      return;
    }

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
      mes: mesToOpen,
      anio: currentYear,
      tipo: 'ordinaria_mensual',
      lugar: 'Sala Principal de Reuniones / Híbrida',
      horaInicio: '08:00',
      horaFin: '10:00',
      quorumVerificado: true,
      asistentes: defaultAsistentes,
      desarrollo: {
        lecturaActaAnterior: 'Aprobada sin modificaciones.',
        seguimientoCompromisos: 'Se verificó el cumplimiento satisfactorio de las tareas asignadas en la sesión anterior.',
        analisisAccidentalidad: 'Cero accidentes de trabajo en el periodo analizado.',
        inspeccionesSeguridad: 'Ronda de inspección de extintores y botiquines sin hallazgos críticos.',
        capacitacionesYCampanas: 'Seguimiento satisfactorio al cronograma anual de capacitaciones.',
        solicitudesTrabajadores: 'Se atendieron inquietudes sobre ergonomía, dotación de EPP y confort en puestos de trabajo.',
        asesoriaArl: 'Seguimiento a recomendaciones técnicas y actividades de promoción y prevención con la ARL.',
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
    setReportHtml('');
    setSelectedActa(null);
    setActaModalTab('form');
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
    if (acta.reporteOficialHtml) {
      setReportHtml(syncCommitteeSignaturesInHtml(acta.reporteOficialHtml, acta.asistentes || [], 'copasst'));
    } else {
      setReportHtml('');
    }
    setActaModalTab('form');
    setShowActaModal(true);
  };

  const handleSaveActa = async (closeModal = true) => {
    setIsSavingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...actaForm,
        id: actaForm.id || selectedActa?._id,
        reporteOficialHtml: reportHtml || selectedActa?.reporteOficialHtml || undefined,
      };
      const res = await axios.post('/api/sgsst/copasst/actas', payload, { headers });
      if (res.data?.acta) {
        setSelectedActa(res.data.acta);
        setActaForm((prev: any) => ({
          ...prev,
          id: res.data.acta._id,
          consecutivo: res.data.acta.consecutivo || prev.consecutivo,
        }));
      }
      showToast({ message: 'Datos del acta guardados exitosamente en la base de datos', status: 'success' });
      if (closeModal) {
        setShowActaModal(false);
      }
      fetchAllData();
    } catch (err: any) {
      console.error('Error saving acta:', err);
      showToast({ message: err.response?.data?.error || 'Error al guardar el acta', status: 'error' });
    } finally {
      setIsSavingData(false);
    }
  };

  const handleSaveReport = useCallback(async () => {
    const currentHtml = liveEditorRef.current?.getHTML() || reportHtml;
    if (!currentHtml) {
      showToast({ message: 'No hay informe oficial generado para guardar', status: 'warning' });
      return;
    }
    if (!token) return;

    setIsSavingReport(true);
    try {
      // 1. Guardar el HTML en el registro del Acta en MongoDB
      const headers = { Authorization: `Bearer ${token}` };
      const actaPayload = {
        ...actaForm,
        id: actaForm.id || selectedActa?._id,
        reporteOficialHtml: currentHtml,
      };
      const resActa = await axios.post('/api/sgsst/copasst/actas', actaPayload, { headers });
      if (resActa.data?.acta) {
        setSelectedActa(resActa.data.acta);
        setActaForm((prev: any) => ({
          ...prev,
          id: resActa.data.acta._id,
          consecutivo: resActa.data.acta.consecutivo || prev.consecutivo,
        }));
      }

      // 2. Guardar versión en el Historial General de Informes (ReportHistory) con datos embebidos
      const stateData = {
        actaForm: {
          ...actaPayload,
          id: resActa.data?.acta?._id || actaPayload.id,
          consecutivo: resActa.data?.acta?.consecutivo || actaPayload.consecutivo,
        },
      };
      const stateComment = `<!-- SGSST_COPASST_ACTA_V1:${JSON.stringify(stateData)} -->`;
      const contentToSave = currentHtml.replace(/<!-- SGSST_COPASST_ACTA_V1:.*? -->/g, '') + stateComment;
      const reportTitle = `Acta COPASST ${resActa.data?.acta?.consecutivo || actaForm.consecutivo || `Mes ${actaForm.mes}-${actaForm.anio}`} - ${new Date().toLocaleDateString('es-CO')}`;

      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            conversationId,
            messageId: reportMessageId,
            content: contentToSave,
            title: reportTitle,
          }),
        });
        if (res.ok) {
          setRefreshTrigger((prev) => prev + 1);
        }
      } else {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            content: contentToSave,
            title: reportTitle,
            tags: ['sgsst-copasst'],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setConversationId(data.conversationId);
          setReportMessageId(data.messageId);
          setRefreshTrigger((prev) => prev + 1);
        }
      }

      setReportHtml(currentHtml);
      fetchAllData();
      showToast({ message: 'Informe Oficial y datos del acta guardados en el historial exitosamente', status: 'success' });
    } catch (err: any) {
      console.error('Error saving official report:', err);
      showToast({ message: 'Error al guardar el informe oficial', status: 'error' });
    } finally {
      setIsSavingReport(false);
    }
  }, [reportHtml, actaForm, selectedActa, token, conversationId, reportMessageId, showToast]);

  const handleSelectReportFromHistory = useCallback(
    async (selectedConvoId: string) => {
      try {
        const res = await fetch(`/api/messages/${selectedConvoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load history message');
        const messages = await res.json();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.text) {
          let loadedHtml = lastMsg.text;
          const match = loadedHtml.match(/<!-- SGSST_COPASST_ACTA_V1:(.*?) -->/);
          if (match && match[1]) {
            try {
              const parsedState = JSON.parse(match[1]);
              if (parsedState?.actaForm) {
                setActaForm(parsedState.actaForm);
                if (parsedState.actaForm.id) {
                  const existing = actas.find((a) => a._id === parsedState.actaForm.id);
                  if (existing) setSelectedActa(existing);
                }
              }
            } catch (e) {}
            loadedHtml = loadedHtml.replace(/<!-- SGSST_COPASST_ACTA_V1:.*? -->/g, '');
          }
          setReportHtml(loadedHtml);
          liveEditorRef.current?.setHTML(loadedHtml);
          setConversationId(selectedConvoId);
          setReportMessageId(lastMsg.messageId);
          setIsHistoryOpen(false);
          setActaModalTab('report');
          setShowActaModal(true);
          showToast({ message: 'Informe de Acta COPASST restaurado desde el historial', status: 'success' });
        }
      } catch (err) {
        showToast({ message: 'Error al cargar el informe del historial', status: 'error' });
      }
    },
    [token, actas, showToast]
  );

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

  const handleOpenOfficialReport = async (actaIdOrData?: any, fromTable = false) => {
    setReportLoading(true);
    setActaModalTab('report');
    setShowActaModal(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const isExistingId = typeof actaIdOrData === 'string' && actaIdOrData !== 'preview';
      const actaId = isExistingId ? actaIdOrData : (selectedActa?._id || actaForm.id || 'preview');
      const bodyPayload = fromTable && isExistingId ? {} : actaForm;

      if (fromTable && isExistingId) {
        const found = actas.find((a) => a._id === actaIdOrData);
        if (found) {
          setSelectedActa(found);
          setActaForm({
            id: found._id,
            consecutivo: found.consecutivo,
            mes: found.mes,
            anio: found.anio,
            tipo: found.tipo || 'ordinaria_mensual',
            lugar: found.lugar || 'Sala Principal de Reuniones / Híbrida',
            horaInicio: found.horaInicio || '08:00',
            horaFin: found.horaFin || '10:00',
            quorumVerificado: found.quorumVerificado !== false,
            asistentes: found.asistentes || [],
            desarrollo: found.desarrollo || {},
            compromisos: found.compromisos || [],
          });
        }
      }

      const res = await axios.post(`/api/sgsst/copasst/actas/${actaId}/reporte-oficial`, bodyPayload, { headers });
      if (res.data?.acta) {
        setSelectedActa(res.data.acta);
        setActaForm((prev: any) => ({
          ...prev,
          id: res.data.acta._id,
          consecutivo: res.data.acta.consecutivo || prev.consecutivo,
        }));
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
        const fileName = res.data.fileName || (selectedActa?.consecutivo ? `Acta-COPASST-${selectedActa.consecutivo}` : 'Acta-COPASST');
        setReportFileName(fileName);
        setConversationId('new');
        setReportMessageId(null);
        fetchAllData();
        showToast({ message: '¡Informe Oficial complementado con Tenshi IA y guardado automáticamente!', status: 'success' });
      }
    } catch (err: any) {
      console.error('Error opening official acta report:', err);
      showToast({ message: err.response?.data?.error || 'Error al generar el acta oficial con firmas', status: 'error' });
    } finally {
      setReportLoading(false);
    }
  };

  const handleUpdateAsistentes = useCallback(
    async (nextAsistentes: any[]) => {
      const baseHtml = liveEditorRef.current?.getHTML() || reportHtml || selectedActa?.reporteOficialHtml || '';
      const updatedHtml = baseHtml ? syncCommitteeSignaturesInHtml(baseHtml, nextAsistentes, 'copasst') : '';

      setActaForm((prev: any) => ({
        ...prev,
        asistentes: nextAsistentes,
      }));

      if (updatedHtml) {
        setReportHtml(updatedHtml);
        liveEditorRef.current?.setHTML(updatedHtml);
      }

      // Auto-persistir los asistentes y el HTML sincronizado en base de datos si el acta ya existe o está abierta
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const payload = {
          ...actaForm,
          asistentes: nextAsistentes,
          id: actaForm.id || selectedActa?._id,
          reporteOficialHtml: updatedHtml || undefined,
        };
        const res = await axios.post('/api/sgsst/copasst/actas', payload, { headers });
        if (res.data?.acta) {
          setSelectedActa(res.data.acta);
          setActaForm((prev: any) => ({
            ...prev,
            id: res.data.acta._id,
            consecutivo: res.data.acta.consecutivo || prev.consecutivo,
          }));
          fetchAllData();
        }
      } catch (e) {
        console.warn('Auto-save asistentes warning:', e);
      }
    },
    [actaForm, reportHtml, selectedActa, token],
  );

  const handleCopySigningLink = async () => {
    const companyId = config?.company?.id || config?.comite?.companyId || '';
    const link = `${window.location.origin}/sgsst-public/comites/${companyId}`;
    navigator.clipboard.writeText(link);
    showToast({ message: 'Enlace copiado. Compártelo con los miembros del comité para firmar desde su dispositivo.', status: 'success' });
  };

  const handleGenerateWithAI = async () => {
    setIsGeneratingIA(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        '/api/sgsst/copasst/actas/generar-borrador-ia',
        {
          id: actaForm.id || selectedActa?._id,
          consecutivo: actaForm.consecutivo,
          tipo: actaForm.tipo,
          lugar: actaForm.lugar,
          horaInicio: actaForm.horaInicio,
          horaFin: actaForm.horaFin,
          quorumVerificado: actaForm.quorumVerificado,
          asistentes: actaForm.asistentes,
          compromisos: actaForm.compromisos,
          mes: actaForm.mes,
          anio: actaForm.anio,
          accidentalidadReportada: actaForm.desarrollo?.analisisAccidentalidad,
          inspeccionesRealizadas: actaForm.desarrollo?.inspeccionesSeguridad,
          desarrolloActual: actaForm.desarrollo,
        },
        { headers }
      );

      if (res.data.borrador) {
        const { compromisosSugeridos, ...desarrolloBorrador } = res.data.borrador;
        setActaForm((prev: any) => ({
          ...prev,
          id: res.data.acta?._id || prev.id,
          consecutivo: res.data.acta?.consecutivo || prev.consecutivo,
          desarrollo: {
            ...prev.desarrollo,
            ...desarrolloBorrador,
          },
          compromisos: [
            ...(prev.compromisos || []),
            ...(compromisosSugeridos || []).map((c: any) => ({
              ...c,
              estado: 'pendiente',
            })),
          ],
        }));
        if (res.data.acta) {
          setSelectedActa(res.data.acta);
        }
        fetchAllData();
        showToast({ message: '¡Los 8 puntos del acta fueron redactados con Tenshi IA y guardados automáticamente!', status: 'success' });
      }
    } catch (err) {
      console.error('Error generating with AI:', err);
      showToast({ message: 'Error al redactar con IA', status: 'error' });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const handleSyncCommitteeMembersToActa = () => {
    const list: any[] = [];
    if (config?.comite) {
      (config.comite.representantesEmpleador || []).forEach((r: any) => {
        list.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Empleador (${r.rol || 'Principal'})`,
          asistio: true,
          firma: null,
        });
      });
      (config.comite.representantesTrabajadores || []).forEach((r: any) => {
        list.push({
          nombre: r.nombre,
          cedula: r.cedula,
          cargo: r.cargo,
          rol: `Trabajadores (${r.rol || 'Principal'})`,
          asistio: true,
          firma: null,
        });
      });
      if (config.comite.vigia?.nombre) {
        list.push({
          nombre: config.comite.vigia.nombre,
          cedula: config.comite.vigia.cedula,
          cargo: config.comite.vigia.cargo,
          rol: 'Vigía de SST',
          asistio: true,
          firma: null,
        });
      }
    }
    if (list.length === 0) {
      showToast({ message: 'No hay miembros registrados en la conformación oficial del COPASST. Registra primero los representantes o abre votaciones.', status: 'warning' });
      return;
    }
    const existingCedulas = new Set((actaForm.asistentes || []).map((a: any) => String(a.cedula).trim()));
    const nuevos = list.filter((m) => !existingCedulas.has(String(m.cedula).trim()));
    if (nuevos.length === 0) {
      showToast({ message: 'Todos los miembros oficiales del COPASST ya están convocados en el acta.', status: 'info' });
      return;
    }
    const nextAsistentes = [...(actaForm.asistentes || []), ...nuevos];
    handleUpdateAsistentes(nextAsistentes);
    showToast({ message: `Se convocaron ${nuevos.length} miembros oficiales del COPASST y se actualizaron en el informe`, status: 'success' });
  };

  const handleCopyWorkerSignLink = async (cedula: string) => {
    const origin = window.location.origin;
    const companyId = config?.company?.id || config?.comite?.companyId || '';
    const url = `${origin}/sgsst-public/comites/${companyId}?cedula=${encodeURIComponent(cedula)}`;
    navigator.clipboard.writeText(url);
    // Asegurar que el asistente esté guardado en BD antes de que abra el enlace
    handleUpdateAsistentes(actaForm.asistentes || []);
    showToast({ message: 'Enlace de firma copiado. Puedes enviarlo por WhatsApp al trabajador.', status: 'success' });
  };

  const handleOpenDesignarEmpleadorModal = () => {
    setRepresentantesEmpleadorList(config?.comite?.representantesEmpleador ? [...config.comite.representantesEmpleador] : []);
    setNewRepEmpleador({ nombre: '', cedula: '', cargo: '', rol: 'Principal' });
    setShowDesignarEmpleadorModal(true);
  };

  const handleSaveRepresentantesEmpleador = async () => {
    if (representantesEmpleadorList.length === 0) {
      showToast({ message: 'Agrega al menos un representante designado por el empleador', status: 'warning' });
      return;
    }
    setSavingEmpleador(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        '/api/sgsst/copasst/comite',
        { representantesEmpleador: representantesEmpleadorList },
        { headers }
      );
      showToast({ message: 'Representantes del empleador designados y formalizados con éxito', status: 'success' });
      setShowDesignarEmpleadorModal(false);
      fetchAllData();
    } catch (err: any) {
      console.error('Error saving employer representatives:', err);
      showToast({ message: err.response?.data?.error || 'Error al guardar representantes del empleador', status: 'error' });
    } finally {
      setSavingEmpleador(false);
    }
  };

  const handleCreateEleccion = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (!eleccionForm.candidatos || eleccionForm.candidatos.length === 0) {
        showToast({ message: 'Debes postular al menos un candidato para abrir la urna digital', status: 'warning' });
        return;
      }
      const sanitizedPayload = {
        ...eleccionForm,
        candidatos: eleccionForm.candidatos.map((c: any, idx: number) => {
          const ced = String(c.cedula || c.identificacion || c.documento || '').trim();
          const candId = String(c.id || ced || `cand-${Date.now()}-${idx}`).trim();
          return {
            ...c,
            id: candId,
            cedula: ced || candId,
            propuesta: c.propuesta || 'Compromiso por la prevención y el bienestar de todos.',
            votos: Number(c.votos) || 0,
          };
        }),
      };
      await axios.post('/api/sgsst/copasst/elecciones', sanitizedPayload, { headers });
      showToast({ message: 'Convocatoria a elecciones creada y urna digital activa', status: 'success' });
      setShowEleccionModal(false);
      fetchAllData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al crear proceso de elección', status: 'error' });
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
          {
            id: 'tb-copasst-history',
            onClick: () => setIsHistoryOpen(!isHistoryOpen),
            label: 'Historial de Informes',
            icon: History,
            title: 'Consultar historial de actas e informes oficiales del COPASST',
            variant: 'history',
            active: isHistoryOpen,
          },
        ]}
        customSections={[
          <div key="copasst-actions-bar" className="flex items-center gap-1.5">
            {activeTab === 'actas' && (
              <ToolbarButton
                id="tb-new-acta"
                onClick={() => handleOpenNewActa()}
                label="Nueva Acta Mensual"
                icon={Plus}
                title="Registrar o Continuar Acta Mensual del COPASST"
                variant="ai"
              />
            )}
            {activeTab === 'conformacion' && (
              <>
                <ToolbarButton
                  id="tb-designar-empleador"
                  onClick={handleOpenDesignarEmpleadorModal}
                  label="Designar Empleador"
                  icon={Shield}
                  title="Designar Representantes del Empleador (Sin Votación)"
                  variant="ai"
                />
                <ToolbarButton
                  id="tb-convocar-eleccion"
                  onClick={() => setActiveTab('elecciones')}
                  label="Convocar Votación Secreta"
                  icon={Vote}
                  title="Abrir Votación Secreta Digital"
                  variant="dummy"
                />
              </>
            )}
            {activeTab === 'elecciones' && (
              <ToolbarButton
                id="tb-nueva-convocatoria-elecciones"
                onClick={() => {
                  setEleccionForm({
                    titulo: `Elección COPASST ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                    candidatos: workers.slice(0, 4).map((w, idx) => {
                      const ced = String(w.cedula || w.documento || w.identificacion || '').trim();
                      const candId = String(ced || `cand-${Date.now()}-${idx}`).trim();
                      return {
                        id: candId,
                        nombre: w.nombre,
                        cedula: ced || candId,
                        cargo: w.cargo || '',
                        propuesta: 'Compromiso por la prevención y el bienestar de todos.',
                        votos: 0,
                      };
                    }),
                  });
                  setShowEleccionModal(true);
                }}
                label="Nueva Convocatoria Electoral"
                icon={Plus}
                title="Publicar Nueva Convocatoria a Elecciones"
                variant="dummy"
              />
            )}
          </div>
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
                  className={`rounded-2xl border p-4 transition-all duration-300 relative flex flex-col justify-between ${
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
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {(() => {
                            const totalAsist = actaDelMes.asistentes?.length || 0;
                            const totalFirmas = (actaDelMes.asistentes || []).filter((a: any) => Boolean(a.firma)).length;
                            const allSigned = totalAsist > 0 && totalFirmas >= totalAsist;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
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
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 italic">
                        Sin acta registrada para este periodo.
                      </p>
                    )}
                  </div>

                  {/* Micro-Botones Expansibles al Hover (individuales por botón) */}
                  <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    {actaDelMes ? (
                      <>
                        <button
                          onClick={() => {
                            handleEditActa(actaDelMes);
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
                          onClick={() => handleEditActa(actaDelMes)}
                          className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-1.5 shadow-sm active:scale-95 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                          title="Ver y Editar Acta"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Examinar</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDeleteActa(actaDelMes._id)}
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
                        onClick={() => handleOpenNewActa(mesNum)}
                        className="group/btn shrink-0 flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-200 px-2 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-600 dark:text-teal-300"
                        title="Diligenciar Acta del Mes"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover/btn:ml-1 group-hover/btn:max-w-[110px] group-hover/btn:opacity-100 sm:flex">
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

              <div className="flex items-center gap-2">
                <ExpandingButton
                  onClick={handleOpenDesignarEmpleadorModal}
                  label="Designar Empleador"
                  icon={Shield}
                  variant="teal"
                  title="Designar directamente los representantes del empleador (Presidente, Principales, Suplentes) sin votación"
                />
                <ExpandingButton
                  onClick={() => setActiveTab('elecciones')}
                  label="Convocar Votación Trabajadores"
                  icon={Vote}
                  variant="orange"
                  title="Iniciar Convocatoria y Votación Secreta Digital para trabajadores"
                />
              </div>
            </div>

            {/* Representantes Empleador */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Representantes del Empleador (Designados por Gerencia)
                </h4>
                <ExpandingButton
                  onClick={handleOpenDesignarEmpleadorModal}
                  label="Gestionar Designación"
                  icon={Edit2}
                  variant="outline-teal"
                  size="sm"
                  title="Modificar o añadir representantes designados por la Gerencia"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(config?.comite?.representantesEmpleador || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-xs text-slate-400 italic flex items-center justify-between">
                    <span>Sin representantes del empleador designados aún.</span>
                    <button
                      type="button"
                      onClick={handleOpenDesignarEmpleadorModal}
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      + Designar ahora
                    </button>
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

            <ExpandingButton
              onClick={() => {
                setEleccionForm({
                  titulo: `Elección COPASST ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                  candidatos: workers.slice(0, 4).map((w, idx) => {
                    const ced = String(w.cedula || w.documento || w.identificacion || '').trim();
                    const candId = String(ced || `cand-${Date.now()}-${idx}`).trim();
                    return {
                      id: candId,
                      nombre: w.nombre,
                      cedula: ced || candId,
                      cargo: w.cargo || '',
                      propuesta: 'Compromiso por la prevención y el bienestar de todos.',
                      votos: 0,
                    };
                  }),
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
                            <ExpandingButton
                              onClick={() => setQrModalUrl(votingUrl)}
                              label="Código QR"
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
                              title="Finalizar Votación y Generar Acta Oficial de Escrutinio"
                            />
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
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

              {/* Botonera Flotante Cápsula en el Modal (WAPPY Design System) */}
              <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
                <ToolbarButton
                  id="modal-tab-form"
                  onClick={() => setActaModalTab('form')}
                  label="Diligenciamiento"
                  icon={PenTool}
                  title="Diligenciar campos estructurados del acta"
                  variant="history"
                  active={actaModalTab === 'form'}
                />
                <ToolbarButton
                  id="modal-tab-report"
                  onClick={() => {
                    const baseHtml = liveEditorRef.current?.getHTML() || reportHtml || selectedActa?.reporteOficialHtml || '';
                    if (baseHtml) {
                      const synced = syncCommitteeSignaturesInHtml(baseHtml, actaForm.asistentes || [], 'copasst');
                      setReportHtml(synced);
                      liveEditorRef.current?.setHTML(synced);
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
                      id="modal-btn-generate-report-ai"
                      onClick={() => handleOpenOfficialReport(selectedActa?._id || 'preview', false)}
                      isLoading={reportLoading}
                      label={reportLoading ? 'Generando...' : 'Generar Informe con Tenshi IA'}
                      icon="sparkles"
                      title="Generar o complementar el Informe Oficial membretado con Tenshi IA"
                      variant="dummy"
                    />
                    <ToolbarButton
                      id="modal-btn-history"
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      label="Historial"
                      icon={History}
                      title="Ver Historial de Informes guardados"
                      variant="history"
                      active={isHistoryOpen}
                    />
                    <ToolbarButton
                      id="modal-btn-save-report"
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
                      id="modal-btn-ai-draft"
                      onClick={handleGenerateWithAI}
                      isLoading={isGeneratingIA}
                      label={isGeneratingIA ? 'Redactando...' : 'Redactar con Tenshi IA'}
                      icon="sparkles"
                      title="Redactar borrador del acta con Tenshi IA y guardar automáticamente"
                      variant="dummy"
                    />
                    <ToolbarButton
                      id="modal-btn-history"
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      label="Historial"
                      icon={History}
                      title="Ver Historial de Informes guardados"
                      variant="history"
                      active={isHistoryOpen}
                    />
                    <ToolbarButton
                      id="modal-btn-save-data"
                      onClick={() => handleSaveActa(false)}
                      isLoading={isSavingData}
                      label="Guardar Datos"
                      icon="database"
                      title="Guardar datos del formulario en base de datos sin cerrar"
                      variant="database"
                    />
                    {selectedActa && (
                      <ToolbarButton
                        id="modal-btn-share-link"
                        onClick={handleCopySigningLink}
                        label="Link de Firma"
                        icon={Share2}
                        title="Copiar enlace para que los miembros firmen desde su portal"
                        variant="history"
                      />
                    )}
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
                      Tenshi IA está redactando, complementando y estructurando el Informe Oficial con firmas...
                    </p>
                  </div>
                ) : !reportHtml ? (
                  <div className="flex flex-col items-center justify-center p-14 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-center space-y-3">
                    <Sparkles className="w-10 h-10 text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                        Aún no se ha generado el Informe Oficial para esta acta
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md">
                        Usa el botón superior de Tenshi IA (o haz clic abajo) para estructurar el Informe Oficial en papel membretado A4 con las firmas de los asistentes.
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" /> Asistentes y Firmas Digitales ({actaForm.asistentes?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                    Los miembros convocados firman directamente desde su portal de comités o en esta pantalla
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <ExpandingButton
                    onClick={handleSyncCommitteeMembersToActa}
                    label="Sincronizar Miembros"
                    icon={RefreshCw}
                    variant="secondary"
                    title="Convocatoria obligatoria a todos los miembros oficiales del COPASST"
                    size="sm"
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
                            cargo: w.cargo || '',
                            rol: w.cargo || 'Participante',
                            asistio: true,
                            firma: null,
                          },
                        ];
                        handleUpdateAsistentes(nextAsistentes);
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
                              const updated = [...actaForm.asistentes];
                              updated[aIdx] = { ...updated[aIdx], firma: null, firmadoEn: null };
                              handleUpdateAsistentes(updated);
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
                          handleUpdateAsistentes(updated);
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

            {/* Desarrollo Temático del Acta con Todos los Puntos Legales */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Desarrollo de los Puntos del Orden del Día (Res. 2013/1986 y Dec. 1072/2015)
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
                    placeholder="Lectura de acta ordinaria anterior y constancia de aprobación..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    2. Seguimiento a Compromisos y Tareas Previas
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
                    placeholder="Revisión de avance de tareas pendientes del mes previo..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    3. Análisis de Accidentalidad, Incidentes y Ausentismo (ATEL)
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                    placeholder="Comportamiento del mes, días de incapacidad y causas de incidentes..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    4. Inspecciones Planeadas de Seguridad y Hallazgos en Terreno
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                    placeholder="Inspecciones de extintores, rutas de evacuación, orden y aseo..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    5. Cumplimiento de Cronograma de Capacitaciones y Campañas
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                    placeholder="Cursos ejecutados, asistencia de colaboradores y plan del mes..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    6. Peticiones, Sugerencias e Inquietudes de los Trabajadores
                  </label>
                  <textarea
                    rows={2}
                    value={actaForm.desarrollo?.solicitudesTrabajadores || ''}
                    onChange={(e) =>
                      setActaForm({
                        ...actaForm,
                        desarrollo: { ...actaForm.desarrollo, solicitudesTrabajadores: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                    placeholder="Inquietudes recibidas sobre EPP, ergonomía o condiciones laborales..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    7. Asesoría, Recomendaciones e Intervención de la ARL
                  </label>
                  <textarea
                    rows={2}
                    value={actaForm.desarrollo?.asesoriaArl || ''}
                    onChange={(e) =>
                      setActaForm({
                        ...actaForm,
                        desarrollo: { ...actaForm.desarrollo, asesoriaArl: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-xs"
                    placeholder="Acompañamiento técnico, visitas o capacitaciones brindadas por la ARL..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    8. Proposiciones, Varios y Acuerdos de Cierre
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
                    placeholder="Varios y acuerdos para la próxima reunión..."
                  />
                </div>
              </div>
            </div>

            {/* Compromisos del Acta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Plan de Acción / Compromisos Asumidos ({actaForm.compromisos?.length || 0})
                </h4>
                <ExpandingButton
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
                  label="Agregar Compromiso"
                  icon={Plus}
                  variant="outline-teal"
                  title="Añadir nuevo compromiso / tarea al acta"
                />
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
          </>
        )}
      </div>
    </div>
  )}

      {/* ═══ MODAL CONVOCATORIA ELECCIONES ═══ */}
      {showEleccionModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
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

                {/* Formulario con Autocompletado de Trabajadores para Postulación */}
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
                            propuesta: 'Representar activamente a los trabajadores',
                            votos: 0,
                          },
                        ],
                      });
                      setNewCandidato({ nombre: '', cargo: '', cedula: '' });
                    }}
                    label="Añadir Candidato"
                    icon={Plus}
                    variant="teal"
                    title="Añadir candidato a la lista"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <ExpandingButton
                onClick={() => setShowEleccionModal(false)}
                label="Cancelar"
                icon={X}
                variant="secondary"
                title="Cancelar y cerrar convocatoria"
              />
              <ExpandingButton
                onClick={handleCreateEleccion}
                label="Abrir Urna Digital"
                icon={Vote}
                variant="orange"
                title="Publicar convocatoria y abrir urna digital"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DESIGNACIÓN DIRECTA DEL EMPLEADOR ═══ */}
      {showDesignarEmpleadorModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    Designación Directa de Representantes del Empleador
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Por Resolución 2013/1986 y Dec. 1072/2015, el empleador nombra a dedo a sus representantes y al Presidente sin votación.
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
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                  Designación Empresarial
                </span>
              </div>

              {representantesEmpleadorList.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30">
                  <p className="text-xs font-medium text-slate-500">
                    Aún no se han registrado representantes del empleador. Añade al Presidente y a los representantes principales o suplentes abajo.
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
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs">
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
                title="Guardar y asentar representantes del empleador en el comité"
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
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Imprime o proyecta este código para que los trabajadores escaneen y voten desde su celular de forma anónima
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCodeSVG value={qrModalUrl} size={180} level="H" />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <ExpandingButton
                onClick={() => setQrModalUrl(null)}
                label="Cerrar"
                icon={X}
                variant="secondary"
                title="Cerrar ventana de QR"
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
            const updated = [...actaForm.asistentes];
            updated[signingAssistantIndex] = {
              ...updated[signingAssistantIndex],
              firma: b64,
              firmadoEn: new Date().toISOString(),
            };
            handleUpdateAsistentes(updated);
            setSigningAssistantIndex(null);
            showToast({ message: 'Firma registrada y actualizada en el Informe Oficial', status: 'success' });
          }
        }}
      />

      {/* ═══ PANEL LATERAL DE HISTORIAL DE INFORMES ═══ */}
      <ReportHistory
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(false)}
        onSelectReport={handleSelectReportFromHistory}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-copasst']}
      />
    </div>
  );
}
