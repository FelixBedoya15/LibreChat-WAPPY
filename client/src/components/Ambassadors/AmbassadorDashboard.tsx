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
  ChevronRight
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';

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
  paymentStatus: string;
  planExpiresAt: string | null;
  daysToExpiry: number | null;
  trafficLight: 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  ambassadorName: string;
  ambassadorSlug: string | null;
  ambassadorId: string | null;
}

interface CommissionItem {
  id: string;
  referredUserName: string;
  referredUserEmail: string;
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

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'commissions' | 'network'>('overview');

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

  // Admin attribution modal state
  const [selectedUserForAttr, setSelectedUserForAttr] = useState<ReferredUser | null>(null);
  const [targetPartnerId, setTargetPartnerId] = useState<string>('');
  const [isAttributing, setIsAttributing] = useState<boolean>(false);

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
      await axios.post('/api/referrals/attribute', {
        targetUserId: selectedUserForAttr.userId,
        partnerId: targetPartnerId || null,
      });
      showToast({ message: 'Atribución de embajador actualizada correctamente.', status: 'success' });
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

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 relative min-h-screen h-auto overflow-y-auto pb-12">
      {/* Header section - exact same style as Centro de Control ACPM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            <Award className="w-7 h-7 text-teal-500" />
            {isAdmin 
              ? 'Dashboard de Embajadores & Métricas del Sistema' 
              : isLeader 
                ? 'Dashboard de Líder de Embajadores WAPPY' 
                : 'Dashboard de Embajador WAPPY — Mis Métricas y Referidos'}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {isAdmin 
              ? 'Control general de usuarios referidos, atribución de registros, estado de pagos y comisiones en tiempo real.'
              : 'Haz seguimiento a tus usuarios registrados, estado de sus planes PRO y comisiones devengadas.'}
          </p>
        </div>

        {/* Button bar matching Centro de Control ACPM */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={toggleDashboard}
            className={`group flex items-center justify-center h-9 px-3.5 sm:h-10 sm:px-4 rounded-xl border border-border-medium/40 text-xs font-bold transition-all duration-300 gap-2 cursor-pointer shadow-sm ${
              showDashboard 
                ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400' 
                : 'bg-white dark:bg-gray-900 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
            title={showDashboard ? "Ocultar Dashboard" : "Mostrar Dashboard"}
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
            onClick={exportToCSV}
            className="group flex items-center justify-center h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-4 transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white sm:hover:scale-105 active:scale-95 gap-2"
            title="Exportar Reporte CSV"
          >
            <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">Exportar Reporte</span>
          </button>

          <button
            onClick={copyReferralLink}
            className="group flex items-center justify-center h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-4 transition-all duration-300 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white sm:hover:scale-105 active:scale-95 gap-2"
            title="Copiar mi Link de Referido"
          >
            <Copy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">Copiar Mi Link</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Upper Dashboard KPI Cards (Collapsible) */}
        {showDashboard && kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
            {/* KPI Card 1 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none group-hover:bg-teal-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {isAdmin ? 'Registros Referidos' : 'Mis Usuarios Referidos'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight">{kpis.totalReferred}</div>
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{kpis.totalGrowth7Days} en los últimos 7 días</span>
              </div>
            </div>

            {/* KPI Card 2 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Planes PRO Activos</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight">{kpis.activeProCount}</div>
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{kpis.expiringSoonCount} por vencer (≤ 30 días)</span>
              </div>
            </div>

            {/* KPI Card 3 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Comisiones Devengadas</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-text-primary tracking-tight">
                ${(kpis.totalCommissionsEarned / 100).toLocaleString('es-CO')} COP
              </div>
              <div className="flex items-center justify-between mt-2 text-xs font-medium text-text-secondary">
                <span>Pendientes: ${(kpis.totalCommissionsPending / 100).toLocaleString('es-CO')}</span>
                <span className="text-emerald-600 font-bold">Pagadas: ${(kpis.totalCommissionsPaid / 100).toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* KPI Card 4 */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {isAdmin || isLeader ? 'Líder & Red Embajadores' : 'Mi Nivel de Embajador'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              {isAdmin || isLeader ? (
                <>
                  <div className="text-lg font-extrabold text-text-primary truncate">
                    TOP: {kpis.topAmbassadorName}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs font-medium text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{kpis.inactiveAmbassadorsCount} sin registros hace &gt; 30 días</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-extrabold text-text-primary">
                    20% Comisión Directa
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Embajador Activo WAPPY</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-medium/40 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-500" />
            Resumen General & Alertas
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4 text-teal-500" />
            {isAdmin ? `Tabla de Usuarios Referidos (${referredUsers.length})` : `Mis Usuarios Referidos (${referredUsers.length})`}
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'commissions'
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-500" />
            Panel de Comisiones
          </button>

          {(isAdmin || isLeader) && (
            <button
              onClick={() => setActiveTab('network')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'network'
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <UserCheck className="w-4 h-4 text-teal-500" />
              Panel de Red (Líder & Admin)
            </button>
          )}
        </div>

        {/* Tab 1: Overview & Alerts */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Alert Cards Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300">Vencimientos Próximos</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Hay {kpis?.expiringSoonCount || 0} usuarios con suscripción por vencer en menos de 30 días. Realiza gestión comercial para renovar.
                  </p>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Phone className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-300">Datos Incompletos</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                    {kpis?.missingPhoneCount || 0} usuarios registrados no poseen número de teléfono capturado en el perfil.
                  </p>
                </div>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Award className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-teal-800 dark:text-teal-300">Link de Referido Activo</h4>
                  <p className="text-xs text-teal-700 dark:text-teal-400 mt-1 truncate">
                    Tu link de atribución: <span className="font-mono underline">{myReferralLink}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Referral link banner */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Tu Enlace Exclusivo de Embajador WAPPY</h3>
                <p className="text-xs text-teal-100 mt-1 max-w-xl">
                  Comparte este enlace para asegurar la regla de primer toque. Cada usuario registrado a través de tu link te generará comisiones sobre sus suscripciones.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  readOnly
                  value={myReferralLink}
                  className="bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-mono border border-white/20 outline-none w-full md:w-80"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Table */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters Bar */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
              {/* Search box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar usuario, correo, WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="USER">USER (Invitado)</option>
                  <option value="USER_PRO">USER_PRO (Wappy Pro)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Estado Cuenta</option>
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Inactivo</option>
                </select>

                <select
                  value={lightFilter}
                  onChange={(e) => setLightFilter(e.target.value)}
                  className="bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
                >
                  <option value="all">Todos los Semáforos</option>
                  <option value="green">🟢 Verde (Activo / Al día)</option>
                  <option value="yellow">🟡 Amarillo (Próximo vencimiento)</option>
                  <option value="red">🔴 Rojo (Vencido / Alerta)</option>
                  <option value="gray">⚪ Gris (Freemium)</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary/50 border-b border-border-medium/40 font-bold uppercase text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3">Usuario & Contacto</th>
                      <th className="px-4 py-3">Rol & Cuenta</th>
                      <th className="px-4 py-3">Registro & Inactividad</th>
                      <th className="px-4 py-3">Suscripción & Pago</th>
                      <th className="px-4 py-3">Vencimiento & Semáforo</th>
                      <th className="px-4 py-3">Embajador Asignado</th>
                      {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-medium/20">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                          No se encontraron usuarios referidos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-text-primary text-sm">{u.name}</div>
                            <div className="text-text-tertiary text-[11px]">{u.email}</div>
                            {u.phone ? (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold mt-0.5"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {u.phone}
                              </a>
                            ) : (
                              <span className="text-[10px] text-rose-500 font-semibold">Sin teléfono</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                              {u.role}
                            </span>
                            <div className="text-[10px] text-text-tertiary uppercase font-bold mt-1">
                              {u.accountStatus}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div>{new Date(u.registrationDate).toLocaleDateString()}</div>
                            <div className="text-[10px] text-text-tertiary">
                              {u.daysInactive === 0 ? 'Activo hoy' : `Hace ${u.daysInactive} días`}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold uppercase text-text-primary">{u.subscriptionType}</div>
                            <div className="text-[10px]">
                              {u.paymentStatus === 'paid' ? (
                                <span className="text-emerald-600 font-bold">Pagado</span>
                              ) : u.paymentStatus === 'expired' ? (
                                <span className="text-rose-600 font-bold">Vencido</span>
                              ) : (
                                <span className="text-gray-500">Sin pago</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {getTrafficLightBadge(u.trafficLight)}
                            {u.daysToExpiry !== null && (
                              <div className="text-[10px] font-semibold text-text-tertiary mt-1">
                                {u.daysToExpiry < 0 ? 'Expiró hace ' + Math.abs(u.daysToExpiry) + ' días' : u.daysToExpiry + ' días restantes'}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-text-secondary">{u.ambassadorName}</span>
                          </td>

                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedUserForAttr(u);
                                  setTargetPartnerId(u.ambassadorId || '');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface-secondary border border-border-medium/40 hover:bg-teal-500/10 hover:text-teal-600 transition-colors"
                              >
                                Atribuir
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Commissions */}
        {activeTab === 'commissions' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-text-primary flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-teal-500" />
                Historial y Detalle de Comisiones
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary/50 border-b border-border-medium/40 font-bold uppercase text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3">Usuario Referido</th>
                      <th className="px-4 py-3">Monto Transacción</th>
                      <th className="px-4 py-3">Porcentaje Aplicado</th>
                      <th className="px-4 py-3">Comisión Generada</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Fecha Generación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-medium/20">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                          No hay registros de comisiones aún.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-text-primary">
                            {c.referredUserName}
                            <div className="text-[10px] text-text-tertiary font-normal">{c.referredUserEmail}</div>
                          </td>
                          <td className="px-4 py-3 font-medium">${(c.amount / 100).toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3 font-extrabold text-teal-600">{c.commissionRate * 100}%</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">${(c.commissionAmount / 100).toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-tertiary">{new Date(c.createdAt).toLocaleDateString()}</td>
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
        {activeTab === 'network' && isLeader && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-text-primary flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-teal-500" />
                Consolidado de Embajadores de la Red
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary/50 border-b border-border-medium/40 font-bold uppercase text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3">Embajador</th>
                      <th className="px-4 py-3">Código Link (Slug)</th>
                      <th className="px-4 py-3">Tipo / Rol</th>
                      <th className="px-4 py-3">Referidos Totales</th>
                      <th className="px-4 py-3">Comisiones Devengadas</th>
                      <th className="px-4 py-3">Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-medium/20">
                    {networkStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                          No hay embajadores registrados en la red.
                        </td>
                      </tr>
                    ) : (
                      networkStats.map((p, idx) => (
                        <tr key={p.partnerId} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-text-primary flex items-center gap-2">
                            {idx === 0 && <span title="Embajador TOP del mes">🥇</span>}
                            {p.name}
                            <div className="text-[10px] text-text-tertiary font-normal">{p.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-teal-600 font-semibold">{p.slug}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              p.type === 'embajador'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20'
                            }`}>
                              {p.type === 'embajador' ? 'Líder (25% + 5% Red)' : 'Estándar (20% → 25%)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-text-primary">{p.totalReferrals}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">${(p.totalCommission / 100).toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3 text-text-tertiary">{p.daysSinceLastReferral}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Attribution Change Modal */}
      {selectedUserForAttr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Asignar Atribución de Embajador</h3>
            <p className="text-xs text-text-secondary">
              Selecciona el embajador al cual se le atribuirá comercialmente el usuario <span className="font-bold text-teal-600">{selectedUserForAttr.name}</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-text-tertiary mb-1 uppercase">Embajador Propietario</label>
              <select
                value={targetPartnerId}
                onChange={(e) => setTargetPartnerId(e.target.value)}
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
              >
                <option value="">-- Sin Embajador --</option>
                {networkStats.map(p => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.name} ({p.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForAttr(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminAttribute}
                disabled={isAttributing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md disabled:opacity-50"
              >
                {isAttributing ? 'Guardando...' : 'Guardar Atribución'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
