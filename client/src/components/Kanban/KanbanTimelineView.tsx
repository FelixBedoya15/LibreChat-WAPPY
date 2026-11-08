import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Plus,
  Check,
  User,
  Layers,
  ArrowRight,
  ArrowLeft,
  BarChart2,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  MessageSquare,
  FileCheck2,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import type { ACPMModalTab } from './KanbanTableView';

export interface TimelineKanbanTask {
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

interface KanbanTimelineViewProps {
  tasks: TimelineKanbanTask[];
  onOpenEditModal: (task: TimelineKanbanTask, initialTab?: ACPMModalTab) => void;
  onOpenCreateModal: (defaultDate?: string) => void;
  onMarkComplete: (id: string) => void;
  categoryInfo: Record<string, { label: string; color: string; bg: string }>;
  formatDate: (dateStr: string) => string;
  getDaysDiffText: (task: any) => string;
}

type ZoomMode = 'month' | 'quarter' | 'year';
type RowGroupMode = 'category' | 'flat';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export default function KanbanTimelineView({
  tasks,
  onOpenEditModal,
  onOpenCreateModal,
  categoryInfo,
  formatDate,
  getDaysDiffText,
}: KanbanTimelineViewProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const [zoomMode, setZoomMode] = useState<ZoomMode>('month');
  const [rowGroupMode, setRowGroupMode] = useState<RowGroupMode>('category');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // Calculate visible time window [rangeStart, rangeEnd] and header columns
  const { rangeStart, rangeEnd, columns, periodLabel, minTrackWidth } = useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();

    if (zoomMode === 'month') {
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const daysInMonth = end.getDate();
      const cols: {
        key: string;
        topLabel: string;
        subLabel: string;
        isToday: boolean;
        isWeekend: boolean;
      }[] = [];
      const now = new Date();

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        const dow = dt.getDay();
        const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        const isToday =
          now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
        cols.push({
          key: `d-${d}`,
          topLabel: String(d),
          subLabel: dayNames[dow],
          isToday,
          isWeekend: dow === 0 || dow === 6,
        });
      }

      return {
        rangeStart: start,
        rangeEnd: end,
        columns: cols,
        periodLabel: `${MONTH_NAMES[month]} ${year}`,
        minTrackWidth: Math.max(daysInMonth * 34, 880),
      };
    }

    if (zoomMode === 'quarter') {
      const quarterIndex = Math.floor(month / 3);
      const startMonth = quarterIndex * 3;
      const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
      const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

      const cols: {
        key: string;
        topLabel: string;
        subLabel: string;
        isToday: boolean;
        isWeekend: boolean;
      }[] = [];
      const totalMs = end.getTime() - start.getTime();
      const weekCount = 13;
      const stepMs = totalMs / weekCount;
      const nowMs = Date.now();

      for (let w = 0; w < weekCount; w++) {
        const wStart = new Date(start.getTime() + w * stepMs);
        const wEnd = new Date(start.getTime() + (w + 1) * stepMs);
        const isToday = nowMs >= wStart.getTime() && nowMs < wEnd.getTime();
        cols.push({
          key: `w-${w}`,
          topLabel: `Sem ${w + 1}`,
          subLabel: `${wStart.getDate()} ${SHORT_MONTHS[wStart.getMonth()]}`,
          isToday,
          isWeekend: false,
        });
      }

      return {
        rangeStart: start,
        rangeEnd: end,
        columns: cols,
        periodLabel: `T${quarterIndex + 1} ${year} (${SHORT_MONTHS[startMonth]} - ${SHORT_MONTHS[startMonth + 2]})`,
        minTrackWidth: 920,
      };
    }

    // zoomMode === 'year'
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    const now = new Date();
    const cols = MONTH_NAMES.map((mName, idx) => ({
      key: `m-${idx}`,
      topLabel: SHORT_MONTHS[idx],
      subLabel: mName,
      isToday: now.getFullYear() === year && now.getMonth() === idx,
      isWeekend: false,
    }));

    return {
      rangeStart: start,
      rangeEnd: end,
      columns: cols,
      periodLabel: `Año ${year}`,
      minTrackWidth: 880,
    };
  }, [anchorDate, zoomMode]);

  const handleNavigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) {
      setAnchorDate(new Date());
      return;
    }
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (zoomMode === 'month') {
        next.setMonth(next.getMonth() + dir);
      } else if (zoomMode === 'quarter') {
        next.setMonth(next.getMonth() + dir * 3);
      } else {
        next.setFullYear(next.getFullYear() + dir);
      }
      return next;
    });
  };

  // Position of "HOY" vertical line in %
  const todayMarkerPct = useMemo(() => {
    const nowMs = Date.now();
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    if (nowMs < startMs || nowMs > endMs) return null;
    return ((nowMs - startMs) / (endMs - startMs)) * 100;
  }, [rangeStart, rangeEnd]);

  // Calculate bar start/end dates and percentages for a task
  const computeTaskBar = (task: TimelineKanbanTask) => {
    const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : Date.now();
    const safeDueMs = Number.isNaN(dueMs) ? Date.now() : dueMs;
    const dayMs = 86400000;

    let startMs = safeDueMs - 7 * dayMs;
    if (task.createdAt) {
      const createdMs = new Date(task.createdAt).getTime();
      if (!Number.isNaN(createdMs)) {
        if (createdMs > safeDueMs - dayMs) {
          startMs = safeDueMs - 3 * dayMs;
        } else {
          startMs = Math.max(createdMs, safeDueMs - 25 * dayMs);
        }
      }
    }

    const endMs = Math.max(safeDueMs + 0.5 * dayMs, startMs + 1.5 * dayMs);

    const winStart = rangeStart.getTime();
    const winEnd = rangeEnd.getTime();
    const winSpan = Math.max(winEnd - winStart, 1);

    const overlaps = endMs >= winStart && startMs <= winEnd;
    if (!overlaps) {
      return {
        overlaps: false,
        isBefore: endMs < winStart,
        isAfter: startMs > winEnd,
        leftPct: 0,
        widthPct: 0,
        targetDate: new Date(safeDueMs),
      };
    }

    const clampedStart = Math.max(startMs, winStart);
    const clampedEnd = Math.min(endMs, winEnd);
    const leftPct = ((clampedStart - winStart) / winSpan) * 100;
    const rawWidthPct = ((clampedEnd - clampedStart) / winSpan) * 100;
    const widthPct = Math.min(Math.max(rawWidthPct, 4.5), 100 - leftPct);

    return {
      overlaps: true,
      isBefore: false,
      isAfter: false,
      leftPct,
      widthPct,
      targetDate: new Date(safeDueMs),
    };
  };

  const getBarGradientClass = (status: TimelineKanbanTask['status']) => {
    switch (status) {
      case 'done':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20';
      case 'overdue':
        return 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/25';
      case 'due_soon':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20';
      case 'todo':
      default:
        return 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-teal-500/20';
    }
  };

  const groupedRows = useMemo(() => {
    const sorted = [...safeTasks].sort((a, b) => {
      const tA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const tB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return tA - tB;
    });

    if (rowGroupMode === 'flat') {
      return [
        {
          key: 'all',
          label: 'Cronograma General de Actividades',
          tasks: sorted,
        },
      ];
    }

    const map = new Map<string, { key: string; label: string; tasks: TimelineKanbanTask[] }>();
    sorted.forEach((t) => {
      const key = t.type || 'manual';
      const label = categoryInfo[key]?.label || t.sourceModule || 'Tareas Generales';
      if (!map.has(key)) {
        map.set(key, { key, label, tasks: [] });
      }
      map.get(key)!.tasks.push(t);
    });
    return Array.from(map.values());
  }, [safeTasks, rowGroupMode, categoryInfo]);

  return (
    <div
      data-tenshi-timeline="acpm"
      className="flex-1 flex flex-col px-4 sm:px-6 py-4 gap-3 min-w-0"
    >
      {/* Barra Superior de Escala y Navegación del Gantt (Estética WAPPY + ExpandableButton) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border-medium/30 shadow-sm">
        {/* Navegación de Periodo con ExpandableButton */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ExpandableButton
            onClick={() => handleNavigate(-1)}
            variant="neutral"
            size="sm"
            icon={<ChevronLeft className="w-4 h-4" />}
            label="Anterior"
            title="Periodo anterior"
          />
          <ExpandableButton
            onClick={() => handleNavigate(0)}
            variant="teal"
            size="sm"
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Ir a Hoy"
            title="Centrar en la fecha de hoy"
          />
          <ExpandableButton
            onClick={() => handleNavigate(1)}
            variant="neutral"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
            label="Siguiente"
            title="Periodo siguiente"
          />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 ml-1">
            <Calendar className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black tracking-tight">{periodLabel}</h3>
          </div>
        </div>

        {/* Selectores de Escala Temporal y Agrupación con ExpandableButton */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ExpandableButton
            onClick={() => setRowGroupMode('category')}
            variant="teal"
            isActive={rowGroupMode === 'category'}
            size="sm"
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Por Módulo SST"
            title="Agrupar filas por Módulo / Categoría SG-SST"
          />
          <ExpandableButton
            onClick={() => setRowGroupMode('flat')}
            variant="indigo"
            isActive={rowGroupMode === 'flat'}
            size="sm"
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            label="Lista Continua"
            title="Ver lista cronológica continua"
          />

          <span className="h-5 w-[1px] bg-border-medium/40 mx-1 hidden sm:inline-block" />

          <ExpandableButton
            onClick={() => setZoomMode('month')}
            variant="cyan"
            isActive={zoomMode === 'month'}
            size="sm"
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Vista Mensual"
            title="Escala Mensual (Día por día)"
          />
          <ExpandableButton
            onClick={() => setZoomMode('quarter')}
            variant="purple"
            isActive={zoomMode === 'quarter'}
            size="sm"
            icon={<CalendarRange className="w-3.5 h-3.5" />}
            label="Vista Trimestral"
            title="Escala Trimestral (Por semanas)"
          />
          <ExpandableButton
            onClick={() => setZoomMode('year')}
            variant="amber"
            isActive={zoomMode === 'year'}
            size="sm"
            icon={<CalendarClock className="w-3.5 h-3.5" />}
            label="Vista Anual"
            title="Escala Anual (12 meses)"
          />

          <ExpandableButton
            onClick={() => onOpenCreateModal()}
            variant="emerald"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Programar Hito"
            title="Programar nueva actividad en el cronograma"
          />
        </div>
      </div>

      {/* Contenedor Principal del Gantt (WAPPY Glassmorphism) */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border-medium/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {safeTasks.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
            <Calendar className="w-9 h-9 text-teal-500 opacity-40" />
            <p className="text-xs font-bold text-text-secondary">
              No hay actividades para proyectar en el Cronograma Gantt
            </p>
            <ExpandableButton
              onClick={() => onOpenCreateModal()}
              variant="emerald"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              label="Programar primera actividad"
            />
          </div>
        ) : (
          <div className="flex min-w-0 overflow-hidden">
            {/* Panel Izquierdo Fijo: Actividades y Metadatos */}
            <div className="w-60 sm:w-76 md:w-84 shrink-0 border-r border-border-medium/40 bg-surface-primary/90 dark:bg-gray-900/90 flex flex-col z-10">
              {/* Cabecera Izquierda */}
              <div className="h-14 px-3.5 border-b border-border-medium/40 bg-surface-secondary/40 dark:bg-gray-950/60 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">
                  Actividad / Seguimiento
                </span>
                <span className="px-2 py-0.5 rounded-xl text-[10px] font-extrabold bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
                  {safeTasks.length}
                </span>
              </div>

              {/* Filas Izquierdas */}
              <div className="divide-y divide-border-medium/25">
                {groupedRows.map((grp) => {
                  const isCollapsed = Boolean(collapsedCategories[grp.key]);
                  const grpDone = grp.tasks.filter((t) => t.status === 'done').length;
                  const grpPct =
                    grp.tasks.length > 0 ? Math.round((grpDone / grp.tasks.length) * 100) : 0;

                  return (
                    <React.Fragment key={grp.key}>
                      {rowGroupMode === 'category' && (
                        <div
                          onClick={() => toggleCategory(grp.key)}
                          className="h-9 px-3 bg-surface-secondary/70 dark:bg-gray-950/80 flex items-center justify-between cursor-pointer hover:bg-surface-secondary select-none"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                            )}
                            <span className="text-[11px] font-extrabold text-text-primary truncate">
                              {grp.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 shrink-0">
                            {grpDone}/{grp.tasks.length} ({grpPct}%)
                          </span>
                        </div>
                      )}

                      {!isCollapsed &&
                        grp.tasks.map((task) => {
                          const isDone = task.status === 'done';
                          const obsCount = Array.isArray(task.observations)
                            ? task.observations.length
                            : 0;
                          const isResched =
                            Boolean(task.isRescheduled) ||
                            (Array.isArray(task.rescheduleHistory) &&
                              task.rescheduleHistory.length > 0);

                          return (
                            <div
                              key={task._id}
                              onClick={() => onOpenEditModal(task, 'details')}
                              className="h-14 px-3 flex items-center justify-between gap-2 hover:bg-teal-500/[0.04] cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditModal(task, 'closure');
                                  }}
                                  className={`w-6 h-6 rounded-xl shrink-0 inline-flex items-center justify-center border transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-teal-500/10 border-teal-500/30 text-teal-600/40 hover:text-teal-600'
                                  }`}
                                  title={
                                    isDone
                                      ? 'Ver evidencia de cierre ACPM'
                                      : 'Registrar cierre ACPM'
                                  }
                                >
                                  <Check className="w-3 h-3" />
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`text-xs font-bold truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 ${
                                      isDone
                                        ? 'line-through text-text-tertiary'
                                        : 'text-text-primary'
                                    }`}
                                  >
                                    {task.title?.trim() || 'Actividad sin título'}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary mt-0.5">
                                    <span className="inline-flex items-center gap-0.5 truncate max-w-[95px]">
                                      <User className="w-2.5 h-2.5 text-teal-500 shrink-0" />
                                      {task.assignedTo?.trim() || 'Sin asignar'}
                                    </span>
                                    <span>·</span>
                                    <span className="font-semibold shrink-0">
                                      {formatDate(task.dueDate)}
                                    </span>
                                    {obsCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenEditModal(task, 'observations');
                                        }}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold cursor-pointer"
                                        title="Ver observaciones"
                                      >
                                        <MessageSquare className="w-2.5 h-2.5" />
                                        {obsCount}
                                      </button>
                                    )}
                                    {isResched && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenEditModal(task, 'reschedule');
                                        }}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold cursor-pointer"
                                        title="Reprogramada"
                                      >
                                        <CalendarClock className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`w-2.5 h-2.5 rounded-md shrink-0 ${
                                  task.status === 'done'
                                    ? 'bg-emerald-500'
                                    : task.status === 'overdue'
                                      ? 'bg-rose-500'
                                      : task.status === 'due_soon'
                                        ? 'bg-amber-500 animate-pulse'
                                        : 'bg-teal-500'
                                }`}
                                title={getDaysDiffText(task)}
                              />
                            </div>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Panel Derecho con Scroll Horizontal: Pista de Tiempo y Barras Gantt */}
            <div className="flex-1 overflow-x-auto relative">
              <div style={{ minWidth: `${minTrackWidth}px` }} className="flex flex-col relative">
                {/* Cabecera de Escala Temporal */}
                <div className="h-14 border-b border-border-medium/40 bg-surface-secondary/40 dark:bg-gray-950/60 flex">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className={`flex-1 border-r border-border-medium/20 flex flex-col items-center justify-center text-center select-none ${
                        col.isToday
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black'
                          : col.isWeekend
                            ? 'bg-surface-secondary/50 dark:bg-gray-950/80 text-text-tertiary'
                            : 'text-text-secondary'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold leading-tight">
                        {col.topLabel}
                      </span>
                      <span className="text-[9px] font-semibold opacity-75 leading-tight">
                        {col.subLabel}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Línea vertical indicadora de HOY */}
                {todayMarkerPct !== null && (
                  <div
                    style={{ left: `${todayMarkerPct}%` }}
                    className="absolute top-0 bottom-0 w-[2px] bg-emerald-500 z-20 pointer-events-none"
                  >
                    <div className="sticky top-1 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[9px] font-black text-white shadow-sm uppercase tracking-wider">
                      HOY
                    </div>
                  </div>
                )}

                {/* Filas de Barras del Cronograma */}
                <div className="divide-y divide-border-medium/25 relative">
                  {groupedRows.map((grp) => {
                    const isCollapsed = Boolean(collapsedCategories[grp.key]);

                    return (
                      <React.Fragment key={grp.key}>
                        {rowGroupMode === 'category' && (
                          <div className="h-9 bg-surface-secondary/40 dark:bg-gray-950/50 flex items-center px-3">
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                              {grp.label} ({grp.tasks.length})
                            </span>
                          </div>
                        )}

                        {!isCollapsed &&
                          grp.tasks.map((task) => {
                            const bar = computeTaskBar(task);
                            return (
                              <div
                                key={task._id}
                                className="h-14 relative flex items-center hover:bg-teal-500/[0.02] transition-colors"
                              >
                                {/* Líneas guía verticales de fondo */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {columns.map((col) => (
                                    <div
                                      key={col.key}
                                      className={`flex-1 border-r border-border-medium/15 ${
                                        col.isWeekend
                                          ? 'bg-surface-secondary/20 dark:bg-gray-950/30'
                                          : ''
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Barra de Tarea o Botón WAPPY para Saltar a la Fecha */}
                                {bar.overlaps ? (
                                  <div
                                    style={{
                                      left: `${bar.leftPct}%`,
                                      width: `${bar.widthPct}%`,
                                    }}
                                    onClick={() => onOpenEditModal(task, 'details')}
                                    title={`${task.title} · Vence: ${formatDate(task.dueDate)} (${getDaysDiffText(task)})${
                                      task.closureDetails?.howItWasClosed
                                        ? ` · Cierre: ${task.closureDetails.howItWasClosed}`
                                        : ''
                                    }`}
                                    className={`absolute h-8 rounded-xl px-2.5 flex items-center justify-between gap-2 cursor-pointer shadow-md hover:scale-[1.01] hover:brightness-105 transition-all z-10 overflow-hidden ${getBarGradientClass(
                                      task.status,
                                    )}`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {task.closureDetails?.howItWasClosed && (
                                        <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                                      )}
                                      <span className="text-[11px] font-extrabold truncate">
                                        {task.title?.trim() || 'Actividad'}
                                      </span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                                      {task.priority && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[9px] font-black uppercase">
                                          {task.priority}
                                        </span>
                                      )}
                                      <span className="text-[10px] font-bold opacity-95">
                                        {formatDate(task.dueDate)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full px-4 flex items-center justify-between z-10">
                                    {bar.isBefore ? (
                                      <ExpandableButton
                                        onClick={() => setAnchorDate(bar.targetDate)}
                                        variant="cyan"
                                        size="sm"
                                        icon={<ArrowLeft className="w-3.5 h-3.5" />}
                                        label={`Ir a ${formatDate(task.dueDate)}`}
                                        title={`Saltar a la fecha límite: ${formatDate(task.dueDate)}`}
                                      />
                                    ) : (
                                      <div />
                                    )}

                                    {bar.isAfter && (
                                      <div className="ml-auto">
                                        <ExpandableButton
                                          onClick={() => setAnchorDate(bar.targetDate)}
                                          variant="cyan"
                                          size="sm"
                                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                                          label={`Ver en ${formatDate(task.dueDate)}`}
                                          title={`Saltar a la fecha programada: ${formatDate(task.dueDate)}`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda Ejecutiva Inferior WAPPY */}
        <div className="px-4 py-3 border-t border-border-medium/40 bg-surface-secondary/30 dark:bg-gray-950/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-text-secondary">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-teal-500 to-cyan-600" />
              Pendiente
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-orange-500" />
              Próxima a vencer
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-rose-500 to-red-600" />
              Vencida (Alerta)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600" />
              Completada
            </span>
          </div>

          <span className="text-[10px] text-text-tertiary">
            Haz clic sobre cualquier barra o actividad para editar, reprogramar o registrar cierre
          </span>
        </div>
      </div>
    </div>
  );
}
