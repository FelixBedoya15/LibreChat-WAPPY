import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Zap, Star, Crown, ArrowLeft, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { ThemeSelector } from '@librechat/client';
import { useToastContext } from '@librechat/client';

/* ─── Plan definitions ──────────────────────────────────────────────── */
const PLANS = [
    {
        key: 'free',
        name: 'Gratis',
        price: '$0',
        tagline: 'Para empezar a explorar la IA',
        accentColor: 'text-text-secondary',
        iconColor: 'text-text-secondary',
        gradientBg: 'from-surface-secondary to-surface-secondary',
        borderColor: 'border-border-medium/50',
        iconBg: 'bg-surface-tertiary',
        features: [
            'Chat con IA',
            'Aula de estudio',
            'Máximo 10 conversaciones abiertas',
            '1 clave API de Gemini',
        ],
        notIncluded: ['Blog', 'Gestor SGSST', 'Agentes personalizados'],
        popular: false,
    },
    {
        key: 'go',
        name: 'Go',
        price: '$29.500',
        tagline: 'Más acceso, más productividad',
        accentColor: 'text-blue-500',
        iconColor: 'text-blue-500',
        gradientBg: 'from-blue-500/5 to-blue-500/10',
        borderColor: 'border-blue-500/20',
        iconBg: 'bg-blue-500/10',
        features: [
            'Todo lo del plan Gratis',
            'Blog WAPPY',
            'Hasta 30 conversaciones abiertas',
            '4 claves API de Gemini',
        ],
        notIncluded: ['Gestor SGSST', 'Agentes personalizados'],
        popular: false,
    },
    {
        key: 'plus',
        name: 'Plus',
        price: '$34.700',
        tagline: 'Acceso completo para profesionales',
        accentColor: 'text-green-500',
        iconColor: 'text-green-500',
        gradientBg: 'from-green-500/5 to-emerald-500/10',
        borderColor: 'border-green-500/20',
        iconBg: 'bg-green-500/10',
        features: [
            'Todo lo del plan Go',
            'Conversaciones ilimitadas',
            '10 claves API de Gemini',
            'Gestor SGSST completo',
        ],
        notIncluded: ['Agentes personalizados'],
        popular: true,
    },
    {
        key: 'pro',
        name: 'Pro',
        price: '$39.800',
        tagline: 'El poder total de WAPPY IA',
        accentColor: 'text-amber-500',
        iconColor: 'text-amber-500',
        gradientBg: 'from-amber-500/5 to-orange-500/10',
        borderColor: 'border-amber-500/20',
        iconBg: 'bg-amber-500/10',
        features: [
            'Todo lo del plan Plus',
            'Crea tus propios Agentes de IA',
            'Personalización avanzada de agentes',
            'Acceso anticipado a nuevas funciones',
        ],
        notIncluded: [],
        popular: false,
    },
];

const PLAN_ICON_MAP: Record<string, React.ElementType> = {
    free: Zap,
    go: Zap,
    plus: Star,
    pro: Crown,
};

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function PlansPage() {
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const [activePlan, setActivePlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);

    const params = new URLSearchParams(window.location.search);
    const successPlan = params.get('success') ? params.get('plan') : null;
    const wasCancelled = params.get('cancelled') === '1';

    useEffect(() => {
        axios
            .get('/api/stripe/plan')
            .then(({ data }) => setActivePlan(data.plan ?? 'free'))
            .catch(() => setActivePlan('free'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (successPlan) {
            showToast({
                message: `✅ ¡Suscripción al plan ${successPlan.toUpperCase()} activada exitosamente!`,
                status: 'success',
            });
        }
        if (wasCancelled) {
            showToast({ message: 'Pago cancelado. Tu plan no ha cambiado.', status: 'warning' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubscribe = useCallback(
        async (planKey: string) => {
            if (planKey === 'free') return;
            setCheckoutLoading(planKey);
            try {
                const { data } = await axios.post('/api/stripe/create-checkout-session', { plan: planKey });
                if (data.url) window.location.href = data.url;
            } catch (err: any) {
                showToast({ message: err?.response?.data?.error || 'Error iniciando el pago', status: 'error' });
                setCheckoutLoading(null);
            }
        },
        [showToast],
    );

    const handleManageSubscription = useCallback(async () => {
        setPortalLoading(true);
        try {
            const { data } = await axios.post('/api/stripe/portal');
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            showToast({ message: err?.response?.data?.error || 'Error abriendo el portal', status: 'error' });
            setPortalLoading(false);
        }
    }, [showToast]);

    return (
        <div className="relative min-h-screen bg-surface-secondary">
            {/* Theme Selector */}
            <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
                <ThemeSelector />
            </div>

            {/* Header Bar — same as WappyAboutPage */}
            <div className="sticky top-0 z-10 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <div className="flex-1" />
                    {!loading && (
                        <span className="text-xs text-text-tertiary">
                            Plan actual:{' '}
                            <span className="font-semibold capitalize text-text-primary">{activePlan}</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Hero */}
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-medium/60 bg-surface-primary px-4 py-1.5 text-sm text-text-secondary">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        Planes y Precios
                    </div>
                    <h1 className="mt-2 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                        Elige tu plan de WAPPY IA
                    </h1>
                    <p className="mx-auto mt-3 max-w-lg text-base text-text-secondary">
                        Pago mensual automático. Cancela cuando quieras desde tu portal de suscripción.
                    </p>
                </div>

                {/* Alerts */}
                {successPlan && (
                    <div className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4 flex-shrink-0" />
                        ¡Suscripción activada! Tu plan está activo.
                    </div>
                )}
                {wasCancelled && (
                    <div className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        El pago fue cancelado. Tu plan no cambió.
                    </div>
                )}

                {/* Manage subscription */}
                {activePlan !== 'free' && activePlan !== 'admin' && (
                    <div className="mb-8 flex justify-center">
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="flex items-center gap-2 rounded-xl border border-border-medium/50 bg-surface-primary px-5 py-2.5 text-sm text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                        >
                            {portalLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4" />
                            )}
                            Gestionar suscripción / Cancelar
                        </button>
                    </div>
                )}

                {/* Plans grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {PLANS.map((plan) => {
                        const Icon = PLAN_ICON_MAP[plan.key];
                        const isActive = !loading && activePlan === plan.key;
                        const isLoadingThis = checkoutLoading === plan.key;
                        const isFree = plan.key === 'free';

                        return (
                            <div
                                key={plan.key}
                                className={`group relative flex flex-col rounded-2xl border bg-gradient-to-b p-5 transition-all duration-300 ${plan.gradientBg} ${isActive
                                        ? `${plan.borderColor} shadow-md`
                                        : `border-border-medium/40 hover:${plan.borderColor} hover:shadow-sm`
                                    } bg-surface-primary/60 backdrop-blur-sm`}
                            >
                                {/* Badges */}
                                {plan.popular && !isActive && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-0.5 text-xs font-semibold text-white shadow">
                                        ⭐ Más popular
                                    </div>
                                )}
                                {isActive && (
                                    <div
                                        className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-semibold text-white shadow ${plan.key === 'free'
                                                ? 'bg-text-secondary'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600'
                                            }`}
                                    >
                                        ✓ Plan actual
                                    </div>
                                )}

                                {/* Icon */}
                                <div
                                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                                >
                                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                                </div>

                                {/* Name & tagline */}
                                <h2 className="text-lg font-bold text-text-primary">{plan.name}</h2>
                                <p className="mb-4 text-xs text-text-secondary">{plan.tagline}</p>

                                {/* Price */}
                                <div className="mb-4 flex items-end gap-1">
                                    <span className={`text-3xl font-extrabold tracking-tight ${plan.accentColor}`}>
                                        {plan.price}
                                    </span>
                                    <span className="mb-1 text-xs text-text-tertiary">/mes</span>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={() => !isActive && !isFree && handleSubscribe(plan.key)}
                                    disabled={isActive || isFree || isLoadingThis || loading}
                                    className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${isActive
                                            ? `cursor-default border ${plan.borderColor} ${plan.accentColor} bg-transparent`
                                            : isFree
                                                ? 'cursor-default border border-border-medium/40 bg-transparent text-text-tertiary'
                                                : `bg-gradient-to-r ${plan.key === 'go'
                                                    ? 'from-blue-500 to-blue-600'
                                                    : plan.key === 'plus'
                                                        ? 'from-green-500 to-emerald-600'
                                                        : 'from-amber-500 to-orange-600'
                                                } text-white hover:opacity-90 hover:shadow-md`
                                        }`}
                                >
                                    {isLoadingThis ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo...
                                        </>
                                    ) : isActive ? (
                                        <>
                                            <Check className="h-4 w-4" /> Plan actual
                                        </>
                                    ) : isFree ? (
                                        'Plan gratuito'
                                    ) : (
                                        `Comenzar con ${plan.name}`
                                    )}
                                </button>

                                {/* Features */}
                                <ul className="flex-1 space-y-2">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                            {f}
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-text-tertiary opacity-40 line-through">
                                            <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-center">✕</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div className="mt-12 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 p-6 text-center">
                    <p className="text-sm text-text-secondary">
                        Los precios están en pesos colombianos (COP). El cobro se realiza automáticamente cada mes.
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                        Cancela o cambia tu plan en cualquier momento desde el portal de suscripción.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-text-tertiary">
                        <a href="/privacy" className="underline hover:text-green-500">
                            Política de Privacidad
                        </a>
                        <span>·</span>
                        <a href="/terms" className="underline hover:text-green-500">
                            Términos de Servicio
                        </a>
                    </div>
                    <p className="mt-3 text-xs text-text-tertiary">
                        WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados © {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
