import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Wand2,
  Paperclip,
  FileText,
} from 'lucide-react';
import { useListAgentsQuery } from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import ExpandableButton from '~/components/Common/ExpandableButton';
import {
  PRESET_CATEGORIES,
  WORKFLOW_PRESETS,
  TRIGGER_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  getNodeDefById,
  normalizeTriggersList,
  normalizeExtractorsList,
  normalizeMemoriesList,
  sanitizeWorkflowNodesForActiveUse,
  buildPromptFromWorkflowNodes,
  type WorkflowNodesConfig,
} from './workflowNodesCatalog';
import WappyWorkflowCanvas, { renderOfficialNodeSvg } from './WappyWorkflowCanvas';
import {
  type ScraperCapturedEvidence,
  collectUniqueScraperEvidences,
  extractEvidenceFromRow,
  stripNoiseEvidencesFromAgentResponse,
  triggerDirectFileDownload,
  renderWorkflowMarkdownToInteractiveHtml,
  handleEvidenceContainerClick,
  WorkflowEvidenceTray,
  WorkflowEvidenceLightboxModal,
} from './WappyWorkflowSandboxPanel';

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
  evidenceFiles?: ScraperCapturedEvidence[];
  evidences?: ScraperCapturedEvidence[];
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
  evidenceFiles?: ScraperCapturedEvidence[];
  evidences?: ScraperCapturedEvidence[];
}

function resolveAutomationLogEvidences(
  logOrAuto?: {
    evidenceFiles?: ScraperCapturedEvidence[];
    evidences?: ScraperCapturedEvidence[];
    result?: string;
    lastRunResult?: string;
  } | null,
): ScraperCapturedEvidence[] {
  if (!logOrAuto) return [];
  const rawList: Array<ScraperCapturedEvidence | Record<string, any>> = [
    ...(Array.isArray(logOrAuto.evidenceFiles) ? logOrAuto.evidenceFiles : []),
    ...(Array.isArray(logOrAuto.evidences) ? logOrAuto.evidences : []),
  ];
  const textBody = String(logOrAuto.result || logOrAuto.lastRunResult || '');
  if (textBody.includes('/api/sgsst/automatizaciones/evidencias/')) {
    const fallbackRowEv = extractEvidenceFromRow({ certificado: textBody });
    if (fallbackRowEv) rawList.push(fallbackRowEv);
  }
  return collectUniqueScraperEvidences([], rawList);
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
  const rawAgents = agentsData?.data || [];
  const agents = useMemo(() => {
    const tenshiAvatarOption = {
      id: 'tenshi_avatar_orchestrator',
      name: '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
    };
    const mapped = rawAgents.map((a: any) => ({
      ...a,
      name:
        a.name?.trim().toLowerCase() === 'tenshi'
          ? 'Tenshi (Agente de Chat)'
          : a.name,
    }));
    return [tenshiAvatarOption, ...mapped.filter((a: any) => a.id !== 'tenshi_avatar_orchestrator')];
  }, [rawAgents]);

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
    evidences?: ScraperCapturedEvidence[];
  } | null>(null);
  const [previewLogEvidence, setPreviewLogEvidence] = useState<ScraperCapturedEvidence | null>(null);
  const [previewLogEvidenceMode, setPreviewLogEvidenceMode] = useState<'image' | 'pdf'>('image');
  const [disabledSgsstApps, setDisabledSgsstApps] = useState<string[]>([]);
  const disabledSgsstAppsRef = useRef<string[]>([]);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const hasLoadedPresetsOnceRef = useRef(false);
  const hasLoadedLogsOnceRef = useRef(false);

  const handleOpenLogEvidence = useCallback(
    (ev: ScraperCapturedEvidence, preferredMode?: 'image' | 'pdf') => {
      setPreviewLogEvidenceMode(
        preferredMode || (ev.imageUrl ? 'image' : 'pdf'),
      );
      setPreviewLogEvidence(ev);
    },
    [],
  );

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

  // Fetch all automations (stable identity — zero re-render loops)
  const fetchAutomations = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
      const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
      const res = await axios.get(`/api/sgsst/automatizaciones${q}`);
      setAutomations(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToastRef.current({
        message: 'Error al cargar las automatizaciones.',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const mapCatalogPresetsToAutomations = useCallback(
    (disabledList: string[]): Automation[] =>
      WORKFLOW_PRESETS.map((p) => {
        const sanitizedNodes = sanitizeWorkflowNodesForActiveUse(p.workflowNodes, disabledList);
        return {
          _id: p.presetKey,
          name: p.name,
          agentId: 'tenshi_avatar_orchestrator',
          agentName: 'Consultor SG-SST',
          prompt: buildPromptFromWorkflowNodes(p.name, 'Consultor SG-SST', sanitizedNodes),
          scheduleType: p.scheduleType,
          scheduleConfig: {
            hour: p.hour,
            minute: p.minute,
            dayOfWeek: p.daysOfWeek,
            dayOfMonth: p.dayOfMonth,
            intervalHours: 1,
          },
          emails: [],
          status: 'active',
          isSystemPreset: true,
          presetKey: p.presetKey,
          presetCategory: p.presetCategory,
          presetDescription: p.description,
          workflowNodes: sanitizedNodes,
          createdAt: new Date().toISOString(),
        };
      }),
    [],
  );

  // Fetch system preset workflows (stable identity — reads disabledSgsstAppsRef to prevent infinite useEffect loops)
  const fetchPresets = useCallback(
    async (silent = false) => {
      if (!silent && !hasLoadedPresetsOnceRef.current) {
        setPresetsLoading(true);
      }
      try {
        const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
        const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
        const [res, cfgRes] = await Promise.all([
          axios.get(`/api/sgsst/automatizaciones/presets${q}`),
          axios.get('/api/sgsst/config').catch(() => ({ data: null })),
        ]);
        let nextDisabled = disabledSgsstAppsRef.current;
        if (Array.isArray(cfgRes?.data?.disabledApps)) {
          const incoming = cfgRes.data.disabledApps as string[];
          nextDisabled = incoming;
          if (JSON.stringify(disabledSgsstAppsRef.current) !== JSON.stringify(incoming)) {
            disabledSgsstAppsRef.current = incoming;
            setDisabledSgsstApps(incoming);
          }
        }
        const rawPresets: Automation[] = Array.isArray(res.data) ? res.data : [];
        if (rawPresets.length === 0) {
          setPresets(mapCatalogPresetsToAutomations(nextDisabled));
        } else {
          setPresets(
            rawPresets.map((p) => ({
              ...p,
              workflowNodes: sanitizeWorkflowNodesForActiveUse(p.workflowNodes, nextDisabled),
            })),
          );
        }
        hasLoadedPresetsOnceRef.current = true;
      } catch (err: any) {
        setPresets(mapCatalogPresetsToAutomations(disabledSgsstAppsRef.current));
        hasLoadedPresetsOnceRef.current = true;
        showToastRef.current({
          message: 'Error al cargar el catálogo de tareas preestablecidas.',
          status: 'error',
        });
      } finally {
        setPresetsLoading(false);
      }
    },
    [mapCatalogPresetsToAutomations],
  );

  // Fetch execution logs (stable identity — zero re-render loops)
  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedLogsOnceRef.current) {
      setLogsLoading(true);
    }
    try {
      const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
      const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
      const res = await axios.get(`/api/sgsst/automatizaciones/logs${q}`);
      setLogs(Array.isArray(res.data) ? res.data : []);
      hasLoadedLogsOnceRef.current = true;
    } catch (err: any) {
      showToastRef.current({
        message: 'Error al cargar el historial de ejecuciones.',
        status: 'error',
      });
    } finally {
      setLogsLoading(false);
    }
  }, []);

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
    fetchAutomations(false);
    fetchPresets(false);
    loadPlanLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresco silencioso en tiempo real cuando Tenshi o un agente crea/activa/desactiva/edita/elimina tareas o se cambia de empresa
  useEffect(() => {
    const handleSilentReload = async () => {
      try {
        const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
        const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
        const [autoRes, logsRes, presetsRes] = await Promise.allSettled([
          axios.get(`/api/sgsst/automatizaciones${q}`),
          axios.get(`/api/sgsst/automatizaciones/logs${q}`),
          axios.get(`/api/sgsst/automatizaciones/presets${q}`),
        ]);
        if (autoRes.status === 'fulfilled') {
          setAutomations(Array.isArray(autoRes.value.data) ? autoRes.value.data : []);
        }
        if (logsRes.status === 'fulfilled') {
          setLogs(Array.isArray(logsRes.value.data) ? logsRes.value.data : []);
          hasLoadedLogsOnceRef.current = true;
        }
        if (presetsRes.status === 'fulfilled') {
          const rawP = Array.isArray(presetsRes.value.data) ? presetsRes.value.data : [];
          setPresets(
            rawP.length > 0
              ? rawP.map((p: Automation) => ({
                  ...p,
                  workflowNodes: sanitizeWorkflowNodesForActiveUse(
                    p.workflowNodes,
                    disabledSgsstAppsRef.current,
                  ),
                }))
              : mapCatalogPresetsToAutomations(disabledSgsstAppsRef.current),
          );
          hasLoadedPresetsOnceRef.current = true;
        }
      } catch (_) {}
    };
    window.addEventListener('wappy-reload-sgsst-data', handleSilentReload);
    window.addEventListener('wappy-empresa-cambiada', handleSilentReload);
    window.addEventListener('wappy-company-changed', handleSilentReload);
    window.addEventListener('wappy-company-updated', handleSilentReload);
    window.addEventListener('wappy-automatizaciones-updated', handleSilentReload);
    return () => {
      window.removeEventListener('wappy-reload-sgsst-data', handleSilentReload);
      window.removeEventListener('wappy-empresa-cambiada', handleSilentReload);
      window.removeEventListener('wappy-company-changed', handleSilentReload);
      window.removeEventListener('wappy-company-updated', handleSilentReload);
      window.removeEventListener('wappy-automatizaciones-updated', handleSilentReload);
    };
  }, [mapCatalogPresetsToAutomations]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(hasLoadedLogsOnceRef.current);
    } else if (activeTab === 'presets') {
      if (!hasLoadedPresetsOnceRef.current) {
        fetchPresets(false);
      }
    }
  }, [activeTab, fetchLogs, fetchPresets]);

  // Auto-polling silencioso únicamente cuando hay tareas realmente en ejecución reciente (<15 min)
  const hasActiveRunningJob = useMemo(() => {
    const nowMs = Date.now();
    return (
      automations.some((a) => a.lastRunStatus === 'running') ||
      logs.some(
        (l) =>
          l.status === 'running' &&
          (!l.runAt || nowMs - new Date(l.runAt).getTime() < 15 * 60 * 1000),
      )
    );
  }, [automations, logs]);

  useEffect(() => {
    if (!hasActiveRunningJob) return;

    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const compId = typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
        const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
        const res = await axios.get(`/api/sgsst/automatizaciones${q}`);
        if (Array.isArray(res.data)) {
          setAutomations(res.data);
        }
        if (activeTab === 'logs') {
          const logsRes = await axios.get(`/api/sgsst/automatizaciones/logs${q}`);
          if (Array.isArray(logsRes.data)) {
            setLogs(logsRes.data);
          }
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [hasActiveRunningJob, activeTab]);

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
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_sst_workers'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_procedural'],
      includeIfNode: true,
      inputs: ['somos_sst_empresa'],
      hitos: ['hito1_diagnostico_0312'],
      outputs: ['email_report', 'wappy_notification'],
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
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_drive', 'extract_sst_workers'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      includeIfNode: true,
      inputs: ['google_drive', 'somos_sst_empresa'],
      hitos: ['hito2_perfil_socio'],
      outputs: ['somos_sst_update', 'email_report', 'wappy_notification'],
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
    setFormWorkflowNodes(
      sanitizeWorkflowNodesForActiveUse(automation.workflowNodes, disabledSgsstApps),
    );
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
    setFormWorkflowNodes(
      sanitizeWorkflowNodesForActiveUse(preset.workflowNodes, disabledSgsstApps),
    );
    setActiveNodeBuilderTab('inputs');
    setIsModalOpen(true);
  };

  // Instalar una tarea preestablecida directamente en la empresa activa (garantizando 0 nodos en construcción)
  const handleInstallPreset = async (preset: Automation) => {
    setActionLoadingId(preset._id);
    try {
      const sanitizedNodes = sanitizeWorkflowNodesForActiveUse(
        preset.workflowNodes,
        disabledSgsstApps,
      );
      const res = await axios.post(`/api/sgsst/automatizaciones/presets/${preset._id}/install`, {
        activateImmediately: false,
        workflowNodes: sanitizedNodes,
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
    if (!formName.trim() || !formAgentId) {
      showToast({
        message: 'Por favor ingresa el nombre de la tarea y selecciona el agente especialista.',
        status: 'error'
      });
      return;
    }

    const selectedAgent = agents.find(a => a.id === formAgentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Consultor SG-SST';

    // Si el prompt está vacío o el usuario editó nodos directamente en el lienzo, autogenerarlo
    const finalPrompt =
      formPrompt.trim() ||
      buildPromptFromWorkflowNodes(
        formName.trim() || 'Flujo Automatizado SG-SST',
        agentName,
        formWorkflowNodes,
      );
    if (!formPrompt.trim()) {
      setFormPrompt(finalPrompt);
    }

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
      prompt: finalPrompt,
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
        return `Semanal los ${days[typeof dayOfWeekVal === 'number' ? dayOfWeekVal : 1]} a las ${time}`;
      case 'monthly':
        return `El día ${config.dayOfMonth ?? 1} de cada mes a las ${time}`;
      default:
        return 'No configurado';
    }
  };

  const renderWorkflowPipeline = (nodes?: WorkflowNodesConfig, agentLabel?: string) => {
    const safeNodes = sanitizeWorkflowNodesForActiveUse(nodes, disabledSgsstApps);

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

        <div className="ml-auto py-1 px-1">
          <ExpandableButton
            type="button"
            size="sm"
            variant="purple"
            disabled={loading || logsLoading || presetsLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${(loading || logsLoading || presetsLoading) ? 'animate-spin' : ''}`} />}
            label="Actualizar"
            onClick={activeTab === 'list' ? fetchAutomations : activeTab === 'presets' ? fetchPresets : fetchLogs}
          />
        </div>
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
              <div className="flex flex-wrap items-center justify-center gap-3 py-1 px-2">
                <ExpandableButton
                  type="button"
                  variant="teal"
                  icon={<Workflow className="w-4 h-4" />}
                  label="Explorar Flujos Preestablecidos"
                  onClick={() => setActiveTab('presets')}
                />
                <ExpandableButton
                  type="button"
                  variant="purple"
                  icon={<Plus className="w-4 h-4" />}
                  label="Crear Tarea desde Cero"
                  onClick={handleCreateOpen}
                />
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
                    <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
                      {auto.lastRunResult && (
                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="purple"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          label="Ver Informe"
                          title="Ver informe de la última ejecución"
                          onClick={() => {
                            const matchingLog = logs.find(
                              (l) => String(l.automation) === String(auto._id),
                            );
                            const autoEvidences = resolveAutomationLogEvidences(
                              matchingLog || auto,
                            );
                            setViewResultModal({
                              title: auto.name,
                              agentName: auto.agentName,
                              date: auto.lastRunAt,
                              content: auto.lastRunResult || '',
                              conversationId: auto.conversationId,
                              evidences: autoEvidences,
                            });
                          }}
                        />
                      )}

                      {auto.conversationId && (
                        <a
                          href={`/c/${auto.conversationId}`}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold transition mr-1"
                          title="Ver chat del agente"
                        >
                          Ver chat <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {auto.lastRunStatus === 'running' ? (
                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={actionLoadingId === auto._id}
                          icon={
                            actionLoadingId === auto._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Square className="w-3.5 h-3.5 fill-current" />
                            )
                          }
                          label="Detener"
                          title="Detener ejecución en caliente"
                          onClick={() => handleStop(auto._id)}
                        />
                      ) : (
                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="emerald"
                          disabled={actionLoadingId === auto._id}
                          icon={
                            actionLoadingId === auto._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )
                          }
                          label="Ejecutar Ahora"
                          title="Ejecutar ahora"
                          onClick={() => handleRunNow(auto._id)}
                        />
                      )}

                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="neutral"
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                        label="Editar"
                        title="Editar tarea y flujo"
                        onClick={() => handleEditOpen(auto)}
                      />

                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="Eliminar"
                        title="Eliminar tarea"
                        onClick={() => handleDelete(auto._id)}
                      />
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
                <div className="shrink-0 py-0.5 px-1">
                  <ExpandableButton
                    type="button"
                    variant="teal"
                    icon={<Plus className="w-4 h-4" />}
                    label="Nueva Tarea Preestablecida (Admin)"
                    title="Crear nueva tarea preestablecida global para todos los usuarios"
                    onClick={handleCreatePresetOpen}
                  />
                </div>
              )}
            </div>

            {/* Filtro de categorías */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5 py-1 px-1">
              {PRESET_CATEGORIES.map((cat, cIdx) => {
                const catVariants = [
                  'teal',
                  'purple',
                  'amber',
                  'cyan',
                  'emerald',
                  'indigo',
                  'fuchsia',
                  'blue',
                ] as const;
                const countInCat =
                  cat.id === 'all'
                    ? presets.length
                    : presets.filter((p) => p.presetCategory === cat.id).length;
                return (
                  <ExpandableButton
                    key={cat.id}
                    type="button"
                    size="sm"
                    variant={catVariants[cIdx % catVariants.length]}
                    isActive={selectedPresetCategory === cat.id}
                    icon={<span className="text-xs leading-none">{cat.icon}</span>}
                    badge={countInCat}
                    label={cat.label}
                    onClick={() => setSelectedPresetCategory(cat.id)}
                  />
                );
              })}
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
                                <ExpandableButton
                                  type="button"
                                  size="sm"
                                  variant="neutral"
                                  icon={<Edit3 className="w-3.5 h-3.5" />}
                                  label="Editar Plantilla"
                                  title="Editar plantilla global (Admin)"
                                  onClick={() => handleEditOpen(preset, true)}
                                />
                                <ExpandableButton
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  icon={<Trash2 className="w-3.5 h-3.5" />}
                                  label="Eliminar Plantilla"
                                  title="Eliminar plantilla global (Admin)"
                                  onClick={() => handleDeletePreset(preset._id)}
                                />
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
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-gray-100 dark:border-gray-800 pt-3.5 px-1">
                          <ExpandableButton
                            type="button"
                            size="sm"
                            variant="purple"
                            icon={<Workflow className="w-3.5 h-3.5" />}
                            label="Personalizar Nodos"
                            title="Abrir este flujo en el constructor visual y personalizar sus nodos"
                            onClick={() => handleCustomizeFromPreset(preset)}
                          />

                          <ExpandableButton
                            type="button"
                            size="sm"
                            variant="teal"
                            disabled={actionLoadingId === preset._id}
                            icon={
                              actionLoadingId === preset._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )
                            }
                            label={
                              alreadyInstalled
                                ? 'Agregar Copia a Mis Tareas'
                                : 'Usar en mi Empresa'
                            }
                            title="Instalar esta tarea automatizada en mi empresa"
                            onClick={() => handleInstallPreset(preset)}
                          />
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
                    {logs.map((log) => {
                      const logEvidences = resolveAutomationLogEvidences(log);
                      const cleanedSummary = stripNoiseEvidencesFromAgentResponse(
                        log.result || '',
                      );
                      return (
                        <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition">
                          <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap align-top">
                            {new Date(log.runAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold align-top">
                            {log.agentName}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs align-top" title={log.prompt}>
                            {log.prompt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-top">
                            {log.status === 'running' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-bold px-2 py-0.5 rounded-xl border border-blue-500/30 uppercase tracking-wider">
                                <Loader2 className="w-3 h-3 animate-spin" /> Corriendo
                              </span>
                            ) : log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-xl border border-emerald-500/30 uppercase tracking-wider">
                                <CheckCircle className="w-3 h-3" /> Completado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-xl border border-rose-500/30 uppercase tracking-wider">
                                <XCircle className="w-3 h-3" /> Fallido
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300 max-w-md align-top">
                            {log.status === 'success' ? (
                              <div className="space-y-2.5 min-w-0">
                                <p className="line-clamp-2 italic leading-relaxed text-gray-800 dark:text-gray-200">
                                  "{cleanedSummary || log.result || 'Ejecución completada.'}"
                                </p>

                                {/* ─── BANDEJA DEDICADA DE CERTIFICADOS Y SOPORTES EN BITÁCORA REAL (`evidenceFiles`) ─── */}
                                {logEvidences.length > 0 && (
                                  <div className="rounded-xl border border-teal-500/35 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-2.5 space-y-2 min-w-0">
                                    <div className="flex items-center justify-between gap-2 text-[10.5px] font-black text-teal-800 dark:text-teal-200">
                                      <span className="inline-flex items-center gap-1.5 truncate">
                                        <Paperclip className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
                                        Certificados y Soportes Descargados ({logEvidences.length})
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-[9.5px] font-extrabold shrink-0">
                                        PDF / PNG
                                      </span>
                                    </div>

                                    <div className="space-y-1.5 max-h-[176px] overflow-y-auto pr-0.5">
                                      {logEvidences.map((ev, evIdx) => {
                                        const dlHref =
                                          ev.pdfDownloadUrl ||
                                          ev.pdfUrl ||
                                          ev.imageDownloadUrl ||
                                          ev.imageUrl ||
                                          '';
                                        const dlName =
                                          ev.pdfFileName || ev.imageFileName || null;
                                        return (
                                          <div
                                            key={`log_ev_${log._id}_${evIdx}`}
                                            className="rounded-lg border border-teal-500/25 bg-white/95 dark:bg-slate-900/95 p-1.5 flex items-center justify-between gap-2 min-w-0"
                                          >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                              {ev.imageUrl ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenLogEvidence(ev, 'image')
                                                  }
                                                  className="w-8 h-8 rounded-md overflow-hidden border border-teal-500/30 bg-white shrink-0 cursor-zoom-in"
                                                  title="Previsualizar certificado en modal"
                                                >
                                                  <img
                                                    src={ev.imageUrl}
                                                    alt={ev.workerName || ev.title || 'Soporte'}
                                                    className="w-full h-full object-cover object-top"
                                                    onError={(e) => {
                                                      (e.currentTarget as HTMLImageElement).style.display =
                                                        'none';
                                                    }}
                                                  />
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenLogEvidence(ev, 'pdf')
                                                  }
                                                  className="w-8 h-8 rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 cursor-pointer"
                                                  title="Previsualizar PDF en modal"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                </button>
                                              )}
                                              <div className="min-w-0">
                                                <div className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                                  {ev.workerName?.trim() ||
                                                    ev.title ||
                                                    `Soporte #${evIdx + 1}`}
                                                </div>
                                                <div className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                                  {[
                                                    ev.cedula ? `CC ${ev.cedula}` : '',
                                                    ev.portal || '',
                                                  ]
                                                    .filter(Boolean)
                                                    .join(' · ') || 'Portal Oficial'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                              <ExpandableButton
                                                type="button"
                                                size="sm"
                                                variant="teal"
                                                icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                                                label="Vista Previa"
                                                title="Ver soporte en modal ampliado"
                                                onClick={() =>
                                                  handleOpenLogEvidence(
                                                    ev,
                                                    ev.imageUrl ? 'image' : 'pdf',
                                                  )
                                                }
                                              />
                                              {dlHref && (
                                                <ExpandableButton
                                                  type="button"
                                                  size="sm"
                                                  variant="green"
                                                  icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                                  label="Descargar"
                                                  title="Descargar archivo oficial (.pdf / .png)"
                                                  onClick={() =>
                                                    triggerDirectFileDownload(dlHref, dlName)
                                                  }
                                                />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="purple"
                                    icon={<Eye className="w-3.5 h-3.5" />}
                                    label="Ver Informe Completo"
                                    onClick={() =>
                                      setViewResultModal({
                                        title: log.prompt,
                                        agentName: log.agentName,
                                        date: log.runAt,
                                        content: log.result || '',
                                        conversationId: log.conversationId,
                                        evidences: logEvidences,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ) : log.status === 'failed' ? (
                              <p className="text-red-500 font-semibold leading-relaxed">{log.error}</p>
                            ) : (
                              <p className="text-gray-400 font-medium">Ejecutándose en segundo plano...</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap align-top">
                            {log.conversationId && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="fuchsia"
                                icon={<ExternalLink className="w-3.5 h-3.5" />}
                                label="Ver chat"
                                title="Abrir conversación en el chat"
                                onClick={() => {
                                  window.location.href = `/c/${log.conversationId}`;
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
              <div className="flex items-center py-0.5 px-1">
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  icon={<XCircle className="w-4 h-4" />}
                  label="Cerrar"
                  title="Cerrar editor de flujo"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>
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

              {/* Fila 1: Nombre de la Tarea / Flujo + Botón WAPPY ExpandableButton para Publicar en Catálogo Global */}
              <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Nombre de la Tarea / Flujo Autónomo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Vigilancia Drive -> Registro ATEL e Inspecciones"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-semibold bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>

                {/* Admin: Publicar o Editar como Tarea Preestablecida del Sistema (Estilo Oficial ExpandableButton WAPPY) */}
                {isAdmin && !isPresetModalMode && (
                  <div className="flex items-center justify-end py-0.5 px-1 shrink-0">
                    <ExpandableButton
                      type="button"
                      variant={formSaveAsSystemPreset ? 'compliance-ok' : 'teal'}
                      isActive={formSaveAsSystemPreset}
                      icon={<Globe className="w-4 h-4" />}
                      label={
                        formSaveAsSystemPreset
                          ? '✓ Publicar en Catálogo Global'
                          : 'Publicar en Catálogo Global'
                      }
                      title="Publicar también esta tarea como plantilla preestablecida en el Catálogo Global para todos los usuarios"
                      onClick={() => setFormSaveAsSystemPreset((prev) => !prev)}
                    />
                  </div>
                )}
              </div>

              {isAdmin && (isPresetModalMode || formSaveAsSystemPreset) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-teal-300/70 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20">
                  <div>
                    <label className="block text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase mb-1">
                      Categoría del Catálogo Global
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

              {/* CONSTRUCTOR VISUAL DE FLUJOS Y CONECTORES WAPPY (TODA LA CONFIGURACIÓN VIVE DENTRO DE CADA NODO AL HACER CLIC) */}
              <WappyWorkflowCanvas
                workflowNodes={formWorkflowNodes}
                onChange={setFormWorkflowNodes}
                agentId={formAgentId}
                agentName={agents.find((a) => a.id === formAgentId)?.name || 'Consultor SG-SST'}
                agents={agents}
                onSelectAgent={setFormAgentId}
                onAutoBuildPrompt={handleAutoBuildPrompt}
                prompt={formPrompt}
                onChangePrompt={setFormPrompt}
                scheduleType={formScheduleType}
                onChangeScheduleType={setFormScheduleType}
                hour={formHour}
                onChangeHour={setFormHour}
                minute={formMinute}
                onChangeMinute={setFormMinute}
                daysOfWeek={formDaysOfWeek}
                onChangeDaysOfWeek={setFormDaysOfWeek}
                dayOfMonth={formDayOfMonth}
                onChangeDayOfMonth={setFormDayOfMonth}
                intervalHours={formIntervalHours}
                onChangeIntervalHours={setFormIntervalHours}
                emailsStr={formEmailsStr}
                onChangeEmailsStr={setFormEmailsStr}
              />

              {/* Pie del Modal: Resumen en vivo + Botones Oficiales WAPPY (ExpandableButton) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-800 pt-3.5 mt-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">
                    💡 Haz clic en cualquier nodo del lienzo (Cron, Agente IA, Hito SST, Gmail) para abrir su editor propio
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <ExpandableButton
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    icon={<XCircle className="w-4 h-4" />}
                    text="Cancelar"
                    variant="secondary"
                  />
                  <ExpandableButton
                    type="submit"
                    icon={<CheckCircle className="w-4 h-4" />}
                    text={
                      isPresetModalMode
                        ? 'Guardar Plantilla Global'
                        : editingAutomation
                          ? 'Guardar Cambios'
                          : 'Guardar Tarea y Flujo'
                    }
                    variant="violet"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor de Informe / Resultado (Con Bandeja Dedicada de Certificados `evidenceFiles`) */}
      {viewResultModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-surface-secondary/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {viewResultModal.title}
                  </h3>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 truncate">
                    Ejecutado por: {viewResultModal.agentName}{' '}
                    {viewResultModal.date && `• ${new Date(viewResultModal.date).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                icon={<XCircle className="w-4 h-4" />}
                label="Cerrar"
                onClick={() => setViewResultModal(null)}
              />
            </div>

            {/* Modal Content / Report Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {Array.isArray(viewResultModal.evidences) &&
                viewResultModal.evidences.length > 0 && (
                  <WorkflowEvidenceTray
                    evidences={viewResultModal.evidences}
                    onOpenEvidence={handleOpenLogEvidence}
                  />
                )}

              <div className="bg-surface-secondary/30 dark:bg-gray-800/40 rounded-2xl p-5 border border-border-medium/20 min-w-0">
                <div
                  onClick={(e) =>
                    handleEvidenceContainerClick(
                      e,
                      viewResultModal.evidences || [],
                      handleOpenLogEvidence,
                    )
                  }
                  className="text-xs text-gray-800 dark:text-gray-200 font-sans leading-relaxed overflow-x-auto break-words"
                  dangerouslySetInnerHTML={{
                    __html: renderWorkflowMarkdownToInteractiveHtml(
                      stripNoiseEvidencesFromAgentResponse(
                        viewResultModal.content ||
                          'Sin resultado registrado para esta ejecución.',
                      ),
                    ),
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-3.5 bg-gray-50/50 dark:bg-gray-850">
              <div>
                {viewResultModal.conversationId && (
                  <ExpandableButton
                    type="button"
                    size="sm"
                    variant="fuchsia"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    label="Abrir conversación completa en el chat"
                    onClick={() => {
                      window.location.href = `/c/${viewResultModal.conversationId}`;
                    }}
                  />
                )}
              </div>
              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                icon={<XCircle className="w-4 h-4" />}
                label="Cerrar"
                onClick={() => setViewResultModal(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Visor Modal Lightbox HD / PDF para Certificados de Bitácora Real */}
      <WorkflowEvidenceLightboxModal
        evidence={previewLogEvidence}
        initialMode={previewLogEvidenceMode}
        onClose={() => setPreviewLogEvidence(null)}
      />

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
