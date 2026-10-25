import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Clapperboard,
  MicVocal,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sliders,
  Users,
  Search,
  Layers,
  Upload,
  Code2,
  Cpu,
  Wand2,
  Copy,
  Zap,
  Film,
  Maximize2,
  Minimize2,
  Move,
  Type,
  Plus,
  Edit3,
  X,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  putMediaBlob,
  getMediaBlob,
  deleteMediaBlob,
  clearMediaBlobs,
  base64ToBlob,
} from './studioMediaStore';
import { useAuthContext } from '~/hooks';
import { useGetEndpointsQuery } from '~/data-provider';
import { EModelEndpoint } from 'librechat-data-provider';
import { OpenSidebar } from '~/components/Chat/Menus';
import ExpandableButton from '~/components/Common/ExpandableButton';
import ModelSelector from '~/components/SGSST/ModelSelector';
import type { ContextType } from '~/common';
import { cn } from '~/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type StudioTab = 'tts' | 'video' | 'lab' | 'library';

interface StudioModel {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  rateLimitLabel?: string;
  quotaLabel: string;
  description: string;
  supportsMultiSpeaker: boolean;
  supportsVocalBursts: boolean;
  supportedVoices: string[];
}

interface StudioVoice {
  id: string;
  name: string;
  gender: 'Femenino' | 'Masculino';
  tone: string;
  recommendedFor: string;
  tag?: string;
}

interface StudioPreset {
  id: string;
  name: string;
  voiceName: string;
  style: string;
  speed?: string;
  multiSpeaker?: boolean;
  speaker1?: { name: string; voiceName: string; style?: string };
  speaker2?: { name: string; voiceName: string; style?: string };
}

interface VocalBurst {
  tag: string;
  label: string;
  description: string;
}

interface JobChunk {
  index: number;
  wordCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  durationSeconds?: number;
  audioBase64?: string;
}

interface TtsJobState {
  id: string;
  status: 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalChunks: number;
  currentChunkIndex: number;
  completedChunks: number;
  estimatedTotalSeconds: number;
  generatedTotalSeconds: number;
  progressPercent: number;
  chunks: JobChunk[];
  downloadUrl?: string;
  error?: string;
}

interface LibraryItem {
  id: string;
  title: string;
  createdAt: number;
  voiceName: string;
  model: string;
  durationSeconds: number;
  wordCount: number;
  audioBase64?: string;
  downloadUrl?: string;
  stylePrompt?: string;
  scriptText?: string;
  /** 'audio' (locución) o 'video' (composición HTML + voz) */
  kind?: 'audio' | 'video';
  /** Claves de los binarios guardados en IndexedDB (studioMediaStore) */
  mediaKey?: string;
  htmlKey?: string;
  mp4Key?: string;
  capsuleKey?: string;
  aspectRatio?: '9:16' | '16:9';
  showSubtitles?: boolean;
  subtitlePosition?: 'bottom' | 'center' | 'top';
}

// ============================================================================
// CATÁLOGO PRECARGADO POR DEFECTO (14 VOCES, 4 MODELOS, 9 PRESETS, 5 BURSTS)
// ============================================================================

const DEFAULT_STUDIO_TTS_MODELS: Record<string, StudioModel> = {
  'gemini-3.8-flash-tts': {
    id: 'gemini-3.8-flash-tts',
    name: 'Gemini 3.8 Flash TTS',
    badge: 'Recomendado / Cuota Activa',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    rateLimitLabel: '3 RPM • 10 RPD',
    quotaLabel: '✓ Activo (14 voces)',
    description:
      'Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.',
    supportsMultiSpeaker: true,
    supportsVocalBursts: true,
    supportedVoices: [
      'Kore',
      'Puck',
      'Charon',
      'Fenrir',
      'Zephyr',
      'Orus',
      'Aoede',
      'Leda',
      'Callisto',
      'Europa',
      'Ganymede',
      'Io',
      'Titan',
      'Prometheus',
    ],
  },
  'gemini-3.1-flash-tts-preview': {
    id: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash TTS Preview',
    badge: 'Preview 3.1 / Cuota Activa',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    rateLimitLabel: '3 RPM • 10 RPD',
    quotaLabel: '14 voces',
    description:
      'Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).',
    supportsMultiSpeaker: true,
    supportsVocalBursts: true,
    supportedVoices: [
      'Kore',
      'Puck',
      'Charon',
      'Fenrir',
      'Zephyr',
      'Orus',
      'Aoede',
      'Leda',
      'Callisto',
      'Europa',
      'Ganymede',
      'Io',
      'Titan',
      'Prometheus',
    ],
  },
  'gemini-2.5-flash-preview-tts': {
    id: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash TTS',
    badge: 'Reemplazo de 2.5 Pro',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    rateLimitLabel: '3 RPM • 10 RPD (2.5 Pro: 0/0)',
    quotaLabel: '5 voces',
    description:
      'Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.',
    supportsMultiSpeaker: true,
    supportsVocalBursts: false,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'],
  },
  'gemini-3.8-flash-lite-tts': {
    id: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash-Lite TTS',
    badge: 'Ultra Rápido',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    rateLimitLabel: 'Baja Latencia',
    quotaLabel: '6 voces',
    description:
      'Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).',
    supportsMultiSpeaker: false,
    supportsVocalBursts: true,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'],
  },
};

const DEFAULT_STUDIO_VOICES: StudioVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femenino',
    tone: 'Cálida, Serena y Profesional',
    recommendedFor: 'Audiolibros, Narración, Tutoriales, Inducción SST',
    tag: 'Más popular',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculino',
    tone: 'Enérgico, Dinámico y Joven',
    recommendedFor: 'Podcasts, Reels, Contenido Creativo, Diálogos',
    tag: 'Muy expresivo',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculino',
    tone: 'Barítono, Grave, Maduro y Solemne',
    recommendedFor: 'Documentales, Historia, Suspenso, Directivos',
    tag: 'Voz profunda',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculino',
    tone: 'Claro, Elocuente y Periodístico',
    recommendedFor: 'Noticias, Informes, Presentaciones, Boletines',
    tag: 'Profesional',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femenino',
    tone: 'Dulce, Aterciopelada y Relajante',
    recommendedFor: 'Meditación, ASMR, Cuentos, Bienestar',
    tag: 'Calma',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Masculino',
    tone: 'Firme, Imperial, Épico y Reflexivo',
    recommendedFor: 'Ficción Épica, Liderazgo, Ensayos, Cultura Vial',
    tag: 'Imperial',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Femenino',
    tone: 'Melódica, Expresiva, Artística y Cálida',
    recommendedFor: 'Poesía, Literatura, Storytelling, Sensibilización',
    tag: 'Melódica',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Femenino',
    tone: 'Cercana, Maternal, Madura y Envolvente',
    recommendedFor: 'Audiolibros Largos, Relatos, Bienvenida',
    tag: 'Narradora',
  },
  {
    id: 'Callisto',
    name: 'Callisto',
    gender: 'Femenino',
    tone: 'Elegante, Sofisticada y Articulada',
    recommendedFor: 'Divulgación Científica, Conferencias, Auditorías',
    tag: 'Sofisticada',
  },
  {
    id: 'Europa',
    name: 'Europa',
    gender: 'Femenino',
    tone: 'Brillante, Luminosa, Alegre y Asertiva',
    recommendedFor: 'Marketing, Anuncios, E-Learning, Campañas',
    tag: 'Enérgica',
  },
  {
    id: 'Ganymede',
    name: 'Ganymede',
    gender: 'Masculino',
    tone: 'Resonante, Equilibrado, Sabio y Seguro',
    recommendedFor: 'Educación Superior, Cursos, Capacitación Técnica',
    tag: 'Resonante',
  },
  {
    id: 'Io',
    name: 'Io',
    gender: 'Femenino',
    tone: 'Vivaz, Espontánea, Fresca y Amigable',
    recommendedFor: 'Redes Sociales, Vlogs, Asistentes, Reels',
    tag: 'Fresca',
  },
  {
    id: 'Titan',
    name: 'Titan',
    gender: 'Masculino',
    tone: 'Imponente, Cinematográfico y Potente',
    recommendedFor: 'Tráilers, Introducciones, Impacto, Alertas',
    tag: 'Cinematográfica',
  },
  {
    id: 'Prometheus',
    name: 'Prometheus',
    gender: 'Masculino',
    tone: 'Noble, Pensativo, Filosófico y Clásico',
    recommendedFor: 'Filosofía, Análisis Profundo, Crónicas',
    tag: 'Sabio',
  },
];

const DEFAULT_STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'orus-solemn',
    name: 'Narración Solemne (Orus)',
    voiceName: 'Orus',
    style:
      'Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.',
    speed: '0.95x',
  },
  {
    id: 'aoede-poetic',
    name: 'Cuento Poético (Aoede)',
    voiceName: 'Aoede',
    style:
      'Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.',
    speed: '0.95x',
  },
  {
    id: 'titan-trailer',
    name: 'Tráiler Cinematográfico (Titan)',
    voiceName: 'Titan',
    style:
      'Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.',
    speed: '0.95x',
  },
  {
    id: 'kore-audiobook',
    name: 'Narrador de Audiolibro (Kore)',
    voiceName: 'Kore',
    style:
      'Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.',
    speed: '1.0x',
  },
  {
    id: 'puck-podcast',
    name: 'Host de Podcast Dinámico (Puck)',
    voiceName: 'Puck',
    style:
      'Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.',
    speed: '1.05x',
  },
  {
    id: 'charon-documentary',
    name: 'Documental Profundo (Charon)',
    voiceName: 'Charon',
    style:
      'Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.',
    speed: '0.95x',
  },
  {
    id: 'fenrir-news',
    name: 'Noticiero Profesional (Fenrir)',
    voiceName: 'Fenrir',
    style:
      'Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.',
    speed: '1.05x',
  },
  {
    id: 'zephyr-asmr',
    name: 'Meditación y ASMR (Zephyr)',
    voiceName: 'Zephyr',
    style:
      'Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.',
    speed: '0.9x',
  },
  {
    id: 'screenplay-dialogue',
    name: 'Guion / Diálogo Alex & Sam',
    voiceName: 'Kore',
    multiSpeaker: true,
    speaker1: { name: 'Alex', voiceName: 'Puck', style: 'Entusiasta y curioso' },
    speaker2: { name: 'Sam', voiceName: 'Kore', style: 'Experta, clara y cercana' },
    style: 'Diálogo interactivo de podcast entre dos especialistas con alternancia natural.',
    speed: '1.0x',
  },
];

const DEFAULT_STUDIO_VOCAL_BURSTS: VocalBurst[] = [
  {
    tag: '<breath>',
    label: 'Respiración natural',
    description: 'Inserta una toma de aire orgánica entre frases',
  },
  {
    tag: '<laugh>',
    label: 'Risa / Carcajada',
    description: 'Añade una risa espontánea o carcajada suave',
  },
  {
    tag: '<gasp>',
    label: 'Sorpresa / Jadear',
    description: 'Efecto de inhalación rápida de asombro',
  },
  {
    tag: '|mhm|',
    label: 'Asentimiento (|mhm|)',
    description: 'Confirmación conversacional natural',
  },
  {
    tag: '|yeah|',
    label: 'Aceptación (|yeah|)',
    description: 'Interjección de acuerdo en diálogos',
  },
];

// ============================================================================
// PLANTILLAS DE EJEMPLO PARA GUIONES Y COMPOSICIÓN HTML
// ============================================================================

const SCRIPT_TEMPLATES = [
  {
    title: 'Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico',
    text: `¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

Primero: Cortar de forma efectiva todas las fuentes de tensión. Segundo: Bloquear y etiquetar los aparatos de corte con tu candado personal LOTO. <breath>

Tercero: Verificar la ausencia de tensión con un detector calibrado. Cuarto: Poner a tierra y en cortocircuito todas las posibles fuentes de corriente. Y quinto: Delimitar y señalizar la zona de trabajo. <breath>

En WAPPY IA cuidamos lo más valioso: que regreses sano y salvo a casa.`,
  },
  {
    title: 'Reel Viral Estilo Claude: Cómo la IA transforma el SG-SST',
    text: `¿Todavía llevas tu matriz de peligros y tus inspecciones en hojas de cálculo infinitas? <breath>

Mira cómo cambia todo cuando conectas Inteligencia Artificial en tiempo real. En menos de diez segundos, analizamos los riesgos bajo la guía GTC 45, generamos controles operativos y notificamos a cada trabajador en su celular. <breath>

Menos papeleo mecánico y más prevención real en planta. <laugh> Pruébalo hoy mismo en WAPPY Studio.`,
  },
  {
    title: 'Podcast Dual (Alex & Sam): El Futuro de la Prevención',
    text: `Alex: ¡Hola a todos y bienvenidos a un nuevo episodio de Pulso Preventivo! <breath> Hoy hablaremos sobre cómo las voces neuronales y el video interactivo están revolucionando las capacitaciones.

Sam: Totalmente de acuerdo, Alex. |yeah| Lo más impresionante es que los trabajadores ya no se aburren con diapositivas estáticas. <laugh> Ahora reciben cápsulas dinámicas con voz natural.

Alex: Exacto. |mhm| Además, podemos generar desde un reel de un minuto hasta un audiolibro formativo de una hora continua sin cortes.

Sam: Sin duda es un salto enorme para la cultura de seguridad en toda Latinoamérica.`,
  },
  {
    title: 'Pausa Activa & Regulación Emocional (Bienestar)',
    text: `Haz una pausa por un instante... y suelta los hombros. <breath>

Inhala profundamente por la nariz durante cuatro segundos, sintiendo cómo el aire renueva tu energía... <breath>

Ahora exhala suavemente, liberando la tensión acumulada frente a la pantalla. <breath>

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`,
  },
];

export type StudioSceneTemplateId = 'golden-rules' | 'kpi-hud' | 'alert-sst' | 'camera-overlay';

const STUDIO_SCENE_TEMPLATES: {
  id: StudioSceneTemplateId;
  name: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'golden-rules',
    name: '⚡ Reglas de Oro Glass',
    badge: 'Estilo Claude',
    description: 'Tarjeta hero con barra de progreso e indicadores clave en cristal.',
  },
  {
    id: 'kpi-hud',
    name: '📊 Dashboard KPIs & HUD',
    badge: 'Ejecutivo',
    description: 'Métricas ejecutivas animadas con barras comparativas y telemetría.',
  },
  {
    id: 'alert-sst',
    name: '🚨 Alerta & Checklist 1-2-3',
    badge: 'Prevención',
    description: 'Pasos numerados de seguridad con entrada secuencial elástica.',
  },
  {
    id: 'camera-overlay',
    name: '🎬 Lower-Third (Video Propio)',
    badge: 'Transparente',
    description: 'Capas limpias en tercio superior e inferior para dejar libre tu rostro.',
  },
];

function buildDefaultHtmlComposition({
  aspectRatio = '9:16',
  hasBaseVideo = false,
  badgeText = 'CÁPSULA INTERACTIVA WAPPY',
  headline = '5 Reglas de Oro en Seguridad',
  subheadline = 'Prevención inteligente en tiempo real con WAPPY Studio',
  accentColor = '#14b8a6',
  templateId = 'golden-rules',
}: {
  aspectRatio?: '9:16' | '16:9';
  hasBaseVideo?: boolean;
  badgeText?: string;
  headline?: string;
  subheadline?: string;
  accentColor?: string;
  templateId?: StudioSceneTemplateId;
}) {
  const isVertical = aspectRatio === '9:16';
  const safeBadge = badgeText.replace(/</g, '&lt;');
  const safeHeadline = headline.replace(/</g, '&lt;');
  const safeSubheadline = subheadline.replace(/</g, '&lt;');
  const useTransparentBg = hasBaseVideo || templateId === 'camera-overlay';

  let centerMarkup = '';
  if (templateId === 'kpi-hud') {
    centerMarkup = `
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${isVertical ? 'p-5' : 'p-4'} border-t-2" style="border-top-color: ${accentColor};">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono uppercase tracking-wider text-teal-400">📊 TELEMETRÍA PREVENTIVA</span>
          <span class="text-[11px] font-mono font-bold text-emerald-400">▲ +98.4% EFECTIVIDAD</span>
        </div>
        <h1 class="${isVertical ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black leading-tight text-white">
          ${safeHeadline}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${safeSubheadline}</p>
        <div class="mt-4 space-y-2.5">
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Controles Operativos Verificados</span>
              <span class="text-teal-300 font-mono">96%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div id="accent-bar" class="h-full rounded-full" style="width: 96%; background: linear-gradient(90deg, ${accentColor}, #34d399);"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Reducción de Incidentes Críticos</span>
              <span class="text-amber-300 font-mono">100%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, #f59e0b, #10b981);"></div>
            </div>
          </div>
        </div>
      </div>`;
  } else if (templateId === 'alert-sst') {
    centerMarkup = `
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${isVertical ? 'p-5' : 'p-4'} border-l-4" style="border-left-color: #f59e0b;">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
          ⚠️ PROTOCOLO OBLIGATORIO EN PLANTA
        </div>
        <h1 class="${isVertical ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black leading-tight text-white">
          ${safeHeadline}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${safeSubheadline}</p>
      </div>
      <div class="w-full grid grid-cols-1 gap-2" id="metrics-row">
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 font-mono font-black text-xs flex items-center justify-center shrink-0">01</span>
          <span class="text-xs font-bold text-white">Aislar y bloquear todas las fuentes de energía (LOTO)</span>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0">02</span>
          <span class="text-xs font-bold text-white">Verificar ausencia de tensión con equipo calibrado</span>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0">03</span>
          <span class="text-xs font-bold text-white">Delimitar, señalizar y autorizar permiso de trabajo</span>
        </div>
      </div>`;
  } else if (templateId === 'camera-overlay') {
    centerMarkup = `
      <div class="my-auto"></div>
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-2xl p-4 border-l-4" style="border-left-color: ${accentColor};">
        <div class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold">${safeBadge}</div>
        <h1 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">${safeHeadline}</h1>
        <p class="text-xs text-slate-300 mt-0.5">${safeSubheadline}</p>
      </div>`;
  } else {
    centerMarkup = `
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${isVertical ? 'p-5 sm:p-6' : 'p-4 sm:p-5'} border-l-4" style="border-left-color: ${accentColor};">
        <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">⚡ PUNTO CLAVE EN VIVO</div>
        <h1 class="${isVertical ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black leading-tight tracking-tight text-white">
          ${safeHeadline}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-medium">
          ${safeSubheadline}
        </p>
        <div class="mt-3.5 h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden">
          <div id="accent-bar" class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, ${accentColor}, #fbbf24);"></div>
        </div>
      </div>

      <div class="w-full grid grid-cols-3 gap-2 sm:gap-2.5" id="metrics-row">
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${isVertical ? 'p-2.5 sm:p-3' : 'p-2.5'} text-center">
          <div class="${isVertical ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-emerald-400">100%</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Cumplimiento</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${isVertical ? 'p-2.5 sm:p-3' : 'p-2.5'} text-center">
          <div class="${isVertical ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-amber-400">60 FPS</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Motion HTML</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${isVertical ? 'p-2.5 sm:p-3' : 'p-2.5'} text-center">
          <div class="${isVertical ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-indigo-400">IA 3.8</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Voz Neural</div>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: ${useTransparentBg ? 'transparent' : '#060d14'};
      color: #ffffff;
    }
    .grid-bg {
      background-image: radial-gradient(rgba(20, 184, 166, 0.16) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .glass-card {
      background: rgba(10, 18, 30, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    }
  </style>
</head>
<body class="relative w-full h-full flex flex-col justify-between items-center ${isVertical ? 'p-4 sm:p-5' : 'p-4 sm:p-6'} select-none overflow-hidden">
  ${
    useTransparentBg
      ? '<!-- Fondo transparente para dejar ver el video base del usuario -->'
      : `<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35" style="background: ${accentColor};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #6366f1;"></div>
         </div>`
  }

  <!-- TOP HUD BAR (100% centrado con ancho completo de contenedor) -->
  <div id="top-bar" data-editable="true" class="relative z-10 w-full ${isVertical ? 'max-w-md' : 'max-w-2xl'} mx-auto flex items-center justify-between gap-2 shrink-0">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
      <span class="w-2.5 h-2.5 rounded-full animate-ping shrink-0" style="background: ${accentColor};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${safeBadge}</span>
    </div>
    <div class="glass-card px-3 py-1.5 rounded-full text-[11px] font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS (100% centrado matemáticamente con max-w y mx-auto) -->
  <div class="relative z-10 my-auto w-full ${isVertical ? 'max-w-md' : 'max-w-2xl'} mx-auto flex flex-col gap-3 sm:gap-3.5 items-stretch">
    ${centerMarkup}
  </div>

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${isVertical ? 'h-14' : 'h-12'} shrink-0 w-full"></div>

  <script>
    const tl = gsap.timeline({ repeat: 0 });
    window.mainTimeline = tl;

    tl.from("#top-bar", { y: -25, opacity: 0, duration: 0.55, ease: "back.out(1.7)" })
      .from("#hero-card", { scale: 0.94, y: 24, opacity: 0, duration: 0.65, ease: "back.out(1.5)" }, "-=0.25")
      .from(".metric-item", { y: 20, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.7)" }, "-=0.35")
      .to("#hero-card", { y: -4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 3 });
  </script>
</body>
</html>`;
}

interface SelectedCanvasElementInfo {
  tagName: string;
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  dx: number;
  dy: number;
  scale: number;
}

/**
 * Inyecta el puente interactivo de WAPPY Studio dentro de cualquier HTML (por defecto o generado por IA):
 * 1) Auto-ajuste limpio únicamente para contenedores con píxeles fijos grandes (1920px/1080px), sin deformar nunca el body.
 * 2) Control universal de GSAP (Play, Pause, Restart, Seek) interceptando timelines.
 * 3) Editor Visual en Vivo: arrastrar cajas con el mouse, editar textos con doble clic o desde el inspector.
 */
function injectStudioRuntimeBridge(rawHtml: string): string {
  if (!rawHtml) return '';
  if (rawHtml.includes('id="wappy-studio-runtime-bridge"')) return rawHtml;

  const headHook = `<script id="wappy-studio-gsap-hook">
  (function() {
    function patchGsap() {
      if (window.gsap && !window.gsap.__wappyPatched) {
        window.gsap.__wappyPatched = true;
        var origTl = window.gsap.timeline.bind(window.gsap);
        window.gsap.timeline = function(vars) {
          var cleanVars = Object.assign({}, vars || {});
          if (!window.mainTimeline && cleanVars.repeat === -1) {
            cleanVars.repeat = 0;
          }
          var tl = origTl(cleanVars);
          if (!window.mainTimeline) window.mainTimeline = tl;
          return tl;
        };
      }
    }
    patchGsap();
    document.addEventListener("DOMContentLoaded", patchGsap);
    window.addEventListener("load", patchGsap);
  })();
</script>`;

  const runtimeScript = `<style id="wappy-studio-bridge-styles">
  html, body {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  body.wappy-visual-edit-active * {
    cursor: grab;
  }
  body.wappy-visual-edit-active *:hover {
    outline: 1.5px dashed rgba(20, 184, 166, 0.65);
    outline-offset: 2px;
  }
  body.wappy-visual-edit-active [data-wappy-selected="true"] {
    outline: 2.5px solid #14b8a6 !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.22) !important;
  }
  body.wappy-visual-edit-active [contenteditable="true"] {
    cursor: text !important;
    outline: 2.5px solid #f59e0b !important;
  }
</style>
<script id="wappy-studio-runtime-bridge">
(function() {
  var editMode = false;
  var selectedEl = null;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var initialDx = 0;
  var initialDy = 0;

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#14b8a6';
    if (rgb.indexOf('#') === 0) return rgb;
    var m = rgb.match(/\\d+/g);
    if (!m || m.length < 3) return '#ffffff';
    return '#' + [0,1,2].map(function(i) {
      var h = parseInt(m[i], 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function fitStageToViewport() {
    try {
      var vw = window.innerWidth || 540;
      var vh = window.innerHeight || 540;
      var children = Array.prototype.slice.call(document.body.children).filter(function(el) {
        return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE';
      });
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        var inlineW = parseFloat(el.style.width || '0') || 0;
        var inlineH = parseFloat(el.style.height || '0') || 0;
        var cls = el.className && typeof el.className === 'string' ? el.className : '';
        if (!inlineW && cls.indexOf('1920px') !== -1) inlineW = 1920;
        if (!inlineW && cls.indexOf('1080px') !== -1) inlineW = 1080;
        if (!inlineH && cls.indexOf('1920px') !== -1 && inlineW === 1080) inlineH = 1920;
        if (!inlineH && cls.indexOf('1080px') !== -1 && inlineW === 1920) inlineH = 1080;

        if (inlineW >= 720 && (inlineW > vw + 12 || inlineH > vh + 12)) {
          var targetH = inlineH >= 480 ? inlineH : vh;
          var s = Math.min(vw / inlineW, vh / targetH);
          document.body.style.display = 'flex';
          document.body.style.alignItems = 'center';
          document.body.style.justifyContent = 'center';
          el.style.transformOrigin = 'center center';
          el.style.scale = String(Number(s.toFixed(4)));
          el.style.flexShrink = '0';
        }
      }
    } catch (e) {}
  }

  window.addEventListener('resize', fitStageToViewport);
  window.addEventListener('load', fitStageToViewport);

  function notifySelected(el) {
    if (!el) {
      window.parent.postMessage({ type: 'STUDIO_ELEMENT_SELECTED', payload: null }, '*');
      return;
    }
    var cs = window.getComputedStyle(el);
    var dx = parseFloat(el.getAttribute('data-dx') || '0') || 0;
    var dy = parseFloat(el.getAttribute('data-dy') || '0') || 0;
    var sc = parseFloat(el.getAttribute('data-scale') || '1') || 1;
    window.parent.postMessage({
      type: 'STUDIO_ELEMENT_SELECTED',
      payload: {
        tagName: el.tagName.toLowerCase(),
        text: el.innerText || '',
        color: rgbToHex(cs.color),
        backgroundColor: rgbToHex(cs.backgroundColor),
        fontSize: Math.round(parseFloat(cs.fontSize || '16') || 16),
        dx: Math.round(dx),
        dy: Math.round(dy),
        scale: Number(sc.toFixed(2))
      }
    }, '*');
  }

  function emitCleanHtml() {
    try {
      var clone = document.documentElement.cloneNode(true);
      var bStyles = clone.querySelector('#wappy-studio-bridge-styles');
      if (bStyles) bStyles.remove();
      var bScript = clone.querySelector('#wappy-studio-runtime-bridge');
      if (bScript) bScript.remove();
      var gHook = clone.querySelector('#wappy-studio-gsap-hook');
      if (gHook) gHook.remove();
      var bodyClone = clone.querySelector('body');
      if (bodyClone) {
        bodyClone.classList.remove('wappy-visual-edit-active');
        var sel = bodyClone.querySelectorAll('[data-wappy-selected]');
        for (var i = 0; i < sel.length; i++) {
          sel[i].removeAttribute('data-wappy-selected');
          sel[i].removeAttribute('contenteditable');
        }
      }
      window.parent.postMessage({
        type: 'STUDIO_HTML_UPDATED',
        htmlCode: '<!DOCTYPE html>\\n' + clone.outerHTML
      }, '*');
    } catch (e) {}
  }

  function selectElement(el) {
    if (selectedEl && selectedEl !== el) {
      selectedEl.removeAttribute('data-wappy-selected');
      selectedEl.removeAttribute('contenteditable');
    }
    selectedEl = el;
    if (selectedEl) {
      selectedEl.setAttribute('data-wappy-selected', 'true');
    }
    notifySelected(selectedEl);
  }

  document.addEventListener('mousedown', function(e) {
    if (!editMode) return;
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) {
      selectElement(null);
      return;
    }
    if (target.getAttribute('contenteditable') === 'true') return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(target);
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialDx = parseFloat(target.getAttribute('data-dx') || '0') || 0;
    initialDy = parseFloat(target.getAttribute('data-dy') || '0') || 0;
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!editMode || !isDragging || !selectedEl) return;
    var nextDx = initialDx + (e.clientX - dragStartX);
    var nextDy = initialDy + (e.clientY - dragStartY);
    selectedEl.setAttribute('data-dx', String(nextDx));
    selectedEl.setAttribute('data-dy', String(nextDy));
    selectedEl.style.translate = nextDx + 'px ' + nextDy + 'px';
  }, true);

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (selectedEl) {
        notifySelected(selectedEl);
        emitCleanHtml();
      }
    }
  }, true);

  document.addEventListener('dblclick', function(e) {
    if (!editMode) return;
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(target);
    target.setAttribute('contenteditable', 'true');
    target.focus();
  }, true);

  document.addEventListener('input', function() {
    if (!editMode || !selectedEl) return;
    notifySelected(selectedEl);
    emitCleanHtml();
  }, true);

  window.addEventListener('message', function(event) {
    var data = event.data || {};
    var tl = window.mainTimeline || (window.gsap && window.gsap.globalTimeline);

    if (data.type === 'STUDIO_PLAY') {
      if (window.mainTimeline) window.mainTimeline.play();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.play();
    } else if (data.type === 'STUDIO_PAUSE') {
      if (window.mainTimeline) window.mainTimeline.pause();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
    } else if (data.type === 'STUDIO_RESTART') {
      if (window.mainTimeline) window.mainTimeline.restart();
      else if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.restart();
    } else if (data.type === 'STUDIO_SEEK') {
      var p = Math.max(0, Math.min(1, Number(data.progress || 0)));
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(p);
      } else if (window.gsap && window.gsap.globalTimeline && typeof data.time === 'number') {
        window.gsap.globalTimeline.time(data.time);
      }
    } else if (data.type === 'STUDIO_SET_EDIT_MODE') {
      editMode = Boolean(data.enabled);
      if (editMode) {
        document.body.classList.add('wappy-visual-edit-active');
        if (window.mainTimeline) window.mainTimeline.pause();
        if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
      } else {
        document.body.classList.remove('wappy-visual-edit-active');
        selectElement(null);
      }
    } else if (data.type === 'STUDIO_UPDATE_SELECTED' && selectedEl) {
      var upd = data.updates || {};
      if (typeof upd.text === 'string') selectedEl.innerText = upd.text;
      if (typeof upd.color === 'string') selectedEl.style.color = upd.color;
      if (typeof upd.backgroundColor === 'string') selectedEl.style.backgroundColor = upd.backgroundColor;
      if (typeof upd.fontSize === 'number') selectedEl.style.fontSize = upd.fontSize + 'px';
      if (typeof upd.dx === 'number' || typeof upd.dy === 'number') {
        var nx = typeof upd.dx === 'number' ? upd.dx : (parseFloat(selectedEl.getAttribute('data-dx') || '0') || 0);
        var ny = typeof upd.dy === 'number' ? upd.dy : (parseFloat(selectedEl.getAttribute('data-dy') || '0') || 0);
        selectedEl.setAttribute('data-dx', String(nx));
        selectedEl.setAttribute('data-dy', String(ny));
        selectedEl.style.translate = nx + 'px ' + ny + 'px';
      }
      if (typeof upd.scale === 'number') {
        selectedEl.setAttribute('data-scale', String(upd.scale));
        selectedEl.style.scale = String(upd.scale);
      }
      notifySelected(selectedEl);
      emitCleanHtml();
    } else if (data.type === 'STUDIO_SELECT_PARENT' && selectedEl) {
      if (selectedEl.parentElement && selectedEl.parentElement !== document.body) {
        selectElement(selectedEl.parentElement);
      }
    } else if (data.type === 'STUDIO_DELETE_SELECTED' && selectedEl) {
      var toRemove = selectedEl;
      selectElement(null);
      toRemove.remove();
      emitCleanHtml();
    } else if (data.type === 'STUDIO_DUPLICATE_SELECTED' && selectedEl) {
      var dup = selectedEl.cloneNode(true);
      var curX = (parseFloat(selectedEl.getAttribute('data-dx') || '0') || 0) + 18;
      var curY = (parseFloat(selectedEl.getAttribute('data-dy') || '0') || 0) + 18;
      dup.setAttribute('data-dx', String(curX));
      dup.setAttribute('data-dy', String(curY));
      dup.style.translate = curX + 'px ' + curY + 'px';
      if (selectedEl.parentElement) {
        selectedEl.parentElement.appendChild(dup);
        selectElement(dup);
        emitCleanHtml();
      }
    } else if (data.type === 'STUDIO_ADD_ELEMENT') {
      var kind = data.kind || 'text';
      var newEl = document.createElement('div');
      if (kind === 'card') {
        newEl.className = 'glass-card rounded-2xl p-4 border border-teal-500/40 text-white shadow-xl';
        newEl.style.cssText = 'position:absolute; top:35%; left:12%; right:12%; z-index:40; background:rgba(10,18,30,0.86); backdrop-filter:blur(14px); border:1px solid rgba(20,184,166,0.45); border-radius:16px; padding:16px;';
        newEl.innerHTML = '<div style="font-size:11px;font-weight:800;color:#2dd4bf;letter-spacing:0.08em;text-transform:uppercase;">NUEVA TARJETA</div><div style="font-size:18px;font-weight:900;color:#ffffff;margin-top:4px;">Haz doble clic o usa el editor para cambiar este texto</div>';
      } else {
        newEl.style.cssText = 'position:absolute; top:25%; left:15%; z-index:45; font-size:22px; font-weight:900; color:#ffffff; background:rgba(20,184,166,0.22); border:1px solid rgba(20,184,166,0.5); padding:8px 16px; border-radius:12px;';
        newEl.innerText = 'Nuevo Texto Editable';
      }
      document.body.appendChild(newEl);
      selectElement(newEl);
      emitCleanHtml();
    } else if (data.type === 'STUDIO_FIT_VIEWPORT') {
      fitStageToViewport();
    }
  });
})();
</script>`;

  let output = rawHtml;
  if (output.includes('<head>')) {
    output = output.replace('<head>', `<head>\n${headHook}`);
  } else {
    output = `${headHook}\n${output}`;
  }

  if (output.includes('</body>')) {
    output = output.replace('</body>', `${runtimeScript}\n</body>`);
  } else {
    output = `${output}\n${runtimeScript}`;
  }
  return output;
}

// ============================================================================
// UTILIDADES DE AUTENTICACIÓN Y ALMACENAMIENTO DE BIBLIOTECA
// ============================================================================

const LOCAL_LIBRARY_STORAGE = 'wappy_studio_audio_library';

function getAuthHeaders(authToken?: string): Record<string, string> {
  const token = authToken || localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseStudioJson(resp: Response): Promise<any> {
  const rawText = await resp.text();
  try {
    return JSON.parse(rawText);
  } catch {
    if (resp.status === 401 || rawText.trim() === 'Unauthorized') {
      throw new Error('Tu sesión está actualizándose. Intenta nuevamente en un segundo.');
    }
    throw new Error(rawText.slice(0, 180) || `Error del servidor (${resp.status})`);
  }
}

function formatDurationBadge(seconds: number): string {
  const total = Math.max(1, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
}

function formatLibraryDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL: WAPPY STUDIO DASHBOARD
// ============================================================================

export default function WappyStudioDashboard() {
  const { user, token, isAuthenticated } = useAuthContext();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const outletContext = useOutletContext<ContextType>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible ?? (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as StudioTab) || 'tts';
  const [activeTab, setActiveTab] = useState<StudioTab>(
    ['tts', 'video', 'lab', 'library'].includes(initialTab) ? initialTab : 'tts',
  );

  // Modelo de IA para generación de escenas HTML/GSAP (leído desde GOOGLE_MODELS igual que los demás módulos de WAPPY)
  const [selectedAiModel, setSelectedAiModel] = useState<string>(() =>
    user?.personalization?.geminiModels?.sstManagement ||
    (process.env.GOOGLE_MODELS || 'gemini-3.6-flash').split(',')[0].trim(),
  );

  // Catálogo precargado inmediatamente (14 voces, 4 modelos, 9 presets y 5 vocal bursts siempre visibles)
  const [models, setModels] = useState<StudioModel[]>(() =>
    Object.values(DEFAULT_STUDIO_TTS_MODELS),
  );
  const [voices, setVoices] = useState<StudioVoice[]>(() => DEFAULT_STUDIO_VOICES);
  const [presets, setPresets] = useState<StudioPreset[]>(() => DEFAULT_STUDIO_PRESETS);
  const [vocalBursts, setVocalBursts] = useState<VocalBurst[]>(() => DEFAULT_STUDIO_VOCAL_BURSTS);

  // Estado del Estudio TTS
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash-tts');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.',
  );
  const [multiSpeaker, setMultiSpeaker] = useState<boolean>(false);
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [wordsPerChunk, setWordsPerChunk] = useState<number>(150);
  const [scriptText, setScriptText] = useState<string>(SCRIPT_TEMPLATES[0].text);

  // Estado del Laboratorio de Expresividad & Prosodia (Pestaña 3)
  const [labStylePrompt, setLabStylePrompt] = useState<string>(
    'Voz expresiva, tono conversacional y alegre.',
  );
  const [labTestText, setLabTestText] = useState<string>(
    'Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente.',
  );
  const [isSynthesizingLab, setIsSynthesizingLab] = useState<boolean>(false);
  const [playingBurstTag, setPlayingBurstTag] = useState<string | null>(null);

  // Estadísticas de Texto y Estimación
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0.5);
  const [chunkCount, setChunkCount] = useState<number>(1);

  // Estados de Ejecución TTS
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [auditioningVoiceId, setAuditioningVoiceId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<TtsJobState | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Filtros de Voces
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'Femenino' | 'Masculino'>(
    'all',
  );
  const [voiceActiveFilter, setVoiceActiveFilter] = useState<'only_active' | 'all'>('only_active');
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string>('');
  const [showAdvancedChunking, setShowAdvancedChunking] = useState<boolean>(false);

  // Reproductor Maestro de Audio
  const [currentAudio, setCurrentAudio] = useState<{
    base64?: string;
    url?: string;
    title: string;
    durationSeconds?: number;
    voiceName?: string;
    scriptText?: string;
    mediaKey?: string;
  } | null>(null);

  // Biblioteca Local
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_LIBRARY_STORAGE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // ============================================================================
  // ESTADO DEL COMPOSITOR DE VIDEO HTML & CAPAS
  // ============================================================================
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [selectedSceneTemplate, setSelectedSceneTemplate] =
    useState<StudioSceneTemplateId>('golden-rules');
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'center' | 'top'>('bottom');
  const [isSyncingVoiceToVideo, setIsSyncingVoiceToVideo] = useState<boolean>(false);
  const [baseVideoUrl, setBaseVideoUrl] = useState<string | null>(null);
  const [baseVideoName, setBaseVideoName] = useState<string>('');
  const [muteBaseVideo, setMuteBaseVideo] = useState<boolean>(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [showDynamicSubtitles, setShowDynamicSubtitles] = useState<boolean>(true);
  const [badgeOverlayText, setBadgeOverlayText] = useState<string>('CÁPSULA INTERACTIVA WAPPY');
  const [headlineOverlayText, setHeadlineOverlayText] = useState<string>(
    '5 Reglas de Oro en Riesgo Eléctrico',
  );
  const [subheadlineOverlayText, setSubheadlineOverlayText] = useState<string>(
    'Prevención inteligente y locución neural sincronizada',
  );
  const [accentColor, setAccentColor] = useState<string>('#14b8a6');
  const [aiScenePrompt, setAiScenePrompt] = useState<string>(
    'Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso.',
  );
  const [isGeneratingHtmlAi, setIsGeneratingHtmlAi] = useState<boolean>(false);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [htmlCode, setHtmlCode] = useState<string>(() =>
    buildDefaultHtmlComposition({
      aspectRatio: '9:16',
      hasBaseVideo: false,
      badgeText: 'CÁPSULA INTERACTIVA WAPPY',
      headline: '5 Reglas de Oro en Riesgo Eléctrico',
      subheadline: 'Prevención inteligente y locución neural sincronizada',
      accentColor: '#14b8a6',
      templateId: 'golden-rules',
    }),
  );

  // Estado del Reproductor de Video Compuesto y Editor Visual en Vivo
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(20);
  const [isStageFullscreen, setIsStageFullscreen] = useState<boolean>(false);
  const [isVisualEditMode, setIsVisualEditMode] = useState<boolean>(false);
  const [selectedCanvasElement, setSelectedCanvasElement] =
    useState<SelectedCanvasElementInfo | null>(null);
  const latestEditedHtmlRef = useRef<string>('');
  const [isRenderingServerMp4, setIsRenderingServerMp4] = useState<boolean>(false);
  const [isBuildingAcademyHtml, setIsBuildingAcademyHtml] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const baseVideoRef = useRef<HTMLVideoElement | null>(null);
  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  const bridgedHtmlCode = useMemo(() => injectStudioRuntimeBridge(htmlCode), [htmlCode]);

  // Escuchar cambios de Pantalla Completa y ajustar automáticamente el lienzo
  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsStageFullscreen(isFs);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_FIT_VIEWPORT' }, '*');
      }, 80);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_FIT_VIEWPORT' }, '*');
      }, 300);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Escuchar eventos del Editor Visual (selección de elementos y cambios en el DOM del iframe)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type === 'STUDIO_ELEMENT_SELECTED') {
        setSelectedCanvasElement(data.payload || null);
      } else if (data.type === 'STUDIO_HTML_UPDATED' && typeof data.htmlCode === 'string') {
        latestEditedHtmlRef.current = data.htmlCode;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Guardar biblioteca cuando cambie (solo metadata ligera; los binarios viven en IndexedDB)
  useEffect(() => {
    const items = libraryItems.slice(0, 60);
    try {
      localStorage.setItem(LOCAL_LIBRARY_STORAGE, JSON.stringify(items));
    } catch {
      // Cuota excedida: guardar sin Base64 embebido para no perder el historial
      try {
        localStorage.setItem(
          LOCAL_LIBRARY_STORAGE,
          JSON.stringify(items.map(({ audioBase64: _omit, ...rest }) => rest)),
        );
      } catch {
        /* ignore */
      }
    }
  }, [libraryItems]);

  // Migración: mover audios Base64 antiguos de localStorage a IndexedDB
  useEffect(() => {
    const legacy = libraryItems.filter((it) => it.audioBase64 && !it.mediaKey);
    if (legacy.length === 0) return;
    (async () => {
      const migrated: Record<string, string> = {};
      for (const it of legacy) {
        try {
          const key = `audio-${it.id}`;
          await putMediaBlob(key, base64ToBlob(it.audioBase64 as string));
          migrated[it.id] = key;
        } catch {
          /* mantener Base64 si IndexedDB falla */
        }
      }
      if (Object.keys(migrated).length === 0) return;
      setLibraryItems((prev) =>
        prev.map((it) =>
          migrated[it.id] ? { ...it, mediaKey: migrated[it.id], audioBase64: undefined } : it,
        ),
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL de objeto (blob:) activa para el reproductor; se revoca al reemplazarla
  const activeObjectUrlRef = useRef<string | null>(null);
  const setObjectUrlForPlayer = (blob: Blob) => {
    if (activeObjectUrlRef.current) URL.revokeObjectURL(activeObjectUrlRef.current);
    const url = URL.createObjectURL(blob);
    activeObjectUrlRef.current = url;
    return url;
  };

  /**
   * Agrega un audio a la biblioteca guardando el WAV en IndexedDB (persistente, sin límite de 5 MB).
   * Acepta Base64 directo o una URL del servidor (trabajos largos que solo viven en RAM del backend).
   */
  const saveAudioToLibrary = async (
    item: LibraryItem,
    source: { base64?: string; url?: string },
  ): Promise<string | undefined> => {
    const key = `audio-${item.id}`;
    let blob: Blob | null = null;
    try {
      if (source.base64) {
        blob = base64ToBlob(source.base64);
      } else if (source.url) {
        const r = await fetch(source.url, { headers: getAuthHeaders(token) });
        if (r.ok) blob = await r.blob();
      }
      if (blob) await putMediaBlob(key, blob);
    } catch {
      blob = null;
    }
    const stored: LibraryItem = blob
      ? { ...item, kind: item.kind || 'audio', mediaKey: key, audioBase64: undefined }
      : { ...item, kind: item.kind || 'audio', audioBase64: source.base64 };
    setLibraryItems((prev) => [stored, ...prev.filter((x) => x.id !== item.id)]);
    return blob ? key : undefined;
  };

  /** Recupera el audio de un elemento de biblioteca como Blob (IndexedDB → Base64 → servidor). */
  const loadLibraryAudioBlob = async (item: LibraryItem): Promise<Blob | null> => {
    if (item.mediaKey) {
      const b = await getMediaBlob(item.mediaKey);
      if (b) return b;
    }
    if (item.audioBase64) return base64ToBlob(item.audioBase64);
    if (item.downloadUrl) {
      try {
        const r = await fetch(item.downloadUrl, { headers: getAuthHeaders(token) });
        if (r.ok) {
          const b = await r.blob();
          // Auto-reparación: guardarlo ya en IndexedDB para que no vuelva a depender del servidor
          const key = `audio-${item.id}`;
          putMediaBlob(key, b)
            .then(() =>
              setLibraryItems((prev) =>
                prev.map((x) => (x.id === item.id ? { ...x, mediaKey: key } : x)),
              ),
            )
            .catch(() => {});
          return b;
        }
      } catch {
        /* sin conexión o 404 */
      }
    }
    return null;
  };

  const openLibraryAudio = async (item: LibraryItem, goToVideo = false) => {
    const blob = await loadLibraryAudioBlob(item);
    if (!blob) {
      setStatusBanner({
        type: 'error',
        text: 'Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador.',
      });
      return false;
    }
    setCurrentAudio({
      url: setObjectUrlForPlayer(blob),
      title: item.title,
      durationSeconds: item.durationSeconds,
      voiceName: item.voiceName,
      scriptText: item.scriptText,
      mediaKey: item.mediaKey || `audio-${item.id}`,
    });
    if (item.durationSeconds && item.durationSeconds > 1) setVideoDuration(item.durationSeconds);
    if (goToVideo) handleTabChange('video');
    return true;
  };

  const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const deleteLibraryItem = (item: LibraryItem) => {
    setLibraryItems((prev) => {
      const rest = prev.filter((x) => x.id !== item.id);
      const keys = [item.mediaKey, item.htmlKey, item.mp4Key, item.capsuleKey].filter(
        Boolean,
      ) as string[];
      keys.forEach((k) => {
        const stillUsed = rest.some((x) =>
          [x.mediaKey, x.htmlKey, x.mp4Key, x.capsuleKey].includes(k),
        );
        if (!stillUsed) deleteMediaBlob(k);
      });
      return rest;
    });
  };

  // Sincronizar modelos TTS desde endpointsConfig (GOOGLE_MODELS en .env) y catálogo del backend
  useEffect(() => {
    const googleEnvModels = endpointsConfig?.[EModelEndpoint.google]?.models;
    if (Array.isArray(googleEnvModels) && googleEnvModels.length > 0) {
      const envTtsIds = googleEnvModels
        .map((m: any) =>
          (typeof m === 'string' ? m : m?.id || m?.value || '').replace('models/', '').trim(),
        )
        .filter((id: string) => id && id.includes('tts'));

      if (envTtsIds.length > 0) {
        setModels((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          return envTtsIds.map(
            (id: string) =>
              DEFAULT_STUDIO_TTS_MODELS[id] ||
              prevMap.get(id) || {
                id,
                name: id,
                badge: 'GOOGLE_MODELS',
                badgeColor:
                  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
                rateLimitLabel: '3 RPM • 10 RPD',
                quotaLabel: '14 voces',
                description: `Modelo TTS cargado desde GOOGLE_MODELS (${id}).`,
                supportsMultiSpeaker: !id.includes('lite'),
                supportsVocalBursts: !id.includes('2.5'),
                supportedVoices: DEFAULT_STUDIO_TTS_MODELS['gemini-3.8-flash-tts'].supportedVoices,
              },
          );
        });
      }
    }
  }, [endpointsConfig]);

  useEffect(() => {
    fetch('/api/studio/catalog', { headers: getAuthHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.models) && data.models.length > 0) setModels(data.models);
        if (Array.isArray(data.voices) && data.voices.length > 0) setVoices(data.voices);
        if (Array.isArray(data.presets) && data.presets.length > 0) setPresets(data.presets);
        if (Array.isArray(data.vocalBursts) && data.vocalBursts.length > 0) {
          setVocalBursts(data.vocalBursts);
        }
      })
      .catch(() => {
        /* Fallback al catálogo precargado en cliente */
      });
  }, [token]);

  // Recalcular palabras, fragmentos y duración estimada
  useEffect(() => {
    const clean = scriptText.trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setCharCount(clean.length);
    if (!clean) {
      setEstimatedMinutes(0);
      setChunkCount(0);
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/studio/tts/estimate', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ text: clean, maxWordsPerChunk: wordsPerChunk }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && typeof data.estimatedMinutes === 'number') {
            setEstimatedMinutes(data.estimatedMinutes);
          } else {
            setEstimatedMinutes(Math.round((words / 145) * 10) / 10);
          }
          if (data && typeof data.chunkCount === 'number') {
            setChunkCount(data.chunkCount);
          } else {
            setChunkCount(Math.max(1, Math.ceil(words / wordsPerChunk)));
          }
        })
        .catch(() => {
          setEstimatedMinutes(Math.round((words / 145) * 10) / 10);
          setChunkCount(Math.max(1, Math.ceil(words / wordsPerChunk)));
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [scriptText, wordsPerChunk, token]);

  const handleTabChange = (tab: StudioTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const activeModelObj = useMemo(
    () => models.find((m) => m.id === selectedModel) || models[0],
    [models, selectedModel],
  );

  const isVoiceSupported = (voiceId: string) => {
    if (!activeModelObj?.supportedVoices) return true;
    return activeModelObj.supportedVoices.includes(voiceId);
  };

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const supported = isVoiceSupported(v.id);
      const matchesActive = voiceActiveFilter === 'all' || supported;
      const matchesGender = voiceGenderFilter === 'all' || v.gender === voiceGenderFilter;
      const q = voiceSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.tone.toLowerCase().includes(q) ||
        v.recommendedFor.toLowerCase().includes(q) ||
        (v.tag && v.tag.toLowerCase().includes(q));
      return matchesActive && matchesGender && matchesQuery;
    });
  }, [voices, activeModelObj, voiceActiveFilter, voiceGenderFilter, voiceSearchQuery]);

  // ============================================================================
  // ACCIONES DE SÍNTESIS DE VOZ (TTS)
  // ============================================================================

  const handleAuditionVoice = async (voiceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setAuditioningVoiceId(voiceId);
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          voiceName: voiceId,
          model: isVoiceSupported(voiceId) ? selectedModel : 'gemini-3.8-flash-tts',
          text: `Hola, soy ${voiceId}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`,
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'No se pudo sintetizar la muestra.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Muestra de Voz: ${voiceId}`,
        durationSeconds: data.durationSeconds,
        voiceName: voiceId,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Error en audición de voz.' });
    } finally {
      setAuditioningVoiceId(null);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          voiceName: selectedVoice,
          model: selectedModel,
          text: '¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo.',
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error probando conexión.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Prueba de Conexión (${selectedVoice})`,
        durationSeconds: data.durationSeconds,
        voiceName: selectedVoice,
      });
      setStatusBanner({
        type: 'success',
        text: `¡Conexión activa con ${data.usedModel || selectedModel}! Audio sintetizado correctamente.`,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Error de conexión con Gemini TTS.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSynthesizePreview = async () => {
    if (!scriptText.trim()) return;
    try {
      setIsPreviewing(true);
      setStatusBanner(null);
      const snippet = scriptText.trim().slice(0, 750);
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: snippet,
          voiceName: selectedVoice,
          stylePrompt,
          model: selectedModel,
          multiSpeaker,
          speaker1: { name: 'Alex', voiceName: speaker1Voice },
          speaker2: { name: 'Sam', voiceName: speaker2Voice },
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al sintetizar vista previa.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Vista Previa: ${snippet.slice(0, 38)}...`,
        durationSeconds: data.durationSeconds,
        voiceName: selectedVoice,
        scriptText: snippet,
      });
      const newItem: LibraryItem = {
        id: Date.now().toString(),
        title: `Vista Previa: ${snippet.slice(0, 42)}...`,
        createdAt: Date.now(),
        voiceName: selectedVoice,
        model: data.usedModel || selectedModel,
        durationSeconds: data.durationSeconds,
        wordCount: snippet.split(/\s+/).filter(Boolean).length,
        stylePrompt,
        scriptText: snippet,
      };
      const previewKey = await saveAudioToLibrary(newItem, { base64: data.audioBase64 });
      if (previewKey) {
        setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: previewKey } : prev));
      }
      setStatusBanner({
        type: 'success',
        text: 'Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video.',
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Error sintetizando fragmento.' });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSynthesizeInLab = async () => {
    if (!labTestText.trim()) return;
    try {
      setIsSynthesizingLab(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: labTestText.trim(),
          voiceName: selectedVoice,
          stylePrompt: labStylePrompt,
          model: selectedModel,
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al sintetizar en el laboratorio.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Laboratorio (${selectedVoice}): ${labTestText.trim().slice(0, 34)}...`,
        durationSeconds: data.durationSeconds,
        voiceName: selectedVoice,
        scriptText: labTestText.trim(),
      });
      const newItem: LibraryItem = {
        id: Date.now().toString(),
        title: `Laboratorio: ${labTestText.trim().slice(0, 42)}...`,
        createdAt: Date.now(),
        voiceName: selectedVoice,
        model: data.usedModel || selectedModel,
        durationSeconds: data.durationSeconds,
        wordCount: labTestText.trim().split(/\s+/).filter(Boolean).length,
        stylePrompt: labStylePrompt,
        scriptText: labTestText.trim(),
      };
      const labKey = await saveAudioToLibrary(newItem, { base64: data.audioBase64 });
      if (labKey) {
        setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: labKey } : prev));
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Error sintetizando prueba en el laboratorio.',
      });
    } finally {
      setIsSynthesizingLab(false);
    }
  };

  const handleStartFullJob = async () => {
    if (!scriptText.trim()) return;
    try {
      setStatusBanner(null);
      if (sseRef.current) {
        sseRef.current.close();
      }
      const resp = await fetch('/api/studio/tts/jobs', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: scriptText,
          voiceName: selectedVoice,
          stylePrompt,
          model: selectedModel,
          multiSpeaker,
          speaker1: { name: 'Alex', voiceName: speaker1Voice },
          speaker2: { name: 'Sam', voiceName: speaker2Voice },
          maxWordsPerChunk: wordsPerChunk,
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo iniciar el trabajo de larga duración.');
      }

      const initialJob: TtsJobState = {
        id: data.jobId,
        status: 'processing',
        totalChunks: data.totalChunks,
        currentChunkIndex: 0,
        completedChunks: 0,
        estimatedTotalSeconds: data.estimatedTotalSeconds,
        generatedTotalSeconds: 0,
        progressPercent: 0,
        chunks: Array.from({ length: data.totalChunks }, (_, idx) => ({
          index: idx,
          wordCount: 0,
          status: 'pending',
        })),
      };
      setActiveJob(initialJob);

      const es = new EventSource(
        `/api/studio/tts/jobs/${data.jobId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`,
      );
      sseRef.current = es;

      es.addEventListener('snapshot', (ev: MessageEvent) => {
        const snap = JSON.parse(ev.data);
        setActiveJob((prev) => (prev ? { ...prev, ...snap } : snap));
      });

      es.addEventListener('chunk_start', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        setActiveJob((prev) => {
          if (!prev) return null;
          const chunks = [...prev.chunks];
          if (chunks[d.chunkIndex]) {
            chunks[d.chunkIndex] = { ...chunks[d.chunkIndex], status: 'processing' };
          }
          return { ...prev, currentChunkIndex: d.chunkIndex, chunks };
        });
      });

      es.addEventListener('chunk_complete', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        setActiveJob((prev) => {
          if (!prev) return null;
          const chunks = [...prev.chunks];
          if (chunks[d.chunkIndex]) {
            chunks[d.chunkIndex] = {
              ...chunks[d.chunkIndex],
              status: 'completed',
              durationSeconds: d.durationSeconds,
              audioBase64: d.audioBase64,
            };
          }
          const completed = chunks.filter((c) => c.status === 'completed').length;
          return {
            ...prev,
            completedChunks: completed,
            progressPercent: d.progressPercent,
            generatedTotalSeconds: d.generatedTotalSeconds,
            chunks,
          };
        });
      });

      es.addEventListener('job_completed', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        es.close();
        setActiveJob((prev) =>
          prev
            ? { ...prev, status: 'completed', progressPercent: 100, downloadUrl: d.downloadUrl }
            : null,
        );
        setCurrentAudio({
          url: d.downloadUrl,
          title: `Audio Completo: ${scriptText.trim().slice(0, 35)}...`,
          durationSeconds: d.totalDurationSeconds,
          voiceName: selectedVoice,
          scriptText,
        });
        const newItem: LibraryItem = {
          id: d.id,
          title: `Audio Completo: ${scriptText.trim().slice(0, 42)}...`,
          createdAt: Date.now(),
          voiceName: selectedVoice,
          model: selectedModel,
          durationSeconds: d.totalDurationSeconds,
          wordCount,
          downloadUrl: d.downloadUrl,
          stylePrompt,
          scriptText,
        };
        // Descargar el WAV maestro del servidor (vive solo en RAM) y guardarlo en IndexedDB
        saveAudioToLibrary(newItem, { url: d.downloadUrl }).then((key) => {
          if (key) setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: key } : prev));
        });
      });

      es.addEventListener('job_failed', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        es.close();
        setActiveJob((prev) => (prev ? { ...prev, status: 'failed', error: d.error } : null));
      });

      es.addEventListener('job_status', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        setActiveJob((prev) => (prev ? { ...prev, status: d.status } : null));
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Error iniciando trabajo.' });
    }
  };

  const handleControlJob = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!activeJob) return;
    if (action === 'cancel' && sseRef.current) {
      sseRef.current.close();
    }
    await fetch(`/api/studio/tts/jobs/${activeJob.id}/control`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ action }),
    });
    setActiveJob((prev) =>
      prev
        ? {
            ...prev,
            status:
              action === 'pause' ? 'paused' : action === 'resume' ? 'processing' : 'cancelled',
          }
        : null,
    );
  };

  const insertTagIntoEditor = (tagText: string) => {
    const el = document.getElementById('wappy-studio-tts-editor') as HTMLTextAreaElement | null;
    if (!el) {
      setScriptText((prev) => `${prev} ${tagText}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = scriptText.substring(0, start) + tagText + scriptText.substring(end);
    setScriptText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tagText.length, start + tagText.length);
    }, 15);
  };

  // ============================================================================
  // ACCIONES DEL COMPOSITOR DE VIDEO HTML & CAPAS
  // ============================================================================

  const handleRebuildDefaultTemplate = (
    nextRatio = aspectRatio,
    nextHasVideo = Boolean(baseVideoUrl),
    nextTemplateId = selectedSceneTemplate,
  ) => {
    setHtmlCode(
      buildDefaultHtmlComposition({
        aspectRatio: nextRatio,
        hasBaseVideo: nextHasVideo,
        badgeText: badgeOverlayText,
        headline: headlineOverlayText,
        subheadline: subheadlineOverlayText,
        accentColor,
        templateId: nextTemplateId,
      }),
    );
  };

  const handleSyncVoiceToVideo = async () => {
    const textToRead = (scriptText || headlineOverlayText || '').trim().slice(0, 750);
    if (!textToRead) return;
    try {
      setIsSyncingVoiceToVideo(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: textToRead,
          voiceName: selectedVoice,
          stylePrompt,
          model: selectedModel,
          multiSpeaker,
          speaker1: { name: 'Alex', voiceName: speaker1Voice },
          speaker2: { name: 'Sam', voiceName: speaker2Voice },
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'No se pudo sintetizar la voz para el video.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Locución de Video (${selectedVoice})`,
        durationSeconds: data.durationSeconds,
        voiceName: selectedVoice,
        scriptText: textToRead,
      });
      saveAudioToLibrary(
        {
          id: `vo-${Date.now()}`,
          title: `Locución de Video: ${textToRead.slice(0, 40)}...`,
          createdAt: Date.now(),
          voiceName: selectedVoice,
          model: data.usedModel || selectedModel,
          durationSeconds: data.durationSeconds,
          wordCount: textToRead.split(/\s+/).filter(Boolean).length,
          stylePrompt,
          scriptText: textToRead,
        },
        { base64: data.audioBase64 },
      ).then((key) => {
        if (key) setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: key } : prev));
      });
      if (data.durationSeconds && data.durationSeconds > 1) {
        setVideoDuration(data.durationSeconds);
      }
      setVideoCurrentTime(0);
      setIsVideoPlaying(true);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_RESTART' }, '*');
        stageAudioRef.current?.play().catch(() => {});
        baseVideoRef.current?.play().catch(() => {});
      }, 120);
      setStatusBanner({
        type: 'success',
        text: `¡Locución neural (${selectedVoice}) sincronizada automáticamente con el lienzo de video!`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Error sincronizando voz con el video.',
      });
    } finally {
      setIsSyncingVoiceToVideo(false);
    }
  };

  const handleGenerateHtmlWithAi = async () => {
    try {
      setIsGeneratingHtmlAi(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/video/generate-html', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          prompt: aiScenePrompt,
          scriptText,
          aspectRatio,
          hasBaseVideo: Boolean(baseVideoUrl),
          showSubtitles: showDynamicSubtitles,
          durationSeconds: Math.round(currentAudio?.durationSeconds || videoDuration || 25),
          companyName: user?.name || 'WAPPY IA',
          modelName: selectedAiModel,
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error generando composición HTML con IA.');
      }
      setHtmlCode(data.htmlCode);
      setStatusBanner({
        type: 'success',
        text: '¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo.',
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'No se pudo generar la escena HTML con IA.',
      });
    } finally {
      setIsGeneratingHtmlAi(false);
    }
  };

  const handleBaseVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (baseVideoUrl) URL.revokeObjectURL(baseVideoUrl);
    const url = URL.createObjectURL(file);
    setBaseVideoUrl(url);
    setBaseVideoName(file.name);
    handleRebuildDefaultTemplate(aspectRatio, true);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
  };

  const activeStageAudioSrc = useMemo(() => {
    if (customAudioUrl) return customAudioUrl;
    if (currentAudio?.url) return currentAudio.url;
    if (currentAudio?.base64) return `data:audio/wav;base64,${currentAudio.base64}`;
    return '';
  }, [customAudioUrl, currentAudio]);

  // Reloj maestro de reproducción a 250ms (4 Hz) para que el botón Play/Pause y los subtítulos
  // palabra a palabra avancen fluidamente sin provocar re-renderizados excesivos ni titileo en botones
  useEffect(() => {
    if (activeTab !== 'video' || !isVideoPlaying || isVisualEditMode) return;
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const audioEl = stageAudioRef.current;
      const videoEl = baseVideoRef.current;

      if (audioEl && activeStageAudioSrc && !audioEl.paused && !audioEl.ended) {
        setVideoCurrentTime(audioEl.currentTime);
        return;
      }
      if (videoEl && baseVideoUrl && !videoEl.paused && !videoEl.ended) {
        setVideoCurrentTime(videoEl.currentTime);
        return;
      }

      setVideoCurrentTime((prev) => {
        const dur = Math.max(1, videoDuration || 20);
        const next = prev + dt;
        if (next >= dur) {
          setIsVideoPlaying(false);
          iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_PAUSE' }, '*');
          return dur;
        }
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [activeTab, isVideoPlaying, isVisualEditMode, videoDuration, activeStageAudioSrc, baseVideoUrl]);

  // Sincronización de Play / Pause / Seek entre Video Base, Audio Locución e iframe GSAP
  const toggleStagePlayback = () => {
    // Si ya llegó al final del audio/video y el usuario presiona Play, reiniciar todo junto (Voz + Animación HTML) desde 0.0s
    const dur = Math.max(1, videoDuration || 20);
    const hasEnded =
      !isVideoPlaying &&
      (videoCurrentTime >= dur - 0.3 || Boolean(stageAudioRef.current?.ended));
    if (hasEnded) {
      restartStagePlayback();
      return;
    }

    const nextPlaying = !isVideoPlaying;
    if (nextPlaying && isVisualEditMode) {
      setIsVisualEditMode(false);
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'STUDIO_SET_EDIT_MODE', enabled: false },
        '*',
      );
    }
    setIsVideoPlaying(nextPlaying);

    iframeRef.current?.contentWindow?.postMessage(
      { type: nextPlaying ? 'STUDIO_PLAY' : 'STUDIO_PAUSE' },
      '*',
    );

    if (baseVideoRef.current) {
      if (nextPlaying) baseVideoRef.current.play().catch(() => {});
      else baseVideoRef.current.pause();
    }
    if (stageAudioRef.current && activeStageAudioSrc) {
      if (nextPlaying) stageAudioRef.current.play().catch(() => {});
      else stageAudioRef.current.pause();
    }
  };

  const restartStagePlayback = () => {
    if (isVisualEditMode) {
      setIsVisualEditMode(false);
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'STUDIO_SET_EDIT_MODE', enabled: false },
        '*',
      );
    }
    setVideoCurrentTime(0);
    setIsVideoPlaying(true);
    iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_RESTART' }, '*');
    if (baseVideoRef.current) {
      baseVideoRef.current.currentTime = 0;
      baseVideoRef.current.play().catch(() => {});
    }
    if (stageAudioRef.current && activeStageAudioSrc) {
      stageAudioRef.current.currentTime = 0;
      stageAudioRef.current.play().catch(() => {});
    }
  };

  const handleStageSeek = (newTime: number) => {
    setVideoCurrentTime(newTime);
    const progress = videoDuration > 0 ? newTime / videoDuration : 0;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'STUDIO_SEEK', progress, time: newTime },
      '*',
    );
    if (baseVideoRef.current) {
      baseVideoRef.current.currentTime = newTime;
    }
    if (stageAudioRef.current && activeStageAudioSrc) {
      stageAudioRef.current.currentTime = newTime;
    }
  };

  const toggleVisualEditMode = () => {
    const next = !isVisualEditMode;
    setIsVisualEditMode(next);
    if (next) {
      setIsVideoPlaying(false);
      baseVideoRef.current?.pause();
      stageAudioRef.current?.pause();
    } else if (latestEditedHtmlRef.current) {
      setHtmlCode(latestEditedHtmlRef.current);
      latestEditedHtmlRef.current = '';
    }
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'STUDIO_SET_EDIT_MODE', enabled: next },
      '*',
    );
  };

  const updateSelectedCanvasElement = (updates: Partial<SelectedCanvasElementInfo>) => {
    setSelectedCanvasElement((prev) => (prev ? { ...prev, ...updates } : prev));
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'STUDIO_UPDATE_SELECTED', updates },
      '*',
    );
  };

  const handleSaveVisualEdits = () => {
    if (latestEditedHtmlRef.current) {
      setHtmlCode(latestEditedHtmlRef.current);
      latestEditedHtmlRef.current = '';
    }
    setIsVisualEditMode(false);
    setSelectedCanvasElement(null);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'STUDIO_SET_EDIT_MODE', enabled: false },
      '*',
    );
    setStatusBanner({
      type: 'success',
      text: '¡Cambios de textos y posición de cajas guardados en la composición HTML!',
    });
  };

  const toggleStageFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      stageContainerRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  // Cálculo de Subtítulos Dinámicos Palabra a Palabra (Estilo Hormozi / Claude)
  const cleanSubtitleWords = useMemo(() => {
    const sourceText = currentAudio?.scriptText || scriptText || '';
    return sourceText
      .replace(/<[^>]+>/g, '')
      .replace(/\|[^|]+\|/g, '')
      .replace(/^(Alex|Sam):\s*/gim, '')
      .split(/\s+/)
      .filter(Boolean);
  }, [currentAudio?.scriptText, scriptText]);

  const currentSubtitleWindow = useMemo(() => {
    if (!showDynamicSubtitles || cleanSubtitleWords.length === 0) return null;
    const progress = Math.max(0, Math.min(0.999, videoCurrentTime / Math.max(1, videoDuration)));
    const activeWordIndex = Math.floor(progress * cleanSubtitleWords.length);
    const windowSize = 5;
    const windowStart = Math.floor(activeWordIndex / windowSize) * windowSize;
    const slice = cleanSubtitleWords.slice(windowStart, windowStart + windowSize);
    return {
      words: slice,
      activeOffset: activeWordIndex - windowStart,
    };
  }, [showDynamicSubtitles, cleanSubtitleWords, videoCurrentTime, videoDuration]);

  // Auxiliar: Obtiene la pista de locución activa en Base64 (desde síntesis directa, trabajo largo o archivo subido)
  const resolveCurrentAudioBase64 = async (): Promise<string | null> => {
    if (currentAudio?.base64) return currentAudio.base64;
    if (!activeStageAudioSrc) return null;
    try {
      const resp = await fetch(activeStageAudioSrc);
      if (!resp.ok) return null;
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      return window.btoa(binary);
    } catch {
      return null;
    }
  };

  // ============================================================================
  // OPCIÓN B: RENDERIZADO MP4 EN SERVIDOR (PUPPETEER + FFMPEG H.264 + AAC)
  // Descarga Todo Junto (.mp4) listo para WhatsApp, Celular, TikTok y Reels
  // ============================================================================
  const handleRenderServerMp4 = async () => {
    try {
      setIsRenderingServerMp4(true);
      const targetDuration = Math.min(60, Math.max(4, Math.round(videoDuration || 15)));
      const targetFps = targetDuration > 20 ? 12 : 15;
      setStatusBanner({
        type: 'info',
        text: `Renderizando Video MP4 con Audio + Animación + Subtítulos (${targetDuration}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`,
      });

      const finalHtml = latestEditedHtmlRef.current || htmlCode;
      const audioBase64 = await resolveCurrentAudioBase64();

      const resp = await fetch('/api/studio/video/render-mp4', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          htmlCode: finalHtml,
          audioBase64,
          scriptText: currentAudio?.scriptText || scriptText,
          showSubtitles: showDynamicSubtitles,
          subtitlePosition,
          aspectRatio,
          durationSeconds: targetDuration,
          fps: targetFps,
        }),
      });

      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success || !data.videoBase64) {
        throw new Error(data.error || 'No se pudo renderizar el archivo MP4 en el servidor.');
      }

      const byteChars = window.atob(data.videoBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'video/mp4' });
      saveVideoProjectToLibrary({ mp4Blob: blob });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wappy-studio-reel-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusBanner({
        type: 'success',
        text: `¡Video MP4 Universal (${data.width}x${data.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Error renderizando MP4 en el servidor.',
      });
    } finally {
      setIsRenderingServerMp4(false);
    }
  };

  // ============================================================================
  // OPCIÓN C: CÁPSULA INTERACTIVA HTML5 100% RESPONSIVE (ACADEMIA WAPPY & CELULAR)
  // ============================================================================
  /**
   * Convierte la composición en un HTML 100% autocontenido (Zero-CDN) para que abra
   * directamente desde WhatsApp en Android (content:// / HTML Viewer / Chrome) e iOS (QuickLook),
   * donde los <script src="https://..."> externos suelen bloquearse:
   * 1) Extrae el CSS ya compilado por Tailwind desde el iframe en vivo y lo incrusta en <style>.
   * 2) Incrusta GSAP y el runtime de Tailwind en línea (sin red).
   * 3) Garantiza que la primera escena sea visible aunque el visor bloquee JavaScript.
   */
  const makeHtmlWhatsAppSafe = async (rawHtml: string): Promise<string> => {
    let html = rawHtml;
    const escapeInlineScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');
    const fetchText = async (url: string) => {
      try {
        const r = await fetch(url, { cache: 'force-cache' });
        return r.ok ? await r.text() : '';
      } catch {
        return '';
      }
    };

    // 1) CSS compilado por Tailwind desde el iframe vivo (same-origin)
    let compiledCss = '';
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        Array.from(doc.querySelectorAll('style')).forEach((styleEl) => {
          const id = styleEl.id || '';
          if (id.startsWith('wappy-studio-bridge')) return;
          const txt = styleEl.textContent || '';
          if (txt && !html.includes(txt.slice(0, 120))) compiledCss += `\n${txt}`;
        });
      }
    } catch {
      compiledCss = '';
    }

    const [gsapCode, tailwindCode] = await Promise.all([
      /gsap(\.min)?\.js/i.test(html) ? fetchText('/assets/gsap.min.js') : Promise.resolve(''),
      /cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(html)
        ? fetchText('/assets/tailwind-cdn.js')
        : Promise.resolve(''),
    ]);

    // 2) Reemplazar scripts externos por código en línea (función de reemplazo para no interpretar '$')
    if (gsapCode) {
      html = html.replace(
        /<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,
        () => `<script id="wappy-inline-gsap">${escapeInlineScript(gsapCode)}</script>`,
      );
    }
    html = html.replace(
      /<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,
      () =>
        `<script>window.tailwind = window.tailwind || {};</script>` +
        (tailwindCode
          ? `<script id="wappy-inline-tailwind">${escapeInlineScript(tailwindCode)}</script>`
          : ''),
    );

    // 3) Cabecera móvil + CSS precompilado + fallback de visibilidad sin JavaScript
    const headInjection = `
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${compiledCss.replace(/<\/style/gi, '<\\/style')}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${headInjection}`);
    } else {
      html = `${headInjection}\n${html}`;
    }
    if (!/<meta[^>]+name=["']viewport/i.test(html)) {
      html = html.replace(
        /<head[^>]*>/i,
        (m) => `${m}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      );
    }

    // Guardia: si GSAP no llega a cargarse, mostrar la primera escena en vez de pantalla negra
    const visibilityGuard = `<script id="wappy-visibility-guard">
(function(){
  function reveal(){
    if (window.gsap) return;
    var sel = ['#header-hud','#top-bar','#scene-1','#hero-card'];
    sel.forEach(function(s){
      var el = document.querySelector(s);
      if (!el) return;
      el.style.opacity = '1'; el.style.transform = 'none';
      el.classList && el.classList.remove('opacity-0');
      Array.prototype.forEach.call(el.querySelectorAll('.opacity-0'), function(c){ c.style.opacity='1'; c.style.transform='none'; });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.metric-item'), function(c){ c.style.opacity='1'; });
  }
  window.addEventListener('load', function(){ setTimeout(reveal, 600); });
})();
</script>`;
    html = html.includes('</body>')
      ? html.replace('</body>', () => `${visibilityGuard}\n</body>`)
      : `${html}\n${visibilityGuard}`;
    return html;
  };

  const buildStandaloneAcademyCapsuleHtml = async (): Promise<string> => {
    const baseHtml = await makeHtmlWhatsAppSafe(latestEditedHtmlRef.current || htmlCode);
    const audioBase64 = await resolveCurrentAudioBase64();
    const audioDataUri = audioBase64 ? `data:audio/wav;base64,${audioBase64}` : '';
    const dur = Math.max(4, Math.round((videoDuration || 20) * 10) / 10);

    const capsulePlayerInjection = `
<!-- WAPPY ACADEMIA (LMS) & MOBILE RESPONSIVE CAPSULE PLAYER -->
<style id="wappy-academy-capsule-styles">
  html, body {
    width: 100% !important;
    height: 100dvh !important;
    min-height: -webkit-fill-available !important;
    max-width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  /* Ocultar subtítulo duplicado interno del HTML para que solo se vea el subtítulo palabra a palabra sincronizado */
  ${showDynamicSubtitles && cleanSubtitleWords.length > 0 ? '#subtitle-footer, #subtitle-card { display: none !important; }' : ''}
  #stage {
    padding-bottom: 112px !important;
    transform-origin: top center !important;
  }
  @media (max-height: 740px), (max-width: 480px) {
    #stage {
      padding: 12px 14px 108px 14px !important;
    }
    #stage h1 {
      font-size: clamp(1.25rem, 5vw, 1.65rem) !important;
      line-height: 1.15 !important;
    }
    #stage h2 {
      font-size: clamp(1rem, 4.2vw, 1.35rem) !important;
    }
  }
  #wappy-capsule-subtitles {
    position: fixed;
    left: 12px;
    right: 12px;
    z-index: 9990;
    display: flex;
    justify-content: center;
    pointer-events: none;
    ${
      subtitlePosition === 'top'
        ? 'top: 54px;'
        : subtitlePosition === 'center'
          ? 'top: 50%; transform: translateY(-50%);'
          : 'bottom: 58px;'
    }
  }
  #wappy-capsule-controls {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: max(8px, env(safe-area-inset-bottom, 8px));
    max-width: 540px;
    margin: 0 auto;
    z-index: 9995;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 14px;
    background: rgba(8, 15, 26, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(45, 212, 191, 0.28);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,0.65);
  }
  #wappy-capsule-controls button {
    background: #0d9488;
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 6px 11px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }
  #wappy-capsule-controls button.secondary {
    background: rgba(255,255,255,0.12);
  }
  #wappy-capsule-controls input[type="range"] {
    flex: 1;
    min-width: 60px;
    accent-color: #14b8a6;
    cursor: pointer;
    height: 5px;
  }
  #wappy-mobile-tap-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(4, 10, 18, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  #wappy-mobile-tap-btn {
    background: linear-gradient(135deg, #0d9488, #10b981);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 14px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 800;
    box-shadow: 0 20px 45px rgba(13, 148, 136, 0.45);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>
${audioDataUri ? `<audio id="wappy-capsule-audio" src="${audioDataUri}" preload="auto" playsinline></audio>` : ''}
<div id="wappy-mobile-tap-overlay">
  <button type="button" id="wappy-mobile-tap-btn">🔊 Tocar para Reproducir Cápsula con Voz</button>
</div>
<div id="wappy-capsule-subtitles" style="display:${showDynamicSubtitles && cleanSubtitleWords.length > 0 ? 'flex' : 'none'};">
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.9);backdrop-filter:blur(10px);border:1px solid rgba(45,212,191,0.35);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
</div>
<div id="wappy-capsule-controls">
  <button type="button" id="wappy-btn-play">⏸ Pausar</button>
  <button type="button" id="wappy-btn-restart" class="secondary" title="Reiniciar">↺</button>
  <input type="range" id="wappy-seek" min="0" max="${dur}" step="0.1" value="0" />
  <span id="wappy-time-label" style="font-size:10px;font-family:monospace;font-weight:700;color:#cbd5e1;white-space:nowrap;">0.0s / ${dur}s</span>
</div>
<script id="wappy-academy-capsule-runtime">
(function() {
  var words = ${JSON.stringify(cleanSubtitleWords)};
  var showSubs = ${Boolean(showDynamicSubtitles && cleanSubtitleWords.length > 0)};
  var duration = ${dur};
  var currentTime = 0;
  var playing = true;
  var audioEl = document.getElementById('wappy-capsule-audio');
  var btnPlay = document.getElementById('wappy-btn-play');
  var btnRestart = document.getElementById('wappy-btn-restart');
  var seekEl = document.getElementById('wappy-seek');
  var timeLabel = document.getElementById('wappy-time-label');
  var subBox = document.getElementById('wappy-capsule-sub-box');
  var tapOverlay = document.getElementById('wappy-mobile-tap-overlay');
  var tapBtn = document.getElementById('wappy-mobile-tap-btn');

  // Auto-escala responsiva para pantallas móviles pequeñas (evita cortes verticales u horizontales)
  function fitMobileCapsule() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    stage.style.transform = 'none';
    var vh = window.innerHeight || document.documentElement.clientHeight || 700;
    var sh = stage.scrollHeight || stage.offsetHeight || vh;
    if (sh > vh && vh > 240) {
      var scale = Math.max(0.72, Math.min(1, (vh - 16) / sh));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
    }
  }
  window.addEventListener('resize', fitMobileCapsule);
  window.addEventListener('orientationchange', function() { setTimeout(fitMobileCapsule, 150); });
  setTimeout(fitMobileCapsule, 120);

  function renderSubtitles(t) {
    if (!showSubs || !subBox || !words.length) return;
    var p = Math.max(0, Math.min(0.999, t / Math.max(1, duration)));
    var activeIdx = Math.floor(p * words.length);
    var winSize = 5;
    var winStart = Math.floor(activeIdx / winSize) * winSize;
    var slice = words.slice(winStart, winStart + winSize);
    var activeOffset = activeIdx - winStart;
    subBox.innerHTML = slice.map(function(w, i) {
      if (i === activeOffset) {
        return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:900;text-transform:uppercase;color:#fcd34d;background:rgba(20,184,166,0.32);padding:2px 6px;border-radius:6px;border:1px solid rgba(45,212,191,0.55);">' + w + '</span>';
      }
      return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.94);">' + w + '</span>';
    }).join(' ');
  }

  function updateUi(t) {
    currentTime = t;
    if (seekEl) seekEl.value = String(t);
    if (timeLabel) timeLabel.textContent = t.toFixed(1) + 's / ' + duration.toFixed(1) + 's';
    renderSubtitles(t);
  }

  function stopMasterTimeline() {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.mainTimeline && typeof window.mainTimeline.pause === 'function') {
        window.mainTimeline.pause();
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.pause();
      }
    } catch (e) {}
  }

  function playMasterTimeline(fromStart) {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.play();
      }
      if (window.mainTimeline) {
        if (fromStart) window.mainTimeline.restart();
        else window.mainTimeline.play();
      }
    } catch (e) {}
  }

  function startCapsuleWithSound() {
    if (tapOverlay) tapOverlay.style.display = 'none';
    playing = true;
    if (btnPlay) btnPlay.textContent = '⏸ Pausar';
    playMasterTimeline(true);
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(function(){});
    }
    updateUi(0);
  }

  if (tapBtn) tapBtn.addEventListener('click', startCapsuleWithSound);
  if (tapOverlay) tapOverlay.addEventListener('click', startCapsuleWithSound);

  // Desactivar repeat: -1 en cualquier timeline existente al cargar
  window.addEventListener('load', function() {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
    } catch (e) {}
  });

  if (audioEl) {
    audioEl.addEventListener('loadedmetadata', function() {
      if (audioEl.duration && !isNaN(audioEl.duration)) {
        duration = audioEl.duration;
        if (seekEl) seekEl.max = String(duration);
      }
    });
    audioEl.addEventListener('timeupdate', function() {
      updateUi(audioEl.currentTime);
    });
    audioEl.addEventListener('ended', function() {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
    });
    audioEl.play().catch(function() {
      // En celulares (iOS/Android), el navegador pide 1 toque para activar el sonido
      playing = false;
      stopMasterTimeline();
      if (btnPlay) btnPlay.textContent = '▶ Play';
      if (tapOverlay) tapOverlay.style.display = 'flex';
    });
  }

  setInterval(function() {
    if (!playing) return;
    if (audioEl && !audioEl.paused) return;
    var next = currentTime + 0.2;
    if (next >= duration) {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
      return;
    }
    updateUi(next);
  }, 200);

  if (btnPlay) {
    btnPlay.addEventListener('click', function() {
      if (tapOverlay) tapOverlay.style.display = 'none';
      // Si ya había terminado, al darle Play vuelve a empezar desde 0.0s con el audio y la animación unidos
      if (!playing && (currentTime >= duration - 0.3 || (audioEl && audioEl.ended))) {
        startCapsuleWithSound();
        return;
      }
      playing = !playing;
      btnPlay.textContent = playing ? '⏸ Pausar' : '▶ Play';
      if (playing) {
        playMasterTimeline(false);
        if (audioEl) audioEl.play().catch(function(){});
      } else {
        stopMasterTimeline();
        if (audioEl) audioEl.pause();
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', startCapsuleWithSound);
  }

  if (seekEl) {
    seekEl.addEventListener('input', function(e) {
      var val = parseFloat(e.target.value) || 0;
      updateUi(val);
      if (audioEl) audioEl.currentTime = val;
      if (window.mainTimeline) {
        var tlDur = window.mainTimeline.duration() || duration;
        window.mainTimeline.time(val % tlDur);
      }
    });
  }

  renderSubtitles(0);
})();
</script>`;

    return baseHtml.includes('</body>')
      ? baseHtml.replace('</body>', () => `${capsulePlayerInjection}\n</body>`)
      : `${baseHtml}\n${capsulePlayerInjection}`;
  };

  /**
   * Guarda el video (composición HTML + locución + MP4/cápsula si existen) en la Biblioteca.
   * Si es la misma composición con el mismo audio, actualiza el registro existente en vez de duplicarlo.
   */
  const lastVideoProjectRef = useRef<{ id: string; signature: string } | null>(null);
  const saveVideoProjectToLibrary = async (
    extra: { mp4Blob?: Blob; capsuleHtml?: string } = {},
    silent = true,
  ) => {
    try {
      const html = latestEditedHtmlRef.current || htmlCode;
      const audioRef = currentAudio?.mediaKey || activeStageAudioSrc || 'sin-audio';
      const signature = `${html.length}:${html.slice(-200)}:${audioRef}:${aspectRatio}`;
      const reuse =
        lastVideoProjectRef.current?.signature === signature &&
        libraryItems.some((x) => x.id === lastVideoProjectRef.current?.id);
      const id = reuse ? (lastVideoProjectRef.current as { id: string }).id : `video-${Date.now()}`;

      const htmlKey = `html-${id}`;
      await putMediaBlob(htmlKey, new Blob([html], { type: 'text/html' }));

      // Audio: reutilizar el de la biblioteca o guardar una copia
      let mediaKey = currentAudio?.mediaKey;
      if (!mediaKey && activeStageAudioSrc) {
        const b64 = await resolveCurrentAudioBase64();
        if (b64) {
          mediaKey = `audio-${id}`;
          await putMediaBlob(mediaKey, base64ToBlob(b64));
        }
      }

      let mp4Key: string | undefined;
      if (extra.mp4Blob) {
        mp4Key = `mp4-${id}`;
        await putMediaBlob(mp4Key, extra.mp4Blob);
      }
      let capsuleKey: string | undefined;
      if (extra.capsuleHtml) {
        capsuleKey = `capsule-${id}`;
        await putMediaBlob(capsuleKey, new Blob([extra.capsuleHtml], { type: 'text/html' }));
      }

      const titleSource = (currentAudio?.scriptText || scriptText || headlineOverlayText || '')
        .replace(/<[^>]+>/g, '')
        .trim();
      setLibraryItems((prev) => {
        const existing = prev.find((x) => x.id === id);
        const item: LibraryItem = {
          ...(existing || {}),
          id,
          kind: 'video',
          title: existing?.title || `Video ${aspectRatio}: ${titleSource.slice(0, 40)}...`,
          createdAt: existing?.createdAt || Date.now(),
          voiceName: currentAudio?.voiceName || selectedVoice,
          model: selectedAiModel,
          durationSeconds: Math.round((videoDuration || 0) * 10) / 10,
          wordCount: titleSource.split(/\s+/).filter(Boolean).length,
          scriptText: currentAudio?.scriptText || scriptText,
          htmlKey,
          mediaKey: mediaKey || existing?.mediaKey,
          mp4Key: mp4Key || existing?.mp4Key,
          capsuleKey: capsuleKey || existing?.capsuleKey,
          aspectRatio,
          showSubtitles: showDynamicSubtitles,
          subtitlePosition,
        };
        return [item, ...prev.filter((x) => x.id !== id)];
      });
      lastVideoProjectRef.current = { id, signature };
      if (!silent) {
        setStatusBanner({
          type: 'success',
          text: '¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras.',
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: `No se pudo guardar el video en la Biblioteca: ${err?.message || 'error de almacenamiento'}`,
      });
    }
  };

  /** Reabre un video guardado en el Compositor (HTML + voz + formato). */
  const openLibraryVideo = async (item: LibraryItem) => {
    const htmlBlob = item.htmlKey ? await getMediaBlob(item.htmlKey) : null;
    if (!htmlBlob) {
      setStatusBanner({ type: 'error', text: 'No se encontró la composición HTML de este video.' });
      return;
    }
    const html = await htmlBlob.text();
    if (item.aspectRatio) setAspectRatio(item.aspectRatio);
    if (typeof item.showSubtitles === 'boolean') setShowDynamicSubtitles(item.showSubtitles);
    if (item.subtitlePosition) setSubtitlePosition(item.subtitlePosition);
    latestEditedHtmlRef.current = '';
    setHtmlCode(html);
    const audioBlob = item.mediaKey ? await getMediaBlob(item.mediaKey) : null;
    if (audioBlob) {
      setCurrentAudio({
        url: setObjectUrlForPlayer(audioBlob),
        title: item.title,
        durationSeconds: item.durationSeconds,
        voiceName: item.voiceName,
        scriptText: item.scriptText,
        mediaKey: item.mediaKey,
      });
    }
    if (item.durationSeconds && item.durationSeconds > 1) setVideoDuration(item.durationSeconds);
    setVideoCurrentTime(0);
    setIsVideoPlaying(false);
    lastVideoProjectRef.current = null;
    handleTabChange('video');
  };

  const handleDownloadHtmlBundle = async () => {
    try {
      setIsBuildingAcademyHtml(true);
      const standaloneHtml = await buildStandaloneAcademyCapsuleHtml();
      saveVideoProjectToLibrary({ capsuleHtml: standaloneHtml });
      const fileName = `wappy-academia-capsula-${Date.now()}.html`;
      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });

      // En celular: abrir hoja nativa de compartir (WhatsApp) con el archivo .html adjunto
      const isTouchDevice =
        typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
      if (isTouchDevice && typeof navigator.share === 'function') {
        try {
          const file = new File([blob], fileName, { type: 'text/html' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Cápsula WAPPY',
              text: 'Cápsula interactiva WAPPY (ábrela tocando el archivo).',
            });
            setStatusBanner({
              type: 'success',
              text: '¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp.',
            });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusBanner({
        type: 'success',
        text: '¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet.',
      });
    } finally {
      setIsBuildingAcademyHtml(false);
    }
  };

  const handleCopyLmsEmbed = async () => {
    try {
      setIsBuildingAcademyHtml(true);
      const standaloneHtml = await buildStandaloneAcademyCapsuleHtml();
      const escapedSrcDoc = standaloneHtml
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
      const iframeSnippet = `<iframe srcdoc="${escapedSrcDoc}" style="width:100%;max-width:${aspectRatio === '9:16' ? '400px' : '860px'};aspect-ratio:${aspectRatio === '9:16' ? '9/16' : '16/9'};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;
      await navigator.clipboard.writeText(iframeSnippet);
      setStatusBanner({
        type: 'success',
        text: '¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS).',
      });
    } catch {
      setStatusBanner({
        type: 'error',
        text: 'No se pudo copiar el código embebido al portapapeles.',
      });
    } finally {
      setIsBuildingAcademyHtml(false);
    }
  };

  const activeVoicesCount = activeModelObj?.supportedVoices?.length || 14;

  if (user && user.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-secondary/30 min-h-screen p-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto">
            <Clapperboard className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-text-primary">
            WAPPY Studio (Acceso Administrador)
          </h2>
          <p className="text-xs text-text-secondary">
            Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY.
          </p>
          <a
            href="/c/new"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-16">
      {/* ==================================================================== */}
      {/* CABECERA MAESTRA WAPPY STUDIO (100% WAPPY DESIGN SYSTEM)              */}
      {/* ==================================================================== */}
      <header className="bg-white dark:bg-gray-900 border-b border-border-medium/40 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Izquierda: Botón Sidebar + Badge + Título */}
          <div className="flex items-start sm:items-center gap-3">
            {isAuthenticated && !navVisible && (
              <div className="hidden md:block">
                <OpenSidebar setNavVisible={setNavVisible} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-teal-500" />
                  Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400">
                <Clapperboard className="w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0" />
                WAPPY Studio
              </h1>
              <p className="text-xs text-text-secondary mt-0.5 hidden sm:block">
                Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos.
              </p>
            </div>
          </div>

          {/* Derecha: Cápsula de Pestañas (SGSSTToolbar style) + Botones Expandibles (14 Grupos) */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap">
            {/* Botonera Flotante Cápsula / Isla */}
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar min-w-0">
              <button
                type="button"
                onClick={() => handleTabChange('tts')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === 'tts'
                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800',
                )}
              >
                <MicVocal className="w-3.5 h-3.5 text-teal-500" />
                <span>Estudio de Voz (TTS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('video')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === 'video'
                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800',
                )}
              >
                <Film className="w-3.5 h-3.5 text-purple-500" />
                <span>Video HTML & Capas</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('lab')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === 'lab'
                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800',
                )}
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Voces & Bursts</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('library')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === 'library'
                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800',
                )}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Biblioteca ({libraryItems.length})</span>
              </button>
            </div>

            {/* Botones Auto-Expansibles WAPPY (14 Grupos Semánticos, sin flex-wrap para evitar titileo) */}
            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
              <ModelSelector
                selectedModel={selectedAiModel}
                onSelectModel={setSelectedAiModel}
                disabled={isGeneratingHtmlAi}
              />

              <ExpandableButton
                icon={isTestingConnection ? <Loader2 className="animate-spin" /> : <Zap />}
                label="Probar Audio con IA"
                variant="purple"
                disabled={isTestingConnection}
                onClick={handleTestConnection}
              />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner de Estado */}
        {statusBanner && (
          <div
            className={cn(
              'p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200',
              statusBanner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : statusBanner.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200',
            )}
          >
            <div className="flex items-center gap-2.5">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : statusBanner.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-sky-500 animate-spin shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Reproductor Maestro de Audio (Visible siempre que haya un audio cargado) */}
        {currentAudio && (
          <StudioAudioPlayer
            audioBase64={currentAudio.base64}
            audioUrl={currentAudio.url}
            title={currentAudio.title}
            durationSeconds={currentAudio.durationSeconds}
            voiceName={currentAudio.voiceName}
            onSendToVideo={() => {
              handleTabChange('video');
              setStatusBanner({
                type: 'success',
                text: 'Audio vinculado automáticamente a la pista de locución del Compositor de Video.',
              });
            }}
          />
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 1: ESTUDIO DE VOZ (GEMINI 3.8 FLASH TTS HASTA 60 MIN)        */}
        {/* ==================================================================== */}
        {activeTab === 'tts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Monitor de Trabajo Asíncrono de Larga Duración */}
            {activeJob && (
              <AsyncJobMonitorCard
                job={activeJob}
                onPause={() => handleControlJob('pause')}
                onResume={() => handleControlJob('resume')}
                onCancel={() => handleControlJob('cancel')}
                onPlayChunk={(chunk) => {
                  if (chunk.audioBase64) {
                    setCurrentAudio({
                      base64: chunk.audioBase64,
                      title: `Fragmento #${chunk.index + 1} (${chunk.durationSeconds || 0}s)`,
                      durationSeconds: chunk.durationSeconds,
                      voiceName: selectedVoice,
                    });
                  }
                }}
                onLoadMaster={() => {
                  if (activeJob.downloadUrl) {
                    setCurrentAudio({
                      url: activeJob.downloadUrl,
                      title: `Master Completo (${selectedVoice})`,
                      durationSeconds: activeJob.generatedTotalSeconds,
                      voiceName: selectedVoice,
                      scriptText,
                    });
                  }
                }}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUMNA IZQUIERDA (5 cols): Modelos, Presets, Modo Diálogo y Catálogo de 14 Voces */}
              <div className="lg:col-span-5 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                {/* 1. Selector de Modelo Gemini TTS */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-teal-500" />
                      Modelo Oficial Gemini TTS
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Verificado en AI Studio
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {models.map((m) => {
                      const isSelected = selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.id);
                            if (!m.supportedVoices.includes(selectedVoice)) {
                              setSelectedVoice(m.supportedVoices[0] || 'Kore');
                            }
                          }}
                          className={cn(
                            'text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer',
                            isSelected
                              ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs'
                              : 'bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400',
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="text-xs font-extrabold text-text-primary">
                                {m.name}
                              </span>
                              <span
                                className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0',
                                  m.badgeColor,
                                )}
                              >
                                {m.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary leading-snug">
                              {m.description}
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {m.rateLimitLabel || m.quotaLabel}
                            </span>
                            {isSelected ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Activo ({m.supportedVoices.length} voces)
                              </span>
                            ) : (
                              <span className="text-text-secondary">
                                {m.supportedVoices.length} voces
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Barra de voces activas para el modelo seleccionado */}
                  <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>
                        Voces activas para{' '}
                        <strong className="text-text-primary">{activeModelObj?.name}</strong>:
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {activeVoicesCount} de {voices.length} disponibles
                      </span>
                      {activeVoicesCount < voices.length && (
                        <button
                          type="button"
                          onClick={() => setSelectedModel('gemini-3.8-flash-tts')}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer"
                        >
                          Mostrar todas ({voices.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Plantillas Rápidas de Estilo */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-text-primary">
                    Estilos y Plantillas Rápidas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          if (!isVoiceSupported(preset.voiceName)) {
                            setSelectedModel('gemini-3.8-flash-tts');
                          }
                          if (preset.multiSpeaker) {
                            setMultiSpeaker(true);
                            if (preset.speaker1) setSpeaker1Voice(preset.speaker1.voiceName);
                            if (preset.speaker2) setSpeaker2Voice(preset.speaker2.voiceName);
                          } else {
                            setMultiSpeaker(false);
                            setSelectedVoice(preset.voiceName);
                          }
                          setStylePrompt(preset.style);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 hover:border-teal-500/50 hover:bg-teal-500/10 text-text-primary font-semibold transition cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Modo Diálogo / Screenplay (2 Voces) */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 gap-3">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-teal-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        Modo Diálogo / Podcast (2 Voces)
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        Alterna interlocutores usando{' '}
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          Alex:
                        </span>{' '}
                        y{' '}
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          Sam:
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMultiSpeaker(!multiSpeaker)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      multiSpeaker ? 'bg-teal-600' : 'bg-slate-300 dark:bg-zinc-700',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                        multiSpeaker ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                {multiSpeaker ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                    <div>
                      <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">
                        Voz para Alex (Hablante 1)
                      </label>
                      <select
                        value={speaker1Voice}
                        onChange={(e) => setSpeaker1Voice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500"
                      >
                        {(activeModelObj?.supportedVoices || []).map((vId) => {
                          const vObj = voices.find((v) => v.id === vId);
                          return (
                            <option key={vId} value={vId}>
                              {vId} ({vObj?.gender || 'Voz'} - {vObj?.tone || 'Natural'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                        Voz para Sam (Hablante 2)
                      </label>
                      <select
                        value={speaker2Voice}
                        onChange={(e) => setSpeaker2Voice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500"
                      >
                        {(activeModelObj?.supportedVoices || []).map((vId) => {
                          const vObj = voices.find((v) => v.id === vId);
                          return (
                            <option key={vId} value={vId}>
                              {vId} ({vObj?.gender || 'Voz'} - {vObj?.tone || 'Natural'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* 4. Catálogo de 14 Voces en Rejilla de 3 Columnas con Audición en Vivo */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          <MicVocal className="w-3.5 h-3.5 text-teal-500" />
                          Catálogo de Voces ({activeVoicesCount} activas / {voices.length} totales)
                        </label>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Las voces no compatibles con la versión seleccionada quedan desactivadas.
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setVoiceActiveFilter('only_active')}
                          className={cn(
                            'px-2 py-0.5 rounded-md transition cursor-pointer',
                            voiceActiveFilter === 'only_active'
                              ? 'bg-teal-600 text-white font-bold'
                              : 'text-text-secondary hover:text-text-primary',
                          )}
                        >
                          Solo Activas ({activeVoicesCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceActiveFilter('all')}
                          className={cn(
                            'px-2 py-0.5 rounded-md transition cursor-pointer',
                            voiceActiveFilter === 'all'
                              ? 'bg-teal-600 text-white font-bold'
                              : 'text-text-secondary hover:text-text-primary',
                          )}
                        >
                          Todas ({voices.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={voiceSearchQuery}
                          onChange={(e) => setVoiceSearchQuery(e.target.value)}
                          placeholder="Buscar voz (Kore, Orus, profunda, podcast...)"
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] shrink-0">
                        {(['all', 'Femenino', 'Masculino'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setVoiceGenderFilter(g)}
                            className={cn(
                              'px-2 py-1 rounded-lg transition cursor-pointer',
                              voiceGenderFilter === g
                                ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
                                : 'text-text-secondary hover:text-text-primary',
                            )}
                          >
                            {g === 'all' ? 'Todas' : g === 'Femenino' ? 'Femeninas' : 'Masculinas'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredVoices.map((v) => {
                        const isSelected = selectedVoice === v.id;
                        const isAuditioning = auditioningVoiceId === v.id;
                        const supported = isVoiceSupported(v.id);
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              if (!supported) setSelectedModel('gemini-3.8-flash-tts');
                              setSelectedVoice(v.id);
                            }}
                            className={cn(
                              'p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer',
                              isSelected
                                ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs'
                                : 'bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400',
                              !supported && 'opacity-60',
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-sm font-extrabold text-text-primary">
                                  {v.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleAuditionVoice(v.id, e)}
                                  disabled={isAuditioning}
                                  title="Escuchar muestra de esta voz"
                                  className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer"
                                >
                                  {isAuditioning ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-1 flex-wrap mt-1">
                                <span className="text-[9px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {v.gender}
                                </span>
                                {supported ? (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                    ✓ Activa
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                    Solo 3.8/3.1
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1 leading-tight">
                                {v.tone}
                              </p>

                              {v.tag && (
                                <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                  {v.tag}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2 leading-tight">
                              {v.recommendedFor}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Directiva de Estilo y Emoción */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                      Directiva de Estilo y Emoción
                    </label>
                    <span className="text-[10px] font-mono text-text-secondary">
                      speechMetadata.style
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Ej: Voz cálida, pausada y reflexiva de narrador de documentales..."
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* 6. Configuración Avanzada de Segmentación (Chunking para 1 Hora) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedChunking(!showAdvancedChunking)}
                    className="flex items-center justify-between w-full text-xs text-text-secondary hover:text-text-primary font-bold py-1 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-teal-500" />
                      Configuración Avanzada de Segmentación (Chunking)
                    </span>
                    <span>{showAdvancedChunking ? '▲' : '▼'}</span>
                  </button>
                  {showAdvancedChunking && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Palabras por fragmento</span>
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {wordsPerChunk} palabras
                        </span>
                      </div>
                      <input
                        type="range"
                        min={80}
                        max={250}
                        step={10}
                        value={wordsPerChunk}
                        onChange={(e) => setWordsPerChunk(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"
                      />
                      <p className="text-[10px] text-text-secondary">
                        Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua para audiolibros de hasta 60 minutos.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA (7 cols): Editor de Guion, Vocal Bursts y Despacho */}
              <div className="lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                {/* Cabecera del Editor + Selector de Plantilla */}
                <div className="flex items-center justify-between gap-3 flex-nowrap">
                  <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2 shrink-0">
                    <MicVocal className="w-4 h-4 text-teal-500" />
                    Texto a Sintetizar
                  </h2>

                  <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                    <span className="text-xs text-text-secondary hidden sm:inline">
                      Cargar ejemplo:
                    </span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const found = SCRIPT_TEMPLATES.find((t) => t.title === e.target.value);
                        if (found) setScriptText(found.text);
                        e.target.value = '';
                      }}
                      className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-primary text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
                    >
                      <option value="" disabled>
                        Seleccionar texto de muestra...
                      </option>
                      {SCRIPT_TEMPLATES.map((tpl) => (
                        <option key={tpl.title} value={tpl.title}>
                          {tpl.title}
                        </option>
                      ))}
                    </select>

                    {scriptText && (
                      <ExpandableButton
                        size="sm"
                        icon={<Trash2 />}
                        label="Limpiar"
                        variant="danger"
                        onClick={() => setScriptText('')}
                      />
                    )}
                  </div>
                </div>

                {/* Barra de Inserción Rápida de Vocal Bursts y Hablantes */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-text-secondary flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Insertar Efectos Vocales (Vocal Bursts) en el cursor:
                    </span>
                    <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                      {selectedModel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vocalBursts.map((b) => (
                      <button
                        key={b.tag}
                        type="button"
                        onClick={() => insertTagIntoEditor(` ${b.tag} `)}
                        title={b.description}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-500/10 border border-slate-200 dark:border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                      >
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {b.tag}
                        </span>
                        <span className="text-text-secondary text-[10px] font-sans">
                          ({b.label})
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => insertTagIntoEditor('\nAlex: ')}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Alex:
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTagIntoEditor('\nSam: ')}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Sam:
                    </button>
                  </div>
                </div>

                {/* Área de Texto Principal */}
                <textarea
                  id="wappy-studio-tts-editor"
                  rows={12}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora..."
                  className="w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[260px]"
                />

                {/* Barra de Métricas y Estimación */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span>
                        Palabras:{' '}
                        <strong className="text-text-primary font-mono">{wordCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Caracteres:{' '}
                        <strong className="text-text-primary font-mono">{charCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Fragmentos estimados:{' '}
                        <strong className="text-teal-600 dark:text-teal-400 font-mono">
                          {chunkCount}
                        </strong>
                      </span>
                    </div>
                    <div className="text-text-primary font-semibold">
                      Duración estimada:{' '}
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">
                        ~{estimatedMinutes} min
                      </strong>{' '}
                      / 60 min máx
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(2, Math.round((estimatedMinutes / 60) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Botones de Acción Principales */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSynthesizePreview}
                    disabled={
                      isPreviewing || activeJob?.status === 'processing' || !scriptText.trim()
                    }
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Vista Previa Rápida (~1er fragmento)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartFullJob}
                    disabled={
                      activeJob?.status === 'processing' || isPreviewing || !scriptText.trim()
                    }
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {activeJob?.status === 'processing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                    <span>
                      {chunkCount > 1
                        ? `Generar Audio Completo (${chunkCount} fragmentos • ~${estimatedMinutes} min)`
                        : 'Generar Audio Completo'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 2: COMPOSITOR DE VIDEO HTML & CAPAS (ESTILO CLAUDE)          */}
        {/* ==================================================================== */}
        {activeTab === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* COLUMNA IZQUIERDA (6 cols): Capas de Video, Audio, Subtítulos e IA HTML */}
            <div className="lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                    <Film className="w-5 h-5 text-purple-500" />
                    Estudio de Capas & Motion Graphics HTML
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz.
                  </p>
                </div>
              </div>

              {/* 1. Formato del Video (9:16 vs 16:9) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio('9:16');
                    handleRebuildDefaultTemplate('9:16', Boolean(baseVideoUrl), selectedSceneTemplate);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left transition cursor-pointer',
                    aspectRatio === '9:16'
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
                  )}
                >
                  <div className="text-xs font-extrabold text-text-primary">
                    📱 Vertical 9:16 (Reels / TikTok)
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    1080 × 1920 px • Ideal para redes y WhatsApp
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio('16:9');
                    handleRebuildDefaultTemplate('16:9', Boolean(baseVideoUrl), selectedSceneTemplate);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left transition cursor-pointer',
                    aspectRatio === '16:9'
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
                  )}
                >
                  <div className="text-xs font-extrabold text-text-primary">
                    🖥️ Horizontal 16:9 (YouTube / LMS)
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    1920 × 1080 px • Ideal para cursos Academia WAPPY
                  </div>
                </button>
              </div>

              {/* Selector Rápido de Plantillas de Escena Motion Graphics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Plantillas Visuales Instantáneas (HyperFrames)
                  </span>
                  <span className="text-[10px] text-text-secondary">Clic para aplicar</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STUDIO_SCENE_TEMPLATES.map((tpl) => {
                    const isSelected = selectedSceneTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedSceneTemplate(tpl.id);
                          handleRebuildDefaultTemplate(aspectRatio, Boolean(baseVideoUrl), tpl.id);
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition cursor-pointer',
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30'
                            : 'bg-slate-50/70 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-teal-400',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-text-primary truncate">
                            {tpl.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0">
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CAPA 1 y 2: Subir Video Propio y/o Audio Propio */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-500" />
                  Capas Base Multimedia (Video a Cámara + Locución)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Subir Video Base */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-text-primary">
                        1. Tu Video Base (Opcional)
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {baseVideoName
                          ? `Activo: ${baseVideoName}`
                          : 'Sube un MP4/WebM tuyo para montarle capas HTML encima.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Video MP4</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleBaseVideoUpload}
                          className="hidden"
                        />
                      </label>
                      {baseVideoUrl && (
                        <ExpandableButton
                          size="sm"
                          icon={<Trash2 />}
                          label="Quitar"
                          variant="danger"
                          onClick={() => {
                            URL.revokeObjectURL(baseVideoUrl);
                            setBaseVideoUrl(null);
                            setBaseVideoName('');
                            handleRebuildDefaultTemplate(aspectRatio, false);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Pista de Audio / Locución */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-text-primary">
                        2. Audio / Locución Sincronizada
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {customAudioName
                          ? `Archivo: ${customAudioName}`
                          : currentAudio
                            ? `Vinculado: ${currentAudio.title}`
                            : 'Usa el audio del Estudio TTS o sube un WAV/MP3.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Audio WAV/MP3</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleCustomAudioUpload}
                          className="hidden"
                        />
                      </label>
                      {customAudioUrl && (
                        <ExpandableButton
                          size="sm"
                          icon={<Trash2 />}
                          label="Quitar"
                          variant="danger"
                          onClick={() => {
                            URL.revokeObjectURL(customAudioUrl);
                            setCustomAudioUrl(null);
                            setCustomAudioName('');
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Textos Rápidos de Superposición y Subtítulos Estilo Hormozi/Claude */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                    3. Textos de Capa y Subtítulos Dinámicos
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDynamicSubtitles}
                        onChange={(e) => setShowDynamicSubtitles(e.target.checked)}
                        className="rounded accent-teal-600"
                      />
                      Subtítulos
                    </label>
                    {showDynamicSubtitles && (
                      <div className="inline-flex items-center gap-0.5 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px]">
                        {(
                          [
                            { id: 'bottom', label: 'Abajo' },
                            { id: 'center', label: 'Centro' },
                            { id: 'top', label: 'Arriba' },
                          ] as const
                        ).map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setSubtitlePosition(pos.id)}
                            className={cn(
                              'px-1.5 py-0.5 rounded transition cursor-pointer',
                              subtitlePosition === pos.id
                                ? 'bg-teal-600 text-white font-bold'
                                : 'text-text-secondary hover:text-text-primary',
                            )}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                      Insignia Superior (Badge)
                    </label>
                    <input
                      type="text"
                      value={badgeOverlayText}
                      onChange={(e) => setBadgeOverlayText(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                      Color de Acento
                    </label>
                    <div className="flex items-center gap-2">
                      {['#14b8a6', '#10b981', '#6366f1', '#f59e0b', '#f43f5e'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setAccentColor(col)}
                          style={{ backgroundColor: col }}
                          className={cn(
                            'w-6 h-6 rounded-full border-2 transition cursor-pointer',
                            accentColor === col
                              ? 'border-white ring-2 ring-teal-500 scale-110'
                              : 'border-transparent opacity-80',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Titular Principal en Pantalla
                  </label>
                  <input
                    type="text"
                    value={headlineOverlayText}
                    onChange={(e) => setHeadlineOverlayText(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary font-bold"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={subheadlineOverlayText}
                    onChange={(e) => setSubheadlineOverlayText(e.target.value)}
                    placeholder="Subtítulo secundario..."
                    className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"
                  />
                  <ExpandableButton
                    icon={<RefreshCw />}
                    label="Aplicar al Lienzo"
                    variant="cyan"
                    onClick={() =>
                      handleRebuildDefaultTemplate(aspectRatio, Boolean(baseVideoUrl))
                    }
                  />
                </div>
              </div>

              {/* 4. Generador con IA de Motion Graphics HTML/GSAP (Estilo Claude) */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                    Generador IA de Animación HTML + GSAP (Estilo Claude)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {showCodeEditor ? 'Ocultar Código HTML' : 'Editar Código HTML'}
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={aiScenePrompt}
                  onChange={(e) => setAiScenePrompt(e.target.value)}
                  placeholder="Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP..."
                  className="w-full bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-purple-500 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateHtmlWithAi}
                    disabled={isGeneratingHtmlAi}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingHtmlAi ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {isGeneratingHtmlAi
                        ? 'Diseñando Escena HTML + GSAP...'
                        : 'Generar Animación HTML con IA'}
                    </span>
                  </button>
                </div>

                {showCodeEditor && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-mono uppercase text-text-secondary mb-1">
                      Código Fuente HTML5 / Tailwind / GSAP en Vivo:
                    </label>
                    <textarea
                      rows={10}
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      className="w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA (6 cols): Reproductor en Vivo Multi-Capa + Editor Visual + Exportación */}
            <div className="lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]">
              {/* Barra Superior del Lienzo (sin flex-wrap para evitar salto de línea y titileo al expandir botones) */}
              <div className="flex items-center justify-between gap-2 flex-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0',
                      isVisualEditMode
                        ? 'bg-amber-500 animate-ping'
                        : isVideoPlaying
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-400',
                    )}
                  />
                  <h3 className="text-sm font-extrabold text-text-primary truncate">
                    {isVisualEditMode
                      ? `Editor Visual (${aspectRatio})`
                      : `Lienzo Interactivo (${aspectRatio})`}
                  </h3>
                </div>

                {/* Botonera WAPPY (100% ExpandableButton 14-Group Design System, flex-nowrap) */}
                <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                  <ExpandableButton
                    size="sm"
                    icon={
                      isSyncingVoiceToVideo ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <MicVocal />
                      )
                    }
                    label="Sincronizar Voz IA"
                    variant="purple"
                    disabled={isSyncingVoiceToVideo}
                    onClick={handleSyncVoiceToVideo}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Edit3 />}
                    label={isVisualEditMode ? 'Salir de Edición' : 'Editar Lienzo'}
                    variant="orange"
                    isActive={isVisualEditMode}
                    onClick={toggleVisualEditMode}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={isRenderingServerMp4 ? <Loader2 className="animate-spin" /> : <Film />}
                    label="Descargar MP4 (WhatsApp/Celular)"
                    variant="teal"
                    disabled={isRenderingServerMp4}
                    onClick={handleRenderServerMp4}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={isBuildingAcademyHtml ? <Loader2 className="animate-spin" /> : <Download />}
                    label="Cápsula Academia (HTML5)"
                    variant="green"
                    disabled={isBuildingAcademyHtml}
                    onClick={handleDownloadHtmlBundle}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Save />}
                    label="Guardar en Biblioteca"
                    variant="teal"
                    onClick={() => saveVideoProjectToLibrary({}, false)}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Maximize2 />}
                    label="Pantalla Completa"
                    variant="neutral"
                    onClick={toggleStageFullscreen}
                  />
                </div>
              </div>

              {/* Barra de Herramientas Rápidas del Modo Editor Visual */}
              {isVisualEditMode && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveVisualEdits}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      Guardar Cambios
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_ADD_ELEMENT', kind: 'text' },
                          '*',
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-teal-500" />
                      <Type className="w-3 h-3 text-teal-500" />
                      <span>+ Texto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_ADD_ELEMENT', kind: 'card' },
                          '*',
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-500" />
                      <Layers className="w-3 h-3 text-purple-500" />
                      <span>+ Caja / Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_SELECT_PARENT' },
                          '*',
                        )
                      }
                      disabled={!selectedCanvasElement}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer"
                    >
                      Seleccionar Caja Contenedora
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_DUPLICATE_SELECTED' },
                          '*',
                        )
                      }
                      disabled={!selectedCanvasElement}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3 text-indigo-500" />
                      <span>Duplicar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_DELETE_SELECTED' },
                          '*',
                        )
                      }
                      disabled={!selectedCanvasElement}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ESCENARIO MULTI-CAPA (VIDEO BASE + IFRAME HTML/GSAP + SUBTÍTULOS + CONTROLES FULLSCREEN) */}
              <div className="flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]">
                <div
                  ref={stageContainerRef}
                  className={cn(
                    'relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300',
                    isStageFullscreen
                      ? 'w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6'
                      : cn(
                          'rounded-2xl mx-auto flex items-center justify-center',
                          aspectRatio === '9:16'
                            ? 'w-full max-w-[390px] aspect-[9/16] max-h-[660px]'
                            : 'w-full aspect-[16/9] max-h-[660px] min-h-[340px]',
                        ),
                  )}
                >
                  {/* Marco interno centrado que mantiene la proporción exacta en Pantalla Completa sin correrse */}
                  <div
                    className={cn(
                      'relative overflow-hidden bg-slate-950',
                      isStageFullscreen
                        ? aspectRatio === '9:16'
                          ? 'h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto'
                          : 'w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto'
                        : 'w-full h-full',
                    )}
                  >
                    {/* Pista de Audio Oculta para Locución */}
                    {activeStageAudioSrc && (
                      <audio
                        ref={stageAudioRef}
                        src={activeStageAudioSrc}
                        preload="metadata"
                        onTimeUpdate={(e) => {
                          setVideoCurrentTime(e.currentTarget.currentTime);
                        }}
                        onLoadedMetadata={(e) => {
                          if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                            setVideoDuration(e.currentTarget.duration);
                          }
                        }}
                        onEnded={() => {
                          setIsVideoPlaying(false);
                          iframeRef.current?.contentWindow?.postMessage(
                            { type: 'STUDIO_PAUSE' },
                            '*',
                          );
                          baseVideoRef.current?.pause();
                        }}
                      />
                    )}

                    {/* CAPA 1: Video Base Subido por el Usuario (con dimensiones explícitas según modern-web-guidance) */}
                    {baseVideoUrl && (
                      <video
                        ref={baseVideoRef}
                        src={baseVideoUrl}
                        width={aspectRatio === '9:16' ? 1080 : 1920}
                        height={aspectRatio === '9:16' ? 1920 : 1080}
                        muted={muteBaseVideo}
                        playsInline
                        loop
                        preload="metadata"
                        onTimeUpdate={(e) => {
                          if (!activeStageAudioSrc) {
                            setVideoCurrentTime(e.currentTarget.currentTime);
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          if (
                            !activeStageAudioSrc &&
                            e.currentTarget.duration &&
                            !isNaN(e.currentTarget.duration)
                          ) {
                            setVideoDuration(e.currentTarget.duration);
                          }
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    )}

                    {/* CAPA 2: Composición Animada HTML5 + GSAP con Puente Interactivo */}
                    <iframe
                      ref={iframeRef}
                      title="WAPPY Studio HTML Canvas"
                      srcDoc={bridgedHtmlCode}
                      sandbox="allow-scripts allow-same-origin"
                      onLoad={() => {
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_FIT_VIEWPORT' },
                          '*',
                        );
                        if (isVisualEditMode) {
                          iframeRef.current?.contentWindow?.postMessage(
                            { type: 'STUDIO_SET_EDIT_MODE', enabled: true },
                            '*',
                          );
                        } else if (!isVideoPlaying) {
                          iframeRef.current?.contentWindow?.postMessage(
                            { type: 'STUDIO_PAUSE' },
                            '*',
                          );
                        }
                      }}
                      className={cn(
                        'absolute inset-0 w-full h-full border-0 z-10',
                        isVisualEditMode ? 'pointer-events-auto' : 'pointer-events-none',
                      )}
                    />

                    {/* CAPA 3: Subtítulos Dinámicos Sincronizados Palabra a Palabra (Estilo Hormozi / Claude) */}
                    {showDynamicSubtitles && currentSubtitleWindow && (
                      <div
                        className={cn(
                          'absolute inset-x-3 z-20 flex justify-center pointer-events-none',
                          subtitlePosition === 'top'
                            ? 'top-16'
                            : subtitlePosition === 'center'
                              ? 'top-1/2 -translate-y-1/2'
                              : 'bottom-5',
                        )}
                      >
                        <div className="bg-black/85 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]">
                          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                            {currentSubtitleWindow.words.map((word, idx) => {
                              const isActiveWord = idx === currentSubtitleWindow.activeOffset;
                              return (
                                <span
                                  key={`${word}-${idx}`}
                                  className={cn(
                                    'text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150',
                                    isActiveWord
                                      ? 'text-amber-300 scale-110 bg-teal-500/30 px-1.5 py-0.5 rounded-lg border border-teal-400/50'
                                      : 'text-white/90',
                                  )}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BARRA DE CONTROL FLOTANTE EN PANTALLA COMPLETA (PLAY / PAUSE / SEEK / SALIR) */}
                  {isStageFullscreen && (
                    <div className="w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl">
                      <button
                        type="button"
                        onClick={toggleStagePlayback}
                        title={isVideoPlaying ? 'Pausar / Parar' : 'Reproducir'}
                        className="px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                      >
                        {isVideoPlaying ? (
                          <>
                            <Pause className="w-4 h-4 fill-white" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={restartStagePlayback}
                        title="Reiniciar animación"
                        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <input
                        type="range"
                        min={0}
                        max={videoDuration || 20}
                        step={0.1}
                        value={videoCurrentTime}
                        onChange={(e) => handleStageSeek(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />

                      <span className="text-xs font-mono font-bold text-slate-200 shrink-0">
                        {videoCurrentTime.toFixed(1)}s / {(videoDuration || 20).toFixed(1)}s
                      </span>

                      <button
                        type="button"
                        onClick={toggleVisualEditMode}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0',
                          isVisualEditMode
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white',
                        )}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isVisualEditMode ? 'Editando' : 'Editar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleStageFullscreen}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Salir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Controles de Línea de Tiempo del Escenario (Vista Normal) */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleStagePlayback}
                    title={isVideoPlaying ? 'Pausar animación y subtítulos' : 'Reproducir animación y subtítulos'}
                    className="px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                  >
                    {isVideoPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={restartStagePlayback}
                    title="Reiniciar animación"
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 20}
                    step={0.1}
                    value={videoCurrentTime}
                    onChange={(e) => handleStageSeek(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />

                  <span className="text-xs font-mono font-bold text-text-secondary shrink-0">
                    {videoCurrentTime.toFixed(1)}s / {(videoDuration || 20).toFixed(1)}s
                  </span>

                  {baseVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setMuteBaseVideo(!muteBaseVideo)}
                      title={
                        muteBaseVideo
                          ? 'Activar audio del video original'
                          : 'Silenciar video original'
                      }
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer"
                    >
                      {muteBaseVideo ? (
                        <VolumeX className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-teal-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* ============================================================== */}
                {/* PANEL DE EXPORTACIÓN MULTIMODAL (MP4 PARA WHATSAPP Y HTML LMS) */}
                {/* ============================================================== */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* OPCIÓN B: RENDERIZADO MP4 EN SERVIDOR (WHATSAPP / CELULAR / REELS / TIKTOK) */}
                  <button
                    type="button"
                    disabled={isRenderingServerMp4}
                    onClick={handleRenderServerMp4}
                    className="p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20">
                        WhatsApp • Celular • Redes
                      </span>
                      {isRenderingServerMp4 ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Film className="w-4 h-4 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-extrabold leading-tight mt-0.5">
                      {isRenderingServerMp4
                        ? 'Renderizando Video MP4...'
                        : 'Descargar Video .MP4 (Todo Unido)'}
                    </div>
                    <div className="text-[10px] opacity-85 leading-snug">
                      Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels
                    </div>
                  </button>

                  {/* OPCIÓN C: CÁPSULA INTERACTIVA HTML5 RESPONSIVE PARA ACADEMIA WAPPY (LMS) */}
                  <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20">
                        Academia WAPPY • LMS Responsive
                      </span>
                      <BookOpen className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-xs font-extrabold leading-tight">
                      Cápsula Interactiva HTML5 (Móvil & Web)
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        disabled={isBuildingAcademyHtml}
                        onClick={handleDownloadHtmlBundle}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar .HTML</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBuildingAcademyHtml}
                        onClick={handleCopyLmsEmbed}
                        title="Copiar código <iframe srcdoc> para lección de Academia WAPPY"
                        className="py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar LMS</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* INSPECTOR VISUAL DEL ELEMENTO SELECCIONADO EN EL LIENZO */}
              {isVisualEditMode && selectedCanvasElement && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Propiedades del Elemento Seleccionado (&lt;{selectedCanvasElement.tagName}&gt;)
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSelectedCanvasElement({ dx: 0, dy: 0, scale: 1 })}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Restablecer posición
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                      Texto del elemento (edita aquí o con doble clic en el video):
                    </label>
                    <textarea
                      rows={2}
                      value={selectedCanvasElement.text}
                      onChange={(e) => updateSelectedCanvasElement({ text: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1">
                        Tamaño Letra ({selectedCanvasElement.fontSize}px)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedCanvasElement({
                              fontSize: Math.max(10, selectedCanvasElement.fontSize - 2),
                            })
                          }
                          className="flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedCanvasElement({
                              fontSize: Math.min(96, selectedCanvasElement.fontSize + 2),
                            })
                          }
                          className="flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                        >
                          A+
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1">
                        Escala Caja ({selectedCanvasElement.scale}x)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedCanvasElement({
                              scale: Math.max(
                                0.5,
                                Number((selectedCanvasElement.scale - 0.1).toFixed(2)),
                              ),
                            })
                          }
                          className="flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedCanvasElement({
                              scale: Math.min(
                                2.5,
                                Number((selectedCanvasElement.scale + 0.1).toFixed(2)),
                              ),
                            })
                          }
                          className="flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1">
                        Color de Texto
                      </label>
                      <input
                        type="color"
                        value={selectedCanvasElement.color}
                        onChange={(e) => updateSelectedCanvasElement({ color: e.target.value })}
                        className="w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1">
                        Color de Fondo
                      </label>
                      <input
                        type="color"
                        value={selectedCanvasElement.backgroundColor}
                        onChange={(e) =>
                          updateSelectedCanvasElement({ backgroundColor: e.target.value })
                        }
                        className="w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 3: LABORATORIO DE EXPRESIVIDAD & VOCAL BURSTS                */}
        {/* ==================================================================== */}
        {activeTab === 'lab' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tarjeta de Cabecera del Laboratorio */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-text-primary">
                  Laboratorio de Expresividad y Vocal Bursts
                </h2>
                <p className="text-xs text-text-secondary">
                  Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real
                </p>
              </div>
            </div>

            {/* Selector de Modelo en el Laboratorio */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                Modelo en el Laboratorio:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {models.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        if (!m.supportedVoices.includes(selectedVoice)) {
                          setSelectedVoice(m.supportedVoices[0] || 'Kore');
                        }
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer',
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-zinc-900 text-text-secondary border-slate-200 dark:border-zinc-800 hover:border-teal-400',
                      )}
                    >
                      {m.name} ({m.supportedVoices.length} voces)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 1: Efectos Vocales Orgánicos Integrados */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold text-text-primary">
                Efectos Vocales Orgánicos Integrados
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vocalBursts.map((b) => {
                  const isPlayingThis = playingBurstTag === b.tag;
                  return (
                    <div
                      key={b.tag}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                          {b.tag}
                        </span>
                        <p className="text-xs font-bold text-text-primary mt-0.5">{b.label}</p>
                        <p className="text-[11px] text-text-secondary">{b.description}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isPlayingThis}
                        onClick={async () => {
                          try {
                            setPlayingBurstTag(b.tag);
                            const resp = await fetch('/api/studio/tts/synthesize', {
                              method: 'POST',
                              headers: getAuthHeaders(token),
                              body: JSON.stringify({
                                voiceName: selectedVoice,
                                model: 'gemini-3.8-flash-tts',
                                stylePrompt: 'Voz muy expresiva y natural.',
                                text: `Escucha cómo suena este efecto natural en medio de una frase: ${b.tag} ¡Suena totalmente humano!`,
                              }),
                            });
                            const data = await parseStudioJson(resp);
                            if (data.audioBase64) {
                              setCurrentAudio({
                                base64: data.audioBase64,
                                title: `Efecto ${b.tag} (${selectedVoice})`,
                                durationSeconds: data.durationSeconds,
                                voiceName: selectedVoice,
                              });
                            }
                          } catch (err: any) {
                            setStatusBanner({ type: 'error', text: err.message });
                          } finally {
                            setPlayingBurstTag(null);
                          }
                        }}
                        className="w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer"
                      >
                        {isPlayingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: Probador Libre de Prosodia y Dirección de Voz */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-text-primary">
                  Probador Libre de Prosodia y Dirección de Voz
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Voces activas: {activeVoicesCount} de {voices.length}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                  Selecciona la Voz ({activeVoicesCount} activas para {activeModelObj?.name})
                </label>
                <div className="flex flex-wrap gap-2">
                  {voices.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const supported = isVoiceSupported(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          if (!supported) setSelectedModel('gemini-3.8-flash-tts');
                          setSelectedVoice(v.id);
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1',
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-zinc-900 text-text-primary border-slate-200 dark:border-zinc-800 hover:border-teal-400',
                          !supported && 'opacity-55',
                        )}
                      >
                        <span>
                          {v.name} ({v.gender})
                        </span>
                        {supported && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                  Prompt de Dirección (speechMetadata.style)
                </label>
                <input
                  type="text"
                  value={labStylePrompt}
                  onChange={(e) => setLabStylePrompt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                  Texto de Prueba
                </label>
                <textarea
                  rows={3}
                  value={labTestText}
                  onChange={(e) => setLabTestText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSynthesizeInLab}
                  disabled={isSynthesizingLab || !labTestText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSynthesizingLab ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Sintetizar en el Laboratorio</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 4: BIBLIOTECA DE AUDIOS GENERADOS                            */}
        {/* ==================================================================== */}
        {activeTab === 'library' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Biblioteca de Audios y Videos
                </h2>
                <p className="text-xs text-text-secondary">
                  Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar.
                </p>
              </div>
              {libraryItems.length > 0 && (
                <ExpandableButton
                  icon={<Trash2 />}
                  label="Limpiar Historial"
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm('¿Borrar todos los audios y videos guardados?')) return;
                    setLibraryItems([]);
                    clearMediaBlobs();
                  }}
                />
              )}
            </div>

            {libraryItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-2">
                <MicVocal className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-sm font-bold text-text-primary">
                  Aún no hay audios en tu biblioteca
                </p>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-extrabold text-text-primary line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.kind === 'video' && (
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                              🎬 VIDEO {item.aspectRatio || ''}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                            {item.voiceName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                        <span>⏱ {formatDurationBadge(item.durationSeconds)}</span>
                        <span>•</span>
                        <span>{item.wordCount} palabras</span>
                        <span>•</span>
                        <span>{formatLibraryDate(item.createdAt)}</span>
                      </div>
                      {item.stylePrompt && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-[11px] italic text-text-secondary line-clamp-2">
                          "{item.stylePrompt}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        {item.kind === 'video' ? (
                          <ExpandableButton
                            size="sm"
                            icon={<Edit3 />}
                            label="Abrir en Compositor"
                            variant="orange"
                            onClick={() => openLibraryVideo(item)}
                          />
                        ) : (
                          <>
                            <ExpandableButton
                              size="sm"
                              icon={<Play />}
                              label="Reproducir"
                              variant="teal"
                              onClick={() => openLibraryAudio(item)}
                            />
                            <ExpandableButton
                              size="sm"
                              icon={<Film />}
                              label="Usar en Video"
                              variant="purple"
                              onClick={() => openLibraryAudio(item, true)}
                            />
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.kind === 'video' && item.mp4Key && (
                          <ExpandableButton
                            size="sm"
                            icon={<Film />}
                            label="Descargar MP4"
                            variant="green"
                            onClick={async () => {
                              const b = await getMediaBlob(item.mp4Key as string);
                              if (b) downloadBlobFile(b, `wappy-studio-reel-${item.id}.mp4`);
                            }}
                          />
                        )}
                        {item.kind === 'video' && item.capsuleKey && (
                          <ExpandableButton
                            size="sm"
                            icon={<Download />}
                            label="Descargar Cápsula HTML"
                            variant="green"
                            onClick={async () => {
                              const b = await getMediaBlob(item.capsuleKey as string);
                              if (b) downloadBlobFile(b, `wappy-academia-capsula-${item.id}.html`);
                            }}
                          />
                        )}
                        {item.kind !== 'video' && (
                          <ExpandableButton
                            size="sm"
                            icon={<Download />}
                            label="Descargar WAV"
                            variant="green"
                            onClick={async () => {
                              const b = await loadLibraryAudioBlob(item);
                              if (!b) {
                                setStatusBanner({
                                  type: 'error',
                                  text: 'Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo.',
                                });
                                return;
                              }
                              downloadBlobFile(b, `wappy-audio-${item.id}.wav`);
                            }}
                          />
                        )}
                        <ExpandableButton
                          size="sm"
                          icon={<Trash2 />}
                          label="Eliminar"
                          variant="danger"
                          onClick={() => deleteLibraryItem(item)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: REPRODUCTOR DE AUDIO MAESTRO CON ONDA INTERACTIVA
// ============================================================================

function StudioAudioPlayer({
  audioBase64,
  audioUrl,
  title,
  durationSeconds,
  voiceName,
  onSendToVideo,
}: {
  audioBase64?: string;
  audioUrl?: string;
  title: string;
  durationSeconds?: number;
  voiceName?: string;
  onSendToVideo: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);

  const src = audioUrl || (audioBase64 ? `data:audio/wav;base64,${audioBase64}` : '');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (durationSeconds && durationSeconds > 0) setDuration(durationSeconds);
  }, [src, durationSeconds]);

  const togglePlay = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Error al reproducir audio:', e));
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'wappy-tts'}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!src) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <h3 className="text-sm font-extrabold text-text-primary truncate">{title}</h3>
            </div>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              Voz: {voiceName || 'Kore'} • WAV 24kHz Alta Fidelidad ({formatTime(currentTime)} /{' '}
              {formatTime(duration)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const rates = [0.75, 1, 1.25, 1.5, 2];
              const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
              setPlaybackRate(next);
              if (audioRef.current) audioRef.current.playbackRate = next;
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 cursor-pointer"
          >
            {playbackRate}x
          </button>

          <ExpandableButton
            size="sm"
            icon={<Film />}
            label="Llevar al Video"
            variant="purple"
            onClick={onSendToVideo}
          />

          {audioBase64 && (
            <ExpandableButton
              size="sm"
              icon={copied ? <Check /> : <Copy />}
              label={copied ? 'Copiado' : 'Copiar Base64'}
              variant="fuchsia"
              onClick={() => {
                navigator.clipboard.writeText(audioBase64);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
          )}

          <ExpandableButton
            size="sm"
            icon={<Download />}
            label="Descargar WAV"
            variant="green"
            onClick={handleDownload}
          />
        </div>
      </div>

      {/* Visualizador de Onda Interactivo */}
      <div className="flex items-center justify-between gap-1 h-10 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        {Array.from({ length: 44 }).map((_, idx) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const barRatio = idx / 44;
          const isPlayed = barRatio <= progress;
          const baseHeight = 22 + Math.sin(idx * 0.45) * 16 + Math.cos(idx * 0.9) * 12;
          return (
            <div
              key={idx}
              onClick={() => {
                if (audioRef.current && duration > 0) {
                  const target = barRatio * duration;
                  audioRef.current.currentTime = target;
                  setCurrentTime(target);
                }
              }}
              style={{ height: `${Math.max(18, Math.min(95, baseHeight))}%` }}
              className={cn(
                'w-1 rounded-full cursor-pointer transition-all duration-150',
                isPlayed
                  ? 'bg-gradient-to-t from-teal-500 to-emerald-400'
                  : 'bg-slate-300 dark:bg-zinc-800 hover:bg-teal-400/50',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MONITOR DE TRABAJO ASÍNCRONO (HASTA 60 MINUTOS)
// ============================================================================

function AsyncJobMonitorCard({
  job,
  onPause,
  onResume,
  onCancel,
  onPlayChunk,
  onLoadMaster,
}: {
  job: TtsJobState;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onPlayChunk: (c: JobChunk) => void;
  onLoadMaster: () => void;
}) {
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isProcessing = job.status === 'processing';
  const isPaused = job.status === 'paused';

  return (
    <div className="bg-white dark:bg-gray-900 border border-teal-500/40 rounded-2xl p-5 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-text-primary">
              {isCompleted
                ? '¡Audio Maestro de Larga Duración Completado!'
                : isFailed
                  ? 'Error en la Generación'
                  : isPaused
                    ? 'Generación en Pausa'
                    : `Sintetizando fragmento ${job.currentChunkIndex + 1} de ${job.totalChunks}...`}
            </h4>
            <p className="text-xs text-text-secondary">
              Generados {Math.round(job.generatedTotalSeconds)}s de ~{job.estimatedTotalSeconds}s estimados ({job.progressPercent}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isProcessing && (
            <ExpandableButton
              size="sm"
              icon={<Pause />}
              label="Pausar"
              variant="amber"
              onClick={onPause}
            />
          )}
          {isPaused && (
            <ExpandableButton
              size="sm"
              icon={<Play />}
              label="Reanudar"
              variant="teal"
              onClick={onResume}
            />
          )}
          {!isCompleted && !isFailed && (
            <ExpandableButton
              size="sm"
              icon={<X />}
              label="Cancelar"
              variant="danger"
              onClick={onCancel}
            />
          )}
          {isCompleted && (
            <>
              <ExpandableButton
                size="sm"
                icon={<Play />}
                label="Cargar Master"
                variant="teal"
                onClick={onLoadMaster}
              />
              <a
                href={job.downloadUrl || `/api/studio/tts/jobs/${job.id}/download`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar WAV Master</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(2, job.progressPercent))}%` }}
        />
      </div>

      {/* Rejilla de Fragmentos */}
      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 max-h-32 overflow-y-auto">
        {job.chunks.map((c) => {
          const done = c.status === 'completed';
          const busy = c.status === 'processing';
          return (
            <button
              key={c.index}
              type="button"
              disabled={!done}
              onClick={() => onPlayChunk(c)}
              title={`Fragmento #${c.index + 1}`}
              className={cn(
                'h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition',
                done
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer'
                  : busy
                    ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 animate-pulse'
                    : 'bg-slate-200/50 dark:bg-zinc-900 text-text-secondary border-transparent opacity-60',
              )}
            >
              {done ? (
                <Volume2 className="w-3 h-3" />
              ) : busy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                c.index + 1
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
