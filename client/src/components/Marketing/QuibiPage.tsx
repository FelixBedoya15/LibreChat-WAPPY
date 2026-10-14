import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  MessageCircle, 
  ShoppingBag, 
  X, 
  Truck, 
  Droplet
} from 'lucide-react';
import './marketing.css';
import './quibi.css';

// Authentic manufactured product images (100% respecting the real product)
const QUIBI_GALLERY = [
  {
    id: '3-bottles',
    url: '/marketing/quibi/quibi-3-bottles.jpg',
    title: 'Presentación Oficial QUIBI (QB)',
    caption: 'Frente, tabla nutricional y los 5 potentes activos formulados en el envase original.',
  },
  {
    id: 'front',
    url: '/marketing/quibi/quibi-front.jpg',
    title: 'Envase Original y Cápsulas con Relleno Líquido',
    caption: 'Frasco de 60 unidades con cápsulas blandas de gelatina color azul índigo.',
  },
  {
    id: 'top-view',
    url: '/marketing/quibi/quibi-top-view.jpg',
    title: 'Vista Superior y Detalle de Cápsulas',
    caption: 'Perlas de gelatina blanda con centro líquido activo de vinagre de manzana y té verde.',
  },
  {
    id: 'nutrition',
    url: '/marketing/quibi/quibi-nutrition.jpg',
    title: 'Información Nutricional & Invima Oficial',
    caption: 'Autorización Invima RSA-4113-2025, 0g de azúcares añadidos y solo 5 kcal por porción.',
  },
  {
    id: 'close',
    url: '/marketing/quibi/quibi-close.jpg',
    title: 'Detalle de Marca Original QB',
    caption: 'Alimento a base de gelatina con relleno líquido para un estilo de vida saludable.',
  },
];

// 12 Functional Components styled exactly as WAPPY's Tools Grid (.intg .i) from Screenshot 4
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
        <polyline points="2 17 12 22 22 17" />
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
    title: 'Picolinato de Cromo',
    badge: 'Mineral Clave · Cero Antojos',
    badgeBg: '#DBEAFE',
    badgeColor: '#2563EB',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: 'Spirulina Orgánica',
    badge: 'Ficocianina · Color Índigo',
    badgeBg: '#E0E7FF',
    badgeColor: '#4338CA',
    iconBg: '#EEF2FF',
    iconColor: '#4338CA',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12s1.5-2 4-2 4 2 4 2-1.5 2-4 2-4-2-4-2z" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    title: 'Cápsula Relleno Líquido',
    badge: 'Tecnología · Cero Acidez',
    badgeBg: '#E0F2FE',
    badgeColor: '#0284C7',
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    title: '0g Azúcares Añadidos',
    badge: 'Keto Friendly · 5 kcal/porción',
    badgeBg: '#ECFDF5',
    badgeColor: '#059669',
    iconBg: '#F0FDF4',
    iconColor: '#059669',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: 'Proteína de Gelatina',
    badge: 'Estructura · 0.7g Proteína',
    badgeBg: '#FCE7F3',
    badgeColor: '#BE185D',
    iconBg: '#FDF2F8',
    iconColor: '#BE185D',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Registro Invima Oficial',
    badge: 'RSA-4113-2025 · Avalado',
    badgeBg: '#FEF9C3',
    badgeColor: '#854D0E',
    iconBg: '#FEFCE8',
    iconColor: '#854D0E',
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
      'Guía digital de toma y nutrición por WhatsApp',
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
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className="mkt">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="mkt-mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Capsule Navbar (Exact WAPPY style) */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          {/* Brand Logo: Clean icon + QUIBI */}
          <a
            className="mkt-nav-logo"
            aria-label="QUIBI - Cápsulas con Relleno Líquido"
            href="#inicio"
            onClick={(e) => scrollToSection(e, 'inicio')}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #4a102f 0%, #2f071d 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 17,
                boxShadow: '0 4px 12px rgba(74, 16, 47, 0.25)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              QB
            </div>
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">QUIBI<span style={{ color: '#16a34a' }}>.co</span></span>
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

      {/* Hero Section with Light Background and Decorative Clouds */}
      <header id="inicio" className="hero">
        <div className="cloud" style={{ top: 90, left: -60, width: 300, height: 120 }} />
        <div className="cloud" style={{ top: 240, right: -40, width: 260, height: 110 }} />
        <div className="cloud" style={{ bottom: 60, left: '18%', width: 240, height: 100, opacity: 0.5 }} />

        <div className="wrap hero-inner" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ margin: '0 auto 16px' }}>
            <span className="dot" style={{ background: '#10b981' }} />
            <span>CÁPSULAS BLANDAS CON RELLENO LÍQUIDO · INVIMA RSA-4113-2025</span>
          </div>

          <h1 className="display" style={{ margin: '14px auto 16px', maxWidth: 960 }}>
            El poder del <span style={{ color: '#2563eb' }}>Vinagre de Manzana</span> en cápsulas blandas con relleno líquido.
          </h1>

          <p style={{ maxWidth: 760, margin: '0 auto 26px', fontSize: 18, color: 'var(--muted)', lineHeight: 1.6 }}>
            Dile adiós al vinagre líquido que quema tu garganta y erosiona tu esmalte dental. 
            Disfruta la primera fórmula con <strong>centro líquido activo</strong>, 
            cero azúcar añadida y la sinergia de <strong>Glucomanano, Té Verde, Alcachofa, Berenjena y Cromo</strong>.
          </p>

          <div className="hero-cta" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
            <button className="btn btn-primary" onClick={() => scrollToSection(null, 'precios')}>
              Pedir con Descuento de Lanzamiento
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
              Pedir por WhatsApp (305 4656064)
            </a>
          </div>

          {/* Authentic Manufactured Product Showcase */}
          <div id="capsulas" style={{ maxWidth: 940, margin: '0 auto', background: '#fff', borderRadius: 28, padding: 18, border: '1.5px solid var(--line)', boxShadow: '0 20px 45px -15px rgba(20, 40, 80, 0.12)' }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20 }}>
              <img
                src={QUIBI_GALLERY[selectedImgIndex].url}
                alt={QUIBI_GALLERY[selectedImgIndex].title}
                style={{
                  width: '100%',
                  maxHeight: 520,
                  objectFit: 'contain',
                  background: '#f8fafc',
                  display: 'block',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                }}
                onClick={() => setLightboxImg(QUIBI_GALLERY[selectedImgIndex].url)}
                title="Haz clic para ampliar la imagen del producto real"
              />
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: 14, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--line)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{QUIBI_GALLERY[selectedImgIndex].title}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{QUIBI_GALLERY[selectedImgIndex].caption}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 9999 }}>
                  Ver Foto Real 🔍
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails (Original 5 Product Photos) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 14 }}>
              {QUIBI_GALLERY.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImgIndex(idx)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    border: selectedImgIndex === idx ? '2.5px solid #2563EB' : '1.5px solid var(--line)',
                    padding: 2,
                    background: '#f8fafc',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transform: selectedImgIndex === idx ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.2s',
                  }}
                  title={img.title}
                >
                  <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Componentes / Herramientas Grid (EXACT WAPPY Tools Grid style from Screenshot 4) */}
      <section id="componentes" className="band">
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" style={{ background: '#10b981' }} />
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

      {/* Video Section (EXACT WAPPY Video Section style from Screenshot 5 using the Real Product) */}
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
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => setShowVideo(true)}
                title="Clic para reproducir demostración"
              >
                <img
                  src="/marketing/quibi/quibi-3-bottles.jpg"
                  alt="Envase y Cápsulas Oficiales QUIBI"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#f8fafc',
                    display: 'block',
                    transition: 'transform 0.4s ease',
                  }}
                  className="vid-poster-img"
                />

                <div className="vid-tag">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#0F172A' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    Envase Oficial y Relleno Líquido
                  </div>
                </div>

                <div className="vid-play">
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: 'var(--lime)',
                      color: 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 34px rgba(199, 243, 3, 0.45)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
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

      {/* Official Nutrition Facts & Invima */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start', maxWidth: 1040, margin: '0 auto' }}>
            {/* Nutrition Table */}
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid var(--line)', overflow: 'hidden', boxShadow: '0 8px 24px rgba(20, 40, 80, 0.06)' }}>
              <div style={{ background: '#4a102f', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Información Nutricional</h3>
                  <span style={{ fontSize: 11, color: '#fbcfe8' }}>Porción: 1 Cápsula con relleno (2g)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbcfe8', display: 'block' }}>Porciones</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>60</span>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--line)', textAlign: 'left', color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 18px' }}>Nutriente</th>
                    <th style={{ padding: '10px 14px' }}>Por 100g</th>
                    <th style={{ padding: '10px 18px' }}>Por porción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 18px' }}><strong>Calorías (kcal)</strong></td>
                    <td style={{ padding: '10px 14px' }}>240</td>
                    <td style={{ padding: '10px 18px' }}><strong style={{ color: '#059669' }}>5 kcal</strong></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <td style={{ padding: '10px 18px' }}>Grasa total</td>
                    <td style={{ padding: '10px 14px' }}>0 g</td>
                    <td style={{ padding: '10px 18px' }}>0 g</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 18px' }}>Carbohidratos totales</td>
                    <td style={{ padding: '10px 14px' }}>25 g</td>
                    <td style={{ padding: '10px 18px' }}>0.1 g</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <td style={{ padding: '10px 18px' }}>Azúcares totales</td>
                    <td style={{ padding: '10px 14px' }}>0 g</td>
                    <td style={{ padding: '10px 18px' }}><strong style={{ color: '#16a34a' }}>0 g</strong></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 18px' }}>Azúcares Añadidos</td>
                    <td style={{ padding: '10px 14px' }}>0 g</td>
                    <td style={{ padding: '10px 18px' }}><strong style={{ color: '#16a34a' }}>0 g</strong></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <td style={{ padding: '10px 18px' }}>Proteína pura</td>
                    <td style={{ padding: '10px 14px' }}>35 g</td>
                    <td style={{ padding: '10px 18px' }}><strong>0.7 g</strong></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 18px' }}>Sodio</td>
                    <td style={{ padding: '10px 14px' }}>0 mg</td>
                    <td style={{ padding: '10px 18px' }}>0 mg</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 18px' }}><strong>Picolinato de Cromo</strong></td>
                    <td style={{ padding: '10px 14px' }}>2.000 mcg</td>
                    <td style={{ padding: '10px 18px' }}><strong style={{ color: '#2563eb' }}>40 mcg</strong></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid var(--line)', fontSize: 11, color: '#64748b' }}>
                * Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. No es fuente significativa de hierro y calcio.
              </div>
            </div>

            {/* Legal Certificate Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1.5px solid #bbf7d0', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Certificación Sanitaria</span>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Autorización Invima Oficial</h4>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                  <div>Registro Sanitario: <strong style={{ color: '#059669' }}>RSA-4113-2025</strong></div>
                  <div>Fabricado por: <strong>ALIMENTOS MYC</strong></div>
                  <div>Ubicación: <strong>Vereda Ucata Granja el Paraíso, Tona, Santander</strong></div>
                  <div>Distribución: <strong>Para THERMIX</strong></div>
                  <div>Código de Barras: <strong>7709026096235</strong></div>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  Producto 100% legal y certificado para su comercialización en Colombia.
                </p>
              </div>

              {/* Complete Ingredients List */}
              <div style={{ background: '#fff', borderRadius: 24, padding: 22, border: '1.5px solid var(--line)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F172A' }}>
                  Ingredientes Declarados en Etiqueta:
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  Gelatina polvo, Vinagre de cidra de Manzana, Alcachofa, Berenjena, Spirulina, Té verde, 
                  Glucomanano, Aceite de Girasol, Agua, Sorbato de potasio, Picolinato de Cromo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Packages */}
      <section id="precios" className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="band-head">
            <div className="eyebrow">
              <span className="dot" style={{ background: '#10b981' }} />
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
            {PACKAGES.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`pcard ${pkg.featured ? 'feat' : ''} ${selectedPackage === pkg.id ? 'ring-2 ring-emerald-500' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
                style={{ cursor: 'pointer' }}
              >
                {pkg.badge && (
                  <span className="ptag" style={{ background: pkg.featured ? 'var(--lime)' : '#e2e8f0', color: 'var(--ink)' }}>
                    {pkg.badge}
                  </span>
                )}

                <h3 className="pname">{pkg.title}</h3>
                <p className="pdesc">{pkg.quantity} · {pkg.duration}</p>

                <div className="pnum" style={{ margin: '18px 0 14px' }}>
                  <span style={{ fontSize: 34, fontWeight: 900 }}>{pkg.price}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 8 }}>{pkg.originalPrice}</span>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                      {pkg.discount}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginLeft: 8 }}>
                      {pkg.shipping}
                    </span>
                  </div>
                </div>

                <ul className="pfeats" style={{ flexGrow: 1, marginBottom: 24 }}>
                  {pkg.perks.map((perk, pidx) => (
                    <li key={pidx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155', marginBottom: 10 }}>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={pkg.featured ? 'btn btn-primary' : 'btn btn-glass'}
                  style={{ width: '100%', justifyContent: 'center' }}
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
            ))}
          </div>

          {/* Quick Order Form Box */}
          <div id="formulario-pedido" style={{ maxWidth: 760, margin: '48px auto 0', background: '#fff', borderRadius: 28, padding: 32, border: '1.5px solid var(--line)', boxShadow: '0 12px 36px rgba(20, 40, 80, 0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '4px 12px', borderRadius: 9999, textTransform: 'uppercase' }}>
                🚚 PAGO CONTRA ENTREGA EN TODA COLOMBIA
              </span>
              <h3 style={{ margin: '10px 0 4px', fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
                Formulario de Despacho Rápido
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                Ingresa tus datos y coordinaremos el despacho inmediato a tu dirección vía WhatsApp.
              </p>
            </div>

            {isOrderSubmitted ? (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 20, padding: 24, textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Check className="w-6 h-6" />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#14532d' }}>¡Pedido Registrado con Éxito!</h4>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#166534' }}>
                  Se ha generado tu orden hacia la línea oficial de despacho de THERMIX en WhatsApp.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleWhatsAppContact()}
                  style={{ display: 'inline-flex' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir WhatsApp para Validar Envío
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit}>
                <div style={{ padding: '12px 16px', borderRadius: 14, background: '#f8fafc', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Paquete:</span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {PACKAGES.find((p) => p.id === selectedPackage)?.title} ({PACKAGES.find((p) => p.id === selectedPackage)?.quantity})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                      {PACKAGES.find((p) => p.id === selectedPackage)?.price}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                      {PACKAGES.find((p) => p.id === selectedPackage)?.shipping}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nombre y Apellido *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#f8fafc', fontSize: 13 }}
                      placeholder="Ej. Laura Gómez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#f8fafc', fontSize: 13 }}
                      placeholder="Ej. 310 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Ciudad y Departamento *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#f8fafc', fontSize: 13 }}
                      placeholder="Ej. Medellín, Antioquia"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Dirección Completa *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#f8fafc', fontSize: 13 }}
                      placeholder="Ej. Calle 10 # 45-20 Apto 301"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Método de Pago</label>
                  <select
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#f8fafc', fontSize: 13 }}
                    value={clientPaymentMethod}
                    onChange={(e) => setClientPaymentMethod(e.target.value)}
                  >
                    <option value="Contra Entrega (Efectivo al recibir)">
                      💵 Contra Entrega (Pagas en efectivo al mensajero al recibir)
                    </option>
                    <option value="Transferencia Bancolombia / Nequi anticipada">
                      📱 Transferencia Bancolombia / Nequi antes del envío
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 18, padding: 14, fontSize: 15 }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Confirmar Pedido y Despachar por WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq" style={{ paddingTop: 30 }}>
        <div className="wrap">
          <div className="faq-head">
            <div className="eyebrow">
              <span className="dot" style={{ background: '#10b981' }} />
              <span>RESOLVEMOS TUS DUDAS</span>
            </div>
            <h2 className="display">Preguntas Frecuentes</h2>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`item ${openFaq === idx ? 'open' : ''}`}>
                <button
                  type="button"
                  className="q"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="q-ico">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="a">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Real Photos */}
      {lightboxImg && (
        <div className="qb-lightbox-backdrop" onClick={() => setLightboxImg(null)}>
          <div className="qb-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="qb-lightbox-close"
              onClick={() => setLightboxImg(null)}
              aria-label="Cerrar imagen"
            >
              ✕
            </button>
            <img src={lightboxImg} alt="Detalle del producto original Quibi" />
          </div>
        </div>
      )}

      {/* Footer: EXACT WAPPY Footer Structure from Screenshot 1 */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }} />
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }} />

        <div className="wrap">
          <div className="foot-cta">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #4a102f 0%, #2f071d 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 20,
                  boxShadow: '0 4px 14px rgba(74, 16, 47, 0.3)',
                }}
              >
                QB
              </div>
              <span style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>
                QUIBI<span style={{ color: '#16a34a' }}>.co</span>
              </span>
            </div>
            <h3 className="display">Tu bienestar metabólico y digestivo empieza hoy.</h3>
            <p>
              Ordena hoy tus cápsulas originales de vinagre de manzana con relleno líquido. Cobertura nacional con pago contra entrega en toda Colombia.
            </p>
            <div className="hero-cta" style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => scrollToSection(null, 'precios')}>
                Pedir con Descuento
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
                Pedir por WhatsApp (305 4656064)
              </a>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #4a102f 0%, #2f071d 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 16,
                  }}
                >
                  QB
                </div>
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                  QUIBI<span style={{ color: '#16a34a' }}>.co</span>
                </span>
              </div>
              <p className="foot-desc">
                Alimento a base de gelatina con relleno líquido con vinagre de manzana y té verde. Formulado con Glucomanano, Alcachofa, Berenjena, Spirulina y Picolinato de Cromo. Registro Invima RSA-4113-2025. Fabricado por ALIMENTOS MYC para THERMIX.
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
              <a href="#faq">Preguntas</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
