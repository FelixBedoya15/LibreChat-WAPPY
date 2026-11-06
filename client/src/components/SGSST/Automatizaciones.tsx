import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Play, 
  Square,
  Trash2, 
  Edit3, 
  Plus, 
  Cpu, 
  Clock, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
  Bot,
  Eye,
  EyeOff,
  BarChart2,
  AlertTriangle,
  Workflow,
  Zap,
  Globe,
  Layers,
  ArrowRight,
  Download,
  ShieldCheck,
  Copy,
  Wand2
} from 'lucide-react';
import { useListAgentsQuery } from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import ExpandableButton from '~/components/Common/ExpandableButton';
import {
  PRESET_CATEGORIES,
  TRIGGER_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  getNodeDefById,
  buildPromptFromWorkflowNodes,
  type WorkflowNodesConfig,
} from './workflowNodesCatalog';
import WappyWorkflowCanvas, { renderOfficialNodeSvg } from './WappyWorkflowCanvas';

interface ScheduleConfig {
  hour: number;
  minute: number;
  dayOfWeek?: number | number[];
  dayOfMonth?: number;
  intervalHours?: number;
}

interface Automation {
  _id: string;
  name: string;
  agentId: string;
  agentName: string;
  prompt: string;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'hourly';
  scheduleConfig: ScheduleConfig;
  emails: string[];
  status: 'active' | 'inactive' | 'paused_error';
  isSystemPreset?: boolean;
  presetKey?: string;
  presetCategory?: string;
  presetDescription?: string;
  workflowNodes?: WorkflowNodesConfig;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running' | 'stopped';
  lastRunResult?: string;
  nextRunAt?: string;
  conversationId?: string;
  createdAt: string;
}

interface AutomationLog {
  _id: string;
  automation: string;
  agentName: string;
  prompt: string;
  runAt: string;
  status: 'running' | 'success' | 'failed';
  result?: string;
  error?: string;
  conversationId?: string;
}

interface AutomatizacionesProps {
  hideMainHeader?: boolean;
  defaultTab?: 'list' | 'presets' | 'logs';
}

export default function Automatizaciones({ hideMainHeader = false, defaultTab = 'list' }: AutomatizacionesProps = {}) {
  const { showToast } = useToastContext();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';
  const { data: agentsData } = useListAgentsQuery({ requiredPermission: 1, limit: 100 });
  const agents = agentsData?.data || [];

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [presets, setPresets] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'presets' | 'logs'>(defaultTab);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('all');
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Plan & Limit State
  const [automationLimit, setAutomationLimit] = useState<number>(0);
  const [userPlanName, setUserPlanName] = useState<string>('free');
  const [upgradeAlert, setUpgradeAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    actionUrl: string;
    badge: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionText: '',
    actionUrl: '',
    badge: ''
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [isPresetModalMode, setIsPresetModalMode] = useState(false);
  const [viewResultModal, setViewResultModal] = useState<{
    title: string;
    agentName: string;
    date?: string;
    content: string;
    conversationId?: string;
  } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formScheduleType, setFormScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'hourly'>('daily');
  const [formHour, setFormHour] = useState(8);
  const [formMinute, setFormMinute] = useState(0);
  const [formDayOfWeek, setFormDayOfWeek] = useState(1); // Lunes
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1]); // Selección múltiple de días
  const [formDayOfMonth, setFormDayOfMonth] = useState(1);
  const [formIntervalHours, setFormIntervalHours] = useState(1);
  const [formEmailsStr, setFormEmailsStr] = useState('');
  const [formPresetCategory, setFormPresetCategory] = useState('salud_vencimientos');
  const [formPresetDescription, setFormPresetDescription] = useState('');
  const [formSaveAsSystemPreset, setFormSaveAsSystemPreset] = useState(false);
  const [formWorkflowNodes, setFormWorkflowNodes] = useState<WorkflowNodesConfig>({
    trigger: 'schedule_cron',
    inputs: ['somos_sst_empresa'],
    hitos: ['hito1_diagnostico_0312'],
    outputs: ['email_report'],
  });
  const [activeNodeBuilderTab, setActiveNodeBuilderTab] = useState<'trigger' | 'inputs' | 'hitos' | 'outputs'>('inputs');

  // Dropdown open states
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isFreqOpen, setIsFreqOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsAgentOpen(false);
      setIsFreqOpen(false);
      setIsDayOpen(false);
    };
    if (isAgentOpen || isFreqOpen || isDayOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isAgentOpen, isFreqOpen, isDayOpen]);

  // Fetch all automations
  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sgsst/automatizaciones');
      setAutomations(res.data || []);
    } catch (err: any) {
      showToast({
        message: 'Error al cargar las automatizaciones.',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch system preset workflows
  const fetchPresets = useCallback(async () => {
    setPresetsLoading(true);
    try {
      const res = await axios.get('/api/sgsst/automatizaciones/presets');
      setPresets(res.data || []);
    } catch (err: any) {
      showToast({
        message: 'Error al cargar el catálogo de tareas preestablecidas.',
        status: 'error'
      });
    } finally {
      setPresetsLoading(false);
    }
  }, [showToast]);

  // Fetch execution logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get('/api/sgsst/automatizaciones/logs');
      setLogs(res.data || []);
    } catch (err: any) {
      showToast({
        message: 'Error al cargar el historial de ejecuciones.',
        status: 'error'
      });
    } finally {
      setLogsLoading(false);
    }
  }, [showToast]);

  // Fetch user plan and automation limits
  const loadPlanLimit = useCallback(async () => {
    try {
      const res = await axios.get('/api/wompi/plan');
      if (res.data) {
        if (typeof res.data.automationLimit === 'number') {
          setAutomationLimit(res.data.automationLimit);
        }
        if (res.data.plan) {
          setUserPlanName(res.data.plan);
        }
      }
    } catch (err) {
      console.error('Error loading plan limit:', err);
    }
  }, []);

  const effectiveLimit = useMemo(() => {
    if (['admin', 'custom'].includes(userPlanName)) return 999;
    if (userPlanName === 'pro') return automationLimit > 0 ? automationLimit : 1;
    return automationLimit;
  }, [userPlanName, automationLimit]);

  const activeAutomationsCount = useMemo(() => {
    return automations.filter(a => a.status === 'active').length;
  }, [automations]);

  useEffect(() => {
    fetchAutomations();
    fetchPresets();
    loadPlanLimit();
  }, [fetchAutomations, fetchPresets, loadPlanLimit]);

  // Refresco silencioso en tiempo real cuando Tenshi o un agente crea/activa/desactiva/edita/elimina tareas
  useEffect(() => {
    const handleSilentReload = async () => {
      try {
        const res = await axios.get('/api/sgsst/automatizaciones');
        setAutomations(res.data || []);
        if (activeTab === 'logs') {
          const logsRes = await axios.get('/api/sgsst/automatizaciones/logs');
          setLogs(logsRes.data || []);
        } else if (activeTab === 'presets') {
          const presetsRes = await axios.get('/api/sgsst/automatizaciones/presets');
          setPresets(presetsRes.data || []);
        }
      } catch (_) {}
    };
    window.addEventListener('wappy-reload-sgsst-data', handleSilentReload);
    window.addEventListener('wappy-empresa-cambiada', handleSilentReload);
    window.addEventListener('wappy-automatizaciones-updated', handleSilentReload);
    return () => {
      window.removeEventListener('wappy-reload-sgsst-data', handleSilentReload);
      window.removeEventListener('wappy-empresa-cambiada', handleSilentReload);
      window.removeEventListener('wappy-automatizaciones-updated', handleSilentReload);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'presets') {
      fetchPresets();
    }
  }, [activeTab, fetchLogs, fetchPresets]);

  // Auto-polling cuando hay tareas en estado 'running'
  useEffect(() => {
    const hasRunning = automations.some(a => a.lastRunStatus === 'running') || logs.some(l => l.status === 'running');
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      // No consultar el servidor si la pestaña del navegador no está visible
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const res = await axios.get('/api/sgsst/automatizaciones');
        setAutomations(res.data || []);
        if (activeTab === 'logs') {
          const logsRes = await axios.get('/api/sgsst/automatizaciones/logs');
          setLogs(logsRes.data || []);
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [automations, logs, activeTab]);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const totalCount = automations.length;
    const activeCount = automations.filter(a => a.status === 'active').length;
    const inactiveCount = automations.filter(a => a.status === 'inactive').length;
    const runningCount = automations.filter(a => a.lastRunStatus === 'running').length;
    const failedCount = automations.filter(a => a.lastRunStatus === 'failed').length;

    const totalRuns = logs.length;
    const successRuns = logs.filter(l => l.status === 'success').length;
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;

    const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
    const inactivePct = totalCount > 0 ? Math.round((inactiveCount / totalCount) * 100) : 0;
    const runningPct = totalCount > 0 ? Math.round((runningCount / totalCount) * 100) : 0;

    // Agent breakdown
    const agentExecutions: Record<string, number> = {};
    logs.forEach(log => {
      agentExecutions[log.agentName] = (agentExecutions[log.agentName] || 0) + 1;
    });
    const agentStats = Object.entries(agentExecutions)
      .map(([name, count]) => ({
        name,
        count,
        rate: totalRuns > 0 ? Math.round((count / totalRuns) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalCount,
      activeCount,
      inactiveCount,
      runningCount,
      failedCount,
      totalRuns,
      successRuns,
      successRate,
      activePct,
      inactivePct,
      runningPct,
      agentStats
    };
  }, [automations, logs]);

  const filteredPresets = useMemo(() => {
    if (selectedPresetCategory === 'all') return presets;
    return presets.filter((p) => (p.presetCategory || 'general') === selectedPresetCategory);
  }, [presets, selectedPresetCategory]);

  // Handle open modal for create
  const handleCreateOpen = () => {
    if (effectiveLimit <= 0) {
      setUpgradeAlert({
        isOpen: true,
        title: 'Función Exclusiva Plan Pro',
        message: 'Las tareas periódicas e informes autónomos de agentes son una función exclusiva del Plan Wappy Pro. Adquiere el plan Wappy Pro para activar automatizaciones 24/7 para tu empresa.',
        actionText: 'Ver Planes y Adquirir Wappy Pro',
        actionUrl: '/planes',
        badge: 'Exclusivo Plan Pro'
      });
      return;
    }

    if (activeAutomationsCount >= effectiveLimit) {
      setUpgradeAlert({
        isOpen: true,
        title: 'Límite de Automatizaciones Alcanzado',
        message: `Has alcanzado el límite de ${effectiveLimit} automatización(es) activa(s) de tu plan Wappy Pro. Puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes para ampliar la capacidad de tu empresa.`,
        actionText: 'Adquirir 5 Automatizaciones ($25.000 COP)',
        actionUrl: `https://wa.me/573102913651?text=${encodeURIComponent('Hola, tengo el Plan Wappy Pro y deseo adquirir el paquete de 5 automatizaciones adicionales por $25.000 COP/mes en mi cuenta.')}`,
        badge: 'Paquete Adicional (+5)'
      });
      return;
    }

    setIsPresetModalMode(false);
    setEditingAutomation(null);
    setFormName('');
    setFormAgentId(agents[0]?.id || '');
    setFormPrompt('');
    setFormScheduleType('daily');
    setFormHour(8);
    setFormMinute(0);
    setFormDayOfWeek(1);
    setFormDaysOfWeek([1]);
    setFormDayOfMonth(1);
    setFormIntervalHours(1);
    setFormEmailsStr(user?.email || '');
    setFormPresetCategory('salud_vencimientos');
    setFormPresetDescription('');
    setFormSaveAsSystemPreset(false);
    setFormWorkflowNodes({
      trigger: 'schedule_cron',
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      includeIfNode: true,
      inputs: ['somos_sst_empresa'],
      hitos: ['hito1_diagnostico_0312'],
      outputs: ['email_report'],
      canvasLayout: null,
    });
    setActiveNodeBuilderTab('inputs');
    setIsAgentOpen(false);
    setIsFreqOpen(false);
    setIsDayOpen(false);
    setIsModalOpen(true);
  };

  // Exclusivo ADMIN: abrir modal para crear una Tarea Preestablecida Global para todos los usuarios
  const handleCreatePresetOpen = () => {
    setIsPresetModalMode(true);
    setEditingAutomation(null);
    setFormName('');
    setFormAgentId(agents[0]?.id || '');
    setFormPrompt('');
    setFormScheduleType('daily');
    setFormHour(8);
    setFormMinute(0);
    setFormDayOfWeek(1);
    setFormDaysOfWeek([1]);
    setFormDayOfMonth(1);
    setFormIntervalHours(1);
    setFormEmailsStr('');
    setFormPresetCategory('salud_vencimientos');
    setFormPresetDescription('');
    setFormSaveAsSystemPreset(true);
    setFormWorkflowNodes({
      trigger: 'schedule_cron',
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      includeIfNode: true,
      inputs: ['google_drive', 'somos_sst_empresa'],
      hitos: ['hito2_perfil_socio'],
      outputs: ['somos_sst_update', 'email_report'],
      canvasLayout: null,
    });
    setActiveNodeBuilderTab('inputs');
    setIsAgentOpen(false);
    setIsFreqOpen(false);
    setIsDayOpen(false);
    setIsModalOpen(true);
  };

  // Handle open modal for edit (normal task or global preset)
  const handleEditOpen = (automation: Automation, isPreset = false) => {
    setIsPresetModalMode(isPreset);
    setEditingAutomation(automation);
    setFormName(automation.name);
    setFormAgentId(automation.agentId);
    setFormPrompt(automation.prompt);
    setFormScheduleType(automation.scheduleType);
    setFormHour(automation.scheduleConfig?.hour ?? 8);
    setFormMinute(automation.scheduleConfig?.minute ?? 0);
    
    const rawDay = automation.scheduleConfig?.dayOfWeek;
    if (Array.isArray(rawDay)) {
      setFormDaysOfWeek(rawDay.map(Number));
      setFormDayOfWeek(rawDay[0] ?? 1);
    } else if (typeof rawDay === 'number') {
      setFormDaysOfWeek([rawDay]);
      setFormDayOfWeek(rawDay);
    } else {
      setFormDaysOfWeek([1]);
      setFormDayOfWeek(1);
    }

    setFormDayOfMonth(automation.scheduleConfig?.dayOfMonth ?? 1);
    setFormIntervalHours(automation.scheduleConfig?.intervalHours ?? 1);
    setFormEmailsStr(automation.emails?.join(', ') || '');
    setFormPresetCategory(automation.presetCategory || 'salud_vencimientos');
    setFormPresetDescription(automation.presetDescription || '');
    setFormSaveAsSystemPreset(false);
    setFormWorkflowNodes({
      trigger: automation.workflowNodes?.trigger || 'schedule_cron',
      aiEngine: automation.workflowNodes?.aiEngine || 'wappy',
      aiModel: automation.workflowNodes?.aiModel || 'gemini-3.6-flash',
      memoryNode: automation.workflowNodes?.memoryNode || 'wappy_memory_company',
      includeIfNode: automation.workflowNodes?.includeIfNode !== false,
      inputs: Array.isArray(automation.workflowNodes?.inputs) ? automation.workflowNodes!.inputs : [],
      hitos: Array.isArray(automation.workflowNodes?.hitos) ? automation.workflowNodes!.hitos : [],
      outputs: Array.isArray(automation.workflowNodes?.outputs) ? automation.workflowNodes!.outputs : ['email_report'],
      canvasLayout: automation.workflowNodes?.canvasLayout || null,
    });
    setActiveNodeBuilderTab('inputs');
    setIsAgentOpen(false);
    setIsFreqOpen(false);
    setIsDayOpen(false);
    setIsModalOpen(true);
  };

  // Abrir una plantilla en el constructor visual para personalizarla antes de guardarla en la empresa
  const handleCustomizeFromPreset = (preset: Automation) => {
    setIsPresetModalMode(false);
    setEditingAutomation(null);
    setFormName(preset.name);
    const matchingAgent =
      agents.find((a) => a.id === preset.agentId) ||
      agents.find((a) => a.name?.toLowerCase() === preset.agentName?.toLowerCase()) ||
      agents[0];
    setFormAgentId(matchingAgent?.id || preset.agentId);
    setFormPrompt(preset.prompt);
    setFormScheduleType(preset.scheduleType || 'daily');
    setFormHour(preset.scheduleConfig?.hour ?? 8);
    setFormMinute(preset.scheduleConfig?.minute ?? 0);
    const rawDay = preset.scheduleConfig?.dayOfWeek;
    if (Array.isArray(rawDay)) {
      setFormDaysOfWeek(rawDay.map(Number));
      setFormDayOfWeek(rawDay[0] ?? 1);
    } else if (typeof rawDay === 'number') {
      setFormDaysOfWeek([rawDay]);
      setFormDayOfWeek(rawDay);
    } else {
      setFormDaysOfWeek([1]);
      setFormDayOfWeek(1);
    }
    setFormDayOfMonth(preset.scheduleConfig?.dayOfMonth ?? 1);
    setFormIntervalHours(preset.scheduleConfig?.intervalHours ?? 1);
    setFormEmailsStr(user?.email || '');
    setFormPresetCategory(preset.presetCategory || 'salud_vencimientos');
    setFormPresetDescription(preset.presetDescription || '');
    setFormSaveAsSystemPreset(false);
    setFormWorkflowNodes({
      trigger: preset.workflowNodes?.trigger || 'schedule_cron',
      aiEngine: preset.workflowNodes?.aiEngine || 'wappy',
      aiModel: preset.workflowNodes?.aiModel || 'gemini-3.6-flash',
      memoryNode: preset.workflowNodes?.memoryNode || 'wappy_memory_company',
      includeIfNode: preset.workflowNodes?.includeIfNode !== false,
      inputs: Array.isArray(preset.workflowNodes?.inputs) ? [...preset.workflowNodes!.inputs] : [],
      hitos: Array.isArray(preset.workflowNodes?.hitos) ? [...preset.workflowNodes!.hitos] : [],
      outputs: Array.isArray(preset.workflowNodes?.outputs) ? [...preset.workflowNodes!.outputs] : ['email_report'],
      canvasLayout: preset.workflowNodes?.canvasLayout || null,
    });
    setActiveNodeBuilderTab('inputs');
    setIsModalOpen(true);
  };

  // Instalar una tarea preestablecida directamente en la empresa activa
  const handleInstallPreset = async (preset: Automation) => {
    setActionLoadingId(preset._id);
    try {
      const res = await axios.post(`/api/sgsst/automatizaciones/presets/${preset._id}/install`, {
        activateImmediately: false,
      });
      showToast({
        message: res.data?.message || `Tarea "${preset.name}" agregada a Mis Tareas.`,
        status: 'success',
      });
      await fetchAutomations();
      setActiveTab('list');
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al instalar la tarea preestablecida.',
        status: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Eliminar una tarea preestablecida del catálogo global (solo ADMIN)
  const handleDeletePreset = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta tarea preestablecida del catálogo global de todos los usuarios?')) return;
    try {
      await axios.delete(`/api/sgsst/automatizaciones/presets/${id}`);
      showToast({
        message: 'Tarea preestablecida eliminada del catálogo global.',
        status: 'success',
      });
      fetchPresets();
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al eliminar la plantilla.',
        status: 'error',
      });
    }
  };

  // Alternar nodo en el constructor visual de flujo
  const toggleWorkflowNode = (group: 'trigger' | 'inputs' | 'hitos' | 'outputs', nodeId: string) => {
    setFormWorkflowNodes((prev) => {
      if (group === 'trigger') {
        return {
          ...prev,
          trigger: nodeId,
        };
      }
      const current = prev[group] || [];
      const exists = current.includes(nodeId);
      const next = exists ? current.filter((id) => id !== nodeId) : [...current, nodeId];
      return {
        ...prev,
        [group]: next,
      };
    });
  };

  // Autogenerar el prompt desde los nodos seleccionados en el lienzo
  const handleAutoBuildPrompt = () => {
    const selectedAgent = agents.find((a) => a.id === formAgentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Consultor SG-SST';
    const generated = buildPromptFromWorkflowNodes(
      formName.trim() || 'Flujo Automatizado SG-SST',
      agentName,
      formWorkflowNodes,
    );
    setFormPrompt(generated);
    showToast({
      message: 'Instrucción autónoma generada desde tu flujo de conectores WAPPY.',
      status: 'success',
    });
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAgentId || !formPrompt.trim()) {
      showToast({
        message: 'Por favor complete todos los campos obligatorios.',
        status: 'error'
      });
      return;
    }

    const selectedAgent = agents.find(a => a.id === formAgentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Agente';

    const emails = formEmailsStr
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');

    const scheduleConfig: ScheduleConfig = {
      hour: Number(formHour),
      minute: Number(formMinute),
      dayOfWeek: formDaysOfWeek,
      dayOfMonth: Number(formDayOfMonth),
      intervalHours: Number(formIntervalHours)
    };

    const payload = {
      name: formName.trim(),
      agentId: formAgentId,
      agentName,
      prompt: formPrompt.trim(),
      scheduleType: formScheduleType,
      scheduleConfig,
      emails,
      presetCategory: formPresetCategory,
      presetDescription: formPresetDescription.trim(),
      workflowNodes: formWorkflowNodes,
      saveAsSystemPreset: isAdmin && formSaveAsSystemPreset,
    };

    try {
      if (isPresetModalMode) {
        if (editingAutomation) {
          await axios.put(`/api/sgsst/automatizaciones/presets/${editingAutomation._id}`, payload);
          showToast({
            message: 'Tarea preestablecida global actualizada para todos los usuarios.',
            status: 'success',
          });
        } else {
          await axios.post('/api/sgsst/automatizaciones/presets', payload);
          showToast({
            message: 'Tarea preestablecida global publicada para todos los usuarios.',
            status: 'success',
          });
        }
        setIsModalOpen(false);
        fetchPresets();
        return;
      }

      if (editingAutomation) {
        await axios.put(`/api/sgsst/automatizaciones/${editingAutomation._id}`, payload);
        showToast({
          message: formSaveAsSystemPreset
            ? 'Tarea actualizada y publicada también en el catálogo global.'
            : 'Automatización actualizada con éxito.',
          status: 'success'
        });
      } else {
        await axios.post('/api/sgsst/automatizaciones', payload);
        showToast({
          message: formSaveAsSystemPreset
            ? 'Tarea creada en tu empresa y publicada para todos los usuarios.'
            : 'Automatización creada con éxito.',
          status: 'success'
        });
      }
      setIsModalOpen(false);
      fetchAutomations();
      if (formSaveAsSystemPreset) fetchPresets();
      if (activeTab === 'logs') fetchLogs();
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al guardar la automatización.',
        status: 'error'
      });
    }
  };

  // Delete automation
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta automatización? También se borrarán sus logs.')) return;
    try {
      await axios.delete(`/api/sgsst/automatizaciones/${id}`);
      showToast({
        message: 'Automatización eliminada correctamente.',
        status: 'success'
      });
      fetchAutomations();
      if (activeTab === 'logs') fetchLogs();
    } catch (err) {
      showToast({
        message: 'Error al eliminar la automatización.',
        status: 'error'
      });
    }
  };

  // Toggle status (active/inactive)
  const handleToggleStatus = async (automation: Automation) => {
    const newStatus = automation.status === 'active' ? 'inactive' : 'active';
    
    if (newStatus === 'active') {
      if (effectiveLimit <= 0) {
        setUpgradeAlert({
          isOpen: true,
          title: 'Función Exclusiva Plan Pro',
          message: 'Las tareas periódicas autónomas son exclusivas del Plan Wappy Pro. Adquiere Wappy Pro para activar esta tarea.',
          actionText: 'Ver Planes y Adquirir Wappy Pro',
          actionUrl: '/planes',
          badge: 'Exclusivo Plan Pro'
        });
        return;
      }
      if (activeAutomationsCount >= effectiveLimit) {
        setUpgradeAlert({
          isOpen: true,
          title: 'Límite de Automatizaciones Alcanzado',
          message: `No se puede activar: Ya tienes ${activeAutomationsCount} de ${effectiveLimit} automatización(es) activa(s). Puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes.`,
          actionText: 'Adquirir 5 Automatizaciones ($25.000 COP)',
          actionUrl: `https://wa.me/573102913651?text=${encodeURIComponent('Hola, tengo el Plan Wappy Pro y deseo adquirir el paquete de 5 automatizaciones adicionales por $25.000 COP/mes en mi cuenta.')}`,
          badge: 'Paquete Adicional (+5)'
        });
        return;
      }
    }

    try {
      await axios.put(`/api/sgsst/automatizaciones/${automation._id}`, { status: newStatus });
      showToast({
        message: `Automatización ${newStatus === 'active' ? 'activada' : 'desactivada'} correctamente.`,
        status: 'success'
      });
      fetchAutomations();
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al cambiar el estado de la automatización.',
        status: 'error'
      });
    }
  };

  // Trigger immediate run (Run Now)
  const handleRunNow = async (id: string) => {
    setActionLoadingId(id);
    try {
      await axios.post(`/api/sgsst/automatizaciones/${id}/run`);
      showToast({
        message: 'Ejecución autónoma iniciada en segundo plano.',
        status: 'success'
      });
      setTimeout(() => {
        fetchAutomations();
        if (activeTab === 'logs') fetchLogs();
      }, 3000);
    } catch (err) {
      showToast({
        message: 'Error al iniciar la ejecución manual.',
        status: 'error'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Trigger immediate stop (Stop Now in real time)
  const handleStop = async (id: string) => {
    setActionLoadingId(id);
    try {
      await axios.post(`/api/sgsst/automatizaciones/${id}/stop`);
      showToast({
        message: 'Detención solicitada. La automatización se ha detenido.',
        status: 'success'
      });
      fetchAutomations();
      if (activeTab === 'logs') fetchLogs();
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al detener la automatización.',
        status: 'error'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatScheduleText = (auto: Automation) => {
    const config = auto.scheduleConfig || {};
    const time = `${String(config.hour ?? 8).padStart(2, '0')}:${String(config.minute ?? 0).padStart(2, '0')}`;
    
    switch (auto.scheduleType) {
      case 'hourly':
        return `Cada ${config.intervalHours ?? 1} hora(s)`;
      case 'daily':
        return `Diario a las ${time}`;
      case 'weekly':
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOfWeekVal = config.dayOfWeek;
        if (Array.isArray(dayOfWeekVal)) {
          if (dayOfWeekVal.length === 7) {
            return `Todos los días a las ${time}`;
          }
          const sortedDays = [...dayOfWeekVal].sort((a, b) => {
            const valA = Number(a) === 0 ? 7 : Number(a);
            const valB = Number(b) === 0 ? 7 : Number(b);
            return valA - valB;
          });
          const dayStrings = sortedDays.map(d => days[Number(d)]);
          return `Semanal los ${dayStrings.join(', ')} a las ${time}`;
        }
        return `Semanal los ${days[config.dayOfWeek ?? 1]} a las ${time}`;
      case 'monthly':
        return `El día ${config.dayOfMonth ?? 1} de cada mes a las ${time}`;
      default:
        return 'No configurado';
    }
  };

  const renderWorkflowPipeline = (nodes?: WorkflowNodesConfig, agentLabel?: string) => {
    const safeNodes: WorkflowNodesConfig = {
      trigger: nodes?.trigger || 'schedule_cron',
      aiEngine: nodes?.aiEngine || 'wappy',
      aiModel: nodes?.aiModel || 'gemini-3.6-flash',
      memoryNode: nodes?.memoryNode || 'wappy_memory_company',
      includeIfNode: nodes?.includeIfNode !== false,
      inputs: Array.isArray(nodes?.inputs) ? nodes!.inputs : ['somos_sst_empresa'],
      hitos: Array.isArray(nodes?.hitos) ? nodes!.hitos : [],
      outputs: Array.isArray(nodes?.outputs) && nodes!.outputs.length > 0 ? nodes!.outputs : ['email_report'],
      canvasLayout: nodes?.canvasLayout || null,
    };

    return (
      <div className="mb-3.5">
        <WappyWorkflowCanvas
          workflowNodes={safeNodes}
          agentName={agentLabel || 'Consultor SG-SST'}
          readOnly={true}
          compact={true}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-12">
      {/* Upper header - Estilo ACPM */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-4 ${hideMainHeader ? 'py-3.5 px-6' : ''}`}>
        {!hideMainHeader ? (
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
              <Cpu className="w-7 h-7 text-purple-500" />
              Tareas y Flujos Autónomos WAPPY
            </h1>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" />
              Vigilancia y Flujos Autónomos de Agentes IA
            </h2>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <ExpandableButton
            onClick={() => setActiveTab(activeTab === 'presets' ? 'list' : 'presets')}
            variant="teal"
            isActive={activeTab === 'presets'}
            icon={<Workflow className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
            label={`Flujos Preestablecidos (${presets.length})`}
          />

          {isAdmin && (
            <ExpandableButton
              onClick={handleCreatePresetOpen}
              variant="indigo"
              icon={<Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
              label="Crear Plantilla para Todos"
            />
          )}

          <ExpandableButton
            onClick={() => setShowDashboard(!showDashboard)}
            variant="purple"
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
            onClick={handleCreateOpen}
            variant="purple"
            icon={<Plus className="w-4 h-4 sm:w-5 sm:h-5 text-current" />}
            label="Nueva Tarea"
          />
        </div>
      </div>

      {/* Compliance Dashboard Panel - Estilo ACPM */}
      {showDashboard && (
        <div className="px-6 pt-4 pb-2 transform transition-all duration-300 ease-in-out origin-top">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
            
            {/* Card 1: General Success Donut Chart */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex items-center gap-5 shadow-sm relative overflow-hidden group">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#4f46e5" />
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
                    strokeDashoffset={2 * Math.PI * 38 * (1 - stats.successRate / 100)} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-text-primary">{stats.successRate}%</span>
                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider">Éxito</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase">Tasa de Ejecución</h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  Se han completado <strong className="text-purple-600 dark:text-purple-400 font-bold">{stats.successRuns}</strong> de <strong className="text-text-primary font-bold">{stats.totalRuns}</strong> corridas totales sin error.
                </p>
                <div className="mt-2.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    stats.successRate >= 90 
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                      : stats.successRate >= 70
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}>
                    {stats.successRate >= 90 ? 'Sistema Estable' : stats.successRate >= 70 ? 'Revisión Necesaria' : 'Fallas Frecuentes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Status Distribution Stacked Bar */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-purple-500" />
                  Distribución de Estados
                </h4>
                <p className="text-[10px] text-text-tertiary mt-0.5">Representación del estado actual de las automatizaciones.</p>
              </div>

              {/* Stacked Progress Bar */}
              <div className="mt-3.5 h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex gap-[2px]">
                {stats.activeCount > 0 && (
                  <div 
                    style={{ width: `${stats.activePct}%` }}
                    className="h-full bg-green-500 transition-all duration-500"
                    title={`Activas: ${stats.activeCount}`}
                  />
                )}
                {stats.runningCount > 0 && (
                  <div 
                    style={{ width: `${stats.runningPct}%` }}
                    className="h-full bg-blue-500 transition-all duration-500 animate-pulse"
                    title={`Corriendo: ${stats.runningCount}`}
                  />
                )}
                {stats.inactiveCount > 0 && (
                  <div 
                    style={{ width: `${stats.inactivePct}%` }}
                    className="h-full bg-gray-400 dark:bg-gray-650 transition-all duration-500"
                    title={`Inactivas: ${stats.inactiveCount}`}
                  />
                )}
                {stats.totalCount === 0 && (
                  <div className="h-full w-full bg-gray-200 dark:bg-gray-800 transition-all duration-500" />
                )}
              </div>

              {/* Legend with percentages */}
              <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-3">
                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate">Activas: {stats.activePct}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">Corriendo: {stats.runningPct}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-650 shrink-0" />
                  <span className="truncate">Off: {stats.inactivePct}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Executions by Agent */}
            <div className="p-4 bg-surface-secondary/20 dark:bg-gray-950 border border-border-medium/20 rounded-2xl flex flex-col justify-between shadow-sm min-h-[120px]">
              <div>
                <h4 className="text-xs font-extrabold text-text-primary tracking-wide uppercase">Carga por Agente</h4>
                <p className="text-[10px] text-text-tertiary mt-0.5">Top agentes con más ejecuciones programadas.</p>
              </div>
              
              <div className="mt-3.5 flex flex-col gap-2.5 max-h-[96px] overflow-y-auto pr-1">
                {stats.agentStats.length === 0 ? (
                  <div className="text-[11px] text-text-tertiary italic text-center py-2">
                    Sin corridas históricas
                  </div>
                ) : (
                  stats.agentStats.map(agent => (
                    <div key={agent.name} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-text-primary truncate">{agent.name}</span>
                        <span className="text-purple-600 dark:text-purple-400">{agent.count} corridas ({agent.rate}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${agent.rate}%` }}
                          className="h-full bg-purple-500 transition-all duration-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Analytics Summary Banner - Estilo ACPM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pt-4 pb-2">
        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Tareas</div>
            <div className="text-lg font-extrabold text-text-primary">{stats.totalCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Activas</div>
            <div className="text-lg font-extrabold text-green-500">{stats.activeCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">En Proceso</div>
            <div className="text-lg font-extrabold text-blue-500">{stats.runningCount}</div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Fallidas (Último Run)</div>
            <div className="text-lg font-extrabold text-rose-500">{stats.failedCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center border-b border-gray-200 dark:border-gray-800 mx-6 mt-6 mb-4 gap-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'list'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Mis Tareas ({automations.length})
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'presets'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/40 dark:bg-teal-950/20 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-teal-600 dark:hover:text-teal-400'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Flujos Preestablecidos</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-extrabold">
            {presets.length || 12}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition duration-200 ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Historial de Ejecuciones
        </button>

        <button 
          onClick={activeTab === 'list' ? fetchAutomations : activeTab === 'presets' ? fetchPresets : fetchLogs}
          disabled={loading || logsLoading || presetsLoading}
          className="ml-auto p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || logsLoading || presetsLoading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="px-6">
        {activeTab === 'list' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando tareas...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm p-8">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-full text-purple-500 mb-4">
                <Cpu className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay tareas programadas en esta empresa</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
                Activa con 1 clic cualquiera de los <strong>Flujos Preestablecidos del Sistema</strong> o diseña tu propio flujo con conectores de Google, APIs, MCP y los 7 Hitos de Somos SST.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('presets')}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <Workflow className="w-4 h-4" />
                  Explorar Flujos Preestablecidos
                </button>
                <button
                  onClick={handleCreateOpen}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                >
                  Crear tarea desde cero
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {automations.map((auto) => (
                <div 
                  key={auto._id}
                  className="flex flex-col bg-white dark:bg-gray-900 border border-border-medium/30 hover:border-purple-300 dark:hover:border-purple-900/50 rounded-2xl shadow-sm transition-all duration-300 p-5 group relative"
                >
                  {/* Status Switch Indicator */}
                  <div className="absolute top-5 right-5 flex items-center gap-2">
                    {auto.status === 'paused_error' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 font-bold px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 uppercase tracking-wider" title="Pausada automáticamente por agotamiento de claves/modelos. Haga clic en el switch para reactivar.">
                        <AlertTriangle className="w-3 h-3 text-rose-500" /> Pausada por error
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleStatus(auto)}
                      className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                      title={auto.status === 'active' ? 'Desactivar' : auto.status === 'paused_error' ? 'Reactivar automatización' : 'Activar'}
                    >
                      {auto.status === 'active' ? (
                        <ToggleRight className="w-10 h-10 text-purple-600" />
                      ) : (
                        <ToggleLeft className={`w-10 h-10 ${auto.status === 'paused_error' ? 'text-rose-400' : 'text-gray-400'}`} />
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <div className="flex items-start gap-3 pr-12 mb-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl mt-0.5">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-purple-600 transition duration-200 text-sm">
                          {auto.name}
                        </h3>
                        {auto.presetKey && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            <Sparkles className="w-2.5 h-2.5" /> Flujo WAPPY
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                        Asignado a: {auto.agentName}
                      </p>
                    </div>
                  </div>

                  {/* Visual Workflow Pipeline */}
                  {renderWorkflowPipeline(auto.workflowNodes, auto.agentName)}

                  {/* Prompt Details */}
                  <div className="bg-surface-secondary/20 dark:bg-gray-800/40 rounded-xl p-3.5 mb-4 flex-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-wider">Instrucción / Prompt:</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic leading-relaxed">
                      "{auto.prompt}"
                    </p>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-3.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="truncate" title={formatScheduleText(auto)}>{formatScheduleText(auto)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="truncate" title={auto.nextRunAt ? `Próxima ejecución: ${new Date(auto.nextRunAt).toLocaleString()}` : 'Sin programación activa'}>
                        {auto.status === 'active' && auto.nextRunAt
                          ? `Próx: ${new Date(auto.nextRunAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : 'Inactiva'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="truncate" title={auto.emails?.join(', ') || 'Sin correos'}>
                        {auto.emails?.length > 0 ? `${auto.emails.length} correo(s)` : 'Sin correos'}
                      </span>
                    </div>
                  </div>

                  {/* Execution Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-3.5">
                    <div className="flex items-center gap-2">
                      {auto.lastRunStatus === 'running' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <Loader2 className="w-3 h-3 animate-spin" /> Corriendo
                        </span>
                      ) : auto.lastRunStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Exitoso
                        </span>
                      ) : auto.lastRunStatus === 'stopped' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Detenido
                        </span>
                      ) : auto.lastRunStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> Fallido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Sin ejecuciones
                        </span>
                      )}

                      {auto.lastRunAt && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(auto.lastRunAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {auto.lastRunResult && (
                        <button
                          type="button"
                          onClick={() => setViewResultModal({
                            title: auto.name,
                            agentName: auto.agentName,
                            date: auto.lastRunAt,
                            content: auto.lastRunResult || '',
                            conversationId: auto.conversationId
                          })}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold transition mr-1 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-lg"
                          title="Ver informe de la última ejecución"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Informe</span>
                        </button>
                      )}

                      {auto.conversationId && (
                        <a
                          href={`/c/${auto.conversationId}`}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold transition mr-2"
                          title="Ver chat del agente"
                        >
                          Ver chat <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {auto.lastRunStatus === 'running' ? (
                        <button
                          onClick={() => handleStop(auto._id)}
                          disabled={actionLoadingId === auto._id}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg transition"
                          title="Detener ejecución en caliente"
                        >
                          {actionLoadingId === auto._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Square className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRunNow(auto._id)}
                          disabled={actionLoadingId === auto._id}
                          className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-lg transition"
                          title="Ejecutar ahora"
                        >
                          {actionLoadingId === auto._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleEditOpen(auto)}
                        className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(auto._id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'presets' ? (
          /* System Presets (WAPPY Flows Catalog) Tab */
          <div>
            {/* Banner informativo */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-teal-900/90 via-slate-900 to-indigo-950 text-white border border-teal-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 shrink-0">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold tracking-tight text-white">
                      Catálogo Oficial de Tareas Preestablecidas & Flujos WAPPY
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-[#C7F303] text-[#0E1300]">
                      Disponible para todos los usuarios
                    </span>
                  </div>
                  <p className="text-xs text-teal-100/90 mt-1 max-w-3xl leading-relaxed">
                    Flujos autónomos preconfigurados que encadenan <strong>Google Workspace (Drive, Calendar, Gmail)</strong>, <strong>NotebookLM</strong>, <strong>Google Flow</strong>, <strong>Google Antigravity</strong>, <strong>OpenWeather / PubChem / MedlinePlus</strong>, <strong>Búsqueda Web Legal</strong> y los <strong>7 Hitos + 20 Aplicativos de Somos SST</strong>. Instálalos en 1 clic o personaliza sus nodos.
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={handleCreatePresetOpen}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-[#C7F303] hover:bg-[#b5dd02] text-[#0E1300] font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Tarea Preestablecida (Admin)
                </button>
              )}
            </div>

            {/* Filtro de categorías */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedPresetCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    selectedPresetCategory === cat.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-teal-400'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {presetsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando catálogo de flujos preestablecidos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {presets
                  .filter((p) => selectedPresetCategory === 'all' || p.presetCategory === selectedPresetCategory)
                  .map((preset) => {
                    const alreadyInstalled = automations.some(
                      (a) => (preset.presetKey && a.presetKey === preset.presetKey) || a.name === preset.name
                    );
                    const catObj = PRESET_CATEGORIES.find((c) => c.id === preset.presetCategory);
                    return (
                      <div
                        key={preset._id}
                        className="flex flex-col bg-white dark:bg-gray-900 border border-border-medium/30 hover:border-teal-400 dark:hover:border-teal-700 rounded-2xl shadow-sm transition-all duration-300 p-5 relative"
                      >
                        {/* Top category badge & admin actions */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            <span>{catObj?.icon || '⚡'}</span>
                            <span>{catObj?.label || 'Flujo Oficial SG-SST'}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {alreadyInstalled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3" /> En Mis Tareas
                              </span>
                            )}
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditOpen(preset, true)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                                  title="Editar plantilla global (Admin)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePreset(preset._id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition"
                                  title="Eliminar plantilla global (Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title & Agent */}
                        <div className="flex items-start gap-3 mb-2.5">
                          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl mt-0.5 shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm leading-snug">
                              {preset.name}
                            </h3>
                            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                              Agente Especialista: {preset.agentName} • {formatScheduleText(preset)}
                            </p>
                          </div>
                        </div>

                        {preset.presetDescription && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                            {preset.presetDescription}
                          </p>
                        )}

                        {/* Visual Workflow Pipeline */}
                        {renderWorkflowPipeline(preset.workflowNodes, preset.agentName)}

                        {/* Prompt preview */}
                        <div className="bg-surface-secondary/20 dark:bg-gray-800/40 rounded-xl p-3 mb-4 flex-1">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-wider">
                            Prompt Autónomo Preconfigurado:
                          </p>
                          <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-3 italic leading-relaxed">
                            "{preset.prompt}"
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleCustomizeFromPreset(preset)}
                            className="px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Workflow className="w-3.5 h-3.5" />
                            Personalizar Nodos
                          </button>

                          <button
                            type="button"
                            disabled={actionLoadingId === preset._id}
                            onClick={() => handleInstallPreset(preset)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoadingId === preset._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{alreadyInstalled ? 'Agregar Copia a Mis Tareas' : 'Usar en mi Empresa'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          /* Logs History Tab */
          logsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando historial...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay historial de ejecución</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Aquí aparecerán los resultados de las ejecuciones automáticas tan pronto como comiencen a correr.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-border-medium/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha y Hora</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agente</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instrucción</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resumen / Detalle</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition">
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(log.runAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">
                          {log.agentName}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs" title={log.prompt}>
                          {log.prompt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.status === 'running' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <Loader2 className="w-3 h-3 animate-spin" /> Corriendo
                            </span>
                          ) : log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3" /> Completado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <XCircle className="w-3 h-3" /> Fallido
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300 max-w-sm">
                          {log.status === 'success' ? (
                            <div>
                              <p className="line-clamp-2 italic leading-relaxed text-gray-800 dark:text-gray-200">
                                "{log.result}"
                              </p>
                              <button
                                type="button"
                                onClick={() => setViewResultModal({
                                  title: log.prompt,
                                  agentName: log.agentName,
                                  date: log.runAt,
                                  content: log.result || '',
                                  conversationId: log.conversationId
                                })}
                                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-1 inline-flex items-center gap-1 hover:underline"
                              >
                                <Eye className="w-3 h-3" /> Ver informe completo
                              </button>
                            </div>
                          ) : log.status === 'failed' ? (
                            <p className="text-red-500 font-semibold leading-relaxed">{log.error}</p>
                          ) : (
                            <p className="text-gray-400 font-medium">Ejecutándose en segundo plano...</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap">
                          {log.conversationId && (
                            <a
                              href={`/c/${log.conversationId}`}
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-lg"
                            >
                              Ver chat <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal Creación / Edición con Constructor Visual de Flujos y Conectores WAPPY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-gradient-to-r from-purple-950/10 via-transparent to-teal-950/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                    {isPresetModalMode
                      ? editingAutomation
                        ? 'Editar Tarea Preestablecida Global (Admin)'
                        : 'Nueva Tarea Preestablecida Global para Todos los Usuarios'
                      : editingAutomation
                        ? 'Editar Tarea y Flujo de Conectores WAPPY'
                        : 'Nueva Tarea Autónoma & Flujo de Conectores WAPPY'}
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Conecta disparadores, herramientas de Google, APIs, MCP, Agentes IA y los 7 Hitos de Somos SST
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition font-bold p-1.5"
              >
                ✖
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
              {/* Selector rápido de Plantilla Preestablecida (solo al crear tarea de empresa) */}
              {!editingAutomation && !isPresetModalMode && presets.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-teal-900 dark:text-teal-200">
                        ¿Deseas partir de un Flujo Preestablecido del Sistema?
                      </div>
                      <div className="text-[11px] text-teal-700 dark:text-teal-400">
                        Autocompleta los conectores, el agente especialista, el horario y el prompt con 1 clic.
                      </div>
                    </div>
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const chosen = presets.find((p) => p._id === e.target.value);
                      if (chosen) handleCustomizeFromPreset(chosen);
                    }}
                    className="px-3 py-2 text-xs font-bold bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-xs"
                  >
                    <option value="">⚡ Cargar plantilla preestablecida...</option>
                    {presets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fila 1: Nombre + Agente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Título de la tarea */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Nombre de la Tarea / Flujo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Vigilancia Drive -> Registro ATEL e Inspecciones"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>

                {/* Selector de Agente */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Agente Especialista IA (Nodo Central) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsAgentOpen(!isAgentOpen); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white text-left"
                  >
                    <span>🤖 {agents.find(a => a.id === formAgentId)?.name || 'Seleccione un agente'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  </button>
                  {isAgentOpen && (
                    <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => {
                            setFormAgentId(agent.id);
                            setIsAgentOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-900 dark:text-white transition duration-150 ${
                            formAgentId === agent.id ? 'bg-purple-50/50 dark:bg-purple-900/10 font-semibold text-purple-600 dark:text-purple-400' : ''
                          }`}
                        >
                          {agent.name}
                        </button>
                      ))}
                      {agents.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No hay agentes disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CONSTRUCTOR VISUAL DE FLUJOS Y CONECTORES WAPPY (LIENZO INTERACTIVO + LOGOS SVG) */}
              <WappyWorkflowCanvas
                workflowNodes={formWorkflowNodes}
                onChange={setFormWorkflowNodes}
                agentId={formAgentId}
                agentName={agents.find((a) => a.id === formAgentId)?.name || 'Consultor SG-SST'}
                agents={agents}
                onSelectAgent={setFormAgentId}
                onAutoBuildPrompt={handleAutoBuildPrompt}
              />

              {/* Fila Horario + Correos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trigger / Frecuencia */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 bg-gray-50/70 dark:bg-gray-850">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                    ⏱️ Programación del Disparador de Tiempo
                  </label>

                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="relative">
                      <label className="block text-[10px] text-gray-500 mb-1">Frecuencia</label>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsFreqOpen(!isFreqOpen); }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-white text-left"
                      >
                        <span>
                          {formScheduleType === 'daily' ? 'Diario' :
                           formScheduleType === 'weekly' ? 'Semanal' :
                           formScheduleType === 'monthly' ? 'Mensual' :
                           formScheduleType === 'hourly' ? 'Cada X Horas' : 'Seleccionar'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      </button>
                      {isFreqOpen && (
                        <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {[
                            { id: 'daily', name: 'Diario', triggerNode: 'schedule_daily' },
                            { id: 'weekly', name: 'Semanal', triggerNode: 'schedule_weekly' },
                            { id: 'monthly', name: 'Mensual', triggerNode: 'schedule_monthly' },
                            { id: 'hourly', name: 'Cada X Horas', triggerNode: 'schedule_hourly' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setFormScheduleType(item.id as any);
                                setFormWorkflowNodes((prev) => ({ ...prev, trigger: item.triggerNode }));
                                setIsFreqOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-900 dark:text-white transition duration-150 ${
                                formScheduleType === item.id ? 'bg-purple-50/50 dark:bg-purple-900/10 font-semibold text-purple-600 dark:text-purple-400' : ''
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hour and Minute (except hourly) */}
                    {formScheduleType !== 'hourly' && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-500 mb-1">Hora (0-23)</label>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={formHour}
                            onChange={(e) => setFormHour(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-500 mb-1">Minuto</label>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={formMinute}
                            onChange={(e) => setFormMinute(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Interval Hours for hourly */}
                    {formScheduleType === 'hourly' && (
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Horas de Intervalo</label>
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={formIntervalHours}
                          onChange={(e) => setFormIntervalHours(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Weekly Option */}
                  {formScheduleType === 'weekly' && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Días de la Semana
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 1, label: 'L', name: 'Lunes' },
                          { id: 2, label: 'M', name: 'Martes' },
                          { id: 3, label: 'M', name: 'Miércoles' },
                          { id: 4, label: 'J', name: 'Jueves' },
                          { id: 5, label: 'V', name: 'Viernes' },
                          { id: 6, label: 'S', name: 'Sábado' },
                          { id: 0, label: 'D', name: 'Domingo' }
                        ].map((day) => {
                          const isSelected = formDaysOfWeek.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (formDaysOfWeek.length > 1) {
                                    setFormDaysOfWeek(formDaysOfWeek.filter(d => d !== day.id));
                                  }
                                } else {
                                  setFormDaysOfWeek([...formDaysOfWeek, day.id]);
                                }
                              }}
                              className={`w-8 h-8 flex items-center justify-center text-xs font-extrabold rounded-full border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-md'
                                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                              }`}
                              title={day.name}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Monthly Option */}
                  {formScheduleType === 'monthly' && (
                    <div className="mt-2">
                      <label className="block text-[10px] text-gray-500 mb-1">Día del Mes (1-31)</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formDayOfMonth}
                        onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Destinatarios y Opciones de Plantilla Global Admin */}
                <div className="flex flex-col gap-3 justify-between">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      📧 Correos de Destinatarios (separados por coma)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. medico.laboral@gmail.com, gerencia@empresa.com"
                      value={formEmailsStr}
                      onChange={(e) => setFormEmailsStr(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    />
                  </div>

                  {/* Admin: Publicar o Editar como Tarea Preestablecida del Sistema */}
                  {isAdmin && (
                    <div className="p-3 rounded-2xl border border-teal-300/70 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20">
                      {!isPresetModalMode && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-teal-900 dark:text-teal-200">
                          <input
                            type="checkbox"
                            checked={formSaveAsSystemPreset}
                            onChange={(e) => setFormSaveAsSystemPreset(e.target.checked)}
                            className="rounded border-teal-400 text-teal-600 focus:ring-teal-500"
                          />
                          <span>🌐 Publicar también como Tarea Preestablecida para TODOS los usuarios</span>
                        </label>
                      )}
                      {(isPresetModalMode || formSaveAsSystemPreset) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase mb-1">
                              Categoría del Catálogo
                            </label>
                            <select
                              value={formPresetCategory}
                              onChange={(e) => setFormPresetCategory(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 rounded-lg dark:text-white"
                            >
                              {PRESET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.icon} {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase mb-1">
                              Resumen para los usuarios
                            </label>
                            <input
                              type="text"
                              placeholder="Breve explicación del beneficio..."
                              value={formPresetDescription}
                              onChange={(e) => setFormPresetDescription(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 rounded-lg dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Instrucción / Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Instrucciones Autónomas para el Agente (Prompt de Ejecución) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Puedes escribirlo o pulsar "Autogenerar Prompt desde los Nodos"
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="Selecciona los conectores arriba y pulsa 'Autogenerar Prompt desde los Nodos', o escribe aquí la orden detallada que ejecutará el agente..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-200 font-bold rounded-lg text-xs uppercase tracking-wider transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition shadow-md"
                >
                  {isPresetModalMode
                    ? 'Guardar Plantilla Global'
                    : editingAutomation
                      ? 'Guardar Cambios'
                      : 'Guardar Tarea y Flujo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor de Informe / Resultado */}
      {viewResultModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-surface-secondary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {viewResultModal.title}
                  </h3>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                    Ejecutado por: {viewResultModal.agentName} {viewResultModal.date && `• ${new Date(viewResultModal.date).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewResultModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Report Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="bg-surface-secondary/30 dark:bg-gray-800/40 rounded-2xl p-5 border border-border-medium/20">
                <div className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {viewResultModal.content || 'Sin resultado registrado para esta ejecución.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-3.5 bg-gray-50/50 dark:bg-gray-850">
              <div>
                {viewResultModal.conversationId && (
                  <a
                    href={`/c/${viewResultModal.conversationId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold transition"
                  >
                    Abrir conversación completa en el chat <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewResultModal(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-xs uppercase tracking-wider transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Alert / Lock Modal */}
      {upgradeAlert.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            {/* Close button at top-right outside the card */}
            <button 
              onClick={() => setUpgradeAlert(prev => ({ ...prev, isOpen: false }))} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm z-50 transition-colors cursor-pointer"
            >
              Cerrar ✕
            </button>
            
            {/* Card container styled like WAPPY UpgradeWall */}
            <div className="relative flex flex-col items-center justify-center text-center overflow-hidden bg-white dark:bg-gray-950 border border-border-medium rounded-3xl shadow-2xl p-8 w-full group">
              {/* Ambient Background Glows */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-purple-500/10 rounded-full blur-3xl pointer-events-none w-40 h-40" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none w-40 h-40" />

              {/* Center Lock Illustration */}
              <div className="relative z-10 mb-4">
                <div className="relative flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 shadow-inner border border-purple-500/20 w-16 h-16">
                  <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" />
                  </svg>

                  {/* Sparkles */}
                  <div className="absolute -top-1 -right-1 text-purple-400 scale-75 animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                {/* Dynamic Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-full shadow-lg border border-white/20 whitespace-nowrap text-[10px]">
                  {upgradeAlert.badge}
                </div>
              </div>

              {/* Content Copy */}
              <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 z-10 tracking-tight text-xl mb-2">
                {upgradeAlert.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mx-auto leading-relaxed z-10 text-xs mb-6 max-w-[320px]">
                {upgradeAlert.message}
              </p>

              {/* Action Button */}
              <a
                href={upgradeAlert.actionUrl}
                target={upgradeAlert.actionUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={() => setUpgradeAlert(prev => ({ ...prev, isOpen: false }))}
                className="relative flex items-center justify-center gap-2 font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-lg border border-white/20 transition-all duration-300 ease-in-out z-10 hover:scale-105 hover:shadow-xl mt-4 px-6 py-2.5 text-sm w-full text-center cursor-pointer"
              >
                <Sparkles className="w-5 h-5 animate-pulse text-white" />
                <span className="tracking-wide">{upgradeAlert.actionText}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
