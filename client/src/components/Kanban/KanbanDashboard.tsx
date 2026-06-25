import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Pencil
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

interface KanbanTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'due_soon' | 'overdue' | 'done';
  dueDate: string;
  type: 'manual' | 'medical_exam' | 'soat' | 'rtm' | 'driver_license' | 'training' | 'other';
  referenceId?: string;
  referenceName?: string;
  companyId?: string;
  completedAt?: string;
  createdAt: string;
}

export default function KanbanDashboard() {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newType, setNewType] = useState<string>('manual');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [renewalDate, setRenewalDate] = useState<string>('');

  const getRenewalDetails = (task: KanbanTask) => {
    if (task.referenceId && task.referenceId.startsWith('training_session')) {
      return {
        title: 'Cierre de Sesión de Capacitación',
        label: 'Fecha de realización de la capacitación *',
        helper: 'Al registrar la realización, se cambiará el estado de la capacitación a "Completada" en tu cronograma.',
      };
    }
    if (task.referenceId && task.referenceId.includes('-bio-')) {
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

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/sgsst/kanban/data');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching Kanban tasks:', err);
      showToast({
        message: 'No se pudieron cargar las actividades del tablero.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTasks();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

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

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await axios.post('/api/sgsst/kanban/save', {
        _id: taskId,
        status: newStatus
      });
      showToast({
        message: `Actividad movida a ${getStatusLabel(newStatus)}`,
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

  const openCreateModal = () => {
    setEditingTask(null);
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewType('manual');
    setRenewalDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: KanbanTask) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDesc(task.description || '');
    const dateStr = task.dueDate.split('T')[0];
    setNewDueDate(dateStr);
    setNewType(task.type);
    setRenewalDate('');
    setIsModalOpen(true);
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
      if (editingTask) {
        // Edit mode
        const res = await axios.post('/api/sgsst/kanban/save', {
          _id: editingTask._id,
          title: newTitle,
          description: newDesc,
          dueDate: newDueDate,
          type: newType,
          status: editingTask.status,
          renewalDate: renewalDate || undefined
        });

        setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data : t));
        showToast({ message: 'Actividad actualizada correctamente.', status: 'success' });
      } else {
        // Create mode
        const res = await axios.post('/api/sgsst/kanban/save', {
          title: newTitle,
          description: newDesc,
          dueDate: newDueDate,
          type: newType,
          status: 'todo'
        });

        setTasks(prev => [...prev, res.data]);
        showToast({ message: 'Actividad programada correctamente.', status: 'success' });
      }
      setIsModalOpen(false);
      
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewType('manual');
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'Pendiente';
      case 'due_soon': return 'Próxima a vencer';
      case 'overdue': return 'Vencida';
      case 'done': return 'Completada';
      default: return status;
    }
  };

  // Restrict access for non-admins
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 bg-surface-secondary">
        <UpgradeWall 
          title="Acceso Exclusivo de Administrador" 
          description="El Tablero Kanban de programación y control predictivo de vencimientos está actualmente restringido para Administradores de Wappy." 
          plan="USER_IPEVAR"
        />
      </div>
    );
  }

  // Calculate stats
  const totalCount = tasks.length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const dueSoonCount = tasks.filter(t => t.status === 'due_soon').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  // Filter tasks into columns
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const dueSoonTasks = tasks.filter(t => t.status === 'due_soon');
  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Render type icon & badge
  const renderTaskBadge = (task: KanbanTask) => {
    let icon = <Clock className="w-3.5 h-3.5" />;
    let text = 'General';
    let color = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    let redirectPath = '';

    if (task.referenceId && task.referenceId.includes('-bio-')) {
      icon = <AlertTriangle className="w-3.5 h-3.5" />;
      text = 'Alerta Médica';
      color = 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/40';
      redirectPath = '/sgsst?tab=workers';
    } else if (task.referenceId && task.referenceId.startsWith('training_session')) {
      icon = <BookOpen className="w-3.5 h-3.5" />;
      text = 'Capacitación Programada';
      color = 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/40';
      redirectPath = '/sgsst?tab=capacitaciones';
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
      <div className="flex items-center justify-between gap-1.5 mt-2.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
          {icon}
          {text}
        </span>
        
        {redirectPath && task.status !== 'done' && (
          <a 
            href={redirectPath}
            className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 font-semibold"
          >
            Actualizar <ExternalLink className="w-2.5 h-2.5" />
          </a>
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-secondary/30">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            <Trello className="w-7 h-7 text-teal-500" />
            Tablero Kanban de Actividades
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Programación de actividades de seguridad y salud en el trabajo con control predictivo de vencimientos.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Nueva Actividad
        </button>
      </div>

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

      {/* Loading */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
          <Clock className="w-8 h-8 animate-spin text-teal-500 mb-2" />
          <span>Cargando tablero...</span>
        </div>
      ) : (
        /* Board columns container */
        <div className="flex-1 overflow-x-auto p-6 flex gap-6 select-none">
          {/* Column template */}
          {[
            { id: 'todo', title: 'Pendientes', tasks: todoTasks, border: 'border-t-4 border-t-gray-400', headerBg: 'bg-gray-500/10 text-gray-700 dark:text-gray-300' },
            { id: 'due_soon', title: 'Próximas a Vencer', tasks: dueSoonTasks, border: 'border-t-4 border-t-amber-500', headerBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
            { id: 'overdue', title: 'Vencidas (Alerta)', tasks: overdueTasks, border: 'border-t-4 border-t-rose-500', headerBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
            { id: 'done', title: 'Completadas', tasks: doneTasks, border: 'border-t-4 border-t-green-500', headerBg: 'bg-green-500/10 text-green-700 dark:text-green-400' }
          ].map(col => (
            <div 
              key={col.id}
              className={`flex-shrink-0 w-80 flex flex-col h-full bg-white/70 dark:bg-gray-900/70 border border-border-medium/35 rounded-2xl shadow-sm overflow-hidden ${col.border}`}
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
                  col.tasks.map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="p-3.5 bg-white dark:bg-gray-950 border border-border-medium/40 hover:border-teal-500/40 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[13px] text-text-primary leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-text-tertiary hover:text-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 rounded transition-all"
                              title="Editar actividad"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded transition-all"
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

                        {/* Reference name */}
                        {task.referenceName && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-tertiary font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            {task.referenceName}
                          </div>
                        )}
                      </div>

                      {/* Footer: Date & State badges */}
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

                        {/* Complete action quick button */}
                        {task.status !== 'done' && (
                          <button
                            onClick={() => {
                              if (task.type !== 'manual') {
                                openEditModal(task);
                              } else {
                                handleMarkComplete(task._id);
                              }
                            }}
                            className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1 bg-surface-tertiary hover:bg-green-500/10 hover:text-green-600 dark:hover:bg-green-950/20 dark:hover:text-green-400 rounded-lg text-[11px] font-bold text-text-secondary transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {task.type !== 'manual' ? 'Registrar Cierre / Renovación' : 'Marcar completado'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border-medium/30 transform duration-300 animate-in zoom-in-95">
            <div className="p-6 border-b border-border-medium/30">
              <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
                {editingTask ? <Pencil className="w-5 h-5 text-teal-500" /> : <Plus className="w-5 h-5 text-teal-500" />}
                {editingTask ? 'Editar Actividad' : 'Programar Actividad Manual'}
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                {editingTask ? 'Modifica los detalles de la tarjeta seleccionada.' : 'Crea una nueva tarjeta en tu plan de trabajo de seguridad y salud.'}
              </p>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Título de la Actividad *</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Inspección mensual de botiquines"
                  className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full disabled:opacity-65"
                  required
                  disabled={editingTask !== null && editingTask.type !== 'manual'}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Descripción (Opcional)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalles sobre la actividad a realizar..."
                  className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary min-h-[80px] w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary">Fecha Límite *</label>
                  <input 
                    type="date" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full disabled:opacity-65"
                    required
                    disabled={editingTask !== null && editingTask.type !== 'manual'}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary">Categoría</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="px-3.5 py-2.5 bg-surface-tertiary/40 border border-border-medium/40 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-text-primary w-full cursor-pointer disabled:opacity-65"
                    disabled={editingTask !== null && editingTask.type !== 'manual'}
                  >
                    <option value="manual">General / Manual</option>
                    <option value="training">Capacitación</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              {editingTask && editingTask.type !== 'manual' && (
                <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/30 rounded-2xl flex flex-col gap-3.5 mt-2 transition-all">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-extrabold text-teal-800 dark:text-teal-300">
                        {getRenewalDetails(editingTask.type).title}
                      </h3>
                      <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 leading-snug mt-0.5">
                        {getRenewalDetails(editingTask.type).helper}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1">
                      {getRenewalDetails(editingTask.type).label}
                    </label>
                    <input 
                      type="date" 
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="px-3.5 py-2.5 bg-white dark:bg-gray-950 border border-teal-500/40 focus:border-teal-500 rounded-xl text-sm focus:outline-none text-text-primary w-full shadow-inner transition-colors"
                    />
                    <p className="text-[9px] text-text-tertiary italic">
                      Nota: Al ingresar esta fecha y guardar, la actividad pasará a "Completadas" y se actualizará automáticamente en el módulo correspondiente.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-border-medium text-text-secondary hover:bg-surface-hover rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition"
                >
                  {isSaving ? 'Guardando...' : editingTask ? 'Guardar Cambios' : 'Programar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
