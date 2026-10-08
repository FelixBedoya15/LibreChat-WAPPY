import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Activity,
  Building2,
  Users,
  Bot,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Mail,
  Send,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
  AlertTriangle,
  Car,
  FlaskConical,
  GraduationCap,
  Check,
  Copy,
  X,
  Layers,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { TargetFollowUpUser, formatPlanBadge } from './AmbassadorContactModal';

export interface UserActivityMetric {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  department?: string;
  role: string;
  accountStatus: string;
  registrationDate: string;
  lastActivity: string;
  daysInactive: number;
  subscriptionType: string;
  planInterval?: string;
  daysToExpiry: number | null;
  trafficLight: 'green' | 'yellow' | 'red' | 'gray';
  ambassadorName: string;
  ambassadorSlug: string | null;
  ambassadorId: string | null;
  chatMetrics: {
    totalConversations: number;
    totalMessages: number;
    lastChatDate: string | null;
  };
  milestoneMetrics: {
    companiesCount: number;
    workersCount: number;
    gtc45Count: number;
    gtc45Rows: number;
    pesvCount: number;
    pesvRows: number;
    diagnosticoCount: number;
    chemicalsCount: number;
    chemicalsProducts?: number;
    vehiclesCount: number;
    eppCount: number;
    lmsCoursesCompleted: number;
    lmsCoursesInProgress: number;
  };
  adoptionScore: number;
  adoptionLevel: 'sin_inicio' | 'explorador' | 'intermedio' | 'avanzado' | 'power_user';
  suggestedAction: string;
  prefilledWhatsAppMessage: string;
  crmStage?: string;
  crmNotes?: any[];
  lastContactedAt?: string | null;
}

export interface ActivitySummary {
  totalUsers: number;
  activeThisMonth: number;
  totalCompanies: number;
  totalWorkers: number;
  totalMatrices: number;
  totalConversations: number;
  totalMessages: number;
  avgAdoptionRate: number;
  powerUsersCount: number;
}

interface UsersActivityMetricsTabProps {
  isAdmin: boolean;
  onOpenContactModal?: (user: TargetFollowUpUser) => void;
  selectedAmbassadorFilter?: string;
}

export default function UsersActivityMetricsTab({
  isAdmin,
  onOpenContactModal,
  selectedAmbassadorFilter = 'all'
}: UsersActivityMetricsTabProps) {
  const { showToast } = useToastContext();
  const [users, setUsers] = useState<UserActivityMetric[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserActivityMetric | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/referrals/users-activity-metrics');
      setUsers(res.data?.users || []);
      setSummary(res.data?.summary || null);
    } catch (err: any) {
      showToast({
        message: err.response?.data?.error || 'Error al cargar métricas de actividad de usuarios.',
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Filter users based on ambassador filter from parent (if set)
  const ambassadorFilteredUsers = useMemo(() => {
    if (!selectedAmbassadorFilter || selectedAmbassadorFilter === 'all') return users;
    return users.filter(u =>
      u.ambassadorId === selectedAmbassadorFilter ||
      (u.ambassadorSlug && u.ambassadorSlug.toLowerCase() === selectedAmbassadorFilter.toLowerCase())
    );
  }, [users, selectedAmbassadorFilter]);

  // Secondary filters & search
  const filteredUsers = useMemo(() => {
    return ambassadorFilteredUsers.filter(u => {
      // Search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          (u.name && u.name.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.phone && u.phone.includes(term)) ||
          (u.city && u.city.toLowerCase().includes(term)) ||
          (u.ambassadorName && u.ambassadorName.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Adoption Level
      if (levelFilter !== 'all') {
        if (u.adoptionLevel !== levelFilter) return false;
      }

      // Plan
      if (planFilter !== 'all') {
        if (planFilter === 'pro' && u.subscriptionType !== 'pro' && u.subscriptionType !== 'vital') return false;
        if (planFilter === 'vital' && u.subscriptionType !== 'vital') return false;
        if (planFilter === 'free' && (u.subscriptionType === 'pro' || u.subscriptionType === 'vital')) return false;
      }

      // Activity
      if (activityFilter !== 'all') {
        if (activityFilter === 'active7' && u.daysInactive > 7) return false;
        if (activityFilter === 'inactive14' && u.daysInactive < 14) return false;
        if (activityFilter === 'inactive30' && u.daysInactive < 30) return false;
      }

      // Specific SST Milestones
      if (milestoneFilter !== 'all') {
        if (milestoneFilter === 'hasCompany' && u.milestoneMetrics.companiesCount === 0) return false;
        if (milestoneFilter === 'hasWorkers' && u.milestoneMetrics.workersCount === 0) return false;
        if (milestoneFilter === 'hasGtc45' && u.milestoneMetrics.gtc45Count === 0) return false;
        if (milestoneFilter === 'hasPesv' && u.milestoneMetrics.pesvCount === 0) return false;
        if (milestoneFilter === 'hasDiag' && u.milestoneMetrics.diagnosticoCount === 0) return false;
        if (milestoneFilter === 'hasChats' && u.chatMetrics.totalConversations === 0) return false;
        if (milestoneFilter === 'noMilestones' && (u.milestoneMetrics.companiesCount > 0 || u.milestoneMetrics.gtc45Count > 0 || u.milestoneMetrics.workersCount > 0)) return false;
      }

      return true;
    });
  }, [ambassadorFilteredUsers, searchTerm, levelFilter, planFilter, activityFilter, milestoneFilter]);

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast({ message: 'Mensaje copiado al portapapeles.', status: 'success' });
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleOpenWhatsApp = (u: UserActivityMetric) => {
    const clean = (u.phone || '').replace(/[^0-9]/g, '');
    if (!clean) {
      showToast({ message: 'Este usuario no tiene un número de teléfono registrado.', status: 'warning' });
      return;
    }
    const cleanPhoneWithCountry = clean.length === 10 ? `57${clean}` : clean;
    const msg = encodeURIComponent(u.prefilledWhatsAppMessage || `Hola ${u.name}, te escribo desde WAPPY para orientarte en tu gestión SST.`);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhoneWithCountry}&text=${msg}`, '_blank');
  };

  const formatLevelBadge = (level: string, score: number) => {
    switch (level) {
      case 'power_user':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <Flame className="w-3 h-3 text-emerald-500" />
            Power User ({score}%)
          </span>
        );
      case 'avanzado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
            <Award className="w-3 h-3 text-teal-500" />
            Avanzado ({score}%)
          </span>
        );
      case 'intermedio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Activity className="w-3 h-3 text-blue-500" />
            Intermedio ({score}%)
          </span>
        );
      case 'explorador':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Explorador ({score}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            Sin Iniciar (0%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users & Active */}
        <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Usuarios Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {summary?.activeThisMonth || 0}
            </span>
            <span className="text-xs text-text-secondary">
              de {summary?.totalUsers || users.length} reg.
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Actividad en los últimos 30 días</span>
          </div>
        </div>

        {/* Chats & IA Engagement */}
        <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Uso de IA & Chats
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {summary?.totalConversations || 0}
            </span>
            <span className="text-xs text-text-secondary">conversaciones</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{summary?.totalMessages || 0} mensajes intercambiados</span>
          </div>
        </div>

        {/* Hitos SST Operativos */}
        <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Hitos SST Generados
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {summary?.totalMatrices || 0}
            </span>
            <span className="text-xs text-text-secondary">matrices (GTC45/PESV)</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
            <span>🏢 {summary?.totalCompanies || 0} empresas</span>
            <span>•</span>
            <span>👷 {summary?.totalWorkers || 0} trab.</span>
          </div>
        </div>

        {/* Adoption & Retention Rate */}
        <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tasa de Adopción
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary?.avgAdoptionRate || 0}%
            </span>
            <span className="text-xs text-text-secondary">promedio</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-text-secondary font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{summary?.powerUsersCount || 0} Power Users activos</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar & Search Filters */}
      <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por usuario, correo, teléfono, ciudad o embajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-secondary/40 border border-border-medium/40 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Refresh Button */}
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-secondary/40 border border-border-medium/40 hover:bg-surface-hover transition-all active:scale-95 shrink-0"
            title="Refrescar métricas"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-teal-500")} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-medium/20 text-xs">
          <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filtros:
          </span>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-surface-secondary/60 border border-border-medium/40 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Nivel: Todos</option>
            <option value="power_user">🔥 Power User (+80%)</option>
            <option value="avanzado">⭐ Avanzado (61-80%)</option>
            <option value="intermedio">📈 Intermedio (26-60%)</option>
            <option value="explorador">✨ Explorador (1-25%)</option>
            <option value="sin_inicio">💤 Sin Iniciar (0%)</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-surface-secondary/60 border border-border-medium/40 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Plan: Todos</option>
            <option value="pro">WAPPY PRO / Vital</option>
            <option value="vital">Solo Wappy Vital</option>
            <option value="free">Free / Periodo Prueba</option>
          </select>

          {/* Milestone Filter */}
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-surface-secondary/60 border border-border-medium/40 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Hitos: Todos</option>
            <option value="hasCompany">🏢 Con Empresa Creada</option>
            <option value="hasWorkers">👷 Con Trabajadores</option>
            <option value="hasGtc45">📋 Con Matriz GTC 45</option>
            <option value="hasPesv">🚗 Con Matriz PESV</option>
            <option value="hasDiag">📊 Con Diagnóstico 0312</option>
            <option value="hasChats">💬 Con Chats Activos</option>
            <option value="noMilestones">⚠️ Sin Hitos Iniciados</option>
          </select>

          {/* Activity Filter */}
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-surface-secondary/60 border border-border-medium/40 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Actividad: Todas</option>
            <option value="active7">🟢 Activos últimos 7 días</option>
            <option value="inactive14">🟡 Inactivos &gt; 14 días</option>
            <option value="inactive30">🔴 Inactivos &gt; 30 días</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || levelFilter !== 'all' || planFilter !== 'all' || milestoneFilter !== 'all' || activityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('all');
                setPlanFilter('all');
                setMilestoneFilter('all');
                setActivityFilter('all');
              }}
              className="text-[11px] text-teal-600 hover:text-teal-700 font-bold ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. Table of Active Users & Milestones */}
      <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border-medium/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-text-primary">
              Métricas Detalladas de Uso por Usuario
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-700 dark:text-teal-300">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>
          <span className="text-[11px] text-text-secondary hidden sm:inline">
            Haz clic en WhatsApp para abrir el chat con asesoría sugerida
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-xs font-bold text-text-secondary">
              Calculando uso de IA y progreso de hitos SST en tiempo real...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-text-secondary flex flex-col items-center gap-2">
            <Users className="w-8 h-8 opacity-40 text-slate-400" />
            <p className="text-xs font-bold">No se encontraron usuarios con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/40 text-text-secondary font-bold border-b border-border-medium/30 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5">Usuario & Plan</th>
                  <th className="py-3 px-3">Uso IA (Chats)</th>
                  <th className="py-3 px-3">Hitos SST en Aplicativos</th>
                  <th className="py-3 px-3">Adopción</th>
                  <th className="py-3 px-3 min-w-[220px]">Estrategia Sugerida</th>
                  <th className="py-3 px-3.5 text-right min-w-[130px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-medium/20 text-text-primary">
                {filteredUsers.map((u, idx) => {
                  const m = u.milestoneMetrics;
                  const c = u.chatMetrics;

                  return (
                    <tr
                      key={u.id || u.userId || idx}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      {/* 1. User & Plan */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-teal-500/20">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-text-primary truncate">
                                {u.name}
                              </span>
                              {formatPlanBadge(u.subscriptionType, u.planInterval, u.daysToExpiry)}
                            </div>
                            <div className="text-[11px] text-text-secondary truncate mt-0.5">
                              {u.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary flex-wrap">
                              {u.phone ? (
                                <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300 font-semibold">
                                  <Phone className="w-2.5 h-2.5 text-emerald-500" />
                                  {u.phone}
                                </span>
                              ) : (
                                <span className="text-amber-500 font-semibold">Sin teléfono</span>
                              )}
                              {u.city && (
                                <span className="text-slate-400">
                                  • {u.city}
                                </span>
                              )}
                              {isAdmin && u.ambassadorName && (
                                <span className="text-slate-400">
                                  • Asesor: <strong className="text-slate-600 dark:text-zinc-300">{u.ambassadorName}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. AI Chats */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                            <Bot className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{c.totalConversations} {c.totalConversations === 1 ? 'chat' : 'chats'}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {c.totalMessages} mensajes
                          </div>
                          <div className="text-[10px] text-text-secondary/80 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {u.daysInactive === 0 ? (
                              <span className="text-emerald-600 font-semibold">Hoy</span>
                            ) : u.daysInactive === 1 ? (
                              <span className="text-emerald-600 font-semibold">Ayer</span>
                            ) : (
                              <span>Hace {u.daysInactive} días</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. SST Milestones */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {/* Empresas */}
                          <span
                            title={`${m.companiesCount} empresas configuradas`}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                              m.companiesCount > 0
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                            )}
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            {m.companiesCount} emp.
                          </span>

                          {/* Trabajadores */}
                          <span
                            title={`${m.workersCount} trabajadores registrados`}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                              m.workersCount > 0
                                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                            )}
                          >
                            <Users className="w-2.5 h-2.5" />
                            {m.workersCount} trab.
                          </span>

                          {/* GTC 45 */}
                          <span
                            title={`${m.gtc45Count} matrices GTC 45 (${m.gtc45Rows} filas evaluadas)`}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                              m.gtc45Count > 0
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                            )}
                          >
                            <FileSpreadsheet className="w-2.5 h-2.5" />
                            {m.gtc45Count} GTC45
                          </span>

                          {/* PESV */}
                          <span
                            title={`${m.pesvCount} matrices PESV (${m.pesvRows} filas evaluadas)`}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                              m.pesvCount > 0
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                            )}
                          >
                            <Car className="w-2.5 h-2.5" />
                            {m.pesvCount} PESV
                          </span>

                          {/* Químicos */}
                          {m.chemicalsCount > 0 && (
                            <span
                              title={`${m.chemicalsCount} inventarios químicos`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            >
                              <FlaskConical className="w-2.5 h-2.5" />
                              {m.chemicalsCount} Quím.
                            </span>
                          )}

                          {/* 0312 */}
                          {m.diagnosticoCount > 0 && (
                            <span
                              title={`${m.diagnosticoCount} evaluaciones de estándares 0312`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                              <BarChart3 className="w-2.5 h-2.5" />
                              {m.diagnosticoCount} 0312
                            </span>
                          )}

                          {/* LMS */}
                          {m.lmsCoursesCompleted > 0 && (
                            <span
                              title={`${m.lmsCoursesCompleted} cursos LMS aprobados`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                            >
                              <GraduationCap className="w-2.5 h-2.5" />
                              {m.lmsCoursesCompleted} LMS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Adoption Progress */}
                      <td className="py-3 px-3 align-top min-w-[130px]">
                        <div className="space-y-1.5">
                          {formatLevelBadge(u.adoptionLevel, u.adoptionScore)}
                          <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                u.adoptionScore >= 80
                                  ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                                  : u.adoptionScore >= 50
                                  ? "bg-teal-500"
                                  : u.adoptionScore >= 20
                                  ? "bg-amber-500"
                                  : "bg-slate-300 dark:bg-zinc-700"
                              )}
                              style={{ width: `${Math.max(5, u.adoptionScore)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 5. Suggested Follow-Up Strategy */}
                      <td className="py-3 px-3 align-top">
                        <div className="bg-surface-secondary/40 rounded-xl p-2 border border-border-medium/30 space-y-1">
                          <div className="text-[11px] font-bold text-text-primary flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{u.suggestedAction}</span>
                          </div>
                          <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                            "{u.prefilledWhatsAppMessage}"
                          </p>
                        </div>
                      </td>

                      {/* 6. Actions (WAPPY Strict Micro-buttons) */}
                      <td className="py-3 px-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Micro-botón WhatsApp (Esmeralda expandible) */}
                          <button
                            onClick={() => handleOpenWhatsApp(u)}
                            disabled={!u.phone}
                            className={cn(
                              "group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95",
                              u.phone
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                                : "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                            )}
                            title={u.phone ? "Escribir por WhatsApp con mensaje guiado" : "Usuario sin teléfono"}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                              <span className="text-[10px] font-bold">WhatsApp</span>
                            </div>
                          </button>

                          {/* Micro-botón Ver Hitos (Teal expandible) */}
                          <button
                            onClick={() => setSelectedUserDetail(u)}
                            className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 cursor-pointer"
                            title="Ver desglose completo de hitos y métricas"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                              <span className="text-[10px] font-bold">Ver Hitos</span>
                            </div>
                          </button>

                          {/* Micro-botón Contactar Email / CRM */}
                          {onOpenContactModal && (
                            <button
                              onClick={() => {
                                onOpenContactModal({
                                  id: u.id,
                                  userId: u.userId,
                                  name: u.name,
                                  email: u.email,
                                  phone: u.phone,
                                  city: u.city,
                                  department: u.department,
                                  role: u.role,
                                  subscriptionType: u.subscriptionType,
                                  planInterval: u.planInterval,
                                  trafficLight: u.trafficLight,
                                  accountStatus: u.accountStatus,
                                  ambassadorName: u.ambassadorName,
                                  daysInactive: u.daysInactive,
                                });
                              }}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                              title="Redactar Email con IA o registrar CRM"
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                <span className="text-[10px] font-bold">Email IA</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal de Detalle de Usuario e Hitos */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/60 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-border-medium/30 flex items-start justify-between bg-surface-secondary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedUserDetail.name ? selectedUserDetail.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
                    <span>{selectedUserDetail.name}</span>
                    {formatPlanBadge(selectedUserDetail.subscriptionType, selectedUserDetail.planInterval, selectedUserDetail.daysToExpiry)}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedUserDetail.email} {selectedUserDetail.phone && `• 📱 ${selectedUserDetail.phone}`} {selectedUserDetail.city && `• 📍 ${selectedUserDetail.city}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-8 h-8 rounded-full bg-surface-secondary/80 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Adoption Level Summary Banner */}
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-secondary">Nivel de Adopción:</span>
                    {formatLevelBadge(selectedUserDetail.adoptionLevel, selectedUserDetail.adoptionScore)}
                  </div>
                  <p className="text-xs text-teal-800 dark:text-teal-200 font-medium mt-1">
                    {selectedUserDetail.suggestedAction}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {selectedUserDetail.adoptionScore}%
                  </span>
                </div>
              </div>

              {/* Grid de Hitos SST */}
              <div>
                <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
                  Progreso por Cada Hito SST
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Empresa */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">1. Empresa Configurada</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span>{selectedUserDetail.milestoneMetrics.companiesCount} empresas</span>
                    </div>
                  </div>

                  {/* Trabajadores */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">2. Trabajadores SST</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-500" />
                      <span>{selectedUserDetail.milestoneMetrics.workersCount} cargados</span>
                    </div>
                  </div>

                  {/* Matriz GTC 45 */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">3. Matriz GTC 45</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>{selectedUserDetail.milestoneMetrics.gtc45Count} ({selectedUserDetail.milestoneMetrics.gtc45Rows} filas)</span>
                    </div>
                  </div>

                  {/* Matriz PESV */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">4. Matriz PESV</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-amber-500" />
                      <span>{selectedUserDetail.milestoneMetrics.pesvCount} ({selectedUserDetail.milestoneMetrics.pesvRows} filas)</span>
                    </div>
                  </div>

                  {/* Diagnóstico 0312 */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">5. Estándares 0312</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span>{selectedUserDetail.milestoneMetrics.diagnosticoCount} eval.</span>
                    </div>
                  </div>

                  {/* Químicos & EPP */}
                  <div className="bg-surface-secondary/40 border border-border-medium/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">6. Químicos & EPP</span>
                    <div className="text-base font-extrabold text-text-primary mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      <span>{selectedUserDetail.milestoneMetrics.chemicalsCount} quim / {selectedUserDetail.milestoneMetrics.eppCount} EPP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje Personalizado para Guiarlo por WhatsApp */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Mensaje Sugerido para WhatsApp (Acompañamiento & Retención)
                  </h4>
                  <button
                    onClick={() => handleCopyMessage(selectedUserDetail.prefilledWhatsAppMessage, 999)}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedIndex === 999 ? (
                      <>
                        <Check className="w-3 h-3" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copiar Texto
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-zinc-900/70 p-3 rounded-xl border border-emerald-500/20 italic leading-relaxed">
                  "{selectedUserDetail.prefilledWhatsAppMessage}"
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenWhatsApp(selectedUserDetail)}
                    disabled={!selectedUserDetail.phone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Abrir en WhatsApp Web
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border-medium/30 bg-surface-secondary/20 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-border-medium/40 text-text-primary hover:bg-surface-hover transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
