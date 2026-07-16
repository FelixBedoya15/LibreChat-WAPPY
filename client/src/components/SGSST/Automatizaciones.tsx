import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Play, 
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
  AlertTriangle
} from 'lucide-react';
import { useListAgentsQuery } from '~/data-provider';
import { useToastContext } from '@librechat/client';

interface ScheduleConfig {
  hour: number;
  minute: number;
  dayOfWeek?: number;
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
  status: 'active' | 'inactive';
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
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

export default function Automatizaciones() {
  const { showToast } = useToastContext();
  const { data: agentsData } = useListAgentsQuery({ requiredPermission: 1, limit: 100 });
  const agents = agentsData?.data || [];

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'logs'>('list');
  const [showDashboard, setShowDashboard] = useState(true);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formScheduleType, setFormScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'hourly'>('daily');
  const [formHour, setFormHour] = useState(8);
  const [formMinute, setFormMinute] = useState(0);
  const [formDayOfWeek, setFormDayOfWeek] = useState(1); // Lunes
  const [formDayOfMonth, setFormDayOfMonth] = useState(1);
  const [formIntervalHours, setFormIntervalHours] = useState(1);
  const [formEmailsStr, setFormEmailsStr] = useState('');

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

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

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

  // Handle open modal for create
  const handleCreateOpen = () => {
    setEditingAutomation(null);
    setFormName('');
    setFormAgentId(agents[0]?.id || '');
    setFormPrompt('');
    setFormScheduleType('daily');
    setFormHour(8);
    setFormMinute(0);
    setFormDayOfWeek(1);
    setFormDayOfMonth(1);
    setFormIntervalHours(1);
    setFormEmailsStr('');
    setIsAgentOpen(false);
    setIsFreqOpen(false);
    setIsDayOpen(false);
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleEditOpen = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormName(automation.name);
    setFormAgentId(automation.agentId);
    setFormPrompt(automation.prompt);
    setFormScheduleType(automation.scheduleType);
    setFormHour(automation.scheduleConfig?.hour ?? 8);
    setFormMinute(automation.scheduleConfig?.minute ?? 0);
    setFormDayOfWeek(automation.scheduleConfig?.dayOfWeek ?? 1);
    setFormDayOfMonth(automation.scheduleConfig?.dayOfMonth ?? 1);
    setFormIntervalHours(automation.scheduleConfig?.intervalHours ?? 1);
    setFormEmailsStr(automation.emails?.join(', ') || '');
    setIsAgentOpen(false);
    setIsFreqOpen(false);
    setIsDayOpen(false);
    setIsModalOpen(true);
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
      dayOfWeek: Number(formDayOfWeek),
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
      emails
    };

    try {
      if (editingAutomation) {
        await axios.put(`/api/sgsst/automatizaciones/${editingAutomation._id}`, payload);
        showToast({
          message: 'Automatización actualizada con éxito.',
          status: 'success'
        });
      } else {
        await axios.post('/api/sgsst/automatizaciones', payload);
        showToast({
          message: 'Automatización creada con éxito.',
          status: 'success'
        });
      }
      setIsModalOpen(false);
      fetchAutomations();
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
    try {
      await axios.put(`/api/sgsst/automatizaciones/${automation._id}`, { status: newStatus });
      showToast({
        message: `Automatización ${newStatus === 'active' ? 'activada' : 'desactivada'} correctamente.`,
        status: 'success'
      });
      fetchAutomations();
    } catch (err) {
      showToast({
        message: 'Error al cambiar el estado de la automatización.',
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
        return `Semanal los ${days[config.dayOfWeek ?? 1]} a las ${time}`;
      case 'monthly':
        return `El día ${config.dayOfMonth ?? 1} de cada mes a las ${time}`;
      default:
        return 'No configurado';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-12">
      {/* Upper header - Estilo ACPM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            <Cpu className="w-7 h-7 text-purple-500" />
            Automatizaciones de Agentes
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Programación y control de tareas autónomas para tus agentes expertos de seguridad y salud en el trabajo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`group flex items-center justify-center h-9 px-3.5 sm:h-10 sm:px-4 rounded-xl border border-border-medium/40 text-xs font-bold transition-all duration-300 gap-2 cursor-pointer shadow-sm ${
              showDashboard 
                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-950/20 dark:text-purple-400' 
                : 'bg-white dark:bg-gray-900 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
            title={showDashboard ? "Ocultar Analíticas" : "Mostrar Analíticas"}
          >
            {showDashboard ? (
              <>
                <EyeOff className="w-4.5 h-4.5 text-current" />
                <span className="hidden sm:inline">Ocultar Analíticas</span>
                <span className="sm:hidden">Ocultar</span>
              </>
            ) : (
              <>
                <Eye className="w-4.5 h-4.5 text-current" />
                <span className="hidden sm:inline">Ver Analíticas</span>
                <span className="sm:hidden">Analíticas</span>
              </>
            )}
          </button>

          <button
            onClick={handleCreateOpen}
            className="group flex items-center justify-center h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            title="Nueva Automatización"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className="text-xs sm:text-sm font-bold tracking-wide">Nueva Automatización</span>
            </div>
          </button>
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
      <div className="flex border-b border-gray-200 dark:border-gray-800 mx-6 mt-6 mb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition duration-200 ${
            activeTab === 'list'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Mis Automatizaciones
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
          onClick={activeTab === 'list' ? fetchAutomations : fetchLogs}
          disabled={loading || logsLoading}
          className="ml-auto p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || logsLoading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="px-6">
        {activeTab === 'list' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando automatizaciones...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl shadow-sm p-8">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-full text-purple-500 mb-4">
                <Cpu className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay automatizaciones activas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                Las automatizaciones permiten que tus agentes ejecuten tareas de forma 100% autónoma en base a un calendario.
              </p>
              <button
                onClick={handleCreateOpen}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
              >
                Crear mi primera automatización
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {automations.map((auto) => (
                <div 
                  key={auto._id}
                  className="flex flex-col bg-white dark:bg-gray-900 border border-border-medium/30 hover:border-purple-300 dark:hover:border-purple-900/50 rounded-2xl shadow-sm transition-all duration-300 p-5 group relative"
                >
                  {/* Status Switch Indicator */}
                  <button
                    onClick={() => handleToggleStatus(auto)}
                    className="absolute top-5 right-5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    title={auto.status === 'active' ? 'Desactivar' : 'Activar'}
                  >
                    {auto.status === 'active' ? (
                      <ToggleRight className="w-10 h-10 text-purple-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400" />
                    )}
                  </button>

                  {/* Title */}
                  <div className="flex items-start gap-3 pr-12 mb-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl mt-0.5">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-purple-600 transition duration-200 text-sm">
                        {auto.name}
                      </h3>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                        Asignado a: {auto.agentName}
                      </p>
                    </div>
                  </div>

                  {/* Prompt Details */}
                  <div className="bg-surface-secondary/20 dark:bg-gray-800/40 rounded-xl p-3.5 mb-4 flex-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-wider">Instrucción / Prompt:</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic leading-relaxed">
                      "{auto.prompt}"
                    </p>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span>{formatScheduleText(auto)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="truncate" title={auto.emails?.join(', ') || 'Sin correos'}>
                        {auto.emails?.length > 0 ? `${auto.emails.length} destinatarios` : 'Sin correos'}
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
                      {auto.conversationId && (
                        <a
                          href={`/c/${auto.conversationId}`}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold transition mr-2"
                          title="Ver chat del agente"
                        >
                          Ver chat <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        onClick={() => handleRunNow(auto._id)}
                        disabled={actionLoadingId === auto._id || auto.lastRunStatus === 'running'}
                        className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-lg transition"
                        title="Ejecutar ahora"
                      >
                        {actionLoadingId === auto._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

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
                            <p className="line-clamp-2 italic leading-relaxed">"{log.result}"</p>
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
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold"
                            >
                              Ver chat <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/30 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition font-bold"
              >
                ✖
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
              {/* Título de la tarea */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Tarea / Identificador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Reporte semanal de Exámenes Médicos Vencidos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              {/* Selector de Agente */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Agente a Asignar <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsAgentOpen(!isAgentOpen); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white text-left"
                >
                  <span>{agents.find(a => a.id === formAgentId)?.name || 'Seleccione un agente'}</span>
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

              {/* Emails destinatarios */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Correos de Destinatarios (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. medico.laboral@gmail.com, sgsst@empresa.com"
                  value={formEmailsStr}
                  onChange={(e) => setFormEmailsStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              {/* Trigger / Frecuencia */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-gray-50 dark:bg-gray-850">
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Disparador (Trigger) de Tiempo
                </label>

                <div className="grid grid-cols-2 gap-4 mb-3">
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
                          { id: 'daily', name: 'Diario' },
                          { id: 'weekly', name: 'Semanal' },
                          { id: 'monthly', name: 'Mensual' },
                          { id: 'hourly', name: 'Cada X Horas' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setFormScheduleType(item.id as any);
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
                        <label className="block text-[10px] text-gray-500 mb-1">Hora</label>
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
                  <div className="relative mt-2">
                    <label className="block text-[10px] text-gray-500 mb-1">Día de la Semana</label>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsDayOpen(!isDayOpen); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white text-left"
                    >
                      <span>
                        {formDayOfWeek === 1 ? 'Lunes' :
                         formDayOfWeek === 2 ? 'Martes' :
                         formDayOfWeek === 3 ? 'Miércoles' :
                         formDayOfWeek === 4 ? 'Jueves' :
                         formDayOfWeek === 5 ? 'Viernes' :
                         formDayOfWeek === 6 ? 'Sábado' :
                         formDayOfWeek === 0 ? 'Domingo' : 'Lunes'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    </button>
                    {isDayOpen && (
                      <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {[
                          { id: 1, name: 'Lunes' },
                          { id: 2, name: 'Martes' },
                          { id: 3, name: 'Miércoles' },
                          { id: 4, name: 'Jueves' },
                          { id: 5, name: 'Viernes' },
                          { id: 6, name: 'Sábado' },
                          { id: 0, name: 'Domingo' }
                        ].map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              setFormDayOfWeek(day.id);
                              setIsDayOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-900 dark:text-white transition duration-150 ${
                              formDayOfWeek === day.id ? 'bg-purple-50/50 dark:bg-purple-900/10 font-semibold text-purple-600 dark:text-purple-400' : ''
                            }`}
                          >
                            {day.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Monthly Option */}
                {formScheduleType === 'monthly' && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Día del Mes</label>
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

              {/* Instrucción / Prompt */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Instrucciones Autónomas (Prompt) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="ej. Revisa los exámenes médicos ocupacionales de los trabajadores e identifica aquellos que estén vencidos. Genera un reporte detallado con el nombre de cada trabajador, cédula, examen vencido y cargo, y notifícalo a luisa.wappy@gmail.com."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono text-xs"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
