import React from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface KanbanUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  subscriptionType: string;
  paymentStatus: string;
  crmStage?: string;
  trafficLight: string;
  ambassadorName: string;
}

export interface CrmStageConfig {
  key: string;
  label: string;
  badgeColor: string;
  headerColor: string;
  emoji?: string;
}

export const CRM_STAGES: CrmStageConfig[] = [
  { key: 'nuevo', label: 'Nuevo Lead', badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', headerColor: 'border-blue-500', emoji: '🌱' },
  { key: 'contactado', label: 'Contactado', badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20', headerColor: 'border-indigo-500', emoji: '💬' },
  { key: 'interesado', label: 'Interesado / Negociación', badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', headerColor: 'border-amber-500', emoji: '🔥' },
  { key: 'propuesta', label: 'Propuesta Enviada', badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', headerColor: 'border-purple-500', emoji: '📄' },
  { key: 'ganado', label: 'Ganado / Suscrito PRO', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', headerColor: 'border-emerald-500', emoji: '👑' },
  { key: 'frio', label: 'En Seguimiento / Frío', badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20', headerColor: 'border-slate-500', emoji: '❄️' },
  { key: 'invalido', label: 'No Aplica / Inválido', badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', headerColor: 'border-rose-500', emoji: '❌' },
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
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start min-h-[500px] no-scrollbar sm:scrollbar-thin">
      {CRM_STAGES.map((stage) => {
        const stageUsers = users.filter((u) => {
          const uStage = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
          return uStage === stage.key;
        });

        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-72 bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-3 shadow-sm flex flex-col max-h-[75vh]"
          >
            {/* Stage Column Header */}
            <div className={`flex items-center justify-between border-b-2 ${stage.headerColor} pb-2.5 mb-3 px-1`}>
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-text-primary">
                <span>{stage.emoji}</span>
                <span>{stage.label}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface-secondary text-text-secondary">
                {stageUsers.length}
              </span>
            </div>

            {/* Stage Cards Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {stageUsers.length === 0 ? (
                <div className="py-8 text-center text-text-tertiary text-xs border border-dashed border-border-medium/30 rounded-xl">
                  Sin leads en esta etapa
                </div>
              ) : (
                stageUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-border-medium/40 bg-surface-primary hover:border-teal-500/50 transition-all shadow-xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        onClick={() => onSelectUser(u)}
                        className="font-bold text-xs text-text-primary hover:text-teal-600 transition-colors cursor-pointer truncate"
                      >
                        {u.name}
                      </h4>
                      <button
                        onClick={() => onSelectUser(u)}
                        className="text-text-tertiary hover:text-teal-600 shrink-0"
                        title="Ver detalle CRM"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-text-tertiary truncate mt-0.5">{u.email}</p>

                    {u.phone && (
                      <div className="mt-1.5">
                        <a
                          href={`https://api.whatsapp.com/send?phone=${u.phone.replace(/[^0-9]/g, '').length === 10 && u.phone.replace(/[^0-9]/g, '').startsWith('3') ? `57${u.phone.replace(/[^0-9]/g, '')}` : u.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{u.phone}</span>
                        </a>
                      </div>
                    )}

                    {/* Quick Move Stage dropdown */}
                    <div className="mt-2.5 pt-2 border-t border-border-medium/20 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-text-tertiary">Mover a:</span>
                      <select
                        value={stage.key}
                        onChange={(e) => onUpdateStage(u.userId || u.id, e.target.value)}
                        className="bg-surface-secondary text-text-primary border border-border-medium/30 rounded-lg px-2 py-0.5 font-bold outline-none cursor-pointer"
                      >
                        {CRM_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.emoji} {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
