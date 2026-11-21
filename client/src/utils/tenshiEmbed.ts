/**
 * Helpers puros para el Navegador WAPPY Integrado dentro de Tenshi (`🌐 Wappy`).
 * Arquitectura same-origin <iframe> sin recursión y sin dependencias de sessionStorage.
 */

export const TENSHI_BROWSER_FRAME_NAME = 'wappy-tenshi-browser';

/**
 * Detecta si la ventana actual corre embebida dentro del iframe del Navegador WAPPY de Tenshi.
 * CRÍTICO: NUNCA usar sessionStorage (en HTML5 se comparte entre ventana padre e iframe same-origin).
 */
export function isTenshiEmbedded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (window.self !== window.top) {
      return true;
    }
  } catch {
    return true;
  }
  try {
    if (window.name === TENSHI_BROWSER_FRAME_NAME) {
      return true;
    }
  } catch {
    // ignore cross-realm access errors
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tenshiEmbed') === '1') {
      return true;
    }
  } catch {
    // ignore malformed URLSearchParams
  }
  return false;
}

const ALLOWED_WAPPY_HOSTNAMES = new Set(['wappy.club', 'www.wappy.club', 'app.wappy.club', 'localhost', '127.0.0.1']);

/**
 * Valida que una URL sea estrictamente interna relativa (`/ruta`) o same-origin de WAPPY.
 * Bloquea URLs externas arbitrarias, esquemas peligrosos (`javascript:`, `data:`) y protocol-relative (`//`).
 */
export function isSafeSameOriginWappyUrl(rawUrl: string): boolean {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return false;
  }
  // Bloquear esquemas peligrosos y rutas protocol-relative
  if (/^(javascript|data|vbscript|blob|file):/i.test(trimmed) || trimmed.startsWith('//')) {
    return false;
  }
  if (trimmed.startsWith('/')) {
    return true;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (typeof window !== 'undefined' && window.location?.origin) {
        return parsed.origin === window.location.origin;
      }
      return ALLOWED_WAPPY_HOSTNAMES.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }
  return false;
}

function getSafeBaseOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return 'https://wappy.club';
}

function normalizePathAliases(url: URL): void {
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/centro-control') {
    url.pathname = '/sgsst/control';
  } else if (cleanPath === '/sgsst/estudio-puesto' || cleanPath === '/sgsst/estudio_puesto') {
    url.pathname = '/sgsst';
    if (!url.searchParams.get('hito')) {
      url.searchParams.set('hito', 'hito4');
    }
    if (!url.searchParams.get('module')) {
      url.searchParams.set('module', 'estudio_puesto');
    }
  }
}

/**
 * Normaliza una ruta o URL same-origin para cargarse en el iframe del Navegador WAPPY de Tenshi:
 * - Valida seguridad same-origin (fallback seguro `/sgsst`).
 * - Corrige alias conocidos (`/centro-control` -> `/sgsst/control`).
 * - Inyecta `?tenshiEmbed=1` preservando query params y hash.
 */
export function normalizeToEmbedUrl(rawRoute: string): string {
  const trimmed = String(rawRoute || '').trim();
  const safeInput = isSafeSameOriginWappyUrl(trimmed) ? trimmed : '/sgsst';
  try {
    const url = new URL(safeInput, getSafeBaseOrigin());
    normalizePathAliases(url);
    url.searchParams.set('tenshiEmbed', '1');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/sgsst?tenshiEmbed=1';
  }
}

/**
 * Elimina el parámetro `tenshiEmbed` y retorna la ruta relativa limpia
 * (para "Abrir fuera en Wappy", `screen_context` y comparación de rutas).
 */
export function stripTenshiEmbedParam(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || !isSafeSameOriginWappyUrl(trimmed)) {
    return '/sgsst';
  }
  try {
    const url = new URL(trimmed, getSafeBaseOrigin());
    normalizePathAliases(url);
    url.searchParams.delete('tenshiEmbed');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/sgsst';
  }
}

const SGSST_MODULE_TITLE_MAP: Record<string, { shortLabel: string; fullTitle: string }> = {
  // Hito 1
  contexto_organizacion: { shortLabel: 'Contexto DOFA', fullTitle: 'Somos SST › Contexto y Partes Interesadas' },
  diagnostico: { shortLabel: 'Diag. 0312', fullTitle: 'Somos SST › Diagnóstico Res. 0312' },
  responsable: { shortLabel: 'Responsable', fullTitle: 'Somos SST › Responsable SG-SST' },
  politica: { shortLabel: 'Política SST', fullTitle: 'Somos SST › Política de SST' },
  objetivos: { shortLabel: 'Objetivos SST', fullTitle: 'Somos SST › Objetivos de SST' },
  legal: { shortLabel: 'Matriz Legal', fullTitle: 'Somos SST › Matriz Legal' },
  rhs: { shortLabel: 'Regl. Higiene', fullTitle: 'Somos SST › Reglamento de Higiene (RHS)' },
  rit: { shortLabel: 'Regl. Interno', fullTitle: 'Somos SST › Reglamento Interno (RIT)' },
  participacion_ipevar: { shortLabel: 'Part. IPEVR', fullTitle: 'Somos SST › Participación IPEVR' },
  matriz_peligros: { shortLabel: 'Matriz Peligros', fullTitle: 'Somos SST › Matriz de Peligros GTC 45' },
  matriz_ipevar_oficial: { shortLabel: 'Matriz Peligros', fullTitle: 'Somos SST › Matriz de Peligros GTC 45' },
  matriz_pesv_oficial: { shortLabel: 'Matriz PESV', fullTitle: 'Somos SST › Matriz de Riesgos Viales PESV' },
  matriz_compatibilidad_oficial: { shortLabel: 'Químicos SGA', fullTitle: 'Somos SST › Compatibilidad Química SGA' },
  oportunidades_sst: { shortLabel: 'Oportunidades', fullTitle: 'Somos SST › Riesgos y Oportunidades SST' },
  vulnerabilidad: { shortLabel: 'Vulnerabilidad', fullTitle: 'Somos SST › Análisis de Vulnerabilidad' },
  plan_emergencias: { shortLabel: 'Emergencias', fullTitle: 'Somos SST › Plan de Emergencias (PPRE)' },

  // Hito 2
  perfil_cargo: { shortLabel: 'Perfiles Cargo', fullTitle: 'Somos SST › Perfiles de Cargo' },
  perfil_socio: { shortLabel: 'Trabajadores', fullTitle: 'Somos SST › Perfil Sociodemográfico' },
  perfil_sociodemografico: { shortLabel: 'Trabajadores', fullTitle: 'Somos SST › Perfil Sociodemográfico' },
  condiciones_salud: { shortLabel: 'Exámenes Med.', fullTitle: 'Somos SST › Condiciones de Salud' },
  oraculo_predictivo: { shortLabel: 'Compatibilidad', fullTitle: 'Somos SST › Compatibilidad Cargo-Persona' },

  // Hito 3
  copasst: { shortLabel: 'COPASST', fullTitle: 'Somos SST › COPASST / Vigía SST' },
  cocolab: { shortLabel: 'Convivencia', fullTitle: 'Somos SST › Comité de Convivencia' },
  convivencia: { shortLabel: 'Convivencia', fullTitle: 'Somos SST › Comité de Convivencia' },
  comite_pesv: { shortLabel: 'Comité PESV', fullTitle: 'Somos SST › Comité de Seguridad Vial' },
  brigada_emergencias: { shortLabel: 'Brigadas', fullTitle: 'Somos SST › Brigada de Emergencias' },

  // Hito 4
  peligros: { shortLabel: 'Bio-IPEVR', fullTitle: 'Somos SST › Matriz Bio-IPEVR' },
  metodo_owas: { shortLabel: 'Método OWAS', fullTitle: 'Somos SST › Ergonomía OWAS' },
  estudio_puesto: { shortLabel: 'Estudio Puesto', fullTitle: 'Somos SST › Estudio de Puesto (EPT)' },
  animo: { shortLabel: 'Psicosocial', fullTitle: 'Somos SST › Termómetro Psicosocial' },

  // Hito 5
  compras_sst: { shortLabel: 'Compras SST', fullTitle: 'Somos SST › Compras y Adquisiciones' },
  contratistas_proveedores: { shortLabel: 'Contratistas', fullTitle: 'Somos SST › Control de Contratistas' },
  gestion_cambio: { shortLabel: 'Gestión Cambio', fullTitle: 'Somos SST › Gestión del Cambio (MOC)' },
  analisis_trabajo_seguro: { shortLabel: 'ATS', fullTitle: 'Somos SST › Análisis de Trabajo Seguro' },
  permiso_alturas: { shortLabel: 'Alturas', fullTitle: 'Somos SST › Permiso de Alturas' },
  heights_lifecycle: { shortLabel: 'Eq. Alturas', fullTitle: 'Somos SST › Equipos de Alturas' },
  epp_delivery: { shortLabel: 'Entrega EPP', fullTitle: 'Somos SST › Entrega y Control EPP' },
  chemical_registry: { shortLabel: 'Inv. Químico', fullTitle: 'Somos SST › Inventario Químico SGA' },
  vehicles_pesv: { shortLabel: 'Vehículos PESV', fullTitle: 'Somos SST › Hoja de Vida Vehículos' },
  equipos_emergencia: { shortLabel: 'Eq. Emergencia', fullTitle: 'Somos SST › Equipos de Emergencia' },

  // Hito 6
  comunicaciones_sst: { shortLabel: 'Comunicaciones', fullTitle: 'Somos SST › Plan de Comunicaciones' },
  capacitaciones: { shortLabel: 'Capacitación', fullTitle: 'Somos SST › Programa de Capacitación' },
  ruta_aprendizaje: { shortLabel: 'Rutas LMS', fullTitle: 'Somos SST › Rutas de Aprendizaje' },
  reporte_actos: { shortLabel: 'Actos y Cond.', fullTitle: 'Somos SST › Actos y Condiciones Inseguras' },
  simulacros_emergencia: { shortLabel: 'Simulacros', fullTitle: 'Somos SST › Simulacros de Emergencia' },
  app_builder: { shortLabel: 'App Builder', fullTitle: 'Somos SST › Creador de Aplicativos' },

  // Hito 7
  estadisticas: { shortLabel: 'Ausentismo', fullTitle: 'Somos SST › Ausentismo & ATEL' },
  investigacion_atel: { shortLabel: 'ATEL', fullTitle: 'Somos SST › Investigación ATEL' },
  control_acpm: { shortLabel: 'Kanban ACPM', fullTitle: 'Somos SST › Tablero Kanban ACPM' },
  acpm: { shortLabel: 'Kanban ACPM', fullTitle: 'Somos SST › Tablero Kanban ACPM' },
  auditoria: { shortLabel: 'Auditoría SST', fullTitle: 'Somos SST › Auditoría Interna SG-SST' },
  alta_direccion: { shortLabel: 'Alta Dirección', fullTitle: 'Somos SST › Revisión Alta Dirección' },
  investigacion_profunda: { shortLabel: 'Inv. Profunda', fullTitle: 'Somos SST › Investigación Profunda SST' },

  // Hito 8
  predictivo: { shortLabel: 'Oráculo IA', fullTitle: 'Somos SST › Inteligencia Predictiva' },
};

const SGSST_HITO_TITLE_MAP: Record<string, { shortLabel: string; fullTitle: string }> = {
  hito1: { shortLabel: 'Hito 1 · Legal', fullTitle: 'Somos SST › Hito 1 · Gobernanza y Cimiento Legal' },
  hito2: { shortLabel: 'Hito 2 · Huella', fullTitle: 'Somos SST › Hito 2 · Huella Biocéntrica' },
  hito3: { shortLabel: 'Hito 3 · Comités', fullTitle: 'Somos SST › Hito 3 · Comités y Brigadas' },
  hito4: { shortLabel: 'Hito 4 · Riesgos', fullTitle: 'Somos SST › Hito 4 · Evaluación de Riesgos' },
  hito5: { shortLabel: 'Hito 5 · Terreno', fullTitle: 'Somos SST › Hito 5 · Dinámica Operativa' },
  hito6: { shortLabel: 'Hito 6 · Cultura', fullTitle: 'Somos SST › Hito 6 · Cultura y Escuela' },
  hito7: { shortLabel: 'Hito 7 · Cierre', fullTitle: 'Somos SST › Hito 7 · Auditoría y ATEL' },
  hito8: { shortLabel: 'Hito 8 · IA', fullTitle: 'Somos SST › Hito 8 · Oráculo Predictivo' },
};

/**
 * Devuelve etiquetas legibles en español para la pestaña (`shortLabel`) y la barra del navegador (`fullTitle`).
 */
export function formatWappyBrowserTitle(
  pathname: string,
  search?: string,
): { shortLabel: string; fullTitle: string } {
  const rawPath = String(pathname || '/sgsst').trim();
  const cleanPath = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(String(search || ''));

  if (cleanPath === '/sgsst') {
    const mod = (params.get('module') || '').toLowerCase().trim();
    if (mod && SGSST_MODULE_TITLE_MAP[mod]) {
      return SGSST_MODULE_TITLE_MAP[mod];
    }
    const hito = (params.get('hito') || '').toLowerCase().trim();
    if (hito && SGSST_HITO_TITLE_MAP[hito]) {
      return SGSST_HITO_TITLE_MAP[hito];
    }
    return { shortLabel: 'Somos SST', fullTitle: 'Somos SST › Ecosistema SG-SST' };
  }

  if (
    cleanPath === '/sgsst/control' ||
    cleanPath === '/centro-control' ||
    cleanPath === '/control' ||
    cleanPath === '/kanban'
  ) {
    return { shortLabel: 'Centro Control', fullTitle: 'Centro de Control SST' };
  }
  if (cleanPath === '/sgsst/animo') {
    return { shortLabel: 'Ánimo SST', fullTitle: 'Analítica Psicosocial y Ánimo' };
  }
  if (cleanPath === '/tareas' || cleanPath.startsWith('/tareas/')) {
    return { shortLabel: 'Tareas', fullTitle: 'Tareas y Automatizaciones IA' };
  }
  if (cleanPath === '/academia' || cleanPath.startsWith('/academia/')) {
    const tab = (params.get('tab') || '').toLowerCase();
    if (tab === 'meet') return { shortLabel: 'Sesiones Vivo', fullTitle: 'Academia › Clases en Vivo' };
    if (tab === 'blog') return { shortLabel: 'Blog', fullTitle: 'Academia › Blog WAPPY' };
    if (tab === 'rutas') return { shortLabel: 'Rutas LMS', fullTitle: 'Academia › Rutas de Aprendizaje' };
    return { shortLabel: 'Academia', fullTitle: 'Academia WAPPY' };
  }
  if (cleanPath.startsWith('/training')) {
    return { shortLabel: 'Academia', fullTitle: 'Academia › Formación LMS' };
  }
  if (cleanPath.startsWith('/ruta-aprendizaje')) {
    return { shortLabel: 'Rutas LMS', fullTitle: 'Rutas de Aprendizaje LMS' };
  }
  if (cleanPath.startsWith('/events-meet')) {
    return { shortLabel: 'Sesiones Vivo', fullTitle: 'Sesiones y Clases en Vivo' };
  }
  if (cleanPath.startsWith('/marketplace') || cleanPath.startsWith('/tienda')) {
    return { shortLabel: 'Tienda', fullTitle: 'Tienda / Marketplace WAPPY' };
  }
  if (
    cleanPath === '/aplicaciones' ||
    cleanPath === '/apps' ||
    cleanPath === '/wappy-apps' ||
    cleanPath === '/portal'
  ) {
    return { shortLabel: 'Aplicaciones', fullTitle: 'Aplicaciones WAPPY' };
  }
  if (cleanPath === '/huella-biocentrica') {
    return { shortLabel: 'Huella Bioc.', fullTitle: 'Huella Biocéntrica' };
  }
  if (cleanPath === '/comunidad' || cleanPath === '/comunidadmp' || cleanPath === '/wappyvital') {
    return { shortLabel: 'Comunidad', fullTitle: 'Comunidad WAPPY' };
  }
  if (cleanPath.startsWith('/wappystudio') || cleanPath.startsWith('/wappy-studio')) {
    return { shortLabel: 'Wappy Studio', fullTitle: 'Wappy Studio' };
  }
  if (cleanPath.startsWith('/wappypodcast') || cleanPath.startsWith('/wappy-podcast')) {
    return { shortLabel: 'Wappy Podcast', fullTitle: 'Wappy Podcast' };
  }
  if (cleanPath.startsWith('/matrizipvr') || cleanPath.startsWith('/matriz-ipvr') || cleanPath === '/matriz') {
    return { shortLabel: 'Matriz IPEVR', fullTitle: 'Matriz IPEVR (GTC 45)' };
  }
  if (cleanPath === '/planes' || cleanPath === '/billing') {
    return { shortLabel: 'Planes', fullTitle: 'Planes WAPPY IA' };
  }
  if (cleanPath === '/blog' || cleanPath.startsWith('/blog/')) {
    return { shortLabel: 'Blog', fullTitle: 'Blog WAPPY' };
  }
  if (cleanPath.startsWith('/agents')) {
    return { shortLabel: 'Agentes IA', fullTitle: 'Catálogo de Agentes IA' };
  }
  if (cleanPath === '/auditoria') {
    return { shortLabel: 'Auditoría', fullTitle: 'Auditoría SG-SST' };
  }
  if (cleanPath.startsWith('/embajadores')) {
    return { shortLabel: 'Embajadores', fullTitle: 'Programa de Embajadores' };
  }
  if (cleanPath === '/hoja-de-ruta') {
    return { shortLabel: 'Hoja de Ruta', fullTitle: 'Hoja de Ruta WAPPY' };
  }
  if (cleanPath === '/contactanos') {
    return { shortLabel: 'Contacto', fullTitle: 'Contáctanos · Soporte' };
  }
  if (cleanPath === '/chat-sst') {
    return { shortLabel: 'Chat SST', fullTitle: 'Chat SST' };
  }
  if (cleanPath.startsWith('/bateria-psicosocial')) {
    return { shortLabel: 'Psicosocial', fullTitle: 'Batería Psicosocial' };
  }
  if (cleanPath.startsWith('/c/')) {
    return { shortLabel: 'Chat Clásico', fullTitle: 'Workspace Chat WAPPY' };
  }
  if (cleanPath === '/' || cleanPath === '/landing' || cleanPath === '/inicio') {
    return { shortLabel: 'Inicio Wappy', fullTitle: 'WAPPY IA › Inicio' };
  }

  const firstSeg = cleanPath.split('/').filter(Boolean)[0] || 'Wappy';
  const pretty = firstSeg
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
  return {
    shortLabel: pretty.length > 16 ? `${pretty.slice(0, 15)}…` : pretty,
    fullTitle: `WAPPY › ${pretty}`,
  };
}

export interface WappyBrowserDestination {
  id: string;
  label: string;
  subtitle: string;
  route: string;
  sgsstModule?: string;
  keywords: string;
}

export interface WappyBrowserDestinationGroup {
  id: string;
  title: string;
  items: WappyBrowserDestination[];
}

export const WAPPY_BROWSER_DESTINATIONS: ReadonlyArray<WappyBrowserDestinationGroup> = [
  {
    id: 'somos_sst',
    title: 'Somos SST · Hitos SG-SST',
    items: [
      {
        id: 'sgsst_home',
        label: 'Somos SST (Panel de 8 Hitos)',
        subtitle: 'Vista general de Hitos 1 a 8',
        route: '/sgsst',
        keywords: 'sgsst somos sst hitos inicio dashboard',
      },
      {
        id: 'matriz_ipevar_oficial',
        label: 'Matriz de Peligros GTC 45',
        subtitle: 'Hito 1 · IPEVR oficial',
        route: '/sgsst?hito=hito1&module=matriz_ipevar_oficial',
        sgsstModule: 'matriz_ipevar_oficial',
        keywords: 'matriz peligros ipevr ipevar gtc45 gtc 45 riesgos',
      },
      {
        id: 'perfil_socio',
        label: 'Trabajadores (Sociodemográfico)',
        subtitle: 'Hito 2 · Censo y perfil laboral',
        route: '/sgsst?hito=hito2&module=perfil_socio',
        sgsstModule: 'perfil_socio',
        keywords: 'trabajadores empleados colaboradores censo sociodemografico perfil',
      },
      {
        id: 'diagnostico',
        label: 'Diagnóstico Res. 0312',
        subtitle: 'Hito 1 · Estándares Mínimos',
        route: '/sgsst?hito=hito1&module=diagnostico',
        sgsstModule: 'diagnostico',
        keywords: 'diagnostico 0312 estandares minimos autoevaluacion',
      },
      {
        id: 'condiciones_salud',
        label: 'Exámenes Médicos y Salud',
        subtitle: 'Hito 2 · Condiciones de salud',
        route: '/sgsst?hito=hito2&module=condiciones_salud',
        sgsstModule: 'condiciones_salud',
        keywords: 'examenes medicos salud ocupacional aptitudes medicina laboral',
      },
      {
        id: 'perfil_cargo',
        label: 'Perfiles de Cargo',
        subtitle: 'Hito 2 · Roles y profesiograma',
        route: '/sgsst?hito=hito2&module=perfil_cargo',
        sgsstModule: 'perfil_cargo',
        keywords: 'perfil cargo cargos roles profesiograma',
      },
      {
        id: 'investigacion_atel',
        label: 'Investigación ATEL',
        subtitle: 'Hito 7 · Accidentes e incidentes',
        route: '/sgsst?hito=hito7&module=investigacion_atel',
        sgsstModule: 'investigacion_atel',
        keywords: 'atel accidentes incidentes investigacion arbol causas',
      },
      {
        id: 'estadisticas',
        label: 'Ausentismo y Estadísticas ATEL',
        subtitle: 'Hito 7 · Indicadores Res. 0312',
        route: '/sgsst?hito=hito7&module=estadisticas',
        sgsstModule: 'estadisticas',
        keywords: 'ausentismo incapacidades indicadores estadisticas atel',
      },
      {
        id: 'matriz_pesv_oficial',
        label: 'Matriz de Riesgos Viales PESV',
        subtitle: 'Hito 1 · Seguridad vial',
        route: '/sgsst?hito=hito1&module=matriz_pesv_oficial',
        sgsstModule: 'matriz_pesv_oficial',
        keywords: 'pesv vial vehiculos seguridad vial conductores',
      },
      {
        id: 'matriz_compatibilidad_oficial',
        label: 'Compatibilidad Química SGA',
        subtitle: 'Hito 1 · Sustancias y FDS',
        route: '/sgsst?hito=hito1&module=matriz_compatibilidad_oficial',
        sgsstModule: 'matriz_compatibilidad_oficial',
        keywords: 'quimicos sga compatibilidad sustancias fds inventario',
      },
      {
        id: 'copasst',
        label: 'Comités (COPASST / Convivencia)',
        subtitle: 'Hito 3 · Gobernanza y brigadas',
        route: '/sgsst?hito=hito3&module=copasst',
        sgsstModule: 'copasst',
        keywords: 'comites copasst vigia cocolab convivencia brigada',
      },
      {
        id: 'legal',
        label: 'Matriz Legal',
        subtitle: 'Hito 1 · Normograma SST',
        route: '/sgsst?hito=hito1&module=legal',
        sgsstModule: 'legal',
        keywords: 'legal normograma matriz leyes decretos resoluciones',
      },
      {
        id: 'plan_emergencias',
        label: 'Plan de Emergencias (PPRE)',
        subtitle: 'Hito 1 · Amenazas y contingencias',
        route: '/sgsst?hito=hito1&module=plan_emergencias',
        sgsstModule: 'plan_emergencias',
        keywords: 'emergencias ppre amenazas vulnerabilidad medevac',
      },
      {
        id: 'estudio_puesto',
        label: 'Estudio de Puesto (EPT)',
        subtitle: 'Hito 4 · Ergonomía e IA',
        route: '/sgsst?hito=hito4&module=estudio_puesto',
        sgsstModule: 'estudio_puesto',
        keywords: 'estudio puesto ept ergonomia biomecanica postura',
      },
      {
        id: 'permiso_alturas',
        label: 'Permisos de Alturas y ATS',
        subtitle: 'Hito 5 · Tareas críticas',
        route: '/sgsst?hito=hito5&module=permiso_alturas',
        sgsstModule: 'permiso_alturas',
        keywords: 'alturas permiso ats trabajo seguro epp terreno',
      },
      {
        id: 'auditoria',
        label: 'Auditoría Interna SG-SST',
        subtitle: 'Hito 7 · Hallazgos y cierre',
        route: '/sgsst?hito=hito7&module=auditoria',
        sgsstModule: 'auditoria',
        keywords: 'auditoria hallazgos cierre alta direccion',
      },
    ],
  },
  {
    id: 'plataforma',
    title: 'Plataforma WAPPY',
    items: [
      {
        id: 'centro_control',
        label: 'Centro de Control SST',
        subtitle: 'Kanban ACPM, calendario y cronograma',
        route: '/sgsst/control',
        keywords: 'centro control kanban acpm calendario cronograma plan trabajo',
      },
      {
        id: 'tareas',
        label: 'Tareas y Automatizaciones IA',
        subtitle: 'Flujos autónomos y agentes',
        route: '/tareas',
        keywords: 'tareas automatizaciones flujos workflows agentes cron',
      },
      {
        id: 'academia',
        label: 'Academia WAPPY',
        subtitle: 'Cursos LMS, rutas y clases en vivo',
        route: '/academia',
        keywords: 'academia cursos lms clases meet capacitacion formacion',
      },
      {
        id: 'marketplace',
        label: 'Tienda / Marketplace',
        subtitle: 'Productos, plantillas y pedidos',
        route: '/marketplace',
        keywords: 'tienda marketplace productos compras catalogo',
      },
      {
        id: 'aplicaciones',
        label: 'Aplicaciones WAPPY',
        subtitle: 'Catálogo de apps y herramientas',
        route: '/aplicaciones',
        keywords: 'aplicaciones apps herramientas catalogo',
      },
      {
        id: 'comunidad',
        label: 'Comunidad WAPPY',
        subtitle: 'Espacio colaborativo SST',
        route: '/comunidad',
        keywords: 'comunidad wappyvital red miembros',
      },
      {
        id: 'huella_biocentrica',
        label: 'Huella Biocéntrica',
        subtitle: 'Panel biocéntrico integral',
        route: '/huella-biocentrica',
        keywords: 'huella biocentrica bioindividuo salud',
      },
      {
        id: 'wappystudio',
        label: 'Wappy Studio',
        subtitle: 'Producción de video y reels IA',
        route: '/wappystudio',
        keywords: 'wappy studio video reels produccion hyperframes',
      },
      {
        id: 'wappypodcast',
        label: 'Wappy Podcast',
        subtitle: 'Cabina de audio y podcasts 24kHz',
        route: '/wappypodcast',
        keywords: 'wappy podcast audio voz tts walkman',
      },
      {
        id: 'matrizipvr',
        label: 'Matriz IPEVR Portable',
        subtitle: 'App interactiva GTC 45',
        route: '/matrizipvr',
        keywords: 'matrizipvr matriz ipvr ipevr gtc45 portable',
      },
      {
        id: 'agents',
        label: 'Catálogo de Agentes IA',
        subtitle: 'Especialistas SG-SST y productividad',
        route: '/agents',
        keywords: 'agentes ia especialistas catalogo',
      },
      {
        id: 'planes',
        label: 'Planes WAPPY IA',
        subtitle: 'Suscripciones y créditos',
        route: '/planes',
        keywords: 'planes precios tarifas suscripciones pro',
      },
      {
        id: 'blog',
        label: 'Blog WAPPY',
        subtitle: 'Artículos normativos y guías SST',
        route: '/blog',
        keywords: 'blog articulos noticias normatividad',
      },
    ],
  },
];
