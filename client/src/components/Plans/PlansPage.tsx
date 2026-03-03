import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Zap, Star, Crown, ArrowLeft, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { useToastContext } from '@librechat/client';

interface PlanInfo {
    plan: 'free' | 'go' | 'plus' | 'pro' | 'admin';
    cancelAtPeriodEnd: boolean;
    planExpiresAt: string | null;
}

const PLANS = [
    {
        key: 'free',
        name: 'Gratis',
        price: 0,
        priceLabel: '$0',
        period: '/mes',
        tagline: 'Para empezar a explorar la IA',
        icon: Zap,
        gradient: 'from-slate-600 to-slate-700',
        iconBg: 'bg-slate-500/20',
        iconColor: 'text-slate-300',
        borderColor: 'border-slate-600/40',
        features: [
            'Chat con IA',
            'Aula de estudio',
            'Máximo 10 conversaciones',
            '1 clave API de Gemini',
        ],
        notIncluded: ['Blog', 'Gestor SGSST', 'Agentes personalizados'],
        cta: 'Plan actual',
        popular: false,
    },
    {
        key: 'go',
        name: 'Go',
        price: 29500,
        priceLabel: '$29.500',
        period: '/mes',
        tagline: 'Más acceso, más productividad',
        icon: Zap,
        gradient: 'from-violet-600 to-indigo-600',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-300',
        borderColor: 'border-violet-500/40',
        features: [
            'Todo lo del plan Gratis',
            'Blog WAPPY',
            'Hasta 30 conversaciones abiertas',
            '4 claves API de Gemini',
        ],
        notIncluded: ['Gestor SGSST', 'Agentes personalizados'],
        cta: 'Comenzar con Go',
        popular: false,
    },
    {
        key: 'plus',
        name: 'Plus',
        price: 34700,
        priceLabel: '$34.700',
        period: '/mes',
        tagline: 'Acceso completo para profesionales',
        icon: Star,
        gradient: 'from-indigo-600 to-purple-600',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-300',
        borderColor: 'border-indigo-500/40',
        features: [
            'Todo lo del plan Go',
            'Conversaciones ilimitadas',
            '10 claves API de Gemini',
            'Gestor SGSST completo',
        ],
        notIncluded: ['Agentes personalizados'],
        cta: 'Comenzar con Plus',
        popular: true,
    },
    {
        key: 'pro',
        name: 'Pro',
        price: 39800,
        priceLabel: '$39.800',
        period: '/mes',
        tagline: 'El poder total de WAPPY IA',
        icon: Crown,
        gradient: 'from-amber-500 to-orange-600',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-300',
        borderColor: 'border-amber-500/40',
        features: [
            'Todo lo del plan Plus',
            'Crea tus propios agentes de IA',
            'Personalización avanzada de agentes',
            'Acceso anticipado a nuevas funciones',
        ],
        notIncluded: [],
        cta: 'Comenzar con Pro',
        popular: false,
    },
];

export default function PlansPage() {
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);

    // Query params: success / cancelled feedback
    const params = new URLSearchParams(window.location.search);
    const successPlan = params.get('success') ? params.get('plan') : null;
    const wasCancelled = params.get('cancelled') === '1';

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const { data } = await axios.get('/api/stripe/plan');
                setCurrentPlan(data);
            } catch {
                setCurrentPlan({ plan: 'free', cancelAtPeriodEnd: false, planExpiresAt: null });
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    useEffect(() => {
        if (successPlan) {
            showToast({ message: `✅ ¡Suscripción al plan ${successPlan.toUpperCase()} activada exitosamente!`, status: 'success' });
        }
        if (wasCancelled) {
            showToast({ message: 'Pago cancelado. Tu plan no ha cambiado.', status: 'warning' });
        }
    }, [successPlan, wasCancelled, showToast]);

    const handleSubscribe = useCallback(async (planKey: string) => {
        if (planKey === 'free') return;
        setCheckoutLoading(planKey);
        try {
            const { data } = await axios.post('/api/stripe/create-checkout-session', { plan: planKey });
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            showToast({ message: err?.response?.data?.error || 'Error iniciando el pago', status: 'error' });
            setCheckoutLoading(null);
        }
    }, [showToast]);

    const handleManageSubscription = useCallback(async () => {
        setPortalLoading(true);
        try {
            const { data } = await axios.post('/api/stripe/portal');
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            showToast({ message: err?.response?.data?.error || 'Error abriendo el portal', status: 'error' });
            setPortalLoading(false);
        }
    }, [showToast]);

    const activePlan = currentPlan?.plan ?? 'free';

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Top bar */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-gray-950/90 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <span className="text-sm text-gray-500">
                        Plan actual: <span className="font-semibold capitalize text-white">{activePlan}</span>
                    </span>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Header */}
                <div className="mb-16 text-center">
                    <div className="mb-4 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Planes y Precios
                    </div>
                    <h1 className="mb-4 text-5xl font-bold tracking-tight">
                        Elige tu plan de{' '}
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            WAPPY IA
                        </span>
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-gray-400">
                        Pago mensual automático. Cancela cuando quieras desde tu portal de suscripción.
                    </p>
                </div>

                {/* Alert success / cancel */}
                {successPlan && (
                    <div className="mx-auto mb-10 flex max-w-xl items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-400">
                        <Check className="h-5 w-5 flex-shrink-0" />
                        <span>¡Suscripción activada! Tu plan ya está activo.</span>
                    </div>
                )}
                {wasCancelled && (
                    <div className="mx-auto mb-10 flex max-w-xl items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-400">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>El proceso de pago fue cancelado. Tu plan no cambió.</span>
                    </div>
                )}

                {/* Manage subscription button for paid plans */}
                {activePlan !== 'free' && activePlan !== 'admin' && currentPlan?.stripeSubscriptionId !== undefined && (
                    <div className="mb-10 flex justify-center">
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                            Gestionar suscripción / Cancelar
                        </button>
                    </div>
                )}

                {/* Plans grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isActive = activePlan === plan.key;
                        const isLoading = checkoutLoading === plan.key;
                        const isFreeOrAdmin = plan.key === 'free';
                        const loadingGlobal = loading;

                        return (
                            <div
                                key={plan.key}
                                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${isActive
                                        ? `border-2 ${plan.borderColor} bg-gradient-to-b ${plan.gradient}/10 shadow-lg`
                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'
                                    }`}
                            >
                                {/* Popular badge */}
                                {plan.popular && !isActive && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                        ⭐ Más popular
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                        ✓ Plan actual
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                                </div>

                                {/* Name & tagline */}
                                <h2 className="mb-1 text-xl font-bold">{plan.name}</h2>
                                <p className="mb-5 text-sm text-gray-400">{plan.tagline}</p>

                                {/* Price */}
                                <div className="mb-6 flex items-end gap-1">
                                    <span className="text-4xl font-bold tracking-tight">{plan.priceLabel}</span>
                                    <span className="mb-1 text-sm text-gray-500">{plan.period}</span>
                                </div>

                                {/* CTA button */}
                                <button
                                    onClick={() => !isActive && !isFreeOrAdmin && handleSubscribe(plan.key)}
                                    disabled={isActive || isFreeOrAdmin || isLoading || loadingGlobal}
                                    className={`mb-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${isActive
                                            ? 'cursor-default bg-green-600/20 text-green-400'
                                            : isFreeOrAdmin
                                                ? 'cursor-default bg-white/10 text-gray-400'
                                                : `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 hover:shadow-lg`
                                        }`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo...</>
                                    ) : isActive ? (
                                        <><Check className="h-4 w-4" /> Plan actual</>
                                    ) : (
                                        plan.cta
                                    )}
                                </button>

                                {/* Features */}
                                <ul className="flex-1 space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                                            {f}
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600 line-through">
                                            <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-center text-gray-700">✕</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <p className="mt-16 text-center text-sm text-gray-600">
                    Los precios están en pesos colombianos (COP). El cobro se realiza automáticamente cada mes.
                    <br />
                    Cancela o cambia tu plan en cualquier momento desde el portal de suscripción.
                </p>
            </div>
        </div>
    );
}
