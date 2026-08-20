import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, 
  Users, 
  TrendingUp, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Mail,
  Send,
  FileText,
  LayoutGrid,
  List,
  Flame,
  Layers
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import AmbassadorContactModal, { TargetFollowUpUser, formatPlanBadge } from './AmbassadorContactModal';
import CommercialProposalGenerator from './CommercialProposalGenerator';
import AmbassadorKanbanBoard, { KanbanUser, CRM_STAGES } from './AmbassadorKanbanBoard';

interface ReferredUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  registrationDate: string;
  lastActivity: string;
  daysInactive: number;
  subscriptionType: string;
  planInterval?: string;
  paymentStatus: string;
  planExpiresAt: string | null;
  daysToExpiry: number | null;
  trafficLight: 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  crmStage?: string;
  crmNotes?: any[];
  lastContactedAt?: string | null;
  nextFollowUpDate?: string | null;
  ambassadorName: string;
  ambassadorSlug: string | null;
  ambassadorId: string | null;
}

interface CommissionItem {
  id: string;
  userId?: string;
  referredUserName: string;
  referredUserEmail: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  subscriptionType?: string;
  planInterval?: string;
  planExpiresAt?: string | Date | null;
  daysToExpiry?: number | null;
  lastActivity?: string | Date;
  daysInactive?: number;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

interface NetworkPartner {
  partnerId: string;
  name: string;
  email: string;
  slug: string;
  type: string;
  commissionRate: number;
  totalReferrals: number;
  totalCommission: number;
  daysSinceLastReferral: string;
}

interface DashboardKpis {
  totalRegisteredUsers: number;
  totalReferred: number;
  totalGrowth7Days: number;
  activeProCount: number;
  expiringSoonCount: number;
  missingPhoneCount: number;
  inactiveCount: number;
  totalCommissionsEarned: number;
  totalCommissionsPending: number;
  totalCommissionsPaid: number;
  inactiveAmbassadorsCount: number;
  topAmbassadorName: string;
}

export default function AmbassadorDashboard() {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDashboard, setShowDashboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('embajadores_show_dashboard') !== 'false';
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'commissions' | 'network' | 'proposals'>('overview');

  // Data states
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkPartner[]>([]);
  const [myReferralLink, setMyReferralLink] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLeader, setIsLeader] = useState<boolean>(false);

  // Filter & Search states for Users tab
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lightFilter, setLightFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // CRM Update Stage Handler
  const handleUpdateCrmStage = async (userId: string, newStage: string, stageLabel?: string) => {
    try {
      const resp = await axios.post('/api/referrals/crm/update-stage', {
        targetUserId: userId,
        newStage,
        stageLabel
      });
      setReferredUsers(prev => prev.map(u => {
        if (u.userId === userId) {
          return {
            ...u,
            crmStage: newStage,
            crmNotes: resp.data?.crmNotes || u.crmNotes
          };
        }
        return u;
      }));
      showToast({ message: `Etapa actualizada a ${stageLabel || newStage}.`, status: 'success' });
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Error al actualizar etapa.', status: 'error' });
    }
  };

  // Admin attribution modal state
  const [selectedUserForAttr, setSelectedUserForAttr] = useState<ReferredUser | null>(null);
  const [targetPartnerId, setTargetPartnerId] = useState<string>('');
  const [isAttributing, setIsAttributing] = useState<boolean>(false);
  const [createCommission, setCreateCommission] = useState<boolean>(true);
  const [commissionPreset, setCommissionPreset] = useState<'anual' | 'semestral' | 'mensual' | 'custom'>('anual');
  const [customTxAmount, setCustomTxAmount] = useState<number>(600000);
  const [customCommRate, setCustomCommRate] = useState<number>(0.30);
  const [commissionStatus, setCommissionStatus] = useState<'pending' | 'paid'>('pending');

  const openAttributionModal = (u: ReferredUser) => {
    setSelectedUserForAttr(u);
    setTargetPartnerId(u.ambassadorId || '');
    const isProPaid = u.role === 'USER_PRO' || u.paymentStatus === 'paid';
    setCreateCommission(isProPaid);
    if (u.planInterval === 'semestral') {
      setCommissionPreset('semestral');
      setCustomTxAmount(350000);
    } else if (u.planInterval === 'mensual') {
      setCommissionPreset('mensual');
      setCustomTxAmount(97180);
    } else {
      setCommissionPreset('anual');
      setCustomTxAmount(600000);
    }
    setCustomCommRate(0.30);
    setCommissionStatus('pending');
  };

  // User Follow-up & Campaign Modal (Email & WhatsApp)
  const [contactUser, setContactUser] = useState<TargetFollowUpUser | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/referrals/dashboard');
      const data = res.data;
      setKpis(data.kpis);
      setReferredUsers(data.referredUsers || []);
      setCommissions(data.commissions || []);
      setNetworkStats(data.networkStats || []);
      setMyReferralLink(data.myReferralLink || '');
      setIsAdmin(!!data.isAdmin);
      setIsLeader(!!data.isLeader);
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al cargar las métricas del dashboard.', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleDashboard = () => {
    setShowDashboard(prev => {
      const next = !prev;
      localStorage.setItem('embajadores_show_dashboard', String(next));
      return next;
    });
  };

  const copyReferralLink = () => {
    if (!myReferralLink) return;
    navigator.clipboard.writeText(myReferralLink);
    showToast({ message: '¡Link de referido copiado al portapapeles!', status: 'success' });
  };

  const exportToCSV = () => {
    if (!referredUsers.length) {
      showToast({ message: 'No hay usuarios para exportar.', status: 'warning' });
      return;
    }

    const headers = [
      'Nombre',
      'Correo',
      'Telefono',
      'Rol',
      'Estado Cuenta',
      'Fecha Registro',
      'Dias Inactivo',
      'Tipo Suscripcion',
      'Estado Pago',
      'Dias para Vencimiento',
      'Semaforo',
      'Embajador Asignado'
    ];

    const rows = referredUsers.map(u => [
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || ''}"`,
      `"${u.role}"`,
      `"${u.accountStatus}"`,
      `"${new Date(u.registrationDate).toLocaleDateString()}"`,
      u.daysInactive,
      `"${u.subscriptionType}"`,
      `"${u.paymentStatus}"`,
      u.daysToExpiry !== null ? u.daysToExpiry : 'N/A',
      `"${u.trafficLight}"`,
      `"${u.ambassadorName.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wappy_Métricas_Embajadores_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({ message: 'Reporte CSV generado y descargado.', status: 'success' });
  };

  const handleAdminAttribute = async () => {
    if (!selectedUserForAttr) return;
    try {
      setIsAttributing(true);
      let txAmount = customTxAmount;
      let rate = customCommRate;
      if (commissionPreset === 'anual') {
        txAmount = 600000;
        rate = 0.30;
      } else if (commissionPreset === 'semestral') {
        txAmount = 350000;
        rate = 0.30;
      } else if (commissionPreset === 'mensual') {
        txAmount = 97180;
        rate = 0.30;
      }
      const calculatedComm = Math.round(txAmount * rate);

      await axios.post('/api/referrals/attribute', {
        targetUserId: selectedUserForAttr.userId,
        partnerId: targetPartnerId || null,
        createCommission: createCommission && !!targetPartnerId,
        transactionAmount: txAmount,
        commissionRate: rate,
        commissionAmount: calculatedComm,
        commissionStatus: commissionStatus,
        reassignExistingCommissions: true,
      });

      showToast({ 
        message: createCommission && targetPartnerId 
          ? 'Atribución y comisión retroactiva guardadas con éxito.' 
          : 'Atribución de embajador actualizada correctamente.', 
        status: 'success' 
      });
      setSelectedUserForAttr(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al cambiar atribución.', status: 'error' });
    } finally {
      setIsAttributing(false);
    }
  };

  // Filter logic for referred users
  const filteredUsers = referredUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.ambassadorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    const matchesLight = lightFilter === 'all' || u.trafficLight === lightFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesLight;
  });

  const getTrafficLightBadge = (light: string) => {
    switch (light) {
      case 'green':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>🟢 Activo / Al día</span>;
      case 'yellow':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><span className="w-2 h-2 rounded-full bg-amber-500"></span>🟡 Próximo Vencer / Inactivo</span>;
      case 'red':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"><span className="w-2 h-2 rounded-full bg-rose-500"></span>🔴 Alerta / Vencido</span>;
      case 'purple':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"><span className="w-2 h-2 rounded-full bg-purple-500"></span>🟣 Comisión Pendiente</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"><span className="w-2 h-2 rounded-full bg-gray-400"></span>⚪ Freemium</span>;
    }
  };

  const totalLeadsCount = referredUsers.length;
  const contactedLeadsCount = referredUsers.filter(u => {
    const st = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
    return st !== 'nuevo' && st !== 'invalido';
  }).length;
  const interestedLeadsCount = referredUsers.filter(u => (u.crmStage || '') === 'interesado').length;
  const proposalsSentCount = referredUsers.filter(u => (u.crmStage || '') === 'propuesta').length;
  const wonLeadsCount = referredUsers.filter(u => {
    const st = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
    return st === 'ganado' || u.role === 'USER_PRO' || u.paymentStatus === 'paid';
  }).length;
  const contactRate = totalLeadsCount > 0 ? Math.round((contactedLeadsCount / totalLeadsCount) * 100) : 0;
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 relative min-h-screen h-auto overflow-y-auto pb-12 w-full max-w-full">
      {/* Header section - exact same style as Centro de Control ACPM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-3 sm:p-4 md:p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-3 sm:gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold flex items-center gap-2 sm:gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-teal-500 shrink-0" />
            <span className="truncate">
              {isAdmin 
                ? 'Dashboard de Embajadores & Métricas del Sistema' 
                : isLeader 
                  ? 'Dashboard de Líder de Embajadores WAPPY' 
                  : 'Dashboard de Embajador WAPPY — Mis Métricas y Referidos'}
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1">
            {isAdmin 
              ? 'Control general de usuarios referidos, atribución de registros, estado de pagos y comisiones en tiempo real.'
              : 'Haz seguimiento a tus usuarios registrados, estado de sus planes PRO y comisiones devengadas.'}
          </p>
        </div>

        {/* Button bar matching Centro de Control ACPM */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 w-full sm:w-auto justify-start sm:justify-end flex-wrap sm:flex-nowrap">
          <button
            onClick={toggleDashboard}
            className={`group flex items-center justify-center flex-1 sm:flex-none h-8 sm:h-9 md:h-10 px-2.5 sm:px-4 rounded-xl border border-border-medium/40 text-[11px] sm:text-xs font-bold transition-all duration-300 gap-1.5 sm:gap-2 cursor-pointer shadow-sm ${
              showDashboard 
                ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400' 
                : 'bg-white dark:bg-gray-900 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
            title={showDashboard ? "Ocultar Dashboard" : "Mostrar Dashboard"}
          >
            {showDashboard ? (
              <>
                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current shrink-0" />
                <span className="hidden md:inline">Ocultar Analíticas</span>
                <span className="md:hidden">Ocultar</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current shrink-0" />
                <span className="hidden md:inline">Ver Analíticas</span>
                <span className="md:hidden">Analíticas</span>
              </>
            )}
          </button>

          <button
            onClick={exportToCSV}
            className="group flex items-center justify-center flex-1 sm:flex-none h-8 sm:h-9 md:h-10 px-2.5 sm:px-4 transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white sm:hover:scale-105 active:scale-95 gap-1.5 sm:gap-2"
            title="Exportar Reporte CSV"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-wide">
              <span className="hidden sm:inline">Exportar Reporte</span>
              <span className="sm:hidden">Exportar</span>
            </span>
          </button>

          <button
            onClick={copyReferralLink}
            className="group flex items-center justify-center flex-1 sm:flex-none h-8 sm:h-9 md:h-10 px-2.5 sm:px-4 transition-all duration-300 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white sm:hover:scale-105 active:scale-95 gap-1.5 sm:gap-2"
            title="Copiar mi Link de Referido"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-wide">
              <span className="hidden sm:inline">Copiar Mi Link</span>
              <span className="sm:hidden">Mi Link</span>
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Upper Dashboard KPI Cards (Collapsible) */}
        {showDashboard && kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-300">
            {/* KPI Card 1 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-teal-500/5 rounded-bl-full pointer-events-none group-hover:bg-teal-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {isAdmin ? 'Registros Referidos' : 'Mis Usuarios Referidos'}
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{kpis.totalReferred}</div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>+{kpis.totalGrowth7Days} en 7 días</span>
              </div>
            </div>

            {/* KPI Card 2 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">Planes PRO Activos</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{kpis.activeProCount}</div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>{kpis.expiringSoonCount} por vencer (≤ 30d)</span>
              </div>
            </div>

            {/* KPI Card 3 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">Comisiones Devengadas</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight truncate">
                ${(kpis.totalCommissionsEarned / 100).toLocaleString('es-CO')} <span className="text-xs font-bold text-text-tertiary">COP</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-text-secondary">
                <span>Pend: ${(kpis.totalCommissionsPending / 100).toLocaleString('es-CO')}</span>
                <span className="text-emerald-600 font-bold">Pag: ${(kpis.totalCommissionsPaid / 100).toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* KPI Card 4 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary truncate">
                  {isAdmin || isLeader ? 'Líder & Red' : 'Mi Nivel Embajador'}
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              {isAdmin || isLeader ? (
                <>
                  <div className="text-base sm:text-lg font-extrabold text-text-primary truncate">
                    TOP: {kpis.topAmbassadorName}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-text-secondary">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                    <span>{kpis.inactiveAmbassadorsCount} sin registros &gt; 30d</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base sm:text-lg font-extrabold text-text-primary truncate">
                    20% Comisión Directa
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>Embajador Activo</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border-medium/40 overflow-x-auto pb-1.5 no-scrollbar sm:scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
            <span>Resumen & Alertas</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
            <span>{isAdmin ? `Usuarios Referidos (${referredUsers.length})` : `Mis Referidos (${referredUsers.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'commissions'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
            <span>Comisiones</span>
          </button>

          {(isAdmin || isLeader) && (
            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'network'
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
              <span>Panel de Red</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'proposals'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
            <span>Propuesta Comercial</span>
          </button>
        </div>

        {/* Tab 1: Overview & Alerts */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Alert Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300">Vencimientos Próximos</h4>
                  <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Hay {kpis?.expiringSoonCount || 0} usuarios con suscripción por vencer en ≤ 30 días. Realiza gestión comercial para renovar.
                  </p>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-300">Datos Incompletos</h4>
                  <p className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 mt-1">
                    {kpis?.missingPhoneCount || 0} usuarios registrados no poseen número de teléfono capturado en el perfil.
                  </p>
                </div>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3 sm:col-span-2 lg:col-span-1">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-teal-800 dark:text-teal-300">Link de Referido Activo</h4>
                  <p className="text-[11px] sm:text-xs text-teal-700 dark:text-teal-400 mt-1 truncate">
                    Tu link: <span className="font-mono underline">{myReferralLink}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Referral link banner */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold">Tu Enlace Exclusivo de Embajador WAPPY</h3>
                <p className="text-[11px] sm:text-xs text-teal-100 mt-1 max-w-xl">
                  Comparte este enlace para asegurar la regla de primer toque. Cada usuario registrado a través de tu link te generará comisiones sobre sus suscripciones.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  readOnly
                  value={myReferralLink}
                  className="bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-mono border border-white/20 outline-none w-full lg:w-72 xl:w-80 truncate"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Table & Kanban CRM */}
        {activeTab === 'users' && (
          <div className="space-y-4">
              {/* CRM Metrics Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase">Total Leads</div>
                  <div className="text-lg font-black text-text-primary mt-0.5">{totalLeadsCount}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Contactos en tu red</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Tasa Contacto</div>
                  <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-0.5">{contactRate}%</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{contactedLeadsCount} de {totalLeadsCount} contactados</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                    <span>🔥 En Negociación</span>
                  </div>
                  <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{interestedLeadsCount}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Leads con alto interés</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase flex items-center gap-1">
                    <span>📄 Propuestas</span>
                  </div>
                  <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">{proposalsSentCount}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Cotizaciones activas</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-xs col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                    <span>✅ Conversión PRO</span>
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{conversionRate}%</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{wonLeadsCount} suscritos activos</div>
                </div>
              </div>

              {/* Search & View Switcher Bar */}
              <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
                {/* Search box */}
                <div className="relative w-full lg:w-72 xl:w-80">
                  <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar usuario, correo, WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* View Switcher + Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                  {/* Toggle Table vs Kanban */}
                  <div className="flex items-center bg-surface-primary border border-border-medium/40 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Vista Tabla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        viewMode === 'kanban'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Tablero Kanban</span>
                    </button>
                  </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="USER">USER (Invitado)</option>
                  <option value="USER_PRO">USER_PRO (Wappy Pro)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Estado Cuenta</option>
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Inactivo</option>
                </select>

                <select
                  value={lightFilter}
                  onChange={(e) => setLightFilter(e.target.value)}
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Todos los Semáforos</option>
                  <option value="green">🟢 Verde (Activo / Al día)</option>
                  <option value="yellow">🟡 Amarillo (Próximo vencer)</option>
                  <option value="red">🔴 Rojo (Vencido / Alerta)</option>
                  <option value="gray">⚪ Gris (Freemium)</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Switching: Kanban vs Table */}
            {viewMode === 'kanban' ? (
              <AmbassadorKanbanBoard
                users={filteredUsers as any}
                onSelectUser={(u) => setContactUser(u as any)}
                onUpdateStage={handleUpdateCrmStage}
                myReferralLink={myReferralLink}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[950px]">
                    <thead className="bg-surface-secondary/60 border-b border-border-medium/40 font-bold uppercase text-[11px] text-text-tertiary">
                      <tr>
                        <th className="px-4 py-3.5 min-w-[220px]">Usuario & Contacto</th>
                        <th className="px-4 py-3.5 min-w-[140px]">Etapa CRM</th>
                        <th className="px-4 py-3.5 min-w-[120px]">Rol & Cuenta</th>
                        <th className="px-4 py-3.5 min-w-[140px]">Registro & Inactividad</th>
                        <th className="px-4 py-3.5 min-w-[140px]">Suscripción & Pago</th>
                        <th className="px-4 py-3.5 min-w-[150px]">Vencimiento & Semáforo</th>
                        <th className="px-4 py-3.5 min-w-[150px]">Embajador</th>
                        <th className="px-4 py-3.5 text-right min-w-[140px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-medium/20">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-text-tertiary text-sm">
                            No se encontraron usuarios referidos que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                            <td className="px-4 py-3.5 align-middle">
                              <div className="flex flex-col min-w-0">
                                <span
                                  onClick={() => setContactUser(u as any)}
                                  className="font-bold text-text-primary text-sm leading-snug hover:text-teal-600 cursor-pointer transition-colors flex items-center gap-1 group"
                                >
                                  <span>{u.name}</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                                </span>
                                <span className="text-text-tertiary text-xs truncate max-w-[200px] mt-0.5">{u.email}</span>
                                {u.phone ? (
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${u.phone.replace(/[^0-9]/g, '').length === 10 && u.phone.replace(/[^0-9]/g, '').startsWith('3') ? `57${u.phone.replace(/[^0-9]/g, '')}` : u.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold mt-1"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                    <span>{u.phone}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-rose-500 font-semibold mt-1">Sin teléfono</span>
                                )}
                              </div>
                            </td>

                            {/* CRM Stage Badge */}
                            <td className="px-4 py-3.5 align-middle">
                              {(() => {
                                const uStage = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
                                const stObj = CRM_STAGES.find(s => s.key === uStage);
                                return (
                                  <button
                                    onClick={() => setContactUser(u as any)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer shadow-xs ${stObj?.badgeColor || 'bg-slate-500/10 text-slate-700'}`}
                                    title="Clic para ver seguimiento CRM o cambiar etapa"
                                  >
                                    <span>{stObj?.icon || '🔘'}</span>
                                    <span>{stObj?.shortLabel || stObj?.label || 'Nuevo'}</span>
                                  </button>
                                );
                              })()}
                            </td>

                            <td className="px-4 py-3.5 align-middle">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 whitespace-nowrap">
                                {u.role}
                              </span>
                              <div className="text-[10px] text-text-tertiary uppercase font-bold mt-1 tracking-wider">
                                {u.accountStatus}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-middle">
                              <div className="text-xs font-medium text-text-primary">{new Date(u.registrationDate).toLocaleDateString()}</div>
                              <div className="text-[11px] text-text-tertiary mt-0.5">
                                {u.daysInactive === 0 ? '🟢 Activo hoy' : `Hace ${u.daysInactive} días`}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-middle">
                              {(() => {
                                const p = formatPlanBadge(u.subscriptionType, u.planInterval);
                                return (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase whitespace-nowrap ${p.className}`}>
                                    {p.label}
                                  </span>
                                );
                              })()}
                              <div className="text-[11px] mt-1 font-semibold">
                                {u.paymentStatus === 'paid' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">Pagado</span>
                                ) : u.paymentStatus === 'trial' ? (
                                  <span className="text-amber-600 dark:text-amber-400">En Prueba</span>
                                ) : u.paymentStatus === 'expired' ? (
                                  <span className="text-rose-600 dark:text-rose-400">Vencido</span>
                                ) : (
                                  <span className="text-gray-500">Sin pago</span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-middle">
                              <div className="whitespace-nowrap">{getTrafficLightBadge(u.trafficLight)}</div>
                              {(() => {
                                const p = formatPlanBadge(u.subscriptionType, u.planInterval);
                                if (p.isLifetime || u.daysToExpiry === null || u.daysToExpiry === undefined) {
                                  return (
                                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 whitespace-nowrap">
                                      ♾️ Vitalicio
                                    </div>
                                  );
                                }
                                return (
                                  <div className="text-[11px] font-semibold text-text-tertiary mt-1 whitespace-nowrap">
                                    {u.daysToExpiry < 0 ? 'Expiró hace ' + Math.abs(u.daysToExpiry) + 'd' : `${u.daysToExpiry}d restantes`}
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="px-4 py-3.5 align-middle">
                              <span className="font-semibold text-text-secondary text-xs">{u.ambassadorName}</span>
                            </td>

                            <td className="px-4 py-3.5 text-right align-middle">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => setContactUser(u as any)}
                                  className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Seguimiento CRM, WhatsApp o Campaña de Correo"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>CRM</span>
                                </button>

                                {isAdmin && (
                                  <button
                                    onClick={() => openAttributionModal(u)}
                                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-surface-secondary border border-border-medium/40 hover:bg-surface-hover transition-colors shadow-sm cursor-pointer"
                                  >
                                    Atribuir
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Commissions */}
        {activeTab === 'commissions' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2 mb-3 sm:mb-4">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 shrink-0" />
                <span>Historial y Detalle de Comisiones</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead className="bg-surface-secondary/60 border-b border-border-medium/40 font-bold uppercase text-[11px] text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3.5 min-w-[220px]">Usuario Referido</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Plan & Modalidad</th>
                      <th className="px-4 py-3.5 min-w-[130px]">Última Actividad</th>
                      <th className="px-4 py-3.5 min-w-[150px]">Vigencia / Vencimiento</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Monto Transacción</th>
                      <th className="px-4 py-3.5 min-w-[100px]">Porcentaje</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Comisión</th>
                      <th className="px-4 py-3.5 min-w-[100px]">Estado</th>
                      <th className="px-4 py-3.5 min-w-[110px]">Fecha</th>
                      <th className="px-4 py-3.5 text-right min-w-[110px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-medium/20">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-text-tertiary text-sm">
                          No hay registros de comisiones aún.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex flex-col min-w-0">
                              <span
                                onClick={() => setContactUser({
                                  id: c.userId || c.id,
                                  userId: c.userId,
                                  name: c.referredUserName,
                                  email: c.referredUserEmail,
                                  phone: c.phone,
                                  role: c.role || 'USER',
                                  subscriptionType: c.subscriptionType || 'pro',
                                  planInterval: c.planInterval,
                                  planExpiresAt: c.planExpiresAt,
                                  daysToExpiry: c.daysToExpiry,
                                  daysInactive: c.daysInactive,
                                  accountStatus: c.accountStatus || 'active',
                                })}
                                className="font-bold text-text-primary text-sm hover:text-teal-600 cursor-pointer transition-colors"
                              >
                                {c.referredUserName}
                              </span>
                              <span className="text-xs text-text-tertiary font-normal truncate max-w-[180px] mt-0.5">{c.referredUserEmail}</span>
                              {c.phone && (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${c.phone.replace(/[^0-9]/g, '').length === 10 && c.phone.replace(/[^0-9]/g, '').startsWith('3') ? `57${c.phone.replace(/[^0-9]/g, '')}` : c.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold mt-1"
                                >
                                  <MessageSquare className="w-3 h-3 shrink-0" />
                                  <span>{c.phone}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-middle">
                            {(() => {
                              const p = formatPlanBadge(c.subscriptionType, c.planInterval);
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase whitespace-nowrap ${p.className}`}>
                                  {p.label}
                                </span>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-3.5 align-middle">
                            <div className="text-xs text-text-primary font-medium">
                              {c.daysInactive === 0 ? '🟢 Activo hoy' : `Hace ${c.daysInactive || 0} días`}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-middle">
                            {(() => {
                              const p = formatPlanBadge(c.subscriptionType, c.planInterval);
                              if (p.isLifetime || c.daysToExpiry === null || c.daysToExpiry === undefined) {
                                return (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                                    ♾️ Vitalicio
                                  </span>
                                );
                              }
                              return (
                                <div className="text-xs font-semibold whitespace-nowrap">
                                  {c.daysToExpiry < 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400">🔴 Venció hace {Math.abs(c.daysToExpiry)}d</span>
                                  ) : c.daysToExpiry <= 30 ? (
                                    <span className="text-amber-600 dark:text-amber-400">🟡 {c.daysToExpiry}d restantes</span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400">🟢 {c.daysToExpiry}d restantes</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-3.5 align-middle font-medium text-xs whitespace-nowrap">${(c.amount / 100).toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3.5 align-middle font-extrabold text-teal-600 dark:text-teal-400 text-xs whitespace-nowrap">{c.commissionRate * 100}%</td>
                          <td className="px-4 py-3.5 align-middle font-bold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">${(c.commissionAmount / 100).toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-text-tertiary text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                          
                          <td className="px-4 py-3.5 text-right align-middle">
                            <button
                              onClick={() => setContactUser({
                                id: c.userId || c.id,
                                userId: c.userId,
                                name: c.referredUserName,
                                email: c.referredUserEmail,
                                phone: c.phone,
                                role: c.role || 'USER',
                                subscriptionType: c.subscriptionType || 'pro',
                                planInterval: c.planInterval,
                                planExpiresAt: c.planExpiresAt,
                                daysToExpiry: c.daysToExpiry,
                                daysInactive: c.daysInactive,
                                accountStatus: c.accountStatus || 'active',
                              })}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                              title="Enviar Correo de Campaña o Mensaje WhatsApp"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Contactar</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Network Panel (Leader & Admin) */}
        {activeTab === 'network' && (isAdmin || isLeader) && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2 mb-3 sm:mb-4">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 shrink-0" />
                <span>Consolidado de Embajadores de la Red</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-surface-secondary/60 border-b border-border-medium/40 font-bold uppercase text-[11px] text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3.5 min-w-[260px]">Embajador</th>
                      <th className="px-4 py-3.5 min-w-[150px]">Código Link (Slug)</th>
                      <th className="px-4 py-3.5 min-w-[200px]">Tipo / Rol</th>
                      <th className="px-4 py-3.5 min-w-[120px]">Referidos Totales</th>
                      <th className="px-4 py-3.5 min-w-[160px]">Comisiones Devengadas</th>
                      <th className="px-4 py-3.5 min-w-[130px]">Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-medium/20">
                    {networkStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-text-tertiary text-sm">
                          No hay embajadores registrados en la red.
                        </td>
                      </tr>
                    ) : (
                      networkStats.map((p, idx) => (
                        <tr key={p.partnerId} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-start gap-2.5">
                              {idx === 0 && <span className="text-base shrink-0 select-none mt-0.5" title="Embajador TOP del mes">🥇</span>}
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-text-primary text-sm leading-snug whitespace-normal">{p.name}</span>
                                <span className="text-xs text-text-tertiary font-normal mt-0.5 whitespace-nowrap">{p.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle font-mono text-teal-600 dark:text-teal-400 font-semibold text-xs whitespace-nowrap">
                            <span className="bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">{p.slug}</span>
                          </td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap shadow-sm ${
                              p.type === 'embajador'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                                : 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40'
                            }`}>
                              {p.type === 'embajador' ? '👑 Líder (30% + 5% Red)' : '✨ Estándar (20% → 25%)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle font-bold text-text-primary text-sm whitespace-nowrap">{p.totalReferrals}</td>
                          <td className="px-4 py-3.5 align-middle font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                            ${(p.totalCommission / 100).toLocaleString('es-CO')} COP
                          </td>
                          <td className="px-4 py-3.5 align-middle text-text-tertiary text-xs whitespace-nowrap">{p.daysSinceLastReferral}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Commercial Proposals with AI */}
        {activeTab === 'proposals' && (
          <CommercialProposalGenerator
            ambassadorName={user?.name || 'Asesor Comercial WAPPY'}
            ambassadorPhone={user?.phoneNumber || (user as any)?.phone || ''}
            ambassadorEmail={user?.email || 'contacto@wappy.club'}
            referralLink={myReferralLink || 'https://wappy.club'}
          />
        )}
      </div>

      {/* Admin Attribution Change Modal */}
      {selectedUserForAttr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 border-b border-border-medium/30 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  <span>Atribuir Embajador & Comisión</span>
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Gestiona la asignación comercial y comisiones del usuario.
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAttr(null)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover"
              >
                ✕
              </button>
            </div>

            {/* Target User Info Card */}
            <div className="bg-surface-secondary/70 border border-border-medium/40 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-text-primary">{selectedUserForAttr.name}</div>
                <div className="text-[11px] text-text-tertiary">{selectedUserForAttr.email}</div>
                {selectedUserForAttr.phone && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{selectedUserForAttr.phone}</div>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                {(() => {
                  const p = formatPlanBadge(selectedUserForAttr.subscriptionType, selectedUserForAttr.planInterval);
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase ${p.className}`}>
                      {p.label}
                    </span>
                  );
                })()}
                <span className="text-[10px] font-semibold text-text-secondary">
                  {selectedUserForAttr.paymentStatus === 'paid' ? '✅ Pago Activo' : selectedUserForAttr.paymentStatus === 'trial' ? '⏳ En Prueba' : '⚪ Sin Pago'}
                </span>
              </div>
            </div>

            {/* Select Partner */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase">
                Embajador Propietario <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetPartnerId}
                onChange={(e) => setTargetPartnerId(e.target.value)}
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 font-medium"
              >
                <option value="">-- Sin Embajador (Desvincular) --</option>
                {networkStats.map(p => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.name} ({p.slug}) {p.isLeader ? '🌟 Líder (30%)' : '💼 Estándar (20-25%)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Commission Handling Section */}
            {targetPartnerId && (
              <div className="space-y-3 pt-2 border-t border-border-medium/30">
                <label className="block text-[11px] font-bold text-text-secondary uppercase">
                  Manejo de Comisión Retroactiva
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateCommission(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      createCommission
                        ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-900/20 shadow-sm'
                        : 'border-border-medium/40 bg-surface-primary hover:bg-surface-hover opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                      <span>💰</span>
                      <span>Generar Comisión</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Acredita la comisión al embajador por el pago ya realizado.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateCommission(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !createCommission
                        ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-900/20 shadow-sm'
                        : 'border-border-medium/40 bg-surface-primary hover:bg-surface-hover opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                      <span>🚫</span>
                      <span>Sin Comisión</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Solo vincula el usuario a su red (seguimiento y futuras ventas).
                    </p>
                  </button>
                </div>

                {createCommission && (
                  <div className="bg-surface-secondary/50 border border-border-medium/40 rounded-xl p-3.5 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                        Plan Pagado por el Usuario
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCommissionPreset('anual');
                            setCustomTxAmount(600000);
                          }}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            commissionPreset === 'anual'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Anual</div>
                          <div className="text-[10px] opacity-85">$600.000 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCommissionPreset('semestral');
                            setCustomTxAmount(350000);
                          }}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            commissionPreset === 'semestral'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Semestral</div>
                          <div className="text-[10px] opacity-85">$350.000 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCommissionPreset('mensual');
                            setCustomTxAmount(97180);
                          }}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            commissionPreset === 'mensual'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Mensual</div>
                          <div className="text-[10px] opacity-85">$97.180 COP</div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                          Porcentaje de Comisión
                        </label>
                        <select
                          value={customCommRate}
                          onChange={(e) => setCustomCommRate(Number(e.target.value))}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                        >
                          <option value={0.30}>30% (Líder / Estándar)</option>
                          <option value={0.25}>25% (Avanzado)</option>
                          <option value={0.20}>20% (Base)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                          Estado de la Comisión
                        </label>
                        <select
                          value={commissionStatus}
                          onChange={(e) => setCommissionStatus(e.target.value as 'pending' | 'paid')}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                        >
                          <option value="pending">⏳ Pendiente de Pago</option>
                          <option value="paid">✅ Ya Pagada (Liquidada)</option>
                        </select>
                      </div>
                    </div>

                    {/* Calculated Summary Box */}
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="text-[11px] text-teal-800 dark:text-teal-200 font-medium">
                        Comisión devengada a registrar:
                      </div>
                      <div className="text-sm font-extrabold text-teal-700 dark:text-teal-300">
                        ${Math.round(
                          (commissionPreset === 'anual' ? 600000 : commissionPreset === 'semestral' ? 350000 : commissionPreset === 'mensual' ? 97180 : customTxAmount) * customCommRate
                        ).toLocaleString('es-CO')} COP
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-medium/30">
              <button
                onClick={() => setSelectedUserForAttr(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminAttribute}
                disabled={isAttributing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isAttributing ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Follow-up & Campaign Modal (Email & WhatsApp) */}
      {contactUser && (
        <AmbassadorContactModal
          user={contactUser}
          referralLink={myReferralLink || `https://wappy.club`}
          onClose={() => setContactUser(null)}
        />
      )}
    </div>
  );
}
