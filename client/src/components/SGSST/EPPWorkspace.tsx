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
  AlertTriangle,
  Boxes,
  Package,
  ShieldCheck,
  UserCheck,
  Edit3,
  Filter,
  Info,
  Tag,
  Barcode,
  MapPin,
  Layers,
  Minus,
  Check,
  RotateCw,
  Save,
  Sparkles
} from 'lucide-react';
import { cn } from '~/utils';
import { SignaturePad } from './SignaturePad';
import { exportEppToExcel, type EppInventoryItem } from './exportEpp';
import { saveAs } from 'file-saver';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
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

  // ── Vista Activa (Entregas o Almacén) ──
  const [activeView, setActiveView] = useState<'workers' | 'inventory'>('workers');

  // ── Estado de Inventario y Stock de EPP ──
  const [inventoryItems, setInventoryItems] = useState<EppInventoryItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<EppInventoryItem | null>(null);
  const [invLoading, setInvLoading] = useState(false);

  // Formulario de EPP en Inventario
  const [invFormCodigo, setInvFormCodigo] = useState('');
  const [invFormNombre, setInvFormNombre] = useState('');
  const [invFormCategoria, setInvFormCategoria] = useState('Protección de Cabeza');
  const [invFormTipo, setInvFormTipo] = useState<'Regular' | 'Alturas'>('Regular');
  const [invFormMarca, setInvFormMarca] = useState('');
  const [invFormReferencia, setInvFormReferencia] = useState('');
  const [invFormTalla, setInvFormTalla] = useState('Única');
  const [invFormUnidad, setInvFormUnidad] = useState('Unidad');
  const [invFormStockActual, setInvFormStockActual] = useState(10);
  const [invFormStockMinimo, setInvFormStockMinimo] = useState(5);
  const [invFormCostoUnitario, setInvFormCostoUnitario] = useState(0);
  const [invFormUbicacion, setInvFormUbicacion] = useState('Almacén Principal');
  const [invFormObservaciones, setInvFormObservaciones] = useState('');

  // Modal Ajuste Rápido de Stock
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<EppInventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Ingreso de compra');
  
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

  // ── Categorías y KPIs de Inventario EPP ──
  const EPP_CATEGORIES = [
    'Todas',
    'Protección de Cabeza',
    'Protección Ocular / Facial',
    'Protección Auditiva',
    'Protección Respiratoria',
    'Protección Manual',
    'Protección de Pies',
    'Ropa de Trabajo',
    'Protección contra Caídas (Alturas)',
    'Otro'
  ];

  const totalStockUnits = useMemo(() => {
    return inventoryItems.reduce((acc, item) => acc + (Number(item.stockActual) || 0), 0);
  }, [inventoryItems]);

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const stock = Number(item.stockActual) || 0;
      const min = Number(item.stockMinimo) || 5;
      return stock <= min && stock > 0;
    });
  }, [inventoryItems]);

  const outOfStockItems = useMemo(() => {
    return inventoryItems.filter(item => (Number(item.stockActual) || 0) === 0);
  }, [inventoryItems]);

  const totalDeliveries = useMemo(() => {
    return eppDocs.reduce((acc, doc) => acc + (doc.entregas?.length || 0), 0);
  }, [eppDocs]);

  const expiredDeliveries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    eppDocs.forEach(doc => {
      (doc.entregas || []).forEach(e => {
        if (e.fechaVencimiento) {
          const v = new Date(e.fechaVencimiento + 'T12:00:00');
          if (v < today) count++;
        }
      });
    });
    return count;
  }, [eppDocs]);

  const workersWithExpiredDeliveries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return workers.filter(w => {
      const doc = eppDocs.find(d => d.workerId === w.id);
      if (!doc || !doc.entregas || doc.entregas.length === 0) return false;
      return doc.entregas.some(e => {
        if (!e.fechaVencimiento) return false;
        const v = new Date(e.fechaVencimiento + 'T12:00:00');
        return v < today;
      });
    });
  }, [workers, eppDocs]);

  const getInventoryItemByName = useCallback((name?: string) => {
    if (!name) return null;
    const n = name.toLowerCase().trim();
    let found = inventoryItems.find(i => (i.nombre || '').toLowerCase().trim() === n);
    if (!found) {
      found = inventoryItems.find(i => {
        const iName = (i.nombre || '').toLowerCase().trim();
        return iName.includes(n) || n.includes(iName);
      });
    }
    return found || null;
  }, [inventoryItems]);

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const q = inventorySearch.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.nombre || '').toLowerCase().includes(q) ||
        (item.codigo || '').toLowerCase().includes(q) ||
        (item.marca || '').toLowerCase().includes(q) ||
        (item.referencia || '').toLowerCase().includes(q) ||
        (item.ubicacionBodega || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'Todas' || item.categoria === selectedCategory;

      const stock = Number(item.stockActual) || 0;
      const min = Number(item.stockMinimo) || 5;

      let matchesStock = true;
      if (selectedStockFilter === 'low') matchesStock = stock <= min && stock > 0;
      else if (selectedStockFilter === 'out') matchesStock = stock === 0;
      else if (selectedStockFilter === 'ok') matchesStock = stock > min;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [inventoryItems, inventorySearch, selectedCategory, selectedStockFilter]);

  const resetInventoryForm = () => {
    setInvFormCodigo('');
    setInvFormNombre('');
    setInvFormCategoria('Protección de Cabeza');
    setInvFormTipo('Regular');
    setInvFormMarca('');
    setInvFormReferencia('');
    setInvFormTalla('Única');
    setInvFormUnidad('Unidad');
    setInvFormStockActual(10);
    setInvFormStockMinimo(5);
    setInvFormCostoUnitario(0);
    setInvFormUbicacion('Almacén Principal');
    setInvFormObservaciones('');
    setEditingInventoryItem(null);
  };

  const handleOpenEditInventory = (item: EppInventoryItem) => {
    setEditingInventoryItem(item);
    setInvFormCodigo(item.codigo || '');
    setInvFormNombre(item.nombre || '');
    setInvFormCategoria(item.categoria || 'Otro');
    setInvFormTipo(item.tipo || 'Regular');
    setInvFormMarca(item.marca || '');
    setInvFormReferencia(item.referencia || '');
    setInvFormTalla(item.talla || 'Única');
    setInvFormUnidad(item.unidad || 'Unidad');
    setInvFormStockActual(Number(item.stockActual) || 0);
    setInvFormStockMinimo(Number(item.stockMinimo) || 5);
    setInvFormCostoUnitario(Number(item.costoUnitario) || 0);
    setInvFormUbicacion(item.ubicacionBodega || 'Almacén Principal');
    setInvFormObservaciones(item.observaciones || '');
    setIsInventoryModalOpen(true);
  };

  const handleSaveInventoryItem = async () => {
    if (!invFormNombre.trim()) {
      showToast({ message: 'El nombre del EPP es obligatorio', status: 'warning' });
      return;
    }
    setInvLoading(true);
    try {
      const res = await fetch('/api/sgsst/epp/inventory/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingInventoryItem?.id,
          codigo: invFormCodigo,
          nombre: invFormNombre,
          categoria: invFormCategoria,
          tipo: invFormTipo,
          marca: invFormMarca,
          referencia: invFormReferencia,
          talla: invFormTalla,
          unidad: invFormUnidad,
          stockActual: invFormStockActual,
          stockMinimo: invFormStockMinimo,
          costoUnitario: invFormCostoUnitario,
          ubicacionBodega: invFormUbicacion,
          observaciones: invFormObservaciones
        })
      });

      if (!res.ok) throw new Error('Error al guardar en bodega');
      const data = await res.json();
      setInventoryItems(data.items || []);
      setIsInventoryModalOpen(false);
      resetInventoryForm();
      showToast({ message: 'EPP guardado en bodega correctamente', status: 'success' });
    } catch (err: any) {
      console.error(err);
      showToast({ message: err.message || 'Error al guardar EPP en inventario', status: 'error' });
    } finally {
      setInvLoading(false);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar "${nombre}" del inventario de bodega?`)) return;
    try {
      const res = await fetch('/api/sgsst/epp/inventory/delete-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });
      if (!res.ok) throw new Error('Error al eliminar');
      const data = await res.json();
      setInventoryItems(data.items || []);
      showToast({ message: 'Elemento eliminado del inventario', status: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Error al eliminar', status: 'error' });
    }
  };

  const handleQuickStockAdjust = async (itemId: string, delta: number, reason = 'Ajuste rápido') => {
    try {
      const res = await fetch('/api/sgsst/epp/inventory/adjust-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, delta, reason })
      });
      if (!res.ok) throw new Error('Error al ajustar stock');
      const data = await res.json();
      setInventoryItems(data.items || []);
      showToast({ message: `Stock actualizado (${delta > 0 ? '+' : ''}${delta})`, status: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Error al ajustar stock', status: 'error' });
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('¿Desea cargar el catálogo estándar sugerido de EPPs para Colombia con stock inicial?')) return;
    setInvLoading(true);
    try {
      const res = await fetch('/api/sgsst/epp/inventory/seed-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar catálogo');
      const data = await res.json();
      setInventoryItems(data.items || []);
      showToast({ message: `Se agregaron ${data.addedCount || 0} referencias al catálogo de EPP`, status: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Error al cargar catálogo', status: 'error' });
    } finally {
      setInvLoading(false);
    }
  };

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

      // 5. Fetch EPP Warehouse Inventory
      try {
        const invRes = await fetch('/api/sgsst/epp/inventory', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (invRes.ok) {
          const invData = await invRes.json();
          setInventoryItems(Array.isArray(invData?.items) ? invData.items : []);
        }
      } catch (invErr) {
        console.warn('[EPP Workspace] Error loading inventory:', invErr);
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
      const resData = await res.json();
      if (resData.updatedInventory) {
        setInventoryItems(resData.updatedInventory);
      }

      showToast({ message: 'EPP registrado y descontado del stock de bodega exitosamente', status: 'success' });
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
    if (!confirm('¿Está seguro de eliminar este registro de entrega? Se repondrá la cantidad al stock de bodega si existe.')) return;

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
      const resData = await res.json();
      if (resData.updatedInventory) {
        setInventoryItems(resData.updatedInventory);
      }

      showToast({ message: 'Registro eliminado y cantidad repuesta en bodega', status: 'success' });
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
      const resData = await res.json();
      if (resData.updatedInventory) {
        setInventoryItems(resData.updatedInventory);
      }

      showToast({ message: `¡Se registraron ${newItems.length} entregas de EPP con firma y se descontaron de bodega para ${selectedWorker.nombre}!`, status: 'success' });
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
      await exportEppToExcel(eppDocs, workers, inventoryItems);
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
      
      {/* ─── TOOLBAR SUPERIOR ESTÁNDAR SGSST CON BOTONES EXPANDIBLES ──────── */}
      <SGSSTToolbar
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        historyButtons={[
          {
            id: 'tb-tab-trabajadores',
            onClick: () => setActiveView('workers'),
            label: `Entregas (${workers.length})`,
            icon: UserCheck,
            title: 'Ver Entregas y Dotación de EPP por Colaborador',
            variant: 'history',
            active: activeView === 'workers',
            badge: workers.length > 0 ? workers.length : undefined,
          },
          {
            id: 'tb-tab-almacen',
            onClick: () => setActiveView('inventory'),
            label: `Almacén y Stock (${inventoryItems.length})`,
            icon: Boxes,
            title: 'Ver Almacén Central y Control de Stock de EPP',
            variant: 'history',
            active: activeView === 'inventory',
            badge: (lowStockItems.length + outOfStockItems.length) > 0 ? `${lowStockItems.length + outOfStockItems.length}` : (inventoryItems.length > 0 ? inventoryItems.length : undefined),
          },
        ]}
        customSections={[
          <div key="epp-custom-toolbar" className="flex items-center gap-1.5">
            {activeView === 'workers' ? (
              <>
                {selectedWorker && (
                  <>
                    <ToolbarButton
                      id="tb-new-delivery"
                      onClick={() => setIsModalOpen(true)}
                      label="Nueva Entrega"
                      icon={Plus}
                      title={`Registrar Entrega de EPP para ${selectedWorker.nombre}`}
                      variant="ai"
                    />
                    {recommendedEpps.length > 0 && (
                      <ToolbarButton
                        id="tb-deliver-recommended"
                        onClick={handleDeliverAllRecommended}
                        label="Entregar Recomendados"
                        icon={PackageCheck}
                        title="Entregar todos los EPP sugeridos pendientes"
                        variant="dummy"
                      />
                    )}
                  </>
                )}
                <ToolbarButton
                  id="tb-export-excel-workers"
                  onClick={handleExportExcel}
                  label="Exportar Excel"
                  icon={FileSpreadsheet}
                  title="Descargar matriz de entregas e inventario en Excel"
                  variant="excel"
                />
              </>
            ) : (
              <>
                <ToolbarButton
                  id="tb-new-epp"
                  onClick={() => {
                    resetInventoryForm();
                    setIsInventoryModalOpen(true);
                  }}
                  label="Nuevo EPP"
                  icon={Plus}
                  title="Registrar nuevo elemento en bodega"
                  variant="ai"
                />
                <ToolbarButton
                  id="tb-seed-catalog"
                  onClick={handleSeedDefaults}
                  label="Catálogo Sugerido"
                  icon={Sparkles}
                  title="Cargar 15 referencias sugeridas de EPP para Colombia"
                  variant="dummy"
                  isLoading={invLoading}
                />
                <ToolbarButton
                  id="tb-export-excel-inv"
                  onClick={handleExportExcel}
                  label="Exportar Inventario"
                  icon={FileSpreadsheet}
                  title="Descargar inventario de bodega en Excel"
                  variant="excel"
                />
              </>
            )}
          </div>
        ]}
        onAnalyze={handleGenerate}
        isAnalyzing={isGenerating}
        exportContent={selectedWorker && selectedDoc && selectedDoc.entregas && selectedDoc.entregas.length > 0 ? buildReceiptHtml(
          selectedWorker,
          selectedDoc,
          selectedDoc.entregas.filter(e => e.firmaTrabajador).slice(-1)[0]?.firmaTrabajador || selectedWorker.firmaDigital,
          localStorage.getItem('wappy_sst_global_logo') || 'https://wappy.club/assets/logo.png',
          new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        ) : ''}
        exportFileName={selectedWorker ? `Acta_Entrega_EPP_${selectedWorker.nombre.replace(/\s+/g, '_')}` : 'Registro_EPP'}
        onExportExcel={handleExportExcel}
      />

      {/* ─── ENCABEZADO DE SECCIÓN ACTIVA (WAPPY DESIGN SYSTEM) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light dark:border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            {activeView === 'workers' ? (
              <>
                <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Control y Seguimiento de Entregas a Trabajadores</span>
              </>
            ) : (
              <>
                <Boxes className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Almacén Central y Control de Stock de EPP</span>
              </>
            )}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {activeView === 'workers'
              ? 'Gestión de dotaciones individuales, firmas de conformidad y control de caducidad.'
              : 'Control de existencias físicas, umbrales mínimos de abastecimiento y trazabilidad de almacén.'}
          </p>
        </div>
      </div>

      {/* 4 Métricas Clave / KPIs (Almacén y Operación) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: En Bodega */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-primary border border-border-medium shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">En Bodega</p>
            <p className="text-sm font-black text-text-primary">{totalStockUnits} <span className="text-[10px] font-semibold text-text-secondary">uds</span></p>
          </div>
        </div>

        {/* KPI 2: Stock Crítico / Bajo */}
        <div className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-2xs transition-colors",
          (lowStockItems.length > 0 || outOfStockItems.length > 0)
            ? "bg-amber-500/5 border-amber-500/30"
            : "bg-surface-primary border-border-medium"
        )}>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            (lowStockItems.length > 0 || outOfStockItems.length > 0)
              ? "bg-amber-500/15 text-amber-500"
              : "bg-emerald-500/10 text-emerald-500"
          )}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Stock Crítico</p>
            <p className={cn(
              "text-sm font-black",
              (lowStockItems.length > 0 || outOfStockItems.length > 0) ? "text-amber-500" : "text-emerald-500"
            )}>
              {lowStockItems.length + outOfStockItems.length} <span className="text-[10px] font-semibold text-text-secondary">refs</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Total Entregas */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-primary border border-border-medium shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Dotaciones</p>
            <p className="text-sm font-black text-text-primary">{totalDeliveries} <span className="text-[10px] font-semibold text-text-secondary">entregas</span></p>
          </div>
        </div>

        {/* KPI 4: Vencidos / Alertas */}
        <div className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-2xs transition-colors",
          expiredDeliveries > 0 ? "bg-red-500/5 border-red-500/30" : "bg-surface-primary border-border-medium"
        )}>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            expiredDeliveries > 0 ? "bg-red-500/15 text-red-500" : "bg-slate-500/10 text-text-tertiary"
          )}>
            <AlertCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Vencidos</p>
            <p className={cn("text-sm font-black", expiredDeliveries > 0 ? "text-red-500" : "text-text-secondary")}>
              {expiredDeliveries} <span className="text-[10px] font-semibold text-text-secondary">alertas</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL: CONDICIONADO POR activeView ── */}
      {activeView === 'workers' ? (
      <div className="flex flex-col md:flex-row h-[780px] w-full border border-border-light dark:border-white/10 rounded-3xl bg-surface-primary shadow-lg overflow-hidden animate-in fade-in duration-200">
      
      {/* ── SECTOR IZQUIERDO: LISTA DE TRABAJADORES ── */}
      <div className={cn("w-full md:w-80 lg:w-96 border-r border-border-light dark:border-white/10 flex flex-col bg-surface-secondary/40 shrink-0 h-full", selectedWorker && "hidden md:flex")}>
        <div className="p-4 md:p-5 border-b border-border-light dark:border-white/10 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-500" /> Trabajadores
            </h2>
            <div className="flex items-center gap-1.5">
              <ToolbarButton
                id="workers-excel-btn"
                onClick={handleExportExcel}
                label="Excel"
                icon={FileSpreadsheet}
                title="Descargar base de datos general de entregas de EPP en Excel"
                variant="excel"
              />
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
            const workerDoc = eppDocs.find(doc => doc.workerId === w.id);
            const entregas = workerDoc?.entregas || [];
            const hasDoc = entregas.length > 0;
            const isSelected = selectedWorker?.id === w.id;

            // Check if any expired
            const today = new Date();
            today.setHours(0,0,0,0);
            const hasExpired = entregas.some(e => {
              if (e.fechaVencimiento) {
                const v = new Date(e.fechaVencimiento + 'T12:00:00');
                return v < today;
              }
              return false;
            });

            // Initials
            const initials = (w.nombre || '')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(p => p[0]?.toUpperCase())
              .join('') || 'T';

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
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all hover:scale-[1.01] cursor-pointer",
                  isSelected 
                    ? "bg-teal-500/10 border-teal-500 shadow-sm shadow-teal-500/10" 
                    : "bg-surface-primary border-border-light dark:border-white/5 text-text-primary hover:bg-surface-secondary/70 hover:border-teal-500/30"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={cn(
                    "w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-teal-400 shadow-xs"
                      : "bg-gradient-to-br from-surface-secondary to-surface-tertiary text-text-secondary border-border-medium"
                  )}>
                    {initials}
                  </div>
                  <div className="truncate">
                    <p className={cn("font-bold text-sm truncate", isSelected ? "text-teal-600 dark:text-teal-400 font-extrabold" : "text-text-primary")}>
                      {w.nombre}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{w.cargo || 'Sin cargo'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {hasExpired ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Vencido
                    </span>
                  ) : hasDoc ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {entregas.length}
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-surface-secondary">
                      0 EPP
                    </span>
                  )}
                </div>
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

              <div className="flex items-center gap-2">
                <ToolbarButton
                  id="sw-new-delivery"
                  onClick={() => setIsModalOpen(true)}
                  label="Registrar Entrega"
                  icon={Plus}
                  title={`Registrar nueva entrega de EPP para ${selectedWorker.nombre}`}
                  variant="ai"
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

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <ToolbarButton
                      id="rec-sync-ipevar"
                      onClick={handleSyncFromIpevar}
                      label={isSyncingIpevar ? 'Sincronizando...' : 'Sincronizar IPEVAR'}
                      icon={RefreshCw}
                      title="Sincronizar EPPs del cargo con la Matriz de Peligros IPEVAR (Hito 1)"
                      variant="default"
                      isLoading={isSyncingIpevar}
                    />
                    {recommendedEpps.length > 0 && (
                      <ToolbarButton
                        id="rec-deliver-all"
                        onClick={handleDeliverAllRecommended}
                        label="Entregar Recomendados"
                        icon={PackageCheck}
                        title="Registrar entrega de todos los EPPs requeridos no entregados aún"
                        variant="ai"
                        disabled={loading}
                      />
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

                                {/* Warehouse stock badge */}
                                {(() => {
                                  const invItem = getInventoryItemByName(epp);
                                  if (!invItem) return null;
                                  if (invItem.stockActual === 0) {
                                    return (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 font-extrabold border border-red-500/20">
                                        Agotado (0)
                                      </span>
                                    );
                                  }
                                  if (invItem.stockActual <= invItem.stockMinimo) {
                                    return (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/20">
                                        {invItem.stockActual} disp.
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold border border-teal-500/20">
                                      {invItem.stockActual} en bodega
                                    </span>
                                  );
                                })()}

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
                        <div className="flex items-center justify-center gap-2.5 pt-1">
                          <button
                            onClick={handleSyncFromIpevar}
                            disabled={isSyncingIpevar}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Escanear Matriz IPEVAR</span>
                          </button>
                          <button
                            onClick={handleApplyStandardPack}
                            disabled={isSyncingIpevar}
                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"
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
                                      className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-all duration-300 px-1.5 shadow-sm active:scale-95 ml-auto"
                                      title="Eliminar registro"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                      <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                        <span className="text-[10px] font-bold">Eliminar</span>
                                      </div>
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
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Banner de Bienvenida y Control Legal de Dotaciones y EPP */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900/15 via-slate-900/10 to-teal-900/15 border border-teal-500/30 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300 text-2xs font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Resolución 2400 de 1979 / Art. 230 C.S.T.
                  </div>
                  <h3 className="text-xl font-black text-text-primary">
                    Centro de Control de Dotaciones y Almacén de EPP
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Gestión integral de entrega de elementos de protección personal, control de reposición periódica (3 entregas legales al año), inspección anual de equipos para alturas y trazabilidad de existencias en almacén.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (workers.length > 0) {
                        setSelectedWorker(workers[0]);
                        setIsModalOpen(true);
                      } else {
                        showToast({ message: 'Primero registre trabajadores en la ficha sociodemográfica.', status: 'info' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrar Entrega
                  </button>
                  <button
                    onClick={() => setActiveView('inventory')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Boxes className="w-4 h-4 text-teal-500" /> Ir a Bodega / Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos de Gestión */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => {
                  if (workers.length > 0) {
                    setSelectedWorker(workers[0]);
                    setIsModalOpen(true);
                  } else {
                    showToast({ message: 'Primero registre trabajadores en la ficha sociodemográfica.', status: 'info' });
                  }
                }}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Registrar Entrega de EPP</h4>
                <p className="text-2xs text-text-secondary mt-1">Asignar dotación requerida según cargo y peligros IPEVAR con firma de conformidad.</p>
              </div>

              <div
                onClick={() => setActiveView('inventory')}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Control de Bodega y Stock</h4>
                <p className="text-2xs text-text-secondary mt-1">Supervisar existencias físicas, umbrales mínimos, tallas y entradas/salidas de almacén.</p>
              </div>

              <div
                onClick={handleGenerate}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Auditoría IA de Dotación</h4>
                <p className="text-2xs text-text-secondary mt-1">Evaluar idoneidad técnica de los EPP suministrados según la matriz IPEVAR y normatividad.</p>
              </div>
            </div>

            {/* Alertas Críticas de Stock en Bodega */}
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">
                      Alertas Críticas de Stock en Bodega ({lowStockItems.length + outOfStockItems.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveView('inventory')}
                    className="text-2xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    Ver Bodega Completa <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...outOfStockItems, ...lowStockItems].slice(0, 6).map(item => {
                    const isOut = Number(item.stockActual || 0) === 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveView('inventory');
                          handleOpenEditInventory(item);
                        }}
                        className="p-3 bg-surface-primary rounded-xl border border-amber-500/20 hover:border-amber-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-text-primary truncate">{item.nombre}</span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                            isOut ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                          )}>
                            {isOut ? 'Agotado' : 'Stock Bajo'}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-2xs text-text-secondary">
                          <p>Disponible: <strong className={isOut ? "text-red-500 font-bold" : "text-amber-500 font-bold"}>{item.stockActual} {item.unidad || 'uds'}</strong> • Mínimo: {item.stockMinimo || 5}</p>
                          <p>Ubicación: <strong className="text-text-primary">{item.ubicacionBodega || 'Almacén Principal'}</strong> {item.talla ? `• Talla: ${item.talla}` : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colaboradores con Dotación Vencida o Pendiente */}
            {workersWithExpiredDeliveries.length > 0 && (
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">
                      Colaboradores con Dotación Vencida o Por Reponer ({workersWithExpiredDeliveries.length})
                    </h4>
                  </div>
                  <span className="text-2xs font-semibold text-text-secondary">Art. 230 C.S.T. / Res. 2400</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {workersWithExpiredDeliveries.map(w => {
                    const doc = eppDocs.find(d => d.workerId === w.id);
                    const expiredCount = (doc?.entregas || []).filter(e => {
                      if (!e.fechaVencimiento) return false;
                      return new Date(e.fechaVencimiento + 'T12:00:00') < new Date();
                    }).length;
                    return (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWorker(w)}
                        className="p-3 bg-surface-primary rounded-xl border border-red-500/20 hover:border-red-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-text-primary truncate">{w.nombre}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white shrink-0">
                            {expiredCount} Vencido{expiredCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-2xs text-text-secondary">
                          <p>Cargo: <strong className="text-text-primary">{w.cargo || 'Sin cargo'}</strong></p>
                          <p>C.C. {w.identificacion}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumen del Personal y Estado de Entrega */}
            <div className="p-5 rounded-2xl bg-surface-primary border border-border-medium space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-text-primary">
                    Últimos Colaboradores en Registro ({workers.slice(0, 5).length} de {workers.length})
                  </h4>
                </div>
                <span className="text-2xs text-text-secondary">Haga clic en un colaborador para gestionar su dotación</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-light dark:border-white/5 text-2xs font-extrabold text-text-secondary uppercase">
                      <th className="pb-2">Colaborador</th>
                      <th className="pb-2">Documento</th>
                      <th className="pb-2">Cargo</th>
                      <th className="pb-2 text-center">Entregas</th>
                      <th className="pb-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-white/5">
                    {workers.slice(0, 5).map(w => {
                      const doc = eppDocs.find(d => d.workerId === w.id);
                      const cantEntregas = doc?.entregas?.length || 0;
                      return (
                        <tr key={w.id} className="hover:bg-surface-secondary/40 transition-colors">
                          <td className="py-2.5 font-bold text-text-primary">{w.nombre}</td>
                          <td className="py-2.5 text-text-secondary font-mono text-[11px]">{w.identificacion}</td>
                          <td className="py-2.5 text-text-secondary">{w.cargo || 'Sin cargo'}</td>
                          <td className="py-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              cantEntregas > 0 ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "bg-slate-500/10 text-text-tertiary"
                            )}>
                              {cantEntregas} entregas
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => setSelectedWorker(w)}
                              className="px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 font-bold text-2xs transition-colors"
                            >
                              Ver Detalle →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Marco Legal Colombiano: Dotación de Calzado y Vestido de Labor */}
            <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border-medium flex items-start gap-3 text-xs text-text-secondary">
              <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-extrabold text-text-primary text-xs">
                  Marco Legal Colombiano para Dotación y Elementos de Protección Personal (EPP):
                </p>
                <p className="text-2xs">
                  • <strong>Art. 230 y 232 C.S.T.:</strong> Todo empleador debe suministrar cada cuatro (4) meses calzado y vestido de labor a los trabajadores que devenguen hasta 2 SMMLV (Fechas límite: 30 de abril, 31 de agosto y 20 de diciembre).
                </p>
                <p className="text-2xs">
                  • <strong>Resolución 2400 de 1979 y Dec. 1072/2015:</strong> Los elementos de protección personal deben ser gratuitos, certificados, adecuados al riesgo evaluado en la matriz IPEVAR y reponerse inmediatamente cuando sufran deterioro o caducidad.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    ) : (
      /* ── SECTOR DE ALMACÉN Y STOCK DE EPP (VISTA COMPLETA) ── */
      <div className="w-full flex-1 min-h-[750px] flex flex-col bg-surface-primary rounded-3xl border border-border-light dark:border-white/10 shadow-lg overflow-hidden animate-in fade-in duration-200">
        
        {/* Sub-Header del Almacén */}
        <div className="p-5 border-b border-border-light dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-secondary/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-text-primary">Control de Bodega y Stock de EPP</h2>
                <p className="text-xs text-text-secondary">Control de existencias, tallas, alertas de abastecimiento y trazabilidad de almacén.</p>
              </div>
            </div>
          </div>

          {/* Botones de Acción Superiores */}
          <div className="flex items-center gap-1.5">
            <ToolbarButton
              id="bodega-new-epp"
              onClick={() => {
                resetInventoryForm();
                setIsInventoryModalOpen(true);
              }}
              label="Nuevo EPP en Bodega"
              icon={Plus}
              title="Registrar nuevo elemento en bodega"
              variant="ai"
            />
            <ToolbarButton
              id="bodega-seed"
              onClick={handleSeedDefaults}
              label="Catálogo Sugerido"
              icon={Sparkles}
              title="Cargar 15 referencias estándar de EPP con stock sugerido"
              variant="dummy"
              isLoading={invLoading}
            />
            <ToolbarButton
              id="bodega-excel"
              onClick={handleExportExcel}
              label="Exportar Excel"
              icon={FileSpreadsheet}
              title="Exportar inventario y entregas a Excel"
              variant="excel"
            />
          </div>
        </div>

        {/* Filtros de Búsqueda y Categorías */}
        <div className="p-4 border-b border-border-light dark:border-white/10 bg-surface-secondary/20 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por nombre, código, marca..."
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-primary border border-border-medium rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            {/* Filtro de Estado de Stock */}
            <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedStockFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer",
                  selectedStockFilter === 'all'
                    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                    : "bg-surface-primary text-text-secondary border border-border-medium hover:bg-surface-secondary"
                )}
              >
                Todos ({inventoryItems.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStockFilter('low')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  selectedStockFilter === 'low'
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : "bg-surface-primary text-text-secondary border border-border-medium hover:bg-surface-secondary"
                )}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Stock Bajo ({lowStockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStockFilter('out')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  selectedStockFilter === 'out'
                    ? "bg-red-500/10 text-red-500 border border-red-500/30"
                    : "bg-surface-primary text-text-secondary border border-border-medium hover:bg-surface-secondary"
                )}
              >
                <AlertCircle className="w-3 h-3 text-red-500" />
                Agotados ({outOfStockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStockFilter('ok')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  selectedStockFilter === 'ok'
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                    : "bg-surface-primary text-text-secondary border border-border-medium hover:bg-surface-secondary"
                )}
              >
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Óptimo ({inventoryItems.length - lowStockItems.length - outOfStockItems.length})
              </button>
            </div>
          </div>

          {/* Pills de Categoría con Scroll Horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 text-2xs">
            <span className="text-text-tertiary font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Categoría:
            </span>
            {EPP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-teal-600 text-white shadow-2xs font-bold"
                    : "bg-surface-primary text-text-secondary border border-border-medium hover:bg-surface-secondary hover:text-text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Inventario de Bodega */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {filteredInventory.length > 0 ? (
            <div className="border border-border-light dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-secondary text-text-secondary font-bold text-2xs uppercase tracking-wider">
                    <th className="p-3.5">Referencia / EPP</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Marca / Ref</th>
                    <th className="p-3.5">Talla / Unidad</th>
                    <th className="p-3.5">Stock en Bodega</th>
                    <th className="p-3.5">Stock Mínimo</th>
                    <th className="p-3.5">Ubicación</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-white/5">
                  {filteredInventory.map((item) => {
                    const stock = Number(item.stockActual) || 0;
                    const min = Number(item.stockMinimo) || 5;
                    const isOut = stock === 0;
                    const isLow = stock <= min && !isOut;

                    return (
                      <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors text-text-primary">
                        {/* Nombre y Código */}
                        <td className="p-3.5 font-bold">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm">{item.nombre}</span>
                              {item.tipo === 'Alturas' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  Alturas
                                </span>
                              )}
                            </div>
                            {item.codigo && (
                              <p className="text-[10px] text-text-tertiary font-mono">
                                SKU: {item.codigo}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                            {item.categoria || 'Otro'}
                          </span>
                        </td>

                        {/* Marca y Ref */}
                        <td className="p-3.5 text-text-secondary">
                          <div>{item.marca || 'N/A'}</div>
                          <div className="text-[10px] text-text-tertiary">{item.referencia || ''}</div>
                        </td>

                        {/* Talla y Unidad */}
                        <td className="p-3.5 font-semibold text-text-secondary">
                          <span>{item.talla || 'Única'}</span>
                          <span className="text-[10px] text-text-tertiary block">({item.unidad || 'Unidad'})</span>
                        </td>

                        {/* Stock Actual con Status Badge y Barra */}
                        <td className="p-3.5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{stock}</span>
                              <span className={cn(
                                "text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1",
                                isOut ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              )}>
                                {isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Óptimo'}
                              </span>
                            </div>
                            {/* Mini barra de progreso */}
                            <div className="w-24 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isOut ? "w-0" :
                                  isLow ? "bg-amber-500" :
                                  "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(8, (stock / (min * 2)) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Stock Mínimo */}
                        <td className="p-3.5 font-bold text-text-secondary">
                          {min} {item.unidad || 'uds'}
                        </td>

                        {/* Ubicación */}
                        <td className="p-3.5 text-text-secondary">
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-text-tertiary shrink-0" />
                            <span>{item.ubicacionBodega || 'Almacén'}</span>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón rápido entrada de stock */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingItem(item);
                                setAdjustDelta(5);
                                setAdjustReason('Ingreso de compra');
                                setIsAdjustStockModalOpen(true);
                              }}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                              title="Añadir existencias / Entrada de stock"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                <span className="text-[10px] font-bold">+ Entrada</span>
                              </div>
                            </button>

                            {/* Botón Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditInventory(item)}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                              title="Editar detalles del EPP"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[70px] group-hover:opacity-100 sm:flex">
                                <span className="text-[10px] font-bold">Editar</span>
                              </div>
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleDeleteInventoryItem(item.id, item.nombre)}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                              title="Eliminar de inventario"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[70px] group-hover:opacity-100 sm:flex">
                                <span className="text-[10px] font-bold">Eliminar</span>
                              </div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border-medium rounded-3xl text-text-tertiary space-y-4">
              <Boxes className="w-16 h-16 mx-auto opacity-25 text-teal-500" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">No se encontraron elementos de EPP en bodega</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  {inventorySearch || selectedCategory !== 'Todas' || selectedStockFilter !== 'all'
                    ? 'No hay referencias que coincidan con los filtros seleccionados.'
                    : 'Empieza agregando un elemento o carga el catálogo estándar colombiano de 15 EPPs sugeridos con stock preconfigurado.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={invLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Cargar Catálogo Estándar (15 EPPs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetInventoryForm();
                    setIsInventoryModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer EPP Manual</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    )}

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

              {/* Nombre EPP (con datalist de sugerencias y stock de bodega) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-bold text-text-secondary">Nombre del EPP / Elemento</label>
                  {inventoryItems.length > 0 && (
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold flex items-center gap-1">
                      <Boxes className="w-3 h-3" />
                      {inventoryItems.length} referencias en bodega
                    </span>
                  )}
                </div>
                <input
                  list="epp-suggestions"
                  placeholder="Ej. Gafas de seguridad o Casco dieléctrico"
                  value={formEppName}
                  onChange={e => {
                    const val = e.target.value;
                    setFormEppName(val);
                    const matched = getInventoryItemByName(val);
                    if (matched) {
                      setFormTipo(matched.tipo || 'Regular');
                      if (matched.marca) setFormMarca(matched.marca);
                      if (matched.referencia) setFormReferencia(matched.referencia);
                    }
                  }}
                  className="w-full p-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-semibold"
                />
                <datalist id="epp-suggestions">
                  {/* Items en inventario de bodega */}
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.nombre}>
                      {`📦 Stock: ${item.stockActual} ${item.unidad || 'uds'} | ${item.categoria || ''}`}
                    </option>
                  ))}
                  {/* Sugerencias estándar */}
                  {suggestionsList.map((item, idx) => (
                    <option key={`sug-${idx}`} value={item} />
                  ))}
                </datalist>

                {/* Status de stock en tiempo real */}
                {(() => {
                  const matched = getInventoryItemByName(formEppName);
                  if (matched) {
                    const isOut = matched.stockActual === 0;
                    const isLow = matched.stockActual <= matched.stockMinimo;
                    const isShort = matched.stockActual < formCantidad;
                    return (
                      <div className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                        isOut 
                          ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                          : isLow
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                            : "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300"
                      )}>
                        <div className="flex items-center gap-2">
                          <Boxes className="w-4 h-4 shrink-0" />
                          <span>
                            <strong>En Bodega ({matched.ubicacionBodega || 'Almacén'}):</strong>{' '}
                            {matched.stockActual} {matched.unidad || 'uds'} disponibles (Mínimo: {matched.stockMinimo})
                          </span>
                        </div>
                        {isShort ? (
                          <span className="font-extrabold text-[11px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                            ⚠️ Insuficiente
                          </span>
                        ) : (
                          <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            ✅ Disponible
                          </span>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p className="text-[11px] text-text-tertiary flex items-center gap-1 pt-0.5">
                      <Info className="w-3 h-3 text-text-tertiary" />
                      Elemento libre no vinculado a inventario de bodega.
                    </p>
                  );
                })()}
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEpp}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Inventario / Nuevo o Edición de EPP */}
      {isInventoryModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-primary dark:bg-surface-secondary border border-border-light dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-border-light dark:border-white/10 flex items-center justify-between bg-surface-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {editingInventoryItem ? 'Editar EPP en Almacén' : 'Registrar Nuevo EPP en Bodega'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Gestión de existencias, umbral de alerta y ficha técnica
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsInventoryModalOpen(false); resetInventoryForm(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={invFormCodigo}
                    onChange={(e) => setInvFormCodigo(e.target.value)}
                    placeholder="Ej. EPP-CAS-01"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Nombre del EPP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invFormNombre}
                    onChange={(e) => setInvFormNombre(e.target.value)}
                    placeholder="Ej. Casco de Seguridad Tipo II Dieléctrico"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Categoría</label>
                  <select
                    value={invFormCategoria}
                    onChange={(e) => setInvFormCategoria(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  >
                    {EPP_CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Tipo de Riesgo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInvFormTipo('Regular')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        invFormTipo === 'Regular'
                          ? 'bg-teal-500 text-white border-teal-600 shadow-sm'
                          : 'bg-surface-secondary text-text-secondary border-border-light dark:border-white/10 hover:bg-surface-secondary/80'
                      }`}
                    >
                      Regular / Diario
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvFormTipo('Alturas')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        invFormTipo === 'Alturas'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-surface-secondary text-text-secondary border-border-light dark:border-white/10 hover:bg-surface-secondary/80'
                      }`}
                    >
                      Trabajo en Alturas
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Marca</label>
                  <input
                    type="text"
                    value={invFormMarca}
                    onChange={(e) => setInvFormMarca(e.target.value)}
                    placeholder="Ej. 3M, Steelpro"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Referencia / Norma</label>
                  <input
                    type="text"
                    value={invFormReferencia}
                    onChange={(e) => setInvFormReferencia(e.target.value)}
                    placeholder="Ej. ANSI Z89.1"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Talla</label>
                  <input
                    type="text"
                    value={invFormTalla}
                    onChange={(e) => setInvFormTalla(e.target.value)}
                    placeholder="Única / M / L / 40"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Unidad de Medida</label>
                  <select
                    value={invFormUnidad}
                    onChange={(e) => setInvFormUnidad(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Par">Par</option>
                    <option value="Juego">Juego</option>
                    <option value="Caja">Caja</option>
                    <option value="Kit">Kit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-secondary/40 border border-border-light dark:border-white/5">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">Stock Actual (Existencias)</label>
                  <input
                    type="number"
                    min="0"
                    value={invFormStockActual}
                    onChange={(e) => setInvFormStockActual(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-bold px-3 py-2 bg-surface-primary border border-border-light dark:border-white/10 rounded-xl text-teal-600 dark:text-teal-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    value={invFormStockMinimo}
                    onChange={(e) => setInvFormStockMinimo(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-bold px-3 py-2 bg-surface-primary border border-border-light dark:border-white/10 rounded-xl text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Costo Unitario ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={invFormCostoUnitario}
                    onChange={(e) => setInvFormCostoUnitario(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-semibold px-3 py-2 bg-surface-primary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Ubicación en Bodega</label>
                  <input
                    type="text"
                    value={invFormUbicacion}
                    onChange={(e) => setInvFormUbicacion(e.target.value)}
                    placeholder="Ej. Estante A-2 / Almacén Central"
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Observaciones / Especificaciones</label>
                  <input
                    type="text"
                    value={invFormObservaciones}
                    onChange={(e) => setInvFormObservaciones(e.target.value)}
                    placeholder="Vida útil, recomendaciones de recambio..."
                    className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-light dark:border-white/10 bg-surface-secondary/40 flex justify-end gap-3">
              <button
                onClick={() => { setIsInventoryModalOpen(false); resetInventoryForm(); }}
                disabled={invLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInventoryItem}
                disabled={invLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {invLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar en Almacén
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Ajuste Rápido de Stock */}
      {isAdjustStockModalOpen && adjustingItem && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-primary dark:bg-surface-secondary border border-border-light dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-border-light dark:border-white/10 flex items-center justify-between bg-surface-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Movimiento de Stock</h3>
                  <p className="text-xs text-text-secondary truncate max-w-[240px]">{adjustingItem.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAdjustStockModalOpen(false); setAdjustingItem(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-light dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Stock actual en bodega:</span>
                <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                  {adjustingItem.stockActual} {adjustingItem.unidad || 'unid.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Cantidad a ingresar (+) o descontar (-)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(prev => prev > 0 ? -prev : (prev || -1))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      adjustDelta < 0
                        ? 'bg-red-500/10 text-red-600 border-red-500/30'
                        : 'bg-surface-secondary text-text-secondary border-border-light dark:border-white/10'
                    }`}
                  >
                    Salida / Baja
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(prev => Math.abs(prev) || 1)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      adjustDelta >= 0
                        ? 'bg-teal-500/10 text-teal-600 border-teal-500/30'
                        : 'bg-surface-secondary text-text-secondary border-border-light dark:border-white/10'
                    }`}
                  >
                    Ingreso / Compra
                  </button>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                    className="w-24 text-center font-bold text-sm px-2 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="mt-2 text-[11px] text-text-secondary">
                  Nuevo stock resultante:{' '}
                  <span className={`font-bold ${Math.max(0, (adjustingItem.stockActual || 0) + adjustDelta) === 0 ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}`}>
                    {Math.max(0, (adjustingItem.stockActual || 0) + adjustDelta)} {adjustingItem.unidad || 'unid.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Motivo / Justificación</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ej. Factura de compra 104, reposición por daño..."
                  className="w-full text-xs px-3 py-2 bg-surface-secondary border border-border-light dark:border-white/10 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-light dark:border-white/10 bg-surface-secondary/40 flex justify-end gap-2">
              <button
                onClick={() => { setIsAdjustStockModalOpen(false); setAdjustingItem(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (adjustDelta === 0) {
                    showToast({ message: 'Ingrese una cantidad diferente de cero', status: 'warning' });
                    return;
                  }
                  await handleQuickStockAdjust(adjustingItem.id, adjustDelta, adjustReason);
                  setIsAdjustStockModalOpen(false);
                  setAdjustingItem(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                Aplicar Movimiento
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
