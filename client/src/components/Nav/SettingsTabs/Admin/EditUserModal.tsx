import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { formatDateForInput } from '~/utils/dateHelpers';
import axios from 'axios';
import { 
    Award, Users, DollarSign, Landmark, Shield, 
    Mail, Phone, Lock, Calendar, Clock, Loader, AlertTriangle, MessageSquare,
    Building2, MapPin, Cpu, Crown, Sparkles, Zap, CheckCircle2, X
} from 'lucide-react';
import { DEPARTAMENTOS_LIST, getCitiesForDepartment } from '~/utils/colombiaLocations';
import { cn } from '~/utils';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUserUpdated: () => void;
}

const PLAN_TO_ROLE: Record<string, string> = {
    pro: 'USER_PRO',
    plus: 'USER_PLUS',
    go: 'USER_GO',
    ipevar: 'USER_IPEVAR',
    custom: 'USER_CUSTOM',
    admin: 'ADMIN',
    free: 'USER',
};

const ROLE_TO_PLAN: Record<string, string> = {
    USER_PRO: 'pro',
    PRO: 'pro',
    USER_PLUS: 'plus',
    USER_GO: 'go',
    USER_IPEVAR: 'ipevar',
    IPEVAR: 'ipevar',
    USER_CUSTOM: 'custom',
    ADMIN: 'admin',
    USER: 'free',
};

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [activeTab, setActiveTab] = useState<'account' | 'referrals'>('account');
    
    const [formData, setFormData] = useState({
        userId: '',
        name: '',
        username: '',
        email: '',
        role: 'USER',
        plan: 'free',
        accountStatus: 'active',
        password: '',
        inactiveAt: '',
        activeAt: '',
        phoneNumber: '',
        departamento: '',
        ciudad: '',
        companyLimit: '' as any,
        automationLimit: '' as any,
        subUserLimit: '' as any,
    });

    const [createdCompaniesCount, setCreatedCompaniesCount] = useState<number>(0);
    const [createdAutomationsCount, setCreatedAutomationsCount] = useState<number>(0);
    const [createdSubUsersCount, setCreatedSubUsersCount] = useState<number>(0);

    // Referral details from backend
    const [loadingReferrals, setLoadingReferrals] = useState(false);
    const [referralDetails, setReferralDetails] = useState({
        pointsBalance: 0,
        partner: null as any,
        commissionsStats: { pending: 0, approved: 0, requested: 0, paid: 0 },
        payoutRequests: [] as any[]
    });

    // Referral adjustments
    const [commercialTier, setCommercialTier] = useState<'none' | 'partner' | 'embajador'>('none');
    const [partnerSlug, setPartnerSlug] = useState('');
    const [partnerPaymentDetails, setPartnerPaymentDetails] = useState('');
    const [partnerSupportContact, setPartnerSupportContact] = useState('');
    const [pointsAdjustment, setPointsAdjustment] = useState<number>(0);

    // Available ambassadors for assignment
    const [ambassadors, setAmbassadors] = useState<any[]>([]);
    const [selectedAmbassadorId, setSelectedAmbassadorId] = useState<string>('');

    useEffect(() => {
        if (user) {
            const initialPlan = user.plan || ROLE_TO_PLAN[user.role] || 'free';
            const initialActiveAt = formatDateForInput(user.activeAt);
            const initialInactiveAt = formatDateForInput(user.inactiveAt || user.planExpiresAt);

            setFormData({
                userId: user._id,
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                role: user.role || PLAN_TO_ROLE[initialPlan] || 'USER',
                plan: initialPlan,
                accountStatus: user.accountStatus || 'active',
                password: '',
                inactiveAt: initialInactiveAt,
                activeAt: initialActiveAt,
                phoneNumber: user.phoneNumber || '',
                departamento: user.departamento || user.department || '',
                ciudad: user.ciudad || user.city || '',
                companyLimit: user.companyLimit !== null && user.companyLimit !== undefined ? user.companyLimit : '',
                automationLimit: user.automationLimit !== null && user.automationLimit !== undefined ? user.automationLimit : '',
                subUserLimit: user.subUserLimit !== null && user.subUserLimit !== undefined ? user.subUserLimit : '',
            });
            setCreatedCompaniesCount(0);
            setCreatedAutomationsCount(0);
            setCreatedSubUsersCount(0);

            // Reset tab and adjustments
            setActiveTab('account');
            setPointsAdjustment(0);
            
            // Load user referral/partner details
            const loadReferralDetails = async () => {
                try {
                    setLoadingReferrals(true);
                    const response = await axios.get(`/api/admin/users/${user._id}/referral-details`);
                    setReferralDetails(response.data);
                    
                    setFormData(prev => ({
                        ...prev,
                        plan: prev.plan === 'free' && response.data.plan ? response.data.plan : prev.plan,
                        activeAt: prev.activeAt || formatDateForInput(response.data.activeAt),
                        inactiveAt: prev.inactiveAt || formatDateForInput(response.data.inactiveAt || response.data.planExpiresAt),
                        companyLimit: response.data.companyLimit !== null && response.data.companyLimit !== undefined 
                            ? response.data.companyLimit 
                            : prev.companyLimit,
                        automationLimit: response.data.automationLimit !== null && response.data.automationLimit !== undefined 
                            ? response.data.automationLimit 
                            : prev.automationLimit,
                        subUserLimit: response.data.subUserLimit !== null && response.data.subUserLimit !== undefined 
                            ? response.data.subUserLimit 
                            : prev.subUserLimit,
                    }));
                    setCreatedCompaniesCount(response.data.createdCompaniesCount || 0);
                    setCreatedAutomationsCount(response.data.createdAutomationsCount || 0);
                    setCreatedSubUsersCount(response.data.createdSubUsersCount || 0);
                    setSelectedAmbassadorId(response.data.referredByPartner || '');

                    if (response.data.partner) {
                        setCommercialTier(response.data.partner.type || 'partner');
                        setPartnerSlug(response.data.partner.slug || '');
                        setPartnerPaymentDetails(response.data.partner.paymentDetails || '');
                        setPartnerSupportContact(response.data.partner.supportContact || '');
                    } else {
                        setCommercialTier('none');
                        setPartnerSlug('');
                        setPartnerPaymentDetails('');
                        setPartnerSupportContact('');
                    }
                } catch (err: any) {
                    console.error('Error loading user referral details:', err);
                } finally {
                    setLoadingReferrals(false);
                }
            };
            loadReferralDetails();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Sync plan <-> role
        if (name === 'plan') {
            const mappedRole = PLAN_TO_ROLE[value] || 'USER';
            setFormData(prev => ({ ...prev, plan: value, role: mappedRole }));
        } else if (name === 'role') {
            const mappedPlan = ROLE_TO_PLAN[value] || 'free';
            setFormData(prev => ({ ...prev, role: value, plan: mappedPlan }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const addDaysToExpiration = (days: number) => {
        const target = new Date();
        target.setDate(target.getDate() + days);
        setFormData(prev => ({ ...prev, inactiveAt: formatDateForInput(target) }));
    };

    const clearExpiration = () => {
        setFormData(prev => ({ ...prev, inactiveAt: '' }));
    };

    useEffect(() => {
        if (isOpen) {
            const fetchAmbassadors = async () => {
                try {
                    const response = await axios.get('/api/admin/ambassadors');
                    setAmbassadors(response.data);
                } catch (err) {
                    console.error('Error fetching ambassadors:', err);
                }
            };
            fetchAmbassadors();
        }
    }, [isOpen]);

    // Auto-update status based on dates (only for paid roles)
    useEffect(() => {
        const parseLocal = (s: string) => {
            if (!s) return null;
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
        };
        const inactiveAt = parseLocal(formData.inactiveAt);
        const nowStartOfDay = new Date();
        nowStartOfDay.setHours(0, 0, 0, 0);

        const freeRoles = ['USER', 'ADMIN', 'USER_IPEVAR', 'IPEVAR'];
        if (!freeRoles.includes(formData.role) && inactiveAt && nowStartOfDay >= inactiveAt && formData.accountStatus !== 'inactive') {
            setFormData(prev => ({ ...prev, accountStatus: 'inactive' }));
        }
    }, [formData.inactiveAt, formData.activeAt, formData.role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { 
                ...formData,
                commercialTier,
                partnerSlug: commercialTier !== 'none' ? partnerSlug : '',
                partnerPaymentDetails: commercialTier !== 'none' ? partnerPaymentDetails : '',
                partnerSupportContact: commercialTier === 'embajador' ? partnerSupportContact : '',
                pointsAdjustment: pointsAdjustment,
                companyLimit: formData.companyLimit === '' ? null : formData.companyLimit,
                automationLimit: formData.automationLimit === '' ? null : formData.automationLimit,
                subUserLimit: formData.subUserLimit === '' ? null : formData.subUserLimit,
                referredByPartner: selectedAmbassadorId
            };
            if (!payload.password) delete payload.password;

            await axios.post('/api/admin/users/update', payload);
            showToast({ message: localize('com_ui_user_updated_success' as any) || 'Usuario actualizado con éxito', status: 'success' });
            onUserUpdated();
            onClose();
        } catch (error: any) {
            console.error('Error updating user:', error);
            showToast({ message: error.response?.data?.message || localize('com_ui_user_update_error' as any) || 'Error al actualizar usuario', status: 'error' });
        }
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-2xl transition-all border border-slate-200/80 dark:border-zinc-800">
                                
                                {/* Header Somos SST */}
                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800/80 pb-5 mb-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/20">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <DialogTitle as="h3" className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                                <span>Editar Perfil de Usuario</span>
                                                <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 font-mono">
                                                    ({user?.email})
                                                </span>
                                            </DialogTitle>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                                Control de suscripciones, fechas de activación, vencimiento y programa de asociados.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={onClose} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* TAB NAVIGATION (Capsule WAPPY) */}
                                <div className="inline-flex w-full gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 mb-6 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('account')}
                                        className={cn(
                                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                                            activeTab === 'account' 
                                                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-teal-500/20' 
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                                        )}
                                    >
                                        <Users className="w-4 h-4" />
                                        <span>Datos de Cuenta y Plan</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('referrals')}
                                        className={cn(
                                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                                            activeTab === 'referrals' 
                                                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-teal-500/20' 
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                                        )}
                                    >
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <span>Afiliación y Puntos</span>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    
                                    {/* TAB 1: DATOS DE CUENTA */}
                                    {activeTab === 'account' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                            {/* Nombre */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    {localize('com_ui_name' as any) || 'Nombre'}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Usuario */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    {localize('com_ui_username' as any) || 'Usuario'}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Correo */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    {localize('com_ui_email' as any) || 'Correo Electrónico'}
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Teléfono */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono / Contacto
                                                </label>
                                                <input
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                                />
                                            </div>

                                            {/* PLAN DE SUSCRIPCIÓN (DESTACADO) */}
                                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 dark:bg-amber-500/10">
                                                <label className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                                                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Plan de Suscripción WAPPY
                                                </label>
                                                <select
                                                    name="plan"
                                                    value={formData.plan}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                                                >
                                                    <option value="free">Gratis (Invitado)</option>
                                                    <option value="go">Go ($49.200 / mes)</option>
                                                    <option value="plus">Plus ($57.800 / mes)</option>
                                                    <option value="pro">Wappy Pro ⭐ ($39.800 / mes)</option>
                                                    <option value="ipevar">Wappy Vital (Pago único de por vida)</option>
                                                    <option value="custom">A la Medida</option>
                                                    <option value="admin">Administrador del Sistema</option>
                                                </select>
                                                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                                                    Cambiar el plan actualiza automáticamente el rol y permisos correspondientes.
                                                </span>
                                            </div>

                                            {/* ROL DE ACCESO */}
                                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Shield className="w-3.5 h-3.5 text-teal-600" /> Rol de Acceso
                                                </label>
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
                                                >
                                                    <option value="USER">Invitado (USER)</option>
                                                    <option value="USER_GO">Go (USER_GO)</option>
                                                    <option value="USER_PLUS">Plus (USER_PLUS)</option>
                                                    <option value="USER_PRO">Wappy Pro (USER_PRO)</option>
                                                    <option value="USER_IPEVAR">Wappy Vital (USER_IPEVAR)</option>
                                                    <option value="IPEVAR">Wappy Vital Legacy (IPEVAR)</option>
                                                    <option value="USER_CUSTOM">A la Medida (USER_CUSTOM)</option>
                                                    <option value="ADMIN">Administrador (ADMIN)</option>
                                                </select>
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                    Permisos de ejecución y límites según rol del sistema.
                                                </span>
                                            </div>

                                            {/* ESTADO DE CUENTA */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Estado de Cuenta
                                                </label>
                                                <select
                                                    name="accountStatus"
                                                    value={formData.accountStatus}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
                                                >
                                                    <option value="active">Activo</option>
                                                    <option value="pending">Pendiente</option>
                                                    <option value="inactive">Inactivo</option>
                                                </select>
                                            </div>

                                            {/* FECHA DE ACTIVACIÓN */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-emerald-500" /> Fecha de Activación
                                                </label>
                                                <input
                                                    type="date"
                                                    name="activeAt"
                                                    value={formData.activeAt}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                                />
                                            </div>

                                            {/* FECHA DE VENCIMIENTO / INACTIVACIÓN */}
                                            <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-amber-500" /> Fecha de Vencimiento / Inactivación
                                                    </label>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => addDaysToExpiration(30)}
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 transition-colors cursor-pointer"
                                                        >
                                                            +30 días
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => addDaysToExpiration(365)}
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                                                        >
                                                            +1 año
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={clearExpiration}
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                                                        >
                                                            Sin Vencimiento
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    type="date"
                                                    name="inactiveAt"
                                                    value={formData.inactiveAt}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none mt-1"
                                                />
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                                                    Si se deja vacío, la suscripción se considera continua. Los roles libres (USER, ADMIN, Wappy Vital) nunca se bloquearán automáticamente por vencimiento.
                                                </p>
                                            </div>

                                            {/* Departamento */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Departamento
                                                </label>
                                                <select
                                                    name="departamento"
                                                    value={formData.departamento}
                                                    onChange={(e) => {
                                                        const newDept = e.target.value;
                                                        setFormData(prev => ({ ...prev, departamento: newDept, ciudad: '' }));
                                                    }}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer"
                                                >
                                                    <option value="">-- Seleccionar Departamento --</option>
                                                    {DEPARTAMENTOS_LIST.map((dept) => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Ciudad */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Ciudad / Municipio
                                                </label>
                                                {formData.departamento && getCitiesForDepartment(formData.departamento).length > 0 ? (
                                                    <select
                                                        name="ciudad"
                                                        value={formData.ciudad}
                                                        onChange={handleChange}
                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer"
                                                    >
                                                        <option value="">-- Seleccionar Ciudad --</option>
                                                        {getCitiesForDepartment(formData.departamento).map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        name="ciudad"
                                                        placeholder="Escribe la ciudad o municipio"
                                                        value={formData.ciudad}
                                                        onChange={handleChange}
                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                    />
                                                )}
                                            </div>

                                            {/* Límites de uso */}
                                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/30 border border-slate-200/80 dark:border-zinc-800">
                                                {/* Empresas */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                                                        Límite Empresas ({createdCompaniesCount} creadas)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="companyLimit"
                                                        value={formData.companyLimit}
                                                        onChange={handleChange}
                                                        placeholder="Por defecto del plan"
                                                        min={0}
                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                    />
                                                </div>

                                                {/* Automatizaciones */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                                                        Límite Automatiz. ({createdAutomationsCount} creadas)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="automationLimit"
                                                        value={formData.automationLimit}
                                                        onChange={handleChange}
                                                        placeholder="Por defecto (Pro: 1)"
                                                        min={0}
                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                    />
                                                </div>

                                                {/* Sub-usuarios */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                                                        Límite Sub-Usuarios ({createdSubUsersCount} creados)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="subUserLimit"
                                                        value={formData.subUserLimit}
                                                        onChange={handleChange}
                                                        placeholder="Por defecto (Pro: 1)"
                                                        min={0}
                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Contraseña Opcional */}
                                            <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
                                                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Cambiar Contraseña (Opcional)
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Dejar en blanco para conservar contraseña actual"
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: AFILIACIÓN Y PUNTOS */}
                                    {activeTab === 'referrals' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            {loadingReferrals ? (
                                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                                    <Loader className="w-6 h-6 text-teal-500 animate-spin" />
                                                    <span className="text-xs text-slate-500 dark:text-zinc-400">Cargando datos comerciales del usuario...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Puntos Wappy */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] p-4 rounded-2xl border border-emerald-500/25">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                                                                🎁
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">Puntos Wappy</h4>
                                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">Balance acumulado para canjes de suscripción PRO.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 justify-start md:justify-end">
                                                            <div className="text-left md:text-right">
                                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Balance Actual</span>
                                                                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                                                                    {referralDetails.pointsBalance} <span className="text-xs font-normal text-slate-500">pts</span>
                                                                </h4>
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-24">
                                                                <span className="text-[9px] text-slate-400 dark:text-zinc-500">Ajustar Saldo</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="+/- pts"
                                                                    value={pointsAdjustment === 0 ? '' : pointsAdjustment}
                                                                    onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                                                                    className="w-full text-center border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl py-1 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-emerald-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Embajador Asignado */}
                                                    <div className="flex flex-col gap-2 bg-purple-500/[0.03] dark:bg-purple-500/[0.06] p-4 rounded-2xl border border-purple-500/25">
                                                        <label className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                                                            💎 Embajador / Promotor Asignado
                                                        </label>
                                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-1">
                                                            Selecciona el embajador o socio comercial que respalda a esta cuenta.
                                                        </p>
                                                        <select
                                                            value={selectedAmbassadorId}
                                                            onChange={(e) => setSelectedAmbassadorId(e.target.value)}
                                                            className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-purple-500 outline-none cursor-pointer"
                                                        >
                                                            <option value="">Ningún Embajador (Sin Referido)</option>
                                                            {ambassadors.map((amb) => (
                                                                <option key={amb._id} value={amb._id}>
                                                                    {amb.name} ({amb.email}) — [{amb.type === 'embajador' ? 'Embajador Líder' : 'Partner Estándar'}]
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Selector de Rol Comercial */}
                                                    <div className="flex flex-col gap-2.5 bg-slate-50/80 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                                                            🚀 Tipo de Afiliado Comercial de este Usuario
                                                        </span>
                                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCommercialTier('none')}
                                                                className={cn(
                                                                    "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                                                                    commercialTier === 'none' 
                                                                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 shadow-2xs" 
                                                                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                                                                )}
                                                            >
                                                                Asociado Regular
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCommercialTier('partner')}
                                                                className={cn(
                                                                    "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                                                                    commercialTier === 'partner' 
                                                                        ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-2xs" 
                                                                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                                                                )}
                                                            >
                                                                Embajador (20% - 25%)
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCommercialTier('embajador')}
                                                                className={cn(
                                                                    "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                                                                    commercialTier === 'embajador' 
                                                                        ? "border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-2xs" 
                                                                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                                                                )}
                                                            >
                                                                Embajador Líder (30%)
                                                            </button>
                                                        </div>

                                                        {commercialTier !== 'none' && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 border-t border-slate-200 dark:border-zinc-700 pt-3">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase">
                                                                        Código de Referido (Slug)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="ej: felix-socio"
                                                                        value={partnerSlug}
                                                                        onChange={(e) => setPartnerSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                                                        required={true}
                                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-amber-500 outline-none"
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase flex items-center gap-1">
                                                                        <Landmark className="w-3.5 h-3.5 text-slate-400" /> Cuenta de Cobro / Banco
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Cuenta de cobro o banco"
                                                                        value={partnerPaymentDetails}
                                                                        onChange={(e) => setPartnerPaymentDetails(e.target.value)}
                                                                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:border-amber-500 outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons (WAPPY Style) */}
                                    <div className="mt-6 flex justify-end items-center gap-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                            onClick={onClose}
                                        >
                                            {localize('com_ui_cancel' as any) || 'Cancelar'}
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{localize('com_ui_save_changes' as any) || 'Guardar Cambios'}</span>
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
