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
  visualType?: 'matriz-ipvr' | 'wappy-studio' | 'soon';
  icon: string;
  tags: string[];
  /** URL pública absoluta de producción (referencia / SEO). */
  href?: string;
  /** Ruta relativa de la app dentro del dominio (p. ej. `/matrizipvr`). */
  path?: string;
  ctaLabel: string;
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
    id: 'diagnostico-0312',
    badge: 'PRÓXIMAMENTE EN WAPPY APPs',
    badgeTone: 'soon',
    title: 'APP Autoevaluación Res. 0312',
    subtitle: 'Diagnóstico Interactivo de Estándares Mínimos SG-SST (7, 21 y 60 Estándares)',
    description:
      'Calculadora normativa inteligente que clasifica tu empresa según número de trabajadores y nivel de riesgo ARL, evalúa el cumplimiento del ciclo PHVA y genera el Plan de Mejoramiento automático.',
    normative: 'Resolución 0312 de 2019 · Art. 27-28',
    visualType: 'soon',
    icon: '🛡️',
    tags: ['7, 21 o 60 Estándares', 'Plan de Mejora IA', 'Puntaje Ponderado', 'Reporte Oficial'],
    ctaLabel: 'Próximamente disponible',
  },
  {
    id: 'matriz-quimica-sga',
    badge: 'PRÓXIMAMENTE EN WAPPY APPs',
    badgeTone: 'soon',
    title: 'APP Compatibilidad Química SGA',
    subtitle: 'Inventario de Sustancias, Pictogramas SGA y Matriz de Almacenamiento Seguro',
    description:
      'Valida al instante la compatibilidad de almacenamiento de tus productos químicos según el Sistema Globalmente Armonizado (SGA), extrae datos de Fichas de Seguridad (FDS) y genera etiquetas normativas.',
    normative: 'Decreto 1496 de 2018 · Res. 773 de 2021',
    visualType: 'soon',
    icon: '🧪',
    tags: ['Cruce SGA en Vivo', 'Pictogramas Oficiales', 'Alertas de Reacción', 'Etiquetado SGA'],
    ctaLabel: 'Próximamente disponible',
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
