import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Check,
  MessageCircle,
  ShoppingBag,
  ShoppingCart,
  X,
  Truck,
  ArrowRight,
  ArrowLeft,
  Play,
  Lock,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import './marketing.css';
import './quibi.css';

// Lema oficial de marca
const SLOGAN_A = 'Pequeños hábitos,';
const SLOGAN_B = 'grandes cambios';

// Cuando exista el video oficial del producto, poner aquí su ruta (ej. '/marketing/quibi/quibi.mp4').
// Mientras esté vacío, la sección de video muestra un recorrido con las fotos reales del producto.
const QUIBI_VIDEO_SRC = '';

const WHATSAPP_NUMBER = '573054656064';
const CART_STORAGE_KEY = 'quibi_cart_v1';

// Navegación del encabezado → id de cada sección (todas existen en la página)
const NAV_ITEMS = [
  { id: 'inicio', label: 'Producto', icon: '💊', desc: 'Cápsulas blandas con relleno líquido' },
  { id: 'componentes', label: 'Fórmula', icon: '🌿', desc: 'Activos y modo de uso' },
  { id: 'video', label: 'Video', icon: '🎬', desc: 'Recorrido real del producto' },
  { id: 'nutricion', label: 'Nutrición', icon: '📋', desc: 'Tabla nutricional e Invima' },
  { id: 'precios', label: 'Packs y Precios', icon: '🛍️', desc: 'Desde $96.000 · Envío nacional' },
  { id: 'faq', label: 'FAQ', icon: '❓', desc: 'Preguntas frecuentes' },
];

// ============================================================================
// 5 AUTHENTIC MANUFACTURED PRODUCT SLIDES (Hero Showcase)
// ============================================================================
const SLIDES = [
  {
    id: 'front',
    tone: 'plum',
    word: 'QUIBI',
    kicker: '✨ TU TRANSFORMACIÓN EMPIEZA HOY · SIENTE LA LIGEREZA',
    title: (
      <>
        {SLOGAN_A} <em>{SLOGAN_B}</em>.
      </>
    ),
    sub: 'El hábito diario que transforma tu digestión, apaga los antojos y activa tu metabolismo de forma 100% natural. Dos perlas suaves al día para sentirte ligera, confiada y con energía radiante.',
    img: '/marketing/quibi/quibi-front.jpg',
    imgTitle: 'Envase Original QUIBI (QB) · 60 Cápsulas Blandas',
    contain: false,
    chips: [
      { cls: 'c1', ico: '🔥', title: '«Despídete de la Pesadez»', sub: 'Vientre plano y ligereza desde el día 1' },
      { cls: 'c2', ico: '🎯', title: '«Controla los Antojos Dulces»', sub: 'Saciedad y calma natural sin pasar hambre' },
    ],
  },
  {
    id: '3-bottles',
    tone: 'indigo',
    word: 'SOFTGEL',
    kicker: '⚡ ACTIVA TU ENERGÍA Y DESPIERTA TU METABOLISMO',
    title: (
      <>
        Cinco activos puros para <em>despertar tu mejor versión</em>.
      </>
    ),
    sub: 'Vinagre de manzana, té verde, glucomanano, alcachofa y cromo trabajando en perfecta sinergia. Quema grasa, desinflama tu cuerpo y disfruta de una energía limpia durante todo el día.',
    img: '/marketing/quibi/quibi-3-bottles.jpg',
    imgTitle: 'Presentación Oficial QUIBI (QB) en Tres Ángulos',
    contain: true,
    chips: [
      { cls: 'c1', ico: '⚡', title: '«Energía Pura Todo el Día»', sub: 'Cero fatiga, máxima vitalidad activa' },
      { cls: 'c2', ico: '🌱', title: '«Digestión Feliz y Ligera»', sub: 'Vientre desinflamado después de comer' },
    ],
  },
  {
    id: 'top-view',
    tone: 'rose',
    word: 'HÁBITOS',
    kicker: '💖 EL HÁBITO DIARIO DE AMOR PROPIO QUE MERECES',
    title: (
      <>
        Dos perlas al día<br />
        para recuperar<br />
        <em>tu confianza</em>.
      </>
    ),
    sub: 'Olvida las dietas tortuosas y el sabor amargo del vinagre líquido. Un gesto tan simple como tomar dos cápsulas con agua para reconectar con tu bienestar y amar lo que ves en el espejo.',
    img: '/marketing/quibi/quibi-top-view.jpg',
    imgTitle: 'Detalle Superior de Cápsulas Blandas Azul Índigo',
    contain: false,
    chips: [
      { cls: 'c1', ico: '✨', title: '«Ama lo que Ves al Espejo»', sub: 'Vuelve a lucir tu ropa con orgullo' },
      { cls: 'c2', ico: '🛡️', title: '«Plenitud Total Sin Culpas»', sub: 'Llega satisfecha a cada comida' },
    ],
  },
  {
    id: 'nutrition',
    tone: 'plum',
    word: 'INVIMA',
    kicker: '🌿 CUIDA TU CUERPO CON LO MEJOR DE LA NATURALEZA',
    title: (
      <>
        Fórmula limpia para <em>sentirte orgullosa de lo que tomas</em>.
      </>
    ),
    sub: '0g de azúcar añadida, solo 5 calorías y máxima absorción gástrica. Respaldo científico y sanitario para que cada día te acerques con seguridad a la meta de bienestar que siempre has soñado.',
    img: '/marketing/quibi/quibi-nutrition.jpg',
    imgTitle: 'Tabla Nutricional Oficial y Registro Invima',
    contain: false,
    chips: [
      { cls: 'c1', ico: '💎', title: '«100% Sin Culpa Ni Azúcar»', sub: 'Solo 5 kcal · Apto Keto y Ayuno' },
      { cls: 'c2', ico: '🏆', title: '«Tranquilidad & Respaldo Real»', sub: 'Con Autorización Invima RSA-4113-2025' },
    ],
  },
  {
    id: 'close',
    tone: 'ink',
    word: 'CAMBIOS',
    kicker: '🚀 NO LO POSTERGUES MÁS · TU MOMENTO ES AHORA',
    title: (
      <>
        El gran cambio en tu vida <em>comienza con una sola decisión</em>.
      </>
    ),
    sub: '¿Por qué esperar otro lunes para empezar a cuidarte? Da el primer paso hoy hacia una vida más liviana, activa y feliz. Elige tu pack y recibe tu pedido en la puerta de tu casa.',
    img: '/marketing/quibi/quibi-close.jpg',
    imgTitle: 'Sello de Marca Original QB en Envase',
    contain: false,
    chips: [
      { cls: 'c1', ico: '🌟', title: '«Tu Bienestar es Hoy»', sub: 'Mereces sentirte ligera y renovada' },
      { cls: 'c2', ico: '📦', title: '«Pide Hoy y Paga al Recibir»', sub: 'Envío gratis nacional y pago contra entrega' },
    ],
  },
];

// 4 Quick Highlights under Hero Slider
const STATS = [
  { n: '60 Cápsulas', l: 'Relleno líquido · 30 días de uso', ico: '💊', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)', target: 'componentes' },
  { n: '0g Azúcar', l: 'Solo 5 kcal · Apto Keto y Ayuno', ico: '🌿', bg: '#ecfdf5', c: '#059669', target: 'nutricion' },
  { n: 'RSA-4113-2025', l: 'Autorización Sanitaria Invima', ico: '🛡️', bg: '#eff6ff', c: '#2b3a9e', target: 'nutricion' },
  { n: 'Envío Gratis', l: 'En packs de 2 y 3 frascos', ico: '🚚', bg: 'var(--qb-pink-soft)', c: 'var(--qb-plum)', target: 'precios' },
];


// 12 Formula Components & Functional Pillars with tailored dynamic SVGs
const QUIBI_COMPONENTS = [
  {
    title: "Vinagre de Cidra de Manzana",
    badge: "Activo 1 · Digestión",
    badgeBg: "#FEE2E2",
    badgeColor: "#DC2626",
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
        <path d="M12 7V3c1.5 0 3 .5 3 2" />
      </svg>
    ),
  },
  {
    title: "Glucomanano Konjac",
    badge: "Activo 2 · Saciedad",
    badgeBg: "#FEF3C7",
    badgeColor: "#D97706",
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v4c0 3 2 5.5 5 6.5-3 1-5 3.5-5 6.5v1h12v-1c0-3-2-5.5-5-6.5 3-1 5-3.5 5-6.5V3" />
        <path d="M9 7h6" />
        <path d="M9 17h6" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Té Verde (EGCG)",
    badge: "Activo 3 · Termogénesis",
    badgeBg: "#DCFCE7",
    badgeColor: "#16A34A",
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 4 13C4 8 8 3 13 3c4 0 7 3 7 7 0 5-4 10-9 10z" />
        <path d="M11 20c0-4.5 2-8 7-9" />
        <path d="M13 14c1.5 1 3 1.5 5 1.5" />
      </svg>
    ),
  },
  {
    title: "Extracto de Alcachofa",
    badge: "Activo 4 · Salud Hepática",
    badgeBg: "#CCFBF1",
    badgeColor: "#0D9488",
    iconBg: "#F0FDFA",
    iconColor: "#0D9488",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-2 3-3 6-3 9 0 3.5 1.5 6 3 9 1.5-3 3-5.5 3-9 0-3-1-6-3-9z" />
        <path d="M7 8c-1.5 2.5-2 5-2 7 0 2.5 2 4.5 4 6" />
        <path d="M17 8c1.5 2.5 2 5 2 7 0 2.5-2 4.5-4 6" />
        <path d="M9 12c-1.5 1-2.5 2.5-2.5 4" />
        <path d="M15 12c1.5 1 2.5 2.5 2.5 4" />
      </svg>
    ),
  },
  {
    title: "Berenjena & Nasunina",
    badge: "Activo 5 · Drenaje Lipídico",
    badgeBg: "#F3E8FF",
    badgeColor: "#7E22CE",
    iconBg: "#FAF5FF",
    iconColor: "#7E22CE",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c1.5 1.5 1.5 3.5 0 5-1.5-1.5-1.5-3.5 0-5z" />
        <path d="M9 6c1 1 2 1.5 3 1.5s2-.5 3-1.5c1 1 1.5 2.5 1 4-1 3-1 6 1 9a6 6 0 0 1-10 0c2-3 2-6 1-9-.5-1.5 0-3 1-4z" />
        <path d="M10 13c0 2 1 3.5 2 3.5s2-1.5 2-3.5" />
      </svg>
    ),
  },
  {
    title: "Spirulina Natural",
    badge: "Activo 6 · Micronutrientes",
    badgeBg: "#E0F2FE",
    badgeColor: "#0284C7",
    iconBg: "#F0F9FF",
    iconColor: "#0284C7",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9s-9-4.03-9-9a7 7 0 0 1 7-7c3.86 0 7 3.14 7 7a5 5 0 0 1-5 5 3 3 0 0 1-3-3c0-1.1.9-2 2-2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Picolinato de Cromo",
    badge: "Activo 7 · 40 mcg / Porción",
    badgeBg: "#E0E7FF",
    badgeColor: "#4338CA",
    iconBg: "#EEF2FF",
    iconColor: "#4338CA",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 20 6.5 20 15.5 12 20 4 15.5 4 6.5" />
        <path d="M12 7v5l3 3" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Aceite de Girasol",
    badge: "Activo 8 · Vehículo Lipídico",
    badgeBg: "#FEF9C3",
    badgeColor: "#CA8A04",
    iconBg: "#FEFCE8",
    iconColor: "#CA8A04",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
        <path d="M12 6c-2.5 3.5-4 5.5-4 7.5a4 4 0 0 0 8 0c0-2-1.5-4-4-7.5z" />
        <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Cubierta de Gelatina Blanda",
    badge: "Tecnología · Softgel Índigo",
    badgeBg: "#FCE7F3",
    badgeColor: "#DB2777",
    iconBg: "#FDF2F8",
    iconColor: "#DB2777",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="10" rx="5" transform="rotate(-30 12 12)" />
        <path d="M9.5 7.5 L14.5 16.5" />
        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Protección del Esmalte",
    badge: "Beneficio · Cero Acidez Oral",
    badgeBg: "#D1FAE5",
    badgeColor: "#059669",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-3.5 0-7 1.5-7 6 0 4 1.5 7 2.5 10 1 3 2.5 3 3.5 1 1-2 1-5 1-5s0 3 1 5c1 2 2.5 2 3.5-1 1-3 2.5-6 2.5-10 0-4.5-3.5-6-7-6z" />
        <path d="M8 8a2 2 0 0 1 2-2" />
        <path d="M18 5l1.5-1.5M19.5 5L18 3.5" />
      </svg>
    ),
  },
  {
    title: "0.7g Proteína por Cápsula",
    badge: "Nutrición · Sin Carbohidratos",
    badgeBg: "#DBEAFE",
    badgeColor: "#1D4ED8",
    iconBg: "#EFF6FF",
    iconColor: "#1D4ED8",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6c4 0 4 6 8 6s4-6 8-6" />
        <path d="M4 18c4 0 4-6 8-6s4 6 8 6" />
        <line x1="8" y1="6" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="18" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Calidad Certificada BPM",
    badge: "Garantía · Lote Controlado",
    badgeBg: "#F1F5F9",
    badgeColor: "#475569",
    iconBg: "#F8FAFC",
    iconColor: "#475569",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="6" />
        <path d="m9 9 2 2 4-4" />
        <path d="M8.5 14.5 6 21l6-2.5L18 21l-2.5-6.5" />
      </svg>
    ),
  },
];

// Commercial Packages
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
    id: "1-frasco",
    sku: "QB-PACK-01",
    title: "Tratamiento 1 Mes",
    shortTitle: "1 Frasco (60 Cáps.)",
    bottles: 1,
    capsules: 60,
    duration: "1 Frasco · 60 Cápsulas (30 Días)",
    priceNum: 96000,
    originalPriceNum: 115000,
    price: "$96.000",
    originalPrice: "$115.000",
    unitPriceLabel: "$96.000 por frasco",
    discount: "AHORRAS 16%",
    freeShipping: false,
    shippingLabel: "+ Envío nacional ($12.000)",
    featured: false,
    img: "/marketing/quibi/quibi-front.jpg",
    perks: [
      "1 Frasco original QB (60 cápsulas blandas con relleno líquido)",
      "Suministro completo para 30 días (2 cápsulas al día)",
      "0g Azúcar Añadido · Registro Invima RSA-4113-2025",
      "Pago en Línea (PSE / Tarjetas / Nequi) o Contra Entrega",
    ],
    badge: "INICIAL · 30 DÍAS",
  },
  {
    id: "2-frascos",
    sku: "QB-PACK-02",
    title: "Pack Transformación · 2 Meses",
    shortTitle: "2 Frascos (120 Cáps.)",
    bottles: 2,
    capsules: 120,
    duration: "2 Frascos · 120 Cápsulas (60 Días)",
    priceNum: 170000,
    originalPriceNum: 230000,
    price: "$170.000",
    originalPrice: "$230.000",
    unitPriceLabel: "$85.000 por frasco",
    discount: "AHORRAS $60.000 (26% OFF)",
    freeShipping: true,
    shippingLabel: "¡ENVÍO GRATIS A TODA COLOMBIA!",
    featured: true,
    img: "/marketing/quibi/quibi-3-bottles.jpg",
    perks: [
      "2 Frascos originales QB (120 cápsulas con relleno líquido)",
      "ENVÍO GRATIS a cualquier ciudad o municipio de Colombia",
      "Te sale a solo $85.000 cada frasco (Ahorras $22.000 vs individual)",
      "Pago en Línea o Contra Entrega en efectivo al recibir",
      "Guía nutricional y acompañamiento por WhatsApp",
    ],
    badge: "MÁS VENDIDO · ENVÍO GRATIS",
  },
  {
    id: "3-frascos",
    sku: "QB-PACK-03",
    title: "Pack Integral · 3 Meses",
    shortTitle: "3 Frascos (180 Cáps.)",
    bottles: 3,
    capsules: 180,
    duration: "3 Frascos · 180 Cápsulas (90 Días)",
    priceNum: 240000,
    originalPriceNum: 345000,
    price: "$240.000",
    originalPrice: "$345.000",
    unitPriceLabel: "$80.000 por frasco",
    discount: "AHORRAS $105.000 (30% OFF)",
    freeShipping: true,
    shippingLabel: "¡ENVÍO GRATIS PRIORITARIO!",
    featured: false,
    img: "/marketing/quibi/quibi-3-bottles.jpg",
    perks: [
      "3 Frascos originales QB (180 cápsulas con relleno líquido)",
      "ENVÍO GRATIS prioritario asegurado a nivel nacional",
      "El mejor precio por unidad: solo $80.000 cada frasco",
      "Ideal para tratamiento completo de 90 días o en pareja",
      "Pago en Línea (PSE / Tarjetas) o Contra Entrega",
    ],
    badge: "MEJOR PRECIO POR FRASCO",
  },
];

// Focused FAQs
const FAQS = [
  {
    q: "¿Son cápsulas o gomitas?",
    a: "Son CÁPSULAS BLANDAS de gelatina con RELLENO LÍQUIDO activo (softgels). No son gomas masticables ni contienen azúcar. Se tragan enteras con un vaso de agua para liberar el vinagre de manzana y el té verde directamente en el estómago sin tocar el esmalte dental.",
  },
  {
    q: "¿Cómo se toman para obtener mejores resultados?",
    a: "Toma 2 cápsulas al día: 1 cápsula 20 a 30 minutos antes del almuerzo y 1 cápsula antes de la cena, siempre acompañadas de un vaso lleno de agua (250 ml) para activar la fibra del glucomanano.",
  },
  {
    q: "¿Qué métodos de pago aceptan y cuánto tarda el envío?",
    a: "Puedes pagar en línea con tarjeta de crédito, débito, PSE, Nequi o Daviplata, o elegir Pago Contra Entrega para pagar en efectivo cuando recibas el paquete en tu puerta. El envío tarda de 1 a 3 días hábiles en ciudades principales.",
  },
  {
    q: "¿Tienen contraindicaciones o rompen el ayuno?",
    a: "Aportan 0g de azúcares añadidos y solo 5 calorías por cápsula, siendo aptas para dietas bajas en carbohidratos o keto. Como todo suplemento alimenticio, si estás en embarazo, lactancia o tienes una condición médica específica, consulta a tu médico.",
  },
];

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

type CartLine = { packId: string; qty: number };
type PaymentMethod = 'online_card_pse' | 'online_nequi' | 'cod';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  online_card_pse: 'Pago en Línea (Tarjeta / PSE)',
  online_nequi: 'Pago en Línea (Nequi / Daviplata)',
  cod: 'Pago Contra Entrega (Efectivo al recibir)',
};

const FREE_SHIPPING_THRESHOLD = 150000;
const SHIPPING_COST = 12000;

const loadCart = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l: CartLine) => l && PACKAGES.some((p) => p.id === l.packId) && Number(l.qty) > 0,
    );
  } catch {
    return [];
  }
};

// Scroll robusto: en este proyecto el contenedor que hace scroll puede ser <body>
// (html/body tienen overflow-x: hidden), por eso window.scrollTo no siempre funciona.
// scrollIntoView respeta el scroll-margin-top de .mkt [id] y funciona en ambos casos.
const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    window.history.replaceState(null, '', `#${id}`);
  } catch {
    // ignore
  }
};

const getScrollTop = () =>
  Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);

export default function QuibiPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ==========================================================================
  // CARRITO (persistente en localStorage) + CHECKOUT
  // Listo para conectar con Wompi / MercadoPago / Bold en handleCheckoutSubmit
  // ==========================================================================
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [cartBump, setCartBump] = useState(false);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online_card_pse');
  const [lastOrder, setLastOrder] = useState<{
    reference: string;
    lines: { title: string; qty: number; bottles: number; capsules: number; subtotal: number }[];
    subtotal: number;
    shipping: number;
    total: number;
    method: PaymentMethod;
  } | null>(null);

  // Título de pestaña con el lema
  useEffect(() => {
    const prev = document.title;
    document.title = `QUIBI · ${SLOGAN_A} ${SLOGAN_B}`;
    return () => {
      document.title = prev;
    };
  }, []);

  // Persistir carrito
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Slider automático
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Navbar "scrolled" — escucha scroll en window y en body (captura)
  useEffect(() => {
    const onScroll = () => setIsScrolled(getScrollTop() > 40);
    onScroll();
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
  }, []);

  // Scroll-spy: resalta en el menú la sección visible
  useEffect(() => {
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Si llegan con #seccion en la URL, ir a ella
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && NAV_ITEMS.some((n) => n.id === hash)) {
      const t = setTimeout(() => scrollToId(hash), 350);
      return () => clearTimeout(t);
    }
  }, []);

  // ESC cierra carrito / lightbox / menú
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setLightboxImg(null);
      setIsCartOpen(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
  }, []);

  const goTo = useCallback((e: React.MouseEvent | null, id: string) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    setActiveSection(id);
    scrollToId(id);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  // ---------- Cálculos del carrito ----------
  const cartLines = useMemo(
    () =>
      cart
        .map((l) => ({ ...l, pack: PACKAGES.find((p) => p.id === l.packId) as QuibiPackage }))
        .filter((l) => Boolean(l.pack)),
    [cart],
  );
  const cartCount = cartLines.reduce((acc, l) => acc + l.pack.bottles * l.qty, 0);
  const subtotalSale = cartLines.reduce((acc, l) => acc + l.pack.priceNum * l.qty, 0);
  const subtotalOriginal = cartLines.reduce((acc, l) => acc + l.pack.originalPriceNum * l.qty, 0);
  const totalSavings = subtotalOriginal - subtotalSale;
  const isEmpty = cartLines.length === 0;
  const qualifiesFreeShipping =
    !isEmpty && (cartLines.some((l) => l.pack.freeShipping) || subtotalSale >= FREE_SHIPPING_THRESHOLD);
  const shippingCost = isEmpty || qualifiesFreeShipping ? 0 : SHIPPING_COST;
  const finalTotal = subtotalSale + shippingCost;
  const onlySinglePack = !isEmpty && cartLines.every((l) => l.packId === '1-frasco');
  const qtyInCart = (packId: string) => cart.find((l) => l.packId === packId)?.qty || 0;

  const openCart = (tab: 'cart' | 'checkout' = 'cart') => {
    setIsMobileMenuOpen(false);
    setDrawerTab(tab);
    setIsCartOpen(true);
  };

  const addToCart = (packId: string) => {
    setCart((prev) => {
      const exists = prev.find((l) => l.packId === packId);
      if (exists) return prev.map((l) => (l.packId === packId ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { packId, qty: 1 }];
    });
    setCartBump(true);
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => setCartBump(false), 500);
    openCart('cart');
  };

  const changeQty = (packId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.packId === packId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (packId: string) => setCart((prev) => prev.filter((l) => l.packId !== packId));

  const upgradeToPack2 = () => {
    setCart((prev) => {
      const singles = prev.find((l) => l.packId === '1-frasco')?.qty || 0;
      const rest = prev.filter((l) => l.packId !== '1-frasco');
      const pack2 = rest.find((l) => l.packId === '2-frascos');
      const qty = Math.max(1, Math.ceil(singles / 2));
      if (pack2) return rest.map((l) => (l.packId === '2-frascos' ? { ...l, qty: l.qty + qty } : l));
      return [...rest, { packId: '2-frascos', qty }];
    });
  };

  // ---------- Checkout (punto de conexión con la pasarela) ----------
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty) {
      setDrawerTab('cart');
      return;
    }
    if (!clientName.trim() || !clientPhone.trim() || !clientCity.trim() || !clientAddress.trim()) {
      alert('Por favor completa los datos de entrega para procesar tu orden.');
      return;
    }

    const reference = `QB-${Date.now().toString().slice(-6)}`;
    const order = {
      reference,
      lines: cartLines.map((l) => ({
        title: l.pack.title,
        qty: l.qty,
        bottles: l.pack.bottles * l.qty,
        capsules: l.pack.capsules * l.qty,
        subtotal: l.pack.priceNum * l.qty,
      })),
      subtotal: subtotalSale,
      shipping: shippingCost,
      total: finalTotal,
      method: paymentMethod,
    };

    // TODO(pasarela): crear la transacción en el backend con este payload
    // (amountInCents, reference, customer) y redirigir al checkout de Wompi / MercadoPago / Bold.
    const checkoutPayload = {
      ...order,
      amountInCents: finalTotal * 100,
      currency: 'COP',
      items: cartLines.map((l) => ({ sku: l.pack.sku, qty: l.qty, unitPrice: l.pack.priceNum })),
      customer: {
        name: clientName.trim(),
        document: clientDoc.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        city: clientCity.trim(),
        address: clientAddress.trim(),
      },
    };
    console.info('[QUIBI checkout payload]', checkoutPayload);

    setLastOrder(order);
    setCart([]);
    setDrawerTab('success');
  };

  const confirmOrderOnWhatsApp = () => {
    if (!lastOrder) return;
    const lines = lastOrder.lines
      .map((l) => `• ${l.title} x${l.qty} (${l.bottles} frascos / ${l.capsules} cápsulas) — ${formatCOP(l.subtotal)}`)
      .join('\n');
    const msg =
      `*ORDEN QUIBI #${lastOrder.reference}*\n\n` +
      `📦 *Productos:*\n${lines}\n\n` +
      `💰 Subtotal: ${formatCOP(lastOrder.subtotal)}\n` +
      `🚚 Envío: ${lastOrder.shipping === 0 ? 'GRATIS' : formatCOP(lastOrder.shipping)}\n` +
      `💵 *TOTAL: ${formatCOP(lastOrder.total)}*\n` +
      `💳 Método: ${PAYMENT_LABELS[lastOrder.method]}\n\n` +
      `👤 *Datos de envío:*\n` +
      `• Nombre: ${clientName}\n` +
      (clientDoc ? `• Cédula/NIT: ${clientDoc}\n` : '') +
      `• Teléfono: ${clientPhone}\n` +
      (clientEmail ? `• Correo: ${clientEmail}\n` : '') +
      `• Ciudad: ${clientCity}\n` +
      `• Dirección: ${clientAddress}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  const activeSlideData = SLIDES[currentSlide];

  return (
    <div className="mkt qbx">
      {isMobileMenuOpen && (
        <div className="mkt-mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      )}

      {/* =====================================================================
          NAVBAR (logo + lema · enlaces con scroll-spy · carrito)
          ===================================================================== */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a className="mkt-nav-logo" aria-label="QUIBI — Inicio" href="#inicio" onClick={(e) => goTo(e, 'inicio')}>
            <div className="qb-logo-badge">QB</div>
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">
                QUIBI<span style={{ color: 'var(--qb-plum-2)' }}>.co</span>
              </span>
              <span className="mkt-logo-sub">
                {SLOGAN_A} {SLOGAN_B}
              </span>
            </div>
          </a>

          <div className="mkt-nav-links">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={activeSection === item.id ? 'is-active' : ''}
                aria-current={activeSection === item.id ? 'true' : undefined}
                onClick={(e) => goTo(e, item.id)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mkt-nav-cta">
            <button
              type="button"
              className={`qb-cart-trigger ${cartBump ? 'bump' : ''}`}
              onClick={() => openCart('cart')}
              aria-label={`Abrir carrito (${cartCount} frascos)`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              <span className="qb-cart-badge">{cartCount}</span>
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

        {isMobileMenuOpen && (
          <div className="mkt-mobile-menu-drawer">
            <div className="mkt-mobile-menu-links">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} type="button" className="mkt-mobile-link" onClick={() => goTo(null, item.id)}>
                  <span className="mkt-mobile-link-icon">{item.icon}</span>
                  <div className="mkt-mobile-link-info">
                    <span className="mkt-mobile-link-title">{item.label}</span>
                    <span className="mkt-mobile-link-desc">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mkt-mobile-menu-divider" />
            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => openCart('cart')}
              >
                <ShoppingCart className="w-4 h-4" />
                Ver carrito ({cartCount})
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* =====================================================================
          1. HERO SLIDER (#inicio)
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

                  <div className="qb-slide-copy">
                    <div className="qb-kicker qb-in" style={{ '--d': '0.05s' } as React.CSSProperties}>
                      <span className="dot" />
                      <span>{slide.kicker}</span>
                    </div>

                    {index === 0 ? (
                      <h1 className="qb-in" style={{ '--d': '0.12s' } as React.CSSProperties}>{slide.title}</h1>
                    ) : (
                      <h2 className="qb-in" style={{ '--d': '0.12s' } as React.CSSProperties}>{slide.title}</h2>
                    )}

                    <p className="qb-slide-sub qb-in" style={{ '--d': '0.2s' } as React.CSSProperties}>
                      {slide.sub}
                    </p>

                    <div className="qb-hero-price-strip qb-in" style={{ '--d': '0.26s' } as React.CSSProperties}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, display: 'block' }}>
                          FRASCO X 60 CÁPSULAS
                        </span>
                        <span className="now">$96.000</span> <span className="old">$115.000</span>
                      </div>
                      <span className="tag">o $85.000 c/u en Pack x2</span>
                    </div>

                    <div className="qb-slide-cta qb-in" style={{ '--d': '0.32s' } as React.CSSProperties}>
                      <button
                        type="button"
                        className="btn btn-lime"
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => addToCart('1-frasco')}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Agregar al Carrito
                      </button>
                      <a
                        href="#precios"
                        className="btn btn-glass"
                        tabIndex={isActive ? 0 : -1}
                        onClick={(e) => goTo(e, 'precios')}
                      >
                        Ver los 3 Packs
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="qb-slide-media">
                    <div className="qb-frame-wrap">
                      <div className="qb-glow" />
                      <div
                        className={`qb-frame ${slide.contain ? 'fit-contain' : ''}`}
                        onClick={() => setLightboxImg(slide.img)}
                        title="Clic para ampliar"
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

                    <div className="qb-thumbs" aria-label="Fotos del producto">
                      {SLIDES.map((s, tidx) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`qb-thumb ${tidx === currentSlide ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(tidx)}
                          title={s.imgTitle}
                          tabIndex={isActive ? 0 : -1}
                        >
                          <img src={s.img} alt={s.imgTitle} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

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

          {/* Highlights → cada uno lleva a la sección que lo explica */}
          <div className="qb-stats">
            {STATS.map((stat) => (
              <a
                key={stat.n}
                href={`#${stat.target}`}
                className="qb-stat"
                onClick={(e) => goTo(e, stat.target)}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <div className="qb-stat-ico" style={{ background: stat.bg, color: stat.c }}>
                  <span style={{ fontSize: 21 }}>{stat.ico}</span>
                </div>
                <div>
                  <div className="qb-stat-n">{stat.n}</div>
                  <div className="qb-stat-l">{stat.l}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. FÓRMULA (#componentes)
          ===================================================================== */}
      <section id="componentes" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              FORMULACIÓN
            </span>
            <h2 className="display">
              Activos botánicos en cada <em>cápsula blanda</em>
            </h2>
            <p>
              Extractos concentrados en gelatina blanda con centro líquido que actúan en el estómago, sin acidez en la boca.
            </p>
          </div>

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

          <div className="qb-routine-strip">
            <div className="qb-routine-item">
              <div className="qb-routine-num">01</div>
              <div>
                <h4>2 cápsulas al día</h4>
                <p>1 cápsula 20 minutos antes del almuerzo y 1 antes de la cena.</p>
              </div>
            </div>
            <div className="qb-routine-item">
              <div className="qb-routine-num">02</div>
              <div>
                <h4>Con un vaso de agua</h4>
                <p>250 ml de agua hidratan el glucomanano y generan plenitud natural.</p>
              </div>
            </div>
            <div className="qb-routine-item">
              <div className="qb-routine-num">03</div>
              <div>
                <h4>Constancia diaria</h4>
                <p>Pequeños hábitos sostenidos en el tiempo generan grandes cambios.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. VIDEO (#video)
          ===================================================================== */}
      <section id="video" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              CONÓCELO DE CERCA
            </span>
            <h2 className="display">
              Así es <em>QUIBI</em> en la vida real
            </h2>
            <p>El frasco oficial de 60 unidades y sus cápsulas blandas azul índigo con relleno líquido.</p>
          </div>

          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }} />
                Cápsula blanda · Relleno líquido
              </span>
              <span className="vid-tech-pill">Invima RSA-4113-2025 · 60 unidades</span>
            </div>
            <div className="vid-control-right">
              <button
                type="button"
                className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(false)}
              >
                🖼️ Presentación
              </button>
              <button
                type="button"
                className={`vid-toggle-btn ${showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(true)}
              >
                ▶️ {QUIBI_VIDEO_SRC ? 'Reproducir video' : 'Ver recorrido'}
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Thermix, quiero información sobre las cápsulas QUIBI')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vid-ext-link"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Asesoría WhatsApp ↗
              </a>
            </div>
          </div>

          <div className="vid-shell vid-poster-mode">
            {!showVideo ? (
              <div className="qb-poster" onClick={() => setShowVideo(true)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowVideo(true); } }}
              >
                <div className="qb-poster-copy">
                  <span
                    className="vid-live-pill"
                    style={{ background: 'rgba(246, 168, 205, 0.2)', color: 'var(--qb-pink)', borderColor: 'rgba(246, 168, 205, 0.35)' }}
                  >
                    Presentación oficial · 60 unidades
                  </span>
                  <h3>Sin sabor ácido y sin dañar tu esmalte dental</h3>
                  <p>
                    Olvida el vinagre líquido tradicional y el azúcar de las gomitas: cada cápsula entrega la dosis exacta de activos botánicos.
                  </p>
                  <div className="qb-play-btn">
                    <span className="qb-play-circle">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>
                    <span>{QUIBI_VIDEO_SRC ? 'Ver video' : 'Ver recorrido del producto'}</span>
                  </div>
                </div>
                <div className="qb-poster-visual">
                  <img src="/marketing/quibi/quibi-3-bottles.jpg" alt="Presentación oficial QUIBI" />
                </div>
              </div>
            ) : QUIBI_VIDEO_SRC ? (
              <div style={{ position: 'relative', width: '100%', height: 540, background: '#000' }}>
                <video
                  src={QUIBI_VIDEO_SRC}
                  autoPlay
                  controls
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div className="qb-reel">
                {SLIDES.map((s, i) => (
                  <img key={s.id} src={s.img} alt={s.imgTitle} style={{ animationDelay: `${i * 3.5}s` }} />
                ))}
                <div className="qb-reel-top">
                  <span className="qb-reel-live">
                    <i />
                    Recorrido real del producto
                  </span>
                  <button type="button" className="qb-reel-close" onClick={() => setShowVideo(false)}>
                    ✕ Cerrar
                  </button>
                </div>
                <div className="qb-reel-bottom">
                  <div>
                    <strong>QUIBI · 60 cápsulas blandas</strong>
                    <span>{SLOGAN_A} {SLOGAN_B}</span>
                  </div>
                  <button type="button" className="btn btn-lime btn-sm" onClick={() => addToCart('1-frasco')}>
                    <ShoppingBag className="w-4 h-4" />
                    Agregar al carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. NUTRICIÓN & INVIMA (#nutricion)
          ===================================================================== */}
      <section id="nutricion" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              TRANSPARENCIA
            </span>
            <h2 className="display">
              Tabla nutricional y <em>registro Invima</em>
            </h2>
            <p>Valores declarados en el envase oficial fabricado por ALIMENTOS MYC para THERMIX.</p>
          </div>

          <div className="qb-nutri">
            <div className="qb-table-card">
              <div className="qb-table-head">
                <div>
                  <h3>Información Nutricional</h3>
                  <span>Porción: 1 cápsula con relleno (2g)</span>
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
                    <td>Azúcares añadidos</td>
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
                    <b>THERMIX · 305 4656064</b>
                  </div>
                  <div>
                    <span>Código EAN:</span>
                    <b>7709026096235</b>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="qb-label-preview"
                onClick={() => setLightboxImg('/marketing/quibi/quibi-nutrition.jpg')}
                style={{ textAlign: 'left', width: '100%', font: 'inherit' }}
              >
                <img src="/marketing/quibi/quibi-nutrition.jpg" alt="Etiqueta nutricional real" />
                <div>
                  <h4>🔍 Ver la etiqueta real del envase</h4>
                  <p>Amplía la foto de la tabla nutricional impresa en el frasco.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PACKS Y PRECIOS (#precios)
          ===================================================================== */}
      <section id="precios" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              TIENDA OFICIAL
            </span>
            <h2 className="display">
              Elige tu pack y <em>empieza tu hábito</em>
            </h2>
            <p>Agrega al carrito y paga en línea o contra entrega. Envío gratis en packs de 2 y 3 frascos.</p>
          </div>

          <div className="price" style={{ maxWidth: 1080, margin: '0 auto' }}>
            {PACKAGES.map((pkg) => {
              const inCart = qtyInCart(pkg.id);
              return (
                <div key={pkg.id} className={`pcard qb-pcard ${pkg.featured ? 'feat-plan' : ''} ${inCart ? 'qb-selected' : ''}`}>
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
                      onClick={() => addToCart(pkg.id)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{inCart ? 'Agregar otro' : 'Agregar al Carrito'}</span>
                    </button>
                    {inCart > 0 && (
                      <button
                        type="button"
                        className="qb-incart"
                        onClick={() => openCart('cart')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        En tu carrito (x{inCart}) · Ver carrito
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
                <strong>Pago seguro o contra entrega</strong>
                <span>Paga con tu método favorito o en efectivo al recibir el pedido.</span>
              </div>
            </div>
            <div className="qb-gateway-pills">
              <span className="qb-pay-pill">💳 Visa / Mastercard</span>
              <span className="qb-pay-pill">🏦 PSE</span>
              <span className="qb-pay-pill">📱 Nequi / Daviplata</span>
              <span className="qb-pay-pill">💵 Contra Entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. FAQ (#faq)
          ===================================================================== */}
      <section id="faq" className="band" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              PREGUNTAS FRECUENTES
            </span>
            <h2 className="display">
              Resolvemos tus <em>dudas</em>
            </h2>
            <p>Consumo, pagos y envíos de las cápsulas QUIBI.</p>
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
          CARRITO · ISLA FLOTANTE
          ===================================================================== */}
      {isCartOpen && (
        <>
          <div className="qb-drawer-backdrop" onClick={() => setIsCartOpen(false)} />
          <aside className="qb-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras">
            <div className="qb-drawer-head">
              <div className="qb-drawer-title">
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--qb-pink)' }} />
                <div>
                  {drawerTab === 'cart' ? 'Tu carrito' : drawerTab === 'checkout' ? 'Envío y pago' : '¡Orden lista!'}
                  <small>{SLOGAN_A} {SLOGAN_B}</small>
                </div>
              </div>
              <button type="button" className="qb-drawer-close" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">
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
                  1. Carrito ({cartCount})
                </button>
                <button
                  type="button"
                  className={`qb-drawer-step ${drawerTab === 'checkout' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('checkout')}
                  disabled={isEmpty}
                >
                  2. Envío y pago
                </button>
              </div>
            )}

            <div className="qb-drawer-body">
              {drawerTab === 'cart' && isEmpty && (
                <div className="qb-cart-empty">
                  <div className="qb-cart-empty-ico">
                    <ShoppingCart className="w-7 h-7" />
                  </div>
                  <h4>Tu carrito está vacío</h4>
                  <p>Elige tu pack de cápsulas QUIBI. Envío gratis desde 2 frascos.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                    onClick={() => {
                      setIsCartOpen(false);
                      goTo(null, 'precios');
                    }}
                  >
                    Ver packs y precios
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {drawerTab === 'cart' && !isEmpty && (
                <>
                  <div className="qb-ship-banner">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>
                      {qualifiesFreeShipping
                        ? '¡Tu pedido tiene ENVÍO GRATIS a toda Colombia!'
                        : `Te faltan ${formatCOP(FREE_SHIPPING_THRESHOLD - subtotalSale)} para envío gratis, o cambia al Pack x2.`}
                    </span>
                  </div>

                  {cartLines.map((line) => (
                    <div key={line.packId} className="qb-cart-item">
                      <img src={line.pack.img} alt={line.pack.title} />
                      <div className="qb-cart-item-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <h4>{line.pack.title}</h4>
                          <button
                            type="button"
                            className="qb-line-remove"
                            onClick={() => removeLine(line.packId)}
                            aria-label={`Quitar ${line.pack.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <small>{line.pack.duration}</small>
                        <div className="qb-qty-row">
                          <div className="qb-qty-ctrl">
                            <button type="button" onClick={() => changeQty(line.packId, -1)} aria-label="Disminuir">
                              <Minus className="w-3.5 h-3.5 mx-auto" />
                            </button>
                            <span>{line.qty}</span>
                            <button type="button" onClick={() => changeQty(line.packId, 1)} aria-label="Aumentar">
                              <Plus className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--muted)' }}>
                              {formatCOP(line.pack.originalPriceNum * line.qty)}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--qb-plum)' }}>
                              {formatCOP(line.pack.priceNum * line.qty)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {onlySinglePack && (
                    <div className="qb-upsell-box">
                      <h5>✨ Ahorra más con el Pack x2</h5>
                      <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                        2 frascos por $170.000 ($85.000 c/u) con envío gratis.
                      </p>
                      <button type="button" className="btn btn-lime btn-sm" onClick={upgradeToPack2}>
                        Cambiar a Pack x2
                      </button>
                    </div>
                  )}
                </>
              )}

              {drawerTab === 'checkout' && (
                <form id="quibi-checkout-form" onSubmit={handleCheckoutSubmit}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--qb-plum)' }}>
                    1. Datos de entrega
                  </h4>
                  <div className="qb-fields">
                    <div className="qb-field">
                      <label htmlFor="qb-name">Nombre y apellido *</label>
                      <input id="qb-name" type="text" autoComplete="name" placeholder="Ej. Laura Gómez" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                    </div>
                    <div className="qb-field">
                      <label htmlFor="qb-doc">Cédula / NIT</label>
                      <input id="qb-doc" type="text" placeholder="Ej. 1037654321" value={clientDoc} onChange={(e) => setClientDoc(e.target.value)} />
                    </div>
                    <div className="qb-field">
                      <label htmlFor="qb-phone">Celular / WhatsApp *</label>
                      <input id="qb-phone" type="tel" autoComplete="tel" placeholder="Ej. 310 123 4567" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                    </div>
                    <div className="qb-field">
                      <label htmlFor="qb-email">Correo</label>
                      <input id="qb-email" type="email" autoComplete="email" placeholder="tu@correo.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    </div>
                    <div className="qb-field">
                      <label htmlFor="qb-city">Ciudad y departamento *</label>
                      <input id="qb-city" type="text" autoComplete="address-level2" placeholder="Ej. Medellín, Antioquia" value={clientCity} onChange={(e) => setClientCity(e.target.value)} required />
                    </div>
                    <div className="qb-field">
                      <label htmlFor="qb-address">Dirección *</label>
                      <input id="qb-address" type="text" autoComplete="street-address" placeholder="Calle / Cra #, barrio" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} required />
                    </div>
                  </div>

                  <h4 style={{ margin: '20px 0 10px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--qb-plum)' }}>
                    2. Método de pago
                  </h4>
                  <div className="qb-pay-methods" role="radiogroup" aria-label="Método de pago">
                    {([
                      { id: 'online_card_pse', title: '💳 Tarjeta o PSE', tag: 'Pago en línea', desc: 'Visa, Mastercard, Amex y todos los bancos vía PSE.' },
                      { id: 'online_nequi', title: '📱 Nequi / Daviplata', tag: 'Inmediato', desc: 'Paga desde tu celular sin costo adicional.' },
                      { id: 'cod', title: '💵 Contra entrega', tag: 'Pagas al recibir', desc: 'Pagas en efectivo al transportador cuando recibas el pedido.' },
                    ] as { id: PaymentMethod; title: string; tag: string; desc: string }[]).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={paymentMethod === m.id}
                        className={`qb-pay-option ${paymentMethod === m.id ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod(m.id)}
                        style={{ font: 'inherit', width: '100%' }}
                      >
                        <div className="qb-pay-option-top">
                          <strong>{m.title}</strong>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--qb-plum)', background: '#fff', padding: '2px 8px', borderRadius: 9999 }}>
                            {m.tag}
                          </span>
                        </div>
                        <p>{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </form>
              )}

              {drawerTab === 'success' && lastOrder && (
                <div style={{ textAlign: 'center', padding: '18px 4px' }}>
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
                    ORDEN #{lastOrder.reference}
                  </span>
                  <h3 style={{ margin: '12px 0 8px', fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>
                    ¡Tu orden fue generada!
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 20 }}>
                    Total <strong>{formatCOP(lastOrder.total)}</strong> · {PAYMENT_LABELS[lastOrder.method]}. Confirma el despacho
                    {lastOrder.method === 'cod' ? '' : ' y recibe tu link de pago'} con nuestro equipo:
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                    onClick={confirmOrderOnWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Confirmar por WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn btn-glass"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setIsCartOpen(false);
                      setDrawerTab('cart');
                    }}
                  >
                    Seguir viendo QUIBI
                  </button>
                </div>
              )}
            </div>

            {drawerTab !== 'success' && !isEmpty && (
              <div className="qb-drawer-foot">
                <div className="qb-sum-row">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'frasco' : 'frascos'})</span>
                  <span>{formatCOP(subtotalSale)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="qb-sum-row" style={{ color: '#059669', fontWeight: 700 }}>
                    <span>Ahorro incluido</span>
                    <span>{formatCOP(totalSavings)}</span>
                  </div>
                )}
                <div className="qb-sum-row">
                  <span>Envío nacional</span>
                  <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#059669' : 'var(--ink)' }}>
                    {shippingCost === 0 ? 'GRATIS' : formatCOP(shippingCost)}
                  </span>
                </div>
                <div className="qb-sum-row total">
                  <span>Total</span>
                  <span>{formatCOP(finalTotal)}</span>
                </div>

                {drawerTab === 'cart' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
                    onClick={() => setDrawerTab('checkout')}
                  >
                    Continuar al pago
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
                    {paymentMethod === 'cod' ? `Confirmar pedido · ${formatCOP(finalTotal)}` : `Pagar · ${formatCOP(finalTotal)}`}
                  </button>
                )}
              </div>
            )}
          </aside>
        </>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="qb-lightbox" onClick={() => setLightboxImg(null)}>
          <button type="button" onClick={() => setLightboxImg(null)} aria-label="Cerrar imagen">
            ✕
          </button>
          <img src={lightboxImg} alt="Vista ampliada QUIBI" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Barra fija móvil → abre el carrito */}
      {!isCartOpen && (
        <div className="qb-sticky">
          <div>
            <b>QUIBI · 60 cápsulas</b>
            <small>{cartCount > 0 ? `${cartCount} en carrito · ${formatCOP(finalTotal)}` : 'Desde $96.000 · Envío nacional'}</small>
          </div>
          <button type="button" className="btn btn-lime btn-sm" onClick={() => (cartCount > 0 ? openCart('cart') : goTo(null, 'precios'))}>
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 ? `Carrito (${cartCount})` : 'Ver packs'}
          </button>
        </div>
      )}

      {/* =====================================================================
          FOOTER (estilo WAPPY)
          ===================================================================== */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }} />
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }} />

        <div className="wrap">
          <div className="foot-cta">
            <h3 className="display">
              {SLOGAN_A} <em>{SLOGAN_B}</em>.
            </h3>
            <p>Empieza hoy con tus cápsulas blandas QUIBI de vinagre de manzana y té verde. Envío a toda Colombia.</p>
            <div className="hero-cta" style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a href="#precios" className="btn btn-primary" onClick={(e) => goTo(e, 'precios')}>
                <ShoppingBag className="w-4 h-4" />
                Ver packs y precios
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Thermix, quiero pedir las cápsulas QUIBI')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glass"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp 305 4656064
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
                Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. Con Glucomanano, Alcachofa, Berenjena, Spirulina y Picolinato de Cromo. Invima RSA-4113-2025. Fabricado por ALIMENTOS MYC (Tona, Santander) para THERMIX.
              </p>
            </div>
          </div>

          <div className="foot-word">QUIBI</div>

          <div className="foot-bottom">
            <span>© 2026 THERMIX · ALIMENTOS MYC · Colombia. Todos los derechos reservados.</span>
            <div className="foot-legal">
              {NAV_ITEMS.filter((n) => n.id !== 'inicio').map((n) => (
                <a key={n.id} href={`#${n.id}`} onClick={(e) => goTo(e, n.id)}>
                  {n.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
