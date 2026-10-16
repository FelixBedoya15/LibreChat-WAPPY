import React, { useState, useEffect } from 'react';
import {
  Check,
  ShieldCheck,
  MessageCircle,
  ShoppingBag,
  ShoppingCart,
  X,
  Truck,
  ArrowRight,
  ArrowLeft,
  Play,
  CreditCard,
  Lock,
  Plus,
  Minus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import './marketing.css';
import './quibi.css';

// ============================================================================
// 5 AUTHENTIC MANUFACTURED PRODUCT SLIDES (Hero Showcase)
// ============================================================================
const SLIDES = [
  {
    id: 'front',
    tone: 'plum',
    word: 'QUIBI',
    kicker: 'CÁPSULAS BLANDAS CON RELLENO LÍQUIDO · INVIMA RSA-4113-2025',
    title: (
      <>
        El poder del <em>Vinagre de Manzana</em> sin quemar tu garganta.
      </>
    ),
    sub: 'Cápsulas blandas de gelatina con centro líquido activo de vinagre de cidra y té verde. Se liberan en el estómago cuidando tu esmalte dental, con 0g de azúcar.',
    img: '/marketing/quibi/quibi-front.jpg',
    imgTitle: 'Envase Original QUIBI (QB) · 60 Cápsulas Blandas',
    contain: false,
    chips: [
      { cls: 'c1', ico: '💧', title: 'Relleno Líquido', sub: 'Absorción gástrica' },
      { cls: 'c2', ico: '🛡️', title: 'Invima Oficial', sub: 'RSA-4113-2025' },
    ],
  },
  {
    id: '3-bottles',
    tone: 'indigo',
    word: 'SOFTGEL',
    kicker: 'FÓRMULA SINÉRGICA CON 5 ACTIVOS PRINCIPALES',
    title: (
      <>
        Vinagre de Manzana, <em>Té Verde</em>, Glucomanano, Alcachofa y Cromo.
      </>
    ),
    sub: 'Presentación oficial de 60 unidades (30 días de suministro). Diseñadas para apoyar la saciedad natural, el metabolismo lipídico y la digestión ligera.',
    img: '/marketing/quibi/quibi-3-bottles.jpg',
    imgTitle: 'Presentación Oficial QUIBI (QB) en Tres Ángulos',
    contain: true,
    chips: [
      { cls: 'c1', ico: '🌿', title: '0g Azúcar', sub: 'Solo 5 kcal / cápsula' },
      { cls: 'c2', ico: '⚡', title: '60 Unidades', sub: 'Tratamiento 30 días' },
    ],
  },
  {
    id: 'top-view',
    tone: 'rose',
    word: 'SACIEDAD',
    kicker: 'CONTROL DE APETITO Y DIGESTIÓN LIGERA',
    title: (
      <>
        Perlas suaves fáciles de pasar con <em>Efecto Saciante</em>.
      </>
    ),
    sub: 'Al tomarse con agua antes de tus comidas principales, el glucomanano se hidrata generando plenitud natural mientras los polifenoles activan la termogénesis.',
    img: '/marketing/quibi/quibi-top-view.jpg',
    imgTitle: 'Detalle Superior de Cápsulas Blandas Azul Índigo',
    contain: false,
    chips: [
      { cls: 'c1', ico: '🌱', title: 'Glucomanano', sub: 'Fibra saciante' },
      { cls: 'c2', ico: '🥛', title: '2 al Día', sub: 'Antes de comidas' },
    ],
  },
  {
    id: 'nutrition',
    tone: 'plum',
    word: 'INVIMA',
    kicker: 'TRANSPARENCIA Y RESPALDO SANITARIO COLOMBIANO',
    title: (
      <>
        Aprobado con Registro Invima <em>RSA-4113-2025</em>.
      </>
    ),
    sub: 'Elaborado por ALIMENTOS MYC en Tona, Santander para THERMIX. Libre de azúcares añadidos, libre de grasas y con 40 mcg de Picolinato de Cromo por porción.',
    img: '/marketing/quibi/quibi-nutrition.jpg',
    imgTitle: 'Tabla Nutricional Oficial y Registro Invima',
    contain: false,
    chips: [
      { cls: 'c1', ico: '📋', title: '5 Calorías', sub: '0g Azúcar añadido' },
      { cls: 'c2', ico: '🏭', title: 'Alimentos MYC', sub: 'Hecho en Colombia' },
    ],
  },
  {
    id: 'close',
    tone: 'ink',
    word: 'CALIDAD',
    kicker: 'COMPRA DIRECTA CON ENVÍO A TODA COLOMBIA',
    title: (
      <>
        Recibe tu tratamiento original <em>QUIBI</em> en casa.
      </>
    ),
    sub: 'Adquiere 1, 2 o 3 frascos con descuento directo. Disponible para pago en línea seguro o pago contra entrega en efectivo al recibir tu pedido.',
    img: '/marketing/quibi/quibi-close.jpg',
    imgTitle: 'Sello de Marca Original QB en Envase',
    contain: false,
    chips: [
      { cls: 'c1', ico: '🚚', title: 'Envío Nacional', sub: 'Rápido y seguro' },
      { cls: 'c2', ico: '💳', title: 'Pago Flexible', sub: 'Online o Contra Entrega' },
    ],
  },
];

// 4 Quick Highlights under Hero Slider
const STATS = [
  { n: '60 Cápsulas', l: 'Relleno líquido · 30 días de uso', ico: '💊', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)' },
  { n: '0g Azúcar', l: 'Solo 5 kcal · Apto Keto y Ayuno', ico: '🌿', bg: '#ecfdf5', c: '#059669' },
  { n: 'RSA-4113-2025', l: 'Autorización Sanitaria Invima', ico: '🛡️', bg: '#eff6ff', c: '#2b3a9e' },
  { n: 'Envío Gratis', l: 'En packs de 2 y 3 frascos', ico: '🚚', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)' },
];

// 12 Formula Components & Functional Pillars (WAPPY Tools Grid .intg .i .g)
const QUIBI_COMPONENTS = [
  {
    title: 'Vinagre de Cidra de Manzana',
    badge: 'Activo 1 · Digestión',
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
    badge: 'Activo 2 · Saciedad',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: 'Té Verde (EGCG)',
    badge: 'Activo 3 · Termogénesis',
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
    badge: 'Activo 4 · Salud Hepática',
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
    badge: 'Activo 5 · Drenaje Lipídico',
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
    badge: 'Activo 6 · Micronutrientes',
    badgeBg: '#E0F2FE',
    badgeColor: '#0284C7',
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: 'Picolinato de Cromo',
    badge: 'Activo 7 · 40 mcg / Porción',
    badgeBg: '#E0E7FF',
    badgeColor: '#4338CA',
    iconBg: '#EEF2FF',
    iconColor: '#4338CA',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <polyline points="12 9 12 12 13.5 13.5" />
      </svg>
    ),
  },
  {
    title: 'Aceite de Girasol',
    badge: 'Activo 8 · Vehículo Lipídico',
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
    title: 'Cubierta de Gelatina Blanda',
    badge: 'Tecnología · Softgel Índigo',
    badgeBg: '#FCE7F3',
    badgeColor: '#DB2777',
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    title: 'Protección del Esmalte',
    badge: 'Beneficio · Cero Acidez Oral',
    badgeBg: '#D1FAE5',
    badgeColor: '#059669',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: '0.7g Proteína por Cápsula',
    badge: 'Nutrición · Sin Carbohidratos',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      </svg>
    ),
  },
  {
    title: 'Calidad Certificada BPM',
    badge: 'Garantía · Lote Controlado',
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

// Commercial Packages (Ready for Cart & Payment Gateway)
export interface QuibiPackage {
  id: string;
  sku: string;
  title: string;
  shortTitle: string;
  bottles: number;
  capsules: number;
  duration: string;
  priceNum: number;
  originalPriceNum: number;
  price: string;
  originalPrice: string;
  unitPriceLabel: string;
  discount: string;
  freeShipping: boolean;
  shippingLabel: string;
  featured: boolean;
  img: string;
  perks: string[];
  badge: string;
}

const PACKAGES: QuibiPackage[] = [
  {
    id: '1-frasco',
    sku: 'QB-PACK-01',
    title: 'Tratamiento 1 Mes',
    shortTitle: '1 Frasco (60 Cáps.)',
    bottles: 1,
    capsules: 60,
    duration: '1 Frasco · 60 Cápsulas (30 Días)',
    priceNum: 79900,
    originalPriceNum: 95000,
    price: '$79.900',
    originalPrice: '$95.000',
    unitPriceLabel: '$79.900 por frasco',
    discount: 'AHORRAS 15%',
    freeShipping: false,
    shippingLabel: '+ Envío nacional ($12.000)',
    featured: false,
    img: '/marketing/quibi/quibi-front.jpg',
    perks: [
      '1 Frasco original QB (60 cápsulas blandas con relleno líquido)',
      'Suministro completo para 30 días (2 cápsulas al día)',
      '0g Azúcar Añadido · Registro Invima RSA-4113-2025',
      'Pago en Línea (PSE / Tarjetas / Nequi) o Contra Entrega',
    ],
    badge: 'INICIAL · 30 DÍAS',
  },
  {
    id: '2-frascos',
    sku: 'QB-PACK-02',
    title: 'Pack Transformación · 2 Meses',
    shortTitle: '2 Frascos (120 Cáps.)',
    bottles: 2,
    capsules: 120,
    duration: '2 Frascos · 120 Cápsulas (60 Días)',
    priceNum: 139900,
    originalPriceNum: 190000,
    price: '$139.900',
    originalPrice: '$190.000',
    unitPriceLabel: '$69.950 por frasco',
    discount: 'AHORRAS $50.100 (26% OFF)',
    freeShipping: true,
    shippingLabel: '¡ENVÍO GRATIS A TODA COLOMBIA!',
    featured: true,
    img: '/marketing/quibi/quibi-3-bottles.jpg',
    perks: [
      '2 Frascos originales QB (120 cápsulas con relleno líquido)',
      'ENVÍO GRATIS a cualquier ciudad o municipio de Colombia',
      'Te sale a solo $69.950 cada frasco (Ahorras $50.100)',
      'Pago en Línea o Contra Entrega en efectivo al recibir',
      'Guía nutricional y acompañamiento por WhatsApp',
    ],
    badge: 'MÁS VENDIDO · ENVÍO GRATIS',
  },
  {
    id: '3-frascos',
    sku: 'QB-PACK-03',
    title: 'Pack Integral · 3 Meses',
    shortTitle: '3 Frascos (180 Cáps.)',
    bottles: 3,
    capsules: 180,
    duration: '3 Frascos · 180 Cápsulas (90 Días)',
    priceNum: 189900,
    originalPriceNum: 285000,
    price: '$189.900',
    originalPrice: '$285.000',
    unitPriceLabel: '$63.300 por frasco',
    discount: 'AHORRAS $95.100 (33% OFF)',
    freeShipping: true,
    shippingLabel: '¡ENVÍO GRATIS PRIORITARIO!',
    featured: false,
    img: '/marketing/quibi/quibi-3-bottles.jpg',
    perks: [
      '3 Frascos originales QB (180 cápsulas con relleno líquido)',
      'ENVÍO GRATIS prioritario asegurado a nivel nacional',
      'El mejor precio por unidad: $63.300 cada frasco',
      'Ideal para tratamiento completo de 90 días o en pareja',
      'Pago en Línea (PSE / Tarjetas) o Contra Entrega',
    ],
    badge: 'MEJOR PRECIO POR FRASCO',
  },
];

// Focused, Non-Redundant FAQs
const FAQS = [
  {
    q: '¿Son cápsulas o gomitas?',
    a: 'Son CÁPSULAS BLANDAS de gelatina con RELLENO LÍQUIDO activo (softgels). No son gomas masticables ni contienen azúcar. Se tragan enteras con un vaso de agua para liberar el vinagre de manzana y el té verde directamente en el estómago sin tocar el esmalte dental.',
  },
  {
    q: '¿Cómo se toman para obtener mejores resultados?',
    a: 'Toma 2 cápsulas al día: 1 cápsula 20 a 30 minutos antes del almuerzo y 1 cápsula antes de la cena, siempre acompañadas de un vaso lleno de agua (250 ml) para activar la fibra del glucomanano.',
  },
  {
    q: '¿Qué métodos de pago aceptan y cuánto tarda el envío?',
    a: 'Puedes pagar en línea con tarjeta de crédito, débito, PSE, Nequi o Daviplata, o elegir Pago Contra Entrega para pagar en efectivo cuando recibas el paquete en tu puerta. El envío tarda de 1 a 3 días hábiles en ciudades principales.',
  },
  {
    q: '¿Tienen contraindicaciones o rompen el ayuno?',
    a: 'Aportan 0g de azúcares añadidos y solo 5 calorías por cápsula, siendo aptas para dietas bajas en carbohidratos o keto. Como todo suplemento alimenticio, si estás en embarazo, lactancia o tienes una condición médica específica, consulta a tu médico.',
  },
];

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export default function QuibiPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ==========================================================================
  // SHOPPING CART & CHECKOUT GATEWAY STATE
  // Ready to plug into Wompi / MercadoPago / Bold / Stripe checkout API
  // ==========================================================================
  const [selectedPackId, setSelectedPackId] = useState<string>('2-frascos');
  const [cartQty, setCartQty] = useState<number>(1);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'cart' | 'checkout' | 'success'>('cart');

  // Checkout Customer & Gateway Form State
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [paymentGatewayMethod, setPaymentGatewayMethod] = useState<'online_card_pse' | 'online_nequi' | 'cod'>('online_card_pse');
  const [orderReference, setOrderReference] = useState('');

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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  const scrollToSection = (e: React.MouseEvent | null, id: string) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 85;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - navOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Cart Calculations
  const currentPack = PACKAGES.find((p) => p.id === selectedPackId) || PACKAGES[1];
  const subtotalOriginal = currentPack.originalPriceNum * cartQty;
  const subtotalSale = currentPack.priceNum * cartQty;
  const totalSavings = subtotalOriginal - subtotalSale;
  const qualifiesFreeShipping = currentPack.freeShipping || subtotalSale >= 130000;
  const shippingCost = qualifiesFreeShipping ? 0 : 12000;
  const finalTotal = subtotalSale + shippingCost;
  const totalBottlesInCart = currentPack.bottles * cartQty;

  const handleAddToCart = (packId: string, goDirectToCheckout = false) => {
    setSelectedPackId(packId);
    setCartQty(1);
    setDrawerTab(goDirectToCheckout ? 'checkout' : 'cart');
    setIsCartOpen(true);
  };

  // Handler ready to connect to Payment Gateway (Wompi / MercadoPago / Bold)
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientCity.trim() || !clientAddress.trim()) {
      alert('Por favor completa los datos de entrega para procesar tu orden.');
      return;
    }

    const refCode = `QB-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderReference(refCode);

    // Payload structured for future payment gateway webhook / session creation
    const checkoutPayload = {
      reference: refCode,
      sku: currentPack.sku,
      packTitle: currentPack.title,
      quantity: cartQty,
      totalBottles: totalBottlesInCart,
      amountInCents: finalTotal * 100,
      currency: 'COP',
      paymentMethod: paymentGatewayMethod,
      customer: {
        name: clientName,
        document: clientDoc,
        phone: clientPhone,
        email: clientEmail,
        city: clientCity,
        address: clientAddress,
      },
    };
    console.info('[QUIBI Checkout Ready Payload]:', checkoutPayload);

    setDrawerTab('success');
  };

  const handleConfirmOrderOnWhatsApp = () => {
    const methodLabel =
      paymentGatewayMethod === 'online_card_pse'
        ? 'Pago en Línea (Tarjeta / PSE)'
        : paymentGatewayMethod === 'online_nequi'
        ? 'Pago en Línea (Nequi / Daviplata)'
        : 'Pago Contra Entrega (Efectivo al recibir)';

    const msg =
      `*ORDEN DE COMPRA QUIBI #${orderReference || 'QB-WEB'}*\n\n` +
      `📦 *Producto:* ${currentPack.title} (x${cartQty} — ${totalBottlesInCart} frascos / ${currentPack.capsules * cartQty} cápsulas)\n` +
      `💰 *Subtotal:* ${formatCOP(subtotalSale)}\n` +
      `🚚 *Envío:* ${shippingCost === 0 ? 'GRATIS' : formatCOP(shippingCost)}\n` +
      `💵 *TOTAL A PAGAR:* *${formatCOP(finalTotal)}*\n` +
      `💳 *Método elegido:* ${methodLabel}\n\n` +
      `👤 *Datos de Envío:*\n` +
      `• Nombre: ${clientName}\n` +
      (clientDoc ? `• Cédula/NIT: ${clientDoc}\n` : '') +
      `• Teléfono: ${clientPhone}\n` +
      `• Ciudad: ${clientCity}\n` +
      `• Dirección: ${clientAddress}\n`;

    window.open(`https://wa.me/573054656064?text=${encodeURIComponent(msg)}`, '_blank');
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

      {/* =====================================================================
          FLOATING CAPSULE NAVBAR (Clean, No Cluttered Subtitles + Cart Trigger)
          ===================================================================== */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="QUIBI"
            href="#inicio"
            onClick={(e) => scrollToSection(e, 'inicio')}
          >
            <div className="qb-logo-badge">QB</div>
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">
                QUIBI<span style={{ color: 'var(--qb-plum-2)' }}>.co</span>
              </span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')}>Producto</a>
            <a href="#componentes" onClick={(e) => scrollToSection(e, 'componentes')}>Fórmula</a>
            <a href="#video" onClick={(e) => scrollToSection(e, 'video')}>Video</a>
            <a href="#nutricion" onClick={(e) => scrollToSection(e, 'nutricion')}>Tabla Nutricional</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')}>Packs y Precios</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a>
          </div>

          <div className="mkt-nav-cta">
            <button
              type="button"
              className="qb-cart-trigger"
              onClick={() => {
                setDrawerTab('cart');
                setIsCartOpen(true);
              }}
              aria-label="Abrir carrito de compras"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              <span className="qb-cart-badge">{totalBottlesInCart}</span>
            </button>

            <button
              type="button"
              className="btn btn-lime btn-sm"
              onClick={() => scrollToSection(null, 'precios')}
            >
              Comprar Ahora
            </button>

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

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="mkt-mobile-menu-drawer">
            <div className="mkt-mobile-menu-links">
              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'inicio')}>
                <span className="mkt-mobile-link-icon">💊</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Producto</span>
                  <span className="mkt-mobile-link-desc">Cápsulas blandas con relleno líquido</span>
                </div>
              </button>
              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'componentes')}>
                <span className="mkt-mobile-link-icon">🌿</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Fórmula y Componentes</span>
                  <span className="mkt-mobile-link-desc">Vinagre de manzana, Té verde, Glucomanano y Cromo</span>
                </div>
              </button>
              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'nutricion')}>
                <span className="mkt-mobile-link-icon">📋</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Tabla Nutricional & Invima</span>
                  <span className="mkt-mobile-link-desc">Registro Invima RSA-4113-2025 · 0g Azúcar</span>
                </div>
              </button>
              <button type="button" className="mkt-mobile-link" onClick={() => scrollToSection(null, 'precios')}>
                <span className="mkt-mobile-link-icon">🛍️</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">Packs y Precios</span>
                  <span className="mkt-mobile-link-desc">Desde $79.900 con envío a toda Colombia</span>
                </div>
              </button>
            </div>
            <div className="mkt-mobile-menu-divider" />
            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setDrawerTab('cart');
                  setIsCartOpen(true);
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                Ver Carrito y Pagar ({formatCOP(finalTotal)})
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* =====================================================================
          SECTION 1: HERO SLIDER + DIRECT PRODUCT SHOWCASE (#inicio)
          ===================================================================== */}
      <header id="inicio" className="qb-hero">
        <div className="wrap">
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
                  <div className="qb-slide-word">{slide.word}</div>

                  {/* Decorative Floating Softgels */}
                  <div className="qb-pill" style={{ top: '12%', right: '47%', transform: 'rotate(-18deg)' }} />
                  <div className="qb-pill" style={{ bottom: '18%', left: '44%', transform: 'rotate(24deg)', animationDelay: '-3s' }} />

                  {/* Left Copy & Direct Buy Actions */}
                  <div className="qb-slide-copy">
                    <div className="qb-kicker qb-in" style={{ '--d': '0.05s' } as React.CSSProperties}>
                      <span className="dot" />
                      <span>{slide.kicker}</span>
                    </div>

                    <h1 className="qb-in" style={{ '--d': '0.12s' } as React.CSSProperties}>
                      {slide.title}
                    </h1>

                    <p className="qb-slide-sub qb-in" style={{ '--d': '0.2s' } as React.CSSProperties}>
                      {slide.sub}
                    </p>

                    <div className="qb-hero-price-strip qb-in" style={{ '--d': '0.26s' } as React.CSSProperties}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, display: 'block' }}>
                          FRASCO X 60 CÁPSULAS
                        </span>
                        <span className="now">$79.900</span>{' '}
                        <span className="old">$95.000</span>
                      </div>
                      <span className="tag">o $69.950 c/u en Pack x2</span>
                    </div>

                    <div className="qb-slide-cta qb-in" style={{ '--d': '0.32s' } as React.CSSProperties}>
                      <button
                        type="button"
                        className="btn btn-lime"
                        onClick={() => handleAddToCart('2-frascos', false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Agregar al Carrito
                      </button>

                      <button
                        type="button"
                        className="btn btn-glass"
                        onClick={() => scrollToSection(null, 'precios')}
                      >
                        Ver los 3 Packs
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Media: Real Product Image + Interactive Thumbnails */}
                  <div className="qb-slide-media">
                    <div className="qb-frame-wrap">
                      <div className="qb-glow" />
                      <div
                        className={`qb-frame ${slide.contain ? 'fit-contain' : ''}`}
                        onClick={() => setLightboxImg(slide.img)}
                        title="Clic para ampliar fotografía real del producto"
                      >
                        <img src={slide.img} alt={slide.imgTitle} />
                      </div>

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

                    {/* Direct 5-Photo Thumbnail Selector inside Hero */}
                    <div className="qb-thumbs" aria-label="Miniaturas del producto">
                      {SLIDES.map((s, tidx) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`qb-thumb ${tidx === currentSlide ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(tidx)}
                          title={s.imgTitle}
                        >
                          <img src={s.img} alt={s.imgTitle} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Slider Bottom Controls */}
            <div className="qb-slider-ui">
              <div className="qb-count">
                <b>0{currentSlide + 1}</b> / 0{SLIDES.length}
              </div>

              <div className="qb-dots">
                {SLIDES.map((_, didx) => (
                  <button
                    key={didx}
                    type="button"
                    className={`qb-dot ${didx === currentSlide ? 'active' : ''} ${didx < currentSlide ? 'done' : ''}`}
                    onClick={() => setCurrentSlide(didx)}
                    aria-label={`Slide ${didx + 1}`}
                  >
                    <span />
                  </button>
                ))}
              </div>

              <div className="qb-arrows">
                <button type="button" className="qb-arrow" onClick={prevSlide} aria-label="Anterior">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button type="button" className="qb-arrow" onClick={nextSlide} aria-label="Siguiente">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Quick Product Guarantees */}
          <div className="qb-stats">
            {STATS.map((stat, sidx) => (
              <div key={sidx} className="qb-stat">
                <div className="qb-stat-ico" style={{ background: stat.bg, color: stat.c }}>
                  <span style={{ fontSize: 21 }}>{stat.ico}</span>
                </div>
                <div>
                  <div className="qb-stat-n">{stat.n}</div>
                  <div className="qb-stat-l">{stat.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECTION 2: FÓRMULA & COMPONENTES (WAPPY .intg Grid + Compact Routine)
          ===================================================================== */}
      <section id="componentes" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              FORMULACIÓN CIENTÍFICA
            </span>
            <h2 className="display">
              Activos Botánicos en cada <em>Cápsula Blanda</em>
            </h2>
            <p>
              Extractos concentrados encapsulados en gelatina blanda con centro líquido para actuar directamente en el estómago sin causar acidez en la boca.
            </p>
          </div>

          {/* Exact WAPPY Tools Grid (.intg .i .g) */}
          <div className="intg">
            {QUIBI_COMPONENTS.map((item, idx) => (
              <div key={idx} className="i">
                <span className="g" style={{ background: item.iconBg, color: item.iconColor }}>
                  {item.svg}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: item.badgeColor, background: item.badgeBg, padding: '2px 8px', borderRadius: 9999 }}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>

          {/* Single Compact 3-Step Daily Routine Strip (Replaces redundant sections) */}
          <div className="qb-routine-strip">
            <div className="qb-routine-item">
              <div className="qb-routine-num">01</div>
              <div>
                <h4>2 Cápsulas al Día</h4>
                <p>Toma 1 cápsula 20 minutos antes del almuerzo y 1 antes de la cena.</p>
              </div>
            </div>

            <div className="qb-routine-item">
              <div className="qb-routine-num">02</div>
              <div>
                <h4>Acompaña con 250 ml de Agua</h4>
                <p>El agua hidrata el glucomanano generando plenitud natural en el estómago.</p>
              </div>
            </div>

            <div className="qb-routine-item">
              <div className="qb-routine-num">03</div>
              <div>
                <h4>Liberación sin Acidez Oral</h4>
                <p>La perla se abre en el estómago protegiendo tu garganta y esmalte dental.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: VIDEO & DEMOSTRACIÓN (Exact WAPPY Video Section Layout)
          ===================================================================== */}
      <section id="video" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              TECNOLOGÍA DE CÁPSULA BLANDA
            </span>
            <h2 className="display">
              Conoce la <em>Liberación Líquida</em> de QUIBI
            </h2>
            <p>
              Mira cómo la cubierta de gelatina blanda protege los extractos activos hasta llegar al sistema digestivo.
            </p>
          </div>

          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }} />
                Cápsula Blanda · Relleno Líquido
              </span>
              <span className="vid-tech-pill">
                Invima RSA-4113-2025 · 60 Unidades
              </span>
            </div>

            <div className="vid-control-right">
              <button
                type="button"
                className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(false)}
              >
                🖼️ Vista de Producto
              </button>
              <button
                type="button"
                className={`vid-toggle-btn ${showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(true)}
              >
                ▶️ Reproducir Video
              </button>
              <a
                href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20información%20sobre%20las%20cápsulas%20QUIBI"
                target="_blank"
                rel="noopener noreferrer"
                className="vid-ext-link"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Asesoría WhatsApp ↗
              </a>
            </div>
          </div>

          <div className={`vid-shell ${showVideo ? 'vid-vertical-mode' : 'vid-poster-mode'}`}>
            {!showVideo ? (
              <div className="qb-poster" onClick={() => setShowVideo(true)}>
                <div className="qb-poster-copy">
                  <span
                    className="vid-live-pill"
                    style={{ background: 'rgba(246, 168, 205, 0.2)', color: 'var(--qb-pink)', borderColor: 'rgba(246, 168, 205, 0.35)' }}
                  >
                    Presentación Oficial 60 Unidades
                  </span>
                  <h3>Absorción Rápida sin Dañar tu Esmalte Dental</h3>
                  <p>
                    Olvida el sabor fuerte del vinagre líquido tradicional o el azúcar de las gomitas. Cada cápsula entrega la dosis exacta de activos botánicos.
                  </p>
                  <div className="qb-play-btn">
                    <span className="qb-play-circle">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>
                    <span>Ver Video Demostrativo</span>
                  </div>
                </div>

                <div className="qb-poster-visual">
                  <img
                    src="/marketing/quibi/quibi-3-bottles.jpg"
                    alt="Presentación Oficial 3 Ángulos QUIBI"
                  />
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
          SECTION 4: TABLA NUTRICIONAL OFICIAL & INVIMA (#nutricion)
          ===================================================================== */}
      <section id="nutricion" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              TRANSPARENCIA Y REGISTRO OFICIAL
            </span>
            <h2 className="display">
              Tabla Nutricional y <em>Certificación Invima</em>
            </h2>
            <p>
              Valores exactos declarados en el envase oficial fabricado por ALIMENTOS MYC para THERMIX.
            </p>
          </div>

          <div className="qb-nutri">
            {/* Official Nutrition Table */}
            <div className="qb-table-card">
              <div className="qb-table-head">
                <div>
                  <h3>Información Nutricional</h3>
                  <span>Tamaño por porción: 1 Cápsula con relleno (2g)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', opacity: 0.85 }}>Porciones por envase</span>
                  <b>60</b>
                </div>
              </div>

              <table className="qb-table">
                <thead>
                  <tr>
                    <th>Nutriente</th>
                    <th>Por 100g</th>
                    <th>Por porción (1 cápsula)</th>
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
                    <td>Azúcares Añadidos</td>
                    <td>0 g</td>
                    <td><strong style={{ color: '#059669' }}>0 g</strong></td>
                  </tr>
                  <tr>
                    <td>Proteína</td>
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
                <strong>Ingredientes:</strong> Gelatina polvo, Vinagre de cidra de Manzana, Alcachofa, Berenjena, Spirulina, Té verde, Glucomanano, Aceite de Girasol, Agua, Sorbato de potasio, Picolinato de Cromo.
              </div>
            </div>

            {/* Invima Card + Clickable Photo of Physical Label */}
            <div className="qb-cert">
              <div className="qb-cert-card">
                <span
                  className="vid-live-pill"
                  style={{ background: 'rgba(255, 255, 255, 0.14)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
                >
                  Autorización Sanitaria Colombia
                </span>
                <div className="qb-cert-code">RSA-4113-2025</div>

                <div className="qb-cert-rows">
                  <div>
                    <span>Denominación:</span>
                    <b>Alimento a base de gelatina con relleno líquido</b>
                  </div>
                  <div>
                    <span>Fabricado por:</span>
                    <b>ALIMENTOS MYC</b>
                  </div>
                  <div>
                    <span>Planta:</span>
                    <b>Vereda Ucata Granja El Paraíso, Tona, Santander</b>
                  </div>
                  <div>
                    <span>Comercializa:</span>
                    <b>THERMIX · Línea 305 4656064</b>
                  </div>
                  <div>
                    <span>Código EAN:</span>
                    <b>7709026096235</b>
                  </div>
                </div>
              </div>

              <div
                className="qb-label-preview"
                onClick={() => setLightboxImg('/marketing/quibi/quibi-nutrition.jpg')}
              >
                <img src="/marketing/quibi/quibi-nutrition.jpg" alt="Etiqueta nutricional real" />
                <div>
                  <h4>🔍 Ver Fotografía Real del Envase e Invima</h4>
                  <p>Haz clic para ampliar la foto real de la tabla nutricional impresa en el frasco.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: TIENDA / ELIGE TU PACK (#precios) — E-Commerce Ready
          ===================================================================== */}
      <section id="precios" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              TIENDA OFICIAL QUIBI
            </span>
            <h2 className="display">
              Elige tu Pack y <em>Compra en Segundos</em>
            </h2>
            <p>
              Selecciona tu tratamiento ideal. Agrega al carrito para pagar en línea con pasarela segura o solicita Pago Contra Entrega.
            </p>
          </div>

          <div className="price" style={{ maxWidth: 1080, margin: '0 auto' }}>
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPackId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className={`pcard qb-pcard ${pkg.featured ? 'feat-plan' : ''} ${isSelected ? 'qb-selected' : ''}`}
                  onClick={() => setSelectedPackId(pkg.id)}
                >
                  {pkg.badge && <span className="pbadge">{pkg.badge}</span>}

                  <div className="pn">{pkg.title}</div>
                  <div className="qb-pqty">{pkg.duration}</div>

                  <div className="pp">
                    <div className="qb-pold">
                      <s>{pkg.originalPrice}</s>
                      <em>{pkg.discount}</em>
                    </div>
                    {pkg.price} <span>COP</span>
                  </div>

                  <div className="ptrial">
                    <Truck className="w-4 h-4" />
                    <span>{pkg.shippingLabel}</span>
                  </div>

                  <ul>
                    {pkg.perks.map((perk, pidx) => (
                      <li key={pidx}>
                        <span className="pck">
                          <Check className="w-3 h-3" />
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="qb-card-actions">
                    <button
                      type="button"
                      className={pkg.featured ? 'btn btn-lime' : 'btn btn-primary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(pkg.id, true);
                      }}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Comprar Ahora · {pkg.price}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={
                        pkg.featured
                          ? { background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }
                          : undefined
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(pkg.id, false);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Agregar al Carrito</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Gateway Trust Strip */}
          <div className="qb-gateway-bar">
            <div className="qb-gateway-info">
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'var(--qb-pink-soft)',
                  color: 'var(--qb-plum)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <strong>Pasarela de Pago Segura & Despacho Contra Entrega</strong>
                <span>Paga con tu método favorito o en efectivo al recibir el pedido en tu casa.</span>
              </div>
            </div>

            <div className="qb-gateway-pills">
              <span className="qb-pay-pill">💳 Visa / Mastercard</span>
              <span className="qb-pay-pill">🏦 PSE Débito</span>
              <span className="qb-pay-pill">📱 Nequi / Daviplata</span>
              <span className="qb-pay-pill">💵 Contra Entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: PREGUNTAS FRECUENTES (#faq)
          ===================================================================== */}
      <section id="faq" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              PREGUNTAS FRECUENTES
            </span>
            <h2 className="display">
              Resolvemos tus <em>Dudas</em>
            </h2>
            <p>
              Respuestas claras sobre las cápsulas blandas con relleno líquido, consumo y envío.
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
          SLIDE-OVER SHOPPING CART & PAYMENT GATEWAY CHECKOUT DRAWER
          ===================================================================== */}
      {isCartOpen && (
        <>
          <div className="qb-drawer-backdrop" onClick={() => setIsCartOpen(false)} />
          <aside className="qb-drawer" aria-label="Carrito de compras y pasarela de pago">
            <div className="qb-drawer-head">
              <div className="qb-drawer-title">
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--qb-plum)' }} />
                <span>
                  {drawerTab === 'cart'
                    ? 'Tu Carrito QUIBI'
                    : drawerTab === 'checkout'
                    ? 'Checkout & Pasarela de Pago'
                    : '¡Orden Lista!'}
                </span>
              </div>
              <button
                type="button"
                className="qb-drawer-close"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar carrito"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drawerTab !== 'success' && (
              <div className="qb-drawer-steps">
                <button
                  type="button"
                  className={`qb-drawer-step ${drawerTab === 'cart' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('cart')}
                >
                  1. Carrito ({totalBottlesInCart} {totalBottlesInCart === 1 ? 'frasco' : 'frascos'})
                </button>
                <button
                  type="button"
                  className={`qb-drawer-step ${drawerTab === 'checkout' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('checkout')}
                >
                  2. Envío y Pago Seguro
                </button>
              </div>
            )}

            <div className="qb-drawer-body">
              {drawerTab === 'cart' && (
                <>
                  {/* Free Shipping Status Banner */}
                  <div className="qb-ship-banner">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>
                      {qualifiesFreeShipping
                        ? '¡Felicidades! Tu pedido tiene ENVÍO GRATIS a toda Colombia.'
                        : 'Elige el Pack x2 o Pack x3 para obtener ENVÍO GRATIS inmediato.'}
                    </span>
                  </div>

                  {/* Selected Cart Item */}
                  <div className="qb-cart-item">
                    <img src={currentPack.img} alt={currentPack.title} />
                    <div className="qb-cart-item-info">
                      <h4>{currentPack.title}</h4>
                      <small>{currentPack.duration} · Invima RSA-4113-2025</small>

                      <div className="qb-qty-row">
                        <div className="qb-qty-ctrl">
                          <button
                            type="button"
                            onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5 mx-auto" />
                          </button>
                          <span>{cartQty}</span>
                          <button
                            type="button"
                            onClick={() => setCartQty((q) => q + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--muted)' }}>
                            {formatCOP(subtotalOriginal)}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--qb-plum)' }}>
                            {formatCOP(subtotalSale)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Pack Switcher / Upsell inside Cart */}
                  <div className="qb-upsell-box">
                    <h5>✨ Cambia de Pack y Ahorra Más:</h5>
                    <div className="qb-upsell-grid">
                      {PACKAGES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`qb-upsell-btn ${selectedPackId === p.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedPackId(p.id);
                            setCartQty(1);
                          }}
                        >
                          <strong>{p.bottles} {p.bottles === 1 ? 'Frasco' : 'Frascos'}</strong>
                          <span>{p.price}</span>
                          <small>{p.freeShipping ? 'Envío Gratis' : '15% OFF'}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'checkout' && (
                <form id="quibi-checkout-form" onSubmit={handleCheckoutSubmit}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--qb-plum)' }}>
                    1. Datos de Contacto y Dirección
                  </h4>

                  <div className="qb-fields">
                    <div className="qb-field">
                      <label>Nombre y Apellido *</label>
                      <input
                        type="text"
                        placeholder="Ej. Laura Gómez"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field">
                      <label>Cédula / NIT</label>
                      <input
                        type="text"
                        placeholder="Ej. 1037654321"
                        value={clientDoc}
                        onChange={(e) => setClientDoc(e.target.value)}
                      />
                    </div>

                    <div className="qb-field">
                      <label>Celular / WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="Ej. 310 123 4567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="qb-field">
                      <label>Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="tu@correo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
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
                      <label>Dirección Completa *</label>
                      <input
                        type="text"
                        placeholder="Calle / Cra # y Apto/Barrio"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <h4 style={{ margin: '20px 0 10px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--qb-plum)' }}>
                    2. Selecciona Método en Pasarela de Pago
                  </h4>

                  <div className="qb-pay-methods">
                    <div
                      className={`qb-pay-option ${paymentGatewayMethod === 'online_card_pse' ? 'selected' : ''}`}
                      onClick={() => setPaymentGatewayMethod('online_card_pse')}
                    >
                      <div className="qb-pay-option-top">
                        <strong>💳 Tarjeta de Crédito, Débito o PSE</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--qb-plum)', background: '#fff', padding: '2px 8px', borderRadius: 9999 }}>
                          Pasarela Online
                        </span>
                      </div>
                      <p>Visa, Mastercard, American Express y todos los bancos vía PSE.</p>
                    </div>

                    <div
                      className={`qb-pay-option ${paymentGatewayMethod === 'online_nequi' ? 'selected' : ''}`}
                      onClick={() => setPaymentGatewayMethod('online_nequi')}
                    >
                      <div className="qb-pay-option-top">
                        <strong>📱 Nequi / Daviplata / Billeteras</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 9999 }}>
                          Aprobación Inmediata
                        </span>
                      </div>
                      <p>Pago rápido desde tu celular sin costo adicional.</p>
                    </div>

                    <div
                      className={`qb-pay-option ${paymentGatewayMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentGatewayMethod('cod')}
                    >
                      <div className="qb-pay-option-top">
                        <strong>💵 Pago Contra Entrega (Efectivo)</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: 9999 }}>
                          Pagas al Recibir
                        </span>
                      </div>
                      <p>Pagas en efectivo directamente al transportador cuando te entregue el pedido.</p>
                    </div>
                  </div>
                </form>
              )}

              {drawerTab === 'success' && (
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--qb-pink)',
                      color: 'var(--qb-plum-deep)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Check className="w-8 h-8" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--qb-plum)', background: 'var(--qb-pink-soft)', padding: '4px 12px', borderRadius: 9999 }}>
                    ORDEN #{orderReference}
                  </span>
                  <h3 style={{ margin: '12px 0 8px', fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800 }}>
                    ¡Tu Orden ha sido Generada!
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 20 }}>
                    Hemos registrado tu pedido de <strong>{currentPack.title}</strong> por <strong>{formatCOP(finalTotal)}</strong>. Finaliza la validación de envío o link de pago inmediato con nuestro equipo oficial:
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                    onClick={handleConfirmOrderOnWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Finalizar Pago y Despacho en WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-glass"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setDrawerTab('cart')}
                  >
                    Volver al Carrito
                  </button>
                </div>
              )}
            </div>

            {drawerTab !== 'success' && (
              <div className="qb-drawer-foot">
                <div className="qb-sum-row">
                  <span>Subtotal ({totalBottlesInCart} {totalBottlesInCart === 1 ? 'frasco' : 'frascos'})</span>
                  <span>{formatCOP(subtotalSale)}</span>
                </div>
                <div className="qb-sum-row" style={{ color: '#059669', fontWeight: 700 }}>
                  <span>Descuento aplicado</span>
                  <span>− {formatCOP(totalSavings)}</span>
                </div>
                <div className="qb-sum-row">
                  <span>Envío Nacional</span>
                  <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#059669' : 'var(--ink)' }}>
                    {shippingCost === 0 ? 'GRATIS' : formatCOP(shippingCost)}
                  </span>
                </div>
                <div className="qb-sum-row total">
                  <span>Total a Pagar</span>
                  <span>{formatCOP(finalTotal)}</span>
                </div>

                {drawerTab === 'cart' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
                    onClick={() => setDrawerTab('checkout')}
                  >
                    <span>Continuar al Pago Seguro</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="quibi-checkout-form"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {paymentGatewayMethod === 'cod'
                        ? `Confirmar Contra Entrega · ${formatCOP(finalTotal)}`
                        : `Pagar Ahora · ${formatCOP(finalTotal)}`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </aside>
        </>
      )}

      {/* =====================================================================
          LIGHTBOX MODAL FOR REAL PRODUCT PHOTOS
          ===================================================================== */}
      {lightboxImg && (
        <div className="qb-lightbox" onClick={() => setLightboxImg(null)}>
          <button type="button" onClick={() => setLightboxImg(null)} aria-label="Cerrar imagen">
            ✕
          </button>
          <img
            src={lightboxImg}
            alt="Vista ampliada oficial QUIBI"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* =====================================================================
          STICKY MOBILE BAR
          ===================================================================== */}
      <div className="qb-sticky">
        <div>
          <b>QUIBI (QB) · 60 Cápsulas</b>
          <small>Desde $79.900 · Envío Nacional</small>
        </div>
        <button
          type="button"
          className="btn btn-lime btn-sm"
          onClick={() => {
            setDrawerTab('cart');
            setIsCartOpen(true);
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Comprar ({totalBottlesInCart})
        </button>
      </div>

      {/* =====================================================================
          FOOTER: EXACT WAPPY FOOTER STRUCTURE (Single Brand Block, No Duplication)
          ===================================================================== */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }} />
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }} />

        <div className="wrap">
          <div className="foot-cta">
            <h3 className="display">Tu bienestar digestivo y metabólico empieza hoy.</h3>
            <p>
              Pide tus cápsulas blandas originales QUIBI con relleno líquido de vinagre de manzana y té verde. Envío rápido a toda Colombia.
            </p>
            <div className="hero-cta" style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAddToCart('2-frascos', false)}
              >
                <ShoppingBag className="w-4 h-4" />
                Comprar con Descuento
              </button>
              <a
                href="https://wa.me/573054656064?text=Hola%20Thermix,%20deseo%20ordenar%20las%20cápsulas%20QUIBI"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glass"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Oficial (305 4656064)
              </a>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div className="qb-logo-badge">QB</div>
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                  QUIBI<span style={{ color: 'var(--qb-plum-2)' }}>.co</span>
                </span>
              </div>
              <p className="foot-desc">
                Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. Con Glucomanano, Alcachofa, Berenjena, Spirulina y Picolinato de Cromo. Autorización Sanitaria Invima RSA-4113-2025. Fabricado por ALIMENTOS MYC (Tona, Santander) para THERMIX.
              </p>
            </div>
          </div>

          {/* Giant Outline Watermark Word (WAPPY signature style) */}
          <div className="foot-word">QUIBI</div>

          <div className="foot-bottom">
            <span>© 2026 THERMIX · ALIMENTOS MYC · Colombia. Todos los derechos reservados.</span>
            <div className="foot-legal">
              <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')}>Tienda y Packs</a>
              <a href="#nutricion" onClick={(e) => scrollToSection(e, 'nutricion')}>Invima RSA-4113-2025</a>
              <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>Preguntas Frecuentes</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
