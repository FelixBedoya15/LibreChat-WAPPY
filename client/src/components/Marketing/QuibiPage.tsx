import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  MessageCircle, 
  ShoppingBag, 
  X, 
  Truck, 
  Droplet,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Play,
  ZoomIn,
  Eye,
  CheckCircle2
} from 'lucide-react';
import './marketing.css';
import './quibi.css';

// 5 Authentic Manufactured Product Showcase Slides for the High-Design Hero Slider
const SLIDES = [
  {
    id: '3-bottles',
    tone: 'plum',
    word: 'QUIBI',
    kicker: 'CÁPSULAS BLANDAS CON RELLENO LÍQUIDO',
    title: (
      <>
        El poder del <em>Vinagre de Manzana</em> sin quemar tu garganta.
      </>
    ),
    sub: 'La primera fórmula en Colombia con centro líquido activo de vinagre de cidra y té verde. Cero azúcar añadido, cero daño al esmalte dental y máxima absorción gástrica.',
    tags: ['Invima RSA-4113-2025', '60 Cápsulas Blandas', '0g Azúcar Añadido'],
    img: '/marketing/quibi/quibi-3-bottles.jpg',
    imgTitle: 'Presentación Oficial QUIBI (QB)',
    chips: [
      { cls: 'c1', ico: '💧', title: 'Centro Líquido', sub: 'Absorción inmediata' },
      { cls: 'c2', ico: '🛡️', title: 'Invima Certificado', sub: 'RSA-4113-2025' },
      { cls: 'c3', ico: '🌿', title: '0g Azúcar', sub: 'Solo 5 kcal/porción' },
    ],
  },
  {
    id: 'front',
    tone: 'indigo',
    word: 'SOFTGEL',
    kicker: 'TECNOLOGÍA DE ENCAPSULACIÓN PURA',
    title: (
      <>
        Perlas de gelatina suave con <em>Relleno Líquido</em> concentrado.
      </>
    ),
    sub: 'Olvida las gomitas dulces cargadas de almidón y glucosa. QUIBI resguarda los extractos botánicos dentro de una suave cubierta de gelatina que se disuelve directamente en el estómago.',
    tags: ['Sin acidez en boca', 'Protege esmalte dental', 'Cubierta azul índigo'],
    img: '/marketing/quibi/quibi-front.jpg',
    imgTitle: 'Envase Original y Cápsulas con Relleno',
    chips: [
      { cls: 'c1', ico: '✨', title: '60 Cápsulas', sub: 'Suministro para 30 días' },
      { cls: 'c2', ico: '🍎', title: 'Vinagre + Té Verde', sub: 'Sinergia biológica' },
      { cls: 'c3', ico: '🚚', title: 'Pago Contra Entrega', sub: 'Cobertura nacional' },
    ],
  },
  {
    id: 'top-view',
    tone: 'rose',
    word: 'SACIEDAD',
    kicker: 'DOBLE ACCIÓN · DIGESTIÓN Y SACIEDAD',
    title: (
      <>
        Control natural del apetito con <em>Glucomanano</em> & Té Verde.
      </>
    ),
    sub: 'El glucomanano absorbe agua expandiendo una sensación de plenitud natural en el estómago, mientras los polifenoles del té verde optimizan el gasto energético y el metabolismo activo.',
    tags: ['Glucomanano Konjac', 'Té Verde EGCG', 'Alcachofa & Berenjena'],
    img: '/marketing/quibi/quibi-top-view.jpg',
    imgTitle: 'Detalle de Cápsulas Blandas Índigo',
    chips: [
      { cls: 'c1', ico: '🌱', title: 'Glucomanano', sub: 'Fibra saciante' },
      { cls: 'c2', ico: '⚡', title: 'Termogénesis', sub: 'Té Verde EGCG' },
      { cls: 'c3', ico: '🥛', title: 'Doble Perla', sub: '2 al día con agua' },
    ],
  },
  {
    id: 'nutrition',
    tone: 'plum',
    word: 'INVIMA',
    kicker: 'SEGURIDAD Y TRANSPARENCIA TOTAL',
    title: (
      <>
        Certificación Sanitaria <em>RSA-4113-2025</em> oficial.
      </>
    ),
    sub: 'Fabricado bajo estrictas Buenas Prácticas de Manufactura por ALIMENTOS MYC en Tona, Santander, exclusivamente para THERMIX. Alimento a base de gelatina con respaldo legal total.',
    tags: ['ALIMENTOS MYC', 'Tona, Santander', 'Código 7709026096235'],
    img: '/marketing/quibi/quibi-nutrition.jpg',
    imgTitle: 'Tabla Nutricional y Registro Invima',
    chips: [
      { cls: 'c1', ico: '📋', title: 'Invima Vigente', sub: 'RSA-4113-2025' },
      { cls: 'c2', ico: '🏭', title: 'Alimentos MYC', sub: 'Santander, Col' },
      { cls: 'c3', ico: '🔬', title: 'Control Calidad', sub: 'Lote verificado' },
    ],
  },
  {
    id: 'close',
    tone: 'ink',
    word: 'ACTIVOS',
    kicker: '12 COMPONENTES EN SINERGIA',
    title: (
      <>
        Nutrición botánica de <em>Alta Pureza</em> para tu día a día.
      </>
    ),
    sub: 'Alcachofa para la función hepática, Berenjena y Nasunina para drenaje lipídico, Spirulina rica en micronutrientes y Picolinato de Cromo para el equilibrio de la glucosa.',
    tags: ['Alcachofa + Berenjena', 'Picolinato de Cromo', 'Spirulina Natural'],
    img: '/marketing/quibi/quibi-close.jpg',
    imgTitle: 'Detalle de Marca Original QB',
    chips: [
      { cls: 'c1', ico: '🥬', title: 'Alcachofa & Cromo', sub: 'Salud hepática' },
      { cls: 'c2', ico: '🎯', title: 'Picolinato Cromo', sub: '40 mcg / porción' },
      { cls: 'c3', ico: '💙', title: 'Cápsula Blanda', sub: 'Fácil deglución' },
    ],
  },
];

// Stats row under the slider
const STATS = [
  { n: '60', l: 'Cápsulas blandas con relleno líquido', ico: '💊', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)' },
  { n: '0g', l: 'Azúcares añadidos · Solo 5 kcal', ico: '🌿', bg: '#ecfdf5', c: '#059669' },
  { n: 'RSA', l: 'Invima 4113-2025 Certificado', ico: '🛡️', bg: '#eff6ff', c: '#2b3a9e' },
  { n: '12', l: 'Componentes y extractos puros', ico: '✨', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)' },
];

// Marquee text
const MARQUEE_ITEMS = [
  'VINAGRE DE MANZANA CON RELLENO LÍQUIDO',
  'INVIMA RSA-4113-2025',
  'CERO AZÚCAR AÑADIDA',
  '60 CÁPSULAS BLANDAS',
  'GLUCOMANANO Y TÉ VERDE',
  'PAGO CONTRA ENTREGA EN TODA COLOMBIA',
  'ALIMENTOS MYC · THERMIX',
  'SABOR CERO ÁCIDO · CUIDA TUS DIENTES',
];

// 12 Functional Components styled exactly as WAPPY's Tools Grid (.intg .i .g) from Screenshot 4
const QUIBI_COMPONENTS = [
  {
    title: 'Vinagre de Cidra de Manzana',
    badge: 'Componente 1 · Digestión',
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V11a2 2 0 0 0-2 2v1a7 7 0 0 0 14 0v-1a2 2 0 0 0-2-2V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
  {
    title: 'Glucomanano Konjac',
    badge: 'Componente 2 · Saciedad',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="12 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: 'Té Verde (EGCG)',
    badge: 'Componente 3 · Termogénesis',
    badgeBg: '#DCFCE7',
    badgeColor: '#16A34A',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 4 13C4 8 8 3 13 3c4 0 7 3 7 7 0 5-4 10-9 10z" />
        <path d="M12 11c1.5 2 3 3.5 6 4" />
      </svg>
    ),
  },
  {
    title: 'Extracto de Alcachofa',
    badge: 'Componente 4 · Salud Hepática',
    badgeBg: '#CCFBF1',
    badgeColor: '#0D9488',
    iconBg: '#F0FDFA',
    iconColor: '#0D9488',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    ),
  },
  {
    title: 'Berenjena & Nasunina',
    badge: 'Componente 5 · Drenaje Lipídico',
    badgeBg: '#F3E8FF',
    badgeColor: '#7E22CE',
    iconBg: '#FAF5FF',
    iconColor: '#7E22CE',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: 'Spirulina Natural',
    badge: 'Componente 6 · Superalimento',
    badgeBg: '#E0F2FE',
    badgeColor: '#0284C7',
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: 'Picolinato de Cromo',
    badge: 'Componente 7 · Glucosa Estable',
    badgeBg: '#E0E7FF',
    badgeColor: '#4338CA',
    iconBg: '#EEF2FF',
    iconColor: '#4338CA',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <polyline points="12 9 12 12 13.5 13.5" />
        <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
      </svg>
    ),
  },
  {
    title: 'Aceite de Girasol Virgen',
    badge: 'Componente 8 · Vehículo Lipídico',
    badgeBg: '#FEF9C3',
    badgeColor: '#CA8A04',
    iconBg: '#FEFCE8',
    iconColor: '#CA8A04',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    title: 'Gelatina Blanda Pura',
    badge: 'Componente 9 · Protección Gástrica',
    badgeBg: '#FCE7F3',
    badgeColor: '#DB2777',
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Cero Azúcar Añadido',
    badge: '0g Azúcar · 5 Kcal/Porción',
    badgeBg: '#D1FAE5',
    badgeColor: '#059669',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: 'Invima RSA-4113-2025',
    badge: 'Certificación Sanitaria Colombia',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'ALIMENTOS MYC / THERMIX',
    badge: 'Tona, Santander · 100% Colombia',
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
    iconBg: '#F8FAFC',
    iconColor: '#475569',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

// Commercial Packages
const PACKAGES = [
  {
    id: '1-frasco',
    title: 'Tratamiento Inicial',
    quantity: '1 Frasco (60 Cápsulas)',
    duration: 'Suministro para 30 Días',
    price: '$79.900',
    originalPrice: '$95.000',
    discount: '15% OFF',
    shipping: 'Envío a convenir',
    featured: false,
    perks: [
      '1 Frasco original QB (60 cápsulas blandas con relleno líquido)',
      '0g Azúcar Añadido · Solo 5 kcal por porción',
      'Autorización Invima RSA-4113-2025',
      'Guía digital de toma y hábitos por WhatsApp',
    ],
    badge: 'IDEAL PARA PROBAR',
  },
  {
    id: '2-frascos',
    title: 'Plan Transformación',
    quantity: '2 Frascos (120 Cápsulas)',
    duration: 'Suministro para 60 Días',
    price: '$139.900',
    originalPrice: '$190.000',
    discount: '26% OFF',
    shipping: '¡ENVÍO GRATIS NACIONAL!',
    featured: true,
    perks: [
      '2 Frascos originales QB (120 cápsulas con relleno líquido)',
      'ENVÍO GRATIS a cualquier ciudad de Colombia',
      'Pago Contra Entrega en efectivo al recibir',
      'Ahorro instantáneo de $50.100',
      'Asesoría personalizada directa por WhatsApp',
    ],
    badge: 'MÁS VENDIDO · RECOMENDADO',
  },
  {
    id: '3-frascos',
    title: 'Plan Integral Familiar',
    quantity: '3 Frascos (180 Cápsulas)',
    duration: 'Suministro para 90 Días',
    price: '$189.900',
    originalPrice: '$285.000',
    discount: '33% OFF',
    shipping: '¡ENVÍO GRATIS NACIONAL!',
    featured: false,
    perks: [
      '3 Frascos originales QB (180 cápsulas con relleno líquido)',
      'ENVÍO GRATIS prioritario a nivel nacional',
      'Pago Contra Entrega en la puerta de tu casa',
      'Ahorro máximo de $95.100 en el pedido',
      'Soporte continuo de hábitos y saciedad',
    ],
    badge: 'MEJOR VALOR',
  },
];

// FAQs
const FAQS = [
  {
    q: '¿Son gomas o cápsulas?',
    a: 'Son CÁPSULAS BLANDAS de gelatina con RELLENO LÍQUIDO activo (softgels). No son gomas masticables con almidón ni azúcares añadidos. Su diseño encapsula el vinagre de cidra y el té verde en forma líquida pura, liberándolo directamente en el estómago sin dañar el esmalte dental ni dejar sabor ácido en la boca.',
  },
  {
    q: '¿Cómo se deben tomar las cápsulas QUIBI (QB)?',
    a: 'La dosis recomendada para adultos según la etiqueta oficial es de 2 cápsulas al día. Te sugerimos tomar 1 cápsula 20-30 minutos antes del almuerzo y 1 cápsula antes de la cena, siempre acompañadas con un vaso con agua (250 ml). El agua permite que el glucomanano expanda su efecto de saciedad.',
  },
  {
    q: '¿Tienen azúcar o rompen el ayuno intermitente?',
    a: '¡CERO azúcar añadido! Cada porción aporta 0g de azúcares y únicamente 5 calorías provenientes de la gelatina y activos vegetales. Son 100% aptas para estilo de vida bajo en carbohidratos, dietas keto y regímenes saludables.',
  },
  {
    q: '¿Por qué las cápsulas con relleno líquido son superiores al vinagre líquido tradicional?',
    a: 'El vinagre líquido en botella tiene un sabor sumamente ácido que irrita la garganta, desgasta irreversiblemente el esmalte dental y puede generar reflujo. Las cápsulas Quibi resguardan el activo en una perla de gelatina blanda que llega intacta a tu estómago, liberando sus propiedades sin quemar ni causar acidez.',
  },
  {
    q: '¿Cuentan con registro oficial Invima en Colombia?',
    a: 'Sí. QUIBI cuenta con Autorización Sanitaria Invima RSA-4113-2025 bajo la categoría de alimento a base de gelatina con relleno líquido. Es fabricado con rigurosos estándares de calidad por ALIMENTOS MYC en Tona, Santander, para THERMIX.',
  },
  {
    q: '¿Cómo funciona el envío y el pago contra entrega?',
    a: 'Enviamos a cualquier ciudad o municipio de Colombia a través de transportadoras aliadas (Servientrega, Envía, Inter Rapidísimo). Puedes pagar en efectivo cuando el mensajero te entregue el producto en la puerta de tu casa o trabajo.',
  },
];

export default function QuibiPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPackage, setSelectedPackage] = useState('2-frascos');

  // Order form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPaymentMethod, setClientPaymentMethod] = useState('Contra Entrega (Efectivo al recibir)');
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);

  // Auto-rotate hero slider every 6.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const scrollToSection = (e: React.MouseEvent | null, id: string) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 85;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleWhatsAppContact = (pkgId?: string) => {
    const pkg = PACKAGES.find((p) => p.id === (pkgId || selectedPackage)) || PACKAGES[1];
    const text = `¡Hola Thermix! 👋 Estoy interesado en ordenar las cápsulas originales de vinagre de manzana QUIBI (QB) con relleno líquido.\n\n📦 Paquete: ${pkg.title} - ${pkg.quantity}\n💰 Precio: ${pkg.price}\n🚚 Envío: ${pkg.shipping}\n\n¿Me pueden confirmar disponibilidad y toma de pedido? Muchas gracias.`;
    window.open(`https://wa.me/573054656064?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientCity.trim() || !clientAddress.trim()) {
      alert('Por favor completa todos los campos para generar tu pedido.');
      return;
    }

    const pkg = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[1];
    const orderDetails = `*NUEVO PEDIDO QUIBI (QB) EN LÍNEA*\n\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📱 *Teléfono:* ${clientPhone}\n` +
      `📍 *Ciudad:* ${clientCity}\n` +
      `🏠 *Dirección:* ${clientAddress}\n\n` +
      `📦 *Paquete Seleccionado:* ${pkg.title} (${pkg.quantity})\n` +
      `💵 *Total:* ${pkg.price} (${pkg.shipping})\n` +
      `💳 *Forma de Pago:* ${clientPaymentMethod}\n\n` +
      `_Pedido generado desde la landing oficial /quibi_`;

    setIsOrderSubmitted(true);

    setTimeout(() => {
      window.open(`https://wa.me/573054656064?text=${encodeURIComponent(orderDetails)}`, '_blank');
    }, 300);
  };

  const activeSlideData = SLIDES[currentSlide];

  return (
    <div className="mkt qbx">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="mkt-mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Capsule Navbar (Exact WAPPY style, authentic QB colors) */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          {/* Brand Logo: Clean icon + QUIBI */}
          <a
            className="mkt-nav-logo"
            aria-label="QUIBI - Cápsulas con Relleno Líquido"
            href="#inicio"
            onClick={(e) => scrollToSection(e, 'inicio')}
          >
            <div className="qb-logo-badge">
              QB
            </div>
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">QUIBI<span style={{ color: 'var(--qb-pink)' }}>.co</span></span>
              <span className="mkt-logo-sub">NUTRICIÓN VITAL</span>
            </div>
          </a>

          {/* Clean, Useful Nav Links */}
          <div className="mkt-nav-links">
            <a href="#capsulas" onClick={(e) => scrollToSection(e, 'capsulas')}>Cápsulas</a>
            <a href="#componentes" onClick={(e) => scrollToSection(e, 'componentes')}>Componentes</a>
            <a href="#video" onClick={(e) => scrollToSection(e, 'video')}>Video</a>
            <a href="#nutricion" onClick={(e) => scrollToSection(e, 'nutricion')}>Nutrición & Invima</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')}>Precios</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a>
          </div>

          {/* Nav CTAs */}
          <div className="mkt-nav-cta">
            <a
              href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20información%20sobre%20las%20cápsulas%20QUIBI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mkt-nav-signin"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              WhatsApp
            </a>

            <button
              type="button"
              className="btn btn-lime btn-sm"
              onClick={() => scrollToSection(null, 'precios')}
            >
              Pedir Ahora
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className={`mkt-hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <span className="mkt-hamburger-bar" />
              <span className="mkt-hamburger-bar" />
              <span className="mkt-hamburger-bar" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="mkt-mobile-menu-drawer">
            <div className="mkt-mobile-menu-links">
              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'inicio')}>
                <span className="mkt-mobile-link-icon">🏠</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Inicio</span>
                  <span className="mkt-mobile-link-desc">Cápsulas blandas con relleno líquido activo</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'capsulas')}>
                <span className="mkt-mobile-link-icon">💊</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Cápsula Blanda</span>
                  <span className="mkt-mobile-link-desc">Tecnología vs vinagre líquido o gomas</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'componentes')}>
                <span className="mkt-mobile-link-icon">🌿</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Componentes</span>
                  <span className="mkt-mobile-link-desc">12 Activos de alta concentración biológica</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'video')}>
                <span className="mkt-mobile-link-icon">📹</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Video de Acción</span>
                  <span className="mkt-mobile-link-desc">Absorción y liberación gástrica en vivo</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'nutricion')}>
                <span className="mkt-mobile-link-icon">📊</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Nutrición & Invima</span>
                  <span className="mkt-mobile-link-desc">0% Azúcar · Registro Invima RSA-4113-2025</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'precios')}>
                <span className="mkt-mobile-link-icon">🏷️</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Ofertas & Precios</span>
                  <span className="mkt-mobile-link-desc">Desde 1 hasta 3 frascos con envío gratis</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'faq')}>
                <span className="mkt-mobile-link-icon">❓</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">FAQ</span>
                  <span className="mkt-mobile-link-desc">Dudas frecuentes sobre toma y despacho</span>
                </div>
              </button>
            </div>

            <div className="mkt-mobile-menu-divider" />

            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setIsMobileMenuOpen(false); scrollToSection(null, 'precios'); }}
              >
                Pedir con Descuento de Lanzamiento
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* =====================================================================
          HERO SLIDER SECTION (High Design, 5 Authentic Product Image Slides)
          ===================================================================== */}
      <header id="inicio" className="qb-hero">
        <div className="wrap">
          {/* Main Interactive Slider */}
          <div 
            className={`qb-slider ${isPaused ? 'paused' : ''}`}
            data-tone={activeSlideData.tone}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {SLIDES.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`qb-slide qb-tone-${slide.tone} ${isActive ? 'active' : ''}`}
                  aria-hidden={!isActive}
                >
                  {/* Giant Outline Word Watermark */}
                  <div className="qb-slide-word">{slide.word}</div>

                  {/* Floating CSS Indigo Softgels */}
                  <div className="qb-pill" style={{ top: '14%', right: '48%', transform: 'rotate(-18deg)' }} />
                  <div className="qb-pill" style={{ bottom: '16%', left: '42%', transform: 'rotate(24deg)', animationDelay: '-3s' }} />

                  {/* Slide Left Copy */}
                  <div className="qb-slide-copy">
                    <div className="qb-kicker qb-in" style={{ '--d': '0.05s' } as React.CSSProperties}>
                      <span className="dot" />
                      <span>{slide.kicker}</span>
                    </div>

                    <h1 className="qb-in" style={{ '--d': '0.15s' } as React.CSSProperties}>
                      {slide.title}
                    </h1>

                    <p className="qb-slide-sub qb-in" style={{ '--d': '0.25s' } as React.CSSProperties}>
                      {slide.sub}
                    </p>

                    <div className="qb-slide-cta qb-in" style={{ '--d': '0.35s' } as React.CSSProperties}>
                      <button 
                        type="button" 
                        className="btn btn-lime"
                        onClick={() => scrollToSection(null, 'precios')}
                      >
                        Pedir Oferta de Lanzamiento
                        <span className="pip">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      </button>

                      <a
                        href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20ordenar%20las%20cápsulas%20QUIBI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-glass"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Pedir por WhatsApp (305 4656064)
                      </a>
                    </div>

                    <div className="qb-slide-tags qb-in" style={{ '--d': '0.45s' } as React.CSSProperties}>
                      {slide.tags.map((tag, tidx) => (
                        <span key={tidx}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Slide Right Media with Authentic Product Photo & Floating Chips */}
                  <div className="qb-slide-media">
                    <div className="qb-glow" />
                    
                    <div 
                      className="qb-frame"
                      onClick={() => setLightboxImg(slide.img)}
                      title="Clic para ampliar imagen oficial"
                    >
                      <img src={slide.img} alt={slide.imgTitle} />
                    </div>

                    {/* Floating Product Badges */}
                    {slide.chips.map((chip, cidx) => (
                      <div key={cidx} className={`qb-chip ${chip.cls}`}>
                        <span className="qb-chip-ico">{chip.ico}</span>
                        <div>
                          {chip.title}
                          <small>{chip.sub}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Slider Navigation Bar: Counter, Progress Dots, Next/Prev Arrows */}
            <div className="qb-slider-ui">
              <div className="qb-count">
                <b>0{currentSlide + 1}</b> / 0{SLIDES.length}
              </div>

              <div className="qb-dots">
                {SLIDES.map((_, didx) => {
                  const isDone = didx < currentSlide;
                  const isCurrent = didx === currentSlide;
                  return (
                    <button
                      key={didx}
                      type="button"
                      className={`qb-dot ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
                      onClick={() => setCurrentSlide(didx)}
                      aria-label={`Ir al slide ${didx + 1}`}
                    >
                      <span />
                    </button>
                  );
                })}
              </div>

              <div className="qb-arrows">
                <button
                  type="button"
                  className="qb-arrow"
                  onClick={prevSlide}
                  aria-label="Slide anterior"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="qb-arrow"
                  onClick={nextSlide}
                  aria-label="Slide siguiente"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Quick Value Stats Under Slider */}
          <div className="qb-stats">
            {STATS.map((stat, sidx) => (
              <div key={sidx} className="qb-stat">
                <div className="qb-stat-ico" style={{ background: stat.bg, color: stat.c }}>
                  <span style={{ fontSize: 22 }}>{stat.ico}</span>
                </div>
                <div>
                  <div className="qb-stat-n">{stat.n}</div>
                  <div className="qb-stat-l">{stat.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Banner */}
        <div className="qb-marquee">
          <div className="qb-marquee-track">
            {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, midx) => (
              <span key={midx} className="qb-marquee-item">
                <i />
                {item}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECTION 2: POR QUÉ CÁPSULAS BLANDAS VS VINAGRE LÍQUIDO O GOMAS
          ===================================================================== */}
      <section id="capsulas" className="band">
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>INNOVACIÓN GALÉNICA</span>
            </div>
            <h2 className="display">
              ¿Por qué Cápsulas Blandas y NO Vinagre Líquido ni Gomitas?
            </h2>
            <p>
              El vinagre tradicional en shot daña el esmalte dental y quema la garganta. 
              Las gomitas dulces comerciales contienen hasta 4 gramos de azúcar o jarabe por porción. 
              QUIBI inventó el punto perfecto: extracto botánico puro con <strong>centro líquido activo</strong> y cero azúcar.
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="qb-vs" style={{ maxWidth: 960, margin: '0 auto' }}>
            <div className="qb-vs-card qb-vs-bad">
              <h4>❌ Vinagre Líquido Tradicional & Gomitas</h4>
              <ul>
                <li><span>•</span> Acidez corrosiva que desgasta irreversiblemente el esmalte dental.</li>
                <li><span>•</span> Sabor avinagrado insoportable que produce reflujo y ardor esofágico.</li>
                <li><span>•</span> Las gomitas contienen almidón, glucosa o azúcares añadidos que rompen el ayuno.</li>
                <li><span>•</span> Menor absorción metabólica por degradación enzimática salival.</li>
              </ul>
            </div>

            <div className="qb-vs-card qb-vs-good">
              <h4>✅ Cápsulas Blandas QUIBI con Relleno Líquido</h4>
              <ul>
                <li><span>•</span> Cubierta de gelatina blanda suave color índigo: pasa directo sin tocar tus dientes.</li>
                <li><span>•</span> Se disuelve en el estómago, liberando el vinagre y té verde en segundos.</li>
                <li><span>•</span> 0% azúcar añadida y solo 5 calorías por porción: 100% keto y ayuno friendly.</li>
                <li><span>•</span> Concentrado biológico potenciado con Glucomanano, Alcachofa, Berenjena y Cromo.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: 12 COMPONENTES CIENTÍFICOS (EXACT WAPPY Tools Grid .intg .i .g)
          ===================================================================== */}
      <section id="componentes" className="band">
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>FORMULACIÓN CIENTÍFICA</span>
            </div>
            <h2 className="display">
              12 Componentes y Activos de Alta Concentración
            </h2>
            <p>
              Diseñados con el rigor de los estándares de salud y nutrición celular. 
              Cada cápsula blanda integra extractos botánicos puros que trabajan en perfecta sinergia biológica para tu metabolismo, saciedad y ligereza.
            </p>
          </div>

          {/* EXACT WAPPY Tools Grid Layout from Screenshot 4 */}
          <div className="intg">
            {QUIBI_COMPONENTS.map((item, idx) => (
              <div key={idx} className="i" style={{ cursor: 'pointer' }}>
                <span className="g" style={{ background: item.iconBg, color: item.iconColor }}>
                  {item.svg}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, color: item.badgeColor, background: item.badgeBg, padding: '2px 6px', borderRadius: 9999 }}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: PASOS DE ACCIÓN METABÓLICA (.qb-steps)
          ===================================================================== */}
      <section className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>MODO DE USO & RESULTADOS</span>
            </div>
            <h2 className="display">¿Cómo Funciona en tu Organismo?</h2>
            <p>
              Una rutina simple de 2 cápsulas al día que transforma tu relación con la comida y la digestión.
            </p>
          </div>

          <div className="qb-steps">
            <div className="qb-step">
              <div className="qb-step-n">01</div>
              <div className="qb-step-ico" style={{ background: 'var(--qb-pink-soft)', color: 'var(--qb-plum)' }}>
                💧
              </div>
              <h3>1 Cápsula con 250ml de Agua</h3>
              <p>
                Toma 1 cápsula blanda 20 a 30 minutos antes del almuerzo y 1 antes de la cena con un vaso lleno de agua. El agua activa la hidratación del glucomanano.
              </p>
            </div>

            <div className="qb-step">
              <div className="qb-step-n">02</div>
              <div className="qb-step-ico" style={{ background: '#ecfdf5', color: '#059669' }}>
                ⚡
              </div>
              <h3>Liberación Gástrica Inmediata</h3>
              <p>
                Al llegar al estómago, la perla de gelatina libera el núcleo líquido concentrado de vinagre de manzana y té verde sin quemar garganta ni dañar el esmalte dental.
              </p>
            </div>

            <div className="qb-step lime">
              <div className="qb-step-n">03</div>
              <div className="qb-step-ico" style={{ background: '#fff', color: 'var(--qb-plum)' }}>
                ✨
              </div>
              <h3>Saciedad y Digestión Ligera</h3>
              <p>
                El glucomanano expande una sensación de plenitud que frena los picos de ansiedad, mientras la alcachofa y el cromo equilibran la glucosa postprandial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: VIDEO EN VIVO (EXACT WAPPY Video Section style from Screenshot 5)
          ===================================================================== */}
      <section id="video" className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" style={{ background: '#EF4444' }} />
              <span>ACCIÓN BIOLÓGICA EN VIVO</span>
            </div>
            <h2 className="display">
              Absorción Inmediata y Liberación del Núcleo Líquido
            </h2>
            <p>
              A diferencia de las cápsulas duras o gomas secas que tardan en digerirse, 
              la cubierta de gelatina de QUIBI resguarda un centro líquido de vinagre de sidra y té verde. 
              Al hacer contacto con los jugos gástricos, el activo se libera al 100%, 
              activando la digestión ligera sin tocar tu boca ni tus dientes.
            </p>
          </div>

          {/* Video Action Toolbar (Screenshot 5 exact style) */}
          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }} />
                Liberación Activa · Relleno Líquido
              </span>
              <span className="vid-tech-pill">
                Doble Acción · Softgel + Centro Activo
              </span>
            </div>

            <div className="vid-control-right">
              <button
                type="button"
                className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(false)}
              >
                🖼️ Demostración Fotográfica
              </button>
              <button
                type="button"
                className={`vid-toggle-btn ${showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(true)}
              >
                ▶️ Video en Vivo
              </button>
              <a
                href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20ver%20videos%20demostrativos%20de%20QUIBI"
                target="_blank"
                rel="noopener noreferrer"
                className="vid-ext-link"
                title="Consultar demostración por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Video ↗
              </a>
            </div>
          </div>

          {/* Video Shell */}
          <div className={`vid-shell ${showVideo ? 'vid-vertical-mode' : 'vid-poster-mode'}`}>
            {!showVideo ? (
              <div
                className="qb-poster"
                onClick={() => setShowVideo(true)}
                title="Clic para reproducir demostración"
              >
                <img
                  src="/marketing/quibi/quibi-3-bottles.jpg"
                  alt="Envase y Cápsulas Oficiales QUIBI"
                  className="vid-poster-img"
                />

                <div className="qb-poster-shade" />

                <div className="qb-poster-copy">
                  <span className="vid-live-pill" style={{ background: 'rgba(246, 168, 205, 0.25)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                    Acción Rápida
                  </span>
                  <h3>Disolución Gástrica del Núcleo Líquido</h3>
                  <p>
                    Observa la rapidez con la que se libera el vinagre puro y el té verde al entrar en contacto con el ambiente digestivo.
                  </p>
                </div>

                <div className="qb-play">
                  <Play className="w-9 h-9 fill-current ml-1" />
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: 24, overflow: 'hidden' }}>
                <video
                  src="/marketing/wappy-motion.mp4"
                  autoPlay
                  controls
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: BENTO GALLERY (5 Authentic Manufactured Photos)
          ===================================================================== */}
      <section className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>FOTOGRAFÍA REAL DE PRODUCTO</span>
            </div>
            <h2 className="display">Conoce QUIBI desde Todos sus Ángulos</h2>
            <p>
              Envase de 60 unidades, cápsulas con relleno líquido y empaque original fabricado para THERMIX.
            </p>
          </div>

          <div className="qb-bento">
            <button
              type="button"
              className="qb-bento-item"
              onClick={() => setLightboxImg('/marketing/quibi/quibi-3-bottles.jpg')}
              title="Ampliar vista del envase"
            >
              <img src="/marketing/quibi/quibi-3-bottles.jpg" alt="Presentación oficial QUIBI" />
              <div className="qb-bento-cap">
                Presentación Oficial Frasco 60 Cápsulas
                <small>Envase con sello de seguridad e información oficial</small>
              </div>
            </button>

            <button
              type="button"
              className="qb-bento-item"
              onClick={() => setLightboxImg('/marketing/quibi/quibi-front.jpg')}
              title="Ampliar cápsulas y frasco"
            >
              <img src="/marketing/quibi/quibi-front.jpg" alt="Cápsulas y envase frontal" />
              <div className="qb-bento-cap">
                Cápsulas Blandas Azul Índigo
                <small>Suaves al tragar con relleno líquido interno</small>
              </div>
            </button>

            <button
              type="button"
              className="qb-bento-item"
              onClick={() => setLightboxImg('/marketing/quibi/quibi-top-view.jpg')}
              title="Ampliar vista superior"
            >
              <img src="/marketing/quibi/quibi-top-view.jpg" alt="Vista superior cápsulas" />
              <div className="qb-bento-cap">
                Perlas con Centro Líquido
                <small>60 unidades por envase sellado</small>
              </div>
            </button>

            <button
              type="button"
              className="qb-bento-item"
              onClick={() => setLightboxImg('/marketing/quibi/quibi-nutrition.jpg')}
              title="Ampliar tabla nutricional"
            >
              <img src="/marketing/quibi/quibi-nutrition.jpg" alt="Tabla nutricional oficial" />
              <div className="qb-bento-cap">
                Etiqueta Invima RSA-4113-2025
                <small>0g Azúcares añadidos · Solo 5 kcal por porción</small>
              </div>
            </button>

            <button
              type="button"
              className="qb-bento-item"
              onClick={() => setLightboxImg('/marketing/quibi/quibi-close.jpg')}
              title="Ampliar detalle de marca"
            >
              <img src="/marketing/quibi/quibi-close.jpg" alt="Detalle de marca QB" />
              <div className="qb-bento-cap">
                Sello Original QB
                <small>Garantía de autenticidad THERMIX</small>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7: TABLA NUTRICIONAL OFICIAL & REGISTRO INVIMA
          ===================================================================== */}
      <section id="nutricion" className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" style={{ background: '#10b981' }} />
              <span>TRANSPARENCIA TOTAL</span>
            </div>
            <h2 className="display">
              Información Nutricional Oficial y Registro Invima
            </h2>
            <p>
              Etiqueta oficial aprobada en Colombia. Sin ingredientes ocultos, sin azúcares y con certificación de laboratorio ALIMENTOS MYC.
            </p>
          </div>

          <div className="qb-nutri">
            {/* Nutrition Table Card */}
            <div className="qb-table-card">
              <div className="qb-table-head">
                <div>
                  <h3>Información Nutricional</h3>
                  <span>Porción: 1 Cápsula con relleno (2g)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', opacity: 0.8 }}>Porciones</span>
                  <b>60</b>
                </div>
              </div>

              <table className="qb-table">
                <thead>
                  <tr>
                    <th>Nutriente</th>
                    <th>Por 100g</th>
                    <th>Por porción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hl">
                    <td><strong>Calorías (kcal)</strong></td>
                    <td>240</td>
                    <td><strong style={{ color: '#059669' }}>5 kcal</strong></td>
                  </tr>
                  <tr>
                    <td>Grasa total</td>
                    <td>0 g</td>
                    <td>0 g</td>
                  </tr>
                  <tr>
                    <td>Carbohidratos totales</td>
                    <td>25 g</td>
                    <td>0.1 g</td>
                  </tr>
                  <tr className="hl">
                    <td>Azúcares totales</td>
                    <td>0 g</td>
                    <td><strong style={{ color: '#059669' }}>0 g</strong></td>
                  </tr>
                  <tr className="hl">
                    <td>Azúcares Añadidos</td>
                    <td>0 g</td>
                    <td><strong style={{ color: '#059669' }}>0 g</strong></td>
                  </tr>
                  <tr>
                    <td>Proteína pura</td>
                    <td>35 g</td>
                    <td><strong>0.7 g</strong></td>
                  </tr>
                  <tr>
                    <td>Sodio</td>
                    <td>0 mg</td>
                    <td>0 mg</td>
                  </tr>
                  <tr className="hl">
                    <td><strong>Picolinato de Cromo</strong></td>
                    <td>2.000 mcg</td>
                    <td><strong style={{ color: 'var(--qb-indigo)' }}>40 mcg</strong></td>
                  </tr>
                </tbody>
              </table>

              <div className="qb-table-foot">
                * Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. No es fuente significativa de hierro y calcio.
              </div>
            </div>

            {/* Certificate Card and Ingredients */}
            <div className="qb-cert">
              <div className="qb-cert-card">
                <span className="vid-live-pill" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.25)' }}>
                  Certificación Sanitaria
                </span>
                <div className="qb-cert-code">RSA-4113-2025</div>

                <div className="qb-cert-rows">
                  <div>
                    <span>Tipo:</span>
                    <b>Alimento a base de gelatina con relleno líquido</b>
                  </div>
                  <div>
                    <span>Fabricante:</span>
                    <b>ALIMENTOS MYC</b>
                  </div>
                  <div>
                    <span>Ubicación:</span>
                    <b>Vereda Ucata Granja El Paraíso, Tona, Santander</b>
                  </div>
                  <div>
                    <span>Distribución:</span>
                    <b>Exclusivo para THERMIX</b>
                  </div>
                  <div>
                    <span>Código de Barras:</span>
                    <b>7709026096235</b>
                  </div>
                </div>
              </div>

              {/* Complete Declared Ingredients */}
              <div className="qb-ingr">
                <h4>Ingredientes Declarados en Etiqueta Oficial:</h4>
                <div className="qb-ingr-tags">
                  <span className="key">Gelatina polvo</span>
                  <span className="key">Vinagre de cidra de Manzana</span>
                  <span className="key">Té verde (EGCG)</span>
                  <span className="key">Glucomanano</span>
                  <span>Alcachofa</span>
                  <span>Berenjena</span>
                  <span>Spirulina</span>
                  <span>Picolinato de Cromo</span>
                  <span>Aceite de Girasol</span>
                  <span>Agua</span>
                  <span>Sorbato de potasio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 8: PRECIOS & PAQUETES COMERCIALES
          ===================================================================== */}
      <section id="precios" className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>OFERTAS DE LANZAMIENTO</span>
            </div>
            <h2 className="display">
              Elige tu Paquete de Tratamiento QUIBI
            </h2>
            <p>
              Tarifas especiales con descuento directo y cobertura nacional. Paga en efectivo al recibir en tu puerta.
            </p>
          </div>

          <div className="price" style={{ maxWidth: 1060, margin: '0 auto' }}>
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <div 
                  key={pkg.id} 
                  className={`pcard qb-pcard ${pkg.featured ? 'feat feat-plan' : ''} ${isSelected ? 'qb-selected' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.badge && (
                    <span className="ptag pbadge">
                      {pkg.badge}
                    </span>
                  )}

                  <h3 className="pname">{pkg.title}</h3>
                  <div className="qb-pqty">{pkg.quantity} · {pkg.duration}</div>

                  <div className="pnum" style={{ margin: '18px 0 14px' }}>
                    <div className="qb-pold">
                      <s>{pkg.originalPrice}</s>
                      <em>{pkg.discount}</em>
                    </div>
                    <span style={{ fontSize: 36, fontWeight: 900 }}>{pkg.price}</span>
                    <div className="ptrial" style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700 }}>
                      {pkg.shipping}
                    </div>
                  </div>

                  <ul className="pfeats" style={{ flexGrow: 1, marginBottom: 24 }}>
                    {pkg.perks.map((perk, pidx) => (
                      <li key={pidx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, marginBottom: 10 }}>
                        <span className="pck" style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={pkg.featured ? 'btn btn-lime' : 'btn btn-glass'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg.id);
                      scrollToSection(null, 'formulario-pedido');
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Seleccionar {pkg.title}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Order Form Box */}
          <div id="formulario-pedido" className="qb-order" style={{ maxWidth: 940, margin: '48px auto 0' }}>
            {/* Form Left Side: Package summary */}
            <div className="qb-order-side">
              <span className="vid-live-pill" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.25)', alignSelf: 'flex-start' }}>
                🚚 PAGO CONTRA ENTREGA
              </span>

              <h3>Despacho Inmediato a tu Dirección</h3>

              <div className="qb-order-sum">
                <small>Paquete Seleccionado:</small>
                <b>{PACKAGES.find((p) => p.id === selectedPackage)?.title}</b>
                <span style={{ fontSize: 12, opacity: 0.85 }}>{PACKAGES.find((p) => p.id === selectedPackage)?.quantity}</span>
                <span className="price">{PACKAGES.find((p) => p.id === selectedPackage)?.price}</span>
              </div>

              <ul className="qb-order-perks">
                <li>
                  <span>✓</span>
                  <div>Pagas en efectivo al recibir el paquete</div>
                </li>
                <li>
                  <span>✓</span>
                  <div>Envío asegurado por transportadora aliada</div>
                </li>
                <li>
                  <span>✓</span>
                  <div>Confirmación de guía vía WhatsApp</div>
                </li>
              </ul>
            </div>

            {/* Form Right Side: Inputs */}
            <div className="qb-order-form">
              {isOrderSubmitted ? (
                <div className="qb-ok">
                  <div className="qb-ok-ico">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h4>¡Pedido Generado Exitosamente!</h4>
                  <p>
                    Se ha enviado tu orden hacia la línea oficial de despacho de THERMIX en WhatsApp.
                  </p>
                  <button
                    type="button"
                    className="btn btn-lime"
                    onClick={() => handleWhatsAppContact()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir WhatsApp para Confirmar Despacho
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit}>
                  {/* Package Quick Switch Buttons */}
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>
                    CAMBIAR PAQUETE:
                  </label>
                  <div className="qb-pkg-switch">
                    {PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        className={selectedPackage === pkg.id ? 'on' : ''}
                        onClick={() => setSelectedPackage(pkg.id)}
                      >
                        {pkg.title}
                        <small>{pkg.price}</small>
                      </button>
                    ))}
                  </div>

                  <div className="qb-fields">
                    <div className="qb-field">
                      <label>Nombre y Apellido *</label>
                      <input
                        type="text"
                        placeholder="Ej. Carolina Montoya"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field">
                      <label>Teléfono / WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="Ej. 310 123 4567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field">
                      <label>Ciudad y Departamento *</label>
                      <input
                        type="text"
                        placeholder="Ej. Medellín, Antioquia"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field">
                      <label>Dirección de Entrega *</label>
                      <input
                        type="text"
                        placeholder="Ej. Calle 10 # 45-20 Apto 301"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field full">
                      <label>Método de Pago</label>
                      <select
                        value={clientPaymentMethod}
                        onChange={(e) => setClientPaymentMethod(e.target.value)}
                      >
                        <option value="Contra Entrega (Efectivo al recibir)">
                          💵 Contra Entrega (Pagas en efectivo al recibir en tu puerta)
                        </option>
                        <option value="Transferencia Bancolombia / Nequi anticipada">
                          📱 Transferencia Bancolombia / Nequi antes del envío
                        </option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lime"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: 14, fontSize: 15 }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Confirmar Pedido y Despachar por WhatsApp</span>
                  </button>

                  <p className="qb-form-note">
                    🔒 Tus datos están protegidos. No solicitamos tarjetas de crédito en la página.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 9: PREGUNTAS FRECUENTES (FAQ)
          ===================================================================== */}
      <section id="faq" className="band" style={{ paddingTop: 30 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>RESOLVEMOS TUS DUDAS</span>
            </div>
            <h2 className="display">Preguntas Frecuentes sobre QUIBI</h2>
            <p>
              Todo lo que necesitas saber sobre las cápsulas con relleno líquido, registro Invima, modo de uso y despacho contra entrega.
            </p>
          </div>

          <div className="faq">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`qa ${openFaq === idx ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                >
                  {faq.q}
                  <span className="q-ico">+</span>
                </button>
                <div className="a">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          LIGHTBOX MODAL FOR REAL PRODUCT PHOTOS
          ===================================================================== */}
      {lightboxImg && (
        <div className="qb-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            aria-label="Cerrar imagen"
          >
            ✕
          </button>
          <img 
            src={lightboxImg} 
            alt="Detalle oficial del producto real Quibi" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* =====================================================================
          STICKY MOBILE BAR (Fixed conversion bar on phones)
          ===================================================================== */}
      <div className="qb-sticky">
        <div>
          <b>QUIBI (QB) · Pago Contra Entrega</b>
          <small>Desde $79.900 · 60 Cápsulas</small>
        </div>
        <button
          type="button"
          className="btn btn-lime btn-sm"
          onClick={() => scrollToSection(null, 'precios')}
        >
          Pedir Ahora
        </button>
      </div>

      {/* =====================================================================
          FOOTER: EXACT WAPPY FOOTER STRUCTURE FROM SCREENSHOT 1
          ===================================================================== */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }} />
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }} />

        <div className="wrap">
          <div className="foot-cta">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <div className="qb-logo-badge lg">
                QB
              </div>
              <span style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>
                QUIBI<span style={{ color: 'var(--qb-pink)' }}>.co</span>
              </span>
            </div>
            <h3 className="display">Tu bienestar metabólico y digestivo empieza hoy.</h3>
            <p>
              Ordena hoy tus cápsulas originales de vinagre de manzana con relleno líquido. Cobertura nacional con pago contra entrega en toda Colombia.
            </p>
            <div className="hero-cta" style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-lime" onClick={() => scrollToSection(null, 'precios')}>
                Pedir con Descuento
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
              <a
                href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20ordenar%20las%20cápsulas%20QUIBI"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glass"
              >
                <MessageCircle className="w-4 h-4" />
                Pedir por WhatsApp (305 4656064)
              </a>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div className="qb-logo-badge">
                  QB
                </div>
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                  QUIBI<span style={{ color: 'var(--qb-pink)' }}>.co</span>
                </span>
              </div>
              <p className="foot-desc">
                Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. Formulado con Glucomanano, Alcachofa, Berenjena, Spirulina y Picolinato de Cromo. Registro Invima RSA-4113-2025. Fabricado por ALIMENTOS MYC (Tona, Santander) para THERMIX.
              </p>
            </div>
          </div>

          {/* Giant Outline Text Watermark (Screenshot 1 exact style) */}
          <div className="foot-word">QUIBI</div>

          <div className="foot-bottom">
            <span>© 2026 THERMIX · ALIMENTOS MYC · Medellín / Santander, Colombia. Todos los derechos reservados.</span>
            <div className="foot-legal">
              <a href="#precios">Precios</a>
              <a href="#nutricion">Invima RSA-4113-2025</a>
              <a href="#faq">Preguntas Frecuentes</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
