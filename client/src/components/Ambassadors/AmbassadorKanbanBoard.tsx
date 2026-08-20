import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  FileText,
  GripVertical,
  Calendar,
  Mail,
  Flame,
  Tag
} from 'lucide-react';
import { formatPlanBadge } from './AmbassadorContactModal';

export interface KanbanUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  registrationDate: string;
  lastActivity: string;
  daysInactive: number;
  subscriptionType?: string;
  planInterval?: string;
  planExpiresAt?: string | null;
  daysToExpiry?: number | null;
  trafficLight?: string;
  ambassadorName?: string;
  crmStage?: string;
  crmNotes?: Array<{
    id?: string;
    author?: string;
    text: string;
    type?: string;
    createdAt?: string | Date;
  }>;
  lastContactedAt?: string | null;
  nextFollowUpDate?: string | null;
}

export interface CrmStageConfig {
  key: string;
  label: string;
  shortLabel: string;
  badgeColor: string;
  headerColor: string;
  dropBorderColor: string;
  emoji: string;
  gradient: string;
}

export const CRM_STAGES: CrmStageConfig[] = [
  { 
    key: 'nuevo', 
    label: 'Nuevo Lead (Sin Contactar)', 
    shortLabel: 'Nuevos Leads', 
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', 
    headerColor: 'border-blue-500 text-blue-600 dark:text-blue-400', 
    dropBorderColor: 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20',
    emoji: '🌱',
    gradient: 'from-blue-500/10 to-transparent'
  },
  { 
    key: 'contactado', 
    label: 'Contactado', 
    shortLabel: 'Contactados', 
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20', 
    headerColor: 'border-indigo-500 text-indigo-600 dark:text-indigo-400', 
    dropBorderColor: 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20',
    emoji: '💬',
    gradient: 'from-indigo-500/10 to-transparent'
  },
  { 
    key: 'interesado', 
    label: 'Interesado / Negociación', 
    shortLabel: 'En Negociación', 
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', 
    headerColor: 'border-amber-500 text-amber-600 dark:text-amber-400', 
    dropBorderColor: 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20',
    emoji: '🔥',
    gradient: 'from-amber-500/10 to-transparent'
  },
  { 
    key: 'propuesta', 
    label: 'Propuesta Enviada', 
    shortLabel: 'Propuesta Enviada', 
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', 
    headerColor: 'border-purple-500 text-purple-600 dark:text-purple-400', 
    dropBorderColor: 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20',
    emoji: '📄',
    gradient: 'from-purple-500/10 to-transparent'
  },
  { 
    key: 'ganado', 
    label: 'Ganado / Suscrito PRO', 
    shortLabel: 'Suscritos PRO', 
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', 
    headerColor: 'border-emerald-500 text-emerald-600 dark:text-emerald-400', 
    dropBorderColor: 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20',
    emoji: '👑',
    gradient: 'from-emerald-500/10 to-transparent'
  },
  { 
    key: 'frio', 
    label: 'En Seguimiento / Frío', 
    shortLabel: 'Fríos / Pausa', 
    badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20', 
    headerColor: 'border-slate-500 text-slate-600 dark:text-slate-400', 
    dropBorderColor: 'border-slate-500 bg-slate-500/5 ring-2 ring-slate-500/20',
    emoji: '❄️',
    gradient: 'from-slate-500/10 to-transparent'
  },
  { 
    key: 'invalido', 
    label: 'No Aplica / Inválido', 
    shortLabel: 'Inválidos', 
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', 
    headerColor: 'border-rose-500 text-rose-600 dark:text-rose-400', 
    dropBorderColor: 'border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20',
    emoji: '❌',
    gradient: 'from-rose-500/10 to-transparent'
  },
];

interface AmbassadorKanbanBoardProps {
  users: KanbanUser[];
  onSelectUser: (user: KanbanUser) => void;
  onUpdateStage: (userId: string, stage: string, stageLabel?: string) => void;
  myReferralLink?: string;
}

export default function AmbassadorKanbanBoard({
  users,
  onSelectUser,
  onUpdateStage,
}: AmbassadorKanbanBoardProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggedUserId, setDraggedUserId] = useState<string | null>(null);

  // Drag & Drop Handlers (HTML5 Native Drag and Drop like Centro de Control)
  const handleDragStart = (e: React.DragEvent, userId: string) => {
    e.dataTransfer.setData('text/plain', userId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedUserId(userId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== stageKey) {
      setDragOverCol(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStageKey: string, stageLabel: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedUserId(null);
    const userId = e.dataTransfer.getData('text/plain');
    if (userId) {
      onUpdateStage(userId, targetStageKey, stageLabel);
    }
  };

  // Format date helper
  const formatDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-3">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs text-text-tertiary px-1 pb-1">
        <span className="flex items-center gap-1.5 font-medium">
          <GripVertical className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 animate-pulse" />
          <span>Arrastra y suelta las tarjetas directamente entre columnas para mover de etapa.</span>
        </span>
        <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
          {users.length} Contactos Totales
        </span>
      </div>

      {/* Horizontal Scrollable Kanban Columns - High Capacity Vertical Space */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[650px] scrollbar-thin">
        {CRM_STAGES.map((stage) => {
          const stageUsers = users.filter((u) => {
            const uStage = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
            return uStage === stage.key;
          });

          const isOver = dragOverCol === stage.key;

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key, stage.label)}
              className={`flex-shrink-0 w-[290px] sm:w-[320px] bg-white dark:bg-gray-900 border rounded-2xl p-3 shadow-sm flex flex-col min-h-[520px] max-h-[85vh] transition-all duration-200 ${
                isOver 
                  ? `${stage.dropBorderColor} scale-[1.01]` 
                  : 'border-border-medium/40 hover:border-border-medium/70'
              }`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between border-b-2 ${stage.headerColor} pb-2.5 mb-2.5 px-2 py-1 bg-gradient-to-b ${stage.gradient} rounded-t-xl`}>
                <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-text-primary tracking-tight">
                  <span className="text-base">{stage.emoji}</span>
                  <span className="truncate">{stage.shortLabel}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${stage.badgeColor}`}>
                  {stageUsers.length}
                </span>
              </div>

              {/* Cards Container - Expanded Vertical Scroll Area for Many Cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin min-h-[350px]">
                {stageUsers.length === 0 ? (
                  <div className={`py-16 text-center text-text-tertiary text-xs border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center gap-1 ${
                    isOver ? 'border-teal-500/60 bg-teal-500/10 text-teal-700 font-bold' : 'border-border-medium/30'
                  }`}>
                    <span>{isOver ? '🎯 Suelta aquí el lead' : 'Sin leads en esta etapa'}</span>
                    <span className="text-[10px] opacity-70">Arrastra una tarjeta aquí</span>
                  </div>
                ) : (
                  stageUsers.map((u) => {
                    const plan = formatPlanBadge(u.subscriptionType, u.planInterval);
                    const isBeingDragged = draggedUserId === (u.userId || u.id);
                    
                    const notes = u.crmNotes || [];
                    const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
                    const regDateStr = formatDateTime(u.registrationDate);
                    const lastContactDateStr = formatDateTime(u.lastContactedAt || lastNote?.createdAt);

                    return (
                      <div
                        key={u.id || u.userId}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, u.userId || u.id)}
                        className={`p-3 rounded-xl border bg-surface-primary transition-all shadow-xs cursor-grab active:cursor-grabbing group hover:shadow-md hover:border-teal-500/60 space-y-2 select-none ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed border-teal-500' : 'border-border-medium/40'
                        }`}
                      >
                        {/* 1. Header: Name + Plan Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div 
                            onClick={() => onSelectUser(u)}
                            className="cursor-pointer group-hover:text-teal-600 transition-colors min-w-0 flex-1"
                          >
                            <h4 className="font-extrabold text-xs text-text-primary group-hover:underline truncate flex items-center gap-1">
                              <GripVertical className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              <span>{u.name}</span>
                            </h4>
                            <p className="text-[10px] text-text-tertiary truncate mt-0.5">
                              {u.email}
                            </p>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shrink-0 ${plan.className}`}>
                            {plan.label}
                          </span>
                        </div>

                        {/* 2. Dates Section: Registration & Activity */}
                        <div className="bg-surface-secondary/60 rounded-lg p-2 text-[10px] space-y-1 border border-border-medium/20">
                          <div className="flex items-center justify-between text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-text-tertiary" />
                              <span>Registrado:</span>
                            </span>
                            <span className="font-semibold text-text-secondary">{regDateStr || 'Reciente'}</span>
                          </div>

                          <div className="flex items-center justify-between text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-text-tertiary" />
                              <span>Actividad:</span>
                            </span>
                            <span className="font-semibold text-text-secondary">
                              {u.daysInactive === 0 ? '🟢 Hoy' : `Hace ${u.daysInactive}d`}
                            </span>
                          </div>

                          {u.daysToExpiry !== null && u.daysToExpiry !== undefined && (
                            <div className="flex items-center justify-between pt-0.5 border-t border-border-medium/20">
                              <span className="text-text-tertiary">Vigencia:</span>
                              <span className={`font-bold ${u.daysToExpiry < 0 ? 'text-rose-600 dark:text-rose-400' : u.daysToExpiry <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {u.daysToExpiry < 0 ? `Venció hace ${Math.abs(u.daysToExpiry)}d` : `${u.daysToExpiry}d restantes`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3. Last CRM Interaction & Date */}
                        {lastNote ? (
                          <div className="bg-teal-500/5 dark:bg-teal-900/10 border border-teal-500/20 rounded-lg p-2 text-[10px] space-y-0.5">
                            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300 font-bold">
                              <span className="flex items-center gap-1">
                                <span>{lastNote.type === 'call' ? '📞' : lastNote.type === 'whatsapp' ? '💬' : lastNote.type === 'email' ? '📧' : lastNote.type === 'proposal' ? '📄' : lastNote.type === 'status_change' ? '🏷️' : '📝'}</span>
                                <span className="capitalize">{lastNote.type || 'Nota'}</span>
                              </span>
                              <span className="text-[9px] text-text-tertiary font-mono font-normal">
                                {formatDateTime(lastNote.createdAt) || 'Reciente'}
                              </span>
                            </div>
                            <p className="text-text-secondary line-clamp-2 italic">
                              "{lastNote.text}"
                            </p>
                          </div>
                        ) : lastContactDateStr ? (
                          <div className="text-[10px] text-text-tertiary flex items-center justify-between bg-surface-secondary/40 p-1.5 rounded-lg">
                            <span>Último contacto:</span>
                            <span className="font-semibold text-text-secondary">{lastContactDateStr}</span>
                          </div>
                        ) : null}

                        {/* 4. Action Bar (WhatsApp + CRM) */}
                        <div className="pt-1 flex items-center justify-between gap-1 text-xs">
                          {u.phone ? (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${u.phone.replace(/[^0-9]/g, '').length === 10 && u.phone.replace(/[^0-9]/g, '').startsWith('3') ? `57${u.phone.replace(/[^0-9]/g, '')}` : u.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{u.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-text-tertiary italic">Sin teléfono</span>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Ver CRM</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
