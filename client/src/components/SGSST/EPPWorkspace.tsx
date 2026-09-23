import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { 
  Shield, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  FileText, 
  Trash2, 
  Search, 
  FileSignature, 
  Printer, 
  Wrench, 
  ArrowRight,
  ArrowLeft,
  ClipboardList,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  ShieldAlert,
  Loader2,
  Zap,
  PackageCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '~/utils';
import { SignaturePad } from './SignaturePad';
import { exportEppToExcel } from './exportEpp';
import { saveAs } from 'file-saver';
import { SGSSTToolbar } from './SGSSTToolbar';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExportDropdown from './ExportDropdown';
import { UpgradeWall } from './UpgradeWall';

interface EppItem {
  id: string;
  nombre: string;
  tipo: 'Regular' | 'Alturas';
  marca?: string;
  referencia?: string;
  serial?: string;
  fechaUltimaInspeccion?: string;
  fechaProximaInspeccion?: string;
  inspeccionadoPor?: string;
  resultadoInspeccion?: 'Aprobado' | 'Rechazado' | 'N/A';
  fechaEntrega: string;
  fechaVencimiento?: string;
  cantidad: number;
  estado: 'Entregado' | 'Vencido' | 'Inspección Requerida' | 'Fuera de Servicio';
  firmaTrabajador?: string;
  observaciones?: string;
}

interface WorkerEppDoc {
  workerId: string;
  documento: string;
  nombreTrabajador: string;
  cargo: string;
  entregas: EppItem[];
}

interface SocioWorker {
  id: string;
  nombre: string;
  identificacion: string;
  cargo: string;
  firmaDigital?: string;
  consentimientoFirmaDigital?: string;
}

interface CargoProfile {
  id: string;
  nombreCargo: string;
  eppSeleccionados?: string[];
}

function matchesCargoName(cargoA?: string, cargoB?: string): boolean {
  if (!cargoA || !cargoB) return false;
  const a = cargoA.toLowerCase().trim();
  const b = cargoB.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const partsA = a.split(/[/,–—\-\(\)]+/).map(p => p.trim()).filter(p => p.length > 2);
  const partsB = b.split(/[/,–—\-\(\)]+/).map(p => p.trim()).filter(p => p.length > 2);

  for (const pa of partsA) {
    for (const pb of partsB) {
      if (pa === pb || pa.includes(pb) || pb.includes(pa)) return true;
    }
  }
  return false;
}

function getMatchingIpevarRows(workerCargo?: string, rows: any[] = []): any[] {
  if (!workerCargo || !Array.isArray(rows) || rows.length === 0) return [];
  const cargoNorm = workerCargo.toLowerCase().trim();
  const parts = cargoNorm.split(/[/,–—\-\(\)]+/).map(p => p.trim()).filter(p => p.length > 2);

  return rows.filter(r => {
    const rowCargo = (r.cargo || '').toLowerCase().trim();
    if (rowCargo && (rowCargo === cargoNorm || rowCargo.includes(cargoNorm) || cargoNorm.includes(rowCargo))) {
      return true;
    }
    for (const part of parts) {
      if (rowCargo && (rowCargo.includes(part) || part.includes(rowCargo))) {
        return true;
      }
    }
    const act = (r.actividad || '').toLowerCase();
    const tar = (r.tareas || '').toLowerCase();
    for (const part of parts) {
      if (act.includes(part) || tar.includes(part)) {
        return true;
      }
    }
    return false;
  });
}

function extractEppsFromIpevarRows(rows: any[]): string[] {
  const eppsSet = new Set<string>();
  rows.forEach(r => {
    const texts = [r.medida_eppu, r.controles_individuo];
    texts.forEach(txt => {
      if (txt && typeof txt === 'string' && txt !== 'Ninguno' && txt !== 'No aplica' && txt !== 'N/A') {
        const parts = txt.split(/[,;\n•\-\/]+/).map(s => s.trim()).filter(s => s.length > 2);
        parts.forEach(p => {
          const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
          eppsSet.add(capitalized);
        });
      }
    });
  });
  return Array.from(eppsSet);
}

export default function EPPWorkspace() {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  // State
  const [workers, setWorkers] = useState<SocioWorker[]>([]);
  const [cargoProfiles, setCargoProfiles] = useState<CargoProfile[]>([]);
  const [officialMatrixRows, setOfficialMatrixRows] = useState<any[]>([]);
  const [eppDocs, setEppDocs] = useState<WorkerEppDoc[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<SocioWorker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSyncingIpevar, setIsSyncingIpevar] = useState(false);

  // Collapsible states
  const [isCargoExpanded, setIsCargoExpanded] = useState(true);
  const [isIpevarHazardsExpanded, setIsIpevarHazardsExpanded] = useState(false);
  const [isAlturasExpanded, setIsAlturasExpanded] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // AI Report States
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const editorContentRef = useRef<string | null>(null);

  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || Boolean(user?.isSubUser);

  // Calculations for selected worker
  const selectedDoc = eppDocs.find(doc => doc.workerId === selectedWorker?.id);

  const activeCargoProfile = useMemo(() => {
    if (!selectedWorker?.cargo) return null;
    return cargoProfiles.find(profile => 
      matchesCargoName(profile?.nombreCargo, selectedWorker.cargo) ||
      profile?.id === selectedWorker?.id
    );
  }, [cargoProfiles, selectedWorker]);

  const matchingIpevarRows = useMemo(() => {
    if (!selectedWorker?.cargo) return [];
    return getMatchingIpevarRows(selectedWorker.cargo, officialMatrixRows);
  }, [selectedWorker, officialMatrixRows]);

  const ipevarEpps = useMemo(() => {
    return extractEppsFromIpevarRows(matchingIpevarRows);
  }, [matchingIpevarRows]);

  const cargoProfileEpps = activeCargoProfile?.eppSeleccionados || [];

  // Combine EPPs from Cargo Profile and Matriz IPEVAR (Hito 1)
  const recommendedEpps = useMemo(() => {
    const combined = new Set<string>();
    cargoProfileEpps.forEach(e => { if (e && e.trim()) combined.add(e.trim()); });
    ipevarEpps.forEach(e => { if (e && e.trim()) combined.add(e.trim()); });
    return Array.from(combined);
  }, [cargoProfileEpps, ipevarEpps]);

  const handleGenerate = useCallback(async () => {
    if (!selectedWorker) {
      showToast({ message: 'Seleccione un trabajador primero', status: 'warning' });
      return;
    }
    const isNew = !conversationId || conversationId === 'new';
    if (!isPro && isNew) {
      try {
        const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-epp`, { headers: { Authorization: `Bearer ${token}` } });
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/sgsst/epp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          workerId: selectedWorker.id, 
          nombreTrabajador: selectedWorker.nombre, 
          cargo: selectedWorker.cargo, 
          entregas: selectedDoc?.entregas || [], 
          modelName: selectedModel 
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al generar el informe');
      }
      const data = await response.json();
      setGeneratedReport(data.report);
      editorContentRef.current = data.report;
      liveEditorRef.current?.setHTML(data.report);
      setConversationId(null);
      setReportMessageId(null);
      showToast({ message: 'Informe generado exitosamente', status: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Error al generar informe', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedWorker, selectedDoc, selectedModel, token, isPro, conversationId, showToast]);

  const handleSave = useCallback(async () => {
    const contentToSave = editorContentRef.current || generatedReport;
    if (!contentToSave || !token) return;

    const isNew = !conversationId || conversationId === 'new';
    if (!isPro && isNew) {
      try {
        const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-epp`, { headers: { Authorization: `Bearer ${token}` } });
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }

    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
        });
        if (res.ok) { 
          setRefreshTrigger(p => p + 1); 
          showToast({ message: 'Informe actualizado exitosamente', status: 'success' }); 
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          content: contentToSave,
          title: `Informe EPP - ${selectedWorker?.nombre} - ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-epp'],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setReportMessageId(data.messageId);
        setRefreshTrigger(p => p + 1);
        showToast({ message: 'Guardado exitosamente', status: 'success' });
      }
    } catch (error: any) {
      showToast({ message: `Error: ${error.message}`, status: 'error' });
    }
  }, [generatedReport, conversationId, reportMessageId, token, isPro, selectedWorker, showToast]);

  const handleSelectReport = useCallback(async (selectedConvoId: string) => {
    if (!selectedConvoId) return;
    try {
      const res = await fetch(`/api/messages/${selectedConvoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const messages = await res.json();
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.text) {
        setGeneratedReport(lastMsg.text);
        editorContentRef.current = lastMsg.text;
        liveEditorRef.current?.setHTML(lastMsg.text);
        setConversationId(selectedConvoId);
        setReportMessageId(lastMsg.messageId);
        showToast({ message: 'Informe cargado correctamente', status: 'success' });
      }
    } catch (e) {
      showToast({ message: 'Error al cargar el informe', status: 'error' });
    }
    setIsHistoryOpen(false);
  }, [token, showToast]);

  // New EPP Form state
  const [formEppName, setFormEppName] = useState('');
  const [formTipo, setFormTipo] = useState<'Regular' | 'Alturas'>('Regular');
  const [formCantidad, setFormCantidad] = useState(1);
  const [formFechaEntrega, setFormFechaEntrega] = useState(new Date().toISOString().substring(0, 10));
  const [formVencimientoInterval, setFormVencimientoInterval] = useState('6'); // months
  const [formMarca, setFormMarca] = useState('');
  const [formReferencia, setFormReferencia] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formFechaUltimaInspeccion, setFormFechaUltimaInspeccion] = useState('');
  const [formFechaProximaInspeccion, setFormFechaProximaInspeccion] = useState('');
  const [formInspeccionadoPor, setFormInspeccionadoPor] = useState('');
  const [formResultadoInspeccion, setFormResultadoInspeccion] = useState<'Aprobado' | 'Rechazado' | 'N/A'>('N/A');
  const [formSignature, setFormSignature] = useState<string | null>(null);
  const [formObservaciones, setFormObservaciones] = useState('');

  // Fetch initial data
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Workers
      const workersRes = await fetch('/api/sgsst/perfil-sociodemografico/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const workersData = await workersRes.json();
      setWorkers(Array.isArray(workersData?.trabajadores) ? workersData.trabajadores : []);

      // 2. Fetch Cargo Profiles
      const cargoRes = await fetch('/api/sgsst/perfiles-cargo/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cargoData = await cargoRes.json();
      setCargoProfiles(Array.isArray(cargoData?.perfilesList) ? cargoData.perfilesList : []);

      // 3. Fetch EPP Deliveries
      const eppRes = await fetch('/api/sgsst/epp/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eppData = await eppRes.json();
      setEppDocs(Array.isArray(eppData) ? eppData : []);

      // 4. Fetch Official Matriz IPEVAR (Hito 1)
      try {
        const matrixRes = await fetch('/api/sgsst/gtc45-workspace/official', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (matrixRes.ok) {
          const matrixData = await matrixRes.json();
          setOfficialMatrixRows(Array.isArray(matrixData?.matrixRows) ? matrixData.matrixRows : []);
        }
      } catch (mErr) {
        console.warn('[EPP Workspace] Error loading official matrix:', mErr);
      }
    } catch (err) {
      console.error('[EPP Workspace] Fetch error:', err);
      showToast({ message: 'Error al cargar los datos del módulo EPP', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Autocomplete suggestions
  const standardEppSuggestions = [
    'Casco dieléctrico con barbuquejo',
    'Gafas de seguridad con filtro UV',
    'Protectores auditivos tipo copa',
    'Protectores auditivos de inserción',
    'Mascarilla de protección respiratoria N95',
    'Guantes de nitrilo',
    'Guantes de vaqueta reforzada',
    'Botas de seguridad con puntera de acero',
    'Arnés de cuerpo entero (4 argollas)',
    'Eslinga de posicionamiento regulable',
    'Eslinga doble con absorbedor de choque',
    'Conector de anclaje (Cinta webbing)',
    'Mosquetón de seguridad automatico'
  ];

  const suggestionsList = Array.from(new Set([...recommendedEpps, ...standardEppSuggestions]));

  // Auto-calculate dates on inspection/delivery date change
  const handleFechaEntregaChange = (dateVal: string) => {
    setFormFechaEntrega(dateVal);
    if (formVencimientoInterval && formVencimientoInterval !== 'never') {
      const deliveryDate = new Date(dateVal + 'T12:00:00');
      deliveryDate.setMonth(deliveryDate.getMonth() + parseInt(formVencimientoInterval, 10));
      setFormVencimientoInterval(formVencimientoInterval);
    }
  };

  const handleIntervalChange = (months: string) => {
    setFormVencimientoInterval(months);
    if (months === 'never') return;
    const deliveryDate = new Date(formFechaEntrega + 'T12:00:00');
    deliveryDate.setMonth(deliveryDate.getMonth() + parseInt(months, 10));
  };

  const handleLastInspeccionChange = (dateVal: string) => {
    setFormFechaUltimaInspeccion(dateVal);
    if (dateVal) {
      const inspDate = new Date(dateVal + 'T12:00:00');
      inspDate.setFullYear(inspDate.getFullYear() + 1); // Inspección anual (1 año)
      setFormFechaProximaInspeccion(inspDate.toISOString().substring(0, 10));
    }
  };

  // Submit delivery form
  const handleSaveEpp = async () => {
    if (!selectedWorker) return;
    if (!formEppName) {
      showToast({ message: 'Por favor, ingrese el nombre del EPP', status: 'warning' });
      return;
    }

    setLoading(true);

    // Calculate dates
    let expiryDate = '';
    if (formVencimientoInterval !== 'never') {
      const d = new Date(formFechaEntrega + 'T12:00:00');
      d.setMonth(d.getMonth() + parseInt(formVencimientoInterval, 10));
      expiryDate = d.toISOString().substring(0, 10);
    }

    const newEppItem: EppItem = {
      id: 'EPP-' + Date.now(),
      nombre: formEppName,
      tipo: formTipo,
      fechaEntrega: formFechaEntrega,
      fechaVencimiento: expiryDate || undefined,
      cantidad: formCantidad,
      estado: 'Entregado',
      firmaTrabajador: formSignature || selectedWorker.firmaDigital || undefined,
      observaciones: formObservaciones
    };

    if (formTipo === 'Alturas') {
      newEppItem.marca = formMarca;
      newEppItem.referencia = formReferencia;
      newEppItem.serial = formSerial;
      newEppItem.fechaUltimaInspeccion = formFechaUltimaInspeccion || undefined;
      newEppItem.fechaProximaInspeccion = formFechaProximaInspeccion || undefined;
      newEppItem.inspeccionadoPor = formInspeccionadoPor || undefined;
      newEppItem.resultadoInspeccion = formResultadoInspeccion;
    }

    const currentDeliveries = selectedDoc ? [...selectedDoc.entregas] : [];
    
    // Add or replace
    const updatedDeliveries = [...currentDeliveries, newEppItem];

    try {
      const res = await fetch('/api/sgsst/epp/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId: selectedWorker.id,
          documento: selectedWorker.identificacion,
          nombreTrabajador: selectedWorker.nombre,
          cargo: selectedWorker.cargo || 'Sin cargo',
          entregas: updatedDeliveries
        })
      });

      if (!res.ok) throw new Error('Save failed');

      showToast({ message: 'EPP registrado y sincronizado exitosamente con IPEVAR', status: 'success' });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al registrar la entrega de EPP', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Delete EPP item
  const handleDeleteEpp = async (itemId: string) => {
    if (!selectedWorker || !selectedDoc) return;
    if (!confirm('¿Está seguro de eliminar este registro de entrega?')) return;

    setLoading(true);
    const updatedDeliveries = selectedDoc.entregas.filter(item => item.id !== itemId);

    try {
      const res = await fetch('/api/sgsst/epp/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId: selectedWorker.id,
          documento: selectedWorker.identificacion,
          nombreTrabajador: selectedWorker.nombre,
          cargo: selectedWorker.cargo || 'Sin cargo',
          entregas: updatedDeliveries
        })
      });

      if (!res.ok) throw new Error('Save failed');

      showToast({ message: 'Registro eliminado exitosamente', status: 'success' });
      loadData();
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al eliminar el registro', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  function resetForm() {
    setFormEppName('');
    setFormTipo('Regular');
    setFormCantidad(1);
    setFormFechaEntrega(new Date().toISOString().substring(0, 10));
    setFormVencimientoInterval('6');
    setFormMarca('');
    setFormReferencia('');
    setFormSerial('');
    setFormFechaUltimaInspeccion('');
    setFormFechaProximaInspeccion('');
    setFormInspeccionadoPor('');
    setFormResultadoInspeccion('N/A');
    setFormSignature(null);
    setFormObservaciones('');
  };

  const handleQuickDeliver = (eppName: string) => {
    const isAlturas = /arnés|eslinga|mosquetón|anclaje|línea de vida|freno/i.test(eppName);
    setFormEppName(eppName);
    setFormTipo(isAlturas ? 'Alturas' : 'Regular');
    setFormCantidad(1);
    setFormFechaEntrega(new Date().toISOString().substring(0, 10));
    setFormVencimientoInterval('6');
    setFormObservaciones(`Dotación requerida según ${activeCargoProfile?.eppSeleccionados?.includes(eppName) ? 'Perfil de Cargo' : 'Matriz IPEVAR Hito 1'}`);
    setIsModalOpen(true);
  };

  const handleDeliverAllRecommended = async () => {
    if (!selectedWorker) return;
    if (recommendedEpps.length === 0) {
      showToast({ message: 'No hay EPPs requeridos para entregar a este cargo.', status: 'warning' });
      return;
    }

    const currentDeliveries = selectedDoc ? [...selectedDoc.entregas] : [];
    const existingNames = new Set(currentDeliveries.map(d => d.nombre.toLowerCase().trim()));

    const pendingEpps = recommendedEpps.filter(e => !existingNames.has(e.toLowerCase().trim()));

    if (pendingEpps.length === 0) {
      showToast({ message: 'El trabajador ya tiene registrados todos los EPPs requeridos.', status: 'info' });
      return;
    }

    const confirmMsg = `¿Desea registrar la entrega de dotación de ${pendingEpps.length} EPPs requeridos para ${selectedWorker.nombre}?`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    const todayStr = new Date().toISOString().substring(0, 10);
    const defaultExpiry = new Date();
    defaultExpiry.setMonth(defaultExpiry.getMonth() + 6);
    const defaultExpiryStr = defaultExpiry.toISOString().substring(0, 10);

    const newItems: EppItem[] = pendingEpps.map((eppName, idx) => {
      const isAlturas = /arnés|eslinga|mosquetón|anclaje|línea de vida|freno/i.test(eppName);
      return {
        id: `EPP-${Date.now()}-${idx}`,
        nombre: eppName,
        tipo: isAlturas ? 'Alturas' : 'Regular',
        fechaEntrega: todayStr,
        fechaVencimiento: defaultExpiryStr,
        cantidad: 1,
        estado: 'Entregado',
        firmaTrabajador: selectedWorker.firmaDigital || undefined,
        observaciones: `Dotación completa requerida según Matriz IPEVAR / Perfil de Cargo (${selectedWorker.cargo})`
      };
    });

    const updatedDeliveries = [...currentDeliveries, ...newItems];

    try {
      const res = await fetch('/api/sgsst/epp/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId: selectedWorker.id,
          documento: selectedWorker.identificacion,
          nombreTrabajador: selectedWorker.nombre,
          cargo: selectedWorker.cargo || 'Sin cargo',
          entregas: updatedDeliveries
        })
      });

      if (!res.ok) throw new Error('Save failed');

      showToast({ message: `¡Se registraron ${newItems.length} entregas de EPP con firma para ${selectedWorker.nombre}!`, status: 'success' });
      loadData();
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al registrar las entregas de dotación', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromIpevar = async () => {
    if (!selectedWorker?.cargo) return;
    if (matchingIpevarRows.length === 0) {
      showToast({ 
        message: `No se encontraron peligros en la Matriz IPEVAR para "${selectedWorker.cargo}". Verifique la matriz en Hito 1.`, 
        status: 'warning' 
      });
      return;
    }

    setIsSyncingIpevar(true);
    try {
      const extracted = extractEppsFromIpevarRows(matchingIpevarRows);
      if (extracted.length === 0) {
        showToast({ 
          message: 'Los peligros de la Matriz IPEVAR para este cargo no tienen medidas EPP especificadas.', 
          status: 'info' 
        });
        return;
      }

      const res = await fetch('/api/sgsst/perfiles-cargo/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombreCargo: selectedWorker.cargo,
          medida_eppu: extracted.join(', '),
          nro_expuestos: matchingIpevarRows[0]?.nro_expuestos || 1,
          proceso: matchingIpevarRows[0]?.proceso || '',
          actividad: matchingIpevarRows[0]?.actividad || '',
        })
      });
      const data = await res.json();
      if (data.perfilesList) {
        setCargoProfiles(data.perfilesList);
      }
      showToast({ 
        message: `¡Se sincronizaron ${extracted.length} EPPs desde la Matriz IPEVAR (Hito 1) para "${selectedWorker.cargo}"!`, 
        status: 'success' 
      });
      loadData();
    } catch (err) {
      console.error('[EPP Sync IPEVAR]', err);
      showToast({ message: 'Error al sincronizar con la Matriz IPEVAR', status: 'error' });
    } finally {
      setIsSyncingIpevar(false);
    }
  };

  const handleApplyStandardPack = async () => {
    if (!selectedWorker?.cargo) return;
    const standardPack = [
      'Casco de seguridad dieléctrico con barbuquejo',
      'Gafas de seguridad con filtro UV',
      'Botas de seguridad con puntera de acero',
      'Guantes de protección mecánica (vaqueta o nitrilo)',
      'Protectores auditivos de inserción'
    ];

    setIsSyncingIpevar(true);
    try {
      const res = await fetch('/api/sgsst/perfiles-cargo/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombreCargo: selectedWorker.cargo,
          medida_eppu: standardPack.join(', '),
        })
      });
      const data = await res.json();
      if (data.perfilesList) {
        setCargoProfiles(data.perfilesList);
      }
      showToast({ 
        message: `¡Dotación estándar básica de campo asignada al cargo "${selectedWorker.cargo}"!`, 
        status: 'success' 
      });
      loadData();
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al asignar dotación básica', status: 'error' });
    } finally {
      setIsSyncingIpevar(false);
    }
  };

  // Helper to generate the HTML for print/download
  const buildReceiptHtml = (
    worker: SocioWorker,
    doc: WorkerEppDoc,
    signature: string | undefined,
    logo: string,
    todayStr: string
  ) => {
    let tableRows = '';
    doc.entregas.forEach(ent => {
      tableRows += `
        <tr>
          <td>${ent.nombre}</td>
          <td>${ent.tipo === 'Alturas' ? 'Alturas' : 'Regular'}</td>
          <td>${ent.cantidad}</td>
          <td>${ent.fechaEntrega}</td>
          <td>${ent.fechaVencimiento || 'N/A'}</td>
          <td>${ent.serial || 'N/A'}</td>
          <td style="text-align:center;">
            ${ent.firmaTrabajador ? `<img src="${ent.firmaTrabajador}" style="max-height: 40px; max-width: 100px;" />` : '<span style="color:#ef4444; font-size:10px;">Firma Faltante</span>'}
          </td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Acta de Entrega de EPP — ${worker.nombre}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 40px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-height: 50px; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f766e; text-align: right; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 10px; }
          .meta-item { font-size: 13px; }
          .meta-label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; margin-bottom: 2px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #0f766e; color: white; padding: 8px 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .legal-text { font-size: 11px; color: #64748b; text-align: justify; margin-bottom: 50px; line-height: 1.6; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
          .signature-box { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; }
          .signature-img { max-height: 60px; max-width: 200px; display: block; margin: 0 auto 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img class="logo" src="${logo}" />
          <div class="title">Acta de Entrega de EPP y Alturas<br><span style="font-size:11px; font-weight:normal; color:#64748b;">SG-SST Resolución 0312</span></div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><div class="meta-label">Trabajador</div><strong>${worker.nombre}</strong></div>
          <div class="meta-item"><div class="meta-label">Documento</div><strong>${worker.identificacion}</strong></div>
          <div class="meta-item"><div class="meta-label">Cargo</div><strong>${worker.cargo || 'Sin cargo'}</strong></div>
          <div class="meta-item"><div class="meta-label">Fecha de Impresión</div><strong>${todayStr}</strong></div>
        </div>

        <h3 style="color:#0f766e; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:15px; text-transform:uppercase; font-size:14px;">EPP e Inspecciones de Alturas Entregados</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Elemento / EPP</th>
              <th>Tipo</th>
              <th>Cant.</th>
              <th>Fecha Entrega</th>
              <th>Fecha Vencimiento</th>
              <th>Serial (Alturas)</th>
              <th style="text-align:center;">Firma Recibido</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="legal-text">
          <strong>COMPROMISO DEL TRABAJADOR:</strong> Manifiesto que he recibido a entera satisfacción los Elementos de Protección Personal (EPP) detallados en la tabla anterior, y que he recibido la capacitación correspondiente para su correcto uso, cuidado, mantenimiento e inspección diaria. Me comprometo a utilizarlos de forma obligatoria durante el desempeño de mis labores, reportar inmediatamente cualquier desgaste o anomalía en los mismos a fin de solicitar su cambio, y no realizar modificaciones o alteraciones a los equipos suministrados (especialmente a los equipos de protección contra caídas en alturas). Lo anterior de conformidad con el Art. 85 de la Ley 9 de 1979 y normas complementarias del SG-SST en Colombia.
        </div>

        <div class="signatures">
          <div class="signature-box">
            ${signature ? `<img class="signature-img" src="${signature}" />` : '<div style="height:60px;"></div>'}
            <strong>${worker.nombre}</strong><br>Trabajador / Recibí Conforme
          </div>
          <div class="signature-box">
            <div style="height:60px;"></div>
            <strong>Responsable SG-SST</strong><br>Entrega Autorizada
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Print Delivery Receipt PDF window
  const handlePrintReceipt = () => {
    if (!selectedWorker || !selectedDoc) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyLogo = localStorage.getItem('wappy_sst_global_logo') || 'https://wappy.club/assets/logo.png';
    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const lastSignature = selectedDoc.entregas.filter(e => e.firmaTrabajador).slice(-1)[0]?.firmaTrabajador || selectedWorker.firmaDigital;

    let receiptHtml = buildReceiptHtml(selectedWorker, selectedDoc, lastSignature, companyLogo, todayStr);
    
    // Add print trigger script before body closing tag
    receiptHtml = receiptHtml.replace('</body>', `
      <script>
        window.onload = function() {
          window.focus();
          window.print();
        }
      </script>
      </body>
    `);

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Download delivery receipt in HTML format
  const handleDownloadHtml = () => {
    if (!selectedWorker || !selectedDoc) return;

    const companyLogo = localStorage.getItem('wappy_sst_global_logo') || 'https://wappy.club/assets/logo.png';
    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const lastSignature = selectedDoc.entregas.filter(e => e.firmaTrabajador).slice(-1)[0]?.firmaTrabajador || selectedWorker.firmaDigital;

    const receiptHtml = buildReceiptHtml(selectedWorker, selectedDoc, lastSignature, companyLogo, todayStr);

    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Acta_Entrega_EPP_${selectedWorker.nombre.replace(/\s+/g, '_')}.html`);
  };

  // Export general EPP records for all workers to Excel
  const handleExportExcel = async () => {
    try {
      showToast({ message: 'Generando reporte de Excel...', status: 'info' });
      await exportEppToExcel(eppDocs, workers);
      showToast({ message: 'Reporte Excel generado correctamente', status: 'success' });
    } catch (err) {
      console.error('[EPP Workspace] Excel export error:', err);
      showToast({ message: 'Error al exportar a Excel', status: 'error' });
    }
  };

  // Filters workers list based on search
  const filteredWorkers = workers.filter(w => 
    (w.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.identificacion || '').includes(searchQuery)
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row h-[780px] w-full border border-border-light dark:border-white/10 rounded-3xl bg-surface-primary shadow-lg overflow-hidden animate-in fade-in duration-200">
      
      {/* ── SECTOR IZQUIERDO: LISTA DE TRABAJADORES ── */}
      <div className={cn("w-full md:w-80 lg:w-96 border-r border-border-light dark:border-white/10 flex flex-col bg-surface-secondary/40 shrink-0 h-full", selectedWorker && "hidden md:flex")}>
        <div className="p-4 md:p-5 border-b border-border-light dark:border-white/10 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-500" /> Trabajadores
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border-medium hover:border-[#0d9488]/40 hover:bg-[#0d9488]/10 text-teal-600 dark:text-teal-400 font-extrabold text-2xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                title="Descargar base de datos general de entregas de EPP en Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <span className="bg-teal-500/10 text-teal-400 text-xs px-2.5 py-1 rounded-full font-bold">
                {workers.length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredWorkers.map(w => {
            const hasDoc = eppDocs.some(doc => doc.workerId === w.id && doc.entregas.length > 0);
            const isSelected = selectedWorker?.id === w.id;

            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWorker(w);
                  resetForm();
                  setGeneratedReport(null);
                  editorContentRef.current = null;
                  setConversationId(null);
                  setReportMessageId(null);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                  isSelected 
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                    : 'bg-surface-primary border-border-light dark:border-white/5 text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-surface-secondary text-text-secondary'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm text-text-primary truncate">{w.nombre}</p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{w.cargo || 'Sin cargo'}</p>
                  </div>
                </div>

                {hasDoc && (
                  <Shield className="w-4 h-4 text-teal-500 shrink-0 ml-2" fill="currentColor" fillOpacity={0.2} />
                )}
              </button>
            );
          })}

          {filteredWorkers.length === 0 && (
            <div className="text-center py-10 text-text-tertiary">
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron trabajadores</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTOR DERECHO: DETALLE DE EPP Y SEGUIMIENTO ── */}
      <div className={cn("flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-surface-primary", !selectedWorker && "hidden md:flex")}>
        {selectedWorker ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden h-full">
            
            {/* Cabecera del trabajador */}
            <div className="p-4 md:p-6 border-b border-border-light dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-secondary/20 shrink-0">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="md:hidden inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a trabajadores
                </button>
                <h2 className="text-xl font-extrabold text-text-primary">{selectedWorker.nombre}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-text-secondary">
                  <span>C.C. {selectedWorker.identificacion}</span>
                  <span>•</span>
                  <span className="text-teal-500">{selectedWorker.cargo || 'Cargo no asignado'}</span>
                </div>
              </div>

              <div className="-my-2">
                <SGSSTToolbar
                  onAnalyze={handleGenerate}
                  isAnalyzing={isGenerating}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  exportContent={selectedDoc && selectedDoc.entregas && selectedDoc.entregas.length > 0 ? buildReceiptHtml(
                    selectedWorker,
                    selectedDoc,
                    selectedDoc.entregas.filter(e => e.firmaTrabajador).slice(-1)[0]?.firmaTrabajador || selectedWorker.firmaDigital,
                    localStorage.getItem('wappy_sst_global_logo') || 'https://wappy.club/assets/logo.png',
                    new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  ) : ''}
                  exportFileName={`Acta_Entrega_EPP_${selectedWorker.nombre.replace(/\s+/g, '_')}`}
                  persistenceButtons={[
                    {
                      id: 'add-delivery',
                      onClick: () => setIsModalOpen(true),
                      label: 'Registrar Entrega',
                      title: 'Registrar nueva entrega de EPP',
                      icon: Plus,
                      variant: 'ai'
                    }
                  ]}
                  onExportExcel={handleExportExcel}
                />
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* EPP Sugeridos del Cargo y Matriz IPEVAR */}
              <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface-tertiary gap-3">
                  <button 
                    onClick={() => setIsCargoExpanded(!isCargoExpanded)} 
                    className="flex items-center gap-2 text-left"
                  >
                    {isCargoExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                    <Shield className="w-5 h-5 text-teal-500 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary text-sm sm:text-base">EPP Requeridos por el Cargo y Matriz IPEVAR</span>
                        {matchingIpevarRows.length > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-teal-500" />
                            {matchingIpevarRows.length} Peligros IPEVAR
                          </span>
                        )}
                        {recommendedEpps.length > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                            {recommendedEpps.length} EPPs Exigidos
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={handleSyncFromIpevar}
                      disabled={isSyncingIpevar}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-medium shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Sincronizar EPPs del cargo con la Matriz de Peligros IPEVAR (Hito 1)"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-teal-500", isSyncingIpevar && "animate-spin")} />
                      <span>{isSyncingIpevar ? 'Sincronizando...' : 'Sincronizar con IPEVAR'}</span>
                    </button>
                    {recommendedEpps.length > 0 && (
                      <button
                        onClick={handleDeliverAllRecommended}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Registrar entrega de todos los EPPs requeridos no entregados aún"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" />
                        <span className="hidden sm:inline">Entregar Dotación Completa</span>
                        <span className="sm:hidden">Dotación</span>
                      </button>
                    )}
                  </div>
                </div>

                {isCargoExpanded && (
                  <div className="p-5 border-t border-border-medium bg-surface-primary space-y-4">
                    {/* Explicación de trazabilidad */}
                    <div className="text-xs text-text-secondary flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border-light dark:border-white/5">
                      <span>
                        Peligros y dotación vinculados al cargo: <strong className="text-text-primary">{selectedWorker?.cargo || 'Sin cargo'}</strong>
                      </span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span> Matriz IPEVAR Hito 1
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Perfil de Cargo
                        </span>
                      </div>
                    </div>

                    {recommendedEpps.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2.5">
                          {recommendedEpps.map((epp, idx) => {
                            const isDelivered = selectedDoc?.entregas.some(
                              ent => ent.nombre.toLowerCase().trim() === epp.toLowerCase().trim() && ent.estado === 'Entregado'
                            );
                            const fromIpevar = ipevarEpps.some(ie => ie.toLowerCase() === epp.toLowerCase());
                            const fromCargo = cargoProfileEpps.some(ce => ce.toLowerCase() === epp.toLowerCase());

                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "border text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-2xs",
                                  isDelivered 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-text-primary" 
                                    : "bg-surface-secondary border-border-medium hover:border-teal-500/40 text-text-primary"
                                )}
                              >
                                {isDelivered ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Shield className="w-4 h-4 text-teal-500 shrink-0" />
                                )}
                                
                                <span className="font-semibold">{epp}</span>

                                {/* Source badge */}
                                {fromIpevar && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono font-medium">
                                    IPEVAR
                                  </span>
                                )}
                                {fromCargo && !fromIpevar && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-medium">
                                    Cargo
                                  </span>
                                )}

                                {/* Action */}
                                {isDelivered ? (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Entregado
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleQuickDeliver(epp)}
                                    className="ml-1 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 font-bold bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                                    title={`Registrar entrega de ${epp}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Entregar</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Botón para desplegar peligros IPEVAR vinculados */}
                        {matchingIpevarRows.length > 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setIsIpevarHazardsExpanded(!isIpevarHazardsExpanded)}
                              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1.5 transition-colors"
                            >
                              {isIpevarHazardsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              <span>{isIpevarHazardsExpanded ? 'Ocultar matriz de peligros del cargo' : `Ver ${matchingIpevarRows.length} peligros identificados en Matriz IPEVAR (Hito 1)`}</span>
                            </button>

                            {isIpevarHazardsExpanded && (
                              <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1">
                                {matchingIpevarRows.map((r, i) => (
                                  <div key={i} className="p-3 bg-surface-secondary/40 border border-border-light dark:border-white/5 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="font-bold text-text-primary">
                                        {r.proceso ? `${r.proceso} • ` : ''}{r.actividad || r.tareas || 'Actividad general'}
                                      </div>
                                      {r.nivel_riesgo_interpretacion && (
                                        <span className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold shrink-0",
                                          r.nivel_riesgo_interpretacion === 'I' || r.nivel_riesgo_interpretacion === 'No Aceptable' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                          r.nivel_riesgo_interpretacion === 'II' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                        )}>
                                          Riesgo {r.nivel_riesgo_interpretacion}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-text-secondary">
                                      <strong className="text-text-primary">Peligro:</strong> {r.peligro_descripcion || 'Sin descripción'} {r.peligro_clasificacion ? `(${r.peligro_clasificacion})` : ''}
                                    </p>
                                    {(r.medida_eppu || r.controles_individuo) && (
                                      <p className="text-teal-600 dark:text-teal-400 font-medium">
                                        <strong>Control EPP:</strong> {r.medida_eppu || r.controles_individuo}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-surface-secondary/50 rounded-xl border border-dashed border-border-medium text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">No se detectaron EPPs específicos para "{selectedWorker?.cargo || 'este cargo'}"</p>
                          <p className="text-[11px] text-text-secondary mt-0.5 max-w-md mx-auto">
                            Puedes sincronizar los peligros y controles desde la Matriz IPEVAR de Hito 1 o asignar la dotación básica estándar de obra y terreno.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            onClick={handleSyncFromIpevar}
                            disabled={isSyncingIpevar}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Escanear Matriz IPEVAR</span>
                          </button>
                          <button
                            onClick={handleApplyStandardPack}
                            disabled={isSyncingIpevar}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-medium shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            <span>Asignar Dotación Estándar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trazabilidad de Alturas (Pestaña integrada) */}
              {selectedDoc?.entregas.some(ent => ent.tipo === 'Alturas') && (
                <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setIsAlturasExpanded(!isAlturasExpanded)} 
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary"
                  >
                    <div className="flex items-center gap-2">
                      {isAlturasExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <Wrench className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-text-primary">Control Anual de Equipos de Alturas</span>
                    </div>
                  </button>
                  {isAlturasExpanded && (
                    <div className="p-5 border-t border-border-medium bg-surface-primary space-y-3.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDoc.entregas.filter(ent => ent.tipo === 'Alturas').map(ent => {
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          const proxDate = ent.fechaProximaInspeccion ? new Date(ent.fechaProximaInspeccion + 'T12:00:00') : null;
                          const isVencido = proxDate && proxDate < today;

                          return (
                            <div key={ent.id} className="p-4 border border-border-light dark:border-white/5 bg-surface-secondary/20 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-extrabold text-sm text-text-primary">{ent.nombre}</p>
                                  <p className="text-xs text-text-secondary mt-0.5">Serial: <strong>{ent.serial || 'S/N'}</strong></p>
                                </div>
                                <span className={`badge ${isVencido ? 'badge-danger' : 'badge-warning'}`}>
                                  {isVencido ? 'Inspección Vencida' : 'Inspección Vigente'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-border-light dark:border-white/5 text-text-secondary">
                                <div>Marca: <strong>{ent.marca || 'N/A'}</strong></div>
                                <div>Referencia: <strong>{ent.referencia || 'N/A'}</strong></div>
                                <div>Última insp: <strong>{ent.fechaUltimaInspeccion || 'S/N'}</strong></div>
                                <div>Próxima insp: <strong className={isVencido ? 'text-red-400' : 'text-text-primary'}>{ent.fechaProximaInspeccion || 'S/N'}</strong></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tabla de Historial de Entregas */}
              <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <button 
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} 
                  className="w-full flex items-center justify-between p-4 bg-surface-tertiary"
                >
                  <div className="flex items-center gap-2">
                    {isHistoryExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <FileText className="w-5 h-5 text-teal-500" />
                    <span className="font-semibold text-text-primary">Registro Completo de Entregas</span>
                  </div>
                </button>
                {isHistoryExpanded && (
                  <div className="p-5 border-t border-border-medium bg-surface-primary space-y-3.5">
                    {selectedDoc && selectedDoc.entregas.length > 0 ? (
                      <div className="border border-border-light dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-surface-secondary text-text-secondary font-bold text-2xs uppercase tracking-wider">
                              <th className="p-3.5">Elemento / EPP</th>
                              <th className="p-3.5">Tipo</th>
                              <th className="p-3.5">Cant.</th>
                              <th className="p-3.5">Fecha Entrega</th>
                              <th className="p-3.5">Vencimiento</th>
                              <th className="p-3.5 text-center">Firma Recibido</th>
                              <th className="p-3.5 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-light dark:divide-white/5">
                            {selectedDoc.entregas.map(ent => {
                              const today = new Date();
                              today.setHours(0,0,0,0);
                              const vto = ent.fechaVencimiento ? new Date(ent.fechaVencimiento + 'T12:00:00') : null;
                              const isVencido = vto && vto < today;

                              return (
                                <tr key={ent.id} className="hover:bg-surface-secondary/30 transition-colors text-text-primary">
                                  <td className="p-3.5 font-bold">{ent.nombre}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${ent.tipo === 'Alturas' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-text-secondary'}`}>
                                      {ent.tipo}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-bold">{ent.cantidad}</td>
                                  <td className="p-3.5">{ent.fechaEntrega}</td>
                                  <td className="p-3.5">
                                    {ent.fechaVencimiento ? (
                                      <span className={isVencido ? 'text-red-400 font-bold' : ''}>
                                        {ent.fechaVencimiento} {isVencido && '⚠️'}
                                      </span>
                                    ) : 'Vitalicio'}
                                  </td>
                                  <td className="p-3.5 align-middle text-center">
                                    {ent.firmaTrabajador ? (
                                      <div className="inline-flex items-center gap-1 text-teal-500 font-bold">
                                        <CheckCircle className="w-3.5 h-3.5" /> Registrada
                                      </div>
                                    ) : (
                                      <span className="text-red-400 font-bold">Faltante</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={() => handleDeleteEpp(ent.id)}
                                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                      title="Eliminar registro"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-border-medium rounded-2xl text-text-tertiary">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-semibold">No se han registrado entregas para este trabajador</p>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-3.5 text-xs font-bold text-teal-500 hover:underline flex items-center gap-1 mx-auto"
                        >
                          Registrar primera entrega <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-tertiary">
            <Shield className="w-16 h-16 mb-4 text-teal-500 opacity-20" />
            <h3 className="text-lg font-extrabold text-text-primary">Módulo de Entrega y Control de EPP</h3>
            <p className="text-sm text-text-secondary max-w-sm mt-2">Seleccione un trabajador de la lista de la izquierda para comenzar a gestionar el equipamiento de protección personal y controlar las revisiones anuales de alturas.</p>
          </div>
        )}
      </div>
    </div>

      {/* Editor de Informe de EPP (Nivel Raíz — Siempre Visible a Todo Ancho) */}
      <CollapsibleReportBox
        onSave={handleSave}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Informe IA - Entrega de EPP"
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Informe_EPP_${selectedWorker?.nombre ? selectedWorker.nombre.replace(/\s+/g, '_') : 'General'}`}
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport}
            onUpdate={(html) => { editorContentRef.current = html; }}
            reportSourceData={{ worker: selectedWorker, doc: selectedDoc }}
          />
        </div>
      </CollapsibleReportBox>

      {/* ── MODAL: REGISTRAR NUEVA ENTREGA ── */}
      {isModalOpen && selectedWorker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-primary border border-border-light dark:border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border-light dark:border-white/10 flex justify-between items-center bg-surface-secondary/40">
              <h3 className="font-extrabold text-lg text-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-500" /> Registrar Entrega de EPP
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="rounded-xl p-2 text-text-secondary hover:bg-surface-hover transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[500px]">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Trabajador</label>
                  <input type="text" readOnly value={selectedWorker.nombre} className="w-full p-2.5 bg-surface-secondary border border-border-medium rounded-xl text-sm font-semibold text-text-primary outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Identificación</label>
                  <input type="text" readOnly value={selectedWorker.identificacion} className="w-full p-2.5 bg-surface-secondary border border-border-medium rounded-xl text-sm font-semibold text-text-primary outline-none" />
                </div>
              </div>

              {/* Nombre EPP (con datalist de sugerencias) */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-text-secondary">Nombre del EPP / Elemento</label>
                <input
                  list="epp-suggestions"
                  placeholder="Ej. Gafas de seguridad"
                  value={formEppName}
                  onChange={e => setFormEppName(e.target.value)}
                  className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
                <datalist id="epp-suggestions">
                  {suggestionsList.map((item, idx) => (
                    <option key={idx} value={item} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Tipo de EPP</label>
                  <select
                    value={formTipo}
                    onChange={e => setFormTipo(e.target.value as 'Regular' | 'Alturas')}
                    className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-semibold"
                  >
                    <option value="Regular">Regular (Estándar)</option>
                    <option value="Alturas">Protección Alturas (Arnés/Eslinga)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Cantidad Suministrada</label>
                  <input
                    type="number"
                    min={1}
                    value={formCantidad}
                    onChange={e => setFormCantidad(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={formFechaEntrega}
                    onChange={e => handleFechaEntregaChange(e.target.value)}
                    className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-text-secondary">Frecuencia de Cambio (Meses)</label>
                  <select
                    value={formVencimientoInterval}
                    onChange={e => handleIntervalChange(e.target.value)}
                    className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-semibold"
                  >
                    <option value="3">Cada 3 Meses</option>
                    <option value="6">Cada 6 Meses (Estándar)</option>
                    <option value="12">Cada 12 Meses</option>
                    <option value="never">Vitalicio / Sin Vencimiento</option>
                  </select>
                </div>
              </div>

              {/* CAMPOS ADICIONALES PARA EQUIPOS DE ALTURAS */}
              {formTipo === 'Alturas' && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs uppercase font-extrabold text-blue-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Datos de Trazabilidad Alturas (Resolución 4272)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Marca</label>
                      <input
                        type="text"
                        placeholder="Ej. Petzl"
                        value={formMarca}
                        onChange={e => setFormMarca(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Referencia</label>
                      <input
                        type="text"
                        placeholder="Ej. Newton"
                        value={formReferencia}
                        onChange={e => setFormReferencia(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Serial Único</label>
                      <input
                        type="text"
                        placeholder="Ej. S12345-2026"
                        value={formSerial}
                        onChange={e => setFormSerial(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Última Inspección</label>
                      <input
                        type="date"
                        value={formFechaUltimaInspeccion}
                        onChange={e => handleLastInspeccionChange(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Próxima Inspección Anual</label>
                      <input
                        type="date"
                        value={formFechaProximaInspeccion}
                        onChange={e => setFormFechaProximaInspeccion(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none font-bold text-blue-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Inspector Competente</label>
                      <input
                        type="text"
                        placeholder="Nombre del inspector"
                        value={formInspeccionadoPor}
                        onChange={e => setFormInspeccionadoPor(e.target.value)}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-2xs uppercase font-bold text-text-secondary">Resultado de Inspección</label>
                      <select
                        value={formResultadoInspeccion}
                        onChange={e => setFormResultadoInspeccion(e.target.value as 'Aprobado' | 'Rechazado' | 'N/A')}
                        className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-xs text-text-primary outline-none font-semibold"
                      >
                        <option value="Aprobado">Aprobado para Servicio</option>
                        <option value="Rechazado">Rechazado / Retirar</option>
                        <option value="N/A">Sin evaluación</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FIRMA DE CONFORMIDAD DEL TRABAJADOR */}
              <div className="p-4 border border-border-light dark:border-white/5 bg-surface-secondary/20 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs uppercase font-bold text-text-primary flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-teal-500" /> Firma de Recibido y Compromiso
                  </h4>
                  {formSignature ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">
                        Firma Dibujada Activa
                      </span>
                      {selectedWorker.firmaDigital && (
                        <button
                          onClick={() => setFormSignature(null)}
                          className="text-xs font-bold text-teal-500 hover:underline"
                        >
                          Usar Registrada
                        </button>
                      )}
                    </div>
                  ) : selectedWorker.firmaDigital ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-teal-500/10 text-teal-400 font-bold px-2 py-0.5 rounded text-[10px]">
                        Firma Registrada Vinculada
                      </span>
                      <button
                        onClick={() => setIsSignatureOpen(true)}
                        className="text-xs font-bold text-teal-500 hover:underline"
                      >
                        Dibujar Alternativa
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSignatureOpen(true)}
                      className="text-xs font-bold text-teal-500 hover:underline"
                    >
                      {formSignature ? 'Cambiar Firma' : 'Dibujar Firma en Pantalla'}
                    </button>
                  )}
                </div>

                {formSignature ? (
                  <div className="flex items-center gap-4 bg-teal-500/5 p-3 rounded-xl border border-teal-500/20">
                    <img src={formSignature} style={{ maxHeight: '40px' }} className="bg-white rounded p-1" />
                    <p className="text-2xs text-text-secondary leading-relaxed">
                      Firma manuscrita capturada en pantalla para esta entrega.
                    </p>
                    <button 
                      onClick={() => setFormSignature(null)} 
                      className="text-red-400 font-bold text-xs hover:underline ml-auto"
                    >
                      Remover
                    </button>
                  </div>
                ) : selectedWorker.firmaDigital ? (
                  <div className="flex items-center gap-4 bg-teal-500/5 p-3 rounded-xl border border-teal-500/20">
                    <img src={selectedWorker.firmaDigital} style={{ maxHeight: '40px' }} className="bg-white rounded p-1" />
                    <p className="text-2xs text-text-secondary leading-relaxed">
                      Se utilizará automáticamente la firma digital registrada en su ficha sociodemográfica como recibí conforme.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-5 border border-dashed border-border-medium rounded-xl text-center text-text-tertiary">
                    <div className="space-y-1.5">
                      <AlertCircle className="w-5 h-5 mx-auto text-amber-500 opacity-80" />
                      <p className="text-xs font-semibold">El trabajador no tiene firma guardada ni firma manuscrita para esta entrega.</p>
                      <button 
                        onClick={() => setIsSignatureOpen(true)}
                        className="text-xs text-teal-500 font-bold hover:underline block mt-1"
                      >
                        Dibujar firma ahora
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-text-secondary">Observaciones / Detalles</label>
                <textarea
                  placeholder="Ej. Talla M, entregado sin novedad."
                  value={formObservaciones}
                  onChange={e => setFormObservaciones(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

            </div>

            <div className="p-6 border-t border-border-light dark:border-white/10 bg-surface-secondary/40 flex justify-end gap-3">
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                disabled={loading}
                className="px-4 py-2 border border-border-medium hover:bg-surface-hover text-text-primary rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEpp}
                disabled={loading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Signature Pad Portal */}
      <SignaturePad
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={setFormSignature}
        title={`Firma de Conformidad: ${selectedWorker?.nombre}`}
      />

      <ReportHistory 
        onSelectReport={handleSelectReport} 
        isOpen={isHistoryOpen} 
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} 
        refreshTrigger={refreshTrigger} 
        tags={['sgsst-epp']} 
      />

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowUpgradeModal(false)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
            >
              Cerrar [X]
            </button>
            <UpgradeWall 
              isCompact={true}
              title="Actualizar a Somos SST Pro"
              description="Has alcanzado el límite de 1 informe gratuito en el plan básico. Actualiza a Pro para generar informes ilimitados con Inteligencia Artificial."
            />
          </div>
        </div>
      )}
    </div>
  );
}
