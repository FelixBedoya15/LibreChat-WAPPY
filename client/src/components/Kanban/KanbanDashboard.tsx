import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  Trello, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  User, 
  Car, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Pencil,
  Eye,
  EyeOff,
  BarChart2,
  Upload,
  X,
  ClipboardCheck,
  Stethoscope,
  Briefcase,
  ShieldAlert,
  Wrench,
  Activity,
  Layers,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Table2,
  MessageSquare,
  CalendarClock,
  FileCheck2,
  Send,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import UniversalColumnMapperModal from '~/components/SGSST/UniversalColumnMapperModal';
import { KANBAN_ACPM_FIELDS } from '~/components/SGSST/moduleFieldDefinitions';
import { exportModuleDataToExcel } from '~/components/SGSST/columnMapperEngine';
import SGSSTLegalBadge from '~/components/SGSST/SGSSTLegalBadge';
import SGSSTHeroHeader from '~/components/SGSST/SGSSTHeroHeader';
import ExpandableButton from '~/components/Common/ExpandableButton';
import KanbanCalendarView, { CalendarTask } from './KanbanCalendarView';
import KanbanTableView, { ACPMModalTab } from './KanbanTableView';
import KanbanTimelineView from './KanbanTimelineView';

export type ACPMViewMode = 'calendar' | 'kanban' | 'table' | 'timeline';

interface KanbanTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'due_soon' | 'overdue' | 'done';
  dueDate: string;
  type: 
    | 'manual' 
    | 'medical_exam' 
    | 'soat' 
    | 'rtm' 
    | 'driver_license' 
    | 'training' 
    | 'audit_finding'
    | 'diagnostico_finding'
    | 'alta_direccion_finding'
    | 'unsafe_act_finding'
    | 'ipevar_finding'
    | 'atel_finding'
    | 'ats_finding'
    | 'alturas_finding'
    | 'ergonomia_finding'
    | 'vulnerabilidad_finding'
    | 'pesv_inspection_finding'
    | 'heights_inspection_finding'
    | 'copasst_finding'
    | 'convivencia_finding'
    | 'other';
  priority?: 'alta' | 'media' | 'baja';
  actionType?: 'correctiva' | 'preventiva' | 'mejora';
  sourceModule?: string;
  assignedTo?: string;
  referenceId?: string;
  referenceName?: string;
  companyId?: string;
  completedAt?: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  emailAttendees?: string[];
  location?: string;
  googleEventId?: string;
  googleHtmlLink?: string;
  observations?: Array<{
    id: string;
    text: string;
    author: string;
    type?: 'note' | 'reschedule' | 'closure' | 'status_change';
    createdAt: string;
  }>;
  rescheduleHistory?: Array<{
    id: string;
    previousDate: string;
    newDate: string;
    reason: string;
    changedBy: string;
    changedAt: string;
  }>;
  isRescheduled?: boolean;
  closureDetails?: {
    howItWasClosed: string;
    evidenceRef: string;
    effectiveness: 'eficaz' | 'en_seguimiento' | 'pendiente_verificar' | 'no_eficaz';
    closedBy: string;
    closedAt?: string;
  };
}

interface KanbanDashboardProps {
  inline?: boolean;
  hideMainHeader?: boolean;
}

export default function KanbanDashboard({ inline = false, hideMainHeader = false }: KanbanDashboardProps = {}) {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ACPMViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('acpm_active_tab');
      if (
        stored === 'kanban' ||
        stored === 'calendar' ||
        stored === 'table' ||
        stored === 'timeline'
      ) {
        return stored;
      }
    }
    return 'calendar';
  });

  const handleTabChange = (tab: ACPMViewMode) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('acpm_active_tab', tab);
    }
  };

  // Notion-style Search & Quick Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'alta' | 'media' | 'baja'>('all');
  const [filterActionType, setFilterActionType] = useState<
    'all' | 'correctiva' | 'preventiva' | 'mejora'
  >('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'todo' | 'due_soon' | 'overdue' | 'done'
  >('all');

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterPriority !== 'all' ||
    filterActionType !== 'all' ||
    filterCategory !== 'all' ||
    filterStatus !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterActionType('all');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  const [showDashboard, setShowDashboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('acpm_show_dashboard') !== 'false';
    }
    return true;
  });

  const toggleDashboard = () => {
    setShowDashboard(prev => {
      const next = !prev;
      localStorage.setItem('acpm_show_dashboard', String(next));
      return next;
    });
  };

  // Excel & AI File Import states
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [pendingFileData, setPendingFileData] = useState<{
    dataUrl: string;
    name: string;
    type: string;
  } | null>(null);
  const [isConfirmAiModalOpen, setIsConfirmAiModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Homologador Visual de Casillas (Paralelo de Excel)
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);
  const [columnMapperBuffer, setColumnMapperBuffer] = useState<ArrayBuffer | null>(null);

  const handleConfirmColumnMapping = (mappedRows: any[]) => {
    if (!mappedRows || mappedRows.length === 0) {
      showToast({ message: 'No se encontraron filas con datos para importar.', status: 'warning' });
      return;
    }

    const parsedTasks: any[] = [];
    mappedRows.forEach((row: any) => {
      const title = row.title ? String(row.title).trim() : '';
      if (!title) return;

      const description = row.description ? String(row.description).trim() : '';
      let dueDate = row.dueDate ? String(row.dueDate).trim() : '';

      if (!dueDate) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        dueDate = defaultDate.toISOString().split('T')[0];
      }

      let status: 'todo' | 'due_soon' | 'overdue' | 'done' = 'todo';
      if (row.status) {
        const statusStr = String(row.status).toLowerCase().trim();
        if (statusStr.includes('complet') || statusStr.includes('hecha') || statusStr.includes('done') || statusStr.includes('terminada') || statusStr.includes('cerrad')) {
          status = 'done';
        } else if (statusStr.includes('vencid') || statusStr.includes('overdue') || statusStr.includes('alerta') || statusStr.includes('retrasad')) {
          status = 'overdue';
        } else if (statusStr.includes('proxim') || statusStr.includes('próxim') || statusStr.includes('due_soon')) {
          status = 'due_soon';
        }
      }

      let actionType: 'correctiva' | 'preventiva' | 'mejora' = 'correctiva';
      if (row.actionType) {
        const atStr = String(row.actionType).toLowerCase().trim();
        if (atStr.includes('prev')) actionType = 'preventiva';
        else if (atStr.includes('mej')) actionType = 'mejora';
      }

      let priority: 'alta' | 'media' | 'baja' = 'media';
      if (row.priority) {
        const pStr = String(row.priority).toLowerCase().trim();
        if (pStr.includes('alt')) priority = 'alta';
        else if (pStr.includes('baj')) priority = 'baja';
      }

      parsedTasks.push({
        title,
        description,
        dueDate,
        status,
        actionType,
        priority,
        assignedTo: row.assignedTo ? String(row.assignedTo).trim() : undefined,
        sourceModule: row.sourceModule ? String(row.sourceModule).trim() : 'Plan ACPM Excel',
        type: 'manual'
      });
    });

    if (parsedTasks.length === 0) {
      showToast({ message: 'No se encontraron actividades válidas en el Excel. Asegúrate de mapear el Título o Actividad.', status: 'warning' });
      return;
    }

    setIsColumnMapperOpen(false);
    setColumnMapperBuffer(null);
    setImportPreview(parsedTasks);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    const requestAiImport = () => {
      const base64Reader = new FileReader();
      base64Reader.onload = (base64Event) => {
        setPendingFileData({
          dataUrl: base64Event.target?.result as string,
          name: file.name,
          type: file.type || 'application/octet-stream'
        });
        setIsConfirmAiModalOpen(true);
      };
      base64Reader.readAsDataURL(file);
    };

    // If PDF, Word, or plain text, go straight to AI
    if (['pdf', 'docx', 'doc', 'txt'].includes(extension || '')) {
      requestAiImport();
      if (e.target) e.target.value = '';
      return;
    }

    // If Excel or CSV, open UniversalColumnMapperModal
    if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (eEvent) => {
        const buffer = eEvent.target?.result as ArrayBuffer;
        if (buffer) {
          setColumnMapperBuffer(buffer);
          setIsColumnMapperOpen(true);
        }
      };
      reader.readAsArrayBuffer(file);
      if (e.target) e.target.value = '';
      return;
    }
  };

  const handleConfirmAiImport = async () => {
    if (!pendingFileData) return;
    setIsConfirmAiModalOpen(false);
    setIsAiLoading(true);
    try {
      const res = await axios.post('/api/sgsst/kanban/import-file', {
        fileData: pendingFileData.dataUrl,
        fileName: pendingFileData.name,
        mimeType: pendingFileData.type
      });
      if (res.data && res.data.tasks) {
        setImportPreview(res.data.tasks);
        showToast({ message: `IA procesó el archivo con éxito. Detectó ${res.data.tasks.length} actividades.`, status: 'success' });
      } else {
        showToast({ message: 'No se pudieron extraer actividades con IA.', status: 'warning' });
      }
    } catch (err: any) {
      console.error('Error in AI import:', err);
      showToast({ message: err.response?.data?.error || 'Error al procesar el archivo con IA', status: 'error' });
    } finally {
      setIsAiLoading(false);
      setPendingFileData(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setIsImporting(true);
    try {
      await axios.post('/api/sgsst/kanban/bulk-save', { tasks: importPreview });
      showToast({ message: `¡Se importaron ${importPreview.length} actividades correctamente!`, status: 'success' });
      setImportPreview(null);
      fetchTasks();
    } catch (err) {
      console.error('Error saving imported tasks:', err);
      showToast({ message: 'No se pudieron guardar las actividades importadas.', status: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportExcel = () => {
    const mappedTasks = tasks.map((t) => {
      const obsSummary =
        Array.isArray(t.observations) && t.observations.length > 0
          ? ` | Observaciones (${t.observations.length}): ${t.observations
              .map((o) => `[${o.author}: ${o.text}]`)
              .join(' ; ')}`
          : '';
      const reschedSummary =
        Array.isArray(t.rescheduleHistory) && t.rescheduleHistory.length > 0
          ? ` | Reprogramaciones (${t.rescheduleHistory.length}): ${t.rescheduleHistory
              .map((r) => `${r.previousDate} -> ${r.newDate} (${r.reason})`)
              .join(' ; ')}`
          : '';
      const closureSummary = t.closureDetails?.howItWasClosed
        ? ` | Cierre ACPM: ${t.closureDetails.howItWasClosed} (Evidencia: ${
            t.closureDetails.evidenceRef || 'N/A'
          }, Eficacia: ${t.closureDetails.effectiveness || 'eficaz'})`
        : '';

      return {
        title: t.title || '',
        description: `${t.description || ''}${obsSummary}${reschedSummary}${closureSummary}`.trim(),
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
        status:
          t.status === 'done'
            ? 'Completada (done)'
            : t.status === 'overdue'
              ? 'Vencida (overdue)'
              : t.status === 'due_soon'
                ? 'Próxima a vencer (due_soon)'
                : 'Pendiente (todo)',
        actionType:
          t.actionType === 'preventiva'
            ? 'Preventiva'
            : t.actionType === 'mejora'
              ? 'Mejora'
              : 'Correctiva',
        priority: t.priority === 'alta' ? 'Alta' : t.priority === 'baja' ? 'Baja' : 'Media',
        assignedTo: t.assignedTo || '',
        sourceModule: categoryInfo[t.type]?.label || t.sourceModule || 'ACPM SG-SST',
      };
    });
    exportModuleDataToExcel({
      targetFields: KANBAN_ACPM_FIELDS,
      data: mappedTasks,
      fileName: `Tablero_Kanban_ACPM_${new Date().toISOString().split('T')[0]}.xlsx`,
      isTemplate: false,
    });
    showToast({
      message: 'Actividades del tablero exportadas a Excel exitosamente',
      status: 'success',
    });
  };

  const handleDownloadTemplate = () => {
    exportModuleDataToExcel({
      targetFields: KANBAN_ACPM_FIELDS,
      data: [],
      fileName: 'Plantilla_Kanban_ACPM.xlsx',
      isTemplate: true,
    });
    showToast({
      message: 'Plantilla de Actividades ACPM descargada exitosamente',
      status: 'success',
    });
  };
  
  // Modal states (360° ACPM Management: Details, Observations, Reschedule, Closure)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<ACPMModalTab>('details');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newType, setNewType] = useState<string>('manual');
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('10:00');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('');
  const [newEmailAttendees, setNewEmailAttendees] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [newActionType, setNewActionType] = useState<'correctiva' | 'preventiva' | 'mejora'>('correctiva');
  const [sendEmailOnSave, setSendEmailOnSave] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [renewalDate, setRenewalDate] = useState<string>('');

  // Tab 2: Observations states
  const [newObsText, setNewObsText] = useState<string>('');
  const [newObsAuthor, setNewObsAuthor] = useState<string>('');
  const [isSubmittingObs, setIsSubmittingObs] = useState<boolean>(false);

  // Tab 3: Reschedule states
  const [rescheduleNewDate, setRescheduleNewDate] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleAuthor, setRescheduleAuthor] = useState<string>('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);

  // Tab 4: Closure & Effectiveness states
  const [closureHow, setClosureHow] = useState<string>('');
  const [closureEvidence, setClosureEvidence] = useState<string>('');
  const [closureEffectiveness, setClosureEffectiveness] = useState<
    'eficaz' | 'en_seguimiento' | 'pendiente_verificar' | 'no_eficaz'
  >('eficaz');
  const [closureAuthor, setClosureAuthor] = useState<string>('');
  const [closureDate, setClosureDate] = useState<string>('');
  const [isSubmittingClosure, setIsSubmittingClosure] = useState<boolean>(false);

  const getRenewalDetails = (task: KanbanTask) => {
    if (task.referenceId && task.referenceId.startsWith('training_session')) {
      return {
        title: 'Cierre de Sesión de Capacitación',
        label: 'Fecha de realización de la capacitación *',
        helper: 'Al registrar la realización, se cambiará el estado de la capacitación a "Completada" en tu cronograma.',
      };
    }
    if (task.referenceId && (task.referenceId.includes('-bio-') || task.referenceId.includes('-biocentric'))) {
      return {
        title: 'Gestión y Cierre de Alerta de Salud (Auditoría Biocéntrica)',
        label: 'Fecha de intervención o seguimiento médico *',
        helper: 'Ingresa la fecha en que se realizó el seguimiento o medida de control para el trabajador.',
      };
    }
    switch (task.type) {
      case 'medical_exam':
        return {
          title: 'Cierre y Registro de Examen Médico',
          label: 'Fecha de realización del nuevo examen *',
          helper: 'Al registrar la realización, Wappy actualizará la ficha del trabajador y programará automáticamente el próximo examen anual.',
        };
      case 'soat':
        return {
          title: 'Cierre y Registro de SOAT',
          label: 'Nueva fecha de vencimiento del SOAT *',
          helper: 'Al registrar, se actualizará el vencimiento del SOAT en el módulo de vehículos con la nueva fecha ingresada.',
        };
      case 'rtm':
        return {
          title: 'Cierre y Registro de Revisión Técnico-Mecánica',
          label: 'Nueva fecha de vencimiento de la RTM *',
          helper: 'Al registrar, se actualizará el vencimiento de la RTM en el módulo de vehículos con la nueva fecha ingresada.',
        };
      case 'driver_license':
        return {
          title: 'Cierre y Registro de Licencia de Conducción / SST',
          label: 'Nueva fecha de vencimiento de la Licencia *',
          helper: 'Al registrar, se actualizará el vencimiento de la licencia en la ficha del trabajador.',
        };
      case 'training':
        return {
          title: 'Cierre y Registro de Curso de Alturas / Capacitación',
          label: 'Fecha de realización del nuevo curso *',
          helper: 'Al registrar, se actualizará la fecha del curso en la ficha del trabajador y se reprogramará su vencimiento anual.',
        };
      default:
        return {
          title: 'Cierre y Registro de Actividad',
          label: 'Nueva fecha de realización / vencimiento *',
          helper: 'Al registrar, se actualizarán los datos vinculados al sistema.',
        };
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isProOrAdmin = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || user?.role === 'USER_IPEVAR' || user?.role === 'IPEVAR' || Boolean(user?.isSubUser);
  const isLocked = !isProOrAdmin;

  // Fetch tasks
  const fetchTasks = async (force: boolean = false, clearPrev: boolean = false) => {
    if (clearPrev) {
      setTasks([]);
      setIsLoading(true);
    }
    try {
      const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
      const params = new URLSearchParams();
      if (force) params.set('force', 'true');
      if (compId) params.set('companyId', compId);
      const qs = params.toString();
      const url = qs ? `/api/sgsst/kanban/data?${qs}` : '/api/sgsst/kanban/data';
      const res = await axios.get(url, { timeout: 15000 });
      if (Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      console.error('Error fetching Kanban tasks:', err);
      if (force) {
        showToast({
          message: 'Error al sincronizar actividades del tablero.',
          status: 'error',
        });
      }
      setTasks(prev => (clearPrev ? [] : Array.isArray(prev) ? prev : []));
    } finally {
      setIsLoading(false);
    }
  };

  const loadKanbanData = (clearPrev: boolean = true) => {
    return fetchTasks(true, clearPrev);
  };

  useEffect(() => {
    fetchTasks();

    const handleWappyRefresh = () => {
      fetchTasks(true);
    };

    const handleCompanySwitch = () => {
      setEditingTask(null);
      setIsModalOpen(false);
      loadKanbanData(true);
    };

    window.addEventListener('wappy-refresh-kanban', handleWappyRefresh);
    window.addEventListener('wappy-refresh-calendar', handleWappyRefresh);
    window.addEventListener('wappy-company-changed', handleCompanySwitch);
    window.addEventListener('wappy-company-updated', handleCompanySwitch);
    window.addEventListener('wappy-empresa-cambiada', handleCompanySwitch);
    window.addEventListener('wappy-reload-sgsst-data', handleWappyRefresh);

    return () => {
      window.removeEventListener('wappy-refresh-kanban', handleWappyRefresh);
      window.removeEventListener('wappy-refresh-calendar', handleWappyRefresh);
      window.removeEventListener('wappy-company-changed', handleCompanySwitch);
      window.removeEventListener('wappy-company-updated', handleCompanySwitch);
      window.removeEventListener('wappy-empresa-cambiada', handleCompanySwitch);
      window.removeEventListener('wappy-reload-sgsst-data', handleWappyRefresh);
    };
  }, []);

  // Handle Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'todo' | 'due_soon' | 'overdue' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Find the task
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // If dragged to 'done' ('Completadas'), open the 360° Closure tab so user can document how it was closed
    if (newStatus === 'done') {
      openEditModal({ ...task, status: 'done' }, 'closure');
    }

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: taskId,
        status: newStatus
      });
      if (res.data && res.data._id) {
        setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
      }
      showToast({
        message:
          newStatus === 'done'
            ? 'Actividad movida a Completadas. Documenta cómo se cerró la actividad.'
            : `Actividad movida a ${getStatusLabel(newStatus)}`,
        status: 'success'
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      setTasks(previousTasks);
      showToast({
        message: 'Error al cambiar el estado de la actividad.',
        status: 'error'
      });
    }
  };

  const openCreateModal = (defaultDate?: string) => {
    setEditingTask(null);
    setModalTab('details');
    setNewTitle('');
    setNewDesc('');
    setNewDueDate(defaultDate || new Date().toISOString().split('T')[0]);
    setNewType('manual');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewAssignedTo('');
    setNewEmailAttendees('');
    setNewLocation('');
    setNewPriority('media');
    setNewActionType('correctiva');
    setSendEmailOnSave(false);
    setRenewalDate('');
    setNewObsText('');
    setNewObsAuthor(user?.name || 'Coordinador SST');
    setRescheduleNewDate('');
    setRescheduleReason('');
    setRescheduleAuthor(user?.name || 'Coordinador SST');
    setClosureHow('');
    setClosureEvidence('');
    setClosureEffectiveness('eficaz');
    setClosureAuthor(user?.name || 'Coordinador SST');
    setClosureDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (task: KanbanTask, initialTab: ACPMModalTab = 'details') => {
    setEditingTask(task);
    setModalTab(initialTab);
    setNewTitle(task.title);
    setNewDesc(task.description || '');
    const dateStr = task.dueDate ? task.dueDate.split('T')[0] : '';
    setNewDueDate(dateStr);
    setNewType(task.type || 'manual');
    setNewStartTime(task.startTime || '09:00');
    setNewEndTime(task.endTime || '10:00');
    setNewAssignedTo(task.assignedTo || '');
    setNewEmailAttendees(task.emailAttendees && task.emailAttendees.length > 0 ? task.emailAttendees.join(', ') : '');
    setNewLocation(task.location || '');
    setNewPriority(task.priority || 'media');
    setNewActionType(task.actionType || 'correctiva');
    setSendEmailOnSave(false);
    setRenewalDate('');

    const defaultAuthor = user?.name || task.assignedTo || 'Coordinador SST';
    setNewObsText('');
    setNewObsAuthor(defaultAuthor);

    setRescheduleNewDate(dateStr);
    setRescheduleReason('');
    setRescheduleAuthor(defaultAuthor);

    setClosureHow(task.closureDetails?.howItWasClosed || '');
    setClosureEvidence(task.closureDetails?.evidenceRef || '');
    setClosureEffectiveness(task.closureDetails?.effectiveness || 'eficaz');
    setClosureAuthor(task.closureDetails?.closedBy || defaultAuthor);
    setClosureDate(
      task.closureDetails?.closedAt
        ? task.closureDetails.closedAt.split('T')[0]
        : new Date().toISOString().split('T')[0],
    );
    setIsModalOpen(true);
  };

  // Add Observation in real time without closing modal
  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!newObsText.trim()) {
      showToast({ message: 'Escribe el detalle de la observación o seguimiento.', status: 'warning' });
      return;
    }

    setIsSubmittingObs(true);
    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: editingTask._id,
        title: editingTask.title,
        status: editingTask.status,
        newObservation: {
          text: newObsText.trim(),
          author: newObsAuthor.trim() || 'Coordinador SST',
          type: 'note',
        },
      });
      if (res.data && res.data._id) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
        setEditingTask(res.data);
      } else {
        // Optimistic fallback if backend returns partial
        const fallbackObs = {
          id: `obs_${Date.now()}`,
          text: newObsText.trim(),
          author: newObsAuthor.trim() || 'Coordinador SST',
          type: 'note' as const,
          createdAt: new Date().toISOString(),
        };
        const updatedTask: KanbanTask = {
          ...editingTask,
          observations: [...(editingTask.observations || []), fallbackObs],
        };
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? updatedTask : t)));
        setEditingTask(updatedTask);
      }
      setNewObsText('');
      showToast({ message: 'Observación registrada en la bitácora de la actividad.', status: 'success' });
    } catch (err) {
      console.error('Error adding observation:', err);
      showToast({ message: 'No se pudo guardar la observación.', status: 'error' });
    } finally {
      setIsSubmittingObs(false);
    }
  };

  // Apply Reschedule with justification & history log
  const handleApplyReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!rescheduleNewDate || !rescheduleReason.trim()) {
      showToast({
        message: 'Ingresa la nueva fecha programada y el motivo de reprogramación.',
        status: 'warning',
      });
      return;
    }

    setIsSubmittingReschedule(true);
    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: editingTask._id,
        title: editingTask.title,
        reschedule: {
          newDate: rescheduleNewDate,
          reason: rescheduleReason.trim(),
          changedBy: rescheduleAuthor.trim() || 'Coordinador SST',
        },
      });
      if (res.data && res.data._id) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
        setEditingTask(res.data);
        setNewDueDate(rescheduleNewDate);
      } else {
        const entry = {
          id: `resch_${Date.now()}`,
          previousDate: editingTask.dueDate,
          newDate: rescheduleNewDate,
          reason: rescheduleReason.trim(),
          changedBy: rescheduleAuthor.trim() || 'Coordinador SST',
          changedAt: new Date().toISOString(),
        };
        const updatedTask: KanbanTask = {
          ...editingTask,
          dueDate: rescheduleNewDate,
          isRescheduled: true,
          rescheduleHistory: [...(editingTask.rescheduleHistory || []), entry],
        };
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? updatedTask : t)));
        setEditingTask(updatedTask);
        setNewDueDate(rescheduleNewDate);
      }
      setRescheduleReason('');
      showToast({
        message: 'Actividad reprogramada con éxito y registrada en el historial.',
        status: 'success',
      });
    } catch (err) {
      console.error('Error rescheduling task:', err);
      showToast({ message: 'No se pudo reprogramar la actividad.', status: 'error' });
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Register full ACPM Closure & Effectiveness
  const handleRegisterClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!closureHow.trim()) {
      showToast({
        message: 'Describe cómo se cerró la actividad o qué control se implementó.',
        status: 'warning',
      });
      return;
    }

    setIsSubmittingClosure(true);
    try {
      const closurePayload = {
        howItWasClosed: closureHow.trim(),
        evidenceRef: closureEvidence.trim(),
        effectiveness: closureEffectiveness,
        closedBy: closureAuthor.trim() || 'Coordinador SST',
        closedAt: closureDate ? new Date(closureDate).toISOString() : new Date().toISOString(),
      };
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: editingTask._id,
        title: editingTask.title,
        status: 'done',
        renewalDate: renewalDate || undefined,
        closureDetails: closurePayload,
      });
      if (res.data && res.data._id) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
      } else {
        const updatedTask: KanbanTask = {
          ...editingTask,
          status: 'done',
          closureDetails: closurePayload,
        };
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? updatedTask : t)));
      }
      showToast({
        message: '¡Cierre ACPM y evidencia registrados! Actividad marcada como Completada.',
        status: 'success',
      });
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error registering closure:', err);
      showToast({ message: 'No se pudo registrar el cierre de la actividad.', status: 'error' });
    } finally {
      setIsSubmittingClosure(false);
    }
  };

  // Create or update task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      showToast({ message: 'Título y fecha límite son obligatorios.', status: 'warning' });
      return;
    }

    setIsSaving(true);
    try {
      let savedTaskId: string | null = null;
      if (editingTask) {
        // Edit mode
        const res = await axios.post('/api/sgsst/kanban/save', {
          _id: editingTask._id,
          title: newTitle,
          description: newDesc,
          dueDate: newDueDate,
          type: newType,
          status: editingTask.status,
          startTime: newStartTime,
          endTime: newEndTime,
          assignedTo: newAssignedTo,
          emailAttendees: newEmailAttendees ? newEmailAttendees.split(',').map(s => s.trim()).filter(Boolean) : [],
          location: newLocation,
          priority: newPriority,
          actionType: newActionType,
          renewalDate: renewalDate || undefined
        });

        savedTaskId = editingTask._id;
        setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data : t));
        showToast({ message: 'Actividad actualizada correctamente.', status: 'success' });
      } else {
        // Create mode
        const res = await axios.post('/api/sgsst/kanban/save', {
          title: newTitle,
          description: newDesc,
          dueDate: newDueDate,
          type: newType,
          status: 'todo',
          startTime: newStartTime,
          endTime: newEndTime,
          assignedTo: newAssignedTo,
          emailAttendees: newEmailAttendees ? newEmailAttendees.split(',').map(s => s.trim()).filter(Boolean) : [],
          location: newLocation,
          priority: newPriority,
          actionType: newActionType,
        });

        savedTaskId = res.data?._id || null;
        setTasks(prev => [...prev, res.data]);
        showToast({ message: 'Actividad programada correctamente.', status: 'success' });
      }

      // Enviar correo si está seleccionado y hay destinatarios
      if (sendEmailOnSave && savedTaskId && newEmailAttendees.trim()) {
        try {
          await axios.post('/api/sgsst/kanban/send-event-email', {
            taskId: savedTaskId,
            recipients: newEmailAttendees,
            title: newTitle,
            description: newDesc,
            dueDate: newDueDate,
            startTime: newStartTime,
            endTime: newEndTime,
            location: newLocation,
          });
          showToast({ message: '¡Citación enviada por correo electrónico con éxito!', status: 'success' });
        } catch (mailErr) {
          console.error('Error enviando correo:', mailErr);
          showToast({ message: 'Actividad guardada, pero hubo un detalle al enviar el correo.', status: 'warning' });
        }
      }

      setIsModalOpen(false);
      
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewType('manual');
      setNewStartTime('09:00');
      setNewEndTime('10:00');
      setNewAssignedTo('');
      setNewEmailAttendees('');
      setNewLocation('');
      setSendEmailOnSave(false);
      setRenewalDate('');
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
      showToast({ message: 'No se pudo guardar la actividad.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta actividad del tablero?')) return;

    try {
      await axios.delete(`/api/sgsst/kanban/delete/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      showToast({ message: 'Actividad eliminada.', status: 'success' });
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast({ message: 'No se pudo eliminar la actividad.', status: 'error' });
    }
  };

  // Mark complete directly
  const handleMarkComplete = async (id: string) => {
    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: id,
        status: 'done'
      });
      setTasks(prev => prev.map(t => t._id === id ? res.data : t));
      showToast({ message: 'Actividad completada y archivada.', status: 'success' });
    } catch (err) {
      console.error('Error completing task:', err);
      showToast({ message: 'No se pudo completar la actividad.', status: 'error' });
    }
  };

  // Quick inline status change (Table / Views)
  const handleQuickStatusChange = async (
    taskId: string,
    newStatus: 'todo' | 'due_soon' | 'overdue' | 'done',
  ) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    const previousTasks = [...tasks];
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: taskId,
        status: newStatus,
      });
      if (res.data && res.data._id) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      }
      showToast({
        message: `Estado actualizado a ${getStatusLabel(newStatus)}`,
        status: 'success',
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      setTasks(previousTasks);
      showToast({
        message: 'No se pudo actualizar el estado de la actividad.',
        status: 'error',
      });
    }
  };

  // Quick inline priority change (Table / Views)
  const handleQuickPriorityChange = async (
    taskId: string,
    newPriority: 'alta' | 'media' | 'baja',
  ) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.priority === newPriority) return;

    const previousTasks = [...tasks];
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, priority: newPriority } : t)));

    try {
      const res = await axios.post('/api/sgsst/kanban/save', {
        _id: taskId,
        priority: newPriority,
      });
      if (res.data && res.data._id) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      }
      showToast({
        message: `Prioridad actualizada a ${newPriority.toUpperCase()}`,
        status: 'success',
      });
    } catch (err) {
      console.error('Error updating task priority:', err);
      setTasks(previousTasks);
      showToast({
        message: 'No se pudo actualizar la prioridad de la actividad.',
        status: 'error',
      });
    }
  };

  const handleAcceptGroupInvite = async (invitationId: string) => {
    try {
      await axios.post(`/api/chat-sst/invitations/${invitationId}/accept`);
      showToast({ message: '¡Invitación aceptada! Te has unido al grupo.', status: 'success' });
      fetchTasks();
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
      showToast({ message: 'No se pudo aceptar la invitación.', status: 'error' });
    }
  };

  const handleRejectGroupInvite = async (invitationId: string) => {
    try {
      await axios.post(`/api/chat-sst/invitations/${invitationId}/reject`);
      showToast({ message: 'Invitación rechazada.', status: 'success' });
      fetchTasks();
    } catch (err) {
      console.error('Error al rechazar invitación:', err);
      showToast({ message: 'No se pudo rechazar la invitación.', status: 'error' });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'Pendiente';
      case 'due_soon': return 'Próxima a vencer';
      case 'overdue': return 'Vencida';
      case 'done': return 'Completada';
      default: return status;
    }
  };

  // Filtered tasks for unified Notion-style Search & Quick Filters across all 4 views
  const filteredTasks = useMemo(() => {
    const safeList = Array.isArray(tasks) ? tasks : [];
    const q = searchQuery.trim().toLowerCase();

    return safeList.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && (t.priority || 'media') !== filterPriority) return false;
      if (filterActionType !== 'all' && (t.actionType || 'correctiva') !== filterActionType)
        return false;
      if (filterCategory !== 'all' && (t.type || 'manual') !== filterCategory) return false;

      if (q) {
        const titleMatch = (t.title?.toLowerCase() || '').includes(q);
        const descMatch = (t.description?.toLowerCase() || '').includes(q);
        const respMatch = (t.assignedTo?.toLowerCase() || '').includes(q);
        const refMatch = (t.referenceName?.toLowerCase() || '').includes(q);
        const srcMatch = (t.sourceModule?.toLowerCase() || '').includes(q);
        if (!titleMatch && !descMatch && !respMatch && !refMatch && !srcMatch) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterStatus, filterPriority, filterActionType, filterCategory]);

  // Calculate stats
  const totalCount = tasks.length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const dueSoonCount = tasks.filter(t => t.status === 'due_soon').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const allTodoCount = tasks.filter(t => t.status === 'todo').length;

  // Filter tasks into columns (respecting active filters)
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const dueSoonTasks = filteredTasks.filter(t => t.status === 'due_soon');
  const overdueTasks = filteredTasks.filter(t => t.status === 'overdue');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  // Compliance calculations
  const complianceRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;
  
  const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const dueSoonPct = totalCount > 0 ? Math.round((dueSoonCount / totalCount) * 100) : 0;
  const overduePct = totalCount > 0 ? Math.round((overdueCount / totalCount) * 100) : 0;
  const todoPct = totalCount > 0 ? Math.round((allTodoCount / totalCount) * 100) : 0;

  const categoryInfo: Record<string, { label: string; color: string; bg: string }> = {
    audit_finding: { label: 'Auditoría SG-SST', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-600' },
    diagnostico_finding: { label: 'Diagnóstico Inicial', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-600' },
    alta_direccion_finding: { label: 'Alta Dirección', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-600' },
    unsafe_act_finding: { label: 'Actos y Condiciones', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-600' },
    ipevar_finding: { label: 'Controles IPEVR (GTC 45)', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-600' },
    atel_finding: { label: 'Investigación ATEL', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-600' },
    ats_finding: { label: 'Análisis Trabajo Seguro', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-600' },
    alturas_finding: { label: 'Trabajo en Alturas', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-600' },
    ergonomia_finding: { label: 'Ergonomía (OWAS/EPT)', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-600' },
    vulnerabilidad_finding: { label: 'Plan de Emergencias', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600' },
    pesv_inspection_finding: { label: 'Inspección PESV', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-600' },
    heights_inspection_finding: { label: 'Inspección Alturas', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-600' },
    medical_exam: { label: 'Exámenes Médicos', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500' },
    soat: { label: 'SOAT Vehículos', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500' },
    rtm: { label: 'Técnico-Mecánica', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500' },
    driver_license: { label: 'Licencias Conducción', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500' },
    training: { label: 'Capacitaciones SST', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500' },
    manual: { label: 'Tareas Generales', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500' },
    other: { label: 'Otros', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500' }
  };

  const categoryStats = Object.keys(categoryInfo).map(type => {
    const typeTasks = tasks.filter(t => t.type === type);
    const total = typeTasks.length;
    const completed = typeTasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      type,
      total,
      completed,
      rate,
      ...categoryInfo[type]
    };
  }).filter(c => c.total > 0);

  // Render type icon & badge
  const renderTaskBadge = (task: KanbanTask) => {
    let icon = <Clock className="w-3.5 h-3.5" />;
    let text = 'General';
    let color = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    let redirectPath = '';

    if (task.referenceId && (task.referenceId.includes('-bio-') || task.referenceId.includes('-biocentric'))) {
      icon = <AlertTriangle className="w-3.5 h-3.5" />;
      text = 'Alerta Médica';
      color = 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/40';
      redirectPath = '/sgsst?tab=workers';
    } else if (task.referenceId && task.referenceId.startsWith('training_session')) {
      icon = <BookOpen className="w-3.5 h-3.5" />;
      text = 'Capacitación Programada';
      color = 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/40';
      redirectPath = '/sgsst?tab=capacitaciones';
    } else if (task.type === 'audit_finding') {
      icon = <ClipboardCheck className="w-3.5 h-3.5" />;
      text = 'Auditoría SG-SST';
      color = 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40';
      redirectPath = '/sgsst?tab=auditoria';
    } else if (task.type === 'diagnostico_finding') {
      icon = <Stethoscope className="w-3.5 h-3.5" />;
      text = 'Diagnóstico Inicial';
      color = 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/40';
      redirectPath = '/sgsst?tab=diagnostico';
    } else if (task.type === 'alta_direccion_finding') {
      icon = <Briefcase className="w-3.5 h-3.5" />;
      text = 'Alta Dirección';
      color = 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/40';
      redirectPath = '/sgsst?tab=alta_direccion';
    } else if (task.type === 'unsafe_act_finding') {
      icon = <AlertTriangle className="w-3.5 h-3.5" />;
      text = 'Acto / Condición';
      color = 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/40';
      redirectPath = '/sgsst?tab=reporte_actos';
    } else if (task.type === 'ipevar_finding') {
      icon = <ShieldAlert className="w-3.5 h-3.5" />;
      text = task.title?.includes('[Control Propuesto') ? 'Control Propuesto (Anexo E)' : 'Peligro Crítico GTC-45';
      color = 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40';
      redirectPath = '/sgsst?tab=matriz_ipevar_oficial';
    } else if (task.type === 'atel_finding') {
      icon = <Activity className="w-3.5 h-3.5" />;
      text = 'Investigación ATEL';
      color = 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/40';
      redirectPath = '/sgsst?tab=investigacion_atel';
    } else if (task.type === 'ats_finding') {
      icon = <ShieldAlert className="w-3.5 h-3.5" />;
      text = 'Análisis Trabajo Seguro';
      color = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40';
      redirectPath = '/sgsst?tab=analisis_trabajo_seguro';
    } else if (task.type === 'alturas_finding') {
      icon = <Wrench className="w-3.5 h-3.5" />;
      text = 'Trabajo en Alturas';
      color = 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/40';
      redirectPath = '/sgsst?tab=permiso_alturas';
    } else if (task.type === 'ergonomia_finding') {
      icon = <Activity className="w-3.5 h-3.5" />;
      text = 'Ergonomía';
      color = 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/40';
      redirectPath = '/sgsst?tab=metodo_owas';
    } else if (task.type === 'vulnerabilidad_finding') {
      icon = <ShieldAlert className="w-3.5 h-3.5" />;
      text = 'Plan de Emergencias';
      color = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/40';
      redirectPath = '/sgsst?tab=vulnerabilidad';
    } else if (task.type === 'pesv_inspection_finding') {
      icon = <Car className="w-3.5 h-3.5" />;
      text = 'Inspección PESV';
      color = 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40';
      redirectPath = '/sgsst?tab=vehicles_pesv';
    } else if (task.type === 'heights_inspection_finding') {
      icon = <Wrench className="w-3.5 h-3.5" />;
      text = 'Inspección Alturas';
      color = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40';
      redirectPath = '/sgsst?tab=heights_lifecycle';
    } else if (task.type === 'medical_exam') {
      icon = <User className="w-3.5 h-3.5" />;
      text = 'Examen Médico';
      color = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40';
      redirectPath = '/sgsst?tab=workers';
    } else if (task.type === 'soat') {
      icon = <Car className="w-3.5 h-3.5" />;
      text = 'SOAT';
      color = 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40';
      redirectPath = '/sgsst?tab=vehicles';
    } else if (task.type === 'rtm') {
      icon = <Car className="w-3.5 h-3.5" />;
      text = 'Revisión Técnico-Mecánica';
      color = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40';
      redirectPath = '/sgsst?tab=vehicles';
    } else if (task.type === 'driver_license') {
      icon = <User className="w-3.5 h-3.5" />;
      text = 'Licencia';
      color = 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/40';
      redirectPath = '/sgsst?tab=workers';
    } else if (task.type === 'training') {
      icon = <BookOpen className="w-3.5 h-3.5" />;
      text = 'Capacitación';
      color = 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40';
      redirectPath = '/sgsst?tab=capacitaciones';
    }

    return (
      <div className="flex flex-col gap-1.5 mt-2.5">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
            {icon}
            {text}
          </span>
          
          <div className="flex items-center gap-1">
            {task.priority && (
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${
                task.priority === 'alta' 
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50' 
                  : task.priority === 'baja'
                  ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
              }`}>
                {task.priority}
              </span>
            )}
            {task.actionType && (
              <span className="text-[9px] font-semibold capitalize px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border-medium/30">
                {task.actionType}
              </span>
            )}
          </div>
        </div>

        {redirectPath && task.status !== 'done' && (
          <div className="flex justify-end">
            <a 
              href={redirectPath}
              className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Ver en origen <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    );
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  const getDaysDiffText = (task: KanbanTask) => {
    if (task.status === 'done') {
      return 'Completado';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
    } else if (diffDays === 0) {
      return 'Vence HOY';
    } else {
      return `Faltan ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-surface-secondary/30 relative ${
      inline 
        ? "h-[650px] rounded-3xl border border-border-medium/30 shadow-inner overflow-hidden" 
        : "min-h-screen h-auto overflow-y-auto pb-12"
    }`}>
      <div className={`flex-1 flex flex-col ${
        inline ? "min-h-0 overflow-hidden" : "h-auto overflow-visible"
      } ${isLocked ? 'filter blur-[8px] pointer-events-none select-none' : ''}`}>
        {/* Upper header */}
      <div className="px-6 pt-6 pb-2">
        <SGSSTHeroHeader
          categoryId="control_acpm"
          icon={<Trello className="h-7 w-7" />}
          title="Tablero Kanban ACPM"
          description="Control ágil e integral de las Acciones Correctivas, Preventivas y de Mejora generadas en el sistema."
          badges={
            <>
              <div
                title={`${totalCount} Tareas Totales · ${doneCount} Completadas · ${overdueCount} Vencidas`}
                className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                    {totalCount}
                  </span>
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                  <span className="text-xs font-bold tracking-wide">
                    {doneCount}/{totalCount} Completadas ({complianceRate}%)
                  </span>
                </div>
              </div>
              <SGSSTLegalBadge
                standardCode="7.1"
                label="Dec. 1072 Art. 2.2.4.6.33 · Res. 0312 Est. 7.1.1: CUMPLE"
                tooltip="ISO 45001:2018 Num. 10.2 (Acciones preventivas, correctivas y de mejora) · Res. 0312/2019 Estándar 7.1.1 y Dec. 1072/15 Art. 2.2.4.6.33 — Acciones Preventivas, Correctivas y de Mejora (ACPM)"
                moduleName="Tablero Kanban ACPM"
              />
            </>
          }
          actions={
            <>
              <ExpandableButton
                onClick={toggleDashboard}
                variant="orange"
                isActive={showDashboard}
                icon={
                  showDashboard ? (
                    <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />
                  )
                }
                label={showDashboard ? "Ocultar Analíticas" : "Ver Analíticas"}
              />

              <ExpandableButton
                onClick={() => {
                  setIsLoading(true);
                  fetchTasks(true);
                }}
                disabled={isLoading}
                variant="cyan"
                icon={
                  <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-current ${isLoading ? 'animate-spin' : ''}`} />
                }
                label="Sincronizar"
              />

              <ExpandableButton
                onClick={triggerFileInput}
                variant="blue"
                icon={<Upload className="w-4 h-4 sm:w-5 sm:h-5 text-current" />}
                label="Importar Archivo"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls, .pdf, .docx, .doc, .txt"
              />

              <ExpandableButton
                onClick={handleDownloadTemplate}
                variant="blue"
                icon={<Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
                label="Descargar Formato"
                title="Descargar Formato / Plantilla Oficial (.xlsx)"
              />

              <ExpandableButton
                onClick={handleExportExcel}
                variant="green"
                icon={<FileSpreadsheet className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
                label="Exportar Excel"
                title="Exportar Actividades a Excel (.xlsx)"
              />

              <ExpandableButton
                onClick={() => openCreateModal()}
                variant="emerald"
                icon={<Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
                label="Nueva Actividad"
                title="Nueva Actividad"
              />
            </>
          }
        />
      </div>

      {/* Compliance Dashboard Panel */}
      {showDashboard && (
        <div className="px-6 pt-4 pb-2 transform transition-all duration-300 ease-in-out origin-top">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
            
            {/* Card 1: General Compliance Donut Chart */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex items-center gap-5 shadow-sm relative overflow-hidden group">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    className="stroke-gray-100 dark:stroke-gray-800" 
                    strokeWidth="8" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    stroke="url(#complianceGrad)"
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 38} 
                    strokeDashoffset={2 * Math.PI * 38 * (1 - complianceRate / 100)} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-text-primary">{complianceRate}%</span>
                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider">Logrado</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase">Cumplimiento General</h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  Se han completado <strong className="text-teal-600 dark:text-teal-400 font-bold">{doneCount}</strong> de <strong className="text-text-primary font-bold">{totalCount}</strong> actividades totales.
                </p>
                <div className="mt-2.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    complianceRate >= 90 
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                      : complianceRate >= 70
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}>
                    {complianceRate >= 90 ? '¡Excelente Trabajo!' : complianceRate >= 70 ? 'Buen Progreso' : 'Atención Requerida'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Status Distribution Stacked Bar */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-teal-500" />
                  Distribución de Estados
                </h4>
                <p className="text-[10px] text-text-tertiary mt-0.5">Representación de la carga de trabajo por estado.</p>
              </div>

              {/* Stacked Progress Bar */}
              <div className="mt-3.5 h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex gap-[2px]">
                {doneCount > 0 && (
                  <div 
                    style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    className="h-full bg-green-500 transition-all duration-500"
                    title={`Completadas: ${doneCount}`}
                  />
                )}
                {dueSoonCount > 0 && (
                  <div 
                    style={{ width: `${(dueSoonCount / totalCount) * 100}%` }}
                    className="h-full bg-amber-500 transition-all duration-500 animate-pulse"
                    title={`Próximas a vencer: ${dueSoonCount}`}
                  />
                )}
                {overdueCount > 0 && (
                  <div 
                    style={{ width: `${(overdueCount / totalCount) * 100}%` }}
                    className="h-full bg-rose-500 transition-all duration-500"
                    title={`Vencidas (Alerta): ${overdueCount}`}
                  />
                )}
                {todoTasks.length > 0 && (
                  <div 
                    style={{ width: `${(todoTasks.length / totalCount) * 100}%` }}
                    className="h-full bg-gray-400 dark:bg-gray-600 transition-all duration-500"
                    title={`Pendientes: ${todoTasks.length}`}
                  />
                )}
                {totalCount === 0 && (
                  <div className="h-full w-full bg-gray-200 dark:bg-gray-800 transition-all duration-500" />
                )}
              </div>

              {/* Legend with percentages */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="truncate">Hechas: {donePct}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />
                  <span className="truncate">Pendientes: {todoPct}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="truncate">Próximas: {dueSoonPct}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="truncate">Vencidas: {overduePct}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Category Compliance Breakdown */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex flex-col justify-between shadow-sm min-h-[120px]">
              <div>
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase">Cumplimiento por Categoría</h4>
                <p className="text-[10px] text-text-tertiary mt-0.5">Rendimiento por tipo de control.</p>
              </div>
              
              <div className="mt-3.5 flex flex-col gap-2.5 max-h-[96px] overflow-y-auto pr-1">
                {categoryStats.length === 0 ? (
                  <div className="text-[11px] text-text-tertiary italic text-center py-2">
                    Sin actividades activas
                  </div>
                ) : (
                  categoryStats.slice(0, 3).map(cat => (
                    <div key={cat.type} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-text-primary truncate">{cat.label}</span>
                        <span className={`${cat.color}`}>{cat.completed}/{cat.total} ({cat.rate}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${cat.rate}%` }}
                          className={`h-full ${cat.bg} transition-all duration-500 rounded-full`}
                        />
                      </div>
                    </div>
                  ))
                )}
                {categoryStats.length > 3 && (
                  <div className="text-[9px] text-text-tertiary font-bold text-right">
                    + {categoryStats.length - 3} categorías más
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pt-4 pb-2">
        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Tareas</div>
            <div className="text-lg font-extrabold text-text-primary">{totalCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Vencidas</div>
            <div className="text-lg font-extrabold text-rose-500">{overdueCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Próximas</div>
            <div className="text-lg font-extrabold text-amber-500">{dueSoonCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Completadas</div>
            <div className="text-lg font-extrabold text-green-600 dark:text-green-400">{doneCount}</div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs (4 Vistas Dinámicas estilo Notion + Estética WAPPY) */}
      <div className="px-6 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border-medium/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <button
            type="button"
            onClick={() => handleTabChange('calendar')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 border transition-all duration-300 sm:hover:-rotate-2 sm:hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-teal-500/15 border-teal-500/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30 shadow-xs'
                : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary hover:bg-teal-500/10 hover:border-teal-500/30'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
            <span>Calendario SST</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              Comité
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('kanban')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 border transition-all duration-300 sm:hover:-rotate-2 sm:hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'kanban'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/30 shadow-xs'
                : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary hover:bg-cyan-500/10 hover:border-cyan-500/30'
            }`}
          >
            <Trello className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Tablero Kanban</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
              4 etapas
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('table')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 border transition-all duration-300 sm:hover:-rotate-2 sm:hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'table'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-xs'
                : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary hover:bg-purple-500/10 hover:border-purple-500/30'
            }`}
          >
            <Table2 className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Tabla Dinámica</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300">
              Base Datos
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('timeline')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 border transition-all duration-300 sm:hover:-rotate-2 sm:hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 shadow-xs'
                : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary hover:bg-amber-500/10 hover:border-amber-500/30'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Cronograma Gantt</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              Gerencia
            </span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-text-tertiary hidden xl:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronización multi-vista en tiempo real</span>
        </div>
      </div>

      {/* Barra Compacta de Búsqueda y Filtros Rápidos estilo Notion (Unificada para las 4 vistas) */}
      <div className="px-6 py-2.5 bg-surface-primary/70 dark:bg-gray-900/60 backdrop-blur-sm border-b border-border-medium/30 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Buscador rápido */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar actividad, responsable, módulo..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-gray-950 border border-border-medium/40 focus:border-teal-500 focus:outline-none text-xs font-semibold text-text-primary placeholder:text-text-tertiary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-rose-500 cursor-pointer"
                title="Limpiar texto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider ml-1">
            <Filter className="w-3 h-3 text-teal-500" />
            Filtros:
          </span>

          {/* Filtro de Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all ${
              filterStatus !== 'all'
                ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-gray-950 border-border-medium/40 text-text-secondary'
            }`}
          >
            <option value="all">Estado: Todos</option>
            <option value="todo">📌 Pendientes</option>
            <option value="due_soon">⏳ Próximas a vencer</option>
            <option value="overdue">🚨 Vencidas (Alerta)</option>
            <option value="done">✅ Completadas</option>
          </select>

          {/* Filtro de Prioridad */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all ${
              filterPriority !== 'all'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-gray-950 border-border-medium/40 text-text-secondary'
            }`}
          >
            <option value="all">Prioridad: Todas</option>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>

          {/* Filtro de Tipo ACPM */}
          <select
            value={filterActionType}
            onChange={(e) => setFilterActionType(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all ${
              filterActionType !== 'all'
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-gray-950 border-border-medium/40 text-text-secondary'
            }`}
          >
            <option value="all">Tipo ACPM: Todos</option>
            <option value="correctiva">🔧 Correctiva</option>
            <option value="preventiva">🛡️ Preventiva</option>
            <option value="mejora">🚀 Mejora</option>
          </select>

          {/* Filtro de Categoría / Módulo */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all max-w-[190px] ${
              filterCategory !== 'all'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                : 'bg-white dark:bg-gray-950 border-border-medium/40 text-text-secondary'
            }`}
          >
            <option value="all">Módulo: Todos</option>
            {Object.entries(categoryInfo).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contador de filtradas y botón Limpiar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-[11px] font-extrabold">
            Mostrando {filteredTasks.length} de {totalCount}
          </span>

          {hasActiveFilters && (
            <ExpandableButton
              onClick={clearAllFilters}
              variant="danger"
              size="sm"
              icon={<X className="w-3.5 h-3.5" />}
              label="Limpiar filtros"
              title="Restablecer todos los filtros activos"
            />
          )}
        </div>
      </div>

      {/* Loading or 4 Dynamic Views */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary min-h-[400px]">
          <Clock className="w-8 h-8 animate-spin text-teal-500 mb-2" />
          <span>Cargando actividades del Centro de Control...</span>
        </div>
      ) : activeTab === 'calendar' ? (
        <KanbanCalendarView
          tasks={filteredTasks as any}
          onTasksChange={() => fetchTasks(true)}
          onOpenCreateModal={(date) => openCreateModal(date)}
          onOpenEditModal={(task) => openEditModal(task as any)}
          onDeleteTask={(id) => handleDeleteTask(id)}
          isLoading={isLoading}
        />
      ) : activeTab === 'table' ? (
        <KanbanTableView
          tasks={filteredTasks as any}
          onOpenEditModal={(task, tab) => openEditModal(task as any, tab)}
          onDeleteTask={(id) => handleDeleteTask(id)}
          onMarkComplete={(id) => handleMarkComplete(id)}
          onStatusChange={(id, status) => handleQuickStatusChange(id, status)}
          onPriorityChange={(id, priority) => handleQuickPriorityChange(id, priority)}
          onOpenCreateModal={(date) => openCreateModal(date)}
          categoryInfo={categoryInfo}
          formatDate={formatDate}
          getDaysDiffText={getDaysDiffText}
          renderTaskBadge={renderTaskBadge}
        />
      ) : activeTab === 'timeline' ? (
        <KanbanTimelineView
          tasks={filteredTasks as any}
          onOpenEditModal={(task, tab) => openEditModal(task as any, tab)}
          onOpenCreateModal={(date) => openCreateModal(date)}
          onMarkComplete={(id) => handleMarkComplete(id)}
          categoryInfo={categoryInfo}
          formatDate={formatDate}
          getDaysDiffText={getDaysDiffText}
        />
      ) : (
        /* Board columns container */
        <div data-tenshi-kanban="board" className={`overflow-x-auto p-6 flex gap-6 select-none ${
          inline ? "flex-1" : "h-[750px] min-h-[600px]"
        }`}>
          {/* Column template */}
          {[
            { id: 'todo', title: 'Pendientes', tasks: todoTasks, border: 'border-t-4 border-t-gray-400', headerBg: 'bg-gray-500/10 text-gray-700 dark:text-gray-300' },
            { id: 'due_soon', title: 'Próximas a Vencer', tasks: dueSoonTasks, border: 'border-t-4 border-t-amber-500', headerBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
            { id: 'overdue', title: 'Vencidas (Alerta)', tasks: overdueTasks, border: 'border-t-4 border-t-rose-500', headerBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
            { id: 'done', title: 'Completadas', tasks: doneTasks, border: 'border-t-4 border-t-green-500', headerBg: 'bg-green-500/10 text-green-700 dark:text-green-400' }
          ].map(col => (
            <div 
              key={col.id}
              data-tenshi-column={col.id}
              data-tenshi-column-title={col.title}
              data-tenshi-count={col.tasks.length}
              className={`flex-shrink-0 w-84 flex flex-col h-full bg-white/70 dark:bg-gray-900/70 border border-border-medium/35 rounded-2xl shadow-sm overflow-hidden ${col.border}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id as any)}
            >
              {/* Column Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-border-medium/30 bg-surface-primary dark:bg-gray-900/40">
                <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                  {col.title}
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${col.headerBg}`}>
                    {col.tasks.length}
                  </span>
                </h3>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[200px]">
                {col.tasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border-medium/20 rounded-2xl text-text-tertiary">
                    <Trello className="w-8 h-8 opacity-30 mb-2" />
                    <span className="text-[11px] font-semibold">Suelta o agrega actividades aquí</span>
                  </div>
                ) : (
                  col.tasks.map(task => {
                    const obsList = Array.isArray(task.observations) ? task.observations : [];
                    const reschedList = Array.isArray(task.rescheduleHistory)
                      ? task.rescheduleHistory
                      : [];
                    const hasClosure = Boolean(task.closureDetails?.howItWasClosed?.trim());
                    const latestObs = obsList.length > 0 ? obsList[obsList.length - 1] : null;

                    return (
                      <div
                        key={task._id}
                        data-tenshi-task={task._id}
                        data-tenshi-title={task.title}
                        data-tenshi-status={task.status}
                        data-tenshi-due={task.dueDate}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="p-3.5 bg-white dark:bg-gray-950 border border-border-medium/40 hover:border-teal-500/40 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group flex flex-col justify-between"
                      >
                        <div>
                          {/* Title & Quick Header Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              onClick={() => openEditModal(task, 'details')}
                              className="font-bold text-[13px] text-text-primary leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors cursor-pointer"
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                              <button
                                onClick={() => openEditModal(task, 'details')}
                                className="p-1 text-text-tertiary hover:text-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 rounded-lg transition-all cursor-pointer"
                                title="Editar detalles"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                                title="Eliminar actividad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Reference name & AssignedTo */}
                          <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
                            {task.referenceName ? (
                              <span className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold">
                                <span className="w-1.5 h-1.5 rounded-sm bg-teal-500" />
                                {task.referenceName}
                              </span>
                            ) : <span />}

                            {task.assignedTo && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-secondary">
                                <User className="w-2.5 h-2.5 text-teal-500" />
                                {task.assignedTo}
                              </span>
                            )}
                          </div>

                          {/* Badges de Seguimiento: Observaciones y Reprogramaciones */}
                          {(obsList.length > 0 || task.isRescheduled || reschedList.length > 0) && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              {obsList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(task, 'observations')}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
                                  title="Ver bitácora de observaciones"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span>{obsList.length} {obsList.length === 1 ? 'obs.' : 'obs.'}</span>
                                </button>
                              )}

                              {(task.isRescheduled || reschedList.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(task, 'reschedule')}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                                  title="Ver historial de reprogramaciones"
                                >
                                  <CalendarClock className="w-2.5 h-2.5" />
                                  <span>Reprogramada ({reschedList.length || 1})</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Caja Resumen de Cierre ACPM (si tiene detalles de cierre) */}
                          {hasClosure && (
                            <div
                              onClick={() => openEditModal(task, 'closure')}
                              className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1 cursor-pointer hover:bg-emerald-500/15 transition-all"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                                  <FileCheck2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  Cierre ACPM Documentado
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-200">
                                  {task.closureDetails?.effectiveness === 'en_seguimiento'
                                    ? 'En Seguimiento'
                                    : task.closureDetails?.effectiveness === 'pendiente_verificar'
                                      ? 'Por Verificar'
                                      : task.closureDetails?.effectiveness === 'no_eficaz'
                                        ? 'No Eficaz'
                                        : 'Eficaz ✓'}
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-900/90 dark:text-emerald-200/90 line-clamp-2 leading-snug">
                                {task.closureDetails?.howItWasClosed}
                              </p>
                              {task.closureDetails?.evidenceRef && (
                                <span className="text-[9px] font-bold text-emerald-700/80 dark:text-emerald-300/80 truncate">
                                  📎 Evidencia: {task.closureDetails.evidenceRef}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Preview sutil de última observación cuando aún no está cerrada */}
                          {!hasClosure && latestObs && (
                            <div
                              onClick={() => openEditModal(task, 'observations')}
                              className="mt-2 p-2 rounded-xl bg-surface-secondary/50 dark:bg-gray-900/80 border border-border-medium/30 text-[10px] text-text-secondary cursor-pointer hover:border-cyan-500/40 transition-all"
                            >
                              <div className="flex items-center justify-between text-[9px] font-bold text-text-tertiary mb-0.5">
                                <span className="text-cyan-600 dark:text-cyan-400">
                                  💬 {latestObs.author || 'Seguimiento'}
                                </span>
                                <span>{formatDate(latestObs.createdAt)}</span>
                              </div>
                              <p className="line-clamp-2 italic text-text-secondary">
                                &ldquo;{latestObs.text}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer: Date, State badges & 3-Button WAPPY Action Bar */}
                        <div className="mt-3 pt-3 border-t border-border-medium/20 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                              {formatDate(task.dueDate)}
                            </span>
                            
                            <span className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                              task.status === 'overdue' 
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' 
                                : task.status === 'due_soon' 
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                                  : task.status === 'done'
                                    ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                                    : 'bg-gray-50 text-gray-600 dark:bg-gray-800'
                            }`}>
                              {getDaysDiffText(task)}
                            </span>
                          </div>

                          {renderTaskBadge(task)}

                          {/* Group invitation or 3-Button WAPPY Quick Action Bar */}
                          {task.referenceName === 'group_invitation' && task.status !== 'done' ? (
                            <div className="mt-2.5 flex items-center gap-2 w-full">
                              <button
                                onClick={() => handleAcceptGroupInvite(task.referenceId || '')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleRejectGroupInvite(task.referenceId || '')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-150 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition-all border border-zinc-200 dark:border-zinc-700"
                              >
                                <X className="w-3.5 h-3.5" />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2 grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(task, 'observations')}
                                className="py-1.5 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all duration-200 sm:hover:scale-[1.03] active:scale-95 cursor-pointer"
                                title="Agregar observación o seguimiento"
                              >
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                <span className="truncate">Observación</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(task, 'reschedule')}
                                className="py-1.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all duration-200 sm:hover:scale-[1.03] active:scale-95 cursor-pointer"
                                title="Reprogramar fecha límite con justificación"
                              >
                                <CalendarClock className="w-3 h-3 shrink-0" />
                                <span className="truncate">Reprogramar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(task, 'closure')}
                                className="py-1.5 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all duration-200 sm:hover:scale-[1.03] active:scale-95 cursor-pointer"
                                title={
                                  task.status === 'done'
                                    ? 'Ver evidencia y eficacia del cierre'
                                    : 'Registrar cómo se cerró la actividad'
                                }
                              >
                                <FileCheck2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {task.status === 'done' ? 'Ver Cierre' : 'Cerrar ACPM'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Premium Lock Overlay for Free / non-Pro Plan */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4 sm:p-6 md:p-8">
          <UpgradeWall
            isPopup={true}
            title="Centro de Control ACPM Exclusivo"
            description="El acceso a la programación de actividades y control predictivo de vencimientos en el Centro de Control ACPM es exclusivo de los planes Wappy Pro. Evoluciona hoy tu plan para estar al día."
          />
        </div>
      )}

      {/* Modal 360° de Gestión de Actividad SG-SST (4 Pestañas Estilo WAPPY: Detalles, Observaciones, Reprogramar, Cierre ACPM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-3 sm:px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[90vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-border-medium/30 transform duration-300 animate-in zoom-in-95">
            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 border-b border-border-medium/30 flex items-start justify-between gap-3 bg-surface-secondary/20 dark:bg-zinc-950/40 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-text-primary flex items-center gap-2">
                    {editingTask ? (
                      <Pencil className="w-5 h-5 text-teal-500 shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-teal-500 shrink-0" />
                    )}
                    <span className="truncate">
                      {editingTask
                        ? 'Gestión Integral 360° de Actividad ACPM'
                        : 'Programar Nueva Actividad / Compromiso'}
                    </span>
                  </h2>
                  {editingTask && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                        editingTask.status === 'done'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : editingTask.status === 'overdue'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                            : editingTask.status === 'due_soon'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                      }`}
                    >
                      {getStatusLabel(editingTask.status)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {editingTask
                    ? editingTask.title
                    : 'Registra la actividad con fecha, horario y citación por correo electrónico.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary dark:hover:bg-zinc-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de 4 Pestañas 360° (Solo al gestionar una actividad existente) */}
            {editingTask && (
              <div className="px-4 sm:px-5 pt-2.5 pb-2 border-b border-border-medium/30 bg-surface-primary/80 dark:bg-gray-900/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setModalTab('details')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                    modalTab === 'details'
                      ? 'bg-teal-500/15 border-teal-500/50 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Hallazgo y Detalles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('observations')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                    modalTab === 'observations'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Observaciones</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-[10px] font-black">
                    {editingTask.observations?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('reschedule')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                    modalTab === 'reschedule'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reprogramar</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-[10px] font-black">
                    {editingTask.rescheduleHistory?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('closure')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                    modalTab === 'closure'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-medium/30 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cierre y Evidencia ACPM</span>
                  {editingTask.closureDetails?.howItWasClosed && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>
            )}

            {/* CONTENIDO PESTAÑA 1: HALLAZGO Y DETALLES (O CREACIÓN) */}
            {(!editingTask || modalTab === 'details') && (
              <>
                <form onSubmit={handleSaveTask} className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary">Título de la Actividad / Hallazgo *</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej: Inspección mensual de botiquines"
                      className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary">Descripción del Hallazgo y Alcance (Opcional)</label>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Detalles sobre el hallazgo identificado o la actividad a realizar..."
                      className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary min-h-[75px] max-h-[140px] w-full resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text-secondary">Fecha Límite *</label>
                        {editingTask && (
                          <button
                            type="button"
                            onClick={() => setModalTab('reschedule')}
                            className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <CalendarClock className="w-3 h-3" />
                            Reprogramar con bitácora
                          </button>
                        )}
                      </div>
                      <input 
                        type="date" 
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Categoría / Origen</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full cursor-pointer"
                      >
                        <option value="manual">General / Manual</option>
                        <option value="training">Capacitación</option>
                        <option value="medical_exam">Examen Médico</option>
                        <option value="copasst_finding">COPASST / Comité</option>
                        <option value="audit_finding">Auditoría / Hallazgo</option>
                        <option value="diagnostico_finding">Diagnóstico Inicial 0312</option>
                        <option value="unsafe_act_finding">Actos y Condiciones Inseguras</option>
                        <option value="ipevar_finding">Matriz IPEVR (GTC 45)</option>
                        <option value="atel_finding">Investigación ATEL</option>
                        <option value="pesv_inspection_finding">PESV / Vial</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Horario de Inicio y Fin */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Hora Inicio (Colombia)</label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Hora Fin (Colombia)</label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                      />
                    </div>
                  </div>

                  {/* Responsable y Ubicación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Responsable / Asignado a</label>
                      <input
                        type="text"
                        value={newAssignedTo}
                        onChange={(e) => setNewAssignedTo(e.target.value)}
                        placeholder="Ej: Coordinador SST / Juan Pérez"
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Ubicación / Enlace Meet</label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Ej: Sala de Juntas / Google Meet"
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full"
                      />
                    </div>
                  </div>

                  {/* Prioridad y Tipo de Acción */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Prioridad</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full cursor-pointer"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Tipo de Acción ACPM</label>
                      <select
                        value={newActionType}
                        onChange={(e) => setNewActionType(e.target.value as any)}
                        className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full cursor-pointer"
                      >
                        <option value="correctiva">Correctiva</option>
                        <option value="preventiva">Preventiva</option>
                        <option value="mejora">Mejora</option>
                      </select>
                    </div>
                  </div>

                  {/* Citación por Correo y Google Calendar */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-extrabold text-sky-900 dark:text-sky-300">
                        Destinatarios para Citación por Correo
                      </label>
                      <input
                        type="text"
                        value={newEmailAttendees}
                        onChange={(e) => setNewEmailAttendees(e.target.value)}
                        placeholder="correos separados por coma (ej: colab@empresa.com, gerente@...)"
                        className="px-3 py-2 bg-white dark:bg-gray-950 border border-sky-300 dark:border-sky-700/60 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-sky-900 dark:text-sky-300 select-none">
                      <input
                        type="checkbox"
                        checked={sendEmailOnSave}
                        onChange={(e) => setSendEmailOnSave(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-sky-400"
                      />
                      <span>Enviar citación por correo con archivo .ics al guardar</span>
                    </label>
                  </div>
                </form>

                {/* Action Buttons fijos abajo (Pestaña Detalles) */}
                <div className="p-4 border-t border-border-medium/30 bg-surface-secondary/20 dark:bg-zinc-950/40 flex items-center justify-between gap-3 shrink-0">
                  {editingTask ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleDeleteTask(editingTask._id);
                      }}
                      className="py-2.5 px-4 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      title="Eliminar esta actividad del tablero"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2.5 px-4 border border-border-medium text-text-secondary hover:bg-surface-hover rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="py-2.5 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? 'Guardando...' : editingTask ? 'Guardar Cambios' : 'Programar Actividad'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* CONTENIDO PESTAÑA 2: BITÁCORA DE OBSERVACIONES Y SEGUIMIENTO */}
            {editingTask && modalTab === 'observations' && (
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
                <form
                  onSubmit={handleAddObservation}
                  className="p-4 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-cyan-500" />
                      Registrar Nueva Observación o Avance de Gestión
                    </h3>
                    <span className="text-[10px] font-bold text-text-tertiary">
                      Trazabilidad PHVA
                    </span>
                  </div>

                  <textarea
                    value={newObsText}
                    onChange={(e) => setNewObsText(e.target.value)}
                    placeholder="Escribe el avance, gestión parcial, cotización, reunión de seguimiento o novedad sobre esta actividad..."
                    className="px-3.5 py-2.5 bg-white dark:bg-gray-950 border border-cyan-500/30 focus:border-cyan-500 rounded-xl text-xs text-text-primary min-h-[75px] focus:outline-none resize-y"
                    required
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <User className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <input
                        type="text"
                        value={newObsAuthor}
                        onChange={(e) => setNewObsAuthor(e.target.value)}
                        placeholder="Registrado por (Ej: Coordinador SST)"
                        className="px-3 py-1.5 bg-white dark:bg-gray-950 border border-border-medium/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-cyan-500 flex-1"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingObs}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingObs ? 'Registrando...' : 'Agregar Observación'}</span>
                    </button>
                  </div>
                </form>

                {/* Línea de tiempo de Observaciones */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-teal-500" />
                    Historial y Bitácora de la Actividad ({editingTask.observations?.length || 0})
                  </h4>

                  {!editingTask.observations || editingTask.observations.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-border-medium/40 text-center text-text-tertiary">
                      <MessageSquare className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-cyan-500" />
                      <p className="font-bold text-xs text-text-secondary">
                        Aún no hay observaciones registradas en esta actividad
                      </p>
                      <p className="text-[11px] mt-0.5">
                        Usa el formulario superior para dejar constancia de avances, gestiones o bloqueos.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {[...editingTask.observations].reverse().map((obs) => {
                        const isResch = obs.type === 'reschedule';
                        const isClos = obs.type === 'closure';
                        return (
                          <div
                            key={obs.id}
                            className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 ${
                              isClos
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : isResch
                                  ? 'bg-amber-500/5 border-amber-500/30'
                                  : 'bg-surface-secondary/30 dark:bg-gray-950 border-border-medium/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 font-extrabold text-xs text-text-primary">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isClos
                                      ? 'bg-emerald-500'
                                      : isResch
                                        ? 'bg-amber-500'
                                        : 'bg-cyan-500'
                                  }`}
                                />
                                {obs.author || 'Coordinador SST'}
                              </span>
                              <span className="text-[10px] font-bold text-text-tertiary">
                                {formatDate(obs.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {obs.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA 3: REPROGRAMAR FECHA LÍMITE CON JUSTIFICACIÓN */}
            {editingTask && modalTab === 'reschedule' && (
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-secondary/40 dark:bg-gray-950 border border-border-medium/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      Fecha Límite Vigente
                    </span>
                    <div className="text-sm font-black text-text-primary flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {formatDate(editingTask.dueDate)} ({getDaysDiffText(editingTask)})
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                    {editingTask.rescheduleHistory?.length || 0} reprogramaciones
                  </span>
                </div>

                <form
                  onSubmit={handleApplyReschedule}
                  className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 flex flex-col gap-3.5"
                >
                  <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-amber-500" />
                    Solicitar / Aplicar Nueva Fecha de Compromiso
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary">
                        Nueva Fecha Programada *
                      </label>
                      <input
                        type="date"
                        value={rescheduleNewDate}
                        onChange={(e) => setRescheduleNewDate(e.target.value)}
                        className="px-3.5 py-2 bg-white dark:bg-gray-950 border border-amber-500/40 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary">
                        Autorizado / Reprogramado por
                      </label>
                      <input
                        type="text"
                        value={rescheduleAuthor}
                        onChange={(e) => setRescheduleAuthor(e.target.value)}
                        placeholder="Ej: Coordinador SST / Gerencia"
                        className="px-3.5 py-2 bg-white dark:bg-gray-950 border border-border-medium/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">
                      Motivo / Justificación de la Reprogramación *
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Ej: Espera de llegada de repuestos/guardas por proveedor externo; se reprograma con autorización del COPASST..."
                      className="px-3.5 py-2.5 bg-white dark:bg-gray-950 border border-amber-500/30 rounded-xl text-xs text-text-primary min-h-[70px] focus:outline-none focus:border-amber-500 resize-y"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReschedule}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>
                        {isSubmittingReschedule ? 'Reprogramando...' : 'Aplicar Reprogramación'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Historial de Reprogramaciones */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-500" />
                    Historial de Cambios de Fecha ({editingTask.rescheduleHistory?.length || 0})
                  </h4>

                  {!editingTask.rescheduleHistory || editingTask.rescheduleHistory.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-border-medium/40 text-center text-text-tertiary">
                      <p className="font-bold text-xs text-text-secondary">
                        Esta actividad mantiene su fecha original sin reprogramaciones
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {[...editingTask.rescheduleHistory].reverse().map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-extrabold text-xs text-amber-800 dark:text-amber-300">
                              📅 {formatDate(item.previousDate)} ➔ {formatDate(item.newDate)}
                            </span>
                            <span className="text-[10px] font-bold text-text-tertiary">
                              Por {item.changedBy} · {formatDate(item.changedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            <strong>Motivo:</strong> {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA 4: CIERRE Y EVIDENCIA ACPM (ESTÁNDAR 7.1.1) */}
            {editingTask && modalTab === 'closure' && (
              <form
                onSubmit={handleRegisterClosure}
                className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs"
              >
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      Acta de Cierre y Verificación de Eficacia ACPM (Dec. 1072 Art. 2.2.4.6.33 · Est. 7.1.1)
                    </h3>
                    <p className="text-[11px] text-emerald-700/85 dark:text-emerald-300/85 mt-0.5 leading-snug">
                      Documenta cómo se ejecutó o cerró la actividad, qué soporte o evidencia respalda el cierre y califica la eficacia del control implementado.
                    </p>
                  </div>
                </div>

                {/* Si es tarea automática (Exámenes, SOAT, RTM, Capacitación), mostrar también la fecha de renovación */}
                {editingTask.type !== 'manual' && (
                  <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/30 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-teal-800 dark:text-teal-300">
                          {getRenewalDetails(editingTask).title}
                        </h4>
                        <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80">
                          {getRenewalDetails(editingTask).helper}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary">
                        {getRenewalDetails(editingTask).label}
                      </label>
                      <input
                        type="date"
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        className="px-3.5 py-2 bg-white dark:bg-gray-950 border border-teal-500/40 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-text-primary">
                    ¿Cómo se cerró la actividad? (Acción ejecutada / Control implementado) *
                  </label>
                  <textarea
                    value={closureHow}
                    onChange={(e) => setClosureHow(e.target.value)}
                    placeholder="Ej: Se instalaron las guardas físicas en las 3 máquinas críticas, se demarcó el área y se realizó capacitación práctica con los operarios del turno..."
                    className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-emerald-500/40 focus:border-emerald-500 rounded-xl text-xs text-text-primary min-h-[90px] focus:outline-none resize-y"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Evidencia / Soporte Documental (Opcional)
                  </label>
                  <input
                    type="text"
                    value={closureEvidence}
                    onChange={(e) => setClosureEvidence(e.target.value)}
                    placeholder="Ej: Acta de inspección #18, Registro de asistencia firmado, Factura #4092 o link de Drive"
                    className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 focus:border-emerald-500 rounded-xl text-xs text-text-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">
                      Evaluación de Eficacia
                    </label>
                    <select
                      value={closureEffectiveness}
                      onChange={(e) => setClosureEffectiveness(e.target.value as any)}
                      className="px-3 py-2 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="eficaz">✅ Verificada y Eficaz</option>
                      <option value="en_seguimiento">🔍 En Seguimiento Operativo</option>
                      <option value="pendiente_verificar">⏳ Pendiente Verificar Eficacia</option>
                      <option value="no_eficaz">⚠️ No Eficaz (Requiere Nueva Acción)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">
                      Cerrado / Verificado por
                    </label>
                    <input
                      type="text"
                      value={closureAuthor}
                      onChange={(e) => setClosureAuthor(e.target.value)}
                      placeholder="Ej: Coordinador SST"
                      className="px-3 py-2 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">
                      Fecha Real de Cierre
                    </label>
                    <input
                      type="date"
                      value={closureDate}
                      onChange={(e) => setClosureDate(e.target.value)}
                      className="px-3 py-2 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border-medium/30 flex items-center justify-end gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 border border-border-medium text-text-secondary hover:bg-surface-hover rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClosure}
                    className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/15 hover:brightness-105 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmittingClosure
                        ? 'Registrando Cierre...'
                        : 'Registrar Cierre y Marcar Completada'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Excel Import Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-medium/30 transform duration-300 animate-in zoom-in-95">
            <div className="p-6 border-b border-border-medium/30 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  Confirmar Importación de Actividades
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Revisa las actividades detectadas en el archivo Excel antes de guardarlas.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full text-xs font-bold shrink-0">
                {importPreview.length} {importPreview.length === 1 ? 'Actividad' : 'Actividades'}
              </span>
            </div>

            <div className="p-6 max-h-[350px] overflow-y-auto flex flex-col gap-4">
              {importPreview.map((task, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-[13px] text-text-primary leading-tight">
                      {task.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                      task.status === 'done' 
                        ? 'bg-green-50 text-green-600 dark:bg-green-950/20' 
                        : task.status === 'overdue'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          : 'bg-gray-50 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-text-secondary line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-text-tertiary font-bold mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                      {formatDate(task.dueDate)}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded-full bg-surface-tertiary font-semibold">
                      {categoryInfo[task.type]?.label || task.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-border-medium/30 flex gap-3 bg-surface-primary dark:bg-gray-900/40">
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                disabled={isImporting}
                className="flex-1 py-2.5 border border-border-medium text-text-secondary hover:bg-surface-hover rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isImporting ? 'Importando...' : 'Confirmar e Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI File Import Confirmation Modal */}
      {isConfirmAiModalOpen && pendingFileData && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border-medium/30 transform duration-300 animate-in zoom-in-95">
            <div className="p-6 border-b border-border-medium/30">
              <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                Procesar con IA
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                La Inteligencia Artificial extraerá automáticamente las actividades del documento.
              </p>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {pendingFileData.name.split('.').pop() || 'FILE'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-text-primary truncate">
                    {pendingFileData.name}
                  </h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Listo para ser analizado
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/20 dark:bg-gray-950 p-4 border border-border-medium/10 rounded-2xl">
                <strong>¿Cómo funciona?</strong> La IA leerá los textos, cronogramas o planes de acción que se encuentren en el documento para crear tarjetas en tu tablero con sus títulos, descripciones y fechas límites recomendadas.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-border-medium/30 flex gap-3 bg-surface-primary dark:bg-gray-900/40">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmAiModalOpen(false);
                  setPendingFileData(null);
                }}
                className="flex-1 py-2.5 border border-border-medium text-text-secondary hover:bg-surface-hover rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAiImport}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                Comenzar Análisis IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Parsing Loading Screen Overlay */}
      {isAiLoading && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm shadow-2xl border border-border-medium/30 text-center animate-in zoom-in-95">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
              <Upload className="w-7 h-7 text-emerald-500 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-text-primary">
                La Inteligencia Artificial está analizando tu archivo...
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Esto puede tomar unos segundos mientras extraemos y organizamos las actividades del documento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Homologador Universal de Casillas (Paralelo de Excel) */}
      <UniversalColumnMapperModal
        isOpen={isColumnMapperOpen}
        onClose={() => {
          setIsColumnMapperOpen(false);
          setColumnMapperBuffer(null);
        }}
        moduleKey="kanban-acpm"
        moduleTitle="Tablero Kanban ACPM"
        targetFields={KANBAN_ACPM_FIELDS}
        fileData={columnMapperBuffer}
        onConfirmImport={handleConfirmColumnMapping}
      />
    </div>
  );
}
