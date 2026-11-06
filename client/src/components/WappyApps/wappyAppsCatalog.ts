/**
 * Catálogo único de WAPPY APPs.
 *
 * Fuente de verdad compartida entre:
 *  - El portal público de marketing (`/portal?view=apps`, `/wappy-apps`, `/apps`)
 *  - La vista interna para usuarios autenticados (`/aplicaciones`, botón "WAPPY APPs" del menú lateral)
 *
 * Para publicar una nueva app basta con añadirla aquí: aparecerá en ambas vistas.
 */

export interface WappyAppCatalogItem {
  id: string;
  badge: string;
  badgeTone: 'active' | 'soon';
  title: string;
  subtitle: string;
  description: string;
  normative: string;
  image?: string;
  visualType?: 'matriz-ipvr' | 'wappy-studio' | 'wappy-podcast' | 'wappy-colmena' | 'soon';
  icon: string;
  tags: string[];
  /** URL pública absoluta de producción (referencia / SEO). */
  href?: string;
  /** Ruta relativa de la app dentro del dominio (p. ej. `/matrizipvr`). */
  path?: string;
  ctaLabel: string;
  /** Si es true, la aplicación solo es visible y accesible para usuarios con rol ADMIN. */
  adminOnly?: boolean;
}

export const WAPPY_APPS_CATALOG: WappyAppCatalogItem[] = [
  {
    id: 'matriz-ipvr',
    badge: 'DISPONIBLE AHORA · APP #1',
    badgeTone: 'active',
    title: 'APP de Matriz IPVR',
    subtitle: 'Identificación de Peligros, Evaluación y Valoración de Riesgos · GTC 45',
    description:
      'Aplicativo completo para construir, evaluar y auditar tu Matriz IPEVR bajo la metodología GTC 45. Incluye sugerencias automáticas con IA (Google Gemini), Dashboard de analítica con mapa de calor e Informe Gerencial en formato A4 listo para imprimir o exportar.',
    normative: 'GTC 45 · Decreto 1072 de 2015',
    image: '/marketing/marketplace-matriz-ipvr-card-horizontal.png?v=2',
    visualType: 'matriz-ipvr',
    icon: '📊',
    tags: [
      'Matriz GTC 45 en Vivo',
      'Controles con IA Gemini',
      'Gráficas & Mapa de Calor',
      'Informe Gerencial A4',
    ],
    href: 'https://wappy.club/matrizipvr',
    path: '/matrizipvr',
    ctaLabel: 'Ingresar a APP Matriz IPVR',
  },
  {
    id: 'wappy-studio',
    badge: 'DISPONIBLE AHORA · APP #2',
    badgeTone: 'active',
    title: 'APP de WAPPY Studio',
    subtitle: 'Estudio de Locución Neural 24kHz (Gemini 2.5) y Cápsulas de Video HTML + GSAP',
    description:
      'Produce locuciones profesionales en 24kHz con etiquetas de actuación vocal SST y genera cápsulas animadas de capacitación en formato Horizontal (16:9) o Reels (9:16), listas para compartir por WhatsApp o descargar en HTML autónomo.',
    normative: 'Capacitación e Inducción SST · Decreto 1072',
    image: '/marketing/marketplace-wappy-studio-card-horizontal.png?v=2',
    visualType: 'wappy-studio',
    icon: '🎬',
    tags: [
      'Locución IA 24kHz (.WAV)',
      'Cápsulas Video HTML+GSAP',
      'Formatos 16:9 y 9:16',
      'Biblioteca Persistente',
    ],
    href: 'https://wappy.club/wappystudio',
    path: '/wappystudio',
    ctaLabel: 'Ingresar a WAPPY Studio',
  },
  {
    id: 'wappy-podcast',
    badge: 'NUEVO · AUDIO IA 24kHz',
    badgeTone: 'active',
    title: 'APP de WAPPY Podcast',
    subtitle: 'Estudio de Podcasts & Cápsulas de Audio Dual (2 Voces) en 24kHz con IA',
    description:
      'Crea episodios de podcast profesionales y cápsulas de audio formativo con voces neuronales hiperrealistas (Gemini 3.8 Flash TTS), actuación vocal orgánica (<breath>, <laugh>, pausas), guionización asistida por IA y exportación directa en WAV 24kHz estéreo con Show Notes.',
    normative: 'Cápsulas de Audio & Podcast SST · Comunicación Efectiva',
    visualType: 'wappy-podcast',
    icon: '🎙️',
    tags: [
      'Podcast Dual (Host 1 & 2)',
      'Locución Neural 24kHz (.WAV)',
      'Actuación Vocal Orgánica',
      'Show Notes & Resumen IA',
    ],
    href: 'https://wappy.club/wappypodcast',
    path: '/wappypodcast',
    ctaLabel: 'Ingresar a WAPPY Podcast',
  },
  {
    id: 'wappy-colmena',
    badge: 'SOLO ADMIN · INTERMEDIACIÓN WAPPY LTDA',
    badgeTone: 'active',
    title: 'Wappy ARL Colmena',
    subtitle: 'Motor de Venta Proactiva CPS-A-26 V16 · Intermediación WAPPY LTDA',
    description:
      'Consola ejecutiva exclusiva para Administración e Intermediación de WAPPY LTDA ante ARL Colmena Seguros. Incluye Calificador Decreto 768 (1.104 actividades + 322 ocupaciones + detector de 115 subcódigos gemelos con Autorización Plena), Simulador de Prima y Topes ($3M/$40M), Radar de Prospectos Internos (Somos SST / Matriz IPVR), Generador IA de Propuestas/Cartas A4 y CRM Kanban.',
    normative: 'CPS-A-26 V16 (2026) · Decreto 768 de 2022',
    visualType: 'wappy-colmena',
    icon: '🛡️',
    tags: [
      'Matriz CPS-A-26 V16 (1.104 CIIU)',
      'Simulador Prima & Comisión WAPPY',
      'Radar Leads Somos SST → Colmena',
      'Propuesta & Carta Intermediación A4',
    ],
    href: 'https://wappy.club/wappycolmena',
    path: '/wappycolmena',
    ctaLabel: 'Ingresar a Wappy ARL Colmena',
    adminOnly: true,
  },
];

/**
 * Resuelve la URL final de una app: en producción (`*.wappy.club`) usa el dominio canónico
 * `https://wappy.club`, en local/staging usa la ruta relativa.
 */
export function resolveWappyAppUrl(path: string): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'wappy.club' || window.location.hostname.endsWith('.wappy.club'))
  ) {
    return `https://wappy.club${path}`;
  }
  return path;
}
