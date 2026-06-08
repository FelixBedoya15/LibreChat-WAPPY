import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Check,
  Crown,
  ArrowLeft,
  Loader2,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  X,
  ZoomIn,
  Download,
  Puzzle,
} from 'lucide-react';
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
      'Máximo 4 conversaciones abiertas',
      '+ de 15 Agentes Expertos en SST',
      'Aula de estudio',
      'Podrá ingresar 1 clave API de Gemini',
      'Sin caducidad – no necesita renovación',
    ],
    notIncluded: ['Blog', 'Somos SST', 'Editor de Archivos con IA'],
    popular: false,
  },
  {
    key: 'go',
    name: 'Go',
    price: '$49.200',
    tagline: 'Más acceso, más productividad',
    accentColor: 'text-blue-500',
    iconColor: 'text-blue-500',
    gradientBg: 'from-blue-500/5 to-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconBg: 'bg-blue-500/10',
    features: [
      'Chat con IA',
      'Hasta 30 conversaciones abiertas',
      '+ de 15 Agentes Expertos en SST',
      'Aula de estudio',
      'Blog WAPPY',
      'Podrá ingresar 4 claves API de Gemini',
    ],
    notIncluded: ['Somos SST', 'Editor de Archivos con IA'],
    popular: false,
  },
  {
    key: 'plus',
    name: 'Plus',
    price: '$57.800',
    tagline: 'Acceso completo para profesionales',
    accentColor: 'text-green-500',
    iconColor: 'text-green-500',
    gradientBg: 'from-green-500/5 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    iconBg: 'bg-green-500/10',
    features: [
      'Somos SST',
      'Chat con IA',
      'Conversaciones ilimitadas',
      '+ de 15 Agentes Expertos en SST',
      '**Agente Matriz IPEVAR**',
      'Aula de estudio',
      'Blog WAPPY',
      'Podrá ingresar 10 claves API de Gemini',
    ],
    notIncluded: ['Editor de Archivos con IA'],
    popular: false,
  },
  {
    key: 'pro',
    name: 'Wappy Pro',
    price: '$114.330',
    tagline: 'El poder total de WAPPY IA',
    accentColor: 'text-amber-500',
    iconColor: 'text-amber-500',
    gradientBg: 'from-amber-500/5 to-orange-500/10',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    features: [
      'Somos SST completo',
      'Skills Termómetro Psicosocial',
      'Skill Somos SST Medicina Laboral y Riesgo Psicosocial',
      'Chat Live (video llamada en vivo para detectar riesgos)',
      'Chat con IA ilimitado',
      'Conversaciones y chats ilimitados',
      'Subida de archivos ilimitada',
      'Descargas y exportaciones ilimitadas',
      'Crea tus propios Agentes de IA',
      'Análisis y Chat en Vivo',
      'Aula de estudio',
      'Blog WAPPY',
      'Acceso anticipado a nuevas funciones',
    ],
    notIncluded: [],
    popular: true,
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
      'Todo lo del plan Pro',
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
      'Todo lo del plan Pro',
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
      'Todo lo del plan Pro',
      'Dominio empresarial propio',
      'Sin límite de usuarios',
      'Plataforma propia de la empresa',
      'Logos e identidad visual propios',
      'Agentes IA personalizados propios',
      '200 GB de almacenamiento',
    ],
  },
];

/* ─── App Plan Definitions ─────────────────────────────────────────── */
const APP_PLANS = [
  {
    key: 'ipevar',
    name: 'Wappy Vital',
    tagline: 'Chat de IA y matrices de por vida',
    accentColor: 'text-emerald-500',
    iconColor: 'text-emerald-500',
    gradientBg: 'from-emerald-500/5 to-teal-500/10',
    borderColor: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    features: [
      '**Pago Único (Acceso de Por Vida)**',
      '**Chat con IA Ilimitado**',
      'Hasta **20 chats** abiertos',
      '**Más de 15 Agentes Especialistas en SST (Consultor SG-SST, Especialista GTC-45, Especialista en Riesgo Psicosocial, Consultor Médico Ocupacional, Consultor Jurídico Laboral, Auditor Integral SG-SST)**',
      '**Subida de archivos ilimitada**',
      '**Skill de Canvas (Word, Hojas de Cálculo, Presentaciones, Código Creador de Aplicativos)**',
      '**Skill Editor RIT**',
      '**Skill IPEVAR**',
      '**Descargas y exportaciones ilimitadas**',
      'Aula de estudio',
      'Blog WAPPY',
    ],
    notIncluded: ['Somos SST', 'Crear Agentes de IA propios', 'Análisis y Chat en Vivo'],
    popular: true,
  },
];

/* ─── Animated SVGs ─────────────────────────────────────────────────── */
const FreeSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    >
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
    </path>
    <path
      d="M12 16L12 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
    </path>
    <path
      d="M9 12L12 8L15 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate
        attributeName="opacity"
        values="0.3;1;0.3"
        dur="2.5s"
        begin="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

const GoSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <path
      d="M2.5 19H21.5L19.5 7L15 12.5L12 4L9 12.5L4.5 7L2.5 19Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    >
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
    </path>
    <circle cx="12" cy="3" r="1.5" fill="currentColor">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="4.5" cy="6" r="1.5" fill="currentColor">
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="2s"
        begin="0.6s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="19.5" cy="6" r="1.5" fill="currentColor">
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="2s"
        begin="1.2s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

const PricingSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect
      x="3"
      y="6"
      width="18"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.8"
    >
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
    <path
      d="M12 2L3 7V12C3 16.55 7.08 20.74 12 22C16.92 20.74 21 16.55 21 12V7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.8s" fill="freeze" />
    </path>
    <path
      d="M9 12L11 14L15 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0"
    >
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
    <rect
      x="3"
      y="8"
      width="18"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.8"
    >
      <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.6s" fill="freeze" />
    </rect>
    <path
      d="M8 8V6C8 4.89 8.89 4 10 4H14C15.11 4 16 4.89 16 6V8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
    </path>
    <circle cx="12" cy="14.5" r="1.5" fill="currentColor">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
    </circle>
    <path
      d="M12 16V18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

const AsesoresSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5">
      <animate attributeName="stroke-dasharray" values="0 30;30 0" dur="1.2s" fill="freeze" />
    </circle>
    <path
      d="M5.5 20C5.5 17 8.46 14.5 12 14.5C15.54 14.5 18.5 17 18.5 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dasharray"
        values="0 30;30 0"
        dur="1.5s"
        begin="0.5s"
        fill="freeze"
      />
    </path>
    <path
      d="M17 9L19 11L23 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0"
    >
      <animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="0.4s" fill="freeze" />
    </path>
  </svg>
);

const IpevarSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5">
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
    </rect>
    <path d="M3 9H21M9 21V9" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    <path
      d="M13 13L17 17M17 13L13 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="15" cy="15" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.2">
      <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
    </circle>
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

const APP_ICON_MAP: Record<string, React.ElementType> = {
  ipevar: IpevarSVG,
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

  // Visibility config from admin panel
  const [visibility, setVisibility] = useState({
    showPlanFree: false,
    showPlanGo: false,
    showPlanPlus: false,
    showPlanPro: true,
    showSectionAppPlans: false,
    showSectionCustomPlan: false,
    showSectionEnterprise: false,
  });
  // Checkout flow
  const [checkoutPlan, setCheckoutPlan] = useState<{
    planKey: string;
    planObj: any;
    displayPrice: string;
    discountedPrice: number;
    rawPrice: number;
    promotion: any;
  } | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoValidated, setPromoValidated] = useState<{
    code: string;
    discountPercentage: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  // Pending payment state (for async methods like Compra y Paga Después)
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    planName: string;
    email: string;
  } | null>(null);

  // Manual Payment State (Nequi QR)
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'nequi'>('wompi');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  // Derived: final price considering promo code on top of any existing promotion
  const finalCheckoutPrice = useMemo(() => {
    if (!checkoutPlan) return 0;
    const base =
      checkoutPlan.discountedPrice > 0 ? checkoutPlan.discountedPrice : checkoutPlan.rawPrice;
    let price = base;
    if (promoValidated && promoValidated.discountPercentage > 0) {
      price = price - price * (promoValidated.discountPercentage / 100);
    }
    if (paymentMethod === 'nequi') {
      price = price * 0.95;
    }
    return Math.round(price);
  }, [checkoutPlan, promoValidated, paymentMethod]);

  const activeSubscriptionPlans = useMemo(() => {
    return PLANS.filter((plan) => {
      if (plan.key === 'free') return false;
      if (plan.key === 'go') return visibility.showPlanGo;
      if (plan.key === 'plus') return visibility.showPlanPlus;
      if (plan.key === 'pro') return visibility.showPlanPro;
      return true;
    });
  }, [visibility]);

  const activeAppPlans = useMemo(() => {
    if (!visibility.showSectionAppPlans) return [];
    return APP_PLANS;
  }, [visibility.showSectionAppPlans]);

  const showUnifiedLayout = useMemo(() => {
    return (
      activeSubscriptionPlans.length === 1 &&
      activeSubscriptionPlans[0].key === 'pro' &&
      activeAppPlans.length === 1 &&
      activeAppPlans[0].key === 'ipevar'
    );
  }, [activeSubscriptionPlans, activeAppPlans]);

  // Registration for visitors
  const [showRegister, setShowRegister] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingSubscribe, setPendingSubscribe] = useState<any>(null);

  // Guest Checkout (unauthenticated user wants to pay directly)
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', password: '' });
  const [guestError, setGuestError] = useState('');

  // Custom Plan Builder State
  const [customPlanConfig, setCustomPlanConfig] = useState<any>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customInterval, setCustomInterval] = useState<string>('monthly');
  const [customCheckoutLoading, setCustomCheckoutLoading] = useState(false);

  // Tracking Analytics
  const getSessionId = useCallback(() => {
    let sid = sessionStorage.getItem('checkout_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('checkout_session_id', sid);
    }
    return sid;
  }, []);

  const trackCheckoutEvent = useCallback(
    (event: string, payload: any = {}) => {
      try {
        axios
          .post('/api/admin/checkout-event', {
            sessionId: getSessionId(),
            event,
            ...payload,
          })
          .catch(() => {});
      } catch (e) {
        // silent fail
      }
    },
    [getSessionId],
  );

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

  // Fetch visibility settings (public endpoint)
  useEffect(() => {
    axios
      .get('/api/wompi/plans-visibility')
      .then(({ data }) => setVisibility((prev) => ({ ...prev, ...data })))
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  // Fetch custom plan config
  useEffect(() => {
    axios
      .get('/api/wompi/custom-plan-config')
      .then(({ data }) => setCustomPlanConfig(data))
      .catch(() => console.error('Error fetching custom plan config'));
  }, []);

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

    trackCheckoutEvent('page_view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = useCallback(
    (
      planKey: string,
      planObj: any,
      displayPrice: string,
      discountedPrice: number,
      rawPrice: number,
      promotion: any,
    ) => {
      if (planKey === 'free') return;
      trackCheckoutEvent('plan_selected', {
        planId: planKey,
        interval: planKey === 'ipevar' ? 'lifetime' : 'monthly',
      });
      const subObj = { planKey, planObj, displayPrice, discountedPrice, rawPrice, promotion };
      // Go directly to checkout — authentication is only required at the moment of payment
      if (planKey === 'ipevar') {
        setBillingInterval('lifetime');
      }
      setPromoCodeInput('');
      setPromoValidated(null);
      setPromoError('');
      setPaymentMethod('wompi');
      setIsQRModalOpen(false);
      setTermsAccepted(false);
      setReceiptFile(null);
      setCheckoutPlan(subObj);
    },
    [],
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
        confirm_password: regData.confirmPassword,
      });

      // Login
      login({
        email: regData.email,
        password: regData.password,
      });

      showToast({ message: 'Cuenta creada. Iniciando sesión...', status: 'success' });
    } catch (err: any) {
      showToast({
        message: err?.response?.data?.message || 'Error al registrarse',
        status: 'error',
      });
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

  const handleManualPayment = useCallback(async () => {
    if (!checkoutPlan || !receiptFile) return;
    setReceiptUploading(true);
    try {
      const formData = new FormData();
      formData.append('plan', checkoutPlan.planKey + '|' + billingInterval);
      if (promoValidated?.code) {
        formData.append('promoCode', promoValidated.code);
      }
      let finalFile = receiptFile;
      if (receiptFile.type.startsWith('image/') && receiptFile.type !== 'image/gif') {
        try {
          const { resizeImage } = await import('~/utils/imageResize');
          const resized = await resizeImage(receiptFile, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
          });
          finalFile = resized.file;
        } catch (e) {
          console.warn('Fallback to original image: failed to resize', e);
        }
      }
      formData.append('receipt', finalFile);

      await axios.post('/api/wompi/manual-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}`;
    } catch (err: any) {
      showToast({
        message: err?.response?.data?.error || 'Error enviando comprobante',
        status: 'error',
      });
      setReceiptUploading(false);
    }
  }, [checkoutPlan, billingInterval, promoValidated, receiptFile, showToast]);

  const handleConfirmPayment = useCallback(async () => {
    if (!checkoutPlan) return;
    // If user is not logged in, show the inline guest form instead of redirecting
    if (!isAuthenticated) {
      setShowGuestForm(true);
      return;
    }
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

        trackCheckoutEvent('payment_started', {
          planId: checkoutPlan.planKey,
          interval: billingInterval,
          amountInCents: data.amountInCents,
        });

        checkout.open((result: any) => {
          const transaction = result?.transaction || {};
          if (transaction.status === 'APPROVED') {
            trackCheckoutEvent('payment_approved', {
              planId: checkoutPlan.planKey,
              interval: billingInterval,
              amountInCents: data.amountInCents,
            });
            // Immediate approval (card, Nequi, PSE resolved, etc.)
            axios
              .post('/api/wompi/verify-transaction', { transactionId: transaction.id })
              .then(() => {
                window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}`;
              })
              .catch(() => {
                window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}&fallback=1`;
              });
          } else if (transaction.status === 'PENDING') {
            // Async method (e.g. Compra y Paga Después / Bancolombia BNPL)
            // Register the transactionId so the background poller can follow it up
            axios
              .post('/api/wompi/register-pending', {
                reference: data.reference,
                transactionId: transaction.id,
              })
              .catch(() => {
                /* silent – poller will still catch webhook */
              });

            // Show informative screen instead of blank reload
            setPendingPaymentInfo({
              planName: checkoutPlan.planObj.name,
              email: authUser?.email || '',
            });
            setCheckoutPlan(null);
            setCheckoutLoading(null);
          } else {
            trackCheckoutEvent('payment_failed', {
              planId: checkoutPlan.planKey,
              interval: billingInterval,
              amountInCents: data.amountInCents,
            });
            showToast({ message: 'El pago no fue exitoso o fue cancelado', status: 'warning' });
            setCheckoutLoading(null);
          }
        });
      };
      document.body.appendChild(script);
    } catch (err: any) {
      showToast({
        message: err?.response?.data?.error || 'Error iniciando el pago con Wompi',
        status: 'error',
      });
      setCheckoutLoading(null);
    }
  }, [checkoutPlan, billingInterval, promoValidated, showToast, authUser, isAuthenticated]);

  /**
   * Guest Checkout: creates account + initiates payment in one go.
   * Called when an unauthenticated user submits the inline guest form.
   */
  const handleGuestCheckout = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!checkoutPlan) return;
      if (!guestData.name.trim() || !guestData.email.trim() || guestData.password.length < 8) {
        setGuestError('Por favor completa todos los campos (mínimo 8 caracteres en contraseña).');
        return;
      }
      setGuestLoading(true);
      setGuestError('');
      try {
        // Single backend call: creates user + Wompi transaction atomically (no login redirect)
        const { data } = await axios.post('/api/wompi/guest-checkout', {
          name: guestData.name,
          email: guestData.email,
          password: guestData.password,
          plan: checkoutPlan.planKey + '|' + billingInterval,
          promoCode: promoValidated?.code || undefined,
        });

        const { guestToken, ...wompiData } = data;

        setShowGuestForm(false);
        setGuestLoading(false);
        setCheckoutLoading(checkoutPlan.planKey);

        // Load Wompi widget and launch payment
        const launchWompi = () => {
          trackCheckoutEvent('payment_started', {
            planId: checkoutPlan.planKey,
            interval: billingInterval,
            amountInCents: wompiData.amountInCents,
            email: guestData.email,
          });

          const checkout = new (window as any).WidgetCheckout({
            currency: wompiData.currency,
            amountInCents: wompiData.amountInCents,
            reference: wompiData.reference,
            publicKey: wompiData.publicKey,
            signature: wompiData.signature ? { integrity: wompiData.signature } : undefined,
          });
          checkout.open((result: any) => {
            const transaction = result?.transaction || {};
            if (transaction.status === 'APPROVED') {
              trackCheckoutEvent('payment_approved', {
                planId: checkoutPlan.planKey,
                interval: billingInterval,
                amountInCents: wompiData.amountInCents,
                email: guestData.email,
              });
              // Use guest-verify (no auth required) with the guestToken from backend
              axios
                .post('/api/wompi/guest-verify', { transactionId: transaction.id, guestToken })
                .then(() => {
                  window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}`;
                })
                .catch(() => {
                  window.location.href = `/planes?success=1&plan=${checkoutPlan.planKey}&fallback=1`;
                });
            } else if (transaction.status === 'PENDING') {
              // For async methods, webhook will handle activation
              setPendingPaymentInfo({
                planName: checkoutPlan.planObj.name,
                email: guestData.email,
              });
              setCheckoutPlan(null);
              setCheckoutLoading(null);
            } else {
              trackCheckoutEvent('payment_failed', {
                planId: checkoutPlan.planKey,
                interval: billingInterval,
                amountInCents: wompiData.amountInCents,
                email: guestData.email,
              });
              showToast({ message: 'El pago no fue exitoso o fue cancelado', status: 'warning' });
              setCheckoutLoading(null);
            }
          });
        };

        if ((window as any).WidgetCheckout) {
          // Script already loaded
          launchWompi();
        } else {
          const script = document.createElement('script');
          script.src = 'https://checkout.wompi.co/widget.js';
          script.onload = launchWompi;
          document.body.appendChild(script);
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Error al procesar. Intenta de nuevo.';
        setGuestError(msg);
        setCheckoutLoading(null);
      } finally {
        setGuestLoading(false);
      }
    },
    [checkoutPlan, billingInterval, promoValidated, guestData, showToast],
  );

  const handleManageSubscription = useCallback(async () => {
    showToast({
      message: 'Para modificar o cancelar tu plan, comunícate con soporte@wappy.co',
      status: 'info',
    });
  }, [showToast]);

  return (
    <div className="relative min-h-screen bg-surface-secondary">
      {/* Theme Selector */}
      <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
        <ThemeSelector />
      </div>

      {/* Header Bar */}
      <div className="border-border-medium/50 bg-surface-secondary/80 sticky top-0 z-10 border-b backdrop-blur-xl">
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
        {pendingPaymentInfo ? (
          /* ── PENDING PAYMENT INFO VIEW (Compra y Paga Después / async methods) ── */
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <svg
                  className="h-10 w-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-black text-text-primary">
              Tu pago está siendo validado
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">
              Bancolombia está evaluando tu solicitud de{' '}
              <strong className="text-text-primary">Compra y Paga Después</strong> para el plan{' '}
              <strong className="text-text-primary">{pendingPaymentInfo.planName}</strong>. Este
              proceso puede tomar entre <strong>unos minutos y hasta 72 horas</strong>.
            </p>
            <div className="mb-6 space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left text-sm text-amber-700 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <span>
                  Recibirás una confirmación en tu correo{' '}
                  <strong>{pendingPaymentInfo.email}</strong> cuando Bancolombia apruebe la
                  transacción.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚡</span>
                <span>
                  Tu plan se activará <strong>automáticamente</strong> tan pronto el pago sea
                  aprobado, sin que tengas que hacer nada más.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">🔄</span>
                <span>
                  Si al ingresar a la plataforma en unas horas no ves tu plan actualizado, cierra
                  sesión y vuelve a entrar.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setPendingPaymentInfo(null);
                navigate('/c/new');
              }}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow transition-all hover:opacity-90"
            >
              Volver a la plataforma
            </button>
          </div>
        ) : checkoutPlan ? (
          /* ── CHECKOUT VIEW ── */
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-3xl font-black text-text-primary">Tu carrito</h2>
            <p className="mb-8 text-sm text-text-secondary">
              Revisa tu selección y aplica un código de descuento antes de continuar al pago.
            </p>

            <div className="grid gap-6 md:grid-cols-5">
              {/* LEFT: plan detail */}
              <div className="flex flex-col gap-5 md:col-span-3">
                <div
                  className={`rounded-2xl border bg-gradient-to-b p-6 ${checkoutPlan.planObj.gradientBg} ${checkoutPlan.planObj.borderColor} bg-surface-primary/70 shadow-sm`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-extrabold text-text-primary">
                        {checkoutPlan.planObj.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {checkoutPlan.planObj.tagline}
                      </p>
                    </div>
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${checkoutPlan.planObj.iconBg}`}
                    >
                      {React.createElement(
                        PLAN_ICON_MAP[checkoutPlan.planKey] || APP_ICON_MAP[checkoutPlan.planKey],
                        { className: `h-6 w-6 ${checkoutPlan.planObj.iconColor}` },
                      )}
                    </div>
                  </div>
                  <div className="mb-4 flex items-end gap-1">
                    {checkoutPlan.discountedPrice > 0 ? (
                      <>
                        <span className={`text-4xl font-black ${checkoutPlan.planObj.accentColor}`}>
                          {checkoutPlan.discountedPrice.toLocaleString('es-CO')}
                        </span>
                        <span className="mb-1 text-sm text-text-secondary">
                          /
                          {billingInterval === 'lifetime'
                            ? 'Pago único'
                            : billingInterval === 'monthly'
                              ? 'mes'
                              : billingInterval === 'quarterly'
                                ? 'trim.'
                                : billingInterval === 'semiannual'
                                  ? 'sem.'
                                  : 'año'}
                        </span>
                        <span className="ml-2 text-sm text-text-tertiary line-through decoration-red-400">
                          {checkoutPlan.displayPrice}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-4xl font-black ${checkoutPlan.planObj.accentColor}`}>
                          {checkoutPlan.displayPrice}
                        </span>
                        <span className="mb-1 text-sm text-text-secondary">
                          /
                          {billingInterval === 'lifetime'
                            ? 'Pago único'
                            : billingInterval === 'monthly'
                              ? 'mes'
                              : billingInterval === 'quarterly'
                                ? 'trim.'
                                : billingInterval === 'semiannual'
                                  ? 'sem.'
                                  : 'año'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 border-t border-border-light pt-4">
                    {checkoutPlan.planObj.features?.map((f: string) => {
                      const isHighlighted = f.includes('**');
                      const text = f.replace(/\*\*/g, '');
                      return (
                        <div
                          key={f}
                          className={`flex items-center gap-2 text-sm ${isHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                        >
                          <Check
                            className={`h-4 w-4 flex-shrink-0 ${isHighlighted ? 'text-emerald-500' : 'text-green-500'}`}
                          />
                          {text}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Promo code box */}
                {checkoutPlan.planKey !== 'ipevar' && (
                  <div className="rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
                      <PricingSVG className="h-4 w-4" />
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
                        className="flex-1 rounded-xl border border-border-light bg-surface-secondary px-4 py-2.5 font-mono text-sm uppercase transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleValidatePromo}
                        disabled={promoLoading || !promoCodeInput.trim() || !!promoValidated}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                    {promoValidated && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-3.5 py-2.5 text-sm font-semibold text-green-600">
                        <Check className="h-4 w-4" />
                        Código <strong>{promoValidated.code}</strong> aplicado —{' '}
                        {promoValidated.discountPercentage}% de descuento adicional
                      </div>
                    )}
                    {promoError && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm font-semibold text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {promoError}
                      </div>
                    )}
                  </div>
                )}

                {/* Compra y Paga Después Info Box */}
                <div className="group relative mt-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-50/50 p-5 shadow-sm dark:bg-blue-900/10">
                  <div className="absolute right-0 top-0 -mr-10 -mt-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-xl border border-blue-200/50 bg-blue-100 p-2.5 shadow-sm dark:border-blue-700/30 dark:bg-blue-800/30">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-blue-900 dark:text-blue-200">
                        Compra y Paga Después Bancolombia
                      </h4>
                      <div className="space-y-2 text-xs font-medium leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                        <p>
                          Paga a <strong>4 cuotas con 0% de interés mensual</strong> mediante Wompi.
                          El débito se realizará automáticamente a la cuenta Bancolombia que
                          autorices al finalizar el proceso.
                        </p>
                        <p className="rounded-lg border border-blue-100/50 bg-white/50 p-2.5 dark:border-blue-800/50 dark:bg-black/20">
                          <span className="font-black text-blue-900 dark:text-blue-300">
                            Activación:
                          </span>{' '}
                          Por políticas de verificación bancaria, la activación de tu plan al usar
                          este método se realizará en{' '}
                          <strong>hasta 24 horas o al día hábil siguiente</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Resumen del pedido */}
              <div className="md:col-span-2">
                <div className="sticky top-24 rounded-2xl border border-border-light bg-surface-primary p-6 shadow-sm">
                  <h3 className="mb-5 text-base font-bold text-text-primary">Resumen del pedido</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Plan</span>
                      <span className="font-bold text-text-primary">
                        {checkoutPlan.planObj.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Periodo</span>
                      <span className="font-medium capitalize text-text-primary">
                        {billingInterval === 'monthly'
                          ? 'Mensual'
                          : billingInterval === 'quarterly'
                            ? 'Trimestral'
                            : billingInterval === 'semiannual'
                              ? 'Semestral'
                              : 'Anual'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Precio base</span>
                      <span className="font-medium text-text-primary">
                        {checkoutPlan.displayPrice}
                      </span>
                    </div>
                    {checkoutPlan.promotion && (
                      <div className="flex justify-between text-indigo-500">
                        <span>Promoción ({checkoutPlan.promotion.discountPercentage}%)</span>
                        <span className="font-semibold">
                          -$
                          {Math.round(
                            checkoutPlan.rawPrice *
                              (checkoutPlan.promotion.discountPercentage / 100),
                          ).toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}
                    {promoValidated && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Cupón {promoValidated.code} ({promoValidated.discountPercentage}%)
                        </span>
                        <span className="font-semibold">
                          -$
                          {Math.round(
                            (checkoutPlan.discountedPrice > 0
                              ? checkoutPlan.discountedPrice
                              : checkoutPlan.rawPrice) *
                              (promoValidated.discountPercentage / 100),
                          ).toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="my-4 border-t border-border-light" />

                  <div className="mb-4">
                    <h4 className="mb-3 text-sm font-bold text-text-primary">Método de pago</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('wompi')}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-sm transition-all ${paymentMethod === 'wompi' ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400' : 'border-border-light bg-surface-secondary text-text-secondary hover:border-border-medium hover:bg-surface-hover'}`}
                      >
                        <CreditCard className="mb-1.5 h-5 w-5" />
                        Pago en Línea
                      </button>
                      <button
                        onClick={() => setPaymentMethod('nequi')}
                        className={`relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border p-3 text-sm transition-all ${paymentMethod === 'nequi' ? 'border-green-500 bg-green-50 font-bold text-green-700 shadow-sm dark:bg-green-500/10 dark:text-green-400' : 'border-border-light bg-surface-secondary text-text-secondary hover:border-border-medium hover:bg-surface-hover'}`}
                      >
                        <div className="absolute right-0 top-0 rounded-bl-lg bg-green-500 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white">
                          -5%
                        </div>
                        <svg
                          className="mb-0.5 h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                          <path d="M7 7h10" />
                          <path d="M7 12h10" />
                          <path d="M7 17h10" />
                        </svg>
                        QR Nequi
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 flex justify-between text-base font-black text-text-primary">
                    <span>Total a pagar</span>
                    <div className="text-right">
                      <span className={checkoutPlan.planObj.accentColor}>
                        ${finalCheckoutPrice.toLocaleString('es-CO')}
                      </span>
                      <span className="ml-1 block text-xs font-medium text-text-tertiary">
                        /
                        {billingInterval === 'monthly'
                          ? 'mes'
                          : billingInterval === 'quarterly'
                            ? 'trim.'
                            : billingInterval === 'semiannual'
                              ? 'sem.'
                              : 'año'}
                      </span>
                    </div>
                  </div>
                  {/* Proration info box */}
                  {activePlan &&
                    activePlan !== 'free' &&
                    activePlan !== 'admin' &&
                    activePlan !== checkoutPlan.planKey && (
                      <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-600 dark:text-indigo-400">
                        <strong>📅 Compensación de tiempo:</strong> Los días que te quedan de tu
                        plan <span className="font-semibold capitalize">{activePlan}</span> se
                        convertirán en días adicionales del nuevo plan {checkoutPlan.planObj.name}.
                        ¡No pierdes nada!
                      </div>
                    )}

                  {/* Terms of Service agreement for checkout */}
                  <div className="mb-4 flex items-start gap-3 px-1">
                    <div className="flex h-5 items-center">
                      <input
                        id="terms-checkout"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-border-medium bg-surface-primary text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <label
                      htmlFor="terms-checkout"
                      className="text-xs tracking-tight text-text-secondary"
                    >
                      He leído y acepto los{' '}
                      <a
                        href="/terms"
                        className="font-semibold text-green-600 hover:text-green-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Términos de Servicio
                      </a>{' '}
                      y la{' '}
                      <a
                        href="/privacy"
                        className="font-semibold text-green-600 hover:text-green-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidad
                      </a>
                    </label>
                  </div>

                  {paymentMethod === 'wompi' ? (
                    <>
                      {/* Guest checkout form: shown inline when user is not logged in */}
                      {showGuestForm && !isAuthenticated ? (
                        <form
                          onSubmit={handleGuestCheckout}
                          className="mt-2 space-y-3 rounded-2xl border border-indigo-500/30 bg-indigo-50/60 p-4 duration-300 animate-in fade-in slide-in-from-bottom-2 dark:bg-indigo-900/20"
                        >
                          <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            <User className="h-3.5 w-3.5" />
                            Crea tu cuenta para continuar con el pago
                          </p>
                          <input
                            type="text"
                            required
                            placeholder="Nombre completo"
                            value={guestData.name}
                            onChange={(e) => setGuestData((d) => ({ ...d, name: e.target.value }))}
                            className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          <input
                            type="email"
                            required
                            placeholder="Correo electrónico"
                            value={guestData.email}
                            onChange={(e) => setGuestData((d) => ({ ...d, email: e.target.value }))}
                            className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          <input
                            type="password"
                            required
                            minLength={8}
                            placeholder="Contraseña (mín. 8 caracteres)"
                            value={guestData.password}
                            onChange={(e) =>
                              setGuestData((d) => ({ ...d, password: e.target.value }))
                            }
                            className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          {guestError && (
                            <p className="text-xs font-medium text-red-500">{guestError}</p>
                          )}
                          <p className="text-[10px] text-text-tertiary">
                            Se creará una cuenta con estos datos para gestionar tu suscripción.{' '}
                            <button
                              type="button"
                              onClick={() => navigate('/login?redirect=/planes')}
                              className="font-semibold text-indigo-600 hover:underline"
                            >
                              ¿Ya tienes cuenta? Inicia sesión
                            </button>
                          </p>
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={guestLoading}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {guestLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                              Crear cuenta e ir al pago
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowGuestForm(false)}
                              className="w-full py-2 text-xs font-semibold text-text-tertiary transition-colors hover:text-text-secondary"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={handleConfirmPayment}
                            disabled={!!checkoutLoading || !termsAccepted}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all ${checkoutPlan.planObj.key === 'go' ? 'bg-blue-600 hover:bg-blue-700' : checkoutPlan.planObj.key === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            {checkoutLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <CreditCard className="h-5 w-5" />
                            )}
                            {isAuthenticated ? 'Continuar al pago' : 'Continuar al pago →'}
                          </button>
                          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Pago seguro con Wompi y tu banco
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 flex flex-col gap-4 border-t border-border-light pt-4">
                      <div className="rounded-xl border border-green-500/30 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-300">
                        <p className="mb-2 text-center text-base font-bold">
                          Escanea y transfiere esta cantidad exacta:
                        </p>
                        <p className="mb-4 text-center text-3xl font-black tracking-tight">
                          ${finalCheckoutPrice.toLocaleString('es-CO')}
                        </p>
                        <div
                          className="group relative mx-auto mb-4 flex w-fit cursor-pointer justify-center rounded-xl bg-white p-2 transition-all hover:ring-2 hover:ring-green-400"
                          onClick={() => setIsQRModalOpen(true)}
                        >
                          <img
                            src="/assets/QRWAPPY.png"
                            alt="QR Nequi Bancolombia"
                            className="h-40 w-40 rounded-lg object-contain shadow-sm"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <ZoomIn className="mb-1 h-8 w-8 text-white" />
                            <span className="text-xs font-bold text-white">Ampliar</span>
                          </div>
                        </div>
                        <p className="text-center text-xs leading-relaxed">
                          Una vez realizada la transferencia, sube aquí tu comprobante. La
                          activación de tu cuenta tomará <strong>hasta 24 horas hábiles</strong>{' '}
                          luego de la revisión.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-text-secondary">
                          Comprobante de Pago
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          className="w-full cursor-pointer text-sm text-text-secondary file:mr-3 file:rounded-xl file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>

                      <button
                        onClick={handleManualPayment}
                        disabled={receiptUploading || !receiptFile || !termsAccepted}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {receiptUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-5 w-5" />
                        )}
                        Enviar comprobante
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : showRegister ? (
          /* ── REGISTRATION VIEW FOR VISITORS ── */
          <div className="mx-auto max-w-xl">
            <div className="border-border-medium/40 relative overflow-hidden rounded-[2.5rem] border bg-white/80 p-10 shadow-2xl backdrop-blur-xl dark:bg-gray-900/80">
              <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
                    <User className="h-8 w-8" />
                  </div>
                </div>

                <h2 className="mb-2 text-center text-3xl font-black text-text-primary">
                  Crea tu cuenta
                </h2>
                <p className="mb-8 text-center text-sm text-text-secondary">
                  Necesitamos algunos datos básicos para activar tu plan{' '}
                  <strong>{pendingSubscribe?.planObj.name}</strong>.
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <input
                          required
                          type="text"
                          value={regData.name}
                          onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                          className="border-border-medium/30 bg-surface-secondary/50 w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none transition-all focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Nombre de Usuario
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                          @
                        </div>
                        <input
                          required
                          type="text"
                          value={regData.username}
                          onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                          className="border-border-medium/30 bg-surface-secondary/50 w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none transition-all focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                          placeholder="usuario"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                      <input
                        required
                        type="email"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        className="border-border-medium/30 bg-surface-secondary/50 w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none transition-all focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                          className="border-border-medium/30 bg-surface-secondary/50 w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none transition-all focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Confirmar
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={regData.confirmPassword}
                          onChange={(e) =>
                            setRegData({ ...regData, confirmPassword: e.target.value })
                          }
                          className="border-border-medium/30 bg-surface-secondary/50 w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none transition-all focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-3 px-1">
                    <div className="flex h-5 items-center">
                      <input
                        id="terms-register"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-border-medium bg-surface-primary text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <label
                      htmlFor="terms-register"
                      className="text-xs tracking-tight text-text-secondary"
                    >
                      Acepto los{' '}
                      <a
                        href="/terms"
                        className="font-semibold text-green-600 hover:text-green-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Términos de Servicio
                      </a>{' '}
                      y la{' '}
                      <a
                        href="/privacy"
                        className="font-semibold text-green-600 hover:text-green-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidad
                      </a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || !termsAccepted}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-xl shadow-green-500/20 transition-all hover:bg-green-700 disabled:opacity-70"
                  >
                    {regLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Crear cuenta y continuar'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-text-tertiary">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="font-bold text-green-600 hover:underline"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="mb-12 text-center">
              <div className="border-border-medium/60 mb-4 inline-flex items-center gap-3 rounded-full border bg-surface-primary px-5 py-2 text-lg font-medium text-text-secondary">
                <PricingSVG className="h-6 w-6 text-green-500" />
                Planes y Precios
              </div>
              <h1 className="mt-2 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                Elige tu plan de WAPPY IA
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-base text-text-secondary">
                Cancela cuando quieras desde tu portal de suscripción. Selecciona la facturación que
                más te convenga.
              </p>

              {/* Billing Interval Toggle */}
              <div className="mx-auto mb-10 mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
                {[
                  { id: 'monthly', label: 'Mensual' },
                  { id: 'quarterly', label: 'Trimestral' },
                  { id: 'semiannual', label: 'Semestral' },
                  { id: 'annual', label: 'Anual' },
                ].map((interval) => {
                  let maxDiscount = 0;
                  fetchedPlans.forEach((config: any) => {
                    if (config.promotions?.[interval.id]?.active) {
                      maxDiscount = Math.max(
                        maxDiscount,
                        config.promotions[interval.id].discountPercentage || 0,
                      );
                    }
                  });

                  return (
                    <button
                      key={interval.id}
                      onClick={() => setBillingInterval(interval.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 px-2 py-4 transition-all duration-300 ${
                        billingInterval === interval.id
                          ? 'border-green-500 bg-green-50/50 shadow-md shadow-green-500/10 dark:border-green-400 dark:bg-green-950/20'
                          : 'border-border-light bg-surface-primary hover:border-green-500/40 hover:bg-surface-hover'
                      }`}
                    >
                      <span
                        className={`text-base font-bold ${
                          billingInterval === interval.id
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-text-primary'
                        }`}
                      >
                        {interval.label}
                      </span>

                      {maxDiscount > 0 ? (
                        <span
                          className={`mt-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                            billingInterval === interval.id
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          }`}
                        >
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
                  className="border-border-medium/50 flex items-center gap-2 rounded-xl border bg-surface-primary px-5 py-2.5 text-sm text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
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

            {showUnifiedLayout ? (
              <div className="mx-auto mt-8 max-w-5xl px-4">
                <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                  {/* CARD 1: Wappy Vital */}
                  {(() => {
                    const plan = APP_PLANS.find((p) => p.key === 'ipevar')!;
                    const Icon = APP_ICON_MAP[plan.key] || IpevarSVG;
                    const isActive = !loading && activePlan === plan.key;
                    const isLoadingThis = checkoutLoading === plan.key;
                    const fetchedConfig = fetchedPlans.find((p) => p.planId === plan.key);

                    // Plan IPEVAR: pago único vitalicio
                    const fixedInterval = 'lifetime';
                    let rawPrice = 150000;
                    let displayPrice = '$150.000';
                    let promotion: any = null;

                    if (fetchedConfig && fetchedConfig.prices?.[fixedInterval]) {
                      rawPrice = fetchedConfig.prices[fixedInterval];
                      displayPrice = '$' + rawPrice.toLocaleString('es-CO');
                    }
                    if (fetchedConfig && fetchedConfig.promotions?.[fixedInterval]?.active) {
                      promotion = fetchedConfig.promotions[fixedInterval];
                    }

                    let discountedPrice = 0;
                    if (promotion && rawPrice > 0) {
                      discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
                    }

                    const totalToBill =
                      promotion && promotion.discountPercentage > 0 ? discountedPrice : rawPrice;

                    return (
                      <div
                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-8 transition-all duration-500 hover:-translate-y-2 ${plan.gradientBg} ${
                          isActive
                            ? `${plan.borderColor} shadow-2xl ring-2 ring-emerald-500/20`
                            : 'border-border-medium/40 hover:border-emerald-500/30 hover:shadow-2xl'
                        } bg-surface-primary/60 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.05)]`}
                      >
                        <div className="absolute -top-3 left-8 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                          ✨ Pago único de por vida
                        </div>

                        {promotion && promotion.discountPercentage > 0 && (
                          <div className="absolute right-6 top-6 z-10 whitespace-nowrap rounded-full border border-emerald-500/30 bg-[#ccff00] px-3.5 py-1.5 text-xs font-black text-black shadow-sm">
                            -{promotion.discountPercentage}%
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-6 mt-2">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-extrabold text-text-primary">{plan.name}</h2>
                            <p className="text-xs text-text-secondary">{plan.tagline}</p>
                          </div>
                        </div>

                        <div className="mb-6 flex flex-col items-start gap-1">
                          {promotion && promotion.discountPercentage > 0 && (
                            <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                              {displayPrice}
                            </span>
                          )}

                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tight text-emerald-500">
                              ${Math.round(totalToBill).toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm font-bold text-text-secondary">
                              Pago Único
                            </span>
                          </div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            ¡Pagas una vez, lo usas para siempre!
                          </p>
                        </div>

                        <div className="pt-2 mb-6">
                          <button
                            onClick={() =>
                              handleSubscribe(
                                plan.key,
                                plan,
                                displayPrice,
                                discountedPrice,
                                rawPrice,
                                promotion,
                              )
                            }
                            disabled={isLoadingThis || loading}
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition-all hover:opacity-90 hover:shadow-xl`}
                          >
                            {isLoadingThis ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Redirigiendo...
                              </>
                            ) : isActive ? (
                              'Plan Actual Activo'
                            ) : (
                              `Adquirir Wappy Vital`
                            )}
                          </button>
                        </div>

                        <div className="border-t border-border-light my-2"></div>

                        <ul className="mt-4 flex-1 space-y-3">
                          {plan.features.map((f) => {
                            const isHighlighted = f.includes('**');
                            const text = f.replace(/\*\*/g, '');
                            return (
                              <li
                                key={f}
                                className={`flex items-start gap-3 text-xs md:text-sm ${isHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                              >
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                {text}
                              </li>
                            );
                          })}
                          {plan.notIncluded.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-3 text-xs md:text-sm text-text-tertiary line-through opacity-40"
                            >
                              <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-center font-bold text-red-500">✕</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* CARD 2: Wappy Pro */}
                  {(() => {
                    const plan = PLANS.find((p) => p.key === 'pro')!;
                    const Icon = PLAN_ICON_MAP[plan.key] || ProSVG;
                    const isUserAdmin = !loading && activePlan === 'admin';
                    const isActive =
                      !loading && (activePlan === plan.key || (isUserAdmin && plan.key === 'pro'));
                    const isLoadingThis = checkoutLoading === plan.key;
                    const fetchedConfig = fetchedPlans.find((p) => p.planId === plan.key);

                    // Dynamic price
                    let rawPrice = 0;
                    let displayPrice = plan.price;
                    let promotion: any = null;

                    if (fetchedConfig) {
                      rawPrice = fetchedConfig.prices?.[billingInterval] || 0;
                      displayPrice = rawPrice > 0 ? '$' + rawPrice.toLocaleString('es-CO') : '$0';
                      if (fetchedConfig.promotions?.[billingInterval]?.active) {
                        promotion = fetchedConfig.promotions[billingInterval];
                      }
                    }

                    let discountedPrice = 0;
                    if (promotion && rawPrice > 0) {
                      discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
                    }

                    const isNotMonthly = billingInterval !== 'monthly';
                    const monthsDivisor =
                      billingInterval === 'quarterly'
                        ? 3
                        : billingInterval === 'semiannual'
                          ? 6
                          : billingInterval === 'annual'
                            ? 12
                            : 1;
                    const totalToBill = promotion && promotion.discountPercentage > 0
                        ? discountedPrice
                        : rawPrice;
                    const pricePerMonth = totalToBill / monthsDivisor;

                    return (
                      <div
                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-8 transition-all duration-500 hover:-translate-y-2 ${plan.gradientBg} border-amber-500/30 shadow-2xl ring-1 ring-amber-500/20 bg-surface-primary/60 backdrop-blur-md shadow-[0_0_40px_rgba(245,158,11,0.05)]`}
                      >
                        <div className="absolute -top-3 left-8 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                          ⭐ Plan Profesional Todo Incluido
                        </div>

                        {promotion && promotion.discountPercentage > 0 && (
                          <div className="absolute right-6 top-6 z-10 whitespace-nowrap rounded-full border border-amber-500/30 bg-[#ccff00] px-3.5 py-1.5 text-xs font-black text-black shadow-sm">
                            -{promotion.discountPercentage}%
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-6 mt-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-extrabold text-text-primary">{plan.name}</h2>
                            <p className="text-xs text-text-secondary">{plan.tagline}</p>
                          </div>
                        </div>

                        <div className="mb-6 flex flex-col items-start gap-1">
                          {promotion && promotion.discountPercentage > 0 && (
                            <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                              {displayPrice}
                            </span>
                          )}

                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tight text-amber-500">
                              ${Math.round(totalToBill).toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm font-bold text-text-secondary">
                              /
                              {billingInterval === 'monthly'
                                ? 'mes'
                                : billingInterval === 'quarterly'
                                  ? 'trim.'
                                  : billingInterval === 'semiannual'
                                    ? 'sem.'
                                    : 'año'}
                            </span>
                          </div>

                          {isNotMonthly && (
                            <div className="mt-0.5 text-sm font-bold text-text-primary">
                              ${Math.round(pricePerMonth).toLocaleString('es-CO')}{' '}
                              <span className="text-xs font-semibold text-text-secondary">/mes (facturado en total)</span>
                            </div>
                          )}

                          {promotion && (
                            <div className="mt-2 w-full rounded-md bg-indigo-500/10 px-3 py-1 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {promotion.text || 'Oferta por tiempo limitado'}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 mb-6">
                          <button
                            onClick={() =>
                              handleSubscribe(
                                plan.key,
                                plan,
                                displayPrice,
                                discountedPrice,
                                rawPrice,
                                promotion,
                              )
                            }
                            disabled={isLoadingThis || loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/15 transition-all hover:opacity-90 hover:shadow-xl"
                          >
                            {isLoadingThis ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Redirigiendo...
                              </>
                            ) : isActive ? (
                              isUserAdmin ? 'Plan de Admin Activo' : 'Suscripción Activa'
                            ) : (
                              `Adquirir Wappy Pro`
                            )}
                          </button>
                        </div>

                        <div className="border-t border-border-light my-2"></div>

                        <ul className="mt-4 flex-1 space-y-3">
                          {plan.features.map((f) => {
                            const isHighlighted = f.includes('**');
                            const text = f.replace(/\*\*/g, '');
                            return (
                              <li
                                key={f}
                                className={`flex items-start gap-3 text-xs md:text-sm ${isHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                              >
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                                {text}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <>
                {/* ── Plans grid (existing 4 plans) ── */}
                {/* Only show plans that are enabled in visibility config */}
                <div
                  className={`mt-4 grid gap-5 ${
                    [
                      visibility.showPlanFree,
                      visibility.showPlanGo,
                      visibility.showPlanPlus,
                      visibility.showPlanPro,
                    ].filter(Boolean).length === 1
                      ? 'mx-auto max-w-sm sm:grid-cols-1'
                      : [
                            visibility.showPlanFree,
                            visibility.showPlanGo,
                            visibility.showPlanPlus,
                            visibility.showPlanPro,
                          ].filter(Boolean).length === 2
                        ? 'mx-auto max-w-2xl sm:grid-cols-2'
                        : [
                              visibility.showPlanFree,
                              visibility.showPlanGo,
                              visibility.showPlanPlus,
                              visibility.showPlanPro,
                            ].filter(Boolean).length === 3
                          ? 'sm:grid-cols-3'
                          : 'sm:grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {PLANS.filter((plan) => {
                    if (plan.key === 'free') return false;
                    if (plan.key === 'go') return visibility.showPlanGo;
                    if (plan.key === 'plus') return visibility.showPlanPlus;
                    if (plan.key === 'pro') return visibility.showPlanPro;
                    return true;
                  }).map((plan) => {
                    const Icon = PLAN_ICON_MAP[plan.key];

                    const isUserAdmin = !loading && activePlan === 'admin';
                    const isActive =
                      !loading && (activePlan === plan.key || (isUserAdmin && plan.key === 'pro'));

                    const isLoadingThis = checkoutLoading === plan.key;
                    const isFree = plan.key === 'free';
                    const fetchedConfig = fetchedPlans.find((p) => p.planId === plan.key);

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
                      discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
                    }

                    const isNotMonthly = billingInterval !== 'monthly';
                    const monthsDivisor =
                      billingInterval === 'quarterly'
                        ? 3
                        : billingInterval === 'semiannual'
                          ? 6
                          : billingInterval === 'annual'
                            ? 12
                            : 1;
                    const totalToBill = isFree
                      ? 0
                      : promotion && promotion.discountPercentage > 0
                        ? discountedPrice
                        : rawPrice;
                    const pricePerMonth = isFree ? 0 : totalToBill / monthsDivisor;

                    return (
                      <div
                        key={plan.key}
                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.gradientBg} ${
                          isActive
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
                            className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold text-white shadow ${
                              plan.key === 'free'
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
                          <div className="absolute right-5 top-5 z-10 whitespace-nowrap rounded-full border border-[#aadd00]/30 bg-[#ccff00] px-3 py-1 text-xs font-black text-black shadow-sm">
                            -{promotion.discountPercentage}%
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                        >
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
                              {isFree ? '$0' : '$' + Math.round(totalToBill).toLocaleString('es-CO')}
                            </span>
                            <span className="mb-1 text-xs font-semibold text-text-secondary">
                              /
                              {isFree
                                ? 'mes'
                                : billingInterval === 'monthly'
                                  ? 'mes'
                                  : billingInterval === 'quarterly'
                                    ? 'trim.'
                                    : billingInterval === 'semiannual'
                                      ? 'sem.'
                                      : 'año'}
                            </span>
                          </div>

                          {isNotMonthly && !isFree && (
                            <div className="mt-0.5 text-base font-bold text-text-primary">
                              ${Math.round(pricePerMonth).toLocaleString('es-CO')}{' '}
                              <span className="text-xs font-semibold text-text-secondary">/mes</span>
                            </div>
                          )}

                          {promotion && (
                            <div className="mt-2 w-full rounded-md bg-indigo-500/10 px-3 py-1.5 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                              {promotion.text || 'Oferta por tiempo limitado'}
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="mt-auto pt-2">
                          <button
                            onClick={() =>
                              !isFree &&
                              handleSubscribe(
                                plan.key,
                                plan,
                                displayPrice,
                                discountedPrice,
                                rawPrice,
                                promotion,
                              )
                            }
                            disabled={isFree || isLoadingThis || loading}
                            className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                              isFree
                                ? 'border-border-medium/40 cursor-default border bg-transparent text-text-tertiary'
                                : `bg-gradient-to-r ${
                                    plan.key === 'go'
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
                              'Renovar o Ampliar'
                            ) : isFree ? (
                              'Plan gratuito'
                            ) : (
                              `Comenzar con ${plan.name}`
                            )}
                          </button>
                        </div>

                        {/* Features */}
                        <ul className="mt-5 flex-1 space-y-2">
                          {plan.features.map((f) => {
                            const isHighlighted = f.includes('**');
                            const text = f.replace(/\*\*/g, '');
                            return (
                              <li
                                key={f}
                                className={`flex items-start gap-2 text-xs ${isHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                              >
                                <Check
                                  className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${isHighlighted ? 'text-emerald-500' : 'text-green-500'}`}
                                />
                                {text}
                              </li>
                            );
                          })}
                          {plan.notIncluded.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-xs text-text-tertiary line-through opacity-40"
                            >
                              <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-center">✕</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* ── App Plans Section ──────────────────────── */}
                {visibility.showSectionAppPlans && (
                  <div className="mt-16">
                    {/* Section divider */}
                    <div className="mb-8 flex items-center gap-4">
                      <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-r from-transparent" />
                      <div className="border-border-medium/60 flex items-center gap-3 rounded-full border bg-surface-primary px-5 py-2">
                        <PricingSVG className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-semibold text-text-primary">
                          Planes por Aplicativos
                        </span>
                      </div>
                      <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-l from-transparent" />
                    </div>

                    <div className="grid justify-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {APP_PLANS.map((plan) => {
                        const Icon = APP_ICON_MAP[plan.key];
                        const isUserAdmin = !loading && activePlan === 'admin';
                        const isActive = !loading && activePlan === plan.key;
                        const isLoadingThis = checkoutLoading === plan.key;
                        const fetchedConfig = fetchedPlans.find((p) => p.planId === plan.key);

                        // Plan IPEVAR: pago único vitalicio
                        const fixedInterval = plan.key === 'ipevar' ? 'lifetime' : 'annual';
                        let rawPrice = 150000;
                        let displayPrice = '$150.000';
                        let promotion: any = null;

                        if (fetchedConfig && fetchedConfig.prices?.[fixedInterval]) {
                          rawPrice = fetchedConfig.prices[fixedInterval];
                          displayPrice = '$' + rawPrice.toLocaleString('es-CO');
                        }
                        if (fetchedConfig && fetchedConfig.promotions?.[fixedInterval]?.active) {
                          promotion = fetchedConfig.promotions[fixedInterval];
                        }

                        let discountedPrice = 0;
                        if (promotion && rawPrice > 0) {
                          discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
                        }

                        const totalToBill =
                          promotion && promotion.discountPercentage > 0 ? discountedPrice : rawPrice;

                        return (
                          <div
                            key={plan.key}
                            className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.gradientBg} ${
                              isActive
                                ? `${plan.borderColor} shadow-lg ring-1 ring-inset ${plan.borderColor}`
                                : `border-border-medium/40 hover:${plan.borderColor.replace('border-', '')} hover:shadow-md`
                            } bg-surface-primary/60 backdrop-blur-sm lg:col-start-2`}
                          >
                            {plan.popular && !isActive && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-0.5 text-xs font-bold text-white shadow">
                                ⭐ Destacado
                              </div>
                            )}
                            {isActive && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-0.5 text-xs font-bold text-white shadow">
                                ✓ Plan actual
                              </div>
                            )}
                            {promotion && promotion.discountPercentage > 0 && (
                              <div className="absolute right-5 top-5 z-10 whitespace-nowrap rounded-full border border-[#aadd00]/30 bg-[#ccff00] px-3 py-1 text-xs font-black text-black shadow-sm">
                                -{promotion.discountPercentage}%
                              </div>
                            )}

                            <div
                              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                            >
                              <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                            </div>

                            <h2 className="text-xl font-bold text-text-primary">{plan.name}</h2>
                            <p className="mb-4 h-10 text-xs text-text-secondary">{plan.tagline}</p>

                            <div className="mb-5 flex flex-col items-start gap-1">
                              {promotion && promotion.discountPercentage > 0 && (
                                <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                                  {displayPrice}
                                </span>
                              )}

                              <div className="flex items-end gap-1">
                                <span
                                  className={`text-4xl font-black tracking-tight ${plan.accentColor}`}
                                >
                                  ${Math.round(totalToBill).toLocaleString('es-CO')}
                                </span>
                                <span className="mb-1 text-xs font-semibold text-text-secondary">
                                  {plan.key === 'ipevar' ? 'Pago único vitalicio' : '/año'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-auto pt-2">
                              <button
                                onClick={() =>
                                  handleSubscribe(
                                    plan.key,
                                    plan,
                                    displayPrice,
                                    discountedPrice,
                                    rawPrice,
                                    promotion,
                                  )
                                }
                                disabled={isLoadingThis || loading}
                                className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md`}
                              >
                                {isLoadingThis ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo...
                                  </>
                                ) : isActive ? (
                                  'Renovar o Ampliar'
                                ) : (
                                  `Comenzar con ${plan.name}`
                                )}
                              </button>
                            </div>

                            <ul className="mt-5 flex-1 space-y-2">
                              {plan.features.map((f) => {
                                const isHighlighted = f.includes('**');
                                const text = f.replace(/\*\*/g, '');
                                return (
                                  <li
                                    key={f}
                                    className={`flex items-start gap-2 text-xs ${isHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                                  >
                                    <Check
                                      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${isHighlighted ? 'text-emerald-500' : 'text-green-500'}`}
                                    />
                                    {text}
                                  </li>
                                );
                              })}
                              {plan.notIncluded.map((f) => (
                                <li
                                  key={f}
                                  className="flex items-start gap-2 text-xs text-text-tertiary line-through opacity-40"
                                >
                                  <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-center">
                                    ✕
                                  </span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Custom Plan Builder Section ("Arma tu Plan") ──────────────── */}
            {visibility.showSectionCustomPlan && (
              <div className="mt-16">
                {/* Section divider */}
                <div className="mb-8 flex items-center gap-4">
                  <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-r from-transparent" />
                  <div className="border-border-medium/60 flex items-center gap-3 rounded-full border bg-surface-primary px-5 py-2">
                    <Puzzle className="h-5 w-5 text-fuchsia-500" />
                    <span className="text-sm font-semibold text-text-primary">
                      Arma tu Plan a la Medida
                    </span>
                  </div>
                  <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-l from-transparent" />
                </div>

                <p className="mb-8 text-center text-sm text-text-secondary">
                  Selecciona solo las herramientas que necesitas y el periodo que prefieras.{' '}
                  <span className="font-semibold text-text-primary">
                    Siempre incluye Chat con IA y Aula de Estudio.
                  </span>
                </p>

                {customPlanConfig ? (
                  (() => {
                    const tp = customPlanConfig.toolPrices || {
                      blog: 5000,
                      somos_sst: 35000,
                      editor_archivos: 5000,
                      analisis_vivo: 15000,
                    };
                    const basePM = customPlanConfig.basePriceMonthly || 12000;
                    const td = customPlanConfig.timeDiscounts || {
                      daily: 0,
                      weekly: 0,
                      monthly: 0,
                      quarterly: 5,
                      semiannual: 10,
                      annual: 15,
                    };

                    const tools = [
                      {
                        key: 'blog',
                        name: 'Blog WAPPY',
                        desc: 'Contenido y artículos',
                        price: tp.blog,
                        emoji: '📝',
                      },
                      {
                        key: 'somos_sst',
                        name: 'Somos SST',
                        desc: 'Gamificación SST completa',
                        price: tp.somos_sst,
                        emoji: '🎮',
                      },
                      {
                        key: 'editor_archivos',
                        name: 'Editor de Archivos',
                        desc: 'Editor documental con IA',
                        price: tp.editor_archivos,
                        emoji: '📄',
                      },
                      {
                        key: 'analisis_vivo',
                        name: 'Análisis en Vivo',
                        desc: 'Análisis en tiempo real',
                        price: tp.analisis_vivo,
                        emoji: '📊',
                      },
                    ];

                    const intervals = [
                      { key: 'daily', label: '1 Día', discount: td.daily },
                      { key: 'weekly', label: '1 Semana', discount: td.weekly },
                      { key: 'monthly', label: '1 Mes', discount: td.monthly },
                      { key: 'quarterly', label: 'Trimestre', discount: td.quarterly },
                      { key: 'semiannual', label: 'Semestre', discount: td.semiannual },
                      { key: 'annual', label: 'Anual', discount: td.annual },
                    ];

                    // Calculate price
                    let monthlyTotal = basePM;
                    for (const t of selectedTools) {
                      monthlyTotal += tp[t] || 0;
                    }
                    const multipliers: Record<string, number> = {
                      daily: 1 / 30,
                      weekly: 7 / 30,
                      monthly: 1,
                      quarterly: 3,
                      semiannual: 6,
                      annual: 12,
                    };
                    const rawTotal = monthlyTotal * (multipliers[customInterval] || 1);
                    const discount = td[customInterval] || 0;
                    const finalCustomPrice = Math.round(rawTotal * (1 - discount / 100));

                    const handleCustomCheckout = async () => {
                      if (selectedTools.length === 0) return;
                      if (!isAuthenticated) {
                        setShowGuestForm(true);
                        return;
                      }
                      setCustomCheckoutLoading(true);
                      try {
                        const { data } = await axios.post('/api/wompi/create-custom-transaction', {
                          tools: selectedTools,
                          interval: customInterval,
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
                            const transaction = result?.transaction || {};
                            if (transaction.status === 'APPROVED') {
                              axios
                                .post('/api/wompi/verify-transaction', {
                                  transactionId: transaction.id,
                                })
                                .then(() => {
                                  window.location.href = '/planes?success=1&plan=custom';
                                })
                                .catch(() => {
                                  window.location.href = '/planes?success=1&plan=custom&fallback=1';
                                });
                            } else if (transaction.status === 'PENDING') {
                              setPendingPaymentInfo({
                                planName: 'Plan a la Medida',
                                email: authUser?.email || '',
                              });
                              setCustomCheckoutLoading(false);
                            } else {
                              showToast({
                                message: 'El pago no fue exitoso o fue cancelado',
                                status: 'warning',
                              });
                              setCustomCheckoutLoading(false);
                            }
                          });
                        };
                        document.body.appendChild(script);
                      } catch (err: any) {
                        showToast({
                          message: err?.response?.data?.error || 'Error iniciando pago',
                          status: 'error',
                        });
                        setCustomCheckoutLoading(false);
                      }
                    };

                    return (
                      <div className="mx-auto max-w-4xl">
                        <div className="grid gap-6 md:grid-cols-5">
                          {/* LEFT: Tool Selector */}
                          <div className="space-y-4 md:col-span-3">
                            {/* Base always included */}
                            <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/5 to-purple-500/5 p-5">
                              <div className="mb-4 flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-extrabold text-text-primary">
                                    Base incluida
                                  </h3>
                                  <p className="text-xs text-text-secondary">
                                    Chat con IA + Aula de Estudio
                                  </p>
                                </div>
                                <span className="text-lg font-black text-fuchsia-500">
                                  ${basePM.toLocaleString('es-CO')}
                                  <span className="text-xs font-semibold text-text-tertiary">
                                    /mes
                                  </span>
                                </span>
                              </div>
                              <div className="flex gap-3">
                                <div className="flex items-center gap-2 rounded-lg bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                  <Check className="h-3.5 w-3.5" /> Chat con IA
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                  <Check className="h-3.5 w-3.5" /> Aula de Estudio
                                </div>
                              </div>
                            </div>

                            {/* Tool toggles */}
                            <h4 className="text-sm font-bold text-text-primary">
                              Agrega herramientas:
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {tools.map((tool) => {
                                const isSelected = selectedTools.includes(tool.key);
                                return (
                                  <button
                                    key={tool.key}
                                    onClick={() => {
                                      setSelectedTools((prev) =>
                                        isSelected
                                          ? prev.filter((t) => t !== tool.key)
                                          : [...prev, tool.key],
                                      );
                                    }}
                                    className={`relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                                      isSelected
                                        ? 'border-fuchsia-500 bg-fuchsia-50/50 shadow-md ring-1 ring-fuchsia-500/30 dark:bg-fuchsia-500/10'
                                        : 'border-border-medium/40 bg-surface-primary hover:border-fuchsia-500/40 hover:shadow-sm'
                                    }`}
                                  >
                                    <div
                                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
                                        isSelected ? 'bg-fuchsia-500/20' : 'bg-surface-tertiary'
                                      }`}
                                    >
                                      {tool.emoji}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold text-text-primary">
                                        {tool.name}
                                      </div>
                                      <div className="text-xs text-text-secondary">{tool.desc}</div>
                                      <div
                                        className={`mt-0.5 text-xs font-bold ${isSelected ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-text-tertiary'}`}
                                      >
                                        +${tool.price.toLocaleString('es-CO')}/mes
                                      </div>
                                    </div>
                                    <div
                                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                        isSelected
                                          ? 'border-fuchsia-500 bg-fuchsia-500'
                                          : 'border-border-medium bg-surface-secondary'
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Period selector */}
                            <h4 className="mt-6 text-sm font-bold text-text-primary">
                              Elige tu periodo:
                            </h4>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                              {intervals.map((iv) => (
                                <button
                                  key={iv.key}
                                  onClick={() => setCustomInterval(iv.key)}
                                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 transition-all duration-200 ${
                                    customInterval === iv.key
                                      ? 'border-fuchsia-500 bg-fuchsia-50/50 shadow-sm dark:bg-fuchsia-500/10'
                                      : 'border-border-light bg-surface-primary hover:border-fuchsia-500/40'
                                  }`}
                                >
                                  <span
                                    className={`text-xs font-bold ${customInterval === iv.key ? 'text-fuchsia-700 dark:text-fuchsia-400' : 'text-text-primary'}`}
                                  >
                                    {iv.label}
                                  </span>
                                  {iv.discount > 0 && (
                                    <span
                                      className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                        customInterval === iv.key
                                          ? 'bg-fuchsia-500 text-white'
                                          : 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-400'
                                      }`}
                                    >
                                      -{iv.discount}%
                                    </span>
                                  )}
                                  {customInterval === iv.key && (
                                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow">
                                      <Check strokeWidth={3} className="h-3 w-3" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* RIGHT: Summary */}
                          <div className="md:col-span-2">
                            <div className="sticky top-24 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/5 to-purple-500/10 p-6 shadow-sm">
                              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
                                <Puzzle className="h-4 w-4 text-fuchsia-500" />
                                Tu Plan a la Medida
                              </h3>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Base (Chat + Aula)</span>
                                  <span className="font-semibold text-text-primary">
                                    ${basePM.toLocaleString('es-CO')}
                                  </span>
                                </div>
                                {selectedTools.map((tk) => {
                                  const t = tools.find((x) => x.key === tk);
                                  return t ? (
                                    <div key={tk} className="flex justify-between">
                                      <span className="text-text-secondary">
                                        {t.emoji} {t.name}
                                      </span>
                                      <span className="font-semibold text-text-primary">
                                        +${t.price.toLocaleString('es-CO')}
                                      </span>
                                    </div>
                                  ) : null;
                                })}
                                <div className="mt-2 border-t border-border-light pt-2">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Subtotal mensual</span>
                                    <span className="font-bold text-text-primary">
                                      ${monthlyTotal.toLocaleString('es-CO')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Periodo</span>
                                  <span className="font-medium text-text-primary">
                                    {intervals.find((i) => i.key === customInterval)?.label ||
                                      'Mensual'}
                                  </span>
                                </div>
                                {discount > 0 && (
                                  <div className="flex justify-between text-fuchsia-600 dark:text-fuchsia-400">
                                    <span>Descuento ({discount}%)</span>
                                    <span className="font-semibold">
                                      -$
                                      {Math.round((rawTotal * discount) / 100).toLocaleString(
                                        'es-CO',
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="my-4 border-t border-border-light" />

                              <div className="flex justify-between text-lg font-black text-text-primary">
                                <span>Total</span>
                                <div className="text-right">
                                  <span className="text-fuchsia-600 dark:text-fuchsia-400">
                                    ${finalCustomPrice.toLocaleString('es-CO')}
                                  </span>
                                  <span className="ml-1 block text-xs font-medium text-text-tertiary">
                                    /
                                    {customInterval === 'daily'
                                      ? 'día'
                                      : customInterval === 'weekly'
                                        ? 'semana'
                                        : customInterval === 'monthly'
                                          ? 'mes'
                                          : customInterval === 'quarterly'
                                            ? 'trim.'
                                            : customInterval === 'semiannual'
                                              ? 'sem.'
                                              : 'año'}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={handleCustomCheckout}
                                disabled={selectedTools.length === 0 || customCheckoutLoading}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {customCheckoutLoading ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" /> Procesando...
                                  </>
                                ) : selectedTools.length === 0 ? (
                                  'Selecciona al menos una herramienta'
                                ) : (
                                  <>
                                    <CreditCard className="h-5 w-5" /> Continuar al pago
                                  </>
                                )}
                              </button>

                              {selectedTools.length === 0 && (
                                <p className="mt-3 text-center text-xs text-text-tertiary">
                                  Agrega herramientas para ver el precio
                                </p>
                              )}

                              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Pago seguro con Wompi
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
                  </div>
                )}
              </div>
            )}

            {/* ── Enterprise Plans Section ──────────────────────── */}
            {visibility.showSectionEnterprise && (
              <div className="mt-16">
                {/* Section divider */}
                <div className="mb-8 flex items-center gap-4">
                  <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-r from-transparent" />
                  <div className="border-border-medium/60 flex items-center gap-3 rounded-full border bg-surface-primary px-5 py-2">
                    <Building2 className="h-5 w-5 text-violet-500" />
                    <span className="text-sm font-semibold text-text-primary">
                      Planes Corporativos
                    </span>
                  </div>
                  <div className="via-border-medium/50 to-border-medium/50 h-px flex-1 bg-gradient-to-l from-transparent" />
                </div>

                <p className="mb-8 text-center text-sm text-text-secondary">
                  Soluciones personalizadas para empresas, intermediadores ARL y asesores SST
                  independientes.{' '}
                  <span className="font-semibold text-text-primary">
                    Incluye todas las ventajas del Plan Pro.
                  </span>
                </p>

                {/* Enterprise plans grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {ENTERPRISE_PLANS.map((plan) => {
                    const Icon = ENTERPRISE_ICON_MAP[plan.key];
                    return (
                      <div
                        key={plan.key}
                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.gradientBg} border-border-medium/40 hover:border-${plan.borderColor.replace('border-', '')} bg-surface-primary/60 backdrop-blur-sm hover:shadow-lg`}
                      >
                        {/* Icon */}
                        <div
                          className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                        >
                          <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                        </div>

                        {/* Header Content with fixed min-height for alignment */}
                        <div className="flex min-h-[160px] flex-col">
                          {/* Name */}
                          <h2 className="text-xl font-bold leading-tight text-text-primary">
                            {plan.name}
                          </h2>

                          {/* Free note for first enterprise plan */}
                          {plan.isFreeEnterprise && (
                            <p className="mt-1 text-xs font-semibold text-amber-500 dark:text-amber-400">
                              {plan.freeNote}
                            </p>
                          )}

                          <p className="mb-4 mt-1.5 text-xs text-text-secondary">{plan.tagline}</p>

                          {/* Price */}
                          <div className="mb-4 mt-auto">
                            <span
                              className={`text-2xl font-black tracking-tight ${plan.accentColor}`}
                            >
                              {plan.isFreeEnterprise ? 'Gratis' : 'A consultar'}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="pt-2">
                          <button
                            onClick={() => navigate('/contactanos')}
                            className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-2.5 text-sm font-semibold text-white transition-all ${plan.buttonGradient} hover:opacity-90 hover:shadow-md`}
                          >
                            <Users className="h-4 w-4" />
                            Contáctanos
                          </button>
                        </div>

                        {/* Features */}
                        <ul className="mt-1 flex-1 space-y-2">
                          {plan.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-xs text-text-secondary"
                            >
                              <Check
                                className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${plan.accentColor}`}
                              />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="mt-12 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 p-6 text-center">
              <p className="text-sm text-text-secondary">
                Los precios están en pesos colombianos (COP). El cobro se realiza automáticamente de
                forma mensual, trimestral, semestral o anual según tu elección.
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
                WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados ©
              </p>
            </div>
          </>
        )}
      </div>
      {/* QR Modal Popup */}
      {isQRModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsQRModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute -right-4 -top-4 rounded-full bg-red-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-center text-xl font-black text-text-primary">
              Código QR Nequi / Bancolombia
            </h3>
            <div
              className="relative mx-auto cursor-pointer rounded-2xl bg-white p-2"
              onClick={() => setIsQRModalOpen(false)}
            >
              <img
                src="/assets/QRWAPPY.png"
                alt="QR Nequi Full Size"
                className="h-auto w-full rounded-xl object-contain"
              />
            </div>
            <p className="mt-4 text-center text-sm text-text-secondary">
              Escanea este código desde tu App Bancolombia o Nequi para transferir{' '}
              <strong>${finalCheckoutPrice.toLocaleString('es-CO')}</strong>.
            </p>
            <a
              href="/assets/QRWAPPY.png"
              download="QR_Nequi_Wappy.png"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-100 py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-200"
            >
              <Download className="h-4 w-4" />
              Descargar Código QR
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
