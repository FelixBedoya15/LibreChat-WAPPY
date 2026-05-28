import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Share2, Copy, Check, Gift, DollarSign, Users, 
    Award, TrendingUp, Save, Clock, ArrowRight, Loader 
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
        pointsHistory: [] as any[]
    });

    const [partnerStats, setPartnerStats] = useState({
        isPartner: false,
        partnerLink: '',
        partner: null as any,
        stats: {
            registeredSignups: 0,
            paidSubscriptions: 0,
            totalEarned: 0,
            pendingCommissions: 0,
            approvedCommissions: 0,
            paidCommissions: 0
        },
        commissions: [] as any[]
    });

    const [paymentDetails, setPaymentDetails] = useState('');
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
            if (partnerRes.data.isPartner && partnerRes.data.partner?.paymentDetails) {
                setPaymentDetails(partnerRes.data.partner.paymentDetails);
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
            
            // Update stats immediately
            setStats(prev => ({
                ...prev,
                pointsBalance: response.data.pointsBalance
            }));

            // Sync user object globally to update role/inactivation date
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

    const handleSavePaymentDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('payment');
            setMessage(null);
            const response = await axios.post('/api/referrals/partner/apply', { paymentDetails });
            setMessage({ text: response.data.message, type: 'success' });
            fetchStats();
        } catch (err: any) {
            setMessage({ 
                text: err.response?.data?.error || 'Error al guardar datos de cobro.', 
                type: 'error' 
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader className="w-8 h-8 text-green-500 animate-spin" />
                <p className="text-sm text-text-secondary">Cargando programa de referidos...</p>
            </div>
        );
    }

    // Points required for progress bar (max 800)
    const pointsProgress = Math.min(stats.pointsBalance, 800);
    const progressPercent = (pointsProgress / 800) * 100;

    return (
        <div className="flex flex-col gap-6">
            
            {/* INCENTIVO / NOTIFICACIONES DE ACCIÓN */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm transition-all duration-300 animate-pulse ${
                    message.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                    <Gift className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            {/* SECCIÓN 1: WAPPY ASOCIADOS (PUNTOS PARA PRO GRATIS) */}
            <div className="flex flex-col gap-5 p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-surface-primary to-surface-primary shadow-md relative overflow-hidden">
                {/* Glow decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Wappy Asociado</span>
                        <h3 className="text-lg font-bold text-text-primary mt-2">Programa de Puntos Asociados Wappy 🎁</h3>
                        <p className="text-xs text-text-secondary mt-1">Comparte tu enlace. Tu amigo recibe 3 días de PRO gratis de bienvenida. Si compra, ¡tú acumulas puntos para PRO gratis!</p>
                    </div>
                </div>


                {/* PROGRESO DE PUNTOS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-y border-border-light py-5">
                    
                    {/* Visual de Puntos */}
                    <div className="flex items-center gap-4 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 col-span-1">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                            <Award className="w-6 h-6 animate-bounce" />
                        </div>
                        <div>
                            <span className="text-xs text-text-secondary font-medium">Tus Puntos Wappy</span>
                            <h4 className="text-2xl font-bold text-text-primary">{stats.pointsBalance} <span className="text-xs font-normal text-text-secondary">pts</span></h4>
                        </div>
                    </div>

                    {/* Barra de progreso interactiva */}
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
                                : `Te faltan ${Math.max(0, 800 - stats.pointsBalance)} puntos para tu próximo mes gratis de PRO.`}
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
                                    <Copy className="w-4 h-4" />
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
                        
                        {/* Tarjeta 1: 1 Semana */}
                        <div className="border border-border-light hover:border-emerald-500/30 bg-surface-secondary/50 rounded-2xl p-4 flex flex-col gap-3 hover:translate-y-[-2px] transition-all relative overflow-hidden group">
                            <div className="absolute top-[-20px] right-[-20px] w-12 h-12 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
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

                        {/* Tarjeta 2: 2 Semanas */}
                        <div className="border border-border-light hover:border-emerald-500/30 bg-surface-secondary/50 rounded-2xl p-4 flex flex-col gap-3 hover:translate-y-[-2px] transition-all relative overflow-hidden group">
                            <div className="absolute top-[-20px] right-[-20px] w-12 h-12 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
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

                        {/* Tarjeta 3: 1 Mes */}
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

                {/* LISTADO DE REFERIDOS */}
                {stats.referredFriends.length > 0 && (
                    <div className="mt-2">
                        <span className="text-xs font-bold text-text-secondary uppercase">Amigos Referidos ({stats.referredFriends.length})</span>
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
                                            {friend.status === 'subscribed' ? 'PRO Activo' : 'Registrado'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: WAPPY PARTNERS O EMBAJADORES */}
            {partnerStats.isPartner && (() => {
                const isEmbajador = partnerStats.partner?.type === 'embajador';
                const tierName = isEmbajador ? 'Wappy Embajador' : 'Wappy Partner';
                const commissionRateText = isEmbajador ? '30%' : '20%';
                const description = isEmbajador 
                    ? 'Obtén 30% de comisión en efectivo por cada venta confirmada a través de tu link y brindar soporte comercial continuo.'
                    : 'Obtén 20% de comisión en efectivo por cada venta confirmada a través de tu link comercial.';
                const borderClass = isEmbajador ? 'border-purple-500/30' : 'border-yellow-500/20';
                const gradientClass = isEmbajador ? 'from-purple-500/5' : 'from-yellow-500/5';
                const badgeColorClass = isEmbajador 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' 
                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10';
                const copyButtonBgClass = isEmbajador ? 'bg-purple-600 hover:bg-purple-700' : 'bg-yellow-600 hover:bg-yellow-700';

                return (
                    <div className={`flex flex-col gap-5 p-6 rounded-3xl border ${borderClass} bg-gradient-to-br ${gradientClass} via-surface-primary to-surface-primary shadow-md relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

                        <div>
                            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeColorClass}`}>
                                {tierName} {isEmbajador && '💎'}
                            </span>
                            <h3 className="text-lg font-bold text-text-primary mt-2">Panel de {isEmbajador ? 'Embajador' : 'Socio'} Comercial 🚀</h3>
                            <p className="text-xs text-text-secondary mt-1">{description}</p>
                        </div>

                        {/* KPI METRICS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-border-light py-5">
                            
                            {/* Métrica 1: Clicks */}
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-medium uppercase">Recomendados</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Users className="w-4 h-4 text-yellow-600" />
                                    <h4 className="text-lg font-bold text-text-primary">{partnerStats.stats.registeredSignups} <span className="text-xs font-normal text-text-secondary">regs</span></h4>
                                </div>
                            </div>

                            {/* Métrica 2: Ventas */}
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-medium uppercase">Ventas PRO</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <h4 className="text-lg font-bold text-text-primary">{partnerStats.stats.paidSubscriptions} <span className="text-xs font-normal text-text-secondary">ventas</span></h4>
                                </div>
                            </div>

                            {/* Métrica 3: Pendiente */}
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-medium uppercase">Comisión Pendiente</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <h4 className="text-lg font-bold text-text-primary">${(partnerStats.stats.pendingCommissions / 100).toLocaleString('es-CO')}</h4>
                                </div>
                            </div>

                            {/* Métrica 4: Pagado */}
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-surface-secondary/50 border border-border-light">
                                <span className="text-[10px] text-text-secondary font-medium uppercase">Total Pagado</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    <h4 className="text-lg font-bold text-text-primary">${(partnerStats.stats.paidCommissions / 100).toLocaleString('es-CO')}</h4>
                                </div>
                            </div>
                        </div>

                        {/* LINK PARTNER */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-text-secondary uppercase">Tu Enlace Comercial de {isEmbajador ? 'Embajador' : 'Partner'}</span>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={partnerStats.partnerLink} 
                                    readOnly 
                                    className="flex-1 rounded-2xl border border-border-light bg-surface-secondary px-4 py-2.5 text-xs text-text-secondary select-all outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(partnerStats.partnerLink, 'partner')}
                                    className={`${copyButtonBgClass} active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-sm cursor-pointer`}
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

                        {/* DATOS DE COBRO */}
                        <form onSubmit={handleSavePaymentDetails} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-text-secondary uppercase">Información para tu Payout (Transferencia Bancaria, Nequi, etc.)</span>
                                <input
                                    type="text"
                                    placeholder="Ej: Cuenta Ahorros Bancolombia #12345678 o Nequi 310..."
                                    value={paymentDetails}
                                    onChange={(e) => setPaymentDetails(e.target.value)}
                                    className="rounded-2xl border border-border-light bg-surface-secondary px-4 py-2.5 text-xs text-text-primary outline-none focus:border-yellow-500"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'payment' || !paymentDetails.trim()}
                                    className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    {actionLoading === 'payment' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Guardar Datos de Payout</span>
                                </button>
                            </div>
                        </form>

                        {/* LISTADO DE COMISIONES */}
                        {partnerStats.commissions.length > 0 && (
                            <div>
                                <span className="text-xs font-bold text-text-secondary uppercase">Historial de Comisiones ({commissionRateText} Comisión)</span>
                                <div className="mt-2 max-h-40 overflow-y-auto border border-border-light rounded-xl bg-surface-secondary/30 divide-y divide-border-light">
                                    {partnerStats.commissions.map((comm) => (
                                        <div key={comm.id} className="flex justify-between items-center py-2.5 px-3 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-text-primary">Referido: {comm.referredUser.name}</span>
                                                <span className="text-text-tertiary">Pago: ${(comm.amount / 100).toLocaleString('es-CO')}</span>
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
                                                        : comm.status === 'cancelled'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                    {{
                                                        pending: 'En Revisión (14d)',
                                                        approved: 'Aprobado',
                                                        paid: 'Pagado',
                                                        cancelled: 'Cancelado'
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
        </div>
    );
}
