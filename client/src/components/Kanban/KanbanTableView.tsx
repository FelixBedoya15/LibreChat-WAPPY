import React, { useState, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ExternalLink,
  ClipboardCheck,
  Stethoscope,
  Briefcase,
  ShieldAlert,
  Wrench,
  Activity,
  Car,
  BookOpen,
  List,
  Flag,
  Tag,
} from 'lucide-react';
import ExpandableButton, { ExpandableButtonVariant } from '~/components/Common/ExpandableButton';

export interface TableKanbanTask {
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
  location?: string;
}

interface KanbanTableViewProps {
  tasks: TableKanbanTask[];
  onOpenEditModal: (task: TableKanbanTask) => void;
  onDeleteTask: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onStatusChange: (id: string, newStatus: 'todo' | 'due_soon' | 'overdue' | 'done') => void;
  onPriorityChange: (id: string, newPriority: 'alta' | 'media' | 'baja') => void;
  onOpenCreateModal: (defaultDate?: string) => void;
  categoryInfo: Record<string, { label: string; color: string; bg: string }>;
  formatDate: (dateStr: string) => string;
  getDaysDiffText: (task: any) => string;
  renderTaskBadge?: (task: any) => React.ReactNode;
}

type GroupByOption = 'none' | 'status' | 'priority' | 'actionType' | 'type' | 'assignedTo';
type SortField = 'title' | 'status' | 'priority' | 'actionType' | 'type' | 'assignedTo' | 'dueDate';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = {
  overdue: 1,
  due_soon: 2,
  todo: 3,
  done: 4,
};

const PRIORITY_ORDER: Record<string, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};

export default function KanbanTableView({
  tasks,
  onOpenEditModal,
  onDeleteTask,
  onMarkComplete,
  onStatusChange,
  onPriorityChange,
  onOpenCreateModal,
  categoryInfo,
  formatDate,
  getDaysDiffText,
}: KanbanTableViewProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getOriginRedirectPath = (task: TableKanbanTask): string => {
    const refId = task.referenceId || '';
    if (refId.includes('-bio-') || refId.includes('-biocentric')) return '/sgsst?tab=workers';
    if (refId.startsWith('training_session')) return '/sgsst?tab=capacitaciones';
    switch (task.type) {
      case 'audit_finding':
        return '/sgsst?tab=auditoria';
      case 'diagnostico_finding':
        return '/sgsst?tab=diagnostico';
      case 'alta_direccion_finding':
        return '/sgsst?tab=alta_direccion';
      case 'unsafe_act_finding':
        return '/sgsst?tab=reporte_actos';
      case 'ipevar_finding':
        return '/sgsst?tab=matriz_ipevar_oficial';
      case 'atel_finding':
        return '/sgsst?tab=investigacion_atel';
      case 'ats_finding':
        return '/sgsst?tab=analisis_trabajo_seguro';
      case 'alturas_finding':
        return '/sgsst?tab=permiso_alturas';
      case 'ergonomia_finding':
        return '/sgsst?tab=metodo_owas';
      case 'vulnerabilidad_finding':
        return '/sgsst?tab=vulnerabilidad';
      case 'pesv_inspection_finding':
        return '/sgsst?tab=vehicles_pesv';
      case 'heights_inspection_finding':
        return '/sgsst?tab=heights_lifecycle';
      case 'medical_exam':
      case 'driver_license':
        return '/sgsst?tab=workers';
      case 'soat':
      case 'rtm':
        return '/sgsst?tab=vehicles';
      case 'training':
        return '/sgsst?tab=capacitaciones';
      default:
        return '';
    }
  };

  const getModuleMeta = (task: TableKanbanTask) => {
    const refId = task.referenceId || '';
    if (refId.includes('-bio-') || refId.includes('-biocentric')) {
      return {
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
        label: 'Alerta Médica',
        badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      };
    }
    if (refId.startsWith('training_session') || task.type === 'training') {
      return {
        icon: <BookOpen className="w-3.5 h-3.5 text-teal-500" />,
        label: 'Capacitaciones SST',
        badgeClass: 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300',
      };
    }
    switch (task.type) {
      case 'audit_finding':
        return {
          icon: <ClipboardCheck className="w-3.5 h-3.5 text-purple-500" />,
          label: 'Auditoría SG-SST',
          badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
        };
      case 'diagnostico_finding':
        return {
          icon: <Stethoscope className="w-3.5 h-3.5 text-cyan-500" />,
          label: 'Diagnóstico Inicial',
          badgeClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
        };
      case 'alta_direccion_finding':
        return {
          icon: <Briefcase className="w-3.5 h-3.5 text-indigo-500" />,
          label: 'Alta Dirección',
          badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
        };
      case 'unsafe_act_finding':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />,
          label: 'Actos y Condiciones',
          badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
        };
      case 'ipevar_finding':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Controles IPEVR (GTC 45)',
          badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
        };
      case 'atel_finding':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Investigación ATEL',
          badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
        };
      case 'ats_finding':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />,
          label: 'Análisis Trabajo Seguro',
          badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
        };
      case 'alturas_finding':
      case 'heights_inspection_finding':
        return {
          icon: <Wrench className="w-3.5 h-3.5 text-amber-500" />,
          label: 'Trabajo en Alturas',
          badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
        };
      case 'ergonomia_finding':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-sky-500" />,
          label: 'Ergonomía (OWAS/EPT)',
          badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300',
        };
      case 'vulnerabilidad_finding':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Plan de Emergencias',
          badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        };
      case 'pesv_inspection_finding':
      case 'soat':
      case 'rtm':
        return {
          icon: <Car className="w-3.5 h-3.5 text-purple-500" />,
          label: categoryInfo[task.type]?.label || 'Vial / PESV',
          badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
        };
      case 'medical_exam':
      case 'driver_license':
        return {
          icon: <User className="w-3.5 h-3.5 text-blue-500" />,
          label: categoryInfo[task.type]?.label || 'Salud / Trabajador',
          badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
          label: categoryInfo[task.type]?.label || task.sourceModule || 'Tareas Generales',
          badgeClass: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300',
        };
    }
  };

  const sortedTasks = useMemo(() => {
    const list = [...safeTasks];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = (a.title?.trim() || '').localeCompare(b.title?.trim() || '', 'es');
          break;
        case 'status':
          cmp = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
          break;
        case 'priority':
          cmp =
            (PRIORITY_ORDER[a.priority || 'media'] || 2) -
            (PRIORITY_ORDER[b.priority || 'media'] || 2);
          break;
        case 'actionType':
          cmp = (a.actionType || 'correctiva').localeCompare(b.actionType || 'correctiva', 'es');
          break;
        case 'type': {
          const labelA = categoryInfo[a.type]?.label || a.type || '';
          const labelB = categoryInfo[b.type]?.label || b.type || '';
          cmp = labelA.localeCompare(labelB, 'es');
          break;
        }
        case 'assignedTo':
          cmp = (a.assignedTo?.trim() || 'ZZZ').localeCompare(b.assignedTo?.trim() || 'ZZZ', 'es');
          break;
        case 'dueDate':
        default: {
          const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          cmp = timeA - timeB;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [safeTasks, sortField, sortDir, categoryInfo]);

  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return [
        {
          key: 'all',
          label: 'Todas las actividades',
          items: sortedTasks,
        },
      ];
    }

    const groupsMap = new Map<string, { key: string; label: string; items: TableKanbanTask[] }>();

    sortedTasks.forEach((task) => {
      let key = 'other';
      let label = 'Otros';

      if (groupBy === 'status') {
        key = task.status || 'todo';
        label =
          key === 'overdue'
            ? '🚨 Vencidas (Alerta)'
            : key === 'due_soon'
              ? '⏳ Próximas a Vencer'
              : key === 'done'
                ? '✅ Completadas'
                : '📌 Pendientes';
      } else if (groupBy === 'priority') {
        key = task.priority || 'media';
        label =
          key === 'alta'
            ? '🔴 Prioridad Alta'
            : key === 'baja'
              ? '🟢 Prioridad Baja'
              : '🟡 Prioridad Media';
      } else if (groupBy === 'actionType') {
        key = task.actionType || 'correctiva';
        label =
          key === 'preventiva'
            ? '🛡️ Acción Preventiva'
            : key === 'mejora'
              ? '🚀 Acción de Mejora'
              : '🔧 Acción Correctiva';
      } else if (groupBy === 'type') {
        key = task.type || 'manual';
        label = categoryInfo[key]?.label || task.sourceModule || 'Tareas Generales';
      } else if (groupBy === 'assignedTo') {
        const resp = task.assignedTo?.trim() || '';
        key = resp || 'unassigned';
        label = resp ? `👤 ${resp}` : '👤 Sin asignar';
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { key, label, items: [] });
      }
      groupsMap.get(key)!.items.push(task);
    });

    return Array.from(groupsMap.values());
  }, [sortedTasks, groupBy, categoryInfo]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-90 transition-opacity" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-teal-600 dark:text-teal-400" />
    );
  };

  const totalRows = safeTasks.length;
  const doneRows = safeTasks.filter((t) => t.status === 'done').length;
  const overdueRows = safeTasks.filter((t) => t.status === 'overdue').length;
  const donePct = totalRows > 0 ? Math.round((doneRows / totalRows) * 100) : 0;

  const groupOptions: {
    id: GroupByOption;
    label: string;
    icon: React.ReactNode;
    variant: ExpandableButtonVariant;
  }[] = [
    { id: 'none', label: 'Sin agrupar', icon: <List className="w-3.5 h-3.5" />, variant: 'neutral' },
    { id: 'status', label: 'Por Estado', icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: 'teal' },
    { id: 'priority', label: 'Por Prioridad', icon: <Flag className="w-3.5 h-3.5" />, variant: 'amber' },
    { id: 'actionType', label: 'Por Tipo ACPM', icon: <Tag className="w-3.5 h-3.5" />, variant: 'purple' },
    { id: 'type', label: 'Por Módulo SST', icon: <Layers className="w-3.5 h-3.5" />, variant: 'cyan' },
    { id: 'assignedTo', label: 'Por Responsable', icon: <User className="w-3.5 h-3.5" />, variant: 'indigo' },
  ];

  return (
    <div
      data-tenshi-table="acpm"
      className="flex-1 flex flex-col px-4 sm:px-6 py-4 gap-3 min-w-0"
    >
      {/* Sub-barra Notion de Agrupación y Controles (WAPPY Glassmorphism + ExpandableButton) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border-medium/30 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-text-secondary uppercase tracking-wider mr-1">
            <Layers className="w-3.5 h-3.5 text-teal-500" />
            Agrupar:
          </span>
          {groupOptions.map((opt) => (
            <ExpandableButton
              key={opt.id}
              onClick={() => setGroupBy(opt.id)}
              variant={groupBy === opt.id ? 'teal' : opt.variant}
              isActive={groupBy === opt.id}
              size="sm"
              icon={opt.icon}
              label={opt.label}
              title={`Agrupar tabla: ${opt.label}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ExpandableButton
            onClick={() => onOpenCreateModal()}
            variant="emerald"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Nueva Fila"
            title="Crear nueva actividad en la base de datos"
          />
        </div>
      </div>

      {/* Contenedor Tabla Base de Datos estilo Notion + WAPPY Glassmorphism */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border-medium/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-border-medium/40 bg-surface-secondary/40 dark:bg-gray-950/60 text-[11px] font-extrabold text-text-secondary uppercase tracking-wider select-none">
                <th className="py-3 px-3 w-11 text-center">✓</th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors min-w-[260px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Actividad / Compromiso</span>
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-40"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Prioridad</span>
                    {renderSortIcon('priority')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('actionType')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tipo ACPM</span>
                    {renderSortIcon('actionType')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('type')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Módulo / Origen</span>
                    {renderSortIcon('type')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assignedTo')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-40"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Responsable</span>
                    {renderSortIcon('assignedTo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className="py-3 px-3 cursor-pointer group hover:bg-surface-secondary/70 transition-colors w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Fecha Límite</span>
                    {renderSortIcon('dueDate')}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-medium/25 text-xs">
              {totalRows === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-tertiary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Calendar className="w-8 h-8 opacity-30 text-teal-500" />
                      <p className="text-xs font-bold text-text-secondary">
                        No se encontraron actividades con los filtros actuales
                      </p>
                      <ExpandableButton
                        onClick={() => onOpenCreateModal()}
                        variant="emerald"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        label="Crear primera actividad"
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                groupedData.map((group) => {
                  const isCollapsed = Boolean(collapsedGroups[group.key]);
                  const grpDone = group.items.filter((i) => i.status === 'done').length;
                  const grpPct =
                    group.items.length > 0 ? Math.round((grpDone / group.items.length) * 100) : 0;

                  return (
                    <React.Fragment key={group.key}>
                      {groupBy !== 'none' && (
                        <tr
                          onClick={() => toggleGroup(group.key)}
                          className="bg-surface-secondary/60 dark:bg-gray-950/80 hover:bg-surface-secondary cursor-pointer select-none transition-colors"
                        >
                          <td colSpan={9} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                                )}
                                <span className="font-extrabold text-xs text-text-primary">
                                  {group.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-xl text-[10px] font-extrabold bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
                                  {group.items.length}{' '}
                                  {group.items.length === 1 ? 'actividad' : 'actividades'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-text-tertiary">
                                  {grpDone}/{group.items.length} completadas ({grpPct}%)
                                </span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                                  <div
                                    style={{ width: `${grpPct}%` }}
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!isCollapsed &&
                        group.items.map((task) => {
                          const isDone = task.status === 'done';
                          const moduleMeta = getModuleMeta(task);
                          const originLink = getOriginRedirectPath(task);
                          const priorityVal = task.priority || 'media';
                          const actionTypeVal = task.actionType || 'correctiva';

                          return (
                            <tr
                              key={task._id}
                              data-tenshi-row={task._id}
                              className={`group hover:bg-teal-500/[0.03] dark:hover:bg-teal-500/[0.05] transition-colors ${
                                isDone ? 'opacity-75 bg-surface-secondary/10' : ''
                              }`}
                            >
                              {/* 1. Check rápido estilo WAPPY */}
                              <td className="py-3 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDone) {
                                      onStatusChange(task._id, 'todo');
                                    } else if (task.type !== 'manual') {
                                      onOpenEditModal(task);
                                    } else {
                                      onMarkComplete(task._id);
                                    }
                                  }}
                                  title={
                                    isDone
                                      ? 'Reabrir actividad'
                                      : task.type !== 'manual'
                                        ? 'Registrar cierre / renovación'
                                        : 'Marcar como completada'
                                  }
                                  className={`w-7 h-7 rounded-xl inline-flex items-center justify-center border transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-teal-500/10 border-teal-500/30 text-teal-600/40 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-500/20'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </td>

                              {/* 2. Actividad / Descripción */}
                              <td className="py-3 px-3 align-middle">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onOpenEditModal(task)}
                                      className={`text-left font-bold text-xs sm:text-[13px] hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer ${
                                        isDone
                                          ? 'line-through text-text-tertiary'
                                          : 'text-text-primary'
                                      }`}
                                    >
                                      {task.title?.trim() || 'Actividad sin título'}
                                    </button>
                                  </div>

                                  {task.description && (
                                    <p className="text-[11px] text-text-secondary line-clamp-1">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    {task.referenceName &&
                                      task.referenceName !== 'group_invitation' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                          <span className="w-1.5 h-1.5 rounded-sm bg-teal-500" />
                                          {task.referenceName}
                                        </span>
                                      )}
                                    {originLink && !isDone && (
                                      <a
                                        href={originLink}
                                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                                      >
                                        Ver en origen <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 3. Estado (Selector rápido en línea) */}
                              <td className="py-3 px-3 align-middle">
                                <select
                                  value={task.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as
                                      | 'todo'
                                      | 'due_soon'
                                      | 'overdue'
                                      | 'done';
                                    if (nextStatus === 'done' && task.type !== 'manual') {
                                      onOpenEditModal(task);
                                      return;
                                    }
                                    onStatusChange(task._id, nextStatus);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border cursor-pointer focus:outline-none transition-all duration-300 sm:hover:scale-105 ${
                                    task.status === 'done'
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                      : task.status === 'overdue'
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                        : task.status === 'due_soon'
                                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                          : 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                                  }`}
                                >
                                  <option value="todo">📌 Pendiente</option>
                                  <option value="due_soon">⏳ Próxima</option>
                                  <option value="overdue">🚨 Vencida</option>
                                  <option value="done">✅ Completada</option>
                                </select>
                              </td>

                              {/* 4. Prioridad (Selector rápido en línea) */}
                              <td className="py-3 px-3 align-middle">
                                <select
                                  value={priorityVal}
                                  onChange={(e) =>
                                    onPriorityChange(
                                      task._id,
                                      e.target.value as 'alta' | 'media' | 'baja',
                                    )
                                  }
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all duration-300 sm:hover:scale-105 ${
                                    priorityVal === 'alta'
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                      : priorityVal === 'baja'
                                        ? 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  <option value="alta">Alta</option>
                                  <option value="media">Media</option>
                                  <option value="baja">Baja</option>
                                </select>
                              </td>

                              {/* 5. Tipo ACPM */}
                              <td className="py-3 px-3 align-middle">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize border ${
                                    actionTypeVal === 'preventiva'
                                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                                      : actionTypeVal === 'mejora'
                                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                                        : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300'
                                  }`}
                                >
                                  {actionTypeVal}
                                </span>
                              </td>

                              {/* 6. Módulo / Origen */}
                              <td className="py-3 px-3 align-middle">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${moduleMeta.badgeClass}`}
                                >
                                  {moduleMeta.icon}
                                  <span className="truncate max-w-[130px]">{moduleMeta.label}</span>
                                </span>
                              </td>

                              {/* 7. Responsable */}
                              <td className="py-3 px-3 align-middle">
                                <div className="flex items-center gap-1.5 text-text-secondary font-semibold">
                                  <User className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                  <span className="truncate max-w-[130px]">
                                    {task.assignedTo?.trim() || 'Sin asignar'}
                                  </span>
                                </div>
                              </td>

                              {/* 8. Fecha Límite y Vencimiento */}
                              <td className="py-3 px-3 align-middle">
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 font-bold text-text-primary">
                                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                  <span
                                    className={`inline-flex w-fit px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                                      task.status === 'overdue'
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                        : task.status === 'due_soon'
                                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                          : task.status === 'done'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-500/10 border-slate-500/30 text-text-secondary'
                                    }`}
                                  >
                                    {getDaysDiffText(task)}
                                  </span>
                                </div>
                              </td>

                              {/* 9. Acciones (Botones WAPPY ExpandableButton) */}
                              <td className="py-3 px-3 align-middle text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <ExpandableButton
                                    onClick={() => onOpenEditModal(task)}
                                    variant="orange"
                                    size="sm"
                                    icon={<Pencil className="w-3.5 h-3.5" />}
                                    label="Editar"
                                    title="Editar actividad"
                                  />
                                  <ExpandableButton
                                    onClick={() => onDeleteTask(task._id)}
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="w-3.5 h-3.5" />}
                                    label="Eliminar"
                                    title="Eliminar actividad"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla estilo Notion + Botón WAPPY */}
        <div className="px-4 py-3 border-t border-border-medium/40 bg-surface-secondary/30 dark:bg-gray-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <ExpandableButton
            onClick={() => onOpenCreateModal()}
            variant="emerald"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            label="Nueva fila / actividad"
            title="Añadir nueva fila / actividad"
          />

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-text-secondary">
            <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              Total filas: <strong>{totalRows}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completadas: <strong>{doneRows} ({donePct}%)</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              Vencidas: <strong>{overdueRows}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
