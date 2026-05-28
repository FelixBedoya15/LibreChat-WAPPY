import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Share2, Copy, Check, Gift, DollarSign, Users, 
    Award, TrendingUp, Save, Clock, ArrowRight, Loader,
    Landmark, Shield, MessageSquare, AlertCircle, HelpCircle, CheckCircle
} from 'lucide-react';
import { useAuthContext } from '~/hooks';

export default function ReferralPanel() {
    const { user, setUser } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [copied, setCopied] = useState<'ref' | 'partner' | null>(null);
    
    // Stats states
    const [stats, setStats] = useState({
        referralLink: '',
        pointsBalance: 0,
        totalEarned: 0,
        referredFriends: [] as any[],
        pointsHistory: [] as any[],
        embajadorSupport: null as { name: string; email: string; slug: string; supportContact: string } | null
    });

    const [partnerStats, setPartnerStats] = useState({
        isPartner: false,
        isPending: false,
        isRejected: false,
        partnerLink: '',
        partner: null as any,
        stats: {
            registeredSignups: 0,
            paidSubscriptions: 0,
            totalEarned: 0,
            pendingCommissions: 0,
            approvedCommissions: 0,
            requestedCommissions: 0,
            paidCommissions: 0
        },
        commissions: [] as any[],
        payoutRequests: [] as any[]
    });

    // Payout and support forms
    const [paymentDetails, setPaymentDetails] = useState('');
    const [supportContact, setSupportContact] = useState('');
    
    // Application forms
    const [appSlug, setAppSlug] = useState('');
    const [appType, setAppType] = useState<'partner' | 'embajador'>('partner');
    const [appPayment, setAppPayment] = useState('');
    const [appSupport, setAppSupport] = useState('');
    const [showApplyForm, setShowApplyForm] = useState(false);

    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [refRes, partnerRes] = await Promise.all([
                axios.get('/api/referrals/stats'),
                axios.get('/api/referrals/partner/stats')
            ]);
            setStats(refRes.data);
            setPartnerStats(partnerRes.data);
            
            if (partnerRes.data.partner) {
                setPaymentDetails(partnerRes.data.partner.paymentDetails || '');
                setSupportContact(partnerRes.data.partner.supportContact || '');
            }
        } catch (err) {
            console.error('Error fetching referral stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const copyToClipboard = (text: string, type: 'ref' | 'partner') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleRedeem = async (rewardType: string) => {
        try {
            setActionLoading(rewardType);
            setMessage(null);
            const response = await axios.post('/api/referrals/redeem', { rewardType });
            
            setMessage({ text: response.data.message, type: 'success' });
            
            setStats(prev => ({
                ...prev,
                pointsBalance: response.data.pointsBalance
            }));

            if (response.data.user) {
                setUser(response.data.user);
            }

            fetchStats();
        } catch (err: any) {
            setMessage({ 
                text: err.response?.data?.error || 'Error al canjear el premio.', 
                type: 'error' 
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSavePartnerSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('partner_settings');
            setMessage(null);
            const response = await axios.post('/api/referrals/partner/apply', { 
                paymentDetails, 
                supportContact 
            });
            setMessage({ text: response.data.message, type: 'success' });
            fetchStats();
        } catch (err: any) {
            setMessage({ 
                text: err.response?.data?.error || 'Error al guardar configuraciones.', 
                type: 'error' 
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleApplyNewPartner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('apply_new');
            setMessage(null);
            const response = await axios.post('/api/referrals/partner/apply-new', {
                slug: appSlug,
                type: appType,
                paymentDetails: appPayment,
                supportContact: appType === 'embajador' ? appSupport : ''
            });
            setMessage({ text: response.data.message, type: 'success' });
            setShowApplyForm(false);
            fetchStats();
        } catch (err: any) {
            setMessage({ 
                text: err.response?.data?.error || 'Error al enviar solicitud.', 
                type: 'error' 
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRequestWithdraw = async () => {
        try {
            setActionLoading('withdraw');
            setMessage(null);
            const response = await axios.post('/api/referrals/partner/withdraw');
            setMessage({ text: response.data.message, type: 'success' });
            fetchStats();
        } catch (err: any) {
            setMessage({ 
                text: err.response?.data?.error || 'Error al solicitar el retiro.', 
                type: 'error' 
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm text-text-secondary">Cargando programa de referidos...</p>
            </div>
        );
    }

    const pointsProgress = Math.min(stats.pointsBalance, 800);
    const progressPercent = (pointsProgress / 800) * 100;

    return (
        <div className="flex flex-col gap-6">
            
            {/* ALERTAS Y MENSAJES DE ÉXITO O ERROR */}
            {message && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm transition-all duration-300 animate-fadeIn ${
                    message.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            {/* WIDGET DE SOPORTE PREMIUM DE EMBAJADOR (SI FUE REFERIDO POR UNO) */}
            {stats.embajadorSupport && (
                <div className="p-5 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-surface-primary to-surface-primary shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
                    <div className="absolute top-[-30px] left-[-30px] w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-600 dark:text-purple-400 flex-shrink-0 shadow-inner">
                            <MessageSquare className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-500/15 px-2.5 py-0.5 rounded-full">Soporte Premium Exclusivo</span>
                            <h4 className="text-sm font-bold text-text-primary mt-1">Asesoría Directa por tu Embajador 💎</h4>
                            <p className="text-xs text-text-secondary mt-0.5">Te registraste con el enlace de <strong>{stats.embajadorSupport.name}</strong>. Cuentas con soporte técnico y comercial ilimitado.</p>
                        </div>
                    </div>
                    {stats.embajadorSupport.supportContact && (
                        <a 
                            href={
                                stats.embajadorSupport.supportContact.includes('@') 
                                    ? `mailto:${stats.embajadorSupport.supportContact}`
                                    : stats.embajadorSupport.supportContact.startsWith('http')
                                    ? stats.embajadorSupport.supportContact
                                    : `https://wa.me/${stats.embajadorSupport.supportContact.replace(/\+/g, '').replace(/\s+/g, '')}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:shadow-purple-500/10 cursor-pointer self-stretch sm:self-auto justify-center"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Contactar Soporte</span>
                        </a>
                    )}
                </div>
            )}

            {/* SECCIÓN 1: WAPPY ASOCIADOS (SISTEMA DE PUNTOS PARA TODOS) */}
            <div className="flex flex-col gap-5 p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-surface-primary to-surface-primary shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Wappy Asociado</span>
                        <h3 className="text-lg font-bold text-text-primary mt-2">Programa de Puntos Asociados Wappy 🎁</h3>
                        <p className="text-xs text-text-secondary mt-1">Recomienda Wappy enviando tu link personal. Tus amigos obtienen 3 días de PRO gratis instantáneos de bienvenida, y tú acumulas puntos para canjear por PRO gratis.</p>
                    </div>
                </div>

                {/* PROGRESO DE PUNTOS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-y border-border-light py-5">
                    <div className="flex items-center gap-4 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 col-span-1">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                            <Award className="w-6 h-6 animate-bounce" />
                        </div>
                        <div>
                            <span className="text-xs text-text-secondary font-medium">Tus Puntos Wappy</span>
                            <h4 className="text-2xl font-bold text-text-primary">{stats.pointsBalance} <span className="text-xs font-normal text-text-secondary">pts</span></h4>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 col-span-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-text-secondary">Progreso de Canje:</span>
                            <span className="text-emerald-500 dark:text-emerald-400 font-bold">{stats.pointsBalance} / 800 pts</span>
                        </div>
                        <div className="w-full h-3 bg-surface-secondary border border-border-light rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-text-tertiary">
                            {stats.pointsBalance >= 800 
                                ? '¡Felicidades! Tienes puntos suficientes para canjear 1 Mes de PRO gratis 🎉' 
                                : `Te faltan ${Math.max(0, 800 - stats.pointsBalance)} puntos para canjear 1 mes completo de PRO gratis.`}
                        </p>
                    </div>
                </div>

                {/* ENLACE DE COPIADO */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-text-secondary uppercase">Tu Enlace Personal de Invitación</span>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={stats.referralLink} 
                            readOnly 
                            className="flex-1 rounded-2xl border border-border-light bg-surface-secondary px-4 py-2.5 text-xs text-text-secondary select-all outline-none"
                        />
                        <button
                            onClick={() => copyToClipboard(stats.referralLink, 'ref')}
                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                            {copied === 'ref' ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>¡Copiado!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    <span>Copiar Enlace</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* CATÁLOGO DE CANJE */}
                <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-text-secondary uppercase mb-1">Catálogo de Premios Plan PRO</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* 1 Semana */}
                        <div className="border border-border-light hover:border-emerald-500/30 bg-surface-secondary/50 rounded-2xl p-4 flex flex-col gap-3 hover:translate-y-[-2px] transition-all relative overflow-hidden group">
                            <div>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">1 Semana PRO</span>
                                <h5 className="text-lg font-bold text-text-primary mt-1">250 <span className="text-xs font-normal text-text-secondary">pts</span></h5>
                            </div>
                            <button
                                disabled={stats.pointsBalance < 250 || actionLoading !== null}
                                onClick={() => handleRedeem('1_week_pro')}
                                className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:bg-surface-secondary disabled:text-text-tertiary disabled:border disabled:border-border-light disabled:cursor-not-allowed"
                            >
                                {actionLoading === '1_week_pro' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Canjear</span>}
                            </button>
                        </div>

                        {/* 2 Semanas */}
                        <div className="border border-border-light hover:border-emerald-500/30 bg-surface-secondary/50 rounded-2xl p-4 flex flex-col gap-3 hover:translate-y-[-2px] transition-all relative overflow-hidden group">
                            <div>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">2 Semanas PRO</span>
                                <h5 className="text-lg font-bold text-text-primary mt-1">450 <span className="text-xs font-normal text-text-secondary">pts</span></h5>
                            </div>
                            <button
                                disabled={stats.pointsBalance < 450 || actionLoading !== null}
                                onClick={() => handleRedeem('2_weeks_pro')}
                                className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:bg-surface-secondary disabled:text-text-tertiary disabled:border disabled:border-border-light disabled:cursor-not-allowed"
                            >
                                {actionLoading === '2_weeks_pro' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Canjear</span>}
                            </button>
                        </div>

                        {/* 1 Mes */}
                        <div className="border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-4 flex flex-col gap-3 hover:translate-y-[-2px] transition-all relative overflow-hidden group border-dashed">
                            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-xl uppercase tracking-wider">RECOMENDADO</div>
                            <div>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">1 Mes PRO Completo 💎</span>
                                <h5 className="text-lg font-bold text-text-primary mt-1">800 <span className="text-xs font-normal text-text-secondary">pts</span></h5>
                            </div>
                            <button
                                disabled={stats.pointsBalance < 800 || actionLoading !== null}
                                onClick={() => handleRedeem('1_month_pro')}
                                className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:bg-surface-secondary disabled:text-text-tertiary disabled:border disabled:border-border-light disabled:cursor-not-allowed"
                            >
                                {actionLoading === '1_month_pro' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Canjear Mes</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* LISTADO DE INVITADOS */}
                {stats.referredFriends.length > 0 && (
                    <div className="mt-2">
                        <span className="text-xs font-bold text-text-secondary uppercase">Amigos Registrados ({stats.referredFriends.length})</span>
                        <div className="mt-2 max-h-40 overflow-y-auto border border-border-light rounded-xl bg-surface-secondary/30 divide-y divide-border-light">
                            {stats.referredFriends.map((friend) => (
                                <div key={friend.id} className="flex justify-between items-center py-2.5 px-3 text-xs">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-text-primary">{friend.name}</span>
                                        <span className="text-text-tertiary">{friend.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-text-tertiary">{new Date(friend.registrationDate).toLocaleDateString()}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            friend.status === 'subscribed' 
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                        }`}>
                                            {friend.status === 'subscribed' ? 'Suscrito PRO' : 'Registrado'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: PANEL DE SOCIO COMERCIAL ACTIVO (PARTNER O EMBAJADOR) */}
            {partnerStats.isPartner && (() => {
                const isEmbajador = partnerStats.partner?.type === 'embajador';
                const tierName = isEmbajador ? 'Wappy Embajador' : 'Wappy Partner';
                const commissionRateText = isEmbajador ? '30%' : '20%';
                
                const borderClass = isEmbajador ? 'border-purple-500/30' : 'border-amber-500/20';
                const gradientClass = isEmbajador ? 'from-purple-500/5' : 'from-amber-500/5';
                const badgeColorClass = isEmbajador 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20' 
                    : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
                const buttonBgClass = isEmbajador ? 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/10' : 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-500/10';
                const focusClass = isEmbajador ? 'focus:border-purple-500' : 'focus:border-amber-500';

                return (
                    <div className={`flex flex-col gap-6 p-6 rounded-3xl border ${borderClass} bg-gradient-to-br ${gradientClass} via-surface-primary to-surface-primary shadow-md relative overflow-hidden animate-fadeIn`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Cabecera del panel de socio */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColorClass} inline-flex items-center gap-1`}>
                                    {isEmbajador ? '💎' : '🚀'} {tierName} ({commissionRateText} Comisión)
                                </span>
                                <h3 className="text-lg font-bold text-text-primary mt-2.5">Mi Centro de Afiliado Comercial Wappy</h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    {isEmbajador 
                                        ? '¡Eres un afiliado élite! Obtienes el 30% en efectivo de tus ventas y estás a cargo de brindar soporte premium a tus referidos.' 
                                        : 'Obtienes el 20% en efectivo de comisión por cada suscripción generada a través de tu link comercial.'}
                                </p>
                            </div>
                        </div>

                        {/* METRICAS DE RENDIMIENTO */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-border-light py-5">
                            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Registros</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Users className="w-4 h-4 text-text-secondary" />
                                    <h4 className="text-lg font-bold text-text-primary">{partnerStats.stats.registeredSignups} <span className="text-[10px] font-normal text-text-tertiary">regs</span></h4>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Ventas PRO</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <h4 className="text-lg font-bold text-text-primary">{partnerStats.stats.paidSubscriptions} <span className="text-[10px] font-normal text-text-tertiary">compras</span></h4>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Retención (Hold)</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <h4 className="text-lg font-bold text-text-primary">${(partnerStats.stats.pendingCommissions / 100).toLocaleString('es-CO')}</h4>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-green-500/5 border border-green-500/10">
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Acumulado Histórico</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <DollarSign className="w-4 h-4 text-green-500 animate-pulse" />
                                    <h4 className="text-lg font-bold text-green-600 dark:text-green-400">${(partnerStats.stats.totalEarned / 100).toLocaleString('es-CO')}</h4>
                                </div>
                            </div>
                        </div>

                        {/* MÓDULO DE SOLICITUD DE RETIRO DE COMISIONES */}
                        <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary">Saldo Disponible para Retirar</h4>
                                    <p className="text-xs text-text-secondary mt-0.5">Comisiones aprobadas listas para transferir a tu cuenta bancaria.</p>
                                    <div className="flex gap-4 mt-2 text-[11px] text-text-tertiary">
                                        <span>Solicitado: <strong>${(partnerStats.stats.requestedCommissions / 100).toLocaleString('es-CO')} COP</strong></span>
                                        <span>•</span>
                                        <span>Pagado: <strong>${(partnerStats.stats.paidCommissions / 100).toLocaleString('es-CO')} COP</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
                                <span className="text-2xl font-black text-green-600 dark:text-green-400 self-start md:self-auto">${(partnerStats.stats.approvedCommissions / 100).toLocaleString('es-CO')} <span className="text-xs font-bold text-text-secondary">COP</span></span>
                                <button
                                    disabled={partnerStats.stats.approvedCommissions <= 0 || actionLoading !== null}
                                    onClick={handleRequestWithdraw}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-surface-secondary disabled:text-text-tertiary disabled:border disabled:border-border-light disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer w-full md:w-auto active:scale-95"
                                >
                                    {actionLoading === 'withdraw' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                                    <span>Solicitar Retiro Bancario</span>
                                </button>
                            </div>
                        </div>

                        {/* ENLACE AFILIADO */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-text-secondary uppercase">Tu Enlace Comercial de Afiliado</span>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={partnerStats.partnerLink} 
                                    readOnly 
                                    className="flex-1 rounded-2xl border border-border-light bg-surface-secondary px-4 py-2.5 text-xs text-text-secondary select-all outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(partnerStats.partnerLink, 'partner')}
                                    className={`${buttonBgClass} text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95`}
                                >
                                    {copied === 'partner' ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>¡Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copiar Enlace</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* CONFIGURACIÓN Y DATOS DE COBRO / SOPORTE */}
                        <form onSubmit={handleSavePartnerSettings} className="flex flex-col gap-4 border-t border-border-light pt-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Datos Bancarios para Payouts */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1">
                                        <Landmark className="w-3.5 h-3.5" /> Cuenta de Cobro / Banco (Payouts)
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Ej: Ahorros Bancolombia #12345678, Nequi 312..."
                                        value={paymentDetails}
                                        onChange={(e) => setPaymentDetails(e.target.value)}
                                        className={`rounded-2xl border border-border-light bg-surface-secondary px-4 py-3 text-xs text-text-primary outline-none ${focusClass} transition-all`}
                                    />
                                    <p className="text-[10px] text-text-tertiary">Registra tu número de cuenta completo para poder aprobar tus retiros.</p>
                                </div>

                                {/* Canal de Soporte (Solo para Embajadores) */}
                                {isEmbajador ? (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                            <MessageSquare className="w-3.5 h-3.5" /> Canal de Soporte para tus Clientes 💎
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Ej: Número de WhatsApp (+57300...) o Enlace de Calendly"
                                            value={supportContact}
                                            onChange={(e) => setSupportContact(e.target.value)}
                                            className={`rounded-2xl border border-purple-500/20 bg-surface-secondary px-4 py-3 text-xs text-text-primary outline-none ${focusClass} transition-all`}
                                        />
                                        <p className="text-[10px] text-text-tertiary">Tus referidos verán esta información de contacto en su cuenta para recibir tu soporte.</p>
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex justify-end mt-1">
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'partner_settings' || !paymentDetails.trim()}
                                    className={`${buttonBgClass} text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50`}
                                >
                                    {actionLoading === 'partner_settings' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Guardar Configuraciones</span>
                                </button>
                            </div>
                        </form>

                        {/* HISTORIAL DE RETIROS (PAYOUT REQUESTS) */}
                        {partnerStats.payoutRequests.length > 0 && (
                            <div className="border-t border-border-light pt-5">
                                <span className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1 mb-3">
                                    <Clock className="w-4 h-4" /> Historial de Retiros Solicitados
                                </span>
                                <div className="max-h-40 overflow-y-auto border border-border-light rounded-2xl bg-surface-secondary/20 divide-y divide-border-light">
                                    {partnerStats.payoutRequests.map((req: any) => (
                                        <div key={req._id} className="flex justify-between items-center py-3 px-4 text-xs hover:bg-surface-secondary/45 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-text-primary">Monto: ${(req.amount / 100).toLocaleString('es-CO')} COP</span>
                                                <span className="text-[10px] text-text-tertiary">Destino: {req.paymentDetails}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-text-tertiary">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    req.status === 'paid' 
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                        : req.status === 'approved' 
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : req.status === 'rejected'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                    {{
                                                        pending: 'Pendiente',
                                                        approved: 'Aprobado',
                                                        paid: 'Pagado',
                                                        rejected: 'Rechazado'
                                                    }[req.status] || req.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* HISTORIAL DE COMISIONES */}
                        {partnerStats.commissions.length > 0 && (
                            <div className="border-t border-border-light pt-5">
                                <span className="text-xs font-bold text-text-secondary uppercase mb-3 block">Historial de Comisiones Generadas</span>
                                <div className="max-h-48 overflow-y-auto border border-border-light rounded-2xl bg-surface-secondary/20 divide-y divide-border-light">
                                    {partnerStats.commissions.map((comm) => (
                                        <div key={comm.id} className="flex justify-between items-center py-2.5 px-4 text-xs hover:bg-surface-secondary/45 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-text-primary">Referido: {comm.referredUser.name}</span>
                                                <span className="text-[10px] text-text-tertiary">Plan: ${(comm.amount / 100).toLocaleString('es-CO')}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="font-bold text-green-600 dark:text-green-400">+${(comm.commissionAmount / 100).toLocaleString('es-CO')}</span>
                                                    <span className="text-[10px] text-text-tertiary">{new Date(comm.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    comm.status === 'paid' 
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                        : comm.status === 'approved' 
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : comm.status === 'requested'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : comm.status === 'cancelled'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                    {{
                                                        pending: 'Pendiente (14d)',
                                                        approved: 'Aprobada',
                                                        requested: 'Retiro Solicitado',
                                                        paid: 'Pagada',
                                                        cancelled: 'Cancelada'
                                                    }[comm.status] || comm.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* SECCIÓN 3: PANTALLAS DE POSTULACIÓN PENDIENTE O RECHAZADA */}
            {!partnerStats.isPartner && (partnerStats.isPending || partnerStats.isRejected) && (
                <div className="p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface-primary to-surface-primary shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            partnerStats.isPending ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                            {partnerStats.isPending ? <Clock className="w-6 h-6 animate-pulse" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary">
                                {partnerStats.isPending ? 'Solicitud de Afiliado en Revisión ⏳' : 'Solicitud Rechazada ❌'}
                            </h4>
                            <p className="text-xs text-text-secondary mt-1">
                                {partnerStats.isPending 
                                    ? `Tu postulación para ser ${partnerStats.partner?.type === 'embajador' ? 'Wappy Embajador' : 'Wappy Partner'} con código "?ref=${partnerStats.partner?.slug}" está siendo revisada por administración. Te notificaremos pronto.`
                                    : `Lamentamos informarte que tu postulación con código "?ref=${partnerStats.partner?.slug}" ha sido rechazada por el equipo. Si deseas, puedes volver a postularte con otros datos.`}
                            </p>
                        </div>
                    </div>
                    {partnerStats.isRejected && (
                        <button
                            onClick={() => {
                                setAppSlug(partnerStats.partner?.slug || '');
                                setAppType(partnerStats.partner?.type || 'partner');
                                setAppPayment(partnerStats.partner?.paymentDetails || '');
                                setAppSupport(partnerStats.partner?.supportContact || '');
                                setPartnerStats(prev => ({ ...prev, isRejected: false })); // Hide rejected state to show form
                                setShowApplyForm(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md active:scale-95 self-stretch md:self-auto text-center"
                        >
                            Volver a Postularse
                        </button>
                    )}
                </div>
            )}

            {/* SECCIÓN 4: FORMULARIO DE POSTULACIÓN PARA USUARIOS ASOCIADOS */}
            {!partnerStats.isPartner && !partnerStats.isPending && !partnerStats.isRejected && (
                <div className="flex flex-col gap-5 p-6 rounded-3xl border border-border-light bg-gradient-to-br from-surface-secondary to-surface-primary shadow-sm">
                    {!showApplyForm ? (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">🚀 ¿Eres Creador, Promotor o Líder?</h4>
                                <p className="text-xs text-text-secondary mt-0.5">Asciende gratis a Partner o Embajador comercial para empezar a cobrar jugosas comisiones del 20% o 30% en efectivo.</p>
                            </div>
                            <button
                                onClick={() => setShowApplyForm(true)}
                                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-yellow-500/10 cursor-pointer active:scale-95 self-stretch sm:self-auto justify-center"
                            >
                                <span>Convertirse en Socio</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleApplyNewPartner} className="flex flex-col gap-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-border-light pb-2">
                                <h4 className="text-sm font-bold text-text-primary">Solicitud de Socio Comercial Wappy</h4>
                                <button 
                                    type="button" 
                                    onClick={() => setShowApplyForm(false)}
                                    className="text-xs text-text-tertiary hover:text-text-primary font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Tipo de Socio */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-text-secondary uppercase">Tipo de Socio deseado</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAppType('partner')}
                                            className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                                appType === 'partner' 
                                                    ? 'border-amber-500 bg-amber-500/5 text-amber-950 dark:text-amber-100' 
                                                    : 'border-border-light bg-surface-secondary/40 text-text-secondary'
                                            }`}
                                        >
                                            <span className="text-xs font-bold flex items-center gap-1">🚀 Wappy Partner</span>
                                            <span className="text-[10px] text-text-secondary">20% Comisión en Efectivo. Solo venta por link.</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAppType('embajador')}
                                            className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                                appType === 'embajador' 
                                                    ? 'border-purple-500 bg-purple-500/5 text-purple-950 dark:text-purple-100' 
                                                    : 'border-border-light bg-surface-secondary/40 text-text-secondary'
                                            }`}
                                        >
                                            <span className="text-xs font-bold flex items-center gap-1">💎 Wappy Embajador</span>
                                            <span className="text-[10px] text-text-secondary">30% Comisión en Efectivo. Venta + Soporte al cliente.</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Slug */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-text-secondary uppercase">Tu Código Personalizado (Slug)</span>
                                    <div className="flex items-center bg-surface-secondary border border-border-light rounded-2xl px-3 py-2.5">
                                        <span className="text-xs text-text-tertiary select-none">wappy.pe/?ref=</span>
                                        <input
                                            type="text"
                                            placeholder="ej: mi-marca"
                                            value={appSlug}
                                            onChange={(e) => setAppSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                            required
                                            className="flex-1 bg-transparent px-1 text-xs text-text-primary outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-tertiary">Código único comercial que usarán tus invitados. Letras, números y guiones.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-light pt-4">
                                {/* Payment details */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-text-secondary uppercase">Cuenta de Cobro / Bancaria para tus Comisiones</span>
                                    <input
                                        type="text"
                                        placeholder="Ej: Ahorros Bancolombia #1234 o Nequi 310..."
                                        value={appPayment}
                                        onChange={(e) => setAppPayment(e.target.value)}
                                        required
                                        className="rounded-2xl border border-border-light bg-surface-secondary px-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-500"
                                    />
                                </div>

                                {/* Support details (if embajador) */}
                                {appType === 'embajador' ? (
                                    <div className="flex flex-col gap-1.5 animate-fadeIn">
                                        <span className="text-xs font-bold text-text-secondary uppercase text-purple-600 dark:text-purple-400">Canal de Soporte para tus Referidos</span>
                                        <input
                                            type="text"
                                            placeholder="Ej: WhatsApp +57300123... o Correo electrónico"
                                            value={appSupport}
                                            onChange={(e) => setAppSupport(e.target.value)}
                                            required
                                            className="rounded-2xl border border-purple-500/20 bg-surface-secondary px-4 py-2.5 text-xs text-text-primary outline-none focus:border-purple-500"
                                        />
                                        <p className="text-[10px] text-text-tertiary">Medio por el cual darás soporte a tus clientes registrados.</p>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyForm(false)}
                                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary rounded-xl transition-all"
                                >
                                    Cerrar Formulario
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'apply_new'}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                    {actionLoading === 'apply_new' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Enviar Solicitud</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* TABLA COMPARATIVA DE LOS 3 NIVELES DE SOCIOS */}
            <div className="p-6 rounded-3xl border border-border-light bg-surface-secondary/30 relative overflow-hidden">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Comparación de Modelos de Referidos Wappy</span>
                <h4 className="text-sm font-bold text-text-primary mt-1 mb-4">¿Cómo funciona cada nivel comercial?</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Asociados */}
                    <div className="p-4 rounded-2xl border border-emerald-500/10 bg-surface-primary shadow-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">SISTEMA DE PUNTOS</span>
                            <h5 className="text-sm font-bold text-text-primary mt-2">🎁 Wappy Asociado</h5>
                            <p className="text-[11px] text-text-secondary mt-1">Comparte libremente tu enlace con amigos. Ideal para usuarios casuales que no quieren dedicarse a la venta activa.</p>
                            <ul className="mt-3 space-y-1.5 text-[11px] text-text-tertiary">
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Nuevo usuario: 3 días gratis</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Recompensa: Hasta 800 pts/venta</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Canjes: Plan PRO Gratis</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Sin soporte ni cobros bancarios</li>
                            </ul>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider mt-4">Activo por Defecto</span>
                    </div>

                    {/* Partners */}
                    <div className="p-4 rounded-2xl border border-amber-500/10 bg-surface-primary shadow-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">20% COMISIÓN</span>
                            <h5 className="text-sm font-bold text-text-primary mt-2">🚀 Wappy Partner</h5>
                            <p className="text-[11px] text-text-secondary mt-1">Socios enfocados en la prospección comercial. Venden a través de su código comercial y cobran comisiones.</p>
                            <ul className="mt-3 space-y-1.5 text-[11px] text-text-tertiary">
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Nuevo usuario: 3 días gratis</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Recompensa: <strong>20% en efectivo</strong></li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Retiros: Cuenta Bancaria / Nequi</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Responsabilidad: Solo Venta</li>
                            </ul>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold tracking-wider mt-4">Requiere Aprobación</span>
                    </div>

                    {/* Embajadores */}
                    <div className="p-4 rounded-2xl border border-purple-500/20 bg-surface-primary shadow-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase">30% COMISIÓN + SOPORTE</span>
                            <h5 className="text-sm font-bold text-text-primary mt-2">💎 Wappy Embajador</h5>
                            <p className="text-[11px] text-text-secondary mt-1">Socio premium y mentor. Venden a través de su código, cobran la máxima comisión y asumen dar soporte a sus referidos.</p>
                            <ul className="mt-3 space-y-1.5 text-[11px] text-text-tertiary">
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Nuevo usuario: 3 días gratis</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Recompensa: <strong>30% en efectivo</strong></li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Retiros: Cuenta Bancaria / Nequi</li>
                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Responsabilidad: Venta + Soporte</li>
                            </ul>
                        </div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold tracking-wider mt-4">Selección Élite</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
