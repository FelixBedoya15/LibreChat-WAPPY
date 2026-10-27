import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ExternalLink,
  Download,
  Trash2,
  Edit3,
  User,
  MapPin,
  Tag,
  Filter,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  Share2,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import ExpandableButton from '~/components/Common/ExpandableButton';

export interface CalendarTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'due_soon' | 'overdue' | 'done';
  dueDate: string;
  type: string;
  priority?: 'alta' | 'media' | 'baja';
  actionType?: 'correctiva' | 'preventiva' | 'mejora';
  sourceModule?: string;
  assignedTo?: string;
  referenceId?: string;
  referenceName?: string;
  companyId?: string;
  completedAt?: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  emailAttendees?: string[];
  location?: string;
  googleEventId?: string;
  googleHtmlLink?: string;
}

interface KanbanCalendarViewProps {
  tasks: CalendarTask[];
  onTasksChange: () => void;
  onOpenCreateModal: (defaultDate?: string) => void;
  onOpenEditModal: (task: CalendarTask) => void;
  onDeleteTask: (id: string) => Promise<void>;
  isLoading?: boolean;
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const getStatusTheme = (status: CalendarTask['status']) => {
  switch (status) {
    case 'done':
      return {
        label: 'Completada',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-300 dark:border-emerald-700/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        lineThrough: 'line-through opacity-70',
      };
    case 'overdue':
      return {
        label: 'Vencida (Alerta)',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-300 dark:border-rose-700/60',
        text: 'text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        lineThrough: '',
      };
    case 'due_soon':
      return {
        label: 'Próxima a Vencer',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-300 dark:border-amber-700/60',
        text: 'text-amber-800 dark:text-amber-300',
        dot: 'bg-amber-500 animate-pulse',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        lineThrough: '',
      };
    case 'todo':
    default:
      return {
        label: 'Pendiente',
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        border: 'border-sky-300 dark:border-sky-700/60',
        text: 'text-sky-800 dark:text-sky-300',
        dot: 'bg-sky-500',
        badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
        lineThrough: '',
      };
  }
};

export default function KanbanCalendarView({
  tasks,
  onTasksChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteTask,
  isLoading = false,
}: KanbanCalendarViewProps) {
  const { showToast } = useToastContext();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [dayOverflowModal, setDayOverflowModal] = useState<{ dateStr: string; tasks: CalendarTask[] } | null>(null);

  // Email state modal inside task viewer
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailCustomMessage, setEmailCustomMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Quick edit date / moving state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Today helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesAssignee = (task.assignedTo || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  // Map tasks by date YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of filteredTasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      if (isNaN(d.getTime())) continue;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    }
    return map;
  }, [filteredTasks]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else if (viewMode === 'day') {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else if (viewMode === 'day') {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days from prev month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: false });
    }

    // Days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: true });
    }

    // Days of next month to complete 35 or 42 slots
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const d = new Date(year, month + 1, day);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const days: { date: Date; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const curr = new Date(startOfWeek);
      curr.setDate(startOfWeek.getDate() + i);
      const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      days.push({ date: curr, dateStr });
    }
    return days;
  }, [currentDate]);

  // Drag and Drop handlers for instant date rescheduling
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Check if same date
    const taskDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    if (taskDateStr === targetDateStr) return;

    try {
      const targetDate = new Date(`${targetDateStr}T12:00:00-05:00`);
      await axios.post('/api/sgsst/kanban/save', {
        _id: taskId,
        dueDate: targetDate.toISOString(),
      });

      showToast({
        message: `Actividad "${task.title}" reprogramada al ${targetDateStr} con éxito.`,
        status: 'success',
      });
      onTasksChange();
    } catch (err) {
      console.error('Error al mover fecha de la actividad:', err);
      showToast({
        message: 'No se pudo mover la fecha de la actividad.',
        status: 'error',
      });
    }
  };

  // Google Calendar instant redirect
  const handleAddToGoogleCalendar = (task: CalendarTask) => {
    const rawDue = task.dueDate || new Date().toISOString();
    const dateStr = rawDue.split('T')[0];
    const startTime = task.startTime || '09:00';
    const endTime = task.endTime || '10:00';
    const [sh, sm] = startTime.split(':').map((n) => parseInt(n, 10) || 0);
    const [eh, em] = endTime.split(':').map((n) => parseInt(n, 10) || 0);

    const startDateTime = new Date(`${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00-05:00`);
    const endDateTime = new Date(`${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00-05:00`);

    const formatGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: task.title,
      dates: `${formatGCal(startDateTime)}/${formatGCal(endDateTime)}`,
      details: `${task.description || ''}\n\nResponsable: ${task.assignedTo || 'SG-SST'}\nProgramado en Centro de Control SST - WAPPY IA (wappy.club)`,
      location: task.location || 'Oficinas SG-SST',
    });

    window.open(`${base}&${params.toString()}`, '_blank');
  };

  // Direct ICS download
  const handleDownloadIcs = (taskId: string) => {
    window.open(`/api/sgsst/kanban/export-ics/${taskId}`, '_blank');
  };

  // Send Event Email
  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!emailRecipients.trim()) {
      showToast({ message: 'Ingresa al menos un correo destinatario.', status: 'warning' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await axios.post('/api/sgsst/kanban/send-event-email', {
        taskId: selectedTask._id,
        recipients: emailRecipients,
        customMessage: emailCustomMessage,
      });

      showToast({
        message: res.data.mensaje || '¡Invitación y citación enviada exitosamente por correo!',
        status: 'success',
      });
      setIsEmailModalOpen(false);
      setEmailRecipients('');
      setEmailCustomMessage('');
      onTasksChange();
    } catch (err: any) {
      console.error('Error enviando citación por correo:', err);
      showToast({
        message: err.response?.data?.error || 'Error al enviar la citación por correo.',
        status: 'error',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Toggle task done
  const handleToggleTaskDone = async (task: CalendarTask) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await axios.post('/api/sgsst/kanban/save', {
        _id: task._id,
        status: nextStatus,
      });
      showToast({
        message: nextStatus === 'done' ? '¡Actividad marcada como completada!' : 'Actividad reabierta como pendiente.',
        status: 'success',
      });
      if (selectedTask?._id === task._id) {
        setSelectedTask({ ...selectedTask, status: nextStatus });
      }
      onTasksChange();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast({ message: 'Error al cambiar estado de la actividad.', status: 'error' });
    }
  };

  return (
    <div data-tenshi-calendar="view" className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-t border-border-medium/30 select-none">
      {/* ─── BARRA DE HERRAMIENTAS DEL CALENDARIO (ESTILO GOOGLE CALENDAR + WAPPY) ─── */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-border-medium/30 bg-surface-primary dark:bg-gray-900/60">
        {/* Left: Navigation and Date Title */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Botón Hoy */}
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl border border-border-medium/60 text-xs font-bold text-text-primary hover:bg-surface-secondary dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            Hoy
          </button>

          {/* Flechas Anterior / Siguiente */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary dark:hover:bg-zinc-800 transition-all"
              title="Período anterior"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary dark:hover:bg-zinc-800 transition-all"
              title="Período siguiente"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mes y Año Actual */}
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary capitalize tracking-tight">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <span className="text-xs font-semibold text-text-tertiary hidden sm:inline">
              ({filteredTasks.length} {filteredTasks.length === 1 ? 'actividad' : 'actividades'})
            </span>
          </div>
        </div>

        {/* Center / Right: Filters and Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Buscador de Tareas */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar compromiso..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border-medium/50 bg-surface-secondary/40 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-1 bg-surface-secondary/50 dark:bg-zinc-800/60 p-1 rounded-xl border border-border-medium/40">
            <Filter className="w-3.5 h-3.5 text-text-tertiary ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary border-none focus:outline-none pr-2 py-0.5 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-gray-900">Todos los Estados</option>
              <option value="todo" className="bg-white dark:bg-gray-900">Solo Pendientes</option>
              <option value="due_soon" className="bg-white dark:bg-gray-900">Próximas a Vencer</option>
              <option value="overdue" className="bg-white dark:bg-gray-900">Solo Vencidas</option>
              <option value="done" className="bg-white dark:bg-gray-900">Completadas</option>
            </select>
          </div>

          {/* Selector de Vista: Mes / Semana / Día / Agenda */}
          <div className="flex items-center p-0.5 bg-surface-secondary/60 dark:bg-zinc-800 rounded-xl border border-border-medium/40">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  viewMode === mode
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : mode === 'day' ? 'Día' : 'Agenda'}
              </button>
            ))}
          </div>

          {/* Botón "+ Nuevo Evento" (ExpandableButton WAPPY Grupo 4 Emerald) */}
          <ExpandableButton
            onClick={() => onOpenCreateModal(todayStr)}
            variant="emerald"
            icon={<Plus className="w-4 h-4 text-current" />}
            label="Nuevo Evento"
            title="Crear nueva actividad o evento en el calendario"
          />
        </div>
      </div>

      {/* ─── CONTENIDO DE VISTAS DEL CALENDARIO ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[580px]">
        {/* 1. VISTA MES (MONTH) */}
        {viewMode === 'month' && (
          <div className="flex-1 flex flex-col overflow-auto">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 border-b border-border-medium/30 bg-surface-secondary/30 dark:bg-zinc-900 text-center py-2.5 shrink-0">
              {DAY_NAMES_SHORT.map((name, idx) => (
                <div
                  key={name}
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? 'text-text-tertiary' : 'text-text-secondary'
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-5 border-l border-t border-border-medium/30 min-h-[500px]">
              {monthDays.map((dayObj, index) => {
                const dayTasks = tasksByDate.get(dayObj.dateStr) || [];
                const isToday = dayObj.dateStr === todayStr;
                const isDragOver = dragOverDate === dayObj.dateStr;

                return (
                  <div
                    key={`${dayObj.dateStr}-${index}`}
                    onDragOver={(e) => handleDragOver(e, dayObj.dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnDate(e, dayObj.dateStr)}
                    className={`flex flex-col border-r border-b border-border-medium/20 p-1.5 sm:p-2 transition-colors relative min-h-[96px] group ${
                      !dayObj.isCurrentMonth
                        ? 'bg-surface-secondary/15 dark:bg-zinc-950/40 text-text-tertiary opacity-45'
                        : 'bg-white dark:bg-gray-900/40'
                    } ${isToday ? 'bg-teal-500/5 dark:bg-teal-950/20' : ''} ${
                      isDragOver ? 'bg-teal-100/70 dark:bg-teal-900/40 ring-2 ring-teal-500 ring-inset' : ''
                    }`}
                  >
                    {/* Header de Celda: Número del Día y Botón '+' */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday
                            ? 'bg-teal-600 text-white font-black shadow-xs'
                            : dayObj.isCurrentMonth
                            ? 'text-text-primary'
                            : 'text-text-tertiary'
                        }`}
                      >
                        {dayObj.date.getDate()}
                      </span>

                      {/* Botón '+' rápido para añadir evento en este día */}
                      <button
                        onClick={() => onOpenCreateModal(dayObj.dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-text-tertiary hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-zinc-800 transition-all"
                        title={`Agendar actividad el ${dayObj.dateStr}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Lista de Actividades del Día */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => {
                        const theme = getStatusTheme(task.status);
                        return (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task._id)}
                            onClick={() => setSelectedTask(task)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-2xs group/pill ${theme.bg} ${theme.border} ${theme.text} ${theme.lineThrough}`}
                            title={`${task.title} (${theme.label}) - Arrastra para reprogramar`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                              <span className="truncate">{task.title}</span>
                            </div>
                            {task.startTime && (
                              <span className="text-[9px] opacity-75 shrink-0 hidden sm:inline">
                                {task.startTime}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Indicador de más tareas */}
                      {dayTasks.length > 3 && (
                        <button
                          onClick={() => setDayOverflowModal({ dateStr: dayObj.dateStr, tasks: dayTasks })}
                          className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 hover:underline text-left pt-0.5"
                        >
                          + {dayTasks.length - 3} más...
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. VISTA SEMANA (WEEK) */}
        {viewMode === 'week' && (
          <div className="flex-1 flex flex-col overflow-auto">
            {/* Cabecera semanal */}
            <div className="grid grid-cols-7 border-b border-border-medium/30 bg-surface-secondary/30 dark:bg-zinc-900 py-3 text-center">
              {weekDays.map((wDay) => {
                const isToday = wDay.dateStr === todayStr;
                return (
                  <div key={wDay.dateStr} className="flex flex-col items-center">
                    <span className="text-[11px] font-extrabold uppercase text-text-tertiary">
                      {DAY_NAMES_SHORT[wDay.date.getDay()]}
                    </span>
                    <span
                      className={`text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-teal-600 text-white shadow-xs' : 'text-text-primary'
                      }`}
                    >
                      {wDay.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Columnas de los 7 días */}
            <div className="flex-1 grid grid-cols-7 border-l border-border-medium/20 divide-x divide-border-medium/20 min-h-[500px]">
              {weekDays.map((wDay) => {
                const dayTasks = tasksByDate.get(wDay.dateStr) || [];
                const isDragOver = dragOverDate === wDay.dateStr;

                return (
                  <div
                    key={wDay.dateStr}
                    onDragOver={(e) => handleDragOver(e, wDay.dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnDate(e, wDay.dateStr)}
                    className={`p-2 flex flex-col gap-2 transition-colors relative min-h-[400px] ${
                      isDragOver ? 'bg-teal-100/60 dark:bg-teal-900/40 ring-2 ring-teal-500 ring-inset' : 'bg-white dark:bg-gray-900/40'
                    }`}
                  >
                    <button
                      onClick={() => onOpenCreateModal(wDay.dateStr)}
                      className="w-full py-1 text-[11px] font-bold text-text-tertiary hover:text-teal-600 hover:bg-surface-secondary rounded-lg border border-dashed border-border-medium/40 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agendar
                    </button>

                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                      {dayTasks.map((task) => {
                        const theme = getStatusTheme(task.status);
                        return (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task._id)}
                            onClick={() => setSelectedTask(task)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex flex-col gap-1.5 ${theme.bg} ${theme.border} ${theme.text}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold leading-tight line-clamp-2">{task.title}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${theme.dot}`} />
                            </div>
                            {task.startTime && (
                              <div className="flex items-center gap-1 text-[10px] opacity-80">
                                <Clock className="w-3 h-3" />
                                <span>{task.startTime} - {task.endTime || 'Fin'}</span>
                              </div>
                            )}
                            {task.assignedTo && (
                              <div className="flex items-center gap-1 text-[10px] opacity-80">
                                <User className="w-3 h-3" />
                                <span className="truncate">{task.assignedTo}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. VISTA DÍA (DAY) */}
        {viewMode === 'day' && (
          <div className="flex-1 p-6 flex flex-col max-w-4xl mx-auto w-full overflow-y-auto">
            <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-800/40 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-teal-900 dark:text-teal-200 capitalize">
                  {currentDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
                  {(tasksByDate.get(todayStr) || []).length} compromisos programados para este día.
                </p>
              </div>
              <button
                onClick={() => onOpenCreateModal(currentDate.toISOString().split('T')[0])}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Nuevo Compromiso
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(tasksByDate.get(currentDate.toISOString().split('T')[0]) || []).length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border-medium/30 rounded-3xl text-text-tertiary">
                  <CalendarIcon className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-bold">No hay actividades agendadas para este día.</p>
                  <button
                    onClick={() => onOpenCreateModal(currentDate.toISOString().split('T')[0])}
                    className="mt-3 text-xs font-bold text-teal-600 hover:underline"
                  >
                    + Agendar la primera actividad
                  </button>
                </div>
              ) : (
                (tasksByDate.get(currentDate.toISOString().split('T')[0]) || []).map((task) => {
                  const theme = getStatusTheme(task.status);
                  return (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-4 rounded-2xl border shadow-xs hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-4 ${theme.bg} ${theme.border}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                            {theme.label}
                          </span>
                          {task.startTime && (
                            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {task.startTime} a {task.endTime || '10:00'}
                            </span>
                          )}
                        </div>
                        <h4 className={`text-base font-bold text-text-primary ${theme.lineThrough}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
                          {task.assignedTo && (
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5" /> {task.assignedTo}
                            </span>
                          )}
                          {task.priority && (
                            <span className="capitalize font-semibold">Prioridad: {task.priority}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToGoogleCalendar(task);
                          }}
                          className="p-2 rounded-xl text-teal-600 hover:bg-teal-100/50 dark:hover:bg-teal-950/40"
                          title="Añadir a Google Calendar"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskDone(task);
                          }}
                          className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40"
                          title={task.status === 'done' ? 'Reabrir actividad' : 'Marcar como completada'}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. VISTA AGENDA / LISTA */}
        {viewMode === 'agenda' && (
          <div className="flex-1 p-6 max-w-4xl mx-auto w-full overflow-y-auto">
            <h3 className="text-base font-extrabold text-text-primary mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-500" />
              Cronograma Cronológico de Actividades
            </h3>

            <div className="flex flex-col gap-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-text-tertiary">
                  <CalendarIcon className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-bold">No se encontraron actividades con los filtros actuales.</p>
                </div>
              ) : (
                filteredTasks
                  .slice()
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((task) => {
                    const theme = getStatusTheme(task.status);
                    const taskDate = new Date(task.dueDate);
                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.bg} ${theme.border}`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-gray-950 border border-border-medium/30 text-center shrink-0 min-w-[55px]">
                            <span className="block text-[10px] font-bold uppercase text-text-tertiary">
                              {taskDate.toLocaleDateString('es-CO', { month: 'short' })}
                            </span>
                            <span className="block text-base font-black text-text-primary leading-tight">
                              {taskDate.getDate()}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                                {theme.label}
                              </span>
                              {task.actionType && (
                                <span className="text-[10px] font-semibold text-text-tertiary capitalize">
                                  {task.actionType}
                                </span>
                              )}
                            </div>
                            <h4 className={`text-sm font-bold text-text-primary ${theme.lineThrough}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-text-tertiary mt-1">
                              {task.startTime && <span>⏰ {task.startTime} - {task.endTime || '10:00'}</span>}
                              {task.assignedTo && <span>👤 {task.assignedTo}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToGoogleCalendar(task);
                            }}
                            className="p-2 rounded-xl text-teal-600 hover:bg-teal-100/50 dark:hover:bg-zinc-800"
                            title="Añadir a Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadIcs(task._id);
                            }}
                            className="p-2 rounded-xl text-text-secondary hover:bg-surface-secondary dark:hover:bg-zinc-800"
                            title="Descargar archivo .ics"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL DETALLES RÁPIDOS DE ACTIVIDAD ─── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del modal */}
            <div className="p-5 border-b border-border-medium/30 flex items-start justify-between gap-3 bg-surface-secondary/20 dark:bg-zinc-950/40">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusTheme(selectedTask.status).badge}`}>
                    {getStatusTheme(selectedTask.status).label}
                  </span>
                  {selectedTask.actionType && (
                    <span className="text-xs font-semibold text-text-tertiary capitalize">
                      {selectedTask.actionType}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-text-primary leading-tight">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="p-5 flex flex-col gap-4 text-xs">
              {/* Fecha y Hora */}
              <div className="p-3.5 rounded-2xl bg-surface-secondary/40 dark:bg-zinc-950/60 border border-border-medium/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="w-5 h-5 text-teal-500" />
                  <div>
                    <span className="block font-bold text-text-primary text-xs">
                      {new Date(selectedTask.dueDate).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      ⏰ Horario: {selectedTask.startTime || '09:00'} a {selectedTask.endTime || '10:00'} (Hora Colombia)
                    </span>
                  </div>
                </div>

                {/* Botón rápido cambiar fecha */}
                <input
                  type="date"
                  value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''}
                  onChange={async (e) => {
                    const newDate = e.target.value;
                    if (!newDate) return;
                    try {
                      await axios.post('/api/sgsst/kanban/save', {
                        _id: selectedTask._id,
                        dueDate: new Date(`${newDate}T12:00:00-05:00`).toISOString(),
                      });
                      setSelectedTask({ ...selectedTask, dueDate: newDate });
                      showToast({ message: 'Fecha reprogramada inmediatamente.', status: 'success' });
                      onTasksChange();
                    } catch (err) {
                      showToast({ message: 'Error al cambiar la fecha.', status: 'error' });
                    }
                  }}
                  className="px-2 py-1 rounded-xl border border-border-medium text-xs font-semibold bg-white dark:bg-gray-900 cursor-pointer"
                  title="Cambiar fecha inmediatamente"
                />
              </div>

              {/* Descripción */}
              {selectedTask.description && (
                <div>
                  <span className="font-extrabold text-text-secondary uppercase tracking-wider text-[10px] block mb-1">
                    Descripción y Alcance
                  </span>
                  <p className="text-text-primary bg-surface-secondary/30 dark:bg-zinc-950/30 p-3 rounded-xl border border-border-medium/20 leading-relaxed text-xs">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Responsable & Ubicación */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border-medium/30 bg-surface-secondary/20">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Asignado a:</span>
                  <span className="font-semibold text-text-primary mt-0.5 block truncate">
                    {selectedTask.assignedTo || 'Sin asignar'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border-medium/30 bg-surface-secondary/20">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Ubicación:</span>
                  <span className="font-semibold text-text-primary mt-0.5 block truncate">
                    {selectedTask.location || 'Oficinas SG-SST'}
                  </span>
                </div>
              </div>

              {/* Sincronización y Enlaces Rápidos */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border-medium/30">
                <div className="flex items-center gap-2">
                  {/* Google Calendar Link */}
                  <button
                    onClick={() => handleAddToGoogleCalendar(selectedTask)}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Añadir a Google Calendar
                  </button>

                  {/* Descargar .ics */}
                  <button
                    onClick={() => handleDownloadIcs(selectedTask._id)}
                    className="py-2 px-3 rounded-xl border border-border-medium font-bold text-text-primary hover:bg-surface-secondary transition-all flex items-center justify-center gap-1.5"
                    title="Descargar archivo iCalendar (.ics)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    .ICS
                  </button>
                </div>

                {/* Enviar Citación por Correo */}
                <button
                  onClick={() => {
                    setEmailRecipients(
                      selectedTask.emailAttendees && selectedTask.emailAttendees.length > 0
                        ? selectedTask.emailAttendees.join(', ')
                        : ''
                    );
                    setIsEmailModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Enviar Citación por Correo Electrónico
                </button>
              </div>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 border-t border-border-medium/30 bg-surface-secondary/20 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const id = selectedTask._id;
                  setSelectedTask(null);
                  onDeleteTask(id);
                }}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold transition-all flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const taskToEdit = selectedTask;
                    setSelectedTask(null);
                    onOpenEditModal(taskToEdit);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border-medium font-bold text-text-primary hover:bg-surface-secondary text-xs transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>

                <button
                  onClick={() => handleToggleTaskDone(selectedTask)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                    selectedTask.status === 'done'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedTask.status === 'done' ? 'Reabrir Tarea' : 'Completar Tarea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ENVIAR CORREO / CITACIÓN ─── */}
      {isEmailModalOpen && selectedTask && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border-medium/30 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-text-primary flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-500" />
                Enviar Citación SG-SST por Correo
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="p-5 flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Correos de Destinatarios (separados por coma):
                </label>
                <input
                  type="text"
                  required
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="ejemplo@empresa.com, colaborador2@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-border-medium/60 bg-surface-secondary/40 text-text-primary focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Mensaje personalizado adicional (opcional):
                </label>
                <textarea
                  rows={3}
                  value={emailCustomMessage}
                  onChange={(e) => setEmailCustomMessage(e.target.value)}
                  placeholder="Estimados colaboradores, su asistencia es indispensable para dar cumplimiento al estándar legal..."
                  className="w-full px-3 py-2 rounded-xl border border-border-medium/60 bg-surface-secondary/40 text-text-primary focus:ring-1 focus:ring-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 text-[11px] text-teal-800 dark:text-teal-300">
                ✨ El correo se enviará con formato oficial SG-SST, botón directo para agregar a Google Calendar y archivo <strong>.ics</strong> adjunto.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-text-secondary hover:bg-surface-secondary font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSendingEmail ? 'Enviando...' : 'Enviar Citación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL OVERFLOW: VER TODAS LAS TAREAS DE UN DÍA ─── */}
      {dayOverflowModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border-medium/30 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-text-primary">
                Actividades del {dayOverflowModal.dateStr}
              </h3>
              <button
                onClick={() => setDayOverflowModal(null)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {dayOverflowModal.tasks.map((task) => {
                const theme = getStatusTheme(task.status);
                return (
                  <div
                    key={task._id}
                    onClick={() => {
                      setDayOverflowModal(null);
                      setSelectedTask(task);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer hover:shadow-xs transition-all flex items-center justify-between ${theme.bg} ${theme.border} ${theme.text}`}
                  >
                    <span className="truncate">{task.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${theme.badge}`}>
                      {theme.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
