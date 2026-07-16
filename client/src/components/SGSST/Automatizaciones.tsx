import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  RefreshCw,
  Sparkles,
  Bot
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
      // Refrescar lista a los 3 segundos para mostrar estado
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
    <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Automatizaciones de Agentes
              <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> Autonómico
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Programa y gestiona tareas autónomas programadas para tus agentes expertos en SST.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
        >
          <Plus className="w-4 h-4" />
          Nueva Automatización
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition duration-200 ${
            activeTab === 'list'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Mis Automatizaciones
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition duration-200 ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-600'
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
      {activeTab === 'list' ? (
        loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Cargando automatizaciones...</p>
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl p-8">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-full text-purple-500 mb-4">
              <Cpu className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay automatizaciones activas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Las automatizaciones permiten que tus agentes ejecuten tareas de forma 100% autónoma en base a un calendario.
            </p>
            <button
              onClick={handleCreateOpen}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
            >
              Crear mi primera automatización
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {automations.map((auto) => (
              <div 
                key={auto._id}
                className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900/50 rounded-2xl shadow-sm transition-all duration-300 p-5 group relative"
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
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl mt-0.5">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition duration-200">
                      {auto.name}
                    </h3>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Asignado a: {auto.agentName}
                    </p>
                  </div>
                </div>

                {/* Prompt Details */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 mb-4 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Instrucción / Prompt:</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic">
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
                      <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" /> Corriendo
                      </span>
                    ) : auto.lastRunStatus === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Exitoso
                      </span>
                    ) : auto.lastRunStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Fallido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-semibold px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Sin ejecuciones
                      </span>
                    )}

                    {auto.lastRunAt && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(auto.lastRunAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {auto.conversationId && (
                      <a
                        href={`/c/${auto.conversationId}`}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition"
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
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Cargando historial...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay historial de ejecución</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Aquí aparecerán los resultados de las ejecuciones automáticas tan pronto como comiencen a correr.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agente</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instrucción</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resumen / Detalle</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition">
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.runAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                        {log.agentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={log.prompt}>
                        {log.prompt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === 'running' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin" /> Corriendo
                          </span>
                        ) : log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Completado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Fallido
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300 max-w-sm">
                        {log.status === 'success' ? (
                          <p className="line-clamp-2 italic">"{log.result}"</p>
                        ) : log.status === 'failed' ? (
                          <p className="text-red-500 font-medium">{log.error}</p>
                        ) : (
                          <p className="text-gray-400">Ejecutándose en segundo plano...</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {log.conversationId && (
                          <a
                            href={`/c/${log.conversationId}`}
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold"
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

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✖
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
              {/* Título de la tarea */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Tarea / Identificador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Reporte semanal de Exámenes Médicos Vencidos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              {/* Selector de Agente */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Agente a Asignar <span className="text-red-500">*</span>
                </label>
                <select
                  value={formAgentId}
                  onChange={(e) => setFormAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                  {agents.length === 0 && (
                    <option value="">No hay agentes disponibles</option>
                  )}
                </select>
              </div>

              {/* Emails destinatarios */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Correos de Destinatarios (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. medico.laboral@gmail.com, sgsst@empresa.com"
                  value={formEmailsStr}
                  onChange={(e) => setFormEmailsStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              {/* Trigger / Frecuencia */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-850">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Disparador (Trigger) de Tiempo
                </label>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
                    <select
                      value={formScheduleType}
                      onChange={(e) => setFormScheduleType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-white"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="hourly">Cada X Horas</option>
                    </select>
                  </div>

                  {/* Hour and Minute (except hourly) */}
                  {formScheduleType !== 'hourly' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Hora</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={formHour}
                          onChange={(e) => setFormHour(Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Minuto</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={formMinute}
                          onChange={(e) => setFormMinute(Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Interval Hours for hourly */}
                  {formScheduleType === 'hourly' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Horas de Intervalo</label>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={formIntervalHours}
                        onChange={(e) => setFormIntervalHours(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Additional Weekly Option */}
                {formScheduleType === 'weekly' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Día de la Semana</label>
                    <select
                      value={formDayOfWeek}
                      onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                    >
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miércoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sábado</option>
                      <option value={0}>Domingo</option>
                    </select>
                  </div>
                )}

                {/* Additional Monthly Option */}
                {formScheduleType === 'monthly' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Día del Mes</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formDayOfMonth}
                      onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Instrucción / Prompt */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Instrucciones Autónomas (Prompt) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="ej. Revisa los exámenes médicos ocupacionales de los trabajadores e identifica aquellos que estén vencidos. Genera un reporte detallado con el nombre de cada trabajador, cédula, examen vencido y cargo, y notifícalo a luisa.wappy@gmail.com."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono text-xs"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-200 font-semibold rounded-lg text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-sm transition shadow-md"
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
