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
  Layers,
  MapPin,
  Plus,
  Minus,
  Percent,
  Calculator,
  Building,
  Edit3,
  Trash2,
  Check
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
  city?: string;
  department?: string;
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
  const [planPreset, setPlanPreset] = useState<'anual' | 'semestral' | 'trimestral' | 'mensual' | 'vital' | 'custom'>('mensual');
  const [extraCompanies, setExtraCompanies] = useState<number>(0);
  const [paymentDiscount, setPaymentDiscount] = useState<number>(0); // 0 = 0%, 5 = 5% Nequi, etc.
  const [customNetPaidAmount, setCustomNetPaidAmount] = useState<number>(114330);
  const [isManualAmount, setIsManualAmount] = useState<boolean>(false);
  const [customCommRate, setCustomCommRate] = useState<number>(0.30);
  const [commissionStatus, setCommissionStatus] = useState<'pending' | 'paid'>('pending');

  const calculateDerivedAmounts = (
    preset: string,
    extras: number,
    discountPct: number
  ) => {
    let basePlanPrice = 0;
    let extraCompanyUnit = 33350;

    switch (preset) {
      case 'anual':
        basePlanPrice = 1200000;
        extraCompanyUnit = 350000; // $350.000 COP anual
        break;
      case 'semestral':
        basePlanPrice = 641960;
        extraCompanyUnit = 187240; // $187.240 COP semestral
        break;
      case 'trimestral':
        basePlanPrice = 331270;
        extraCompanyUnit = 96620; // $96.620 COP trimestral
        break;
      case 'mensual':
        basePlanPrice = 114330;
        extraCompanyUnit = 33350; // $33.350 COP mensual
        break;
      case 'vital':
        basePlanPrice = 350000;
        extraCompanyUnit = 350000;
        break;
      default:
        basePlanPrice = 114330;
        extraCompanyUnit = 33350;
    }

    const subtotalBruto = basePlanPrice + (extras * extraCompanyUnit);
    const discountAmount = Math.round(subtotalBruto * (discountPct / 100));
    const netoPagado = Math.max(0, subtotalBruto - discountAmount);

    return {
      basePlanPrice,
      extraCompanyUnit,
      subtotalBruto,
      discountAmount,
      netoPagado
    };
  };

  const updateCalculatedPrice = (
    newPreset = planPreset,
    newExtras = extraCompanies,
    newDiscount = paymentDiscount
  ) => {
    const calc = calculateDerivedAmounts(newPreset, newExtras, newDiscount);
    if (!isManualAmount) {
      setCustomNetPaidAmount(calc.netoPagado);
    }
  };

  const openAttributionModal = (u: ReferredUser) => {
    setSelectedUserForAttr(u);
    setTargetPartnerId(u.ambassadorId || '');
    const isProPaid = u.role === 'USER_PRO' || u.paymentStatus === 'paid';
    setCreateCommission(isProPaid);

    let initialPreset: 'anual' | 'semestral' | 'trimestral' | 'mensual' | 'vital' | 'custom' = 'mensual';
    if (u.planInterval === 'anual') {
      initialPreset = 'anual';
    } else if (u.planInterval === 'semestral') {
      initialPreset = 'semestral';
    } else if (u.planInterval === 'trimestral') {
      initialPreset = 'trimestral';
    } else if (u.subscriptionType === 'vital') {
      initialPreset = 'vital';
    } else {
      initialPreset = 'mensual';
    }

    setPlanPreset(initialPreset);
    setExtraCompanies(0);
    setPaymentDiscount(0);
    setIsManualAmount(false);

    const calc = calculateDerivedAmounts(initialPreset, 0, 0);
    setCustomNetPaidAmount(calc.netoPagado);
    setCustomCommRate(0.30);
    setCommissionStatus('pending');
  };

  // Admin Direct Commission Edit & Delete State
  const [selectedCommForEdit, setSelectedCommForEdit] = useState<CommissionItem | null>(null);
  const [editCommAmount, setEditCommAmount] = useState<number>(0);
  const [editCommRate, setEditCommRate] = useState<number>(0.30);
  const [editCommStatus, setEditCommStatus] = useState<string>('pending');
  const [isUpdatingComm, setIsUpdatingComm] = useState<boolean>(false);

  const openCommissionEditModal = (c: CommissionItem) => {
    setSelectedCommForEdit(c);
    setEditCommAmount(c.amount);
    setEditCommRate(c.commissionRate);
    setEditCommStatus(c.status);
  };

  const handleUpdateCommission = async () => {
    if (!selectedCommForEdit) return;
    try {
      setIsUpdatingComm(true);
      const calculatedComm = Math.round(editCommAmount * editCommRate);
      await axios.put(`/api/referrals/commissions/${selectedCommForEdit.id}`, {
        amount: editCommAmount,
        commissionRate: editCommRate,
        commissionAmount: calculatedComm,
        status: editCommStatus
      });
      showToast({ message: '¡Comisión actualizada exitosamente!', status: 'success' });
      setSelectedCommForEdit(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al actualizar comisión.', status: 'error' });
    } finally {
      setIsUpdatingComm(false);
    }
  };

  const handleDeleteCommission = async (commId: string, clientName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la comisión de ${clientName}? Esta acción borrará el registro de la base de datos.`)) {
      return;
    }
    try {
      await axios.delete(`/api/referrals/commissions/${commId}`);
      showToast({ message: 'Comisión eliminada correctamente.', status: 'success' });
      fetchDashboardData();
    } catch (err: any) {
      showToast({ message: err.response?.data?.error || 'Error al eliminar la comisión.', status: 'error' });
    }
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

  const [selectedAmbassadorFilter, setSelectedAmbassadorFilter] = useState<string>('all');

  // Filter users by selected ambassador (for Admins / Leaders)
  const ambassadorFilteredUsers = React.useMemo(() => {
    if (selectedAmbassadorFilter === 'all') return referredUsers;
    const partner = networkStats.find(p => p.partnerId === selectedAmbassadorFilter || p.slug === selectedAmbassadorFilter);
    return referredUsers.filter(u => 
      u.ambassadorId === selectedAmbassadorFilter || 
      (partner && (u.ambassadorSlug === partner.slug || u.ambassadorName.toLowerCase() === partner.name.toLowerCase()))
    );
  }, [referredUsers, selectedAmbassadorFilter, networkStats]);

  // Filter commissions by selected ambassador
  const ambassadorFilteredCommissions = React.useMemo(() => {
    if (selectedAmbassadorFilter === 'all') return commissions;
    const userEmails = new Set(ambassadorFilteredUsers.map(u => u.email.toLowerCase()));
    return commissions.filter(c => userEmails.has(c.referredUserEmail.toLowerCase()));
  }, [commissions, selectedAmbassadorFilter, ambassadorFilteredUsers]);

  // Dynamically recalculated KPIs based on selected ambassador
  const activeKpis = React.useMemo(() => {
    if (!kpis) return null;
    if (selectedAmbassadorFilter === 'all') return kpis;

    const totalReferred = ambassadorFilteredUsers.length;
    const activeProCount = ambassadorFilteredUsers.filter(u => u.role === 'USER_PRO' || u.subscriptionType === 'pro' || u.subscriptionType === 'vital' || u.paymentStatus === 'paid').length;
    const expiringSoonCount = ambassadorFilteredUsers.filter(u => u.trafficLight === 'yellow' && u.daysToExpiry !== null && u.daysToExpiry <= 30).length;
    const missingPhoneCount = ambassadorFilteredUsers.filter(u => !u.phone || u.phone.trim() === '').length;
    const inactiveCount = ambassadorFilteredUsers.filter(u => u.daysInactive >= 30).length;
    const totalGrowth7Days = ambassadorFilteredUsers.filter(u => (new Date().getTime() - new Date(u.registrationDate).getTime()) <= 7 * 24 * 60 * 60 * 1000).length;

    const totalCommissionsEarned = ambassadorFilteredCommissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const totalCommissionsPending = ambassadorFilteredCommissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const totalCommissionsPaid = ambassadorFilteredCommissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

    const partner = networkStats.find(p => p.partnerId === selectedAmbassadorFilter || p.slug === selectedAmbassadorFilter);

    return {
      ...kpis,
      totalReferred,
      activeProCount,
      expiringSoonCount,
      missingPhoneCount,
      inactiveCount,
      totalGrowth7Days,
      totalCommissionsEarned,
      totalCommissionsPending,
      totalCommissionsPaid,
      topAmbassadorName: partner?.name || 'Asesor Seleccionado',
    };
  }, [kpis, selectedAmbassadorFilter, ambassadorFilteredUsers, ambassadorFilteredCommissions, networkStats]);

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

    const exportUsers = selectedAmbassadorFilter === 'all' ? referredUsers : ambassadorFilteredUsers;
    const isFiltered = selectedAmbassadorFilter !== 'all';
    const filterPartner = networkStats.find(p => p.partnerId === selectedAmbassadorFilter || p.slug === selectedAmbassadorFilter);

    let csv = '\uFEFF'; // UTF-8 BOM for Excel to recognize accents
    csv += 'sep=;\n'; // Explicit delimiter directive for Excel

    // SECTION 1: CONSOLIDADO DE EMBAJADORES Y KPIS
    csv += '========================================================================================\n';
    csv += `REPORTE DE GESTIÓN COMERCIAL Y KPIS - WAPPY IA (${new Date().toLocaleDateString('es-CO')})\n`;
    csv += `ÁMBITO DEL REPORTE:;${isFiltered ? `Embajador Específico: ${filterPartner?.name || selectedAmbassadorFilter}` : 'Toda la Red de Embajadores (Consolidado General)'}\n`;
    csv += `GENERADO POR:;${user?.name || 'Administrador WAPPY'}\n`;
    csv += '========================================================================================\n\n';

    csv += '--- 1. RESUMEN EJECUTIVO Y RENDICIÓN DE CUENTAS POR ASESOR ---\n';
    csv += [
      'Embajador / Asesor',
      'Código / Slug',
      'Correo',
      'Total Prospectos',
      'Activos PRO / Vital',
      'En Prueba (15 Días)',
      'Tasa de Conversión (%)',
      'Contactados en CRM',
      'Propuestas Enviadas',
      'Comisiones Totales COP',
      'Comisiones Pendientes COP',
      'Comisiones Pagadas COP'
    ].join(';') + '\n';

    // Aggregate partners
    const partnersToReport = isFiltered && filterPartner ? [filterPartner] : networkStats;
    partnersToReport.forEach(p => {
      const pUsers = referredUsers.filter(u => u.ambassadorId === p.partnerId || u.ambassadorSlug === p.slug || u.ambassadorName.toLowerCase() === p.name.toLowerCase());
      const proCount = pUsers.filter(u => u.role === 'USER_PRO' || u.subscriptionType === 'pro' || u.subscriptionType === 'vital' || u.paymentStatus === 'paid').length;
      const trialCount = pUsers.filter(u => u.role !== 'USER_PRO' && u.daysToExpiry !== null && u.daysToExpiry > 0).length;
      const contactCount = pUsers.filter(u => u.crmStage && u.crmStage !== 'nuevo').length;
      const proposalCount = pUsers.filter(u => u.crmStage === 'propuesta' || (u.crmNotes && u.crmNotes.some((n: any) => n.type === 'proposal'))).length;
      const convRate = pUsers.length > 0 ? ((proCount / pUsers.length) * 100).toFixed(1) : '0.0';

      const pComms = commissions.filter(c => pUsers.some(u => u.email.toLowerCase() === c.referredUserEmail.toLowerCase()));
      const pendingComm = pComms.filter(c => c.status === 'pending').reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
      const paidComm = pComms.filter(c => c.status === 'paid').reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
      const totalComm = pendingComm + paidComm;

      csv += [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.slug}"`,
        `"${p.email}"`,
        pUsers.length,
        proCount,
        trialCount,
        `"${convRate}%"`,
        contactCount,
        proposalCount,
        `"${totalComm.toLocaleString('es-CO')}"`,
        `"${pendingComm.toLocaleString('es-CO')}"`,
        `"${paidComm.toLocaleString('es-CO')}"`
      ].join(';') + '\n';
    });

    csv += '\n--- 2. DETALLE DE PROSPECTOS REGISTRADOS Y SEGUIMIENTO CRM ---\n';
    const detailHeaders = [
      'Nombre del Cliente',
      'Correo Electrónico',
      'WhatsApp / Teléfono',
      'Ciudad',
      'Departamento',
      'Embajador Asignado',
      'Etapa CRM',
      'Rol / Cuenta',
      'Plan / Suscripción',
      'Estado de Pago',
      'Fecha de Registro',
      'Días para Vencimiento',
      'Días Inactivo',
      'Semáforo',
      'Último Contacto'
    ];
    csv += detailHeaders.join(';') + '\n';

    exportUsers.forEach(u => {
      const crmStageLabel = CRM_STAGES.find(s => s.id === (u.crmStage || 'nuevo'))?.label || u.crmStage || 'Sin Contactar';
      csv += [
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.phone || ''}"`,
        `"${(u.city || '').replace(/"/g, '""')}"`,
        `"${(u.department || '').replace(/"/g, '""')}"`,
        `"${u.ambassadorName.replace(/"/g, '""')}"`,
        `"${crmStageLabel}"`,
        `"${u.role}"`,
        `"${u.subscriptionType}${u.planInterval ? ` (${u.planInterval})` : ''}"`,
        `"${u.paymentStatus}"`,
        `"${new Date(u.registrationDate).toLocaleDateString('es-CO')}"`,
        u.daysToExpiry !== null ? u.daysToExpiry : 'N/A',
        u.daysInactive,
        `"${u.trafficLight}"`,
        u.lastContactedAt ? `"${new Date(u.lastContactedAt).toLocaleDateString('es-CO')}"` : 'Nunca'
      ].join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = isFiltered 
      ? `Wappy_Reporte_${filterPartner?.slug || 'embajador'}_${new Date().toISOString().slice(0, 10)}.csv`
      : `Wappy_Reporte_General_Red_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({ message: '¡Reporte comercial exportado exitosamente con formato Excel multisección!', status: 'success' });
  };

  const handleAdminAttribute = async () => {
    if (!selectedUserForAttr) return;
    try {
      setIsAttributing(true);
      const txAmount = Math.round(Number(customNetPaidAmount) || 0);
      const rate = Number(customCommRate) || 0.30;
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
          ? `Atribución y comisión de $${calculatedComm.toLocaleString('es-CO')} COP guardadas con éxito.` 
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
  const filteredUsers = ambassadorFilteredUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      (u.city && u.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const totalLeadsCount = ambassadorFilteredUsers.length;
  const contactedLeadsCount = ambassadorFilteredUsers.filter(u => {
    const st = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
    return st !== 'nuevo' && st !== 'invalido';
  }).length;
  const interestedLeadsCount = ambassadorFilteredUsers.filter(u => (u.crmStage || '') === 'interesado').length;
  const proposalsSentCount = ambassadorFilteredUsers.filter(u => (u.crmStage || '') === 'propuesta').length;
  const wonLeadsCount = ambassadorFilteredUsers.filter(u => {
    const st = u.crmStage || (u.subscriptionType?.toLowerCase().includes('pro') ? 'ganado' : 'nuevo');
    return st === 'ganado' || u.role === 'USER_PRO' || u.paymentStatus === 'paid';
  }).length;
  const contactRate = totalLeadsCount > 0 ? Math.round((contactedLeadsCount / totalLeadsCount) * 100) : 0;
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 relative min-h-screen h-auto overflow-y-auto pb-12 w-full max-w-full overflow-x-hidden">
      {/* Header section - exact same style as Centro de Control ACPM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-3.5 sm:p-4 md:p-6 bg-white dark:bg-gray-900 border-b border-border-medium/40 gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl md:text-2xl font-extrabold flex items-center gap-2 sm:gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-teal-500 shrink-0" />
            <span className="truncate">
              {isAdmin 
                ? 'Dashboard de Embajadores & Métricas del Sistema' 
                : isLeader 
                  ? 'Dashboard de Líder de Embajadores WAPPY' 
                  : 'Dashboard de Embajador WAPPY — Mis Métricas y Referidos'}
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 truncate">
            {isAdmin 
              ? 'Control general de usuarios referidos, atribución de registros, estado de pagos y comisiones en tiempo real.'
              : 'Haz seguimiento a tus usuarios registrados, estado de sus planes PRO y comisiones devengadas.'}
          </p>
        </div>

        {/* Button bar matching Centro de Control ACPM expanding button effect */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end flex-wrap sm:flex-nowrap">
          <button
            onClick={toggleDashboard}
            className={`group flex items-center justify-center h-9 px-3 sm:h-10 sm:px-3.5 rounded-xl border border-border-medium/40 text-xs font-bold transition-all duration-300 gap-1.5 sm:gap-2 cursor-pointer shadow-sm ${
              showDashboard 
                ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400' 
                : 'bg-white dark:bg-gray-900 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
            title={showDashboard ? "Ocultar Dashboard" : "Mostrar Dashboard"}
          >
            {showDashboard ? (
              <>
                <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current shrink-0" />
                <span className="hidden sm:inline">Ocultar Analíticas</span>
                <span className="sm:hidden">Ocultar</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current shrink-0" />
                <span className="hidden sm:inline">Ver Analíticas</span>
                <span className="sm:hidden">Analíticas</span>
              </>
            )}
          </button>

          <button
            onClick={exportToCSV}
            className="group flex items-center justify-center h-9 px-3 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white sm:hover:scale-105 active:scale-95"
            title="Exportar Reporte Comercial (Excel / CSV)"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className="text-xs sm:text-sm font-bold tracking-wide">Exportar Reporte</span>
            </div>
          </button>

          <a
            href={`/portafolio?ref=${(networkStats.find(p => p.email === user?.email)?.slug) || user?.username || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center h-9 px-3 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] transition-all duration-300 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-teal-600/15 hover:bg-teal-600/25 text-teal-700 dark:text-teal-300 border-teal-500/30 sm:hover:scale-105 active:scale-95"
            title="Abrir Mi Landing Page de Portafolio"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className="text-xs sm:text-sm font-bold tracking-wide">Ver Mi Landing</span>
            </div>
          </a>

          <button
            onClick={copyReferralLink}
            className="group flex items-center justify-center h-9 px-3 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] transition-all duration-300 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 shrink-0 cursor-pointer border border-transparent outline-none rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white sm:hover:scale-105 active:scale-95"
            title="Copiar mi Link de Referido"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className="text-xs sm:text-sm font-bold tracking-wide">Copiar Mi Link</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Admin / Leader Ambassador Filter Selector */}
        {(isAdmin || isLeader) && (
          <div className="bg-white dark:bg-gray-900 border border-border-medium/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-teal-600 tracking-wider block">
                  Filtrar por Embajador / Asesor
                </span>
                <span className="text-xs font-bold text-text-primary">
                  {selectedAmbassadorFilter === 'all' 
                    ? `Visualizando: Toda la Red (${referredUsers.length} registros totales)` 
                    : `Visualizando Asesor: ${networkStats.find(p => p.partnerId === selectedAmbassadorFilter || p.slug === selectedAmbassadorFilter)?.name || selectedAmbassadorFilter} (${ambassadorFilteredUsers.length} registros)`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedAmbassadorFilter}
                onChange={(e) => setSelectedAmbassadorFilter(e.target.value)}
                className="bg-surface-primary border border-border-medium/80 rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-teal-500 shadow-sm cursor-pointer"
              >
                <option value="all">🌐 Toda la Red ({referredUsers.length} registros totales)</option>
                {networkStats.map((p) => {
                  const count = referredUsers.filter(u => u.ambassadorId === p.partnerId || u.ambassadorSlug === p.slug || u.ambassadorName.toLowerCase() === p.name.toLowerCase()).length;
                  return (
                    <option key={p.partnerId} value={p.partnerId}>
                      👤 {p.name} ({count} registros) — {p.slug}
                    </option>
                  );
                })}
              </select>

              {selectedAmbassadorFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedAmbassadorFilter('all')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-secondary hover:bg-surface-hover text-rose-500 border border-border-medium/60 transition-colors cursor-pointer"
                  title="Restablecer filtro a Toda la Red"
                >
                  ✕ Ver Todos
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upper Dashboard KPI Cards (Collapsible) */}
        {showDashboard && activeKpis && (
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
              <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{activeKpis.totalReferred}</div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>+{activeKpis.totalGrowth7Days} en 7 días</span>
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
              <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{activeKpis.activeProCount}</div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>{activeKpis.expiringSoonCount} por vencer (≤ 30d)</span>
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
                ${(activeKpis.totalCommissionsEarned / 100).toLocaleString('es-CO')} <span className="text-xs font-bold text-text-tertiary">COP</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-text-secondary">
                <span>Pend: ${(activeKpis.totalCommissionsPending / 100).toLocaleString('es-CO')}</span>
                <span className="text-emerald-600 font-bold">Pag: ${(activeKpis.totalCommissionsPaid / 100).toLocaleString('es-CO')}</span>
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
                    TOP: {activeKpis.topAmbassadorName}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-text-secondary">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                    <span>{activeKpis.inactiveAmbassadorsCount} sin registros &gt; 30d</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base sm:text-lg font-extrabold text-text-primary truncate">
                    20% Comisión Directa
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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
            <span>{isAdmin ? `Usuarios Referidos (${ambassadorFilteredUsers.length})` : `Mis Referidos (${ambassadorFilteredUsers.length})`}</span>
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

              {/* Search & View Switcher Bar (100% Responsive) */}
              <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search box */}
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, correo, WhatsApp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-surface-primary border border-border-medium/40 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  {/* Toggle Table vs Kanban */}
                  <div className="flex items-center bg-surface-primary border border-border-medium/40 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        viewMode === 'kanban'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Tablero Kanban</span>
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border-medium/20">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-secondary font-medium cursor-pointer"
                  >
                    <option value="all">Todos los Roles</option>
                    <option value="USER">USER (Invitado)</option>
                    <option value="USER_PRO">USER_PRO (Wappy Pro)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-secondary font-medium cursor-pointer"
                  >
                    <option value="all">Estado Cuenta</option>
                    <option value="active">Activo</option>
                    <option value="pending">Pendiente</option>
                    <option value="inactive">Inactivo</option>
                  </select>

                  <select
                    value={lightFilter}
                    onChange={(e) => setLightFilter(e.target.value)}
                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-secondary font-medium cursor-pointer"
                  >
                    <option value="all">Todos los Semáforos</option>
                    <option value="green">🟢 Verde (Activo / Al día)</option>
                    <option value="yellow">🟡 Amarillo (Próximo vencer)</option>
                    <option value="red">🔴 Rojo (Vencido / Alerta)</option>
                    <option value="gray">⚪ Gris (Freemium)</option>
                  </select>
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
                                {(u.city || u.department) && (
                                  <div className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1">
                                    <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                                    <span className="truncate max-w-[200px]">{[u.city, u.department].filter(Boolean).join(', ')}</span>
                                  </div>
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
                              <div className="flex items-center justify-end gap-1.5 shrink-0">
                                {isAdmin && (
                                  <button
                                    onClick={() => openAttributionModal(u)}
                                    className="group flex items-center justify-center h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white sm:hover:scale-105 active:scale-95"
                                    title="Editar Cobro, Plan, Add-ons y Comisión de este usuario"
                                  >
                                    <div className="relative flex-shrink-0 flex items-center justify-center">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[180px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                                      <span className="text-[11px] font-bold tracking-wide">Editar Cobro & Atribución</span>
                                    </div>
                                  </button>
                                )}

                                <button
                                  onClick={() => setContactUser(u as any)}
                                  className="group flex items-center justify-center h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-700 text-white sm:hover:scale-105 active:scale-95"
                                  title="Seguimiento CRM, WhatsApp o Campaña de Correo"
                                >
                                  <div className="relative flex-shrink-0 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                                    <span className="text-[11px] font-bold tracking-wide">Seguimiento CRM</span>
                                  </div>
                                </button>
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

                          <td className="px-4 py-3.5 align-middle font-medium text-xs whitespace-nowrap">${c.amount.toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3.5 align-middle font-extrabold text-teal-600 dark:text-teal-400 text-xs whitespace-nowrap">{Math.round(c.commissionRate * 100)}%</td>
                          <td className="px-4 py-3.5 align-middle font-bold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">${c.commissionAmount.toLocaleString('es-CO')} COP</td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-text-tertiary text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                          
                          <td className="px-4 py-3.5 text-right align-middle">
                              <div className="flex items-center justify-end gap-1.5 shrink-0">
                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => openCommissionEditModal(c)}
                                      className="group flex items-center justify-center h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-700 text-white sm:hover:scale-105 active:scale-95"
                                      title="Editar monto o estado de esta comisión"
                                    >
                                      <div className="relative flex-shrink-0 flex items-center justify-center">
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                                        <span className="text-[11px] font-bold tracking-wide">Editar</span>
                                      </div>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteCommission(c.id, c.referredUserName)}
                                      className="group flex items-center justify-center h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer rounded-xl bg-rose-600 hover:bg-rose-700 text-white sm:hover:scale-105 active:scale-95"
                                      title="Eliminar comisión duplicada o incorrecta"
                                    >
                                      <div className="relative flex-shrink-0 flex items-center justify-center">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                                        <span className="text-[11px] font-bold tracking-wide">Eliminar</span>
                                      </div>
                                    </button>
                                  </>
                                )}

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
                                  className="group flex items-center justify-center h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer rounded-xl bg-slate-700 hover:bg-slate-800 text-white sm:hover:scale-105 active:scale-95"
                                  title="Enviar Correo de Campaña o Mensaje WhatsApp"
                                >
                                  <div className="relative flex-shrink-0 flex items-center justify-center">
                                    <Mail className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                                    <span className="text-[11px] font-bold tracking-wide">Contactar</span>
                                  </div>
                                </button>
                              </div>
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selectedUserForAttr.phone && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{selectedUserForAttr.phone}</div>
                  )}
                  {(selectedUserForAttr.city || selectedUserForAttr.department) && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
                      <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                      <span>{[selectedUserForAttr.city, selectedUserForAttr.department].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
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
                  <div className="bg-surface-secondary/50 border border-border-medium/40 rounded-xl p-3.5 space-y-3.5 animate-in fade-in">
                    
                    {/* 1. Plan Preset Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-text-tertiary mb-1.5 uppercase">
                        1. Plan Base Adquirido por el Cliente
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('mensual');
                            setIsManualAmount(false);
                            updateCalculatedPrice('mensual', extraCompanies, paymentDiscount);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'mensual'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Mensual</div>
                          <div className="text-[10px] opacity-85 font-mono">$114.330 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('trimestral');
                            setIsManualAmount(false);
                            updateCalculatedPrice('trimestral', extraCompanies, paymentDiscount);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'trimestral'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Trimestral</div>
                          <div className="text-[10px] opacity-85 font-mono">$331.270 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('semestral');
                            setIsManualAmount(false);
                            updateCalculatedPrice('semestral', extraCompanies, paymentDiscount);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'semestral'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Semestral</div>
                          <div className="text-[10px] opacity-85 font-mono">$641.960 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('anual');
                            setIsManualAmount(false);
                            updateCalculatedPrice('anual', extraCompanies, paymentDiscount);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'anual'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Pro Anual</div>
                          <div className="text-[10px] opacity-85 font-mono">$1.200.000 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('vital');
                            setIsManualAmount(false);
                            updateCalculatedPrice('vital', extraCompanies, paymentDiscount);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'vital'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Wappy Vital</div>
                          <div className="text-[10px] opacity-85 font-mono">$350.000 COP</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlanPreset('custom');
                            setIsManualAmount(true);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            planPreset === 'custom'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Personalizado</div>
                          <div className="text-[10px] opacity-85">Valor Libre</div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Extra Companies (Add-ons) according to periodicity */}
                    <div className="bg-surface-primary border border-border-medium/40 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="text-[11px] font-bold text-text-primary">
                            Empresas Adicionales (Add-ons)
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-text-tertiary">
                          {(() => {
                            const unit = planPreset === 'anual' ? 350000 : planPreset === 'semestral' ? 187240 : planPreset === 'trimestral' ? 96620 : 33350;
                            return `+$${unit.toLocaleString('es-CO')} COP c/u`;
                          })()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newE = Math.max(0, extraCompanies - 1);
                              setExtraCompanies(newE);
                              setIsManualAmount(false);
                              updateCalculatedPrice(planPreset, newE, paymentDiscount);
                            }}
                            disabled={extraCompanies <= 0}
                            className="w-7 h-7 rounded-lg bg-surface-secondary hover:bg-surface-hover border border-border-medium/40 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="w-8 text-center font-black text-sm text-text-primary">
                            {extraCompanies}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const newE = extraCompanies + 1;
                              setExtraCompanies(newE);
                              setIsManualAmount(false);
                              updateCalculatedPrice(planPreset, newE, paymentDiscount);
                            }}
                            className="w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right text-xs font-extrabold text-teal-600 dark:text-teal-400">
                          {(() => {
                            const unit = planPreset === 'anual' ? 350000 : planPreset === 'semestral' ? 187240 : planPreset === 'trimestral' ? 96620 : 33350;
                            const totalExtras = extraCompanies * unit;
                            return totalExtras > 0 ? `+ $${totalExtras.toLocaleString('es-CO')} COP` : '$0 COP';
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 3. Payment Method Discount */}
                    <div>
                      <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                        3. Descuento por Medio de Pago / Pasarela
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentDiscount(0);
                            setIsManualAmount(false);
                            updateCalculatedPrice(planPreset, extraCompanies, 0);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            paymentDiscount === 0
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Sin Descuento (0%)</div>
                          <div className="text-[9px] opacity-80">Tarjeta / PSE</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentDiscount(5);
                            setIsManualAmount(false);
                            updateCalculatedPrice(planPreset, extraCompanies, 5);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            paymentDiscount === 5
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>QR Nequi (-5%)</div>
                          <div className="text-[9px] opacity-80">Transferencia Directa</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentDiscount(10);
                            setIsManualAmount(false);
                            updateCalculatedPrice(planPreset, extraCompanies, 10);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                            paymentDiscount === 10
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <div>Promocional (-10%)</div>
                          <div className="text-[9px] opacity-80">Cupón Especial</div>
                        </button>
                      </div>
                    </div>

                    {/* 4. Net Paid Amount (Dynamic & Editable by Admin) */}
                    <div className="bg-surface-primary border border-border-medium/40 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-teal-600" />
                          <span>Monto Neto Pagado Comisionable ($ COP)</span>
                        </label>
                        {isManualAmount ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualAmount(false);
                              updateCalculatedPrice(planPreset, extraCompanies, paymentDiscount);
                            }}
                            className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                          >
                            ↺ Recalcular Automático
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ✓ Cálculo Automático
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                          $ COP
                        </span>
                        <input
                          type="number"
                          value={customNetPaidAmount}
                          onChange={(e) => {
                            setIsManualAmount(true);
                            setCustomNetPaidAmount(Number(e.target.value) || 0);
                          }}
                          className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl pl-16 pr-3 py-2 text-sm font-black text-text-primary outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Formula breakdown */}
                      <div className="text-[10px] text-text-tertiary flex items-center justify-between pt-1 border-t border-border-medium/20">
                        {(() => {
                          const calc = calculateDerivedAmounts(planPreset, extraCompanies, paymentDiscount);
                          return (
                            <>
                              <span>Base: ${calc.basePlanPrice.toLocaleString('es-CO')}</span>
                              <span>+ Extras: ${((extraCompanies * calc.extraCompanyUnit)).toLocaleString('es-CO')}</span>
                              <span>- Dcto: ${calc.discountAmount.toLocaleString('es-CO')}</span>
                              <span className="font-extrabold text-teal-600">= ${calc.netoPagado.toLocaleString('es-CO')} COP</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 5. Commission Rate & Status */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                          Porcentaje de Comisión
                        </label>
                        <select
                          value={customCommRate}
                          onChange={(e) => setCustomCommRate(Number(e.target.value))}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500 font-bold"
                        >
                          <option value={0.30}>30% (Líder / Estándar Wappy)</option>
                          <option value={0.25}>25% (Avanzado)</option>
                          <option value={0.20}>20% (Base)</option>
                          <option value={0.15}>15% (Especial)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase">
                          Estado de la Comisión
                        </label>
                        <select
                          value={commissionStatus}
                          onChange={(e) => setCommissionStatus(e.target.value as 'pending' | 'paid')}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500 font-bold"
                        >
                          <option value="pending">⏳ Pendiente de Pago</option>
                          <option value="paid">✅ Ya Pagada (Liquidada)</option>
                        </select>
                      </div>
                    </div>

                    {/* Final Calculated Summary Box */}
                    <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[11px] text-teal-900 dark:text-teal-200 font-bold">
                          Comisión Real a Acreditar:
                        </div>
                        <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                          {(customCommRate * 100)}% sobre ${customNetPaidAmount.toLocaleString('es-CO')} COP
                        </div>
                      </div>
                      <div className="text-base font-black text-teal-700 dark:text-teal-300 font-mono">
                        ${Math.round(customNetPaidAmount * customCommRate).toLocaleString('es-CO')} COP
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

      {/* Commission Edit Modal (Admin Only) */}
      {selectedCommForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-primary border border-border-medium/40 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-medium/30 pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-text-primary flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  <span>Editar Comisión Directa</span>
                </h3>
                <p className="text-xs text-text-tertiary">
                  Cliente: <span className="font-bold text-text-secondary">{selectedCommForEdit.referredUserName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCommForEdit(null)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 1. Transaction Amount */}
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Monto Real de la Transacción ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-text-tertiary text-xs">
                    $ COP
                  </span>
                  <input
                    type="number"
                    value={editCommAmount}
                    onChange={(e) => setEditCommAmount(Number(e.target.value) || 0)}
                    className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl pl-16 pr-3 py-2 text-sm font-black text-text-primary outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* 2. Commission Rate */}
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Porcentaje de Comisión
                </label>
                <select
                  value={editCommRate}
                  onChange={(e) => setEditCommRate(Number(e.target.value))}
                  className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-teal-500"
                >
                  <option value={0.30}>30% (Líder / Estándar)</option>
                  <option value={0.25}>25% (Avanzado)</option>
                  <option value={0.20}>20% (Base)</option>
                  <option value={0.15}>15% (Especial)</option>
                </select>
              </div>

              {/* 3. Status */}
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Estado de la Comisión
                </label>
                <select
                  value={editCommStatus}
                  onChange={(e) => setEditCommStatus(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-teal-500"
                >
                  <option value="pending">⏳ Pendiente de Pago</option>
                  <option value="approved">✓ Aprobada para Liquidación</option>
                  <option value="paid">✅ Pagada (Liquidada)</option>
                  <option value="cancelled">🚫 Cancelada / Anulada</option>
                </select>
              </div>

              {/* Summary Box */}
              <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-teal-900 dark:text-teal-200">
                    Comisión Calculada:
                  </div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">
                    {Math.round(editCommRate * 100)}% de ${editCommAmount.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="text-base font-black text-teal-700 dark:text-teal-300 font-mono">
                  ${Math.round(editCommAmount * editCommRate).toLocaleString('es-CO')} COP
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-medium/30">
              <button
                onClick={() => setSelectedCommForEdit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCommission}
                disabled={isUpdatingComm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingComm ? 'Guardando...' : 'Guardar Cambios'}
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
          ambassadorName={user?.name || 'Asesor Comercial WAPPY'}
          ambassadorPhone={user?.phoneNumber || (user as any)?.phone || ''}
          ambassadorEmail={user?.email || 'contacto@wappy.club'}
          onClose={() => setContactUser(null)}
        />
      )}
    </div>
  );
}
