import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Crown, ArrowLeft, Loader2, CreditCard, AlertCircle, Tag, ShieldCheck, Building2, Users, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { ThemeSelector } from '@librechat/client';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';

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
            'Podrá ingresar 1 clave API de Gemini',
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
            'Podrá ingresar 4 claves API de Gemini',
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
            'Podrá ingresar 10 claves API de Gemini',
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

/* ─── Enterprise Plan Definitions ──────────────────────────────────── */
const ENTERPRISE_PLANS = [
    {
        key: 'riesgos',
        name: 'Plan Intermediación de Riesgos Laborales',
        tagline: 'Para intermediadores de ARL',
        accentColor: 'text-violet-500',
        iconColor: 'text-violet-500',
        gradientBg: 'from-violet-500/5 to-purple-500/10',
        borderColor: 'border-violet-500/20',
        iconBg: 'bg-violet-500/10',
        isFreeEnterprise: true,
        freeNote: 'Gratis *Revisar Términos y Condiciones',
        buttonGradient: 'from-violet-500 to-purple-600',
        features: [
            'Todo lo del plan Plus',
            'Dominio empresarial propio',
            'Sin límite de usuarios',
            'Plataforma propia de la empresa',
            'Logos e identidad visual propios',
            'Agentes IA personalizados propios',
            '200 GB de almacenamiento',
        ],
    },
    {
        key: 'empresas',
        name: 'Plan Empresas',
        tagline: 'Solución integral para empresas y organizaciones',
        accentColor: 'text-sky-500',
        iconColor: 'text-sky-500',
        gradientBg: 'from-sky-500/5 to-cyan-500/10',
        borderColor: 'border-sky-500/20',
        iconBg: 'bg-sky-500/10',
        isFreeEnterprise: false,
        freeNote: null,
        buttonGradient: 'from-sky-500 to-cyan-600',
        features: [
            'Todo lo del plan Plus',
            'Dominio empresarial propio',
            'Sin límite de usuarios',
            'Plataforma propia de la empresa',
            'Logos e identidad visual propios',
            'Agentes IA personalizados propios',
            '200 GB de almacenamiento',
        ],
    },
    {
        key: 'asesores',
        name: 'Plan Asesores Independientes SST',
        tagline: 'Para asesores y consultores independientes en SST',
        accentColor: 'text-rose-500',
        iconColor: 'text-rose-500',
        gradientBg: 'from-rose-500/5 to-pink-500/10',
        borderColor: 'border-rose-500/20',
        iconBg: 'bg-rose-500/10',
        isFreeEnterprise: false,
        freeNote: null,
        buttonGradient: 'from-rose-500 to-pink-600',
        features: [
            'Todo lo del plan Plus',
            'Dominio empresarial propio',
            'Sin límite de usuarios',
            'Plataforma propia de la empresa',
            'Logos e identidad visual propios',
            'Agentes IA personalizados propios',
            '200 GB de almacenamiento',
        ],
    },
];

/* ─── Animated SVGs ─────────────────────────────────────────────────── */
const FreeSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
        </path>
        <path d="M12 16L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
        </path>
        <path d="M9 12L12 8L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="1s" repeatCount="indefinite" />
        </path>
    </svg>
);

const GoSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
        </path>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.2">
            <animate attributeName="r" values="8;11;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const PlusSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
        </polygon>
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2">
            <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const ProSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M2.5 19H21.5L19.5 7L15 12.5L12 4L9 12.5L4.5 7L2.5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="12" cy="3" r="1.5" fill="currentColor">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="4.5" cy="6" r="1.5" fill="currentColor">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="19.5" cy="6" r="1.5" fill="currentColor">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="1.2s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const PricingSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
        </rect>
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <path d="M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0 10;10 0" dur="2s" fill="freeze" />
        </path>
        <circle cx="19" cy="14" r="1" fill="currentColor">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
        </circle>
    </svg>
);

/* ─── Enterprise Animated SVGs ──────────────────────────────────────── */
const RiesgosLaboralesSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M12 2L3 7V12C3 16.55 7.08 20.74 12 22C16.92 20.74 21 16.55 21 12V7L12 2Z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.8s" fill="freeze" />
        </path>
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="0.4s" fill="freeze" />
        </path>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" opacity="0.15">
            <animate attributeName="r" values="7;10;7" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const EmpresasSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.6s" fill="freeze" />
        </rect>
        <path d="M8 8V6C8 4.89 8.89 4 10 4H14C15.11 4 16 4.89 16 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
        </path>
        <circle cx="12" cy="14.5" r="1.5" fill="currentColor">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M12 16V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
);

const AsesoresSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5">
            <animate attributeName="stroke-dasharray" values="0 30;30 0" dur="1.2s" fill="freeze" />
        </circle>
        <path d="M5.5 20C5.5 17 8.46 14.5 12 14.5C15.54 14.5 18.5 17 18.5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0 30;30 0" dur="1.5s" begin="0.5s" fill="freeze" />
        </path>
        <path d="M17 9L19 11L23 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="0.4s" fill="freeze" />
        </path>
    </svg>
);

const PLAN_ICON_MAP: Record<string, React.ElementType> = {
    free: FreeSVG,
    go: GoSVG,
    plus: PlusSVG,
    pro: ProSVG,
};

const ENTERPRISE_ICON_MAP: Record<string, React.ElementType> = {
    riesgos: RiesgosLaboralesSVG,
    empresas: EmpresasSVG,
    asesores: AsesoresSVG,
};

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function PlansPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login, user: authUser } = useAuthContext();
    const { showToast } = useToastContext();
    const [activePlan, setActivePlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingInterval, setBillingInterval] = useState<string>('monthly');
    const [fetchedPlans, setFetchedPlans] = useState<any[]>([]);
    // Checkout flow
    const [checkoutPlan, setCheckoutPlan] = useState<{ planKey: string; planObj: any; displayPrice: string; discountedPrice: number; rawPrice: number; promotion: any } | null>(null);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [promoValidated, setPromoValidated] = useState<{ code: string; discountPercentage: number } | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    // Registration for visitors
    const [showRegister, setShowRegister] = useState(false);
    const [regLoading, setRegLoading] = useState(false);
    const [regData, setRegData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [pendingSubscribe, setPendingSubscribe] = useState<any>(null);

    const params = new URLSearchParams(window.location.search);
    const successPlan = params.get('success') ? params.get('plan') : null;
    const wasCancelled = params.get('cancelled') === '1';

    useEffect(() => {
        const fetchInitialData = async () => {
            if (isAuthenticated) {
                try {
                    const { data } = await axios.get('/api/wompi/plan');
                    setActivePlan(data.plan ?? 'free');
                } catch {
                    setActivePlan('free');
                }
            } else {
                setActivePlan('free');
            }

            try {
                const { data: plansData } = await axios.get('/api/wompi/configured-plans');
                setFetchedPlans(plansData);
            } catch (err) {
                console.error('Error fetching dynamic plans config', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [isAuthenticated]);

    // Effect to handle redirection after login during checkout
    useEffect(() => {
        if (isAuthenticated && pendingSubscribe) {
            setCheckoutPlan(pendingSubscribe);
            setPendingSubscribe(null);
            setShowRegister(false);
        }
    }, [isAuthenticated, pendingSubscribe]);

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
        (planKey: string, planObj: any, displayPrice: string, discountedPrice: number, rawPrice: number, promotion: any) => {
            if (planKey === 'free') return;
            const subObj = { planKey, planObj, displayPrice, discountedPrice, rawPrice, promotion };
            if (!isAuthenticated) {
                setPendingSubscribe(subObj);
                setShowRegister(true);
                return;
            }
            setPromoCodeInput('');
            setPromoValidated(null);
            setPromoError('');
            setCheckoutPlan(subObj);
        },
        [isAuthenticated],
    );

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regData.password !== regData.confirmPassword) {
            showToast({ message: 'Las contraseñas no coinciden', status: 'error' });
            return;
        }
        setRegLoading(true);
        try {
            await axios.post('/api/auth/register', {
                name: regData.name,
                username: regData.username,
                email: regData.email,
                password: regData.password,
            });
            
            // Login
            login({
                email: regData.email,
                password: regData.password,
            });
            
            showToast({ message: 'Cuenta creada. Iniciando sesión...', status: 'success' });
        } catch (err: any) {
            showToast({ message: err?.response?.data?.message || 'Error al registrarse', status: 'error' });
        } finally {
            setRegLoading(false);
        }
    };

    const handleValidatePromo = useCallback(async () => {
        if (!promoCodeInput.trim()) return;
        setPromoLoading(true);
        setPromoError('');
        try {
            const { data } = await axios.get(`/api/wompi/promocode/${promoCodeInput.trim()}`);
            setPromoValidated(data);
        } catch {
            setPromoError('Código inválido o expirado');
            setPromoValidated(null);
        } finally {
            setPromoLoading(false);
        }
    }, [promoCodeInput]);

    const handleConfirmPayment = useCallback(async () => {
        if (!checkoutPlan) return;
        setCheckoutLoading(checkoutPlan.planKey);
        try {
            const { data } = await axios.post('/api/wompi/create-transaction', {
                plan: checkoutPlan.planKey + '|' + billingInterval,
                promoCode: promoValidated?.code || undefined,
            });

            const script = document.createElement('script');
            script.src = 'https://checkout.wompi.co/widget.js';
            script.onload = () => {
                const checkout = new (window as any).WidgetCheckout({
                    currency: data.currency,
                    amountInCents: data.amountInCents,
                    reference: data.reference,
                    publicKey: data.publicKey,
                    signature: data.signature ? { integrity: data.signature } : undefined,
                });

                checkout.open((result: any) => {
                    const transaction = result.transaction;
                    if (transaction.status === 'APPROVED') {
                        window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}`;
                    } else if (transaction.status === 'PENDING') {
                        showToast({ message: 'El pago está en validación por tu banco', status: 'info' });
                        setTimeout(() => window.location.reload(), 3000);
                    } else {
                        showToast({ message: 'El pago no fue exitoso o fue cancelado', status: 'warning' });
                        setCheckoutLoading(null);
                    }
                });
            };
            document.body.appendChild(script);

        } catch (err: any) {
            showToast({ message: err?.response?.data?.error || 'Error iniciando el pago con Wompi', status: 'error' });
            setCheckoutLoading(null);
        }
    }, [checkoutPlan, billingInterval, promoValidated, showToast]);

    const handleManageSubscription = useCallback(async () => {
        showToast({ message: 'Para modificar o cancelar tu plan, comunícate con soporte@wappy.co', status: 'info' });
    }, [showToast]);

    return (
        <div className="relative min-h-screen bg-surface-secondary">
            {/* Theme Selector */}
            <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
                <ThemeSelector />
            </div>

            {/* Header Bar */}
            <div className="sticky top-0 z-10 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => {
                            if (checkoutPlan) {
                                setCheckoutPlan(null);
                            } else if (showRegister) {
                                setShowRegister(false);
                            } else {
                                navigate(isAuthenticated ? '/c/new' : '/register');
                            }
                        }}
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
                {checkoutPlan ? (
                    /* ── CHECKOUT VIEW ── */
                    <div className="mx-auto max-w-3xl">

                        <h2 className="text-3xl font-black text-text-primary mb-2">Tu carrito</h2>
                        <p className="text-text-secondary mb-8 text-sm">Revisa tu selección y aplica un código de descuento antes de continuar al pago.</p>

                        <div className="grid md:grid-cols-5 gap-6">
                            {/* LEFT: plan detail */}
                            <div className="md:col-span-3 flex flex-col gap-5">
                                <div className={`rounded-2xl border p-6 bg-gradient-to-b ${checkoutPlan.planObj.gradientBg} ${checkoutPlan.planObj.borderColor} bg-surface-primary/70 shadow-sm`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-text-primary">{checkoutPlan.planObj.name}</h3>
                                            <p className="text-sm text-text-secondary mt-0.5">{checkoutPlan.planObj.tagline}</p>
                                        </div>
                                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${checkoutPlan.planObj.iconBg}`}>
                                            {React.createElement(PLAN_ICON_MAP[checkoutPlan.planKey], { className: `h-6 w-6 ${checkoutPlan.planObj.iconColor}` })}
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1 mb-4">
                                        {checkoutPlan.discountedPrice > 0 ? (
                                            <>
                                                <span className={`text-4xl font-black ${checkoutPlan.planObj.accentColor}`}>${checkoutPlan.discountedPrice.toLocaleString('es-CO')}</span>
                                                <span className="text-sm text-text-secondary mb-1">/{billingInterval === 'monthly' ? 'mes' : billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}</span>
                                                <span className="ml-2 text-sm text-text-tertiary line-through decoration-red-400">{checkoutPlan.displayPrice}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className={`text-4xl font-black ${checkoutPlan.planObj.accentColor}`}>{checkoutPlan.displayPrice}</span>
                                                <span className="text-sm text-text-secondary mb-1">/{billingInterval === 'monthly' ? 'mes' : billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="border-t border-border-light pt-4 grid grid-cols-1 gap-1.5">
                                        {checkoutPlan.planObj.features?.map((f: string) => (
                                            <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Promo code box */}
                                <div className="rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        ¿Tienes un código de descuento?
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCodeInput}
                                            onChange={(e) => {
                                                setPromoCodeInput(e.target.value.toUpperCase());
                                                setPromoValidated(null);
                                                setPromoError('');
                                            }}
                                            placeholder="Ej. WAPPY50"
                                            className="flex-1 rounded-xl border border-border-light bg-surface-secondary px-4 py-2.5 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        />
                                        <button
                                            onClick={handleValidatePromo}
                                            disabled={promoLoading || !promoCodeInput.trim() || !!promoValidated}
                                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                                        </button>
                                    </div>
                                    {promoValidated && (
                                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-3.5 py-2.5 text-sm font-semibold text-green-600">
                                            <Check className="h-4 w-4" />
                                            Código <strong>{promoValidated.code}</strong> aplicado — {promoValidated.discountPercentage}% de descuento adicional
                                        </div>
                                    )}
                                    {promoError && (
                                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm font-semibold text-red-500">
                                            <AlertCircle className="h-4 w-4" />
                                            {promoError}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Resumen del pedido */}
                            <div className="md:col-span-2">
                                <div className="rounded-2xl border border-border-light bg-surface-primary p-6 shadow-sm sticky top-24">
                                    <h3 className="text-base font-bold text-text-primary mb-5">Resumen del pedido</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Plan</span>
                                            <span className="font-bold text-text-primary">{checkoutPlan.planObj.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Periodo</span>
                                            <span className="font-medium text-text-primary capitalize">
                                                {billingInterval === 'monthly' ? 'Mensual' : billingInterval === 'quarterly' ? 'Trimestral' : billingInterval === 'semiannual' ? 'Semestral' : 'Anual'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Precio base</span>
                                            <span className="font-medium text-text-primary">{checkoutPlan.displayPrice}</span>
                                        </div>
                                        {checkoutPlan.promotion && (
                                            <div className="flex justify-between text-indigo-500">
                                                <span>Promoción ({checkoutPlan.promotion.discountPercentage}%)</span>
                                                <span className="font-semibold">-${Math.round(checkoutPlan.rawPrice * (checkoutPlan.promotion.discountPercentage / 100)).toLocaleString('es-CO')}</span>
                                            </div>
                                        )}
                                        {promoValidated && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Código {promoValidated.code} ({promoValidated.discountPercentage}%)</span>
                                                <span className="font-semibold">Aplicado en Wompi</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="my-4 border-t border-border-light" />
                                    <div className="flex justify-between text-base font-black text-text-primary mb-6">
                                        <span>Total</span>
                                        <span className={checkoutPlan.planObj.accentColor}>
                                            {checkoutPlan.discountedPrice > 0 ? '$' + checkoutPlan.discountedPrice.toLocaleString('es-CO') : checkoutPlan.displayPrice}
                                            <span className="text-xs font-medium text-text-tertiary ml-1">/{billingInterval === 'monthly' ? 'mes' : billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}</span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={!!checkoutLoading}
                                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md ${checkoutPlan.planObj.key === 'go' ? 'bg-blue-600 hover:bg-blue-700' : checkoutPlan.planObj.key === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {checkoutLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                                        Continuar al pago
                                    </button>
                                    <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Pago seguro con Wompi y tu banco
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : showRegister ? (
                    /* ── REGISTRATION VIEW FOR VISITORS ── */
                    <div className="mx-auto max-w-xl">

                        
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-border-medium/40 bg-white/80 dark:bg-gray-900/80 p-10 shadow-2xl backdrop-blur-xl">
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                            
                            <div className="relative">
                                <div className="mb-6 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
                                        <User className="h-8 w-8" />
                                    </div>
                                </div>
                                
                                <h2 className="text-center text-3xl font-black text-text-primary mb-2">Crea tu cuenta</h2>
                                <p className="text-center text-text-secondary mb-8 text-sm">
                                    Necesitamos algunos datos básicos para activar tu plan <strong>{pendingSubscribe?.planObj.name}</strong>.
                                </p>

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="relative">
                                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Nombre Completo</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                                <input
                                                    required
                                                    type="text"
                                                    value={regData.name}
                                                    onChange={e => setRegData({...regData, name: e.target.value})}
                                                    className="w-full rounded-xl border border-border-medium/30 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-text-primary"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Nombre de Usuario</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary font-bold text-xs">@</div>
                                                <input
                                                    required
                                                    type="text"
                                                    value={regData.username}
                                                    onChange={e => setRegData({...regData, username: e.target.value})}
                                                    className="w-full rounded-xl border border-border-medium/30 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-text-primary"
                                                    placeholder="usuario"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                            <input
                                                required
                                                type="email"
                                                value={regData.email}
                                                onChange={e => setRegData({...regData, email: e.target.value})}
                                                className="w-full rounded-xl border border-border-medium/30 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-text-primary"
                                                placeholder="email@ejemplo.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="relative">
                                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Contraseña</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                                <input
                                                    required
                                                    type={showPassword ? "text" : "password"}
                                                    value={regData.password}
                                                    onChange={e => setRegData({...regData, password: e.target.value})}
                                                    className="w-full rounded-xl border border-border-medium/30 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-text-primary"
                                                    placeholder="••••••••"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Confirmar</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                                <input
                                                    required
                                                    type={showPassword ? "text" : "password"}
                                                    value={regData.confirmPassword}
                                                    onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                                                    className="w-full rounded-xl border border-border-medium/30 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-text-primary"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={regLoading}
                                        className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-xl shadow-green-500/20 transition-all hover:bg-green-700 disabled:opacity-70"
                                    >
                                        {regLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta y continuar"}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-xs text-text-tertiary">
                                    ¿Ya tienes una cuenta? <button onClick={() => navigate('/login')} className="font-bold text-green-600 hover:underline">Inicia sesión aquí</button>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Hero */}
                        <div className="mb-12 text-center">
                            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-border-medium/60 bg-surface-primary px-5 py-2 text-lg font-medium text-text-secondary">
                                <PricingSVG className="h-6 w-6 text-green-500" />
                                Planes y Precios
                            </div>
                            <h1 className="mt-2 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                                Elige tu plan de WAPPY IA
                            </h1>
                            <p className="mx-auto mt-3 max-w-lg text-base text-text-secondary">
                                Cancela cuando quieras desde tu portal de suscripción. Selecciona la facturación que más te convenga.
                            </p>

                            {/* Billing Interval Toggle */}
                            <div className="mx-auto mt-8 mb-10 grid w-full max-w-3xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
                                {[
                                    { id: 'monthly', label: 'Mensual' },
                                    { id: 'quarterly', label: 'Trimestral' },
                                    { id: 'semiannual', label: 'Semestral' },
                                    { id: 'annual', label: 'Anual' }
                                ].map((interval) => {
                                    let maxDiscount = 0;
                                    fetchedPlans.forEach((config: any) => {
                                        if (config.promotions?.[interval.id]?.active) {
                                            maxDiscount = Math.max(maxDiscount, config.promotions[interval.id].discountPercentage || 0);
                                        }
                                    });

                                    return (
                                        <button
                                            key={interval.id}
                                            onClick={() => setBillingInterval(interval.id)}
                                            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 px-2 py-4 transition-all duration-300 ${billingInterval === interval.id
                                                ? 'border-green-500 bg-green-50/50 shadow-md shadow-green-500/10 dark:border-green-400 dark:bg-green-950/20'
                                                : 'border-border-light bg-surface-primary hover:border-green-500/40 hover:bg-surface-hover'
                                                }`}
                                        >
                                            <span className={`text-base font-bold ${billingInterval === interval.id ? 'text-green-700 dark:text-green-400' : 'text-text-primary'
                                                }`}>
                                                {interval.label}
                                            </span>

                                            {maxDiscount > 0 ? (
                                                <span className={`mt-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${billingInterval === interval.id
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                    }`}>
                                                    Ahorra {maxDiscount}%
                                                </span>
                                            ) : (
                                                <span className="mt-2 text-[11px] font-medium text-text-tertiary">
                                                    Precio base
                                                </span>
                                            )}

                                            {billingInterval === interval.id && (
                                                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                                                    <Check strokeWidth={3} className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
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
                        {activePlan === 'admin' && (
                            <div className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-sm text-indigo-600 dark:text-indigo-400">
                                <Crown className="h-4 w-4 flex-shrink-0" />
                                Acceso de Administrador: Tienes permisos completos en el sistema.
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
                                        <PricingSVG className="mr-2 h-4 w-4" />
                                    )}
                                    Gestionar suscripción / Cancelar
                                </button>
                            </div>
                        )}

                        {/* ── Plans grid (existing 4 plans) ── */}
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {PLANS.map((plan) => {
                                const Icon = PLAN_ICON_MAP[plan.key];

                                const isUserAdmin = !loading && activePlan === 'admin';
                                const isActive = !loading && (activePlan === plan.key || (isUserAdmin && plan.key === 'pro'));

                                const isLoadingThis = checkoutLoading === plan.key;
                                const isFree = plan.key === 'free';
                                const fetchedConfig = fetchedPlans.find(p => p.planId === plan.key);

                                // Dynamic price
                                let rawPrice = 0;
                                let displayPrice = plan.price;
                                let promotion: any = null;

                                if (!isFree && fetchedConfig) {
                                    rawPrice = fetchedConfig.prices?.[billingInterval] || 0;
                                    displayPrice = rawPrice > 0 ? '$' + rawPrice.toLocaleString('es-CO') : '$0';
                                    if (fetchedConfig.promotions?.[billingInterval]?.active) {
                                        promotion = fetchedConfig.promotions[billingInterval];
                                    }
                                }

                                let discountedPrice = 0;
                                if (promotion && rawPrice > 0) {
                                    discountedPrice = rawPrice - (rawPrice * (promotion.discountPercentage / 100));
                                }

                                const isNotMonthly = billingInterval !== 'monthly';
                                const monthsDivisor = billingInterval === 'quarterly' ? 3 : billingInterval === 'semiannual' ? 6 : billingInterval === 'annual' ? 12 : 1;
                                const totalToBill = isFree ? 0 : ((promotion && promotion.discountPercentage > 0) ? discountedPrice : rawPrice);
                                const pricePerMonth = isFree ? 0 : (totalToBill / monthsDivisor);

                                return (
                                    <div
                                        key={plan.key}
                                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.gradientBg} ${isActive
                                            ? `${plan.borderColor} shadow-lg ring-1 ring-inset ${plan.borderColor}`
                                            : `border-border-medium/40 hover:${plan.borderColor} hover:shadow-md`
                                            } bg-surface-primary/60 backdrop-blur-sm`}
                                    >
                                        {/* Badges */}
                                        {plan.popular && !isActive && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow">
                                                ⭐ Más popular
                                            </div>
                                        )}
                                        {isActive && (
                                            <div
                                                className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold text-white shadow ${plan.key === 'free'
                                                    ? 'bg-text-secondary'
                                                    : isUserAdmin
                                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                                        : 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                    }`}
                                            >
                                                ✓ {isUserAdmin ? 'Plan de Admin' : 'Plan actual'}
                                            </div>
                                        )}
                                        {promotion && promotion.discountPercentage > 0 && (
                                            <div className="absolute top-5 right-5 whitespace-nowrap rounded-full bg-[#ccff00] px-3 py-1 text-xs font-black text-black shadow-sm border border-[#aadd00]/30 z-10">
                                                -{promotion.discountPercentage}%
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                                            <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                                        </div>

                                        {/* Name & tagline */}
                                        <h2 className="text-xl font-bold text-text-primary">{plan.name}</h2>
                                        <p className="mb-4 h-10 text-xs text-text-secondary">{plan.tagline}</p>

                                        {/* Price */}
                                        <div className="mb-5 flex flex-col items-start gap-1">
                                            {promotion && promotion.discountPercentage > 0 && (
                                                <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                                                    {displayPrice}
                                                </span>
                                            )}

                                            <div className="flex items-end gap-1">
                                                <span className={`text-4xl font-black tracking-tight ${plan.accentColor}`}>
                                                    {isFree ? '$0' : '$' + Math.round(pricePerMonth).toLocaleString('es-CO')}
                                                </span>
                                                <span className="mb-1 text-xs font-semibold text-text-secondary">
                                                    /mes
                                                </span>
                                            </div>

                                            {isNotMonthly && !isFree && (
                                                <div className="mt-0.5 text-base font-bold text-text-primary">
                                                    ${Math.round(totalToBill).toLocaleString('es-CO')}{' '}
                                                    <span className="text-xs font-semibold text-text-secondary">
                                                        /{billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}
                                                    </span>
                                                </div>
                                            )}

                                            {promotion && (
                                                <div className="mt-2 text-center w-full rounded-md bg-indigo-500/10 py-1.5 px-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {promotion.text || 'Oferta por tiempo limitado'}
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-auto pt-2">
                                            <button
                                                onClick={() => !isActive && !isFree && handleSubscribe(plan.key, plan, displayPrice, discountedPrice, rawPrice, promotion)}
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
                                        </div>

                                        {/* Features */}
                                        <ul className="mt-5 flex-1 space-y-2">
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

                        {/* ── Enterprise Plans Section ──────────────────────── */}
                        <div className="mt-16">
                            {/* Section divider */}
                            <div className="mb-8 flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-medium/50 to-border-medium/50" />
                                <div className="flex items-center gap-3 rounded-full border border-border-medium/60 bg-surface-primary px-5 py-2">
                                    <Building2 className="h-5 w-5 text-violet-500" />
                                    <span className="text-sm font-semibold text-text-primary">Planes Corporativos</span>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border-medium/50 to-border-medium/50" />
                            </div>

                            <p className="mb-8 text-center text-sm text-text-secondary">
                                Soluciones personalizadas para empresas, intermediadores ARL y asesores SST independientes.{' '}
                                <span className="font-semibold text-text-primary">Incluye todas las ventajas del Plan Plus.</span>
                            </p>

                            {/* Enterprise plans grid */}
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {ENTERPRISE_PLANS.map((plan) => {
                                    const Icon = ENTERPRISE_ICON_MAP[plan.key];
                                    return (
                                        <div
                                            key={plan.key}
                                            className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.gradientBg} border-border-medium/40 hover:border-${plan.borderColor.replace('border-', '')} hover:shadow-lg bg-surface-primary/60 backdrop-blur-sm`}
                                        >
                                            {/* Icon */}
                                            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                                                <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                                            </div>

                                            {/* Header Content with fixed min-height for alignment */}
                                            <div className="flex flex-col min-h-[160px]">
                                                {/* Name */}
                                                <h2 className="text-xl font-bold text-text-primary leading-tight">{plan.name}</h2>

                                                {/* Free note for first enterprise plan */}
                                                {plan.isFreeEnterprise && (
                                                    <p className="mt-1 text-xs font-semibold text-amber-500 dark:text-amber-400">
                                                        {plan.freeNote}
                                                    </p>
                                                )}

                                                <p className="mb-4 mt-1.5 text-xs text-text-secondary">{plan.tagline}</p>

                                                {/* Price */}
                                                <div className="mt-auto mb-4">
                                                    <span className={`text-2xl font-black tracking-tight ${plan.accentColor}`}>
                                                        {plan.isFreeEnterprise ? 'Gratis' : 'A consultar'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => navigate('/contactanos')}
                                                    className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all text-white bg-gradient-to-r ${plan.buttonGradient} hover:opacity-90 hover:shadow-md`}
                                                >
                                                    <Users className="h-4 w-4" />
                                                    Contáctanos
                                                </button>
                                            </div>

                                            {/* Features */}
                                            <ul className="mt-1 flex-1 space-y-2">
                                                {plan.features.map((f) => (
                                                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                                                        <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${plan.accentColor}`} />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer note */}
                        <div className="mt-12 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 p-6 text-center">
                            <p className="text-sm text-text-secondary">
                                Los precios están en pesos colombianos (COP). El cobro se realiza automáticamente de forma mensual, trimestral, semestral o anual según tu elección.
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
                                <span>·</span>
                                <a href="/contactanos" className="underline hover:text-violet-500">
                                    Contáctanos
                                </a>
                            </div>
                            <p className="mt-3 text-xs text-text-tertiary">
                                WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados © {new Date().getFullYear()}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
