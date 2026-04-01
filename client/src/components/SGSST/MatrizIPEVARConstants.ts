/**
 * MatrizIPEVARConstants.ts
 * GTC-45:2012 — Datos del Anexo C: Determinación Cualitativa del Nivel de Deficiencia
 * para Peligros Higiénicos, y constantes auxiliares del Dashboard Analítico.
 */

export interface MatrixRow {
  proceso: string;
  zona: string;
  actividad: string;
  tareas: string;
  rutinaria: 'Sí' | 'No';
  peligro_descripcion: string;
  peligro_clasificacion: string;
  efectos_posibles: string;
  controles_fuente: string;
  controles_medio: string;
  controles_individuo: string;
  nd: number;
  ne: number;
  np: number;
  nc: number;
  nr: number;
  interpretacion_nr: string;
  aceptabilidad: string;
  medida_eliminacion: string;
  medida_sustitucion: string;
  medida_ingenieria: string;
  medida_administrativa: string;
  medida_eppu: string;
  // Nuevos campos
  factores_reduccion?: string;  // Anexo E GTC-45
  nd_cualitativo?: number | null; // Anexo C GTC-45 (10|6|2|0)
}

export interface AnnexCOption {
  value: number;
  label: string;
  description: string;
}

export interface AnnexCEntry {
  label: string;
  keywords: string[];
  note?: string;
  criteria: AnnexCOption[];
}

/** Criterios exactos del Anexo C de la GTC-45:2012 */
export const ANNEX_C_CRITERIA: Record<string, AnnexCEntry> = {
  ruido: {
    label: 'Físico — Ruido',
    keywords: ['ruido', 'sonido', 'acústic', 'decibel'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Jornada completa sin controles, exposición muy por encima del TLV de ruido.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición frecuente cercana al TLV, controles insuficientes o mal implementados.' },
      { value: 2, label: 'M (Medio)', description: 'Exposición intermitente, algunas medidas de control, no completamente efectivas.' },
      { value: 0, label: 'B (Bajo)', description: 'Exposición ocasional, por debajo del TLV, con controles auditivos adecuados.' },
    ],
  },
  iluminacion: {
    label: 'Físico — Iluminación',
    keywords: ['iluminaci', 'luz', 'luminanc', 'brillo', 'lux'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Iluminación completamente inadecuada para la tarea, sin ninguna medida de control.' },
      { value: 6, label: 'A (Alto)', description: 'Iluminación deficiente con efectos negativos sobre la tarea, controles insuficientes.' },
      { value: 2, label: 'M (Medio)', description: 'Deficiencias conocidas de iluminación, medidas en proceso de implementación.' },
      { value: 0, label: 'B (Bajo)', description: 'Iluminación adecuada a los requerimientos de la tarea, con control periódico.' },
    ],
  },
  temperatura: {
    label: 'Físico — Temperaturas Extremas',
    keywords: ['temperatura', 'calor', 'frío', 'termico', 'térmico', 'estrés térmico'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Exposición continua a temperaturas extremas (calor/frío) sin controles de ningún tipo.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición frecuente a temperaturas extremas, controles insuficientes.' },
      { value: 2, label: 'M (Medio)', description: 'Exposición intermitente con algunos controles (ropa, pausas, ventilación parcial).' },
      { value: 0, label: 'B (Bajo)', description: 'Exposición mínima o bien controlada, temperatura dentro de rangos aceptables.' },
    ],
  },
  vibraciones: {
    label: 'Físico — Vibraciones',
    keywords: ['vibrac', 'vibración', 'vibratorio'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Jornada completa expuesto a vibración por encima del TLV, sin controles.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición frecuente sin controles adecuados (mano-brazo o cuerpo entero).' },
      { value: 2, label: 'M (Medio)', description: 'Exposición intermitente, algunos controles implementados (guantes, asientos).' },
      { value: 0, label: 'B (Bajo)', description: 'Exposición ocasional con controles adecuados, por debajo del TLV.' },
    ],
  },
  rad_no_ionizante: {
    label: 'Físico — Radiaciones No Ionizantes',
    keywords: ['radiación no ionizante', 'uv', 'ultravioleta', 'infrarrojo', 'laser', 'láser', 'microonda', 'radiofrecuencia'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Exposición a radiación UV, IR o láser de alta intensidad sin pantallas, EPP ni protocolos.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición frecuente sin controles suficientes ni EPP adecuado.' },
      { value: 2, label: 'M (Medio)', description: 'Controles parciales implementados; EPP disponible pero uso inconsistente.' },
      { value: 0, label: 'B (Bajo)', description: 'Controles adecuados: pantallas, EPP certificado, procedimientos y monitoreo.' },
    ],
  },
  rad_ionizante: {
    label: 'Físico — Radiaciones Ionizantes',
    keywords: ['radiación ionizante', 'rayos x', 'gamma', 'radiactiv', 'nuclear'],
    note: 'NOTA GTC-45 §Anexo C: Cuando se tenga sospecha de exposición a un agente altamente radiactivo, se deben realizar mediciones para determinar el nivel de exposición en referencia al TLV (véase Anexo D), sin dejar de valorarlo cualitativamente mientras se obtienen las mediciones.',
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Sospecha o certeza de exposición a agente radiactivo. Sin medición, sin controles ni EPP. Valorar cualitativamente mientras se obtienen mediciones.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición posible según tipo de trabajo similar, sin medición formal disponible aún.' },
      { value: 2, label: 'M (Medio)', description: 'Con medición parcial y algunos controles implementados (señalización, blindaje).' },
      { value: 0, label: 'B (Bajo)', description: 'Protocolos de dosimetría, mediciones regulares y controles debidamente implementados. Exposición bajo TLV.' },
    ],
  },
  quimico: {
    label: 'Químico — Polvos, Gases, Vapores, Aerosoles',
    keywords: ['químico', 'polvo', 'gas', 'vapor', 'aerosol', 'niebla', 'humo', 'solvente', 'sustancia', 'inflamabil', 'reactivid', 'salud'],
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Salud(4): Exposición corta causa muerte o daño grave (ej. Ácido Fluorhídrico). / Inflamabilidad(4): Se vaporiza rápido a presión atmosférica o se dispersa y quema en aire (< 23°C). / Reactividad(4): Fácilmente capaz de detonar explosivamente a temp. ambiente.' },
      { value: 6, label: 'A (Alto)', description: 'Salud(3): Daños permanentes o severos (ej. Hidróxido de potasio). / Inflamabilidad(3): Líquidos/sólidos que encienden casi bajo cualquier condición (23°C - 38°C). / Reactividad(3): Capaz de detonar, pero requiere fuerte iniciador o calentamiento.' },
      { value: 2, label: 'M (Medio)', description: 'Salud(2): Incapacidad temporal o daño permanente posible (ej. Trietanolamina). / Inflamabilidad(2): Debe calentarse moderadamente antes de ignición (38°C - 93°C). / Reactividad(2): Cambio biológico o químico violento a temp/presión elevada.' },
      { value: 0, label: 'B (Bajo)', description: 'Salud(1-0): Solo irritación menor, sin daño residual (ej. Glicerina, Hidrógeno). / Inflamabilidad(1-0): Precalentarse mucho antes de ignición (> 93°C) o no se quema. / Reactividad(1-0): Normalmente estable, no reacciona violento con agua (ej. Helio).' },
    ],
  },
  biologico: {
    label: 'Biológico',
    keywords: ['biológico', 'biologic', 'bacteria', 'virus', 'hongo', 'parásito', 'infectocontagios'],
    note: 'NOTA GTC-45 §Anexo C: La información específica sobre clasificación de agentes biológicos puede consultarse en el cuadro de Clasificación de Peligros (véase el Anexo A de la GTC-45).',
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Exposición a agentes biológicos de alto riesgo (clase 3 o 4 según Anexo A) sin barreras ni EPP.' },
      { value: 6, label: 'A (Alto)', description: 'Exposición posible a agentes clase 2-3, sin vacunación disponible y sin protocolos formales.' },
      { value: 2, label: 'M (Medio)', description: 'Exposición a agentes biológicos con barreras físicas parciales y EPP básico.' },
      { value: 0, label: 'B (Bajo)', description: 'Control de exposición efectivo: vacunación, EPP apropiado, protocolos y vigilancia sanitaria.' },
    ],
  },
  biomecanico: {
    label: 'Biomecánico',
    keywords: ['biomecan', 'biomécan', 'ergon', 'postura', 'repetitiv', 'levantamiento', 'carga', 'escritorio', 'computador', 'digitaci', 'sedentari', 'monitor', 'teclado', 'mouse', 'pantalla', 'puesto de trabajo'],
    note: 'NOTA GTC-45 §Anexo C: Para calificar los peligros biomecánicos de forma más detallada puede tomarse como base las NTC relacionadas con ergonomía: NTC 5693-1, NTC 5693-2, NTC 5693-3, NTC 5723, NTC 5748, entre otras.',
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Alta carga física, movimiento repetitivo extremo y/o postura forzada mantenida toda la jornada sin pausas ni controles. Aplique NTC 5693-1/2/3, 5723, 5748.' },
      { value: 6, label: 'A (Alto)', description: 'Carga moderada-alta, posturas forzadas frecuentes, controles insuficientes.' },
      { value: 2, label: 'M (Medio)', description: 'Factores ergonómicos presentes con controles parciales (pausas activas, ajuste parcial del puesto).' },
      { value: 0, label: 'B (Bajo)', description: 'Ergonomía adecuada: puesto ajustado, pausas activas, rotación de tareas y formación.' },
    ],
  },
  psicosocial: {
    label: 'Psicosocial',
    keywords: ['psicosocial', 'estrés', 'mental', 'burnout', 'acoso', 'fatiga', 'carga mental', 'turno'],
    note: 'NOTA GTC-45 §Anexo C: Escala basada en la interpretación genérica de niveles de riesgo psicosocial intralaboral propuesta en la Batería de Instrumentos para Evaluación de Factores de Riesgo Psicosocial del Ministerio de la Protección Social, 2010.',
    criteria: [
      { value: 10, label: 'MA (Muy Alto)', description: 'Nivel de riesgo psicosocial MUY ALTO según Batería Ministerio Protección Social 2010. Sin intervención.' },
      { value: 6, label: 'A (Alto)', description: 'Nivel de riesgo psicosocial ALTO según Batería. Intervenciones insuficientes.' },
      { value: 2, label: 'M (Medio)', description: 'Nivel de riesgo psicosocial MEDIO según Batería. Intervenciones en curso.' },
      { value: 0, label: 'B (Bajo)', description: 'Nivel de riesgo psicosocial BAJO según Batería. Controles efectivos implementados.' },
    ],
  },
};

/**
 * Detecta qué entrada del Anexo C aplica para una fila de la matriz GTC-45.
 * PRIORIDAD:
 *   1° — Coincidencia exacta del campo `peligro_clasificacion` (más confiable)
 *   2° — Búsqueda por keywords en la descripción del peligro (fallback)
 * Esto evita que 'carga mental' (psicosocial) se detecte como 'Biomécanico' por la keyword 'carga'.
 */
/** Normaliza texto quitando tildes y convirtiendo a minúsculas para comparaciones más robustas */
function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function detectAnnexCType(clasificacion: string, descripcion?: string): string | null {
  const clas = normalize(clasificacion);
  const desc = normalize(descripcion || '');
  const combined = `${clas} ${desc}`;

  // ── PRIORIDAD 1: coincidencia en clasificación (normalizada, sin tildes) ────
  if (clas.includes('psicosocial')) return 'psicosocial';

  // Biomecánico — detecta todas las variantes: Biomecánico, Biomecanico, BIOMECÁNICO, ergonomico, etc.
  if (
    clas.includes('biomecan') ||
    clas.includes('biomecan') ||
    clas.includes('ergon') ||
    (clas.includes('bio') && clas.includes('mec'))
  ) return 'biomecanico';

  if (clas.includes('biol')) return 'biologico';
  if (clas.includes('quimic') || clas.includes('qca')) return 'quimico';
  if (clas.includes('locativ')) return 'biomecanico'; // Locativo usa escala de deficiencias físicas genérica

  if (clas.includes('fisic') || clas.includes('fisic')) {
    // Subrefinamiento físico por descripción
    if (desc.includes('ruido') || desc.includes('acustic') || desc.includes('decibel')) return 'ruido';
    if (desc.includes('iluminac') || desc.includes('luminanc') || desc.includes('lux') || desc.includes('brillo')) return 'iluminacion';
    if (desc.includes('temperatura') || desc.includes('termico') || desc.includes('calor') || desc.includes('frio')) return 'temperatura';
    if (desc.includes('vibrac')) return 'vibraciones';
    if (desc.includes('ionizante') || desc.includes('rayos x') || desc.includes('gamma') || desc.includes('radiactiv')) return 'rad_ionizante';
    if (desc.includes('no ionizante') || desc.includes('ultravioleta') || desc.includes('laser') || desc.includes('infrarrojo')) return 'rad_no_ionizante';
    return 'iluminacion'; // fallback genérico físico
  }

  // ── PRIORIDAD 2: keywords en descripción del peligro ─────────────────────
  // Psicosocial
  if (combined.includes('psicosocial') || combined.includes('estres laboral') ||
      combined.includes('burnout') || combined.includes('acoso') ||
      combined.includes('carga mental') || combined.includes('fatiga mental') ||
      combined.includes('ansiedad') || combined.includes('turno nocturno')) return 'psicosocial';

  // Biológico
  if (combined.includes('bacteria') || combined.includes('virus') ||
      combined.includes('biologico') || combined.includes('hongo') || combined.includes('parasito')) return 'biologico';

  // Químico
  if (combined.includes('polvo') || combined.includes('vapor') || combined.includes('gas') ||
      combined.includes('solvente') || combined.includes('aerosol') || combined.includes('quimico') ||
      combined.includes('sustancia')) return 'quimico';

  // Biomecánico — keywords ampliadas para capturar descripciones reales de la IA
  if (
    combined.includes('postura') || combined.includes('repetitiv') ||
    combined.includes('levantamiento') || combined.includes('carga postural') ||
    combined.includes('musculoesquelet') || combined.includes('lumbar') ||
    combined.includes('espalda') || combined.includes('escritorio') ||
    combined.includes('computador') || combined.includes('teclado') ||
    combined.includes('mouse') || combined.includes('digitac') ||
    combined.includes('sedentari') || combined.includes('pantalla') ||
    combined.includes('monitor') || combined.includes('puesto') ||
    combined.includes('ergon') || combined.includes('articulac') ||
    combined.includes('muñeca') || combined.includes('columna') ||
    combined.includes('cuello') || combined.includes('hombro') ||
    combined.includes('tension muscular') || combined.includes('movimiento')
  ) return 'biomecanico';

  // Físico genérico
  if (combined.includes('ruido')) return 'ruido';
  if (combined.includes('temperatura') || combined.includes('termico')) return 'temperatura';
  if (combined.includes('vibrac')) return 'vibraciones';
  if (combined.includes('iluminac') || combined.includes('luz artificial')) return 'iluminacion';

  return null;
}

/** Keywords para el Gráfico C (Enfermedades Potenciales) */
export const DISEASE_KEYWORDS = [
  { name: 'Lumbalgia / Dorsopatía', keywords: ['lumbalgia', 'lumbar', 'dorsopatía', 'espalda'] },
  { name: 'S. Túnel Carpiano', keywords: ['túnel carpiano', 'stc', 'muñeca', 'nervio mediano'] },
  { name: 'Estrés / Burnout', keywords: ['estrés', 'burnout', 'agotamiento', 'ansiedad', 'sobrecarga'] },
  { name: 'Hipoacusia', keywords: ['hipoacusia', 'pérdida auditiva', 'sordera'] },
  { name: 'Dermatitis', keywords: ['dermatitis', 'irritación piel', 'alergia dérmica'] },
  { name: 'Epicondilitis', keywords: ['epicondilitis', 'codo', 'tendinitis'] },
  { name: 'Fatiga Visual', keywords: ['fatiga visual', 'ojo seco', 'trastorno visual'] },
  { name: 'Enf. Respiratorias', keywords: ['neumoconiosis', 'asma', 'epoc', 'polvo', 'bronquitis'] },
  { name: 'Enf. Infecciosas', keywords: ['infección', 'virus', 'bacteria', 'contagio'] },
  { name: 'VBM / Raynaud', keywords: ['vibración', 'vbm', 'raynaud', 'mano-brazo'] },
];

/** Colores por nivel de riesgo NR */
export function getNRColor(nr: number): { bg: string; text: string; label: string } {
  if (nr >= 600) return { bg: 'bg-red-600', text: 'text-red-600', label: 'No Aceptable I' };
  if (nr >= 150) return { bg: 'bg-red-500', text: 'text-red-500', label: 'No Aceptable II' };
  if (nr >= 50) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Alto (Mejorar)' };
  if (nr >= 20) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Mejorable' };
  return { bg: 'bg-green-500', text: 'text-green-500', label: 'Aceptable' };
}
