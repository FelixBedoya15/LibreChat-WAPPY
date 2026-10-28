import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Layout,
  MonitorPlay,
  Palette,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  FileText,
  Target,
  LogOut,
  Maximize2,
  Table2,
  BarChart3,
  Link2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Camera,
  X,
  Upload,
  Video,
  TrendingUp,
  TrendingDown,
  Columns,
  GitBranch,
  Quote,
  Award,
  Printer,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import CanvasWorkspaceBridge from './CanvasWorkspaceBridge';

export type SlideThemeKey =
  | 'wappy-dark'
  | 'wappy-cream'
  | 'corporate-light'
  | 'emerald-sst'
  | 'cobalt'
  | 'forest'
  | 'sunset'
  | 'charcoal';

export type SlideLayoutKey =
  | 'title'
  | 'kpi-grid'
  | 'columns'
  | 'timeline'
  | 'table'
  | 'chart'
  | 'quote'
  | 'bullets'
  | 'split'
  | 'media';

export interface SlideKpiItem {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface SlideColumnItem {
  title: string;
  badge?: string;
  theme?: 'danger' | 'success' | 'info' | 'warning';
  items: string[];
}

export interface SlideStepItem {
  phase: string;
  title: string;
  detail: string;
}

export interface Slide {
  title: string;
  subtitle?: string;
  kicker?: string;
  bullets: string[];
  theme?: SlideThemeKey;
  layout?: SlideLayoutKey;
  imageUrl?: string;
  tableHtml?: string;
  chartConfig?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    data?: Array<{ label: string; val: number }>;
    labels?: string[];
    datasets?: Array<{ label: string; data: number[]; color?: string }>;
    title: string;
  };
  kpis?: SlideKpiItem[];
  columns?: SlideColumnItem[];
  steps?: SlideStepItem[];
  quote?: string;
  citation?: string;
  takeaway?: string;
  speakerNotes?: string;
}

interface CanvasSlidesEditorProps {
  initialContent: string | Slide[];
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

function stripHtmlTags(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonArray(str: string): any[] | null {
  if (!str) return null;

  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.slides)) return parsed.slides;
  } catch (e) {
    // Continue to extract
  }

  const startIdx = str.indexOf('[');
  const endIdx = str.lastIndexOf(']');

  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    return null;
  }

  const candidate = str.slice(startIdx, endIdx + 1);

  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    try {
      let cleaned = candidate
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(?:^|\s)\/\/.*$/gm, '');

      cleaned = cleaned.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');

      const parsedCleaned = JSON.parse(cleaned);
      if (Array.isArray(parsedCleaned)) return parsedCleaned;
    } catch (err) {
      console.error('Failed both standard and cleaned JSON extraction for slides:', err);
    }
  }

  return null;
}

function normalizeSlide(raw: any, idx: number): Slide {
  const bulletsRaw = Array.isArray(raw?.bullets)
    ? raw.bullets.map((b: any) => String(b || '').trim()).filter(Boolean)
    : typeof raw?.content === 'string' && raw.content.trim()
      ? raw.content
          .split(/\n|•|-/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : ['Indicador clave de gestión SG-SST', 'Control operativo verificado en campo'];

  let chartConfig = raw?.chartConfig;
  if (chartConfig) {
    let dataArr = Array.isArray(chartConfig.data) ? chartConfig.data : [];
    if (
      dataArr.length === 0 &&
      Array.isArray(chartConfig.labels) &&
      Array.isArray(chartConfig.datasets) &&
      chartConfig.datasets[0]?.data
    ) {
      dataArr = chartConfig.labels.map((lbl: string, i: number) => ({
        label: String(lbl),
        val: Number(chartConfig.datasets[0].data[i] || 0),
      }));
    }
    chartConfig = {
      type: chartConfig.type === 'doughnut' ? 'pie' : chartConfig.type || 'bar',
      title: chartConfig.title || raw?.title || 'Análisis Cuantitativo',
      data: dataArr,
      labels: chartConfig.labels,
      datasets: chartConfig.datasets,
    };
  }

  return {
    title: raw?.title || `Diapositiva ${idx + 1}`,
    subtitle: raw?.subtitle || '',
    kicker: raw?.kicker || raw?.badge || '',
    bullets: bulletsRaw.length > 0 ? bulletsRaw : ['Punto estratégico'],
    theme: (raw?.theme as SlideThemeKey) || (idx === 0 ? 'wappy-dark' : 'cobalt'),
    layout: (raw?.layout as SlideLayoutKey) || (idx === 0 ? 'title' : 'bullets'),
    imageUrl: raw?.imageUrl || '',
    tableHtml: raw?.tableHtml || '',
    chartConfig,
    kpis: Array.isArray(raw?.kpis)
      ? raw.kpis
      : Array.isArray(raw?.metrics)
        ? raw.metrics
        : undefined,
    columns: Array.isArray(raw?.columns) ? raw.columns : undefined,
    steps: Array.isArray(raw?.steps) ? raw.steps : undefined,
    quote: raw?.quote || '',
    citation: raw?.citation || raw?.normativeRef || '',
    takeaway: raw?.takeaway || '',
    speakerNotes: raw?.speakerNotes || '',
  };
}

interface ThemeSpec {
  label: string;
  bg: string;
  text: string;
  subtext: string;
  accent: string;
  accentBg: string;
  border: string;
  cardBg: string;
  isLight?: boolean;
  pptBg: string;
  pptText: string;
  pptSubtext: string;
  pptAccent: string;
  pptCardBg: string;
  pptCardBorder: string;
}

export const THEMES: Record<SlideThemeKey, ThemeSpec> = {
  'wappy-dark': {
    label: 'WAPPY Dark Tech',
    bg: 'bg-gradient-to-br from-[#080d02] via-[#0e1705] to-[#071614]',
    text: 'text-white',
    subtext: 'text-slate-300',
    accent: 'text-[#c7f303]',
    accentBg: 'bg-[#c7f303]/15 border-[#c7f303]/40 text-[#c7f303]',
    border: 'border-[#c7f303]/30',
    cardBg: 'bg-white/[0.06] border-white/10',
    isLight: false,
    pptBg: '0B1304',
    pptText: 'FFFFFF',
    pptSubtext: 'CBD5E1',
    pptAccent: 'C7F303',
    pptCardBg: '15220A',
    pptCardBorder: '2D4A18',
  },
  'wappy-cream': {
    label: 'WAPPY Editorial Cream',
    bg: 'bg-gradient-to-br from-[#faf9f5] via-[#f4f2ea] to-[#e9e5d8]',
    text: 'text-[#0e1300]',
    subtext: 'text-slate-600',
    accent: 'text-[#0d9488]',
    accentBg: 'bg-teal-500/10 border-teal-500/30 text-teal-800',
    border: 'border-teal-600/25',
    cardBg: 'bg-white/85 border-slate-300/80 shadow-sm',
    isLight: true,
    pptBg: 'F6F5EF',
    pptText: '0E1300',
    pptSubtext: '475569',
    pptAccent: '0D9488',
    pptCardBg: 'FFFFFF',
    pptCardBorder: 'CBD5E1',
  },
  'corporate-light': {
    label: 'McKinsey Light',
    bg: 'bg-gradient-to-br from-white via-slate-50 to-blue-50/60',
    text: 'text-slate-900',
    subtext: 'text-slate-600',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-600/10 border-blue-600/30 text-blue-800',
    border: 'border-blue-500/25',
    cardBg: 'bg-white/90 border-slate-200 shadow-sm',
    isLight: true,
    pptBg: 'F8FAFC',
    pptText: '0F172A',
    pptSubtext: '475569',
    pptAccent: '1D4ED8',
    pptCardBg: 'FFFFFF',
    pptCardBorder: 'CBD5E1',
  },
  'emerald-sst': {
    label: 'Esmeralda SG-SST',
    bg: 'bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-950',
    text: 'text-white',
    subtext: 'text-emerald-100/80',
    accent: 'text-teal-300',
    accentBg: 'bg-teal-400/15 border-teal-400/35 text-teal-300',
    border: 'border-teal-500/35',
    cardBg: 'bg-white/[0.06] border-teal-400/20',
    isLight: false,
    pptBg: '042F2E',
    pptText: 'FFFFFF',
    pptSubtext: 'CCFBF1',
    pptAccent: '2DD4BF',
    pptCardBg: '064E3B',
    pptCardBorder: '0F766E',
  },
  cobalt: {
    label: 'Cobalto Ejecutivo',
    bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950',
    text: 'text-white',
    subtext: 'text-blue-100/80',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300',
    border: 'border-blue-500/35',
    cardBg: 'bg-white/[0.06] border-white/10',
    isLight: false,
    pptBg: '0F172A',
    pptText: 'FFFFFF',
    pptSubtext: 'CBD5E1',
    pptAccent: '38BDF8',
    pptCardBg: '1E293B',
    pptCardBorder: '334155',
  },
  forest: {
    label: 'Bosque Bio-SST',
    bg: 'bg-gradient-to-br from-emerald-950 via-green-950 to-slate-900',
    text: 'text-white',
    subtext: 'text-emerald-100/80',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    border: 'border-emerald-500/35',
    cardBg: 'bg-white/[0.06] border-white/10',
    isLight: false,
    pptBg: '064E3B',
    pptText: 'FFFFFF',
    pptSubtext: 'D1FAE5',
    pptAccent: '34D399',
    pptCardBg: '065F46',
    pptCardBorder: '059669',
  },
  sunset: {
    label: 'Ámbar Alerta',
    bg: 'bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950',
    text: 'text-white',
    subtext: 'text-rose-100/80',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
    border: 'border-rose-500/35',
    cardBg: 'bg-white/[0.06] border-white/10',
    isLight: false,
    pptBg: '451A03',
    pptText: 'FFFFFF',
    pptSubtext: 'FDE68A',
    pptAccent: 'FBBF24',
    pptCardBg: '78350F',
    pptCardBorder: 'B45309',
  },
  charcoal: {
    label: 'Carbón Minimal',
    bg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-black',
    text: 'text-white',
    subtext: 'text-zinc-300',
    accent: 'text-teal-400',
    accentBg: 'bg-teal-500/15 border-teal-500/35 text-teal-300',
    border: 'border-zinc-700',
    cardBg: 'bg-white/[0.05] border-white/10',
    isLight: false,
    pptBg: '18181B',
    pptText: 'FFFFFF',
    pptSubtext: 'D4D4D8',
    pptAccent: '2DD4BF',
    pptCardBg: '27272A',
    pptCardBorder: '3F3F46',
  },
};

export const LAYOUT_OPTIONS: Array<{ key: SlideLayoutKey; label: string; desc: string }> = [
  { key: 'title', label: 'Portada', desc: 'Lámina principal de apertura' },
  { key: 'kpi-grid', label: 'Tarjetas KPI', desc: 'Métricas e indicadores clave' },
  { key: 'columns', label: 'Comparativa', desc: '2 o 3 columnas ejecutivas' },
  { key: 'timeline', label: 'Hoja de Ruta', desc: 'Fases o Ciclo PHVA' },
  { key: 'bullets', label: 'Puntos Clave', desc: 'Tarjetas de síntesis ejecutiva' },
  { key: 'table', label: 'Matriz / Tabla', desc: 'Tabla técnica estructurada' },
  { key: 'chart', label: 'Gráfico Datos', desc: 'Visualización estadística' },
  { key: 'quote', label: 'Cita Legal', desc: 'Fundamento normativo SST' },
  { key: 'split', label: 'Split Imagen', desc: 'Evidencia visual + análisis' },
  { key: 'media', label: 'Full Media', desc: 'Fondo visual inmersivo' },
];

export const PRESENTATION_TEMPLATES: Array<{
  id: string;
  name: string;
  category: string;
  slides: Slide[];
}> = [
  {
    id: 'rendicion-alta-direccion',
    name: 'Rendición de Cuentas Alta Dirección (Dec. 1072)',
    category: 'Gerencial',
    slides: [
      {
        title: 'Informe Ejecutivo de Rendición de Cuentas SG-SST',
        subtitle: 'Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora Continua',
        kicker: 'DECRETO 1072 DE 2015 · ART. 2.2.4.6.31',
        layout: 'title',
        theme: 'wappy-dark',
        bullets: [
          'Revisión integral del Sistema de Gestión de Seguridad y Salud en el Trabajo',
          'Cumplimiento de Estándares Mínimos Resolución 0312 de 2019',
        ],
        takeaway: 'Presentación oficial para aprobación y firma de la Alta Dirección.',
        speakerNotes: 'Dar la bienvenida al comité directivo y presentar el balance anual del SG-SST.',
      },
      {
        title: 'El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual',
        subtitle: 'Balance cuantitativo de los cuatro indicadores rectores del sistema',
        kicker: 'TABLERO DE CONTROL GERENCIAL',
        layout: 'kpi-grid',
        theme: 'wappy-dark',
        bullets: [
          'Cumplimiento Estándares 0312: 94.5% (Nivel Aceptable)',
          'ejecución del Plan de Trabajo Anual: 92% de actividades cerradas',
          'Índice de Frecuencia ATEL: Reducción del 35% frente al periodo anterior',
          'Cobertura de Capacitación y Entrenamiento: 100% del personal operativo',
        ],
        kpis: [
          { label: 'Estándares Res. 0312', value: '94.5%', delta: '+14.5% vs año ant.', trend: 'up', description: 'Calificación Aceptable (>85%)' },
          { label: 'Plan Anual SST', value: '92.0%', delta: '46 de 50 actividades', trend: 'up', description: 'Ejecución presupuestal del 96%' },
          { label: 'Siniestralidad ATEL', value: '-35%', delta: '0 accidentes graves', trend: 'down', description: 'Reducción sostenida en planta' },
          { label: 'Cobertura EMO', value: '100%', delta: 'Res. 1843 de 2025', trend: 'up', description: 'Profesiograma y SVE al día' },
        ],
        takeaway: 'La inversión en prevención en la fuente redujo los días perdidos por incapacidad en un 41%.',
      },
      {
        title: 'Transición de controles reactivos hacia controles de ingeniería en la fuente',
        subtitle: 'Comparativa de cierre de brechas críticas identificadas en la Matriz GTC-45',
        kicker: 'GESTIÓN DE PELIGROS Y RIESGOS',
        layout: 'columns',
        theme: 'emerald-sst',
        bullets: [
          'Sustitución de manipulación manual de cargas por ayudas mecánicas',
          'Digitalización de permisos de trabajo de alto riesgo en WAPPY',
        ],
        columns: [
          {
            title: 'Estado Inicial (Riesgo Crítico)',
            badge: 'Nivel I — NR 600',
            theme: 'danger',
            items: [
              'Manipulación manual de cargas >25 kg sin ayudas mecánicas en bodega.',
              'Registros en papel sin trazabilidad en tiempo real para trabajo en alturas.',
              'Fatiga postural reportada en el 38% de los cargos operativos.',
            ],
          },
          {
            title: 'Intervención Ejecutada (Ingeniería)',
            badge: 'Nivel III — NR 80',
            theme: 'success',
            items: [
              'Implementación de estibadores hidráulicos y mesas niveladoras ergonómicas.',
              'Control digital de listas de chequeo y permisos en WAPPY IA.',
              'Programa de vigilancia epidemiológica osteomuscular con cobertura 100%.',
            ],
          },
        ],
        takeaway: 'El 100% de los peligros Nivel I fueron intervenidos con medidas de ingeniería y administrativas.',
      },
      {
        title: 'Evolución trimestral del cumplimiento normativo vs accidentalidad',
        subtitle: 'Tendencia histórica verificada por el COPASST y la ARL',
        kicker: 'ANALÍTICA DE TENDENCIAS',
        layout: 'chart',
        theme: 'cobalt',
        bullets: [
          'Crecimiento sostenido en el cierre de hallazgos ACPM durante los 4 trimestres.',
          'Correlación directa entre capacitación práctica y cero accidentes en Q4.',
        ],
        chartConfig: {
          type: 'bar',
          title: '% Cumplimiento del Cronograma SG-SST por Trimestre',
          data: [
            { label: 'Trimestre 1', val: 78 },
            { label: 'Trimestre 2', val: 85 },
            { label: 'Trimestre 3', val: 91 },
            { label: 'Trimestre 4', val: 95 },
          ],
        },
        takeaway: 'Meta para el próximo ciclo: sostener el cumplimiento por encima del 96% mensual.',
      },
      {
        title: 'Hoja de Ruta Estratégica PHVA para el Próximo Periodo Fiscal',
        subtitle: 'Prioridades aprobadas para presupuesto y recursos técnicos',
        kicker: 'PLAN DE MEJORA CONTINUA',
        layout: 'timeline',
        theme: 'wappy-cream',
        bullets: [
          'Q1: Actualización de matriz legal, medición higiénica de iluminación y ruido',
          'Q2: Aplicación de Batería de Riesgo Psicosocial y talleres de liderazgo',
          'Q3: Simulacro general de emergencias y auditoría interna cruzada',
          'Q4: Evaluación de eficacia de SVE y revisión por la Alta Dirección',
        ],
        steps: [
          { phase: 'FASE 1 · PLANEAR (Q1)', title: 'Diagnóstico e Higiene Industrial', detail: 'Actualización GTC-45, matriz legal y mediciones ambientales con ARL.' },
          { phase: 'FASE 2 · HACER (Q2)', title: 'Intervención Psicosocial y Biomecánica', detail: 'Ejecución de SVE, pausas activas dirigidas y formación de brigadistas.' },
          { phase: 'FASE 3 · VERIFICAR (Q3)', title: 'Auditoría Interna e Inspecciones', detail: 'Verificación de cumplimiento Decreto 1072 y simulacro de evacuación.' },
          { phase: 'FASE 4 · ACTUAR (Q4)', title: 'Cierre de ACPM y Certificación', detail: 'Cierre del 100% de acciones correctivas y reporte al Ministerio/ARL.' },
        ],
        takeaway: 'Presupuesto requerido: asignación del 100% de recursos para controles prioritarios.',
      },
      {
        title: 'Responsabilidad legal indelegable de la Alta Dirección en la prevención',
        kicker: 'FUNDAMENTO JURÍDICO',
        layout: 'quote',
        theme: 'wappy-dark',
        quote: 'El empleador está obligado a la protección de la seguridad y la salud de los trabajadores, acorde con lo establecido en la normatividad vigente, asegurando la asignación de recursos financieros, técnicos y el personal necesario.',
        citation: 'Decreto Único Reglamentario 1072 de 2015 — Artículo 2.2.4.6.8 (Obligaciones de los Empleadores)',
        bullets: [
          'Prevención de culpa patronal (Art. 216 del Código Sustantivo del Trabajo).',
          'Blindaje jurídico ante inspecciones del Ministerio del Trabajo.',
        ],
        takeaway: 'La firma del acta de revisión gerencial formaliza el compromiso institucional.',
      },
    ],
  },
  {
    id: 'induccion-sgsst',
    name: 'Inducción y Reinducción Corporativa SG-SST',
    category: 'Capacitación',
    slides: [
      {
        title: 'Inducción General al Sistema de Gestión SG-SST',
        subtitle: 'Política de Seguridad, Derechos, Deberes, Peligros Prioritarios y Actuación ante Emergencias',
        kicker: 'BIENVENIDA Y CULTURA DE AUTOCUIDADO',
        layout: 'title',
        theme: 'emerald-sst',
        bullets: ['Conoce los riesgos de tu cargo y cómo protegemos tu vida todos los días'],
        takeaway: 'En nuestra empresa ninguna meta operativa está por encima de tu seguridad.',
      },
      {
        title: 'Nuestros 4 Pilares de Cultura Preventiva y Cero Daño',
        kicker: 'POLÍTICA INTEGRAL SG-SST',
        layout: 'kpi-grid',
        theme: 'wappy-cream',
        bullets: [
          'Meta Cero Accidentes Graves o Mortales',
          '100% Reporte de Condiciones Inseguras',
          'Comités Activos: COPASST y Convivencia Laboral',
          'Cobertura ARL desde el primer día de ingreso',
        ],
        kpis: [
          { label: 'Meta Siniestralidad', value: '0 ATEL', delta: 'Prioridad Vida', trend: 'up', description: 'Todo accidente es 100% prevenible' },
          { label: 'Comités Paritarios', value: '2 Comités', delta: 'COPASST + CCL', trend: 'neutral', description: 'Canales de participación activa' },
          { label: 'Protección ARL', value: '100%', delta: 'Cobertura 24/7 laboral', trend: 'up', description: 'Asistencia médica y económica' },
          { label: 'Reporte Preventivo', value: '< 5 min', delta: 'Vía WAPPY IA', trend: 'up', description: 'Reporta actos y condiciones inseguras' },
        ],
        takeaway: 'Tu participación activa es el motor del Sistema de Gestión.',
      },
      {
        title: 'Derechos y Responsabilidades Legales del Trabajador',
        kicker: 'DECRETO 1072 DE 2015 · ART. 2.2.4.6.10',
        layout: 'columns',
        theme: 'corporate-light',
        bullets: ['Equilibrio entre garantías laborales y deberes de autocuidado'],
        columns: [
          {
            title: 'Tus Derechos en SST',
            badge: 'Garantías del Empleador',
            theme: 'info',
            items: [
              'Recibir elementos de protección personal (EPP) certificados y sin costo.',
              'Capacitación continua y ambientes de trabajo seguros y saludables.',
              'Atención médica oportuna a través de la ARL ante cualquier incidente.',
            ],
          },
          {
            title: 'Tus Deberes Legales (Art. 2.2.4.6.10)',
            badge: 'Cumplimiento Obligatorio',
            theme: 'success',
            items: [
              'Procurar el cuidado integral de tu salud y suministrar información clara.',
              'Cumplir las normas, reglamentos e instrucciones del SG-SST.',
              'Informar inmediatamente todo accidente, incidente o condición peligrosa.',
            ],
          },
        ],
        takeaway: 'El autocuidado es un deber legal y ético con tu familia y tus compañeros.',
      },
      {
        title: 'Protocolo de Actuación en Caso de Accidente o Emergencia',
        kicker: 'RUTA DE RESPUESTA INMEDIATA',
        layout: 'timeline',
        theme: 'wappy-dark',
        bullets: ['Pasos inmediatos ante cualquier evento en el lugar de trabajo'],
        steps: [
          { phase: 'PASO 1 · ALERTA INMEDIATA', title: 'Detén la labor y avisa a tu jefe inmediato', detail: 'Todo evento, por leve que parezca, debe reportarse el mismo día.' },
          { phase: 'PASO 2 · PRIMEROS AUXILIOS', title: 'Activación de la Brigada de Emergencia', detail: 'Valoración primaria en sitio y estabilización sin mover al lesionado grave.' },
          { phase: 'PASO 3 · REPORTE ARL', title: 'Línea de atención ARL y traslado médico', detail: 'Radicación del FURAT dentro de las 48 horas hábiles legales.' },
          { phase: 'PASO 4 · INVESTIGACIÓN', title: 'Lecciones aprendidas (Res. 1401 de 2007)', detail: 'Identificación de causas raíz para evitar que vuelva a ocurrir.' },
        ],
        takeaway: 'Recuerda: Nunca ocultes un incidente; reportarlo a tiempo salva vidas.',
      },
    ],
  },
  {
    id: 'investigacion-atel',
    name: 'Informe de Investigación de Accidente (Res. 1401/2007)',
    category: 'Operativo',
    slides: [
      {
        title: 'Investigación Técnica de Accidente de Trabajo y Lecciones Aprendidas',
        subtitle: 'Metodología de Árbol de Causas, Factores Personales/Del Trabajo y Plan de Acción Correctiva',
        kicker: 'RESOLUCIÓN 1401 DE 2007 · DECRETO 1072 DE 2015',
        layout: 'title',
        theme: 'sunset',
        bullets: ['Análisis técnico del equipo investigador y representante del COPASST'],
        takeaway: 'Investigamos para encontrar causas y prevenir repeticiones, nunca para buscar culpables.',
      },
      {
        title: 'Análisis Causal: Causas Inmediatas vs. Causas Básicas (NTC 3701)',
        kicker: 'DIAGNÓSTICO DE CAUSA RAÍZ',
        layout: 'columns',
        theme: 'wappy-dark',
        bullets: ['Desglose técnico según metodología NTC 3701 y los 5 Porqués'],
        columns: [
          {
            title: 'Causas Inmediatas (Síntomas)',
            badge: 'Actos y Condiciones Subestándar',
            theme: 'danger',
            items: [
              'Condición subestándar: Superficie húmeda sin señalización preventiva en pasillo B.',
              'Acto subestándar: Desplazamiento rápido manipulando carga que obstruía visibilidad.',
              'Uso de calzado con desgaste en labrado antideslizante.',
            ],
          },
          {
            title: 'Causas Básicas (Raíz Estructural)',
            badge: 'Factores del Trabajo y Personales',
            theme: 'warning',
            items: [
              'Factor del trabajo: Ausencia de estándar de orden y aseo durante limpieza en turno.',
              'Supervisión insuficiente en la inspección preoperacional de calzado EPP.',
              'Falta de demarcación de vías peatonales segregadas.',
            ],
          },
        ],
        takeaway: 'Atacar únicamente la causa inmediata deja latente el 80% del riesgo de repetición.',
      },
      {
        title: 'Plan de Acción Correctiva y Preventiva (ACPM) de Cumplimiento Estricto',
        kicker: 'JERARQUÍA DE CONTROLES',
        layout: 'table',
        theme: 'wappy-cream',
        bullets: ['Medidas de ingeniería, administrativas y en el trabajador'],
        tableHtml: `<table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#0d9488; color:#ffffff;">
              <th style="padding:10px; text-align:left;">Tipo Control</th>
              <th style="padding:10px; text-align:left;">Medida de Intervención</th>
              <th style="padding:10px; text-align:left;">Responsable</th>
              <th style="padding:10px; text-align:left;">Fecha Límite</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#ffffff; color:#0f172a; border-bottom:1px solid #cbd5e1;">
              <td style="padding:10px; font-weight:bold;">Ingeniería (Fuente)</td>
              <td style="padding:10px;">Aplicación de recubrimiento epóxico antideslizante y drenaje</td>
              <td style="padding:10px;">Jefe de Mantenimiento</td>
              <td style="padding:10px;">15 Días</td>
            </tr>
            <tr style="background:#f8fafc; color:#0f172a; border-bottom:1px solid #cbd5e1;">
              <td style="padding:10px; font-weight:bold;">Administrativo (Medio)</td>
              <td style="padding:10px;">Protocolo de bloqueo de pasillo durante lavado y señalización</td>
              <td style="padding:10px;">Coordinador SST</td>
              <td style="padding:10px;">Inmediato</td>
            </tr>
            <tr style="background:#ffffff; color:#0f172a;">
              <td style="padding:10px; font-weight:bold;">Individuo</td>
              <td style="padding:10px;">Reposición de botas con suela certificada y divulgación de lección</td>
              <td style="padding:10px;">Supervisor de Área</td>
              <td style="padding:10px;">5 Días</td>
            </tr>
          </tbody>
        </table>`,
        takeaway: 'Verificación de eficacia programada a los 30 días con cierre documental en WAPPY.',
      },
    ],
  },
];

interface SlideEditableTextProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  tagName?: 'h1' | 'h2' | 'div' | 'span';
}

const SlideEditableText: React.FC<SlideEditableTextProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  tagName = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const handleBlur = () => {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const Tag = tagName as any;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      className={`outline-none focus:ring-1 focus:ring-teal-500/40 rounded px-1 transition-all ${className} relative empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 empty:before:pointer-events-none empty:before:absolute`}
      data-placeholder={placeholder}
      style={{ minWidth: '40px' }}
    />
  );
};

const CanvasSlidesEditor: React.FC<CanvasSlidesEditorProps> = ({
  initialContent,
  onUpdate,
  title,
  isMaximized = false,
  onRegisterDownload,
}) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showTemplateMenu, setShowTemplateMenu] = useState<boolean>(false);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);
  const [isEnhancingSlide, setIsEnhancingSlide] = useState<boolean>(false);

  // Presentation Mode States
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showLaser, setShowLaser] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBridgeOpen, setIsBridgeOpen] = useState<boolean>(false);

  // Image Modal & Camera states
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'url'>('upload');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCameraActiveRef = useRef<boolean>(false);

  const execCmd = (command: string, arg = '') => {
    document.execCommand(command, false, arg);
  };

  const startCamera = async () => {
    setCameraError(null);
    isCameraActiveRef.current = true;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      if (!isCameraActiveRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isImageModalOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isImageModalOpen, activeTab]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveImageToSlide(dataUrl);
      }
    }
  };

  const saveImageToSlide = (url: string) => {
    const activeSlide = slides[activeIndex];
    const currentLayout = activeSlide?.layout || 'bullets';
    let newLayout: SlideLayoutKey = currentLayout;
    if (currentLayout === 'title' || currentLayout === 'bullets') {
      newLayout = 'split';
    }

    updateSlide(activeIndex, {
      imageUrl: url,
      layout: newLayout,
    });

    setIsImageModalOpen(false);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          saveImageToSlide(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          saveImageToSlide(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load content
  useEffect(() => {
    if (initialContent) {
      if (Array.isArray(initialContent) && initialContent.length > 0) {
        setSlides(initialContent.map((s, idx) => normalizeSlide(s, idx)));
        return;
      }
      if (typeof initialContent === 'string') {
        const parsed = extractJsonArray(initialContent);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed.map((s, idx) => normalizeSlide(s, idx)));
          return;
        }
      }
    }
    setSlides(PRESENTATION_TEMPLATES[0].slides);
  }, [initialContent]);

  // Global keyboard listeners for presentation mode
  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPresenting(false);
        setShowLaser(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  const updateSlide = (idx: number, updatedFields: Partial<Slide>) => {
    const updated = slides.map((slide, sIdx) =>
      sIdx === idx ? { ...slide, ...updatedFields } : slide,
    );
    setSlides(updated);
    onUpdate(JSON.stringify(updated));
  };

  const addSlide = () => {
    const currentTheme = slides[activeIndex]?.theme || 'wappy-dark';
    const newSlide: Slide = {
      title: 'Nuevo Hallazgo o Estrategia Clave',
      subtitle: 'Subtítulo ejecutivo de contexto normativo o técnico',
      kicker: 'ESTRATEGIA SG-SST',
      bullets: [
        'Primer indicador o acción prioritaria verificable en campo.',
        'Segunda medida de control de ingeniería o administrativa.',
        'Impacto proyectado en la reducción de riesgos laborales.',
      ],
      theme: currentTheme,
      layout: 'bullets',
      takeaway: 'Conclusión ejecutiva: priorizar la intervención en la fuente.',
    };
    const updated = [...slides];
    updated.splice(activeIndex + 1, 0, newSlide);
    setSlides(updated);
    setActiveIndex(activeIndex + 1);
    onUpdate(JSON.stringify(updated));
  };

  const duplicateSlide = () => {
    const active = slides[activeIndex];
    if (!active) return;
    const copy: Slide = JSON.parse(JSON.stringify(active));
    copy.title = `${stripHtmlTags(copy.title)} (Copia)`;
    const updated = [...slides];
    updated.splice(activeIndex + 1, 0, copy);
    setSlides(updated);
    setActiveIndex(activeIndex + 1);
    onUpdate(JSON.stringify(updated));
  };

  const moveSlide = (direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? activeIndex - 1 : activeIndex + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(activeIndex, 1);
    updated.splice(targetIdx, 0, moved);
    setSlides(updated);
    setActiveIndex(targetIdx);
    onUpdate(JSON.stringify(updated));
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, idx) => idx !== activeIndex);
    setSlides(updated);
    setActiveIndex(Math.max(0, activeIndex - 1));
    onUpdate(JSON.stringify(updated));
  };

  const updateBullet = (bulletIdx: number, val: string) => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    const updatedBullets = activeSlide.bullets.map((b, bIdx) => (bIdx === bulletIdx ? val : b));
    updateSlide(activeIndex, { bullets: updatedBullets });
  };

  const addBullet = () => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    updateSlide(activeIndex, { bullets: [...activeSlide.bullets, 'Nuevo punto estratégico'] });
  };

  const deleteBullet = (bulletIdx: number) => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide || activeSlide.bullets.length <= 1) return;
    const updatedBullets = activeSlide.bullets.filter((_, bIdx) => bIdx !== bulletIdx);
    updateSlide(activeIndex, { bullets: updatedBullets });
  };

  const handleApplyPresentationTemplate = (tplId: string) => {
    const found = PRESENTATION_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    const cloned = JSON.parse(JSON.stringify(found.slides));
    setSlides(cloned);
    setActiveIndex(0);
    setShowTemplateMenu(false);
    onUpdate(JSON.stringify(cloned));
  };

  const handleSmartTransformSlide = () => {
    const s = slides[activeIndex];
    if (!s) return;
    setIsEnhancingSlide(true);
    setTimeout(() => {
      const order: SlideLayoutKey[] = ['kpi-grid', 'columns', 'timeline', 'quote', 'bullets'];
      const currIdx = order.indexOf(s.layout || 'bullets');
      const nextLayout = order[(currIdx + 1) % order.length];
      const updates: Partial<Slide> = {
        layout: nextLayout,
        kicker: s.kicker || 'INSIGHT EJECUTIVO SG-SST',
        takeaway:
          s.takeaway ||
          'El control preventivo en la fuente garantiza el cumplimiento del Decreto 1072 de 2015.',
      };

      if (nextLayout === 'kpi-grid' && (!s.kpis || s.kpis.length === 0)) {
        updates.kpis = s.bullets.slice(0, 4).map((b, i) => {
          const clean = stripHtmlTags(b);
          const parts = clean.split(':');
          return {
            label: parts[0]?.slice(0, 28) || `Indicador Clave ${i + 1}`,
            value: parts[1]?.trim().slice(0, 12) || `${92 + i * 2}%`,
            delta: 'Meta cumplida',
            trend: 'up',
            description: clean.slice(0, 70),
          };
        });
      } else if (nextLayout === 'columns' && (!s.columns || s.columns.length === 0)) {
        const mid = Math.ceil(s.bullets.length / 2);
        updates.columns = [
          {
            title: 'Diagnóstico y Peligros',
            badge: 'Línea Base',
            theme: 'warning',
            items: s.bullets.slice(0, mid).map(stripHtmlTags),
          },
          {
            title: 'Plan de Intervención SST',
            badge: 'Control Efectivo',
            theme: 'success',
            items: s.bullets.slice(mid).map(stripHtmlTags),
          },
        ];
      } else if (nextLayout === 'timeline' && (!s.steps || s.steps.length === 0)) {
        updates.steps = s.bullets.slice(0, 4).map((b, i) => ({
          phase: `FASE 0${i + 1} · PHVA`,
          title: stripHtmlTags(b).slice(0, 45),
          detail: stripHtmlTags(b),
        }));
      } else if (nextLayout === 'quote' && !s.quote) {
        updates.quote = stripHtmlTags(s.bullets[0] || s.title);
        updates.citation = 'Decreto Único Reglamentario 1072 de 2015 · Resolución 0312 de 2019';
      }

      updateSlide(activeIndex, updates);
      setIsEnhancingSlide(false);
    }, 250);
  };

  const handleImportTable = (html: string) => {
    updateSlide(activeIndex, {
      layout: 'table',
      tableHtml: html,
    });
  };

  const handleImportChart = (config: any) => {
    updateSlide(activeIndex, {
      layout: 'chart',
      chartConfig: config,
    });
  };

  const handleImportBullets = (sTitle: string, sBullets: string[]) => {
    const newSlide: Slide = {
      title: sTitle,
      bullets: sBullets,
      theme: slides[activeIndex]?.theme || 'wappy-dark',
      layout: 'bullets',
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setActiveIndex(updated.length - 1);
    onUpdate(JSON.stringify(updated));
  };

  // ── NATIVE POWERPOINT (.PPTX) EXPORT ENGINE ──────────────────────────────
  const handleDownloadPptx = async () => {
    if (isExportingPptx) return;
    setIsExportingPptx(true);
    try {
      const PptxGenModule = await import('pptxgenjs');
      const PptxGenJS = (PptxGenModule as any).default || PptxGenModule;
      const pptx = new PptxGenJS();

      pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
      pptx.author = 'WAPPY IA — Suite Ejecutiva SG-SST';
      pptx.company = 'WAPPY Club';
      pptx.subject = title || 'Presentación Ejecutiva SG-SST';
      pptx.title = title || 'Presentación WAPPY';

      slides.forEach((slide, idx) => {
        const themeSpec = THEMES[slide.theme || 'wappy-dark'] || THEMES['wappy-dark'];
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: themeSpec.pptBg };

        const cleanTitle = stripHtmlTags(slide.title) || `Diapositiva ${idx + 1}`;
        const cleanSubtitle = stripHtmlTags(slide.subtitle || '');
        const cleanKicker = stripHtmlTags(slide.kicker || '').toUpperCase();
        const cleanTakeaway = stripHtmlTags(slide.takeaway || '');
        const layout = slide.layout || 'bullets';

        // Top accent bar
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 10,
          h: 0.08,
          fill: { color: themeSpec.pptAccent },
          line: { color: themeSpec.pptAccent, width: 0 },
        });

        // Header metadata (Deck Title & Slide Number)
        pptSlide.addText(`${stripHtmlTags(title)}  |  LÁMINA ${String(idx + 1).padStart(2, '0')} DE ${String(slides.length).padStart(2, '0')}`, {
          x: 0.6,
          y: 0.2,
          w: 8.8,
          h: 0.25,
          fontSize: 8.5,
          bold: true,
          color: themeSpec.pptSubtext,
          fontFace: 'Arial',
        });

        if (layout === 'title') {
          if (cleanKicker) {
            pptSlide.addText(cleanKicker, {
              x: 0.8,
              y: 1.35,
              w: 8.4,
              h: 0.35,
              fontSize: 11,
              bold: true,
              color: themeSpec.pptAccent,
              align: 'center',
              fontFace: 'Arial',
            });
          }

          pptSlide.addText(cleanTitle, {
            x: 0.8,
            y: 1.8,
            w: 8.4,
            h: 1.6,
            fontSize: 30,
            bold: true,
            color: themeSpec.pptText,
            align: 'center',
            valign: 'middle',
            fontFace: 'Arial',
          });

          if (cleanSubtitle || slide.bullets?.length > 0) {
            pptSlide.addText(cleanSubtitle || stripHtmlTags(slide.bullets[0] || ''), {
              x: 1.2,
              y: 3.55,
              w: 7.6,
              h: 0.9,
              fontSize: 14,
              color: themeSpec.pptSubtext,
              align: 'center',
              fontFace: 'Arial',
            });
          }
        } else {
          // Standard Slide Header (Kicker + Action Title + Subtitle)
          if (cleanKicker) {
            pptSlide.addText(cleanKicker, {
              x: 0.6,
              y: 0.5,
              w: 8.8,
              h: 0.25,
              fontSize: 9.5,
              bold: true,
              color: themeSpec.pptAccent,
              fontFace: 'Arial',
            });
          }

          pptSlide.addText(cleanTitle, {
            x: 0.6,
            y: cleanKicker ? 0.75 : 0.55,
            w: 8.8,
            h: 0.75,
            fontSize: 20,
            bold: true,
            color: themeSpec.pptText,
            valign: 'top',
            fontFace: 'Arial',
          });

          if (cleanSubtitle) {
            pptSlide.addText(cleanSubtitle, {
              x: 0.6,
              y: 1.48,
              w: 8.8,
              h: 0.32,
              fontSize: 11,
              color: themeSpec.pptSubtext,
              fontFace: 'Arial',
            });
          }

          const contentTop = cleanSubtitle ? 1.9 : 1.6;

          if (layout === 'kpi-grid') {
            const kpis: SlideKpiItem[] =
              slide.kpis && slide.kpis.length > 0
                ? slide.kpis
                : slide.bullets.slice(0, 4).map((b, i) => ({
                    label: `Indicador ${i + 1}`,
                    value: `${90 + i * 2}%`,
                    delta: 'Verificado',
                    description: stripHtmlTags(b),
                  }));

            const cards = kpis.slice(0, 4);
            const cols = cards.length <= 2 ? 2 : 2;
            const cardW = 4.25;
            const cardH = cards.length <= 2 ? 2.5 : 1.35;

            cards.forEach((kpi, kIdx) => {
              const colIdx = kIdx % cols;
              const rowIdx = Math.floor(kIdx / cols);
              const cx = 0.6 + colIdx * (cardW + 0.3);
              const cy = contentTop + rowIdx * (cardH + 0.22);

              pptSlide.addShape(pptx.ShapeType.roundRect, {
                x: cx,
                y: cy,
                w: cardW,
                h: cardH,
                fill: { color: themeSpec.pptCardBg },
                line: { color: themeSpec.pptCardBorder, width: 1 },
                rectRadius: 0.08,
              });

              pptSlide.addText(stripHtmlTags(kpi.value), {
                x: cx + 0.2,
                y: cy + 0.12,
                w: 2.3,
                h: 0.5,
                fontSize: 22,
                bold: true,
                color: themeSpec.pptAccent,
                fontFace: 'Arial',
              });

              if (kpi.delta) {
                pptSlide.addText(stripHtmlTags(kpi.delta), {
                  x: cx + 2.4,
                  y: cy + 0.18,
                  w: 1.65,
                  h: 0.32,
                  fontSize: 9,
                  bold: true,
                  color: themeSpec.pptSubtext,
                  align: 'right',
                  fontFace: 'Arial',
                });
              }

              pptSlide.addText(stripHtmlTags(kpi.label), {
                x: cx + 0.2,
                y: cy + 0.62,
                w: cardW - 0.4,
                h: 0.3,
                fontSize: 11,
                bold: true,
                color: themeSpec.pptText,
                fontFace: 'Arial',
              });

              if (kpi.description) {
                pptSlide.addText(stripHtmlTags(kpi.description), {
                  x: cx + 0.2,
                  y: cy + 0.9,
                  w: cardW - 0.4,
                  h: 0.38,
                  fontSize: 9,
                  color: themeSpec.pptSubtext,
                  fontFace: 'Arial',
                });
              }
            });
          } else if (layout === 'columns') {
            const colsData: SlideColumnItem[] =
              slide.columns && slide.columns.length > 0
                ? slide.columns
                : [
                    {
                      title: 'Situación Identificada',
                      badge: 'Diagnóstico',
                      items: slide.bullets.slice(0, Math.ceil(slide.bullets.length / 2)),
                    },
                    {
                      title: 'Plan de Control SST',
                      badge: 'Intervención',
                      items: slide.bullets.slice(Math.ceil(slide.bullets.length / 2)),
                    },
                  ];

            const numCols = Math.min(colsData.length, 3);
            const colW = (8.8 - (numCols - 1) * 0.3) / numCols;

            colsData.slice(0, numCols).forEach((col, cIdx) => {
              const cx = 0.6 + cIdx * (colW + 0.3);
              pptSlide.addShape(pptx.ShapeType.roundRect, {
                x: cx,
                y: contentTop,
                w: colW,
                h: 2.9,
                fill: { color: themeSpec.pptCardBg },
                line: { color: themeSpec.pptCardBorder, width: 1 },
                rectRadius: 0.08,
              });

              pptSlide.addText(stripHtmlTags(col.title), {
                x: cx + 0.2,
                y: contentTop + 0.15,
                w: colW - 0.4,
                h: 0.4,
                fontSize: 13,
                bold: true,
                color: themeSpec.pptAccent,
                fontFace: 'Arial',
              });

              const colBullets = (col.items || []).map((item) => ({
                text: stripHtmlTags(item),
                options: { bullet: true, breakLine: true, fontSize: 10.5, color: themeSpec.pptText },
              }));

              if (colBullets.length > 0) {
                pptSlide.addText(colBullets, {
                  x: cx + 0.2,
                  y: contentTop + 0.65,
                  w: colW - 0.4,
                  h: 2.1,
                  valign: 'top',
                  fontFace: 'Arial',
                  paraSpaceAfter: 6,
                });
              }
            });
          } else if (layout === 'timeline') {
            const steps: SlideStepItem[] =
              slide.steps && slide.steps.length > 0
                ? slide.steps
                : slide.bullets.slice(0, 4).map((b, i) => ({
                    phase: `FASE 0${i + 1}`,
                    title: stripHtmlTags(b).slice(0, 42),
                    detail: stripHtmlTags(b),
                  }));

            const maxSteps = Math.min(steps.length, 4);
            const stepW = (8.8 - (maxSteps - 1) * 0.2) / maxSteps;

            steps.slice(0, maxSteps).forEach((st, sIdx) => {
              const sx = 0.6 + sIdx * (stepW + 0.2);
              pptSlide.addShape(pptx.ShapeType.roundRect, {
                x: sx,
                y: contentTop,
                w: stepW,
                h: 2.85,
                fill: { color: themeSpec.pptCardBg },
                line: { color: themeSpec.pptCardBorder, width: 1 },
                rectRadius: 0.08,
              });

              pptSlide.addText(stripHtmlTags(st.phase || `PASO ${sIdx + 1}`), {
                x: sx + 0.15,
                y: contentTop + 0.15,
                w: stepW - 0.3,
                h: 0.3,
                fontSize: 9,
                bold: true,
                color: themeSpec.pptAccent,
                fontFace: 'Arial',
              });

              pptSlide.addText(stripHtmlTags(st.title), {
                x: sx + 0.15,
                y: contentTop + 0.5,
                w: stepW - 0.3,
                h: 0.65,
                fontSize: 11.5,
                bold: true,
                color: themeSpec.pptText,
                fontFace: 'Arial',
              });

              pptSlide.addText(stripHtmlTags(st.detail), {
                x: sx + 0.15,
                y: contentTop + 1.2,
                w: stepW - 0.3,
                h: 1.5,
                fontSize: 9.5,
                color: themeSpec.pptSubtext,
                valign: 'top',
                fontFace: 'Arial',
              });
            });
          } else if (layout === 'table' && slide.tableHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(slide.tableHtml, 'text/html');
            const trs = Array.from(doc.querySelectorAll('tr'));
            const tableRows = trs
              .map((tr, rIdx) => {
                const cells = Array.from(tr.querySelectorAll('th, td'));
                return cells.map((cell) => ({
                  text: stripHtmlTags(cell.textContent || ''),
                  options: {
                    bold: rIdx === 0 || cell.tagName.toLowerCase() === 'th',
                    fill: rIdx === 0 ? themeSpec.pptAccent : themeSpec.pptCardBg,
                    color: rIdx === 0 ? '0E1300' : themeSpec.pptText,
                    fontSize: 9.5,
                    margin: [4, 6, 4, 6],
                  },
                }));
              })
              .filter((r) => r.length > 0);

            if (tableRows.length > 0) {
              pptSlide.addTable(tableRows, {
                x: 0.6,
                y: contentTop,
                w: 8.8,
                border: { type: 'solid', pt: 0.75, color: themeSpec.pptCardBorder },
                fontFace: 'Arial',
              });
            }
          } else if (layout === 'chart' && slide.chartConfig?.data && slide.chartConfig.data.length > 0) {
            const cData = slide.chartConfig.data;
            const tableRows = [
              [
                { text: 'Categoría / Indicador', options: { bold: true, fill: themeSpec.pptAccent, color: '0E1300', fontSize: 10 } },
                { text: 'Valor Medido', options: { bold: true, fill: themeSpec.pptAccent, color: '0E1300', fontSize: 10 } },
              ],
              ...cData.map((d) => [
                { text: stripHtmlTags(d.label), options: { fill: themeSpec.pptCardBg, color: themeSpec.pptText, fontSize: 10 } },
                { text: String(d.val), options: { bold: true, fill: themeSpec.pptCardBg, color: themeSpec.pptAccent, fontSize: 10 } },
              ]),
            ];

            pptSlide.addTable(tableRows, {
              x: 0.6,
              y: contentTop,
              w: 4.3,
              border: { type: 'solid', pt: 0.75, color: themeSpec.pptCardBorder },
              fontFace: 'Arial',
            });

            const bulletItems = slide.bullets.map((b) => ({
              text: stripHtmlTags(b),
              options: { bullet: true, breakLine: true, fontSize: 11, color: themeSpec.pptText },
            }));
            if (bulletItems.length > 0) {
              pptSlide.addText(bulletItems, {
                x: 5.2,
                y: contentTop,
                w: 4.2,
                h: 2.7,
                valign: 'top',
                fontFace: 'Arial',
                paraSpaceAfter: 8,
              });
            }
          } else if (layout === 'quote') {
            pptSlide.addShape(pptx.ShapeType.roundRect, {
              x: 0.6,
              y: contentTop,
              w: 8.8,
              h: 2.8,
              fill: { color: themeSpec.pptCardBg },
              line: { color: themeSpec.pptAccent, width: 1.5 },
              rectRadius: 0.08,
            });

            pptSlide.addText(`“${stripHtmlTags(slide.quote || slide.bullets[0] || slide.title)}”`, {
              x: 0.9,
              y: contentTop + 0.25,
              w: 8.2,
              h: 1.6,
              fontSize: 15,
              italic: true,
              bold: true,
              color: themeSpec.pptText,
              valign: 'middle',
              fontFace: 'Arial',
            });

            if (slide.citation) {
              pptSlide.addText(`— ${stripHtmlTags(slide.citation)}`, {
                x: 0.9,
                y: contentTop + 2.0,
                w: 8.2,
                h: 0.5,
                fontSize: 11,
                bold: true,
                color: themeSpec.pptAccent,
                fontFace: 'Arial',
              });
            }
          } else {
            // Default bullets / split / media
            const bulletItems = slide.bullets.map((b) => ({
              text: stripHtmlTags(b),
              options: { bullet: true, breakLine: true, fontSize: 13, color: themeSpec.pptText },
            }));

            pptSlide.addShape(pptx.ShapeType.roundRect, {
              x: 0.6,
              y: contentTop,
              w: 8.8,
              h: 2.85,
              fill: { color: themeSpec.pptCardBg },
              line: { color: themeSpec.pptCardBorder, width: 1 },
              rectRadius: 0.08,
            });

            if (bulletItems.length > 0) {
              pptSlide.addText(bulletItems, {
                x: 0.85,
                y: contentTop + 0.2,
                w: 8.3,
                h: 2.45,
                valign: 'top',
                fontFace: 'Arial',
                paraSpaceAfter: 10,
              });
            }
          }
        }

        // Bottom Takeaway Bar
        if (cleanTakeaway) {
          pptSlide.addShape(pptx.ShapeType.roundRect, {
            x: 0.6,
            y: 4.92,
            w: 8.8,
            h: 0.45,
            fill: { color: themeSpec.pptCardBg },
            line: { color: themeSpec.pptAccent, width: 0.75 },
            rectRadius: 0.05,
          });

          pptSlide.addText(`CONCLUSIÓN CLAVE: ${cleanTakeaway}`, {
            x: 0.8,
            y: 4.95,
            w: 8.4,
            h: 0.38,
            fontSize: 9.5,
            bold: true,
            color: themeSpec.pptAccent,
            valign: 'middle',
            fontFace: 'Arial',
          });
        }

        if (slide.speakerNotes) {
          pptSlide.addNotes(stripHtmlTags(slide.speakerNotes));
        }
      });

      const safeFileName = (title || 'Presentacion_Ejecutiva_WAPPY')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim();
      await pptx.writeFile({ fileName: `${safeFileName}.pptx` });
    } catch (error) {
      console.error('Error generating PPTX:', error);
    } finally {
      setIsExportingPptx(false);
    }
  };

  // High-fidelity PDF / Landscape Print View
  const handleDownloadPdf = () => {
    const slidesHtml = slides
      .map((slide, idx) => {
        const t = THEMES[slide.theme || 'wappy-dark'] || THEMES['wappy-dark'];
        const cleanKicker = stripHtmlTags(slide.kicker || '');
        const cleanSub = stripHtmlTags(slide.subtitle || '');
        const cleanTakeaway = stripHtmlTags(slide.takeaway || '');

        let bodyHtml = '';
        if (slide.layout === 'kpi-grid') {
          const kpis =
            slide.kpis && slide.kpis.length > 0
              ? slide.kpis
              : slide.bullets.slice(0, 4).map((b, i) => ({
                  label: `Indicador ${i + 1}`,
                  value: `${92 + i}%`,
                  delta: 'Verificado',
                  description: stripHtmlTags(b),
                }));
          bodyHtml = `<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:20px;">
            ${kpis
              .map(
                (k) => `<div style="background:#${t.pptCardBg}; border:1px solid #${t.pptCardBorder}; border-radius:16px; padding:20px;">
                <div style="font-size:34px; font-weight:800; color:#${t.pptAccent};">${stripHtmlTags(k.value)}</div>
                <div style="font-size:16px; font-weight:700; margin-top:6px;">${stripHtmlTags(k.label)}</div>
                <div style="font-size:13px; opacity:0.8; margin-top:4px;">${stripHtmlTags(k.description || k.delta || '')}</div>
              </div>`,
              )
              .join('')}
          </div>`;
        } else if (slide.layout === 'columns' && slide.columns?.length) {
          bodyHtml = `<div style="display:grid; grid-template-columns:repeat(${Math.min(slide.columns.length, 3)},1fr); gap:20px; margin-top:20px;">
            ${slide.columns
              .map(
                (c) => `<div style="background:#${t.pptCardBg}; border:1px solid #${t.pptCardBorder}; border-radius:16px; padding:20px;">
                <h3 style="margin:0 0 12px 0; color:#${t.pptAccent}; font-size:18px;">${stripHtmlTags(c.title)}</h3>
                <ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.6;">
                  ${(c.items || []).map((it) => `<li>${stripHtmlTags(it)}</li>`).join('')}
                </ul>
              </div>`,
              )
              .join('')}
          </div>`;
        } else if (slide.layout === 'timeline' && slide.steps?.length) {
          bodyHtml = `<div style="display:grid; grid-template-columns:repeat(${Math.min(slide.steps.length, 4)},1fr); gap:14px; margin-top:20px;">
            ${slide.steps
              .map(
                (st) => `<div style="background:#${t.pptCardBg}; border:1px solid #${t.pptCardBorder}; border-radius:16px; padding:18px;">
                <div style="font-size:11px; font-weight:800; color:#${t.pptAccent};">${stripHtmlTags(st.phase)}</div>
                <div style="font-size:16px; font-weight:700; margin:8px 0;">${stripHtmlTags(st.title)}</div>
                <div style="font-size:13px; opacity:0.85;">${stripHtmlTags(st.detail)}</div>
              </div>`,
              )
              .join('')}
          </div>`;
        } else if (slide.layout === 'table' && slide.tableHtml) {
          bodyHtml = `<div style="margin-top:20px; background:#${t.pptCardBg}; padding:16px; border-radius:14px;">${slide.tableHtml}</div>`;
        } else if (slide.layout === 'quote') {
          bodyHtml = `<div style="margin-top:24px; background:#${t.pptCardBg}; border-left:5px solid #${t.pptAccent}; padding:28px; border-radius:16px;">
            <div style="font-size:24px; font-style:italic; font-weight:700; line-height:1.45;">“${stripHtmlTags(slide.quote || slide.bullets[0] || '')}”</div>
            <div style="margin-top:14px; font-size:14px; font-weight:700; color:#${t.pptAccent};">${stripHtmlTags(slide.citation || '')}</div>
          </div>`;
        } else {
          bodyHtml = `<ul style="font-size:20px; line-height:1.65; margin:20px 0 0 0; padding-left:24px;">
            ${slide.bullets.map((b) => `<li style="margin-bottom:14px;">${b}</li>`).join('')}
          </ul>`;
        }

        return `
          <div class="slide-page" style="page-break-after:always; width:100%; height:100vh; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; padding:48px 60px; background:#${t.pptBg}; color:#${t.pptText};">
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.65; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
              <span>${stripHtmlTags(title)}</span>
              <span>Lámina ${idx + 1} / ${slides.length}</span>
            </div>
            <div style="my:auto;">
              ${cleanKicker ? `<div style="font-size:12px; font-weight:800; color:#${t.pptAccent}; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">${cleanKicker}</div>` : ''}
              <h1 style="font-size:34px; line-height:1.2; margin:0; font-family:'Outfit','Inter',sans-serif; font-weight:800;">${slide.title}</h1>
              ${cleanSub ? `<p style="font-size:16px; opacity:0.8; margin:8px 0 0 0;">${cleanSub}</p>` : ''}
              ${bodyHtml}
            </div>
            <div style="border-top:1px solid rgba(148,163,184,0.25); padding-top:12px; display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#${t.pptAccent}; font-weight:700;">${cleanTakeaway ? `Síntesis: ${cleanTakeaway}` : 'WAPPY IA · Suite Ejecutiva SG-SST'}</span>
              <span style="opacity:0.6;">Formato 16:9</span>
            </div>
          </div>
        `;
      })
      .join('');

    const htmlContent = `<!DOCTYPE html><html><head><title>${stripHtmlTags(title)}</title><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet"><style>body{margin:0;padding:0;font-family:'Inter',sans-serif;}@media print{.slide-page{height:100vh;page-break-after:always!important;}@page{size:landscape;margin:0;}}</style></head><body>${slidesHtml}<script>window.onload=function(){setTimeout(function(){window.print();},400);}</script></body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Register native PPTX download as the primary download action for CanvasPanel
  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadPptx);
    }
  }, [onRegisterDownload, slides, title]);

  const renderSvgChart = (config: any, isLightTheme = false) => {
    let data = Array.isArray(config?.data) ? config.data : [];
    if (
      data.length === 0 &&
      Array.isArray(config?.labels) &&
      Array.isArray(config?.datasets) &&
      config.datasets[0]?.data
    ) {
      data = config.labels.map((lbl: string, i: number) => ({
        label: String(lbl),
        val: Number(config.datasets[0].data[i] || 0),
      }));
    }

    if (!config || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-44 border border-white/10 rounded-xl bg-black/20 text-white/50 text-xs">
          <span>No hay datos de gráfico configurados.</span>
        </div>
      );
    }

    const type = config.type === 'doughnut' ? 'pie' : config.type || 'bar';
    const chartTitle = config.title || '';
    const width = 500;
    const height = 220;
    const paddingLeft = 48;
    const paddingRight = 26;
    const paddingTop = 36;
    const paddingBottom = 36;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = data.map((d: any) => Number(d.val) || 0);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    const labelColor = isLightTheme ? '#334155' : '#cbd5e1';
    const titleColor = isLightTheme ? '#0f172a' : '#ffffff';

    if (type === 'pie') {
      let total = values.reduce((sum: number, v: number) => sum + v, 0);
      if (total === 0) total = 1;

      let accumulatedAngle = 0;
      const cx = width / 2 - 70;
      const cy = height / 2 + 10;
      const r = 65;
      const colors = ['#14b8a6', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e'];

      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-56 font-sans select-none">
          <text x={width / 2} y={22} textAnchor="middle" fill={titleColor} className="text-xs font-bold">
            {chartTitle}
          </text>
          <g>
            {data.map((d: any, idx: number) => {
              const angle = ((Number(d.val) || 0) / total) * 360;
              const x1 = cx + r * Math.cos(((accumulatedAngle - 90) * Math.PI) / 180);
              const y1 = cy + r * Math.sin(((accumulatedAngle - 90) * Math.PI) / 180);
              accumulatedAngle += angle;
              const x2 = cx + r * Math.cos(((accumulatedAngle - 90) * Math.PI) / 180);
              const y2 = cy + r * Math.sin(((accumulatedAngle - 90) * Math.PI) / 180);
              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              const color = colors[idx % colors.length];
              return <path key={idx} d={pathData} fill={color} opacity="0.9" />;
            })}
          </g>
          <g transform={`translate(${width - 175}, ${paddingTop + 6})`}>
            {data.slice(0, 6).map((d: any, idx: number) => (
              <g key={idx} transform={`translate(0, ${idx * 22})`}>
                <rect width={11} height={11} rx={3} fill={colors[idx % colors.length]} />
                <text x={18} y={9.5} fill={labelColor} className="text-[10px] font-semibold">
                  {String(d.label).slice(0, 16)} ({d.val})
                </text>
              </g>
            ))}
          </g>
        </svg>
      );
    }

    const getY = (val: number) => {
      const ratio = (val - minVal) / range;
      return height - paddingBottom - ratio * chartHeight;
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-56 font-sans select-none">
        <defs>
          <linearGradient id="wappyBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <text x={width / 2} y={20} textAnchor="middle" fill={titleColor} className="text-xs font-bold">
          {chartTitle}
        </text>
        {[0, 0.5, 1].map((r, idx) => {
          const yVal = minVal + r * range;
          const y = getY(yVal);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={isLightTheme ? '#cbd5e1' : '#334155'}
                strokeWidth="0.7"
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 6} y={y + 3} textAnchor="end" fill={labelColor} className="text-[9px] font-semibold">
                {yVal.toFixed(0)}
              </text>
            </g>
          );
        })}
        {data.map((d: any, idx: number) => {
          const x = paddingLeft + (idx / data.length) * chartWidth + (chartWidth / data.length) * 0.15;
          const barWidth = (chartWidth / data.length) * 0.7;
          const y = getY(Number(d.val) || 0);
          const h = Math.max(height - paddingBottom - y, 2);
          return (
            <g key={idx}>
              <rect x={x} y={y} width={barWidth} height={h} rx={5} fill="url(#wappyBarGrad)" />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill={titleColor}
                className="text-[9px] font-bold"
              >
                {d.val}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - paddingBottom + 15}
                textAnchor="middle"
                fill={labelColor}
                className="text-[9px] font-semibold"
              >
                {String(d.label).slice(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderSlideHeaderBlock = (slide: Slide, curTheme: ThemeSpec, isPresentationMode: boolean) => (
    <div className="space-y-1.5 mb-3 shrink-0">
      {(slide.kicker || !isPresentationMode) && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${curTheme.accentBg}`}
          >
            <Award className="h-3 w-3 shrink-0" />
            {isPresentationMode ? (
              <span>{slide.kicker || 'GESTIÓN ESTRATÉGICA SG-SST'}</span>
            ) : (
              <input
                type="text"
                value={stripHtmlTags(slide.kicker || '')}
                onChange={(e) => updateSlide(activeIndex, { kicker: e.target.value })}
                placeholder="CATEGORÍA / NORMA (EJ. DECRETO 1072)"
                className="bg-transparent border-none outline-none text-[10px] font-extrabold uppercase tracking-wider w-56 placeholder:opacity-50"
              />
            )}
          </span>
        </div>
      )}

      {isPresentationMode ? (
        <h2
          className={`text-2xl md:text-4xl font-extrabold tracking-tight leading-tight ${curTheme.text}`}
          dangerouslySetInnerHTML={{ __html: slide.title }}
        />
      ) : (
        <SlideEditableText
          key={`title-${activeIndex}`}
          value={slide.title}
          onChange={(val) => updateSlide(activeIndex, { title: val })}
          className={`w-full bg-transparent border-none outline-none font-extrabold text-lg sm:text-2xl md:text-3xl leading-tight ${curTheme.text}`}
          placeholder="Escribe el titular ejecutivo de la diapositiva..."
          tagName="h2"
        />
      )}

      {(slide.subtitle || !isPresentationMode) && (
        <div>
          {isPresentationMode ? (
            slide.subtitle && <p className={`text-sm md:text-lg ${curTheme.subtext}`}>{slide.subtitle}</p>
          ) : (
            <input
              type="text"
              value={stripHtmlTags(slide.subtitle || '')}
              onChange={(e) => updateSlide(activeIndex, { subtitle: e.target.value })}
              placeholder="Añadir subtítulo o contexto ejecutivo (opcional)..."
              className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm ${curTheme.subtext} placeholder:opacity-40`}
            />
          )}
        </div>
      )}
    </div>
  );

  const renderSlideContent = (slide: Slide, isPresentationMode = false) => {
    const layout = slide.layout || 'bullets';
    const curTheme = THEMES[slide.theme || 'wappy-dark'] || THEMES['wappy-dark'];

    switch (layout) {
      case 'title':
        return (
          <div className="flex-1 flex flex-col justify-center items-center text-center my-auto px-4 py-2 space-y-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${curTheme.accentBg}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {slide.kicker || 'SISTEMA DE GESTIÓN SG-SST · WAPPY IA'}
            </span>

            {isPresentationMode ? (
              <h1
                className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl ${curTheme.text}`}
                dangerouslySetInnerHTML={{ __html: slide.title }}
              />
            ) : (
              <SlideEditableText
                key={`title-cover-${activeIndex}`}
                value={slide.title}
                onChange={(val) => updateSlide(activeIndex, { title: val })}
                className={`w-full bg-transparent border-none outline-none font-extrabold text-2xl sm:text-4xl text-center leading-tight ${curTheme.text}`}
                placeholder="Título de Portada Ejecutiva..."
                tagName="h1"
              />
            )}

            <p className={`text-xs sm:text-base max-w-2xl font-medium ${curTheme.subtext}`}>
              {slide.subtitle || stripHtmlTags(slide.bullets[0] || '')}
            </p>

            <div className="h-1 w-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-lime-400 rounded-full opacity-90" />
          </div>
        );

      case 'kpi-grid': {
        const kpis: SlideKpiItem[] =
          slide.kpis && slide.kpis.length > 0
            ? slide.kpis
            : slide.bullets.slice(0, 4).map((b, i) => {
                const clean = stripHtmlTags(b);
                const parts = clean.split(':');
                return {
                  label: parts[0]?.slice(0, 28) || `Indicador Clave 0${i + 1}`,
                  value: parts[1]?.trim().slice(0, 12) || `${92 + i * 2}%`,
                  delta: 'Meta cumplida',
                  trend: 'up',
                  description: clean,
                };
              });

        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 my-auto">
              {kpis.slice(0, 4).map((kpi, kIdx) => (
                <div
                  key={kIdx}
                  className={`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between backdrop-blur-md transition-all ${curTheme.cardBg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xl sm:text-3xl font-black tracking-tight ${curTheme.accent}`}>
                      {kpi.value}
                    </span>
                    {kpi.delta && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border ${curTheme.accentBg}`}
                      >
                        {kpi.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        {kpi.delta}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className={`text-xs sm:text-sm font-extrabold ${curTheme.text}`}>{kpi.label}</div>
                    {kpi.description && (
                      <p className={`text-[10px] sm:text-xs mt-0.5 line-clamp-2 ${curTheme.subtext}`}>
                        {kpi.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'columns': {
        const mid = Math.ceil(slide.bullets.length / 2);
        const cols: SlideColumnItem[] =
          slide.columns && slide.columns.length > 0
            ? slide.columns
            : [
                {
                  title: 'Diagnóstico / Estado Inicial',
                  badge: 'Línea Base',
                  theme: 'warning',
                  items: slide.bullets.slice(0, mid),
                },
                {
                  title: 'Controles / Intervención SST',
                  badge: 'Plan de Acción',
                  theme: 'success',
                  items: slide.bullets.slice(mid),
                },
              ];

        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div
              className={`grid grid-cols-1 ${cols.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 my-auto`}
            >
              {cols.slice(0, 3).map((col, cIdx) => (
                <div
                  key={cIdx}
                  className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col gap-2.5 backdrop-blur-md ${curTheme.cardBg}`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-current/10 pb-2">
                    <h3 className={`text-xs sm:text-base font-extrabold ${curTheme.accent}`}>
                      {col.title}
                    </h3>
                    {col.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${curTheme.accentBg}`}>
                        {col.badge}
                      </span>
                    )}
                  </div>
                  <ul className={`space-y-1.5 text-[11px] sm:text-xs font-medium ${curTheme.text}`}>
                    {(col.items || []).map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${curTheme.accent}`} />
                        <span>{stripHtmlTags(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'timeline': {
        const steps: SlideStepItem[] =
          slide.steps && slide.steps.length > 0
            ? slide.steps
            : slide.bullets.slice(0, 4).map((b, i) => ({
                phase: `FASE 0${i + 1}`,
                title: stripHtmlTags(b).slice(0, 36),
                detail: stripHtmlTags(b),
              }));

        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto">
              {steps.slice(0, 4).map((st, sIdx) => (
                <div
                  key={sIdx}
                  className={`rounded-2xl border p-3 flex flex-col justify-between relative backdrop-blur-md ${curTheme.cardBg}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${curTheme.accent}`}>
                        {st.phase || `PASO 0${sIdx + 1}`}
                      </span>
                      <span className="h-5 w-5 rounded-lg bg-teal-500/20 text-teal-400 text-[10px] font-black flex items-center justify-center">
                        0{sIdx + 1}
                      </span>
                    </div>
                    <h4 className={`text-xs sm:text-sm font-extrabold leading-snug ${curTheme.text}`}>
                      {st.title}
                    </h4>
                  </div>
                  <p className={`text-[10px] sm:text-xs mt-2 leading-relaxed line-clamp-3 ${curTheme.subtext}`}>
                    {st.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'quote':
        return (
          <div className="flex-1 flex flex-col justify-center my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div className={`rounded-2xl border-l-4 p-5 sm:p-6 backdrop-blur-md space-y-3 ${curTheme.cardBg} ${curTheme.border}`}>
              <Quote className={`h-7 w-7 opacity-60 ${curTheme.accent}`} />
              <blockquote className={`text-sm sm:text-xl font-bold italic leading-relaxed ${curTheme.text}`}>
                “{stripHtmlTags(slide.quote || slide.bullets[0] || slide.title)}”
              </blockquote>
              <div className={`text-xs sm:text-sm font-extrabold ${curTheme.accent}`}>
                — {slide.citation || 'Decreto Único Reglamentario 1072 de 2015 · Ministerio del Trabajo'}
              </div>
            </div>
          </div>
        );

      case 'split':
        return (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center my-auto w-full">
            <div
              onClick={() => !isPresentationMode && setIsImageModalOpen(true)}
              className={`relative group rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 shadow-lg bg-black/25 flex items-center justify-center ${
                !isPresentationMode ? 'cursor-pointer hover:border-teal-500/50 transition-colors' : ''
              }`}
            >
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/40 text-xs gap-2 p-4 text-center">
                  <Camera className="h-8 w-8 text-teal-400/70" />
                  <span>Haz clic para agregar evidencia fotográfica o imagen</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
              <ul className={`space-y-2 text-xs sm:text-sm font-medium ${curTheme.text}`}>
                {slide.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${curTheme.accent}`} />
                    <SlideEditableText
                      key={`split-b-${activeIndex}-${bIdx}`}
                      value={bullet}
                      onChange={(val) => updateBullet(bIdx, val)}
                      className="flex-1"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'media':
        return (
          <div
            onClick={() => !isPresentationMode && setIsImageModalOpen(true)}
            className="relative flex-1 flex flex-col justify-end p-5 sm:p-8 bg-cover bg-center rounded-2xl overflow-hidden my-1"
            style={{
              backgroundImage: slide.imageUrl
                ? `url("${slide.imageUrl}")`
                : 'url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop")',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent pointer-events-none" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-2xl bg-slate-950/65 border border-white/15 p-4 sm:p-6 rounded-2xl backdrop-blur-md space-y-2"
            >
              <h2 className="text-lg sm:text-2xl font-extrabold text-white">{stripHtmlTags(slide.title)}</h2>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-200 list-disc pl-4">
                {slide.bullets.slice(0, 3).map((b, i) => (
                  <li key={i}>{stripHtmlTags(b)}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            {slide.tableHtml ? (
              <div
                className={`max-h-[14rem] overflow-y-auto border rounded-xl p-3 scrollbar-thin ${curTheme.cardBg}`}
                dangerouslySetInnerHTML={{ __html: slide.tableHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed border-teal-500/30 rounded-xl bg-teal-500/5 text-xs text-center gap-2 p-4">
                <Table2 className="h-8 w-8 text-teal-400" />
                <span className={curTheme.text}>Usa "Conectar Lienzos" para importar un rango de Excel o aplica una plantilla SST.</span>
              </div>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div className={`flex-1 flex items-center justify-center p-3 rounded-2xl border min-h-[180px] ${curTheme.cardBg}`}>
              {slide.chartConfig ? (
                renderSvgChart(slide.chartConfig, curTheme.isLight)
              ) : (
                <div className="flex flex-col items-center justify-center text-xs text-center gap-2 p-4">
                  <BarChart3 className="h-8 w-8 text-teal-400" />
                  <span className={curTheme.text}>Importa un gráfico desde Hoja de Cálculo con "Conectar Lienzos".</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'bullets':
      default:
        return (
          <div className="flex-1 flex flex-col justify-between my-auto w-full">
            {renderSlideHeaderBlock(slide, curTheme, isPresentationMode)}
            <div className="grid grid-cols-1 gap-2 my-auto max-h-[14rem] overflow-y-auto pr-1 scrollbar-thin">
              {slide.bullets.map((bullet, bIdx) => (
                <div
                  key={bIdx}
                  className={`flex items-start gap-3 rounded-xl border p-2.5 sm:p-3 backdrop-blur-sm transition-all ${curTheme.cardBg}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black border ${curTheme.accentBg}`}
                  >
                    0{bIdx + 1}
                  </span>
                  {isPresentationMode ? (
                    <div
                      className={`text-sm sm:text-lg font-medium leading-relaxed ${curTheme.text}`}
                      dangerouslySetInnerHTML={{ __html: bullet }}
                    />
                  ) : (
                    <SlideEditableText
                      key={`bullet-${activeIndex}-${bIdx}`}
                      value={bullet}
                      onChange={(val) => updateBullet(bIdx, val)}
                      className={`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${curTheme.text}`}
                      placeholder="Escribe el punto clave..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  const activeSlide = slides[activeIndex] || slides[0];
  const activeTheme = activeSlide
    ? THEMES[activeSlide.theme || 'wappy-dark'] || THEMES['wappy-dark']
    : THEMES['wappy-dark'];

  const handlePresentationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.7) {
      setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1));
    } else if (x < rect.width * 0.3) {
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showLaser) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  const renderPresentationPortal = () => {
    if (!isPresenting || !activeSlide) return null;
    const curTheme = THEMES[activeSlide.theme || 'wappy-dark'] || THEMES['wappy-dark'];

    return createPortal(
      <div
        className={`fixed inset-0 z-[99999999] flex flex-col justify-between p-8 md:p-14 select-none ${
          showLaser ? 'cursor-none' : 'cursor-default'
        } ${curTheme.bg} animate-in fade-in duration-300`}
        onMouseMove={handleMouseMove}
        onClick={handlePresentationClick}
      >
        {showLaser && (
          <div
            className="pointer-events-none fixed z-[99999999] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
            style={{ left: laserPos.x, top: laserPos.y }}
          >
            <div className="absolute inset-0 w-8 h-8 -m-4 rounded-full bg-rose-500/30 blur-md animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 -m-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-current/10 pb-3 z-10">
          <span className={`text-xs font-mono font-bold tracking-widest uppercase ${curTheme.subtext}`}>
            Lámina {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          <span className={`text-sm font-extrabold truncate max-w-md ${curTheme.accent}`}>{title}</span>
        </div>

        <div className="my-auto max-w-6xl mx-auto w-full z-10 py-6 flex flex-col justify-center min-h-[65vh]">
          {renderSlideContent(activeSlide, true)}
          {activeSlide.takeaway && (
            <div className={`mt-6 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 ${curTheme.accentBg}`}>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Síntesis Ejecutiva: {stripHtmlTags(activeSlide.takeaway)}</span>
            </div>
          )}
        </div>

        <div
          className="relative z-20 mx-auto bg-slate-900/85 border border-white/15 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between w-full max-w-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-white px-2">
              {activeIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={activeIndex === slides.length - 1}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPptx}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.PPTX</span>
            </button>
            <button
              onClick={() => setShowLaser(!showLaser)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                showLaser
                  ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Láser</span>
            </button>
            <button
              onClick={() => {
                setIsPresenting(false);
                setShowLaser(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-xl cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  const renderImageModal = () => {
    if (!isImageModalOpen || !activeSlide) return null;

    return createPortal(
      <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-teal-400" />
              <h3 className="text-base font-extrabold text-white">Agregar Evidencia o Imagen</h3>
            </div>
            <button
              onClick={() => {
                setIsImageModalOpen(false);
                stopCamera();
              }}
              className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex bg-slate-950/80 border border-white/10 p-1 rounded-2xl gap-1">
            {(['upload', 'camera', 'url'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === tabKey
                    ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tabKey === 'upload' ? <Upload className="h-3.5 w-3.5" /> : tabKey === 'camera' ? <Video className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                <span>{tabKey === 'upload' ? 'Cargar PC' : tabKey === 'camera' ? 'Cámara' : 'Enlace URL'}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[190px] flex flex-col justify-center">
            {activeTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl gap-3 text-center ${
                  isDragging ? 'border-teal-400 bg-teal-500/10' : 'border-white/15'
                }`}
              >
                <Upload className="h-7 w-7 text-teal-400" />
                <p className="text-xs font-bold text-slate-200">Arrastra una imagen aquí o selecciona desde tu equipo</p>
                <label className="px-4 py-2 text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 rounded-xl cursor-pointer">
                  Seleccionar Imagen
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="flex flex-col items-center gap-3">
                {cameraError ? (
                  <div className="text-xs text-rose-400 font-semibold p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full text-center">
                    {cameraError}
                  </div>
                ) : (
                  <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                )}
                <button
                  onClick={capturePhoto}
                  disabled={!!cameraError || !stream}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer disabled:opacity-40"
                >
                  Capturar Fotografía
                </button>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://ejemplo.com/evidencia.png"
                  className="w-full h-10 px-3 text-xs bg-slate-950 border border-white/15 rounded-xl outline-none focus:border-teal-500 text-white"
                />
                <button
                  onClick={() => inputUrl.trim() && saveImageToSlide(inputUrl.trim())}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer"
                >
                  Insertar Imagen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  // UNIFIED INTERACTIVE STUDIO WORKSPACE (Works in both Side-Panel !isMaximized AND Maximized mode!)
  return (
    <div className="flex h-full bg-surface-primary text-text-primary overflow-hidden relative">
      {/* Slides Thumbnail Sidebar (Only on desktop when maximized) */}
      {isMaximized && (
        <div
          className={`hidden sm:flex flex-shrink-0 border-r border-border-medium bg-surface-secondary flex-col justify-between transition-all duration-300 ${
            sidebarOpen ? 'w-56 md:w-64' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider">
                Láminas ({slides.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSlide('up')}
                  disabled={activeIndex === 0}
                  className="p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer"
                  title="Subir diapositiva"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveSlide('down')}
                  disabled={activeIndex === slides.length - 1}
                  className="p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer"
                  title="Bajar diapositiva"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {slides.map((slide, idx) => {
              const sTheme = THEMES[slide.theme || 'wappy-dark'] || THEMES['wappy-dark'];
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left rounded-xl border p-2 transition-all relative overflow-hidden group cursor-pointer ${
                    isActive
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5 shadow-sm'
                      : 'border-border-medium hover:border-teal-500/40 bg-surface-primary'
                  }`}
                >
                  <div className={`h-16 w-full rounded-lg ${sTheme.bg} p-2 flex flex-col justify-between overflow-hidden border border-white/10`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase ${sTheme.accent}`}>
                        0{idx + 1} · {slide.layout || 'bullets'}
                      </span>
                    </div>
                    <div className={`text-[9px] font-bold ${sTheme.text} line-clamp-2 leading-tight`}>
                      {stripHtmlTags(slide.title)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Actions (WAPPY 14-Group Design System) */}
          <div className="p-3 border-t border-border-medium bg-surface-primary flex flex-col gap-2 shrink-0">
            <button
              onClick={addSlide}
              className="group flex items-center justify-center gap-2 h-9 px-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all duration-300 sm:hover:-rotate-2 sm:hover:scale-[1.02] active:scale-95 cursor-pointer text-xs font-bold"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Nueva Diapositiva</span>
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={duplicateSlide}
                className="flex items-center justify-center gap-1.5 h-9 px-2 rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-all duration-300 cursor-pointer text-xs font-bold"
                title="Duplicar lámina"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplicar</span>
              </button>
              <button
                onClick={deleteSlide}
                disabled={slides.length <= 1}
                className="flex items-center justify-center gap-1.5 h-9 px-2 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 transition-all duration-300 cursor-pointer text-xs font-bold"
                title="Eliminar lámina"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Slide Workspace */}
      <div className="flex-1 flex flex-col bg-surface-secondary/30 overflow-hidden">
        {/* Top Action Bar (WAPPY 14-Group Design System) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-primary shrink-0 z-30">
          {/* Left: Slide Navigation & Templates */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-surface-secondary border border-border-medium rounded-xl p-0.5">
              <button
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer"
                title="Diapositiva anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-extrabold px-2 text-text-primary select-none">
                {activeIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={activeIndex === slides.length - 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer"
                title="Siguiente diapositiva"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Add Slide (Group 4: Emerald) */}
            <button
              onClick={addSlide}
              className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
              title="Nueva Diapositiva"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline ml-1.5 text-xs font-bold">Lámina</span>
            </button>

            {/* Templates Dropdown (Group 1: Amber) */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateMenu((prev) => !prev)}
                className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
                title="Plantillas Ejecutivas SST"
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline ml-1.5 text-xs font-bold">Plantillas SST</span>
              </button>
              {showTemplateMenu && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                    Presentaciones Ejecutivas SG-SST
                  </div>
                  {PRESENTATION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleApplyPresentationTemplate(tpl.id)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-text-primary">{tpl.name}</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                        {tpl.category} · {tpl.slides.length} diapositivas ejecutivas
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Transform Layout (Group 6: Purple IA) */}
            <button
              onClick={handleSmartTransformSlide}
              disabled={isEnhancingSlide}
              className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
              title="Transformar diseño de lámina automáticamente (KPIs / Columnas / PHVA / Cita)"
            >
              <Sparkles className={`h-4 w-4 shrink-0 ${isEnhancingSlide ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline ml-1.5 text-xs font-bold">Transformar Layout</span>
            </button>
          </div>

          {/* Right: Connect, Present, Export PPTX & PDF */}
          <div className="flex items-center gap-1.5">
            {/* Connect Workspace Bridge (Group 3: Teal) */}
            <button
              onClick={() => setIsBridgeOpen(true)}
              className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
              title="Conectar con Excel, Word o Galería Google Flow"
            >
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline ml-1.5 text-xs font-bold">Conectar</span>
            </button>

            {/* Fullscreen Presentation (Group 5: Cyan) */}
            <button
              onClick={() => setIsPresenting(true)}
              className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
              title="Iniciar Presentación Pantalla Completa"
            >
              <MonitorPlay className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline ml-1.5 text-xs font-bold">Presentar</span>
            </button>

            {/* Export Native PowerPoint .PPTX (Group 10: Green) */}
            <button
              onClick={handleDownloadPptx}
              disabled={isExportingPptx}
              className="group flex h-9 min-w-[36px] px-3 items-center justify-center rounded-xl border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Descargar archivo PowerPoint (.pptx) editable"
            >
              <Download className={`h-4 w-4 shrink-0 ${isExportingPptx ? 'animate-bounce' : ''}`} />
              <span className="ml-1.5 text-xs font-extrabold">
                {isExportingPptx ? 'Generando...' : 'PowerPoint .PPTX'}
              </span>
            </button>

            {/* Print PDF 16:9 (Group 14: Neutral) */}
            <button
              onClick={handleDownloadPdf}
              className="group flex h-9 min-w-[36px] px-2.5 items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
              title="Imprimir o Guardar como PDF Horizontal 16:9"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span className="hidden xl:inline ml-1.5 text-xs font-bold">PDF</span>
            </button>
          </div>
        </div>

        {/* Scrollable Slide Canvas + Inspector */}
        {activeSlide ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 scrollbar-thin">
            {/* Horizontal Thumbnail Strip when in Side-Panel (!isMaximized) */}
            {!isMaximized && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {slides.map((s, idx) => {
                  const isAct = idx === activeIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        isAct
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 font-extrabold shadow-xs'
                          : 'bg-surface-primary border-border-medium text-text-secondary hover:border-teal-500/30'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-black opacity-75">0{idx + 1}</span>
                      <span className="text-[11px] truncate max-w-[110px]">{stripHtmlTags(s.title)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 16:9 Interactive Slide Stage */}
            <div
              className={`aspect-[16/9] w-full rounded-2xl shadow-xl border ${activeTheme.bg} ${activeTheme.border} p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all`}
            >
              {/* Ambient Glows */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Meta Header */}
              <div className="flex items-center justify-between z-10 border-b border-current/10 pb-2">
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${activeTheme.subtext}`}>
                  LÁMINA {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · {activeTheme.label}
                </span>
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase truncate max-w-[220px] ${activeTheme.subtext}`}>
                  {title}
                </span>
              </div>

              {/* Dynamic Slide Body */}
              <div className="my-auto w-full flex-1 flex flex-col justify-center z-10 py-2 relative overflow-hidden">
                {renderSlideContent(activeSlide, false)}
              </div>

              {/* Bottom Takeaway / Footer Bar */}
              <div className="flex items-center justify-between gap-2 z-10 border-t border-current/10 pt-2.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Sparkles className={`h-3.5 w-3.5 shrink-0 ${activeTheme.accent}`} />
                  <input
                    type="text"
                    value={stripHtmlTags(activeSlide.takeaway || '')}
                    onChange={(e) => updateSlide(activeIndex, { takeaway: e.target.value })}
                    placeholder="Añadir conclusión ejecutiva inferior (Takeaway)..."
                    className={`w-full bg-transparent border-none outline-none text-[10px] sm:text-xs font-bold truncate ${activeTheme.accent} placeholder:opacity-50`}
                  />
                </div>
                <span className={`text-[10px] font-semibold shrink-0 opacity-60 ${activeTheme.subtext}`}>
                  WAPPY Canvas 2.0
                </span>
              </div>
            </div>

            {/* Quick Design & Content Inspector (Available in both modes!) */}
            <div className="bg-surface-primary border border-border-medium rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-teal-500" />
                  Diseño Ejecutivo, Tema y Contenido de la Lámina
                </span>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {showSettings ? 'Contraer panel' : 'Expandir panel'}
                </button>
              </div>

              {showSettings && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                  {/* Left: 10 Layouts + Bullets Editor */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-text-secondary uppercase block mb-1.5">
                        Estructura Visual (10 Layouts Ejecutivos)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {LAYOUT_OPTIONS.map((l) => {
                          const isSelected = (activeSlide.layout || 'bullets') === l.key;
                          return (
                            <button
                              key={l.key}
                              onClick={() => updateSlide(activeIndex, { layout: l.key })}
                              className={`py-1.5 px-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs'
                                  : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                              }`}
                              title={l.desc}
                            >
                              {l.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Clean Bullets List (Sanitized without raw HTML tags) */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-text-secondary uppercase">
                          Puntos Clave de la Diapositiva ({activeSlide.bullets.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsImageModalOpen(true)}
                            className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                          >
                            <Camera className="h-3 w-3" />
                            <span>Imagen</span>
                          </button>
                          <button
                            onClick={addBullet}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Añadir punto</span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                        {activeSlide.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-teal-500 w-4">
                              0{bIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={stripHtmlTags(bullet)}
                              onChange={(e) => updateBullet(bIdx, e.target.value)}
                              className="flex-1 h-8 px-2.5 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 text-text-primary"
                            />
                            <button
                              onClick={() => deleteBullet(bIdx)}
                              disabled={activeSlide.bullets.length <= 1}
                              className="p-1.5 text-text-tertiary hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                              title="Eliminar punto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: 8 Themes + Speaker Notes */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-text-secondary uppercase block mb-1.5">
                        Paleta y Atmósfera (8 Temas Corporativos)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(Object.keys(THEMES) as SlideThemeKey[]).map((tKey) => {
                          const tObj = THEMES[tKey];
                          const isSelected = (activeSlide.theme || 'wappy-dark') === tKey;
                          return (
                            <button
                              key={tKey}
                              onClick={() => updateSlide(activeIndex, { theme: tKey })}
                              className={`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                                  : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                              }`}
                            >
                              <div className={`h-3.5 w-3.5 rounded-md shrink-0 ${tObj.bg} border border-current/20`} />
                              <span className="truncate">{tObj.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Speaker Notes */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        <FileText className="h-3 w-3 text-teal-500" />
                        Notas del Orador (Se incluyen al exportar a PowerPoint .PPTX)
                      </label>
                      <textarea
                        rows={2}
                        value={stripHtmlTags(activeSlide.speakerNotes || '')}
                        onChange={(e) => updateSlide(activeIndex, { speakerNotes: e.target.value })}
                        placeholder="Escribe aquí tus apuntes de exposición para esta diapositiva..."
                        className="w-full p-2.5 text-xs bg-surface-secondary border border-border-medium rounded-xl outline-none focus:border-teal-500 text-text-primary resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-text-tertiary font-medium">Cargando presentación...</span>
          </div>
        )}
      </div>

      {renderPresentationPortal()}
      {renderImageModal()}
      {isBridgeOpen && (
        <CanvasWorkspaceBridge
          onClose={() => setIsBridgeOpen(false)}
          onImportTable={handleImportTable}
          onImportChart={handleImportChart}
          onImportBullets={handleImportBullets}
          onImportMedia={(item) => {
            saveImageToSlide(item.publicUrl);
          }}
          activeFileType="presentation"
          initialTab="media"
        />
      )}
    </div>
  );
};

export default CanvasSlidesEditor;
