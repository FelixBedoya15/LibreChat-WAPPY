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
  RotateCw,
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
  Key,
  ExternalLink,
  Terminal,
  Radio,
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
import WappyCassetteWalkmanPlayer from './WappyCassetteWalkmanPlayer';
import WappyApplePodcastsShelf, {
  PodcastShowPreset,
  WAPPY_PODCAST_SHOWS,
} from './WappyApplePodcastsShelf';

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
  failoverNotice?: string;
}

export const WAPPY_GOOGLE_MODELS_ECOSYSTEM = [
  {
    id: 'gemini-3.8-flash',
    category: 'Generación IA & Guiones',
    badge: 'Principal 3.8',
    description: 'Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones.',
  },
  {
    id: 'gemini-3.6-flash',
    category: 'Generación IA & Guiones',
    badge: 'Estable 3.6',
    description: 'Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST.',
  },
  {
    id: 'gemini-3.5-flash-lite',
    category: 'Generación IA & Guiones',
    badge: 'Ultra Ligero',
    description: 'Baja latencia para respuestas instantáneas y estructuración rápida.',
  },
  {
    id: 'gemini-3.8-live',
    category: 'Voz en Tiempo Real (Live)',
    badge: 'Tenshi Live 3.8',
    description: 'Interacción conversacional bidireccional de baja latencia en tiempo real.',
  },
  {
    id: 'gemini-3.1-flash-live-preview',
    category: 'Voz en Tiempo Real (Live)',
    badge: 'Live Preview 3.1',
    description: 'Respaldo multimodal en vivo para sesiones de voz continua.',
  },
  {
    id: 'gemini-2.5-flash-native-audio-preview-12-2025',
    category: 'Voz en Tiempo Real (Live)',
    badge: 'Audio Nativo 2.5',
    description: 'Audio nativo multimodal con soporte extendido de herramientas.',
  },
  {
    id: 'gemini-3.8-flash-tts',
    category: 'Síntesis de Voz (TTS 24kHz)',
    badge: 'Recomendado (14 voces)',
    description: 'Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas.',
  },
  {
    id: 'gemini-3.1-flash-tts-preview',
    category: 'Síntesis de Voz (TTS 24kHz)',
    badge: 'Preview 3.1 (14 voces)',
    description: 'Prosodia refinada y soporte completo para las 14 voces preconstruidas.',
  },
  {
    id: 'gemini-2.5-flash-preview-tts',
    category: 'Síntesis de Voz (TTS 24kHz)',
    badge: 'Reemplazo 2.5 Pro (5 voces)',
    description: 'Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede).',
  },
  {
    id: 'gemini-3.8-flash-lite-tts',
    category: 'Síntesis de Voz (TTS 24kHz)',
    badge: 'Ultra Rápido (6 voces)',
    description: 'Lecturas masivas de baja latencia con 6 voces optimizadas.',
  },
] as const;

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
    tag: '<sigh>',
    label: 'Suspiro natural',
    description: 'Añade un suspiro expresivo de reflexión o alivio',
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

const DEFAULT_PODCAST_SCRIPT = `Alex: <breath> ¡Bienvenidos a un nuevo episodio de Somos SST Podcast! Hoy hablaremos sobre las cinco reglas de oro para prevenir accidentes graves en planta.

Sam: Así es, Alex. <sigh> Muchas veces creemos que un procedimiento de dos minutos no requiere bloqueo de energías, pero ahí es donde ocurre el noventa por ciento de los incidentes.

Alex: Totalmente de acuerdo, Sam. ¿Cuál dirías que es el primer paso innegociable antes de intervenir cualquier equipo?`;

const PODCAST_QUICK_TEMPLATES = [
  {
    id: 'podcast-charla-5min',
    label: '🎙️ Podcast Charla 5 Min',
    style:
      'Diálogo dinámico, cercano y motivador de podcast matutino de seguridad industrial entre dos especialistas.',
    text: `Alex: <breath> ¡Bienvenidos a un nuevo episodio de Somos SST Podcast! Hoy hablaremos sobre las cinco reglas de oro para prevenir accidentes graves en planta.

Sam: Así es, Alex. <sigh> Muchas veces creemos que un procedimiento de dos minutos no requiere bloqueo de energías, pero ahí es donde ocurre el noventa por ciento de los incidentes.

Alex: Totalmente de acuerdo, Sam. ¿Cuál dirías que es el primer paso innegociable antes de intervenir cualquier equipo?

Sam: Primero cortar todas las fuentes de tensión y aplicar bloqueo LOTO con candado personal. <breath> Ninguna urgencia operativa vale más que volver sanos a casa.`,
  },
  {
    id: 'podcast-investigacion-atel',
    label: '🔍 Debate Investigación ATEL',
    style:
      'Debate técnico, analítico y pedagógico sobre investigación de accidentes laborales bajo Resolución 1401.',
    text: `Alex: <breath> Hoy en mesa de análisis revisamos un caso crítico de investigación ATEL bajo la Resolución 1401. Sam, ¿por qué seguimos quedándonos en la causa inmediata?

Sam: Excelente pregunta, Alex. <sigh> El error más común es culpar al trabajador diciendo que hubo exceso de confianza, sin usar metodología de árbol de causas o los cinco porqués.

Alex: |mhm| Exacto. Cuando profundizamos encontramos que faltaba mantenimiento preventivo, iluminación adecuada o supervisión efectiva en la tarea crítica.

Sam: |yeah| Investigar no es buscar culpables, sino transformar las causas raíz en controles de ingeniería reales para que jamás se repita. <breath>`,
  },
  {
    id: 'podcast-entrevista-copasst',
    label: '🛡️ Entrevista Comité COPASST',
    style:
      'Entrevista cálida, participativa y constructiva sobre liderazgo del COPASST e inspecciones en terreno.',
    text: `Alex: <breath> ¡Hola equipo! Hoy conversamos con Sam sobre cómo convertir al COPASST en un comité vivo en planta y no solo en un acta mensual. <laugh>

Sam: ¡Gracias por la invitación, Alex! |yeah| El secreto está en salir del escritorio: acompañar las inspecciones planeadas y escuchar directamente a los operarios en su puesto de trabajo.

Alex: |mhm| Y cuando un trabajador reporta una condición insegura y ve que el comité gestiona la solución en la misma semana, la cultura preventiva se dispara.

Sam: Sin duda, Alex. <breath> La seguridad la construimos conversando y actuando todos los días en equipo.`,
  },
] as const;

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
    title: 'Narración Épica con Orus: El Guardián del Tiempo',
    text: `En las profundidades de la antigua biblioteca de Alejandría, donde el polvo danzaba sobre rayos de sol eternos, existía un manuscrito que nadie se atrevía a abrir. <breath>

Decían los sabios que sus páginas no contenían tinta, sino la memoria viva de las civilizaciones olvidadas. Cada palabra pronunciada en voz alta hacía vibrar los cimientos de piedra. <breath>

Aquella noche, cuando las antorchas comenzaron a extinguirse una por una, el guardián comprendió que el tiempo no es una línea recta... sino un océano esperando ser navegado.`,
  },
  {
    title: 'Audiolibro: El Faro de las Galaxias',
    text: `Capítulo Uno: El horizonte silencioso. <breath>

El observatorio flotaba a trescientos kilómetros sobre la atmósfera terrestre. Desde el ventanal principal, Elena observaba el destello azulado de las tormentas eléctricas sobre el Pacífico. <breath>

Durante años habíamos buscado señales de radio en frecuencias convencionales. Pero aquella madrugada, el sensor cuántico registró un pulso rítmico, casi musical, proveniente del cúmulo de Hércules. <gasp> No era ruido cósmico; era una invitación.`,
  },
  {
    title: 'Podcast: IA y la Voz Humana (Diálogo Alex & Sam)',
    text: `Alex: ¡Bienvenidos a un nuevo episodio de Futuro Sonoro! <breath> Hoy estamos probando en vivo la nueva generación de síntesis neuronal con expresiones humanas reales.

Sam: ¡Hola Alex! |yeah| Es impresionante cómo ya no suena a lectura robótica. <laugh> Ahora la voz respira, hace pausas orgánicas y transmite intención en cada frase.

Alex: Totalmente. |mhm| Y lo mejor es que podemos pasar de una cápsula de treinta segundos a un audiolibro de una hora completa sin perder calidad.

Sam: Sin duda estamos ante una nueva era para creadores, formadores y equipos de prevención.`,
  },
  {
    title: 'Meditación Guiada: Serenidad y Respiración Profunda',
    text: `Encuentra una postura cómoda y permite que tus párpados se cierren suavemente... <breath>

Toma una inhalación lenta y profunda por la nariz... sintiendo cómo el aire fresco llena tus pulmones de calma y claridad. <breath>

Ahora exhala despacio... soltando cualquier prisa, cualquier preocupación del día. <breath> Aquí y ahora, estás en completo equilibrio.`,
  },
  {
    title: 'Noticia: Avance Histórico en Computación Cuántica',
    text: `En noticias de última hora, un consorcio internacional de investigadores ha logrado estabilizar un procesador cuántico de mil cúbits lógicos a temperatura controlada. <breath>

Este avance permitirá simular moléculas complejas para nuevos medicamentos y optimizar redes energéticas enteras en cuestión de segundos. <breath>

Los expertos señalan que las primeras aplicaciones industriales comenzarán a desplegarse durante el próximo trimestre.`,
  },
  {
    title: 'Reel Viral Antigravity 60-FPS: Cómo WAPPY IA transforma el SG-SST',
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
    name: '🔥 Reel WAPPY + Avatar 3D',
    badge: 'Oficial GTC-45',
    description: 'Multi-escena con Avatar 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz.',
  },
  {
    id: 'kpi-hud',
    name: '🚀 Ecosistema + Tenshi IA',
    badge: 'Plataforma 40s',
    description: 'Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi.',
  },
  {
    id: 'alert-sst',
    name: '📜 Expediente & Reglas SST',
    badge: 'Normativo',
    description: 'Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar.',
  },
  {
    id: 'camera-overlay',
    name: '🎬 Lower-Third (Video Propio)',
    badge: 'Transparente',
    description: 'Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro.',
  },
];

export interface AntigravityEffectItem {
  id: string;
  label: string;
  category: '3D & Avatares' | 'Transiciones Reels' | 'Elementos SST' | 'Sonido & Portada';
  description: string;
}

export const ANTIGRAVITY_EFFECTS_CATALOG: AntigravityEffectItem[] = [
  {
    id: '19-cover-2s',
    label: '19 Portada Magnética (2s)',
    category: 'Sonido & Portada',
    description: 'Miniatura de alto impacto (0.0s-2.0s) con titular gigante e insignias clave.',
  },
  {
    id: 'felix-voxel-3d',
    label: 'Avatar 3D Lip-Sync',
    category: '3D & Avatares',
    description: 'Presentador Avatar 3D con gestos y sincronía labial reactiva al audio.',
  },
  {
    id: 'tenshi-3d',
    label: 'Tenshi 3D',
    category: '3D & Avatares',
    description: 'Oráculo IA flotante con halo esmeralda/cyan y telemetría reactiva.',
  },
  {
    id: '01-orbit',
    label: '01 Órbita 3D',
    category: '3D & Avatares',
    description: 'Anillo orbital 3D de insignias e iconos gravitatorios alrededor del concepto central.',
  },
  {
    id: '02-frame-break',
    label: '02 Frame Break',
    category: 'Transiciones Reels',
    description: 'Ruptura de marco con profundidad 3D y desborde fuera de la tarjeta.',
  },
  {
    id: '04-digital-zoom',
    label: '04 Digital Zoom',
    category: 'Transiciones Reels',
    description: 'Acercamiento táctico con retícula HUD y mira de precisión sobre datos críticos.',
  },
  {
    id: '05-phone-mockup',
    label: '05 Mockup iPhone',
    category: 'Elementos SST',
    description: 'Celular 3D con Dynamic Island mostrando alertas y controles SST en vivo.',
  },
  {
    id: '07-zoom-through',
    label: '07 Zoom-Through',
    category: 'Transiciones Reels',
    description: 'Transición inmersiva sin corte atravesando la escena hacia el siguiente punto.',
  },
  {
    id: '08-chart-grow',
    label: '08 Chart Grow',
    category: 'Elementos SST',
    description: 'Barras e indicadores KPI que crecen dinámicamente con rebote spring.',
  },
  {
    id: '10-glass-type',
    label: '10 Cristal 3D',
    category: '3D & Avatares',
    description: 'Tipografía y tarjetas Glassmorphism con refracción translúcida y borde luminoso.',
  },
  {
    id: '11-giro-3d',
    label: '11 Giro 3D',
    category: 'Transiciones Reels',
    description: 'Rotación en perspectiva Y/X con destello neón al cambiar de escena.',
  },
  {
    id: '13-checklist-sst',
    label: '13 Checklist SST',
    category: 'Elementos SST',
    description: 'Lista secuencial 1-2-3 con verificación animada y sello de cumplimiento.',
  },
  {
    id: '17-paper-cut',
    label: '17 Paper Cut',
    category: 'Transiciones Reels',
    description: 'Recorte editorial en capas con textura y sombra proyectada.',
  },
  {
    id: '18-dolly-zoom',
    label: '18 Dolly Zoom',
    category: 'Transiciones Reels',
    description: 'Efecto vértigo cinematográfico contrayendo el fondo mientras destaca el titular.',
  },
  {
    id: 'visor-normativo',
    label: 'Visor Normativo Subrayado',
    category: 'Elementos SST',
    description: 'Expediente legal (Decreto 1072 / Res. 0312) con resaltador fluorescente en vivo.',
  },
  {
    id: 'pentagono-gtc45',
    label: 'Pentágono GTC-45',
    category: 'Elementos SST',
    description: 'Radar pentagonal de peligros y valoración de riesgos GTC-45.',
  },
  {
    id: 'sfx-pack',
    label: 'SFX Whoosh+Pop+Ding',
    category: 'Sonido & Portada',
    description: 'Diseño sonoro sincronizado: whoosh en transiciones, pop en tarjetas y ding en checks.',
  },
];

export const ANTIGRAVITY_ART_DIRECTIONS = [
  {
    id: 'dark-tech-hud',
    label: 'Dark Tech HUD',
    colors: '#0C192E + #00D4FF + #C7F303',
    description: 'Fondo cósmico oscuro con HUD cian, verde lima eléctrico y tarjetas de cristal.',
  },
  {
    id: 'wappy-lima-oliva',
    label: 'WAPPY Lima & Oliva',
    colors: '#C7F303 + #0E1300',
    description: 'Identidad oficial wappy.club con alto contraste verde lima y negro oliva.',
  },
  {
    id: 'crema-editorial-sst',
    label: 'Crema Editorial SST',
    colors: '#F6F5EF + #0D9488',
    description: 'Estilo documental SST para Dummies con papel cálido, turquesa y subrayado.',
  },
  {
    id: 'cielo-wappy-cloud',
    label: 'Cielo WAPPY Cloud',
    colors: '#5BB8F5 → #EAF6FE',
    description: 'Atmósfera luminosa WAPPY Cloud con degradado celeste y tarjetas flotantes.',
  },
] as const;

export const PAUSE_AND_EMPHASIS_TAGS = [
  { tag: '[pausa 0.5s]', label: 'Pausa 0.5s', desc: 'Breve silencio rítmico entre ideas' },
  { tag: '[pausa 1.0s]', label: 'Pausa 1.0s', desc: 'Pausa dramática de cambio de escena' },
  { tag: '[énfasis]', label: 'Énfasis Vocal', desc: 'Mayor fuerza e intención en la frase' },
  { tag: '<breath>', label: 'Respiración <breath>', desc: 'Toma de aire orgánica' },
  { tag: '<laugh>', label: 'Risa <laugh>', desc: 'Reacción cercana y carismática' },
  { tag: '<gasp>', label: 'Sorpresa <gasp>', desc: 'Inhalación de asombro o alerta' },
  { tag: '|mhm|', label: 'Asentir |mhm|', desc: 'Confirmación natural en diálogo' },
  { tag: '|yeah|', label: 'Acuerdo |yeah|', desc: 'Expresión dinámica de apoyo' },
] as const;

export interface ScriptStepScene {
  id: string;
  timeRange: string;
  title: string;
  narration: string;
  visualEffect: string;
}

export const DEFAULT_SCRIPT_STEPS: ScriptStepScene[] = [
  {
    id: 'step-1',
    timeRange: '0.0s-2.0s',
    title: 'Portada Magnética (2s)',
    narration: '¡Atención equipo! Tu vida depende de las Cinco Reglas de Oro en riesgo eléctrico. <breath>',
    visualEffect: '19 Portada Magnética (2s)',
  },
  {
    id: 'step-2',
    timeRange: '2.0s-8.0s',
    title: 'Reglas 1 y 2: Corte Visible y Bloqueo LOTO',
    narration: '[pausa 0.5s] Primero: Cortar todas las fuentes de tensión. Segundo: Bloquear y etiquetar con tu candado personal LOTO. <breath>',
    visualEffect: '05 Mockup iPhone',
  },
  {
    id: 'step-3',
    timeRange: '8.0s-16.0s',
    title: 'Reglas 3 y 4: Ausencia de Tensión y Puesta a Tierra',
    narration: '[pausa 0.5s] Tercero: Verificar ausencia de tensión con detector calibrado. Cuarto: Poner a tierra y en cortocircuito. <breath>',
    visualEffect: '13 Checklist SST',
  },
  {
    id: 'step-4',
    timeRange: '16.0s-24.0s',
    title: 'Regla 5 y Cierre WAPPY IA',
    narration: 'Y quinto: Delimitar y señalizar la zona de trabajo. En WAPPY IA cuidamos que regreses sano y salvo a casa.',
    visualEffect: 'Avatar 3D Lip-Sync',
  },
];

function playStudioSfxPreview(kind: 'whoosh' | 'pop' | 'ding') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.32);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (kind === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.09);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    }
  } catch {
    /* ignore audio context restrictions */
  }
}

interface ScriptBeatItem {
  index: number;
  text: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  startPct: number;
  endPct: number;
  badge: string;
  titleLead: string;
  titleHighlight: string;
  pillColor: 'lime' | 'cyan' | 'amber';
  iconType: 'bolt' | 'lock' | 'radar' | 'shield' | 'alert' | 'chart';
  gesture: 'wave' | 'pointLeft' | 'pointRight' | 'bothUp';
}

interface ScriptWordTiming {
  word: string;
  startPct: number;
  endPct: number;
  beatIndex: number;
}

function computeClientScriptTimelineMap(
  scriptText: string,
  totalDurationSeconds = 28,
): {
  beats: ScriptBeatItem[];
  wordTimings: ScriptWordTiming[];
  totalDurationSeconds: number;
} {
  const safeTotal = Math.max(4, Number(totalDurationSeconds) || 28);
  const raw = String(scriptText || '')
    .replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim, '')
    .trim();

  const rawSegments = raw
    .split(/(?<=[.!?…])\s+|\n+|<breath>/gi)
    .map((s) =>
      s
        .replace(/<[^>]+>/g, '')
        .replace(/\|[^|]+\|/g, '')
        .trim(),
    )
    .filter(Boolean);

  if (rawSegments.length === 0) {
    rawSegments.push('Prevención inteligente y seguridad en el trabajo con WAPPY IA.');
  }

  const merged: string[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    if (seg.length < 18 && i + 1 < rawSegments.length) {
      rawSegments[i + 1] = `${seg} ${rawSegments[i + 1]}`;
    } else {
      merged.push(seg);
    }
  }

  const maxBeats = 7;
  const beatsRaw: string[] = [];
  if (merged.length <= maxBeats) {
    beatsRaw.push(...merged);
  } else {
    const groupSize = Math.ceil(merged.length / maxBeats);
    for (let i = 0; i < merged.length; i += groupSize) {
      beatsRaw.push(merged.slice(i, i + groupSize).join(' '));
    }
  }

  const wordTimings: ScriptWordTiming[] = [];
  const beatObjects: ScriptBeatItem[] = [];
  let totalWeight = 0;

  const tempBeats = beatsRaw.map((text, bIdx) => {
    const words = text.split(/\s+/).filter(Boolean);
    const wList = words.map((w) => {
      const cleanLen = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '').length;
      let weight = Math.max(2, cleanLen);
      if (/[,;:]$/.test(w)) weight += 4;
      if (/[.!?…]$/.test(w)) weight += 9;
      return { word: w, weight };
    });
    if (wList.length > 0) wList[wList.length - 1].weight += 7;
    const beatWeight = wList.reduce((acc, item) => acc + item.weight, 0) || 10;
    totalWeight += beatWeight;
    return { text, bIdx, wList, beatWeight };
  });

  const gestures: ('wave' | 'pointLeft' | 'pointRight' | 'bothUp')[] = [
    'wave',
    'pointLeft',
    'pointRight',
    'bothUp',
  ];
  const pillColors: ('lime' | 'cyan' | 'amber')[] = ['lime', 'cyan', 'amber'];

  let accWeight = 0;
  for (let i = 0; i < tempBeats.length; i++) {
    const b = tempBeats[i];
    const startPct = accWeight / Math.max(1, totalWeight);
    const endPct = (accWeight + b.beatWeight) / Math.max(1, totalWeight);
    const startSec = Number((startPct * safeTotal).toFixed(2));
    const endSec = Number((endPct * safeTotal).toFixed(2));
    const durationSec = Number(Math.max(0.8, endSec - startSec).toFixed(2));

    let wordAcc = accWeight;
    for (const wItem of b.wList) {
      const wStartPct = wordAcc / Math.max(1, totalWeight);
      wordAcc += wItem.weight;
      const wEndPct = wordAcc / Math.max(1, totalWeight);
      wordTimings.push({
        word: wItem.word,
        startPct: Number(wStartPct.toFixed(4)),
        endPct: Number(wEndPct.toFixed(4)),
        beatIndex: i,
      });
    }
    accWeight += b.beatWeight;

    const cleanWords = b.text
      .replace(/^[¡!¿?]+/, '')
      .split(/\s+/)
      .filter(Boolean);
    const colonIdx = b.text.indexOf(':');
    let badge =
      i === 0
        ? '⚡ IMPACTO INICIAL • WAPPY IA'
        : i === tempBeats.length - 1
          ? '🛡️ CIERRE EJECUTIVO • SOMOS SST'
          : `PUNTO CLAVE 0${i}`;
    if (/^(primero|1\b)/i.test(b.text)) badge = '⚡ REGLA DE ORO 01';
    else if (/^(segundo|2\b)/i.test(b.text)) badge = '🔒 REGLA DE ORO 02';
    else if (/^(tercero|3\b)/i.test(b.text)) badge = '📡 REGLA DE ORO 03';
    else if (/^(cuarto|4\b)/i.test(b.text)) badge = '🛡️ REGLA DE ORO 04';
    else if (/^(quinto|5\b)/i.test(b.text)) badge = '🚨 REGLA DE ORO 05';

    let titleWords = cleanWords.slice(0, Math.min(5, cleanWords.length));
    if (colonIdx > 0 && colonIdx < 16) {
      const afterColon = b.text
        .slice(colonIdx + 1)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (afterColon.length >= 2) {
        titleWords = afterColon.slice(0, Math.min(5, afterColon.length));
      }
    }
    const splitAt = Math.max(1, Math.ceil(titleWords.length * 0.55));
    const titleLead = titleWords.slice(0, splitAt).join(' ').replace(/[,;:.!?]+$/, '');
    const titleHighlight =
      titleWords
        .slice(splitAt)
        .join(' ')
        .replace(/[,;:.!?]+$/, '') || 'WAPPY IA';

    const lower = b.text.toLowerCase();
    let iconType: 'bolt' | 'lock' | 'radar' | 'shield' | 'alert' | 'chart' = 'bolt';
    if (/bloqueo|tarjeteo|candado|loto|aislar/.test(lower)) iconType = 'lock';
    else if (/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test(lower)) iconType = 'radar';
    else if (/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test(lower)) iconType = 'shield';
    else if (/señalizar|delimitar|alerta|peligro|error|riesgo/.test(lower)) iconType = 'alert';
    else if (/matriz|gtc|excel|informe|indicador|semana|minuto/.test(lower)) iconType = 'chart';

    beatObjects.push({
      index: i + 1,
      text: b.text,
      startSec,
      endSec,
      durationSec,
      startPct: Number(startPct.toFixed(4)),
      endPct: Number(endPct.toFixed(4)),
      badge,
      titleLead,
      titleHighlight,
      pillColor: pillColors[i % pillColors.length],
      iconType,
      gesture: gestures[i % gestures.length],
    });
  }

  return { beats: beatObjects, wordTimings, totalDurationSeconds: safeTotal };
}

function getDuotoneSvgMarkup(iconType: string, accentColor: string): string {
  if (iconType === 'lock') {
    return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${accentColor}" fill-opacity="0.22" stroke="${accentColor}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`;
  }
  if (iconType === 'radar') {
    return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${accentColor}" fill-opacity="0.16" stroke="${accentColor}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`;
  }
  if (iconType === 'shield') {
    return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if (iconType === 'alert') {
    return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`;
  }
  if (iconType === 'chart') {
    return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${accentColor}" fill-opacity="0.35" stroke="${accentColor}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${accentColor}" fill-opacity="0.55" stroke="${accentColor}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${accentColor}" fill-opacity="0.16" stroke="${accentColor}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}

function buildDefaultHtmlComposition({
  aspectRatio = '9:16',
  hasBaseVideo = false,
  badgeText = 'ECOSISTEMA IA • SG-SST',
  headline = '5 Reglas de Oro en Seguridad',
  subheadline = 'Prevención inteligente en tiempo real con WAPPY Studio',
  accentColor = '#14b8a6',
  templateId = 'golden-rules',
  scriptText = '',
  durationSeconds = 28,
}: {
  aspectRatio?: '9:16' | '16:9';
  hasBaseVideo?: boolean;
  badgeText?: string;
  headline?: string;
  subheadline?: string;
  accentColor?: string;
  templateId?: StudioSceneTemplateId;
  scriptText?: string;
  durationSeconds?: number;
}) {
  const isVertical = aspectRatio === '9:16';
  const safeBadge = (badgeText || 'ECOSISTEMA IA • SG-SST').replace(/</g, '&lt;');
  const safeHeadline = (headline || 'Prevención Inteligente WAPPY IA').replace(/</g, '&lt;');
  const safeSubheadline = (subheadline || 'Sincronización neural en vivo').replace(/</g, '&lt;');
  const useTransparentBg = hasBaseVideo || templateId === 'camera-overlay';

  const effectiveScript =
    (scriptText || '').trim() ||
    `${safeHeadline}. ${safeSubheadline}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`;
  const timelineMap = computeClientScriptTimelineMap(effectiveScript, durationSeconds);
  const beats = timelineMap.beats;

  const pillClass = (c: 'lime' | 'cyan' | 'amber') => {
    if (c === 'cyan') {
      return 'background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);';
    }
    if (c === 'amber') {
      return 'background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);';
    }
    return 'background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);';
  };

  // Construir una escena visual rica por cada Beat del guion para sincronía 1:1 con la voz
  const scenesHtml = beats
    .map((beat, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === beats.length - 1;
      const escText = beat.text.replace(/</g, '&lt;');
      const escLead = (isFirst && headline ? safeHeadline.split(/\s+/).slice(0, 3).join(' ') : beat.titleLead).replace(/</g, '&lt;');
      const escHigh = (
        isFirst && headline && headline.split(/\s+/).length > 3
          ? headline.split(/\s+/).slice(3).join(' ')
          : beat.titleHighlight
      ).replace(/</g, '&lt;');
      const svgIcon = getDuotoneSvgMarkup(beat.iconType, accentColor);

      if (templateId === 'camera-overlay') {
        return `
        <div id="scene-${beat.index}" class="scene-layer ${isFirst ? '' : 'opacity-0 pointer-events-none'} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${beat.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${beat.index}/0${beats.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${svgIcon}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${escLead} <span class="inline-block px-2 py-0.5 rounded-lg" style="${pillClass(beat.pillColor)}">${escHigh}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${escText}</p>
              </div>
            </div>
          </div>
        </div>`;
      }

      // ESCENA 1: HOOK DE ALTO IMPACTO + TARJETAS COMPARATIVAS VS (Estilo GTC-45 & Plataforma 40s)
      if (isFirst) {
        return `
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${beat.badge}</span>
            </div>
            <h1 class="${isVertical ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black tracking-tight text-white leading-none font-display">
              ${escLead} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${pillClass('amber')}">${escHigh}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${escText}</p>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:gap-2.5 mt-1">
            <div data-editable="true" class="sc-item glass-card rounded-2xl p-3 border border-rose-500/40 bg-rose-950/25 flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-black text-sm shrink-0">✕</div>
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-black text-white truncate">Práctica Improvisada / Sin Control</div>
                  <div class="text-[11px] text-rose-200/90 leading-tight">Fallas operativas, exceso de confianza y alto riesgo de accidente</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-mono font-extrabold shrink-0">RIESGO SST</span>
            </div>

            <div data-editable="true" class="sc-item glass-card rounded-2xl p-3 border border-[#c7f303]/60 bg-emerald-950/30 flex items-center justify-between gap-2.5" style="box-shadow:0 0 28px rgba(199,243,3,0.14);">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-[#c7f303]/20 border border-[#c7f303]/50 flex items-center justify-center text-[#c7f303] font-black text-sm shrink-0">⚡</div>
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${safeBadge}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${safeSubheadline}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`;
      }

      // ESCENA 2: MOCKUP CELULAR CON DYNAMIC ISLAND + CHECKLIST LATERAL (Estilo Reel GTC-45)
      if (idx === 1 && beats.length >= 3) {
        return `
        <div id="scene-${beat.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${beat.badge}</span>
            </div>
            <h2 class="${isVertical ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black text-white leading-tight font-display">
              ${escLead} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${pillClass('cyan')}">${escHigh}</span>
            </h2>
          </div>

          <div class="grid grid-cols-12 gap-2.5 items-stretch">
            <!-- Phone Mockup con Dynamic Island -->
            <div data-editable="true" class="sc-item col-span-5 rounded-3xl p-2.5 bg-slate-900/95 border-2 border-cyan-400/45 shadow-2xl flex flex-col justify-between">
              <div class="mx-auto px-2.5 py-0.5 rounded-full bg-black border border-white/15 flex items-center gap-1.5 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#c7f303]"></span>
                <span class="text-[8px] font-mono font-bold text-white uppercase tracking-wider">CONTROL LIVE</span>
              </div>
              <div class="rounded-2xl bg-slate-950/90 border border-white/10 p-2.5 flex-1 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  ${svgIcon}
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#c7f303] text-[8px] font-mono font-bold">ACTIVO</span>
                </div>
                <div class="my-1.5">
                  <div class="text-[9px] font-mono uppercase text-cyan-300 font-bold">VERIFICACIÓN IA</div>
                  <div class="text-xs font-black text-white leading-tight mt-0.5">${escLead} ${escHigh}</div>
                </div>
                <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-[#14b8a6] to-[#c7f303] w-full"></div>
                </div>
              </div>
            </div>

            <!-- Tarjetas de Verificación / Firma Digital -->
            <div class="col-span-7 flex flex-col justify-between gap-2">
              <div data-editable="true" class="sc-item glass-card rounded-2xl p-2.5 border border-cyan-400/35">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-extrabold text-cyan-300 uppercase font-mono">📋 DIRECTRIZ EN CAMPO</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[8px] font-mono font-bold">✓ VALIDADO</span>
                </div>
                <p class="text-xs font-bold text-white leading-snug">${escText}</p>
              </div>

              <div data-editable="true" class="sc-item glass-card rounded-2xl p-2.5 border border-[#c7f303]/40">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-extrabold text-[#c7f303] uppercase font-mono">✍️ TRAZABILIDAD SG-SST</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#c7f303]/20 text-[#c7f303] text-[8px] font-mono font-bold">100% CUMPLIDO</span>
                </div>
                <svg viewBox="0 0 180 24" class="w-full h-5" fill="none">
                  <path d="M6 18C22 6 34 20 52 11C70 2 84 19 106 9C124 2 142 16 174 7" stroke="#c7f303" stroke-width="2.6" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>`;
      }

      // ESCENA FINAL: CIERRE EJECUTIVO & EMBLEMA WAPPY IA (Permanece 100% visible al terminar)
      if (isLast && beats.length >= 2) {
        return `
        <div id="scene-${beat.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${beat.badge}</span>
            </div>
            <h2 class="${isVertical ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black text-white leading-none font-display">
              ${escLead} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${pillClass('lime')}">${escHigh}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${svgIcon}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${escText}</p>
            <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-[#c7f303] text-[#091004] text-[10px] font-black uppercase tracking-wider">⚡ WAPPY IA • SOMOS SST</span>
              <span class="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">✓ CERO ACCIDENTES</span>
            </div>
          </div>
        </div>`;
      }

      // ESCENAS INTERMEDIAS (3..N-1): TARJETA TÁCTICA + TELEMETRÍA EN VIVO / EXPEDIENTE NORMATIVO
      return `
      <div id="scene-${beat.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
        <div data-editable="true" class="sc-head text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
            <span>• ${beat.badge} • PASO 0${beat.index}</span>
          </div>
          <h2 class="${isVertical ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black text-white leading-tight font-display">
            ${escLead} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${pillClass(beat.pillColor)}">${escHigh}</span>
          </h2>
        </div>

        <div data-editable="true" class="sc-item glass-card rounded-3xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-2xl bg-slate-900/90 border border-white/10 shrink-0">
              ${svgIcon}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-[#c7f303] font-extrabold">PROTOCOLO VERIFICADO</span>
                <span class="text-[10px] font-mono font-bold text-emerald-400">NIVEL ÓPTIMO • 100%</span>
              </div>
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${escText}</p>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10">
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-teal-500/30">
              <div class="text-[9px] font-mono text-slate-400 uppercase">ESTADO</div>
              <div class="text-xs font-black text-emerald-400">✓ ACTIVO</div>
            </div>
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-cyan-500/30">
              <div class="text-[9px] font-mono text-slate-400 uppercase">PRECISIÓN IA</div>
              <div class="text-xs font-black text-cyan-300">99.8%</div>
            </div>
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-[#c7f303]/40">
              <div class="text-[9px] font-mono text-slate-400 uppercase">NORMATIVA</div>
              <div class="text-xs font-black text-[#c7f303]">SG-SST</div>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  // Personaje presentador inferior (Félix 3D Voxel lip-sync en vivo o Tarjeta Oráculo Tenshi IA)
  const bottomHostMarkup =
    useTransparentBg
      ? ''
      : templateId === 'kpi-hud'
        ? `
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${isVertical ? 'max-w-md' : 'max-w-2xl'} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${beats[0]?.text.replace(/</g, '&lt;') || safeSubheadline}</p>
        </div>
      </div>`
        : `
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${isVertical ? 'max-w-md' : 'max-w-2xl'} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${isVertical ? 'w-[122px] h-[102px]' : 'w-[96px] h-[80px]'} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${beats[0]?.badge || 'WAPPY IA • SOMOS SST'}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${beats[0]?.text.replace(/</g, '&lt;') || safeSubheadline}</p>
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="es" data-wappy-template="true">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: ${useTransparentBg ? 'transparent' : '#050c12'};
      color: #ffffff;
    }
    .font-display { font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; }
    .grid-bg {
      background-image:
        linear-gradient(rgba(20, 184, 166, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(20, 184, 166, 0.07) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    .glass-card {
      background: rgba(8, 16, 26, 0.84);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.52);
    }
    @keyframes radarSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .radar-sweep {
      transform-origin: 18px 18px;
      animation: radarSpin 3.2s linear infinite;
    }
  </style>
</head>
<body class="relative w-full h-full flex flex-col justify-between items-center ${isVertical ? 'p-3.5 sm:p-4' : 'p-3.5 sm:p-5'} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${
    useTransparentBg
      ? '<!-- Fondo transparente para video base del usuario -->'
      : `<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${accentColor};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`
  }

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${isVertical ? 'max-w-md' : 'max-w-2xl'} mx-auto flex items-center justify-between gap-1.5 shrink-0 pt-1">
    <div class="glass-card px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 min-w-0 max-w-[62%] border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3 shrink-0" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-teal-300 truncate">${safeBadge}</span>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <div class="glass-card px-2 py-1 rounded-full inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-[#c7f303] border border-[#c7f303]/35">
        <span class="w-1.5 h-1.5 rounded-full bg-[#c7f303] animate-pulse shrink-0"></span>
        <span>WAPPY.CLUB</span>
      </div>
      <svg viewBox="0 0 36 36" class="w-7 h-7 shrink-0">
        <circle cx="18" cy="18" r="16" fill="rgba(8,18,28,0.85)" stroke="rgba(20,184,166,0.45)" stroke-width="1.2" stroke-dasharray="3 2"/>
        <circle cx="18" cy="18" r="10" fill="none" stroke="rgba(199,243,3,0.3)" stroke-width="1"/>
        <line x1="18" y1="18" x2="31" y2="10" stroke="#c7f303" stroke-width="1.8" stroke-linecap="round" class="radar-sweep"/>
        <circle cx="18" cy="18" r="2" fill="#c7f303"/>
      </svg>
    </div>
  </div>

  <!-- ESCENARIO MULTI-ESCENA SINCRONIZADO FRASE A FRASE CON LA VOZ -->
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${isVertical ? 'max-w-md min-h-[270px]' : 'max-w-2xl min-h-[210px]'} mx-auto flex-1 flex flex-col justify-center">
    ${scenesHtml}
  </div>

  ${bottomHostMarkup}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${isVertical ? 'h-12' : 'h-10'} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(beats)};
    window.__wappyWordTimings = ${JSON.stringify(timelineMap.wordTimings)};
    window.__wappyVoicePlaying = true;
    window.__wappyCurrentGesture = 'wave';

    (function() {
      var beats = window.__wappyTimelineBeats || [];
      var totalDur = ${timelineMap.totalDurationSeconds};
      var master = gsap.timeline({
        repeat: 0,
        onUpdate: function() {
          var p = master.progress();
          var progBar = document.getElementById('wappy-top-progress');
          if (progBar) progBar.style.width = Math.max(4, Math.round(p * 100)) + '%';
        }
      });
      window.mainTimeline = master;

      // Entrada inicial del HUD y primera escena
      master.from("#header-hud", { y: -18, opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, 0);
      master.from("#scene-1 .sc-head", { y: 18, scale: 0.95, opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, 0.05);
      master.from("#scene-1 .sc-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.45, ease: "back.out(1.5)" }, 0.18);

      // Coreografía exacta segundo a segundo para cada escena del guion
      for (var i = 1; i < beats.length; i++) {
        (function(idx) {
          var prevBeat = beats[idx - 1];
          var curBeat = beats[idx];
          var prevSel = "#scene-" + prevBeat.index;
          var curSel = "#scene-" + curBeat.index;
          var tSwitch = Math.max(0.5, curBeat.startSec);

          // Transición de salida de la escena anterior
          master.to(prevSel, {
            opacity: 0,
            scale: 0.92,
            y: -16,
            duration: 0.32,
            ease: "power2.in",
            pointerEvents: "none"
          }, Math.max(0.2, tSwitch - 0.32));

          // Actualizar texto en vivo de la tarjeta del presentador (Félix / Tenshi)
          master.call(function() {
            window.__wappyCurrentGesture = curBeat.gesture || 'pointRight';
            var cap = document.getElementById('host-live-caption');
            var bdg = document.getElementById('host-live-badge');
            if (cap) cap.textContent = curBeat.text;
            if (bdg) bdg.textContent = curBeat.badge;
          }, null, tSwitch);

          // Entrada dinámica de la nueva escena (Zoom-Through / Giro 3D / Slide Elástico)
          master.fromTo(curSel,
            { opacity: 0, scale: idx % 2 === 0 ? 1.08 : 0.9, rotationY: idx % 2 === 1 ? -18 : 0, y: 22 },
            { opacity: 1, scale: 1, rotationY: 0, y: 0, duration: 0.46, ease: "back.out(1.55)", pointerEvents: "auto" },
            tSwitch
          );
          master.fromTo(curSel + " .sc-item",
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.09, duration: 0.38, ease: "power3.out" },
            tSwitch + 0.08
          );
        })(i);
      }

      // Mantener la línea de tiempo exactamente hasta el segundo final sin apagar la última escena
      master.to({}, { duration: 0.1 }, totalDur);

      // Red de partículas estilo Constelación WAPPY + Renderizado Voxel 3D de Félix con Lip-Sync
      var bgCanvas = document.getElementById('wappy-bg-canvas');
      var bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
      var nodes = [];
      for (var n = 0; n < 22; n++) {
        nodes.push({
          x: Math.random() * 400,
          y: Math.random() * 600,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: 1.5 + Math.random() * 2
        });
      }

      var felixCanvas = document.getElementById('wappy-felix-voxel');
      var fCtx = felixCanvas ? felixCanvas.getContext('2d') : null;

      function drawSceneFrame(timeSec) {
        // 1) Ecualizador reactivo a la voz
        var eqBars = document.querySelectorAll('#hud-eq .eq-bar');
        for (var b = 0; b < eqBars.length; b++) {
          var h = window.__wappyVoicePlaying
            ? 30 + Math.abs(Math.sin(timeSec * 10 + b * 1.7)) * 70
            : 25;
          eqBars[b].style.height = Math.round(h) + '%';
        }

        // 2) Constelación de partículas de fondo
        if (bgCanvas && bgCtx) {
          var cw = bgCanvas.width = bgCanvas.clientWidth || 380;
          var ch = bgCanvas.height = bgCanvas.clientHeight || 600;
          bgCtx.clearRect(0, 0, cw, ch);
          for (var i = 0; i < nodes.length; i++) {
            var p1 = nodes[i];
            p1.x = (p1.x + p1.vx + cw) % cw;
            p1.y = (p1.y + p1.vy + ch) % ch;
            bgCtx.beginPath();
            bgCtx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
            bgCtx.fillStyle = i % 3 === 0 ? 'rgba(199,243,3,0.55)' : 'rgba(20,184,166,0.45)';
            bgCtx.fill();
            for (var j = i + 1; j < nodes.length; j++) {
              var p2 = nodes[j];
              var dx = p1.x - p2.x, dy = p1.y - p2.y;
              var dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 95) {
                bgCtx.beginPath();
                bgCtx.moveTo(p1.x, p1.y);
                bgCtx.lineTo(p2.x, p2.y);
                bgCtx.strokeStyle = 'rgba(20,184,166,' + ((1 - dist / 95) * 0.18).toFixed(3) + ')';
                bgCtx.lineWidth = 1;
                bgCtx.stroke();
              }
            }
          }
        }

        // 3) Avatar Voxel 3D de Félix (con camisa de cuadros amarilla WAPPY, gafas, barba y lip-sync)
        if (felixCanvas && fCtx) {
          var w = felixCanvas.width, h = felixCanvas.height;
          fCtx.clearRect(0, 0, w, h);
          var bob = Math.sin(timeSec * 3.6) * 2.2;
          var headTilt = Math.sin(timeSec * 2.1) * 0.035;
          var talkOpen = window.__wappyVoicePlaying
            ? Math.max(1.5, Math.abs(Math.sin(timeSec * 14.5) * Math.cos(timeSec * 6.2)) * 6.5)
            : 1.5;
          var blink = (Math.floor(timeSec * 2.5) % 9 === 0) && ((timeSec * 10) % 10 < 1.8);
          var g = window.__wappyCurrentGesture || 'wave';

          fCtx.save();
          fCtx.translate(w / 2, h - 6 + bob);

          // Torso — Camisa a cuadros amarilla/negra oficial WAPPY + camiseta blanca interna
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-30, -44, 60, 44);
          fCtx.fillStyle = '#1e293b';
          for (var gx = -30; gx < 30; gx += 12) {
            fCtx.fillRect(gx, -44, 4, 44);
          }
          for (var gy = -42; gy < 0; gy += 11) {
            fCtx.fillRect(-30, gy, 60, 3);
          }
          // Camiseta blanca central
          fCtx.fillStyle = '#f1f5f9';
          fCtx.fillRect(-9, -44, 18, 44);
          // Bolsillo amarillo con logo W
          fCtx.fillStyle = '#facc15';
          fCtx.fillRect(11, -28, 13, 13);
          fCtx.fillStyle = '#0f172a';
          fCtx.font = '900 9px monospace';
          fCtx.fillText('W', 13.5, -18);

          // Brazos con gestos naturales según la escena
          var leftArmAngle = g === 'wave' || g === 'bothUp' ? -0.55 + Math.sin(timeSec * 6) * 0.18 : 0.12;
          var rightArmAngle = g === 'pointRight' || g === 'bothUp' ? 0.55 - Math.sin(timeSec * 6) * 0.18 : -0.12;

          fCtx.save();
          fCtx.translate(-32, -38);
          fCtx.rotate(leftArmAngle);
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-10, 0, 11, 24);
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(-9, 24, 9, 10);
          fCtx.restore();

          fCtx.save();
          fCtx.translate(32, -38);
          fCtx.rotate(rightArmAngle);
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-1, 0, 11, 24);
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(0, 24, 9, 10);
          fCtx.restore();

          // Cabeza Voxel 3D
          fCtx.save();
          fCtx.translate(0, -48);
          fCtx.rotate(headTilt);

          // Sombra lateral 3D de la cabeza
          fCtx.fillStyle = '#b9855a';
          fCtx.fillRect(-29, -54, 58, 52);
          // Rostro frontal
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(-26, -54, 52, 50);

          // Cabello castaño oscuro voxelizado
          fCtx.fillStyle = '#2d1c12';
          fCtx.fillRect(-28, -64, 56, 15);
          fCtx.fillRect(-28, -54, 6, 22);
          fCtx.fillRect(22, -54, 6, 22);

          // Barba y bigote en bajo relieve
          fCtx.fillStyle = '#2b1b12';
          fCtx.fillRect(-26, -22, 52, 18);
          fCtx.fillRect(-16, -26, 32, 6);

          // Gafas negras cuadradas características
          fCtx.strokeStyle = '#0f172a';
          fCtx.lineWidth = 3.2;
          fCtx.strokeRect(-21, -44, 17, 13);
          fCtx.strokeRect(4, -44, 17, 13);
          fCtx.fillStyle = '#0f172a';
          fCtx.fillRect(-4, -40, 8, 3);

          // Ojos con parpadeo natural
          if (blink) {
            fCtx.fillStyle = '#2d1c12';
            fCtx.fillRect(-17, -38, 9, 2.5);
            fCtx.fillRect(8, -38, 9, 2.5);
          } else {
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(-17, -41, 9, 7);
            fCtx.fillRect(8, -41, 9, 7);
            fCtx.fillStyle = '#1e293b';
            fCtx.fillRect(-13, -39, 4, 5);
            fCtx.fillRect(11, -39, 4, 5);
          }

          // Boca sincronizada con la voz (Lip-Sync en vivo)
          fCtx.fillStyle = '#180d08';
          fCtx.fillRect(-9, -18, 18, Math.max(2, talkOpen));
          fCtx.fillStyle = '#f87171';
          fCtx.fillRect(-6, -17 + Math.max(1, talkOpen * 0.45), 12, Math.max(1, talkOpen * 0.45));

          fCtx.restore();
          fCtx.restore();
        }
      }

      window.__wappyRenderTick = function(tSec) {
        drawSceneFrame(tSec || 0);
      };

      var startPerf = performance.now();
      function loop(now) {
        var t = typeof window.__wappyCurrentTime === 'number'
          ? window.__wappyCurrentTime
          : (now - startPerf) / 1000;
        drawSceneFrame(t);
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    })();
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
 * 2) Control universal de GSAP (Play, Pause, Restart, Seek y STUDIO_SYNC_TIME bloqueado al audio).
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
  /* Ocultar contenedores de subtítulos internos duplicados creados por LLMs para que solo se vea el HUD oficial sincronizado */
  #subtitle-footer, #subtitle-card, #subtitle-container, #subtitle-box, footer[id*="subtitle"] {
    display: none !important;
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

    if (data.type === 'STUDIO_PLAY') {
      window.__wappyVoicePlaying = true;
      if (window.mainTimeline) window.mainTimeline.play();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.play();
    } else if (data.type === 'STUDIO_PAUSE') {
      window.__wappyVoicePlaying = false;
      if (window.mainTimeline) window.mainTimeline.pause();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
    } else if (data.type === 'STUDIO_RESTART') {
      window.__wappyVoicePlaying = true;
      window.__wappyCurrentTime = 0;
      if (window.mainTimeline) window.mainTimeline.restart();
      else if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.restart();
      if (typeof window.__wappyRenderTick === 'function') window.__wappyRenderTick(0);
    } else if (data.type === 'STUDIO_SEEK') {
      var p = Math.max(0, Math.min(1, Number(data.progress || 0)));
      if (typeof data.time === 'number') window.__wappyCurrentTime = data.time;
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(p);
      } else if (window.gsap && window.gsap.globalTimeline && typeof data.time === 'number') {
        window.gsap.globalTimeline.time(data.time);
      }
      if (typeof window.__wappyRenderTick === 'function' && typeof data.time === 'number') {
        window.__wappyRenderTick(data.time);
      }
    } else if (data.type === 'STUDIO_SYNC_TIME') {
      var curT = Number(data.currentTime || 0);
      var durT = Math.max(0.5, Number(data.duration || 20));
      var prog = Math.max(0, Math.min(0.9999, curT / durT));
      window.__wappyCurrentTime = curT;
      window.__wappyVoicePlaying = Boolean(data.playing);
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / durT);
        }
        if (Math.abs(window.mainTimeline.progress() - prog) > 0.015) {
          window.mainTimeline.progress(prog, false);
        }
      }
      if (typeof window.__wappyRenderTick === 'function') {
        window.__wappyRenderTick(curT, durT);
      }
    } else if (data.type === 'STUDIO_SET_EDIT_MODE') {
      editMode = Boolean(data.enabled);
      if (editMode) {
        window.__wappyVoicePlaying = false;
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

  let output = rawHtml.replace(/subtitles\.reverse\(\)/g, 'subtitles.slice().reverse()');
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
const GEMINI_KEYS_STORAGE = 'wappy_gemini_api_keys';

interface StoredGeminiKeyItem {
  key: string;
  label?: string;
  status?: 'valid' | 'invalid' | 'unchecked';
}

function readStoredGeminiKeyItems(): StoredGeminiKeyItem[] {
  try {
    const raw = localStorage.getItem(GEMINI_KEYS_STORAGE);
    if (!raw) return [];
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Formato heredado de la app portable: claves separadas por comas
      parsed = raw.split(',');
    }
    if (typeof parsed === 'string') parsed = parsed.split(',');
    if (!Array.isArray(parsed)) return [];
    return (parsed as any[])
      .map((item: any, idx: number): StoredGeminiKeyItem | null => {
        if (typeof item === 'string') {
          return { key: item.trim(), label: `Clave #${idx + 1}`, status: 'unchecked' as const };
        }
        if (item && typeof item.key === 'string') {
          return {
            key: item.key.trim(),
            label: item.label || `Clave #${idx + 1}`,
            status: item.status || 'unchecked',
          };
        }
        return null;
      })
      .filter((x): x is StoredGeminiKeyItem => Boolean(x && x.key));
  } catch {
    return [];
  }
}

function getAuthHeaders(authToken?: string): Record<string, string> {
  const token = authToken || localStorage.getItem('token') || '';
  const customKeys = readStoredGeminiKeyItems()
    .map((k) => k.key.trim())
    .filter((k) => k.length > 15)
    .join(',');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customKeys ? { 'x-gemini-api-keys': customKeys } : {}),
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

export default function WappyStudioDashboard({
  standalone = false,
  portable = false,
  podcastOnly = false,
}: {
  standalone?: boolean;
  portable?: boolean;
  podcastOnly?: boolean;
} = {}) {
  const { user, token, isAuthenticated } = useAuthContext();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const outletContext = useOutletContext<ContextType>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible ?? (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  const rawInitialTab = (searchParams.get('tab') as StudioTab) || 'tts';
  const initialTab: StudioTab =
    podcastOnly && rawInitialTab === 'video'
      ? 'tts'
      : ['tts', 'video', 'lab', 'library'].includes(rawInitialTab)
        ? rawInitialTab
        : 'tts';
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);

  // Modelo de IA para generación de escenas HTML/GSAP y mejora de guiones (leído desde GOOGLE_MODELS igual que los demás módulos de WAPPY)
  const [selectedAiModel, setSelectedAiModel] = useState<string>(() =>
    user?.personalization?.geminiModels?.sstManagement ||
    (process.env.GOOGLE_MODELS || 'gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite').split(',')[0].trim() ||
    'gemini-3.8-flash',
  );
  const [isEnhancingScript, setIsEnhancingScript] = useState<boolean>(false);
  const [apiKeyModalTab, setApiKeyModalTab] = useState<'antigravity' | 'keys' | 'models'>(
    'antigravity',
  );
  const [antigravityBridgeKey, setAntigravityBridgeKey] = useState<string>(() => {
    try {
      return localStorage.getItem('wappy_antigravity_bridge_key') || '';
    } catch {
      return '';
    }
  });
  const [antigravityStreamConnected, setAntigravityStreamConnected] = useState<boolean>(false);
  const [copiedBridgeItem, setCopiedBridgeItem] = useState<
    'key' | 'prompt' | 'terminal' | null
  >(null);

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
    podcastOnly
      ? 'Diálogo interactivo de podcast entre dos especialistas con alternancia natural.'
      : 'Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.',
  );
  const [multiSpeaker, setMultiSpeaker] = useState<boolean>(podcastOnly ? true : false);
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [wordsPerChunk, setWordsPerChunk] = useState<number>(150);
  const [scriptText, setScriptText] = useState<string>(
    podcastOnly ? WAPPY_PODCAST_SHOWS[0].script : SCRIPT_TEMPLATES[0].text,
  );

  // Estado de Selección Editorial Apple Podcasts & Edición de Cápsulas
  const [selectedApplePodcastId, setSelectedApplePodcastId] = useState<string>(
    WAPPY_PODCAST_SHOWS[0].id,
  );
  const [activePodcastEpisodeTitle, setActivePodcastEpisodeTitle] = useState<string>(
    podcastOnly ? WAPPY_PODCAST_SHOWS[0].title : '',
  );
  const [editingLibraryItemId, setEditingLibraryItemId] = useState<string | null>(null);

  const handleSelectApplePodcastShow = (show: PodcastShowPreset, autoSynthesize = false) => {
    setSelectedApplePodcastId(show.id);
    setEditingLibraryItemId(null);
    setActivePodcastEpisodeTitle(show.title);
    setMultiSpeaker(show.dualSpeaker);
    if (show.dualSpeaker) {
      setSpeaker1Voice(show.voiceId);
      setSpeaker2Voice(show.secondVoiceId);
    } else {
      setSelectedVoice(show.voiceId);
    }
    setStylePrompt(show.stylePrompt);
    setScriptText(show.script);

    if (autoSynthesize) {
      handleStartFullJob({
        script: show.script,
        title: show.title,
        multiSpeaker: show.dualSpeaker,
        voiceName: show.voiceId,
        speaker1Voice: show.voiceId,
        speaker2Voice: show.secondVoiceId,
        stylePrompt: show.stylePrompt,
      });
    } else {
      setStatusBanner({
        type: 'success',
        text: `Serie "${show.title}" (+5 min • ${show.dualSpeaker ? `${show.voiceId} + ${show.secondVoiceId}` : show.voiceId}) cargada en el Estudio y lista para editar o sintetizar en el Walkman.`,
      });
    }
  };

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
  const [showAdvancedChunking, setShowAdvancedChunking] = useState<boolean>(true);

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
  const [selectedArtDirection, setSelectedArtDirection] = useState<string>('dark-tech-hud');
  const [selectedSkillEffects, setSelectedSkillEffects] = useState<string[]>([
    '19-cover-2s',
    'felix-voxel-3d',
    '05-phone-mockup',
    '07-zoom-through',
    '13-checklist-sst',
    'sfx-pack',
  ]);
  const [scriptSteps, setScriptSteps] = useState<ScriptStepScene[]>(() => DEFAULT_SCRIPT_STEPS);
  const aiScenesBreakdownRef = useRef<any[] | null>(null);
  const lastAutoStructuredScriptRef = useRef<string>(SCRIPT_TEMPLATES[0].text);
  const [lastSuperPromptAiModel, setLastSuperPromptAiModel] = useState<string>('');
  const [showStepAssistant, setShowStepAssistant] = useState<boolean>(true);
  const [videoStudioSubTab, setVideoStudioSubTab] = useState<
    'style' | 'timeline' | 'layers' | 'code'
  >('style');
  const [isGeneratingSuperPrompt, setIsGeneratingSuperPrompt] = useState<boolean>(false);
  const [aiScenePrompt, setAiScenePrompt] = useState<string>(
    'Crea una animación cinematográfica con el Motor Antigravity 60-FPS y tarjetas de cristal WAPPY IA sobre las 5 reglas de oro de riesgo eléctrico, con Portada Magnética (2s), Avatar 3D lip-sync, iconos luminosos y barras de progreso.',
  );
  const [isGeneratingHtmlAi, setIsGeneratingHtmlAi] = useState<boolean>(false);
  const [videoCorrectionPrompt, setVideoCorrectionPrompt] = useState<string>('');
  const [isApplyingCorrection, setIsApplyingCorrection] = useState<boolean>(false);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'audio' | 'video'>(
    podcastOnly ? 'audio' : 'all',
  );
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [htmlCode, setHtmlCode] = useState<string>(() =>
    buildDefaultHtmlComposition({
      aspectRatio: '9:16',
      hasBaseVideo: false,
      badgeText: 'ECOSISTEMA IA • SG-SST',
      headline: '5 Reglas de Oro en Riesgo Eléctrico',
      subheadline: 'Prevención inteligente y locución neural sincronizada',
      accentColor: '#14b8a6',
      templateId: 'golden-rules',
      scriptText: SCRIPT_TEMPLATES[0].text,
      durationSeconds: 28,
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

  // Gestión de Claves API Google Gemini (Hasta 3 claves con rotación inteligente)
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [customApiKeys, setCustomApiKeys] = useState<StoredGeminiKeyItem[]>(() => {
    const stored = readStoredGeminiKeyItems();
    return [
      stored[0] || { key: '', label: 'Clave Principal #1', status: 'unchecked' },
      stored[1] || { key: '', label: 'Clave Respaldo #2', status: 'unchecked' },
      stored[2] || { key: '', label: 'Clave Respaldo #3', status: 'unchecked' },
    ];
  });
  const [isValidatingKeys, setIsValidatingKeys] = useState<boolean>(false);
  const [keyValidationMsg, setKeyValidationMsg] = useState<string>('');

  const activeCustomKeyCount = useMemo(
    () => customApiKeys.filter((k) => k.key.trim().length > 15).length,
    [customApiKeys],
  );

  // Sincronizar claves si se cambian desde otra parte (p. ej. el modal "Claves IA" de la landing portable)
  useEffect(() => {
    const reload = () => {
      const stored = readStoredGeminiKeyItems();
      setCustomApiKeys([
        stored[0] || { key: '', label: 'Clave Principal #1', status: 'unchecked' },
        stored[1] || { key: '', label: 'Clave Respaldo #2', status: 'unchecked' },
        stored[2] || { key: '', label: 'Clave Respaldo #3', status: 'unchecked' },
      ]);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === GEMINI_KEYS_STORAGE) reload();
    };
    window.addEventListener('wappy-keys-updated', reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('wappy-keys-updated', reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleSaveAndValidateKeys = async () => {
    setIsValidatingKeys(true);
    setKeyValidationMsg('');
    try {
      const updated = [...customApiKeys];
      let validCount = 0;
      for (let i = 0; i < updated.length; i++) {
        const cleanKey = updated[i].key.trim();
        if (!cleanKey) {
          updated[i] = { ...updated[i], key: '', status: 'unchecked' };
          continue;
        }
        try {
          const resp = await fetch('/api/studio/keys-validate', {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ apiKey: cleanKey }),
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data.valid) {
            updated[i] = { ...updated[i], key: cleanKey, status: 'valid' };
            validCount++;
          } else {
            updated[i] = { ...updated[i], key: cleanKey, status: 'invalid' };
          }
        } catch {
          updated[i] = { ...updated[i], key: cleanKey, status: 'unchecked' };
        }
      }
      setCustomApiKeys(updated);
      const nonEmpty = updated.filter((k) => k.key.trim().length > 0);
      localStorage.setItem(GEMINI_KEYS_STORAGE, JSON.stringify(nonEmpty));
      window.dispatchEvent(new CustomEvent('wappy-keys-updated'));
      setKeyValidationMsg(
        nonEmpty.length === 0
          ? 'Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.'
          : `¡Guardadas ${nonEmpty.length} clave(s) (${validCount} verificada(s) en vivo con Google Gemini)!`,
      );
    } finally {
      setIsValidatingKeys(false);
    }
  };

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

  /** Carga un podcast ya subido/creado en el Estudio de Edición para editar su título, guion o volver a sintetizarlo. */
  const handleEditLibraryAudio = async (item: LibraryItem) => {
    setEditingLibraryItemId(item.id);
    setActivePodcastEpisodeTitle(item.title || 'Podcast SST');
    if (item.scriptText) {
      setScriptText(item.scriptText);
    }
    if (item.stylePrompt) {
      setStylePrompt(item.stylePrompt);
    }
    if (item.voiceName && item.voiceName.includes('+')) {
      const parts = item.voiceName.split('+').map((s) => s.trim());
      setMultiSpeaker(true);
      if (parts[0]) setSpeaker1Voice(parts[0]);
      if (parts[1]) setSpeaker2Voice(parts[1]);
    } else if (item.voiceName) {
      setMultiSpeaker(false);
      setSelectedVoice(item.voiceName);
    }
    await openLibraryAudio(item, false);
    handleTabChange('tts');
    setStatusBanner({
      type: 'info',
      text: `✏️ Editando podcast "${item.title}". Modifica el título o el guion abajo y pulsa "Guardar Cambios" o "Re-Sintetizar Podcast".`,
    });
    setTimeout(() => {
      const editorEl = document.getElementById(
        'wappy-studio-tts-editor',
      ) as HTMLTextAreaElement | null;
      if (editorEl) {
        editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          editorEl.focus({ preventScroll: true });
          editorEl.classList.add('ring-4', 'ring-[#c7f303]', 'border-[#c7f303]');
          setTimeout(() => {
            editorEl.classList.remove('ring-4', 'ring-[#c7f303]', 'border-[#c7f303]');
          }, 1800);
        }, 350);
      }
    }, 80);
  };

  /** Guarda los cambios de título y guion sobre el podcast existente sin necesidad de esperar nueva síntesis, o prepáralo para re-síntesis. */
  const handleSaveEditedLibraryMetadata = () => {
    if (!editingLibraryItemId) return;
    const cleanTitle = (activePodcastEpisodeTitle || '').trim() || 'Podcast SST Editado';
    const cleanWords = scriptText.trim().split(/\s+/).filter(Boolean).length;
    const effVoice = multiSpeaker ? `${speaker1Voice} + ${speaker2Voice}` : selectedVoice;
    setLibraryItems((prev) =>
      prev.map((it) =>
        it.id === editingLibraryItemId
          ? {
              ...it,
              title: cleanTitle,
              scriptText,
              stylePrompt,
              voiceName: effVoice,
              wordCount: cleanWords,
            }
          : it,
      ),
    );
    setCurrentAudio((prev) =>
      prev ? { ...prev, title: cleanTitle, scriptText, voiceName: effVoice } : prev,
    );
    setStatusBanner({
      type: 'success',
      text: `✅ Cambios guardados en el podcast "${cleanTitle}". Si modificaste el texto y deseas actualizar la voz, pulsa "Generar Podcast Completo".`,
    });
  };

  // En modo podcastOnly, cargar automáticamente el último podcast guardado en el Walkman al iniciar para que PLAY, -10s y +10s estén listos de inmediato
  const autoLoadedInitialPodcastRef = useRef(false);
  useEffect(() => {
    if (!podcastOnly || autoLoadedInitialPodcastRef.current || currentAudio) return;
    const firstAudio = libraryItems.find((i) => i.kind !== 'video');
    if (firstAudio) {
      autoLoadedInitialPodcastRef.current = true;
      openLibraryAudio(firstAudio, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastOnly, libraryItems]);

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
    const googleEnvModels = (endpointsConfig?.[EModelEndpoint.google] as any)?.models;
    if (Array.isArray(googleEnvModels) && googleEnvModels.length > 0) {
      const envTtsIds = googleEnvModels
        .map((m: any) =>
          (typeof m === 'string' ? m : m?.id || m?.value || '').replace('models/', '').trim(),
        )
        .filter((id: string) => id && id.includes('tts'));

      if (envTtsIds.length > 0) {
        setModels((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          const baseIds = Object.keys(DEFAULT_STUDIO_TTS_MODELS);
          const mergedIds = Array.from(new Set([...baseIds, ...envTtsIds]));
          return mergedIds.map(
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
    const safeTab: StudioTab = podcastOnly && tab === 'video' ? 'tts' : tab;
    setActiveTab(safeTab);
    setSearchParams({ tab: safeTab });
  };

  useEffect(() => {
    if (podcastOnly && activeTab === 'video') {
      setActiveTab('tts');
    }
  }, [podcastOnly, activeTab]);

  // Permite que la landing portable (/wappystudio y /wappypodcast) cambie de pestaña desde su navbar
  useEffect(() => {
    const onExternalTab = (e: Event) => {
      const tab = (e as CustomEvent).detail as StudioTab;
      if (['tts', 'video', 'lab', 'library'].includes(tab)) handleTabChange(tab);
    };
    window.addEventListener('wappy-studio-switch-tab', onExternalTab);
    return () => window.removeEventListener('wappy-studio-switch-tab', onExternalTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastOnly]);

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

  const handleSynthesizePreview = async (override?: {
    script?: string;
    title?: string;
    multiSpeaker?: boolean;
    voiceName?: string;
    speaker1Voice?: string;
    speaker2Voice?: string;
    stylePrompt?: string;
  }) => {
    const rawScript = (override?.script ?? scriptText).trim();
    if (!rawScript) return;
    const snippet = rawScript.slice(0, 850);
    const snippetWords = snippet.split(/\s+/).filter(Boolean).length;
    const estSeconds = Math.max(3, Math.round((snippetWords / 145) * 60));
    const previewJobId = `preview_${Date.now()}`;
    const effMulti = override?.multiSpeaker ?? multiSpeaker;
    const effVoice = override?.voiceName || selectedVoice;
    const effSpk1 = override?.speaker1Voice || speaker1Voice;
    const effSpk2 = override?.speaker2Voice || speaker2Voice;
    const effStyle = override?.stylePrompt ?? stylePrompt;
    const effTitle =
      override?.title ||
      (podcastOnly && activePodcastEpisodeTitle
        ? `${activePodcastEpisodeTitle}`
        : `Cápsula: ${snippet.replace(/<[^>]+>/g, '').slice(0, 38)}...`);
    try {
      setIsPreviewing(true);
      setStatusBanner(null);
      setActiveJob({
        id: previewJobId,
        status: 'processing',
        totalChunks: 1,
        currentChunkIndex: 0,
        completedChunks: 0,
        estimatedTotalSeconds: estSeconds,
        generatedTotalSeconds: 0,
        progressPercent: 0,
        chunks: [{ index: 0, wordCount: snippetWords, status: 'processing' }],
      });
      const resp = await fetch('/api/studio/tts/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: snippet,
          voiceName: effVoice,
          stylePrompt: effStyle,
          model: selectedModel,
          multiSpeaker: effMulti,
          speaker1: { name: 'Alex', voiceName: effSpk1 },
          speaker2: { name: 'Sam', voiceName: effSpk2 },
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al sintetizar vista previa.');
      }
      const previewUrl = `data:audio/wav;base64,${data.audioBase64}`;
      setActiveJob({
        id: previewJobId,
        status: 'completed',
        totalChunks: 1,
        currentChunkIndex: 0,
        completedChunks: 1,
        estimatedTotalSeconds: estSeconds,
        generatedTotalSeconds: data.durationSeconds || estSeconds,
        progressPercent: 100,
        downloadUrl: previewUrl,
        chunks: [
          {
            index: 0,
            wordCount: snippetWords,
            status: 'completed',
            durationSeconds: data.durationSeconds,
            audioBase64: data.audioBase64,
          },
        ],
      });
      setCurrentAudio({
        base64: data.audioBase64,
        title: effTitle,
        durationSeconds: data.durationSeconds,
        voiceName: effMulti ? `${effSpk1} + ${effSpk2}` : effVoice,
        scriptText: snippet,
      });
      const newItem: LibraryItem = {
        id: Date.now().toString(),
        title: effTitle,
        createdAt: Date.now(),
        voiceName: effMulti ? `${effSpk1} + ${effSpk2}` : effVoice,
        model: data.usedModel || selectedModel,
        durationSeconds: data.durationSeconds,
        wordCount: snippetWords,
        stylePrompt: effStyle,
        scriptText: snippet,
      };
      const previewKey = await saveAudioToLibrary(newItem, { base64: data.audioBase64 });
      if (previewKey) {
        setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: previewKey } : prev));
      }
      setStatusBanner({
        type: 'success',
        text: podcastOnly
          ? `¡Cápsula "${effTitle}" sintetizada en 24kHz WAV y cargada en el Walkman y en tu Carrusel de Cápsulas!`
          : 'Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video.',
      });
    } catch (err: any) {
      setActiveJob((prev) =>
        prev ? { ...prev, status: 'failed', error: err.message || 'Error sintetizando fragmento.' } : null,
      );
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

  const handleStartFullJob = async (override?: {
    script?: string;
    title?: string;
    multiSpeaker?: boolean;
    voiceName?: string;
    speaker1Voice?: string;
    speaker2Voice?: string;
    stylePrompt?: string;
  }) => {
    const effScript = (override?.script ?? scriptText).trim();
    if (!effScript) return;
    const effMulti = override?.multiSpeaker ?? multiSpeaker;
    const effVoice = override?.voiceName || selectedVoice;
    const effSpk1 = override?.speaker1Voice || speaker1Voice;
    const effSpk2 = override?.speaker2Voice || speaker2Voice;
    const effStyle = override?.stylePrompt ?? stylePrompt;
    const effVoiceLabel = effMulti ? `${effSpk1} + ${effSpk2}` : effVoice;
    const effTitle =
      override?.title ||
      (podcastOnly && activePodcastEpisodeTitle
        ? activePodcastEpisodeTitle.trim()
        : `Audio Completo: ${effScript.replace(/<[^>]+>/g, '').slice(0, 38)}...`);
    const effWordCount = effScript.split(/\s+/).filter(Boolean).length;
    const targetEditId = editingLibraryItemId;

    try {
      setStatusBanner(null);
      if (sseRef.current) {
        sseRef.current.close();
      }
      const resp = await fetch('/api/studio/tts/jobs', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: effScript,
          voiceName: effVoice,
          stylePrompt: effStyle,
          model: selectedModel,
          multiSpeaker: effMulti,
          speaker1: { name: 'Alex', voiceName: effSpk1 },
          speaker2: { name: 'Sam', voiceName: effSpk2 },
          maxWordsPerChunk: wordsPerChunk,
          customKeys: activeUserGeminiKeys,
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
          title: effTitle,
          durationSeconds: d.totalDurationSeconds,
          voiceName: effVoiceLabel,
          scriptText: effScript,
        });
        const newItem: LibraryItem = {
          id: targetEditId || d.id,
          title: effTitle,
          createdAt: Date.now(),
          voiceName: effVoiceLabel,
          model: selectedModel,
          durationSeconds: d.totalDurationSeconds,
          wordCount: effWordCount,
          downloadUrl: d.downloadUrl,
          stylePrompt: effStyle,
          scriptText: effScript,
        };
        // Descargar el WAV maestro del servidor (vive solo en RAM) y guardarlo en IndexedDB
        saveAudioToLibrary(newItem, { url: d.downloadUrl }).then((key) => {
          if (key) setCurrentAudio((prev) => (prev ? { ...prev, mediaKey: key } : prev));
        });
        setEditingLibraryItemId(null);
        setStatusBanner({
          type: 'success',
          text: `🎉 Podcast completo "${effTitle}" (${Math.round((d.totalDurationSeconds || 0) / 6) / 10} min) ensamblado en 24kHz WAV y cargado en tu Walkman y Carrusel de Cápsulas.`,
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

      const handleFailoverEvent = (ev: MessageEvent) => {
        try {
          const d = JSON.parse(ev.data);
          setActiveJob((prev) =>
            prev
              ? {
                  ...prev,
                  failoverNotice:
                    d.message ||
                    (d.label
                      ? `Salto automático a ${d.label} (${d.reason || '429'})`
                      : 'Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.'),
                }
              : null,
          );
        } catch {
          /* ignore */
        }
      };
      es.addEventListener('key_failover', handleFailoverEvent);
      es.addEventListener('api_key_failover', handleFailoverEvent);
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Error iniciando trabajo.' });
    }
  };

  const activeUserGeminiKeys = useMemo(
    () => customApiKeys.map((k) => k.key.trim()).filter((k) => k.length > 15),
    [customApiKeys],
  );

  const handleEnhanceScriptWithAi = async () => {
    try {
      setIsEnhancingScript(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/script/enhance', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          text: scriptText,
          scriptText,
          stylePrompt,
          multiSpeaker,
          podcastOnly,
          minMinutes: podcastOnly ? 5 : 0,
          episodeTitle: activePodcastEpisodeTitle,
          modelName: selectedAiModel,
          customKeys: activeUserGeminiKeys,
        }),
      });
      const data = await parseStudioJson(resp);
      const enhancedResult = data.scriptText || data.text;
      if (!resp.ok || !data.success || !enhancedResult) {
        throw new Error(data.error || 'No se pudo mejorar el guion con IA.');
      }
      setScriptText(enhancedResult);
      setStatusBanner({
        type: 'success',
        text: podcastOnly
          ? `¡Guion de Podcast expandido y enriquecido a +5 minutos con expresiones vocales (<breath>, <laugh>) usando ${data.usedModel || data.model || selectedAiModel}!`
          : `¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${data.usedModel || data.model || selectedAiModel}!`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Error mejorando el guion con IA.',
      });
    } finally {
      setIsEnhancingScript(false);
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
    customScript?: string,
    customDur?: number,
    customAudioBase64?: string,
    overrideTheme?: string,
    overrideEffects?: string[],
    overrideHeadline?: string,
    overrideBadge?: string,
  ) => {
    const effectiveScriptText = customScript ?? (currentAudio?.scriptText || scriptText);
    const effectiveDur = Math.max(
      5,
      Math.round(customDur ?? (currentAudio?.durationSeconds || videoDuration || 28)),
    );
    const effectiveTheme = overrideTheme || selectedArtDirection;
    const effectiveEffects = overrideEffects || selectedSkillEffects;
    const effectiveHeadline = overrideHeadline ?? headlineOverlayText;
    const effectiveBadge = overrideBadge ?? badgeOverlayText;

    setHtmlCode(
      buildDefaultHtmlComposition({
        aspectRatio: nextRatio,
        hasBaseVideo: nextHasVideo,
        badgeText: effectiveBadge,
        headline: effectiveHeadline,
        subheadline: subheadlineOverlayText,
        accentColor,
        templateId: nextTemplateId,
        scriptText: effectiveScriptText,
        durationSeconds: effectiveDur,
      }),
    );

    // Si no es superposición de cámara transparente, compilar en milisegundos el Motor Maestro 60-FPS de Antigravity (Three.js WappyAvatarVoxel3D + 7 Arquetipos)
    if (nextTemplateId !== 'camera-overlay' && !nextHasVideo) {
      fetch('/api/studio/video/compile-master-reel', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          scriptText: effectiveScriptText,
          scriptSteps: aiScenesBreakdownRef.current || scriptSteps,
          headline: effectiveHeadline,
          headlineText: effectiveHeadline,
          badgeText: effectiveBadge,
          subtitleText: subheadlineOverlayText,
          accentColor,
          theme: effectiveTheme,
          effects: effectiveEffects,
          aspectRatio: nextRatio,
          hasBaseVideo: nextHasVideo,
          showSubtitles: showDynamicSubtitles,
          durationSeconds: effectiveDur,
          companyName: user?.name || 'WAPPY IA',
          audioBase64: customAudioBase64 || currentAudio?.base64 || undefined,
        }),
      })
        .then((r) => parseStudioJson(r))
        .then((d) => {
          if (d?.success && d.htmlCode) {
            setHtmlCode(d.htmlCode);
          }
        })
        .catch(() => {});
    }
  };

  // Al entrar a la pestaña de Video por primera vez con plantilla WAPPY, activar el Motor Maestro 60-FPS de Antigravity
  const hasBootstrappedMasterReelRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'video' && !hasBootstrappedMasterReelRef.current) {
      hasBootstrappedMasterReelRef.current = true;
      handleRebuildDefaultTemplate(
        aspectRatio,
        Boolean(baseVideoUrl),
        selectedSceneTemplate,
        currentAudio?.scriptText || scriptText,
        currentAudio?.durationSeconds || videoDuration || 28,
        currentAudio?.base64,
      );
    }
  }, [activeTab]);

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
      // Si el lienzo usa una plantilla WAPPY, reconstruir las escenas con el guion, duración exacta y silencios reales del WAV
      if (htmlCode.includes('data-wappy-template="true"')) {
        handleRebuildDefaultTemplate(
          aspectRatio,
          Boolean(baseVideoUrl),
          selectedSceneTemplate,
          textToRead,
          data.durationSeconds,
          data.audioBase64,
        );
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
        text: `¡Locución neural (${selectedVoice} • ${data.durationSeconds}s) sincronizada al milisegundo con el Motor Maestro 60-FPS + Avatar 3D!`,
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

  const toggleSkillEffect = (effectId: string) => {
    setSelectedSkillEffects((prev) =>
      prev.includes(effectId) ? prev.filter((id) => id !== effectId) : [...prev, effectId],
    );
  };

  const computeScriptStepsFromText = (
    rawText: string,
    targetDurSeconds?: number,
    effectIds: string[] = selectedSkillEffects,
  ): ScriptStepScene[] => {
    const dur = Math.max(
      8,
      Math.round(targetDurSeconds || currentAudio?.durationSeconds || videoDuration || 24),
    );
    const map = computeClientScriptTimelineMap(rawText, dur);
    const activeEffectLabels = effectIds
      .map((id) => ANTIGRAVITY_EFFECTS_CATALOG.find((e) => e.id === id)?.label)
      .filter(Boolean) as string[];
    const fallbackEffects =
      activeEffectLabels.length > 0
        ? activeEffectLabels
        : ANTIGRAVITY_EFFECTS_CATALOG.map((e) => e.label);

    return map.beats.map((b, idx) => {
      const startLabel = idx === 0 ? '0.0s' : `${b.startSec.toFixed(1)}s`;
      const endLabel =
        idx === 0 && b.endSec < 2.2
          ? '2.0s'
          : `${Math.max(b.startSec + 1.5, b.endSec).toFixed(1)}s`;
      const pausePrefix = idx > 0 && !b.text.includes('[pausa') ? '[pausa 0.5s] ' : '';
      const breathSuffix = !b.text.includes('<breath>') ? ' <breath>' : '';
      return {
        id: `step-${Date.now()}-${idx}`,
        timeRange: `${startLabel}-${endLabel}`,
        title:
          idx === 0
            ? 'Portada Magnética (2s)'
            : `${b.titleLead} ${b.titleHighlight}`.trim() || `Escena 0${idx + 1}`,
        narration: `${pausePrefix}${b.text}${breathSuffix}`.trim(),
        visualEffect:
          idx === 0
            ? '19 Portada Magnética (2s)'
            : fallbackEffects[idx % fallbackEffects.length] || '07 Zoom-Through',
      };
    });
  };

  // Mantener la escaleta sincronizada automáticamente cada vez que cambia el guion principal
  useEffect(() => {
    const cleanScript = (scriptText || '').trim();
    if (!cleanScript || cleanScript === lastAutoStructuredScriptRef.current) return;
    lastAutoStructuredScriptRef.current = cleanScript;
    aiScenesBreakdownRef.current = null;
    const nextSteps = computeScriptStepsFromText(cleanScript);
    setScriptSteps(nextSteps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptText]);

  const handleAutoStructureScriptSteps = () => {
    const dur = Math.max(8, Math.round(currentAudio?.durationSeconds || videoDuration || 24));
    const nextSteps = computeScriptStepsFromText(scriptText, dur, selectedSkillEffects);
    lastAutoStructuredScriptRef.current = (scriptText || '').trim();
    aiScenesBreakdownRef.current = null;
    setScriptSteps(nextSteps);
    setStatusBanner({
      type: 'success',
      text: `¡Guion estructurado en ${nextSteps.length} escenas con tiempos (${dur}s), pausas y efectos de las Skills de Antigravity!`,
    });
  };

  const applyScriptStepsToScriptText = () => {
    if (!Array.isArray(scriptSteps) || scriptSteps.length === 0) return;
    const joined = scriptSteps
      .map((s) => (s.narration || '').replace(/\[pausa\s+[\d.]+s\]/gi, '<breath>').trim())
      .filter(Boolean)
      .join('\n\n');
    if (joined) {
      lastAutoStructuredScriptRef.current = joined.trim();
      setScriptText(joined);
      setStatusBanner({
        type: 'success',
        text: '¡Escenas y pausas sincronizadas con el Guion Principal!',
      });
    }
  };

  const buildLocalSuperPromptText = (stepsOverride?: ScriptStepScene[]) => {
    const dur = Math.max(6, Math.round(currentAudio?.durationSeconds || videoDuration || 24));
    const artObj =
      ANTIGRAVITY_ART_DIRECTIONS.find((a) => a.id === selectedArtDirection) ||
      ANTIGRAVITY_ART_DIRECTIONS[0];
    const effectNames = selectedSkillEffects
      .map((id) => ANTIGRAVITY_EFFECTS_CATALOG.find((e) => e.id === id)?.label || id)
      .join(', ');
    const effectiveSteps =
      Array.isArray(stepsOverride) && stepsOverride.length > 0
        ? stepsOverride
        : Array.isArray(scriptSteps) && scriptSteps.length > 0
          ? scriptSteps
          : computeScriptStepsFromText(scriptText, dur, selectedSkillEffects);
    const stepsSummary = effectiveSteps
      .map(
        (s, i) =>
          `• Escena ${i + 1} (${s.timeRange}) [${s.visualEffect}] — "${s.title}": ${s.narration}`,
      )
      .join('\n');

    return [
      `[SUPER-PROMPT OFICIAL ANTIGRAVITY 60-FPS • SISTEMA DE LAS 7 PIEZAS WAPPY IA]`,
      `1. FORMATO Y DURACIÓN: ${aspectRatio === '9:16' ? 'Vertical 9:16 (1080x1920 Reels/TikTok/WhatsApp)' : 'Horizontal 16:9 (1920x1080 YouTube/LMS)'} • Duración sincronizada al audio: ${dur}s (${currentAudio ? `Voz activa: ${currentAudio.voiceName || selectedVoice}` : `Voz seleccionada: ${selectedVoice}`}).`,
      `2. DIRECCIÓN DE ARTE (${artObj.label}): Paleta ${artObj.colors} • Insignia: "${badgeOverlayText}" • Titular: "${headlineOverlayText}" • Subtítulo: "${subheadlineOverlayText}" • Color de Acento: ${accentColor}.`,
      `3. EFECTOS DE SKILLS ANTIGRAVITY ACTIVOS (${selectedSkillEffects.length} FX): ${effectNames || '19 Portada Magnética (2s), Avatar 3D Lip-Sync, 07 Zoom-Through, 13 Checklist SST'}.`,
      `4. ESCALETA SEGUNDO A SEGUNDO Y PAUSAS SINCRONIZADAS CON LA VOZ:`,
      stepsSummary || `• 0.0s-${dur}s: ${scriptText.slice(0, 360)}`,
      `5. REGLAS TÉCNICAS: Incluir de 0.0s a 2.0s la Miniatura/Portada Magnética con titular e insignias clave, sincronizar transiciones GSAP con window.mainTimeline y el reloj de voz, mantener última escena visible al cierre y cero desbordes de texto.`,
    ].join('\n');
  };

  // PASO 1: Generar Super-Prompt Maestro con IA Gemini + Antigravity (usando toda la información recolectada)
  const handleBuildAntigravitySuperPrompt = async () => {
    try {
      setIsGeneratingSuperPrompt(true);
      setStatusBanner(null);
      const dur = Math.max(6, Math.round(currentAudio?.durationSeconds || videoDuration || 24));
      const syncedSteps =
        Array.isArray(scriptSteps) && scriptSteps.length > 0
          ? scriptSteps
          : computeScriptStepsFromText(scriptText, dur, selectedSkillEffects);
      const localPrompt = buildLocalSuperPromptText(syncedSteps);

      // Si el usuario escribió una nota o instrucción libre en el cuadro de texto (distinta al placeholder inicial o un Super-Prompt previo), enviarla a la IA
      const defaultPlaceholder =
        'Crea una animación cinematográfica con el Motor Antigravity 60-FPS y tarjetas de cristal WAPPY IA sobre las 5 reglas de oro de riesgo eléctrico, con Portada Magnética (2s), Avatar 3D lip-sync, iconos luminosos y barras de progreso.';
      const trimmedPromptInput = (aiScenePrompt || '').trim();
      const customUserDirective =
        trimmedPromptInput &&
        trimmedPromptInput !== defaultPlaceholder &&
        !trimmedPromptInput.startsWith('[SUPER-PROMPT')
          ? trimmedPromptInput
          : '';

      try {
        const resp = await fetch('/api/studio/antigravity/super-prompt', {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            scriptText,
            scriptSteps: syncedSteps,
            aspectRatio,
            durationSeconds: dur,
            badgeText: badgeOverlayText,
            headlineText: headlineOverlayText,
            subtitleText: subheadlineOverlayText,
            accentColor,
            artDirection: selectedArtDirection,
            selectedEffects: selectedSkillEffects,
            voiceName: currentAudio?.voiceName || selectedVoice,
            stylePrompt,
            userPrompt: customUserDirective,
            modelName: selectedAiModel,
            antigravityApiKey: antigravityBridgeKey,
            customKeys: activeUserGeminiKeys,
          }),
        });
        if (resp.ok) {
          const data = await parseStudioJson(resp);
          if (data?.success && data.superPrompt) {
            setAiScenePrompt(data.superPrompt);
            if (Array.isArray(data.scriptSteps) && data.scriptSteps.length > 0) {
              setScriptSteps(data.scriptSteps);
            }
            if (Array.isArray(data.scenesBreakdown) && data.scenesBreakdown.length > 0) {
              aiScenesBreakdownRef.current = data.scenesBreakdown;
            }
            const modelBadge = data.usedModel || 'Gemini IA';
            setLastSuperPromptAiModel(modelBadge);
            setStatusBanner({
              type: 'success',
              text: `¡Paso 1 completado con ${modelBadge}! Super-Prompt Maestro (Sistema de las 7 Piezas) y escaleta enriquecida generados con tu guion, dirección de arte (${selectedArtDirection}) y ${selectedSkillEffects.length} efectos. Ahora pulsa el Paso 2.`,
            });
            return;
          }
        }
      } catch {
        /* Fallback inmediato al Super-Prompt determinista local */
      }

      setAiScenePrompt(localPrompt);
      setStatusBanner({
        type: 'success',
        text: '¡Paso 1 completado! Super-Prompt estructurado con tus escenas, tiempos, pausas y efectos de las Skills de Antigravity. Ahora pulsa el Paso 2.',
      });
    } finally {
      setIsGeneratingSuperPrompt(false);
    }
  };

  // PASO 2: Enviar Super-Prompt + Audio + Escenas IA al Generador de Video (Antigravity)
  const handleGenerateHtmlWithAi = async () => {
    try {
      setIsGeneratingHtmlAi(true);
      setStatusBanner(null);
      const effectivePrompt = (aiScenePrompt || '').trim() || buildLocalSuperPromptText();
      if (!aiScenePrompt.trim()) {
        setAiScenePrompt(effectivePrompt);
      }
      const audioBase64 = await resolveCurrentAudioBase64();
      const targetDuration = Math.max(
        6,
        Math.round(currentAudio?.durationSeconds || videoDuration || 25),
      );
      const resp = await fetch('/api/studio/video/generate-html', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          prompt: effectivePrompt,
          scriptText,
          scriptSteps,
          scenesBreakdown: aiScenesBreakdownRef.current || scriptSteps,
          aspectRatio,
          theme: selectedArtDirection,
          effects: selectedSkillEffects,
          badgeText: badgeOverlayText,
          headlineText: headlineOverlayText,
          subtitleText: subheadlineOverlayText,
          accentColor,
          hasBaseVideo: Boolean(baseVideoUrl),
          showSubtitles: showDynamicSubtitles,
          durationSeconds: targetDuration,
          companyName: user?.name || 'WAPPY IA',
          modelName: selectedAiModel,
          audioBase64: audioBase64 || undefined,
          antigravityApiKey: antigravityBridgeKey,
          customKeys: activeUserGeminiKeys,
        }),
      });
      const data = await parseStudioJson(resp);
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error generando composición HTML con Antigravity.');
      }
      if (data.timelineMap?.totalDurationSeconds && data.timelineMap.totalDurationSeconds > 2) {
        setVideoDuration(data.timelineMap.totalDurationSeconds);
      }
      latestEditedHtmlRef.current = '';
      setHtmlCode(data.htmlCode);
      // Guardar automáticamente en la Biblioteca (tenga o no tenga audio)
      await saveVideoProjectToLibrary({ htmlOverride: data.htmlCode }, true);
      setVideoCurrentTime(0);
      setIsVideoPlaying(true);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_RESTART' }, '*');
        stageAudioRef.current?.play().catch(() => {});
        baseVideoRef.current?.play().catch(() => {});
      }, 140);
      setStatusBanner({
        type: 'success',
        text: '¡Paso 2 completado! Video HTML 60-FPS generado con tu Super-Prompt, Dirección de Arte y Efectos, cargado en el Lienzo en sincronía con el audio y guardado en tu Biblioteca.',
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'No se pudo generar la escena HTML con Antigravity.',
      });
    } finally {
      setIsGeneratingHtmlAi(false);
    }
  };

  // PASO 3: Enviar Correcciones a Antigravity sobre el HTML en pantalla
  const handleSendCorrectionsToAntigravity = async () => {
    if (!videoCorrectionPrompt.trim()) {
      setStatusBanner({
        type: 'info',
        text: 'Escribe primero qué detalle deseas corregir o ajustar en el video HTML (colores, textos, tamaños, efectos o tiempos).',
      });
      return;
    }
    try {
      setIsApplyingCorrection(true);
      setStatusBanner(null);
      const audioBase64 = await resolveCurrentAudioBase64();
      const targetDuration = Math.max(
        6,
        Math.round(currentAudio?.durationSeconds || videoDuration || 25),
      );
      const currentHtml = latestEditedHtmlRef.current || htmlCode;
      let updatedHtml = '';

      try {
        const editResp = await fetch('/api/studio/antigravity/edit-html', {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            currentHtml,
            correctionPrompt: videoCorrectionPrompt.trim(),
            superPrompt: aiScenePrompt,
            scriptText,
            scriptSteps,
            aspectRatio,
            durationSeconds: targetDuration,
            badgeText: badgeOverlayText,
            headlineText: headlineOverlayText,
            subtitleText: subheadlineOverlayText,
            accentColor,
            theme: selectedArtDirection,
            effects: selectedSkillEffects,
            modelName: selectedAiModel,
            audioBase64: audioBase64 || undefined,
            antigravityApiKey: antigravityBridgeKey,
            customKeys: activeUserGeminiKeys,
          }),
        });
        if (editResp.ok) {
          const editData = await parseStudioJson(editResp);
          if (editData?.success && editData.htmlCode) {
            updatedHtml = editData.htmlCode;
            if (
              editData.timelineMap?.totalDurationSeconds &&
              editData.timelineMap.totalDurationSeconds > 2
            ) {
              setVideoDuration(editData.timelineMap.totalDurationSeconds);
            }
          }
        }
      } catch {
        /* Fallback al motor maestro generate-html con la corrección inyectada */
      }

      if (!updatedHtml) {
        const combinedPrompt = `${aiScenePrompt}\n\n[CORRECCIÓN OBLIGATORIA SOLICITADA POR EL USUARIO SOBRE EL LIENZO ACTUAL]: ${videoCorrectionPrompt.trim()}`;
        const genResp = await fetch('/api/studio/video/generate-html', {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            prompt: combinedPrompt,
            scriptText,
            scriptSteps,
            scenesBreakdown: aiScenesBreakdownRef.current || scriptSteps,
            aspectRatio,
            theme: selectedArtDirection,
            effects: selectedSkillEffects,
            badgeText: badgeOverlayText,
            headlineText: headlineOverlayText,
            subtitleText: subheadlineOverlayText,
            accentColor,
            hasBaseVideo: Boolean(baseVideoUrl),
            showSubtitles: showDynamicSubtitles,
            durationSeconds: targetDuration,
            companyName: user?.name || 'WAPPY IA',
            modelName: selectedAiModel,
            audioBase64: audioBase64 || undefined,
            antigravityApiKey: antigravityBridgeKey,
            customKeys: activeUserGeminiKeys,
          }),
        });
        const genData = await parseStudioJson(genResp);
        if (!genResp.ok || !genData.success || !genData.htmlCode) {
          throw new Error(genData.error || 'No se pudieron aplicar las correcciones al HTML.');
        }
        updatedHtml = genData.htmlCode;
      }

      latestEditedHtmlRef.current = '';
      setHtmlCode(updatedHtml);
      await saveVideoProjectToLibrary({ htmlOverride: updatedHtml }, true);
      setVideoCurrentTime(0);
      setIsVideoPlaying(true);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_RESTART' }, '*');
        stageAudioRef.current?.play().catch(() => {});
        baseVideoRef.current?.play().catch(() => {});
      }, 140);
      setStatusBanner({
        type: 'success',
        text: '¡Paso 3 completado! Correcciones aplicadas por Antigravity sobre el HTML manteniendo la sincronía con el audio y actualizadas en la Biblioteca.',
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Error aplicando correcciones con Antigravity.',
      });
    } finally {
      setIsApplyingCorrection(false);
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

  // Reloj maestro de reproducción a 120ms para que el botón Play/Pause, la línea de tiempo GSAP
  // y los subtítulos ponderados por sílabas y pausas avancen en perfecta sincronía con la voz
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
        const curT = audioEl.currentTime;
        const durT =
          audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 1
            ? audioEl.duration
            : Math.max(1, videoDuration || 20);
        setVideoCurrentTime(curT);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'STUDIO_SYNC_TIME', currentTime: curT, duration: durT, playing: true },
          '*',
        );
        return;
      }
      if (videoEl && baseVideoUrl && !videoEl.paused && !videoEl.ended) {
        const curT = videoEl.currentTime;
        const durT =
          videoEl.duration && !isNaN(videoEl.duration) && videoEl.duration > 1
            ? videoEl.duration
            : Math.max(1, videoDuration || 20);
        setVideoCurrentTime(curT);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'STUDIO_SYNC_TIME', currentTime: curT, duration: durT, playing: true },
          '*',
        );
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
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'STUDIO_SYNC_TIME', currentTime: next, duration: dur, playing: true },
          '*',
        );
        return next;
      });
    }, 120);

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

  // Cálculo de Subtítulos Dinámicos Ponderados por Sílabas y Pausas (Sincronización Real con la Voz)
  const scriptTimelineMap = useMemo(() => {
    const sourceText = currentAudio?.scriptText || scriptText || '';
    return computeClientScriptTimelineMap(sourceText, Math.max(4, videoDuration || 25));
  }, [currentAudio?.scriptText, scriptText, videoDuration]);

  const cleanSubtitleWords = useMemo(
    () => scriptTimelineMap.wordTimings.map((w) => w.word),
    [scriptTimelineMap],
  );

  const currentSubtitleWindow = useMemo(() => {
    if (!showDynamicSubtitles || cleanSubtitleWords.length === 0) return null;
    const progress = Math.max(0, Math.min(0.9999, videoCurrentTime / Math.max(1, videoDuration)));
    const timings = scriptTimelineMap.wordTimings;
    let activeWordIndex = -1;
    for (let i = 0; i < timings.length; i++) {
      if (progress >= timings[i].startPct && progress <= timings[i].endPct) {
        activeWordIndex = i;
        break;
      }
    }
    if (activeWordIndex === -1) {
      activeWordIndex = Math.min(
        cleanSubtitleWords.length - 1,
        Math.floor(progress * cleanSubtitleWords.length),
      );
    }
    const windowSize = 5;
    const windowStart = Math.floor(activeWordIndex / windowSize) * windowSize;
    const slice = cleanSubtitleWords.slice(windowStart, windowStart + windowSize);
    return {
      words: slice,
      activeOffset: activeWordIndex - windowStart,
    };
  }, [showDynamicSubtitles, cleanSubtitleWords, scriptTimelineMap, videoCurrentTime, videoDuration]);

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
          antigravityApiKey: antigravityBridgeKey,
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
    let html = rawHtml.replace(/subtitles\.reverse\(\)/g, 'subtitles.slice().reverse()');
    const escapeInlineScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');
    const fetchText = async (url: string) => {
      try {
        const r = await fetch(url, { cache: 'force-cache' });
        return r.ok ? await r.text() : '';
      } catch {
        return '';
      }
    };
    const fetchDataUri = async (url: string) => {
      try {
        const r = await fetch(url, { cache: 'force-cache' });
        if (!r.ok) return '';
        const buf = await r.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
        }
        return `data:image/png;base64,${window.btoa(bin)}`;
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

    const [gsapCode, threeCode, tailwindCode, tenshiUri, felixUri, catLogoUri] = await Promise.all([
      /gsap(\.min)?\.js/i.test(html) ? fetchText('/assets/gsap.min.js') : Promise.resolve(''),
      /three(\.min)?\.js/i.test(html) ? fetchText('/assets/wappy/three.min.js') : Promise.resolve(''),
      /cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(html)
        ? fetchText('/assets/tailwind-cdn.js')
        : Promise.resolve(''),
      /tenshi\.png/i.test(html) ? fetchDataUri('/assets/wappy/tenshi.png') : Promise.resolve(''),
      /felix_avatar_3d\.png/i.test(html)
        ? fetchDataUri('/assets/wappy/felix_avatar_3d.png')
        : Promise.resolve(''),
      /wappy-cat-logo\.png/i.test(html)
        ? fetchDataUri('/assets/wappy/wappy-cat-logo.png')
        : Promise.resolve(''),
    ]);

    if (tenshiUri) {
      html = html.replace(
        /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,
        (_, q1, q2) => `${q1}${tenshiUri}${q2}`,
      );
    }
    if (felixUri) {
      html = html.replace(
        /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,
        (_, q1, q2) => `${q1}${felixUri}${q2}`,
      );
    }
    if (catLogoUri) {
      html = html.replace(
        /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,
        (_, q1, q2) => `${q1}${catLogoUri}${q2}`,
      );
    }

    // 2) Reemplazar scripts externos por código en línea (función de reemplazo para no interpretar '$')
    if (gsapCode) {
      html = html.replace(
        /<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,
        () => `<script id="wappy-inline-gsap">${escapeInlineScript(gsapCode)}</script>`,
      );
    }
    if (threeCode) {
      html = html.replace(
        /<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,
        () => `<script id="wappy-inline-three">${escapeInlineScript(threeCode)}</script>`,
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
  #subtitle-footer, #subtitle-card, #subtitle-container, #subtitle-box, footer[id*="subtitle"] { display: none !important; }
  #stage:not([data-wappy-master-reel="true"]) {
    padding-bottom: 112px !important;
    transform-origin: top center !important;
  }
  @media (max-height: 740px), (max-width: 480px) {
    #stage:not([data-wappy-master-reel="true"]) {
      padding: 12px 14px 108px 14px !important;
    }
    #stage:not([data-wappy-master-reel="true"]) h1 {
      font-size: clamp(1.25rem, 5vw, 1.65rem) !important;
      line-height: 1.15 !important;
    }
    #stage:not([data-wappy-master-reel="true"]) h2 {
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
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.92);backdrop-filter:blur(10px);border:1px solid rgba(199,243,3,0.45);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
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
  var wordTimings = ${JSON.stringify(scriptTimelineMap.wordTimings)};
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
    if (stage.getAttribute('data-wappy-master-reel') === 'true') {
      if (typeof window.__wappyFitViewport === 'function') {
        window.__wappyFitViewport();
      } else {
        var vw = window.innerWidth || 540;
        var vh = window.innerHeight || 960;
        var s = Math.min(vw / 1080, vh / 1920);
        stage.style.transform = 'scale(' + s.toFixed(5) + ')';
      }
      return;
    }
    stage.style.transform = 'none';
    var vh2 = window.innerHeight || document.documentElement.clientHeight || 700;
    var sh = stage.scrollHeight || stage.offsetHeight || vh2;
    if (sh > vh2 && vh2 > 240) {
      var scale = Math.max(0.72, Math.min(1, (vh2 - 16) / sh));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
    }
  }
  window.addEventListener('resize', fitMobileCapsule);
  window.addEventListener('orientationchange', function() { setTimeout(fitMobileCapsule, 150); });
  setTimeout(fitMobileCapsule, 120);

  function renderSubtitles(t) {
    if (!showSubs || !subBox || !words.length) return;
    var activeTimings = window.__wappyWordTimings || wordTimings;
    var p = Math.max(0, Math.min(0.9999, t / Math.max(1, duration)));
    var activeIdx = -1;
    for (var k = 0; k < activeTimings.length; k++) {
      if (p >= activeTimings[k].startPct && p <= activeTimings[k].endPct) {
        activeIdx = k;
        break;
      }
    }
    if (activeIdx === -1) {
      activeIdx = Math.min(words.length - 1, Math.floor(p * words.length));
    }
    var winSize = 5;
    var winStart = Math.floor(activeIdx / winSize) * winSize;
    var slice = words.slice(winStart, winStart + winSize);
    var activeOffset = activeIdx - winStart;
    subBox.innerHTML = slice.map(function(w, i) {
      if (i === activeOffset) {
        return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:900;text-transform:uppercase;color:#080c04;background:#c7f303;padding:2px 7px;border-radius:6px;box-shadow:0 0 12px rgba(199,243,3,0.45);">' + w + '</span>';
      }
      return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.95);">' + w + '</span>';
    }).join(' ');
  }

  function syncTimelineToTime(t, isVoiceActive) {
    window.__wappyCurrentTime = t;
    window.__wappyVoicePlaying = Boolean(isVoiceActive);
    try {
      if (typeof window.__wappyRenderTick === 'function') {
        window.__wappyRenderTick(t, duration);
        return;
      }
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        var prog = Math.max(0, Math.min(0.9999, t / Math.max(0.5, duration)));
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / Math.max(0.5, duration));
        }
        if (Math.abs(window.mainTimeline.progress() - prog) > 0.015) {
          window.mainTimeline.progress(prog, false);
        }
      }
    } catch (e) {}
  }

  function updateUi(t) {
    currentTime = t;
    if (seekEl) seekEl.value = String(t);
    if (timeLabel) timeLabel.textContent = t.toFixed(1) + 's / ' + duration.toFixed(1) + 's';
    renderSubtitles(t);
  }

  function stopMasterTimeline() {
    window.__wappyVoicePlaying = false;
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
    window.__wappyVoicePlaying = true;
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.play();
      }
      if (window.mainTimeline) {
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / Math.max(0.5, duration));
        }
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
    syncTimelineToTime(0, true);
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
      if (audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 1) {
        duration = audioEl.duration;
        if (seekEl) seekEl.max = String(duration);
        syncTimelineToTime(audioEl.currentTime || 0, !audioEl.paused);
      }
    });
    audioEl.addEventListener('timeupdate', function() {
      syncTimelineToTime(audioEl.currentTime, !audioEl.paused && !audioEl.ended);
      updateUi(audioEl.currentTime);
    });
    audioEl.addEventListener('ended', function() {
      playing = false;
      stopMasterTimeline();
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(0.999, false);
      }
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
    if (audioEl && !audioEl.paused && !audioEl.ended) {
      syncTimelineToTime(audioEl.currentTime, true);
      updateUi(audioEl.currentTime);
      return;
    }
    var next = currentTime + 0.12;
    if (next >= duration) {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
      return;
    }
    syncTimelineToTime(next, true);
    updateUi(next);
  }, 120);

  if (btnPlay) {
    btnPlay.addEventListener('click', function() {
      if (tapOverlay) tapOverlay.style.display = 'none';
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
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(Math.max(0, Math.min(0.9999, val / Math.max(0.5, duration))), false);
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
    extra: { mp4Blob?: Blob; capsuleHtml?: string; htmlOverride?: string } = {},
    silent = true,
  ) => {
    try {
      const html = extra.htmlOverride || latestEditedHtmlRef.current || htmlCode;
      const audioRef = currentAudio?.mediaKey || activeStageAudioSrc || 'sin-audio';
      const signature = `${html.length}:${html.slice(-200)}:${audioRef}:${aspectRatio}`;
      const reuse =
        lastVideoProjectRef.current?.signature === signature &&
        libraryItems.some((x) => x.id === lastVideoProjectRef.current?.id);
      const id = reuse ? (lastVideoProjectRef.current as { id: string }).id : `video-${Date.now()}`;

      const htmlKey = `html-${id}`;
      await putMediaBlob(htmlKey, new Blob([html], { type: 'text/html' }));

      // Audio: reutilizar el de la biblioteca o guardar una copia (opcional: funciona con o sin audio)
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

      const titleSource = (currentAudio?.scriptText || scriptText || headlineOverlayText || 'Animación Antigravity')
        .replace(/<[^>]+>/g, '')
        .replace(/\[[^\]]+\]/g, '')
        .trim();
      setLibraryItems((prev) => {
        const existing = prev.find((x) => x.id === id);
        const item: LibraryItem = {
          ...(existing || {}),
          id,
          kind: 'video',
          title: existing?.title || `Video HTML ${aspectRatio}: ${titleSource.slice(0, 42)}...`,
          createdAt: existing?.createdAt || Date.now(),
          voiceName: mediaKey ? currentAudio?.voiceName || selectedVoice : 'Sin Audio (Solo HTML)',
          model: selectedAiModel,
          durationSeconds: Math.round((currentAudio?.durationSeconds || videoDuration || 20) * 10) / 10,
          wordCount: titleSource.split(/\s+/).filter(Boolean).length,
          scriptText: currentAudio?.scriptText || scriptText,
          stylePrompt: aiScenePrompt ? aiScenePrompt.slice(0, 180) : undefined,
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
          text: '¡Video HTML guardado en la Biblioteca! Puedes reabrirlo en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity.',
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: `No se pudo guardar el video en la Biblioteca: ${err?.message || 'error de almacenamiento'}`,
      });
    }
  };

  // ============================================================================
  // ENLACE PERSONAL ANTIGRAVITY (USUARIO wpy_... O VISITANTE wpy_guest_...) + SSE
  // ============================================================================
  const syncAntigravityBridgeKey = async (forceRefresh = false) => {
    try {
      const storedKey = localStorage.getItem('wappy_antigravity_bridge_key') || '';
      const resp = await fetch('/api/studio/antigravity/guest-key', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          guestKey: forceRefresh ? '' : storedKey,
        }),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const resolvedKey = String(data.apiKey || data.guestKey || data.key || '').trim();
        if (resolvedKey) {
          setAntigravityBridgeKey(resolvedKey);
          localStorage.setItem('wappy_antigravity_bridge_key', resolvedKey);
          return resolvedKey;
        }
      }
    } catch {
      /* Fallback local */
    }
    const existing = localStorage.getItem('wappy_antigravity_bridge_key') || '';
    if (existing && !forceRefresh) {
      setAntigravityBridgeKey(existing);
      return existing;
    }
    const generated = `wpy_guest_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    setAntigravityBridgeKey(generated);
    try {
      localStorage.setItem('wappy_antigravity_bridge_key', generated);
    } catch {
      /* ignore */
    }
    return generated;
  };

  useEffect(() => {
    syncAntigravityBridgeKey(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Conexión reactiva en vivo (EventSource) al Antigravity personal del usuario o visitante
  useEffect(() => {
    const cleanKey = (antigravityBridgeKey || '').trim();
    if (!cleanKey) return;

    let es: EventSource | null = null;
    try {
      const streamUrl = `/api/mcp-bridge/antigravity/stream?apiKey=${encodeURIComponent(cleanKey)}`;
      es = new EventSource(streamUrl);

      const handleCompletedOrderPayload = async (rawPayload: any) => {
        if (!rawPayload || typeof rawPayload !== 'object') return;
        const payload = rawPayload.orden || rawPayload.data || rawPayload;
        const formato = String(payload.formato || payload.formatoEntregable || '').toLowerCase();
        const rawContent = String(
          payload.contenido || payload.htmlCode || payload.resultado || '',
        ).trim();

        // 1) Si Antigravity envió un video HTML5 / GSAP directo al Estudio:
        if (
          formato === 'html' ||
          /<!doctype html|<html\b|<div[^>]+id=["']stage["']/i.test(rawContent)
        ) {
          const cleanHtml = rawContent
            .replace(/^```html\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          if (cleanHtml.length > 60) {
            latestEditedHtmlRef.current = '';
            setHtmlCode(cleanHtml);
            await saveVideoProjectToLibrary({ htmlOverride: cleanHtml }, true);
            setVideoCurrentTime(0);
            setIsVideoPlaying(true);
            setActiveTab('video');
            setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_RESTART' }, '*');
              stageAudioRef.current?.play().catch(() => {});
            }, 150);
            setStatusBanner({
              type: 'success',
              text: '🚀 ¡Tu Antigravity envió el video HTML directo al Lienzo y quedó guardado en la Biblioteca!',
            });
          }
        }

        // 2) Si Antigravity envió un archivo .MP4 renderizado:
        const mp4Url =
          payload.archivoOriginal?.publicUrl ||
          payload.media?.url ||
          payload.mp4Url ||
          payload.downloadUrl ||
          '';
        if (mp4Url && /\.mp4(\?|$)/i.test(mp4Url)) {
          try {
            const r = await fetch(mp4Url);
            if (r.ok) {
              const mp4Blob = await r.blob();
              await saveVideoProjectToLibrary({ mp4Blob }, true);
              downloadBlobFile(mp4Blob, `wappy-antigravity-video-${Date.now()}.mp4`);
              setStatusBanner({
                type: 'success',
                text: '🎬 ¡Tu Antigravity terminó de renderizar el video .MP4 y se descargó automáticamente!',
              });
            }
          } catch {
            window.open(mp4Url, '_blank', 'noopener,noreferrer');
          }
        }
      };

      es.onopen = () => {
        setAntigravityStreamConnected(true);
      };
      es.onerror = () => {
        setAntigravityStreamConnected(false);
      };
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.type === 'orden_completada' || parsed?.event === 'orden_completada') {
            handleCompletedOrderPayload(parsed);
          }
        } catch {
          /* ignore ping */
        }
      };
      es.addEventListener('orden_completada', (ev: MessageEvent) => {
        try {
          const parsed = JSON.parse(ev.data);
          handleCompletedOrderPayload(parsed);
        } catch {
          /* ignore */
        }
      });
    } catch {
      setAntigravityStreamConnected(false);
    }

    return () => {
      if (es) es.close();
      setAntigravityStreamConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [antigravityBridgeKey]);

  const studioOriginUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club';

  const buildAntigravitySkillsInstallCmd = (keyOverride?: string) => {
    const activeKey = (keyOverride || antigravityBridgeKey || '').trim();
    return `node -e "fetch('${studioOriginUrl}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(activeKey)}').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-skills-installer.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${studioOriginUrl}','--key=${activeKey}'],{stdio:'inherit'})})"`;
  };

  const buildAntigravitySkillsChatPrompt = (keyOverride?: string) => {
    const activeKey = (keyOverride || antigravityBridgeKey || '').trim();
    const cmd = buildAntigravitySkillsInstallCmd(activeKey);
    return `Hola Antigravity, conecta mi instancia de WAPPY Studio (Clave personal: ${activeKey}) e instala el Pack Oficial de las 7 Skills de Diseño y Video de WAPPY IA (protocolo-produccion-videos, animaciones-17-efectos-reels, animaciones-wappy-brand, animaciones-dark-tech-hud, animaciones-explicativas-sst, hyperframes-motion-design y wappy-ui-design-system) más el puente reactivo wappy-push-daemon.js ejecutando este comando oficial con run_command:\n\n${cmd}\n\nConfírmame apenas las 7 Skills y el puente en tiempo real queden activos.`;
  };

  const handleDownloadSkillsBundleJson = () => {
    const downloadUrl = `/api/studio/antigravity/skills-bundle.json?download=1&key=${encodeURIComponent(antigravityBridgeKey)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'wappy-antigravity-7-skills-pack.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusBanner({
      type: 'success',
      text: '📦 Descargando Pack Oficial de las 7 Skills de Diseño y Video WAPPY IA (.JSON Importable)...',
    });
  };

  const handleDownloadAntigravitySkillsInstaller = async () => {
    const activeKey =
      (antigravityBridgeKey || '').trim() || (await syncAntigravityBridgeKey(false));
    const cmdLine = buildAntigravitySkillsInstallCmd(activeKey);
    const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent);
    const fileName = isWin
      ? 'Instalar-Antigravity-Skills-Wappy.bat'
      : 'Instalar-Antigravity-Skills-Wappy.command';
    const content = isWin
      ? `@echo off\r\ntitle Instalador Oficial WAPPY Studio - 7 Skills + Puente Antigravity\r\necho Instalando las 7 Skills de Video/Diseno WAPPY IA y conectando tu Antigravity (${activeKey})...\r\n${cmdLine}\r\necho.\r\necho Pack de 7 Skills y Puente Antigravity instalados. Ya puedes cerrar esta ventana.\r\npause\r\n`
      : `#!/bin/bash\necho "Instalando las 7 Skills de Video/Diseño WAPPY IA y conectando tu Antigravity (${activeKey})..."\n${cmdLine}\necho ""\necho "✅ Pack de 7 Skills y Puente Antigravity instalados. Ya puedes cerrar esta ventana."\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlobFile(blob, fileName);
    setStatusBanner({
      type: 'success',
      text: `⚡ Instalador 1-Clic (${fileName}) descargado. Ábrelo para instalar las 7 Skills de Diseño/Video y enlazar tu Antigravity en 2 segundos.`,
    });
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

  if (!portable && user && user.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6">
        <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto">
            <Clapperboard className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            WAPPY Studio (Acceso Administrador)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
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
    <div
      className={cn(
        'flex-1 flex flex-col',
        podcastOnly
          ? 'dark bg-gradient-to-b from-[#0c192e] via-[#09111e] to-[#060c16] text-white rounded-3xl p-4 sm:p-7 border border-teal-500/30 shadow-2xl max-w-7xl w-full mx-auto relative overflow-hidden my-2'
          : portable
            ? 'bg-transparent h-auto overflow-visible pb-6'
            : 'bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16',
      )}
    >
      {podcastOnly && (
        <>
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#c7f303]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      {/* ==================================================================== */}
      {/* CABECERA MAESTRA WAPPY STUDIO (100% WAPPY DESIGN SYSTEM & RESPONSIVE)*/}
      {/* ==================================================================== */}
      <header
        className={cn(
          'z-30 overflow-hidden',
          podcastOnly
            ? 'bg-transparent pb-5 border-b border-white/10 relative'
            : portable
              ? 'bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto'
              : 'bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 border-b border-slate-200/90 dark:border-slate-800',
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
          {/* Fila 1: Identidad WAPPY Studio (Izquierda) + Herramientas & Conexión Antigravity (Derecha) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Izquierda: Botón Sidebar + Badge + Título en una sola línea limpia */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {isAuthenticated && !navVisible && (
                <div className="hidden md:block shrink-0">
                  <OpenSidebar setNavVisible={setNavVisible} />
                </div>
              )}
              {podcastOnly && (
                <div className="w-11 h-11 rounded-2xl bg-[#c7f303]/15 border border-[#c7f303]/40 flex items-center justify-center text-xl shadow-lg shrink-0">
                  🎙️
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                      podcastOnly
                        ? 'bg-[#c7f303]/20 text-[#c7f303] border border-[#c7f303]/40'
                        : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30',
                    )}
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>
                      {podcastOnly
                        ? 'NUEVOS & DESTACADOS · Apple Podcasts × WAPPY Walkman 24kHz'
                        : 'Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames'}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1
                    className={cn(
                      'text-xl sm:text-2xl font-extrabold flex items-center gap-2 whitespace-nowrap',
                      podcastOnly
                        ? 'text-white tracking-tight'
                        : 'bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400',
                    )}
                  >
                    {!podcastOnly && (
                      <Clapperboard className="w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0" />
                    )}
                    <span>
                      {podcastOnly
                        ? 'WAPPY Series Originales & Estudio de Grabación Dual'
                        : 'WAPPY Studio'}
                    </span>
                  </h1>
                  {!podcastOnly && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 hidden sm:block">
                      Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con Antigravity.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Derecha: Botones de Acción WAPPY (14 Grupos Semánticos, 100% responsive con flex-wrap) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <ModelSelector
                selectedModel={selectedAiModel}
                onSelectModel={setSelectedAiModel}
                disabled={isGeneratingHtmlAi}
              />

              <ExpandableButton
                icon={<Terminal />}
                label="Conectar mi Antigravity & Skills"
                variant="purple"
                alwaysExpanded
                onClick={() => {
                  setKeyValidationMsg('');
                  setApiKeyModalTab('antigravity');
                  setIsApiKeyModalOpen(true);
                }}
                title="Conectar tu propio Antigravity (con o sin cuenta) y descargar el Pack de 7 Skills de Video y Diseño"
              />

              <ExpandableButton
                icon={<Key />}
                label={`Claves IA (${activeCustomKeyCount})`}
                variant="fuchsia"
                alwaysExpanded
                onClick={() => {
                  setKeyValidationMsg('');
                  setApiKeyModalTab('keys');
                  setIsApiKeyModalOpen(true);
                }}
                title="Configurar hasta 3 claves Google Gemini con rotación inteligente"
              />

              <ExpandableButton
                icon={isTestingConnection ? <Loader2 className="animate-spin" /> : <Zap />}
                label="Probar Audio IA"
                variant="emerald"
                alwaysExpanded
                disabled={isTestingConnection}
                onClick={handleTestConnection}
              />

              {podcastOnly && (
                <button
                  type="button"
                  onClick={() => {
                    handleTabChange('tts');
                    document
                      .getElementById('podcast-script-editor-anchor')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c7f303] hover:bg-[#d4ff1f] text-[#0e1300] font-extrabold text-xs shadow-lg shadow-[#c7f303]/20 transition-all cursor-pointer"
                >
                  <span>🎧 Ir al Estudio de Edición ↓</span>
                </button>
              )}

              {!portable && (
                <ExpandableButton
                  icon={<ExternalLink />}
                  label="App Portable"
                  variant="cyan"
                  alwaysExpanded
                  onClick={() =>
                    window.open(
                      podcastOnly ? '/wappypodcast.html' : '/wappystudio.html',
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                  title="Abrir Landing Page Pública y Aplicativo Portable"
                />
              )}
            </div>
          </div>

          {/* Fila 2: Los Módulos Principales con Diseño Oficial de Botones WAPPY (ExpandableButton 14-Group System) */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <ExpandableButton
                icon={<MicVocal />}
                label={podcastOnly ? '1. Estudio de Podcast & Voz' : 'Estudio de Voz (TTS)'}
                variant="teal"
                alwaysExpanded
                isActive={activeTab === 'tts'}
                onClick={() => handleTabChange('tts')}
              />

              {!podcastOnly && (
                <ExpandableButton
                  icon={<Film />}
                  label="Video HTML & Capas"
                  variant="purple"
                  alwaysExpanded
                  isActive={activeTab === 'video'}
                  onClick={() => handleTabChange('video')}
                />
              )}

              <ExpandableButton
                icon={<Layers />}
                label={podcastOnly ? '2. Voces Duales & Bursts' : 'Voces & Bursts'}
                variant="amber"
                alwaysExpanded
                isActive={activeTab === 'lab'}
                onClick={() => handleTabChange('lab')}
              />

              <ExpandableButton
                icon={<BookOpen />}
                label={
                  podcastOnly
                    ? `3. Biblioteca de Podcasts (${libraryItems.filter((i) => i.kind !== 'video').length})`
                    : `Biblioteca (${libraryItems.length})`
                }
                variant="indigo"
                alwaysExpanded
                isActive={activeTab === 'library'}
                onClick={() => handleTabChange('library')}
              />
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C7F303] animate-pulse" />
                {podcastOnly ? '🎙️ Motor Multi-Voz 24 kHz WAV Activo' : 'Motor 60-FPS + Voz Activo'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main
        className={cn(
          'flex-1 max-w-7xl w-full mx-auto space-y-6 relative z-10',
          podcastOnly ? 'pt-5 pb-2 px-0' : 'px-4 sm:px-6 py-6',
        )}
      >
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

        {/* EN PODCAST ONLY: FILA SUPERIOR LADO A LADO — WALKMAN CASSETTE DECK (5 COLS) + CARRUSEL DESPLAZABLE DE CÁPSULAS (7 COLS) */}
        {podcastOnly ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 flex flex-col">
              <WappyCassetteWalkmanPlayer
                audioBase64={currentAudio?.base64}
                audioUrl={currentAudio?.url}
                title={
                  currentAudio?.title ||
                  activePodcastEpisodeTitle ||
                  (scriptText ? scriptText.trim().slice(0, 48) : 'Episodio de Podcast SST')
                }
                subtitle={
                  multiSpeaker
                    ? `SIDE A • HOST DUAL (${speaker1Voice} + ${speaker2Voice})`
                    : `SIDE A • LOCUCIÓN (${selectedVoice})`
                }
                voiceLabel={
                  currentAudio?.voiceName ||
                  (multiSpeaker ? `${speaker1Voice} + ${speaker2Voice}` : selectedVoice)
                }
                durationSeconds={currentAudio?.durationSeconds}
                durationSec={currentAudio?.durationSeconds}
                isSynthesizing={isPreviewing || activeJob?.status === 'processing'}
                isGenerating={isPreviewing || activeJob?.status === 'processing'}
                onSynthesizeAndPlay={() => handleStartFullJob()}
                onGenerateDefault={() => handleStartFullJob()}
                onOpenScriptEditor={() => {
                  handleTabChange('tts');
                }}
                token={token}
              />
            </div>

            <div className="lg:col-span-7 flex flex-col min-w-0">
              <WappyApplePodcastsShelf
                activeShowId={selectedApplePodcastId}
                isGenerating={isPreviewing || activeJob?.status === 'processing'}
                onSelectShow={handleSelectApplePodcastShow}
                userCapsules={libraryItems
                  .filter((i) => i.kind !== 'video')
                  .map((it) => ({
                    id: it.id,
                    title: it.title,
                    createdAt: new Date(it.createdAt).toLocaleDateString(),
                    durationSec: it.durationSeconds,
                    voiceName: it.voiceName,
                    scriptText: it.scriptText,
                    stylePrompt: it.stylePrompt,
                  }))}
                onPlayUserCapsule={(cap) => {
                  const found = libraryItems.find((x) => x.id === cap.id);
                  if (found) {
                    openLibraryAudio(found, false);
                  }
                }}
                onEditUserCapsule={(cap) => {
                  const found = libraryItems.find((x) => x.id === cap.id);
                  if (found) {
                    handleEditLibraryAudio(found);
                  }
                }}
                onDeleteUserCapsule={(cap) => {
                  const found = libraryItems.find((x) => x.id === cap.id);
                  if (found) {
                    deleteLibraryItem(found);
                    if (editingLibraryItemId === found.id) {
                      setEditingLibraryItemId(null);
                    }
                    setStatusBanner({
                      type: 'success',
                      text: `🗑️ Podcast "${found.title}" eliminado correctamente de tus cápsulas.`,
                    });
                  }
                }}
                onScrollToEditor={() => {
                  handleTabChange('tts');
                  setTimeout(() => {
                    const editorEl = document.getElementById(
                      'wappy-studio-tts-editor',
                    ) as HTMLTextAreaElement | null;
                    if (editorEl) {
                      editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => editorEl.focus({ preventScroll: true }), 300);
                    }
                  }, 60);
                }}
              />
            </div>
          </div>
        ) : (
          currentAudio && (
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
          )
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 1: ESTUDIO DE VOZ Y EDICIÓN DE CÁPSULAS (MISMO ESTILO DARK)  */}
        {/* ==================================================================== */}
        {activeTab === 'tts' && (
          <div
            id="podcast-script-editor-anchor"
            className={cn(
              'space-y-6 animate-in fade-in duration-200',
              podcastOnly && 'pt-6 border-t border-teal-500/25',
            )}
          >
            {podcastOnly && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c7f303]/15 border border-[#c7f303]/40 flex items-center justify-center text-[#c7f303] shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#c7f303] block">
                      CONSOLA DE PRODUCCIÓN & EDICIÓN · GEMINI 24KHZ WAV
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Estudio para Crear, Editar y Pasar tus Audios al Walkman & Cápsulas
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-200 text-[11px] font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#c7f303] animate-pulse" />
                  <span>Pasa directo a tu Walkman y Carrusel arriba ↑</span>
                </span>
              </div>
            )}
            {/* Monitor de Trabajo Asíncrono por Capas (Justo debajo del Reproductor Maestro, idéntico al diseño de referencia) */}
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
                      voiceName: multiSpeaker ? `${speaker1Voice} + ${speaker2Voice}` : selectedVoice,
                    });
                  }
                }}
                onLoadMaster={() => {
                  if (activeJob.downloadUrl) {
                    setCurrentAudio({
                      url: activeJob.downloadUrl,
                      title: `Audio Completo: ${scriptText.trim().slice(0, 42)}...`,
                      durationSeconds: activeJob.generatedTotalSeconds,
                      voiceName: multiSpeaker ? `${speaker1Voice} + ${speaker2Voice}` : selectedVoice,
                      scriptText,
                    });
                  }
                }}
              />
            )}

            {/* Barra Interactiva de Flujo Creativo en 3 Pasos (Estilo WAPPY Fluido & Innovador) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0">
                  01
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                    Motor & Voz Neural
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {activeModelObj?.name} •{' '}
                    <span className="text-teal-600 dark:text-teal-400">
                      {multiSpeaker ? `${speaker1Voice} + ${speaker2Voice}` : selectedVoice}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                  02
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Capas de ~1 Min & Bursts
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {wordCount} palabras • ~{estimatedMinutes} min ({chunkCount}{' '}
                    {chunkCount === 1 ? 'capa de ~1m' : 'capas de ~1m'})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTabChange(podcastOnly ? 'library' : 'video')}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                    03
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      {podcastOnly ? 'Master WAV 24kHz & Biblioteca' : 'WAV 24kHz & Video HTML/GSAP'}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {podcastOnly
                        ? 'Sintetiza tu podcast y descárgalo en WAV →'
                        : 'Sintetiza audio o llévalo al Compositor →'}
                    </div>
                  </div>
                </div>
                {podcastOnly ? (
                  <BookOpen className="w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <Film className="w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUMNA IZQUIERDA (5 cols): Modelos, Presets, Modo Diálogo y Catálogo de 14 Voces */}
              <div className="lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                {/* 1. Selector de Modelo Gemini TTS */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-teal-500" />
                      Modelo Oficial Gemini TTS
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ✓ GOOGLE_MODELS Activo
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
                            'text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer',
                            isSelected
                              ? 'bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                              : 'bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60',
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <span
                                className={cn(
                                  'text-[9px] font-extrabold px-2 py-0.5 rounded-md border',
                                  m.badgeColor,
                                )}
                              >
                                {m.badge}
                              </span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0" />
                              )}
                            </div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1">
                              {m.name}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                              {m.description}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-amber-700 dark:text-amber-400 font-bold">
                              {m.rateLimitLabel || m.quotaLabel}
                            </span>
                            {isSelected ? (
                              <span className="text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> {m.supportedVoices.length} voces
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-zinc-400 font-semibold">
                                {m.supportedVoices.length} voces
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Barra de voces activas para el modelo seleccionado */}
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>
                        Voces activas para{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {activeModelObj?.name}
                        </strong>
                        :
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {activeVoicesCount} de {voices.length} disponibles
                      </span>
                      {activeVoicesCount < voices.length && (
                        <button
                          type="button"
                          onClick={() => setSelectedModel('gemini-3.8-flash-tts')}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer"
                        >
                          Activar las 14 →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alerta Ámbar Explicativa cuando está seleccionado Gemini 2.5 Flash TTS */}
                  {selectedModel === 'gemini-2.5-flash-preview-tts' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-extrabold text-amber-900 dark:text-amber-200">
                            ¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?
                          </p>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                            <span className="font-bold">Gemini 2.5 Pro Preview TTS</span> no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es{' '}
                            <span className="font-bold">Gemini 2.5 Flash TTS</span>, el cual habilita únicamente las{' '}
                            <span className="font-bold">5 voces fundamentales</span> (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a{' '}
                            <span className="font-bold">Gemini 3.8 Flash TTS</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedModel('gemini-3.8-flash-tts')}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer"
                        >
                          Cambiar a Gemini 3.8 Flash TTS (14 voces) →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Plantillas Rápidas de Estilo (Lista Desplegable con Estilo Consola WAPPY) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Estilos y Plantillas Rápidas
                    </label>
                    <span className="text-[10px] text-teal-600 dark:text-[#c7f303] font-bold">
                      Lista desplegable • 1 clic configura voz + emoción
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={
                        presets.find(
                          (preset) =>
                            stylePrompt === preset.style &&
                            (preset.multiSpeaker
                              ? multiSpeaker
                              : !multiSpeaker && selectedVoice === preset.voiceName),
                        )?.id || ''
                      }
                      onChange={(e) => {
                        const preset = presets.find((p) => p.id === e.target.value);
                        if (!preset) return;
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
                      className="w-full appearance-none rounded-xl border border-teal-500/40 dark:border-[#c7f303]/40 bg-slate-900/95 text-white text-xs font-extrabold px-3.5 py-2.5 pr-9 shadow-inner focus:outline-none focus:border-[#c7f303] focus:ring-2 focus:ring-[#c7f303]/20 transition cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-950 text-slate-400">
                        🎙️ Seleccionar estilo vocal y emoción del podcast...
                      </option>
                      {presets.map((preset) => {
                        const needsUpgrade =
                          !preset.multiSpeaker && !isVoiceSupported(preset.voiceName);
                        return (
                          <option
                            key={preset.id}
                            value={preset.id}
                            className="bg-slate-950 text-white py-1.5 font-semibold"
                          >
                            {preset.multiSpeaker ? '👥 ' : '🎙️ '}
                            {preset.name}
                            {needsUpgrade ? ' (Auto Gemini 3.8)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#c7f303]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Modo Diálogo / Screenplay (2 Voces) */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-teal-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Modo Diálogo / Podcast (2 Voces)
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400">
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        Cabina de Transmisión Dual (Estudio ON AIR)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ● 2 CANALES ACTIVOS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* CANAL 1: Alex (Host 1) */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0e161a] to-slate-950 border border-teal-500/40 shadow-md text-white space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-[#C7F303]">
                              <MicVocal className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                                <span>Alex</span>
                                <span className="text-[10px] font-mono text-teal-400 font-bold">
                                  (Host 1)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">Conductor Principal</p>
                            </div>
                          </div>
                          {/* Indicador Luminoso ON AIR CH 01 */}
                          <div className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500 text-rose-300 text-[9px] font-mono font-black flex items-center gap-1.5 shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>ON AIR • CH 01</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-teal-300 mb-1">
                            Voz Neural Gemini 24kHz:
                          </label>
                          <select
                            value={speaker1Voice}
                            onChange={(e) => setSpeaker1Voice(e.target.value)}
                            className="w-full bg-slate-800/90 border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
                          >
                            {(activeModelObj?.supportedVoices || []).map((vId) => {
                              const vObj = voices.find((v) => v.id === vId);
                              return (
                                <option key={vId} value={vId} className="bg-slate-900 text-white">
                                  {vId} ({vObj?.gender || 'Voz'} - {vObj?.tone || 'Natural'})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Apertura, moderación del caso y preguntas a los especialistas.
                        </p>
                      </div>

                      {/* CANAL 2: Sam (Host 2) */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#181124] to-slate-950 border border-purple-500/40 shadow-md text-white space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                              <MicVocal className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                                <span>Sam</span>
                                <span className="text-[10px] font-mono text-purple-400 font-bold">
                                  (Host 2)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">Especialista Técnico</p>
                            </div>
                          </div>
                          {/* Indicador Luminoso ON AIR CH 02 */}
                          <div className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-[9px] font-mono font-black flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>ON AIR • CH 02</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-purple-300 mb-1">
                            Voz Neural Gemini 24kHz:
                          </label>
                          <select
                            value={speaker2Voice}
                            onChange={(e) => setSpeaker2Voice(e.target.value)}
                            className="w-full bg-slate-800/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer"
                          >
                            {(activeModelObj?.supportedVoices || []).map((vId) => {
                              const vObj = voices.find((v) => v.id === vId);
                              return (
                                <option key={vId} value={vId} className="bg-slate-900 text-white">
                                  {vId} ({vObj?.gender || 'Voz'} - {vObj?.tone || 'Natural'})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Análisis normativo, causas raíz y soluciones de ingeniería en terreno.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 4. Catálogo de 14 Voces en Rejilla Espaciosa de 2 Columnas con Audición en Vivo */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MicVocal className="w-3.5 h-3.5 text-teal-500" />
                          Catálogo de Voces ({activeVoicesCount} activas / {voices.length} totales)
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real.
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setVoiceActiveFilter('only_active')}
                          className={cn(
                            'px-2 py-0.5 rounded-md transition cursor-pointer',
                            voiceActiveFilter === 'only_active'
                              ? 'bg-teal-600 text-white font-bold'
                              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
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
                              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
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
                          type="search"
                          name="wappy-voice-search"
                          autoComplete="off"
                          value={voiceSearchQuery}
                          onChange={(e) => setVoiceSearchQuery(e.target.value)}
                          placeholder="Buscar voz (Kore, Orus, profunda, podcast...)"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0">
                        {(['all', 'Femenino', 'Masculino'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setVoiceGenderFilter(g)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg transition cursor-pointer',
                              voiceGenderFilter === g
                                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
                            )}
                          >
                            {g === 'all' ? 'Todas' : g === 'Femenino' ? '♀ Femeninas' : '♂ Masculinas'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
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
                              'p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer',
                              isSelected
                                ? 'bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                                : 'bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60',
                              !supported && 'opacity-75 border-dashed',
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                      {v.name}
                                    </span>
                                    {v.tag && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0">
                                        {v.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <span
                                      className={cn(
                                        'text-[9px] font-bold px-1.5 py-0.5 rounded',
                                        v.gender === 'Femenino'
                                          ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20'
                                          : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20',
                                      )}
                                    >
                                      {v.gender === 'Femenino' ? '♀ Femenina' : '♂ Masculina'}
                                    </span>
                                    {supported ? (
                                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                        ✓ Activa
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                        Requiere 3.8/3.1
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleAuditionVoice(v.id, e)}
                                  disabled={isAuditioning}
                                  title={`Escuchar muestra de ${v.name}`}
                                  className="px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold"
                                >
                                  {isAuditioning ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current" />
                                  )}
                                  <span>Oír</span>
                                </button>
                              </div>

                              <p className="text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug">
                                {v.tone}
                              </p>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                              <p className="text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight">
                                {v.recommendedFor}
                              </p>
                              {!supported && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedModel('gemini-3.8-flash-tts');
                                    setSelectedVoice(v.id);
                                  }}
                                  className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer"
                                >
                                  Usar con 3.8 →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Directiva de Estilo y Emoción */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Directiva de Estilo y Emoción
                    </label>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      speechMetadata.style
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Ej: Voz cálida, pausada y reflexiva de narrador de documentales..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* 6. Motor de Capas de Audio (~1 Minuto por Capa) y Ensamblado Master WAV */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedChunking(!showAdvancedChunking)}
                    className="flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-teal-500" />
                      Motor de Capas de Audio (~1 min por capa) & Unión Master
                    </span>
                    <span>{showAdvancedChunking ? '▲' : '▼'}</span>
                  </button>
                  {showAdvancedChunking && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { words: 110, label: '~45 seg', sub: '110 pal.' },
                          { words: 150, label: '~1 min ★', sub: '150 pal. (Óptimo)' },
                          { words: 220, label: '~1.5 min', sub: '220 pal.' },
                          { words: 280, label: '~2 min', sub: '280 pal.' },
                        ].map((preset) => {
                          const active = Math.abs(wordsPerChunk - preset.words) <= 10;
                          return (
                            <button
                              key={preset.words}
                              type="button"
                              onClick={() => setWordsPerChunk(preset.words)}
                              className={cn(
                                'px-2 py-1.5 rounded-lg border text-center transition cursor-pointer',
                                active
                                  ? 'bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400',
                              )}
                            >
                              <div className="text-[11px] font-bold">{preset.label}</div>
                              <div className="text-[9px] opacity-80">{preset.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-zinc-400">
                          Tamaño de cada capa de audio:
                        </span>
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {wordsPerChunk} palabras (~{Math.max(20, Math.round((wordsPerChunk / 145) * 60))}s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={80}
                        max={280}
                        step={10}
                        value={wordsPerChunk}
                        onChange={(e) => setWordsPerChunk(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"
                      />
                      <p className="text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                        <strong>Recomendado (~1 min / 150 palabras):</strong> Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo <strong>WAV Master 24kHz</strong> con micro-fades sin cortes.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA (7 cols): Editor de Guion, Vocal Bursts y Despacho */}
              <div className="lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                {/* Banner Integrado de Estado de Claves API & Rotación Anti-429 */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all',
                    activeCustomKeyCount > 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25',
                  )}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                        activeCustomKeyCount > 0
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
                      )}
                    >
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {activeCustomKeyCount > 0 ? (
                          <>
                            <span>
                              {activeCustomKeyCount} clave(s) API guardada(s) • Rotación y failover automático (429) activados
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                        {activeCustomKeyCount > 0
                          ? 'Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.'
                          : 'Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min.'}
                      </p>
                    </div>
                  </div>
                  <ExpandableButton
                    size="sm"
                    alwaysExpanded
                    icon={<Key />}
                    label={activeCustomKeyCount > 0 ? 'Administrar Claves' : 'Configurar Claves'}
                    variant="fuchsia"
                    onClick={() => {
                      setKeyValidationMsg('');
                      setApiKeyModalTab('keys');
                      setIsApiKeyModalOpen(true);
                    }}
                  />
                </div>

                {/* Campo de Título de la Cápsula de Podcast (Exclusivo en podcastOnly para nombrar o editar la cápsula al pasarla al Carrusel y Walkman) */}
                {podcastOnly && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#c7f303] shrink-0 flex items-center gap-1.5">
                      📻 {editingLibraryItemId ? 'Editando Podcast:' : 'Título de tu Podcast:'}
                    </label>
                    <input
                      type="text"
                      value={activePodcastEpisodeTitle}
                      onChange={(e) => setActivePodcastEpisodeTitle(e.target.value)}
                      placeholder="Ej: Charla 5 Min - Bloqueo LOTO en Planta..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#c7f303]"
                    />
                    {editingLibraryItemId && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSaveEditedLibraryMetadata}
                          className="px-3 py-1.5 rounded-xl bg-[#c7f303] hover:bg-[#d8ff2a] text-[#0e1300] text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm"
                          title="Guardar nuevo título, voces y guion sin volver a sintetizar"
                        >
                          💾 Guardar Cambios
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLibraryItemId(null);
                            setStatusBanner({
                              type: 'info',
                              text: 'Modo creación de nuevo podcast activado.',
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
                          title="Salir del modo edición para crear un podcast nuevo"
                        >
                          + Nuevo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cabecera del Editor + Botón Generar/Expandir Guion (+5 Min) con IA */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0">
                      <MicVocal className="w-4 h-4 text-teal-500" />
                      {podcastOnly
                        ? 'Guion del Episodio de Podcast (Mínimo 5 Minutos)'
                        : 'Texto a Sintetizar'}
                    </h2>
                    {podcastOnly && (
                      <span
                        className={cn(
                          'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border',
                          wordCount >= 725
                            ? 'bg-[#c7f303]/15 text-[#c7f303] border-[#c7f303]/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40',
                        )}
                      >
                        {wordCount >= 725
                          ? `✓ Cumple +5 min (~${estimatedMinutes} min • ${wordCount} palabras)`
                          : `⏱ Mínimo 5 min (~725 palabras • actual: ${wordCount})`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {!podcastOnly && (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const found = SCRIPT_TEMPLATES.find((t) => t.title === e.target.value);
                          if (found) {
                            setScriptText(found.text);
                            if (found.text.includes('Alex:') && found.text.includes('Sam:')) {
                              setMultiSpeaker(true);
                            }
                          }
                          e.target.value = '';
                        }}
                        className="min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="" disabled>
                          📋 Cargar ejemplo ({SCRIPT_TEMPLATES.length} plantillas)...
                        </option>
                        {SCRIPT_TEMPLATES.map((tpl) => (
                          <option key={tpl.title} value={tpl.title}>
                            {tpl.title}
                          </option>
                        ))}
                      </select>
                    )}

                    <ExpandableButton
                      size="sm"
                      alwaysExpanded
                      icon={isEnhancingScript ? <Loader2 className="animate-spin" /> : <Wand2 />}
                      label={
                        isEnhancingScript
                          ? 'Expandiendo a +5 Min...'
                          : podcastOnly
                            ? '✨ Expandir / Mejorar Guion (+5 Min) con IA'
                            : 'Mejorar Guion con IA'
                      }
                      variant="purple"
                      disabled={isEnhancingScript}
                      onClick={handleEnhanceScriptWithAi}
                      title={`Generar o expandir guion completo de mínimo 5 minutos (~750-900 palabras) con Vocal Bursts usando ${selectedAiModel}`}
                    />

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

                {/* Barra de Inserción Rápida de Vocal Bursts, Pausas y Hablantes */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Insertar Pausas, Énfasis y Efectos Vocales (Vocal Bursts) en el cursor:
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                      {selectedModel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PAUSE_AND_EMPHASIS_TAGS.slice(0, 3).map((p) => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => insertTagIntoEditor(` ${p.tag} `)}
                        title={p.desc}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                          {p.tag}
                        </span>
                        <span className="text-slate-600 dark:text-zinc-400 text-[10px] font-sans">
                          ({p.label})
                        </span>
                      </button>
                    ))}
                    {vocalBursts.map((b) => (
                      <button
                        key={b.tag}
                        type="button"
                        onClick={() => insertTagIntoEditor(` ${b.tag} `)}
                        title={b.description}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          {b.tag}
                        </span>
                        <span className="text-slate-600 dark:text-zinc-400 text-[10px] font-sans">
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
                  placeholder="Escribe o edita aquí el guion de tu podcast (mínimo 5 minutos / ~725 palabras) o usa el botón 'Expandir / Mejorar Guion (+5 Min) con IA'..."
                  className="w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[240px] shadow-inner transition-all"
                />

                {/* Barra de Métricas y Estimación */}
                <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span>
                        Palabras:{' '}
                        <strong className="text-slate-900 dark:text-white font-mono">{wordCount}</strong>
                        {podcastOnly && (
                          <span className="text-[10px] text-teal-400 ml-1">(meta ≥ 725)</span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        Caracteres:{' '}
                        <strong className="text-slate-900 dark:text-white font-mono">{charCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Fragmentos estimados:{' '}
                        <strong className="text-teal-600 dark:text-teal-400 font-mono">
                          {chunkCount}
                        </strong>
                      </span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-semibold">
                      Duración estimada:{' '}
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">
                        ~{estimatedMinutes} min
                      </strong>{' '}
                      {podcastOnly ? '(mínimo recomendado: 5 min)' : '/ 60 min máx'}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(4, Math.round((estimatedMinutes / (podcastOnly ? 10 : 60)) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Botones de Acción Principales (WAPPY 14-Group Design System) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <ExpandableButton
                    alwaysExpanded
                    icon={isPreviewing ? <Loader2 className="animate-spin" /> : <Zap />}
                    label={
                      podcastOnly
                        ? 'Probar Voz Rápida (~1er fragmento)'
                        : 'Vista Previa Rápida (~1er fragmento)'
                    }
                    variant="amber"
                    disabled={
                      isPreviewing || activeJob?.status === 'processing' || !scriptText.trim()
                    }
                    onClick={() => handleSynthesizePreview()}
                  />

                  <ExpandableButton
                    alwaysExpanded
                    icon={
                      activeJob?.status === 'processing' ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Play />
                      )
                    }
                    label={
                      podcastOnly
                        ? editingLibraryItemId
                          ? `Actualizar y Re-Sintetizar Podcast (${chunkCount} fragmentos • ~${estimatedMinutes} min)`
                          : `Sintetizar Podcast Completo y Pasar al Walkman (~${estimatedMinutes} min WAV)`
                        : chunkCount > 1
                          ? `Generar Podcast Completo (${chunkCount} fragmentos • ~${estimatedMinutes} min)`
                          : 'Generar Audio Completo'
                    }
                    variant="teal"
                    disabled={
                      activeJob?.status === 'processing' || isPreviewing || !scriptText.trim()
                    }
                    onClick={() => handleStartFullJob()}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 2: COMPOSITOR DE VIDEO HTML & CAPAS (ARQUITECTURA HORIZONTAL) */}
        {/* ==================================================================== */}
        {activeTab === 'video' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* ================================================================ */}
            {/* BLOQUE 1: CONSOLA PANORÁMICA SUPERIOR (HEADER + 4 HYPERFRAMES)   */}
            {/* ================================================================ */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/35 dark:border-[#C7F303]/30 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/40 dark:from-[#0C192E] dark:via-[#091426] dark:to-[#0d2238] p-4 sm:p-5 shadow-md">
              {/* Halos Ambientales WAPPY IA */}
              <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#C7F303]/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-[#0D9488]/15 blur-3xl" />

              {/* Fila Superior: Identidad + Estado SSE + Selector 9:16 / 16:9 + Botón Antigravity */}
              <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C7F303]/25 via-emerald-500/15 to-teal-500/20 border border-emerald-500/40 dark:border-[#C7F303]/45 flex items-center justify-center shrink-0 shadow-inner">
                    <Film className="w-6 h-6 text-teal-700 dark:text-[#C7F303]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0E1300] text-[#C7F303] border border-[#C7F303]/40 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[#C7F303] animate-ping" />
                        <span>⚡ WAPPY VIDEO STUDIO • ANTIGRAVITY 60-FPS ENGINE</span>
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border',
                          antigravityStreamConnected
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                            : 'bg-purple-500/15 border-purple-500/35 text-purple-700 dark:text-purple-300',
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            antigravityStreamConnected ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400',
                          )}
                        />
                        <span>
                          {antigravityStreamConnected ? 'SSE En Vivo' : 'Puente Listo'} •{' '}
                          {(antigravityBridgeKey || 'wpy_studio').slice(0, 14)}…
                        </span>
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-teal-700 to-emerald-600 dark:from-white dark:via-[#C7F303] dark:to-cyan-300 bg-clip-text text-transparent mt-1">
                      Estudio de Capas, Avatares 3D & Motion Graphics Sincronizados
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Elige una plantilla HyperFrames, personaliza tus escenas y efectos, y genera tu video en vivo con Antigravity.
                    </p>
                  </div>
                </div>

                {/* Controles Horizontales Derecha: Selector 9:16 vs 16:9 + Botón Antigravity (100% Botones WAPPY) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <ExpandableButton
                    size="sm"
                    icon={<Film />}
                    label="Vertical 9:16 (Reels/TikTok)"
                    variant="teal"
                    alwaysExpanded
                    isActive={aspectRatio === '9:16'}
                    onClick={() => {
                      setAspectRatio('9:16');
                      handleRebuildDefaultTemplate('9:16', Boolean(baseVideoUrl), selectedSceneTemplate);
                    }}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Clapperboard />}
                    label="Horizontal 16:9 (YouTube/LMS)"
                    variant="cyan"
                    alwaysExpanded
                    isActive={aspectRatio === '16:9'}
                    onClick={() => {
                      setAspectRatio('16:9');
                      handleRebuildDefaultTemplate('16:9', Boolean(baseVideoUrl), selectedSceneTemplate);
                    }}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Terminal />}
                    label="Conectar mi Antigravity & Skills"
                    variant="purple"
                    alwaysExpanded
                    onClick={() => {
                      setKeyValidationMsg('');
                      setApiKeyModalTab('antigravity');
                      setIsApiKeyModalOpen(true);
                    }}
                  />
                </div>
              </div>

              {/* Fila Media: Las 4 Plantillas Visuales Instantáneas (HyperFrames) en 4 Columnas Horizontales */}
              <div className="relative pt-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-[#C7F303]" />
                    Plantillas Visuales Instantáneas (HyperFrames 60-FPS • Clic para aplicar al Lienzo)
                  </span>
                  <span className="text-[10px] font-mono text-teal-700 dark:text-teal-300 font-bold">
                    Sincronización automática 1:1 con tu guion de voz
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {STUDIO_SCENE_TEMPLATES.map((tpl, idx) => {
                    const isSelected = selectedSceneTemplate === tpl.id;
                    const accentStyles = [
                      'from-amber-500/15 to-emerald-500/10 border-amber-500/30',
                      'from-cyan-500/15 to-indigo-500/10 border-cyan-500/30',
                      'from-teal-500/15 to-emerald-500/10 border-teal-500/30',
                      'from-purple-500/15 to-fuchsia-500/10 border-purple-500/30',
                    ];
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedSceneTemplate(tpl.id);
                          const tplThemeMap: Record<StudioSceneTemplateId, string> = {
                            'golden-rules': 'dark-tech-hud',
                            'kpi-hud': 'wappy-lima-oliva',
                            'alert-sst': 'crema-editorial-sst',
                            'camera-overlay': 'cielo-wappy-cloud',
                          };
                          const nextTheme = tplThemeMap[tpl.id] || selectedArtDirection;
                          setSelectedArtDirection(nextTheme);
                          handleRebuildDefaultTemplate(
                            aspectRatio,
                            Boolean(baseVideoUrl),
                            tpl.id,
                            undefined,
                            undefined,
                            undefined,
                            nextTheme,
                          );
                        }}
                        className={cn(
                          'group relative p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between gap-2 hover:-translate-y-0.5',
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/10 dark:from-[#C7F303]/15 dark:via-teal-500/15 dark:to-slate-900 border-emerald-500 dark:border-[#C7F303] ring-2 ring-emerald-500/25 dark:ring-[#C7F303]/30 shadow-md'
                            : cn(
                                'bg-white/85 dark:bg-slate-900/80 hover:border-teal-500/50 dark:hover:border-[#C7F303]/50',
                                accentStyles[idx % accentStyles.length],
                              ),
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {tpl.name}
                            </div>
                            <span className="inline-block mt-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30 dark:border-[#C7F303]/30">
                              {tpl.badge}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-black border transition',
                              isSelected
                                ? 'bg-[#C7F303] text-[#0E1300] border-[#C7F303] shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                            )}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : `0${idx + 1}`}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* MÓDULO HORIZONTAL 1 (100% ANCHO): DIRECCIÓN DE ARTE, EFECTOS,    */}
            {/* ESCALETA DE TIEMPOS, CAPAS MULTIMEDIA Y CÓDIGO HTML5             */}
            {/* ================================================================ */}
            <div className="w-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Barra Superior Horizontal de los 4 Sub-Módulos con Botones Oficiales WAPPY */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <ExpandableButton
                    icon={<Sparkles />}
                    label={`🎨 Estilo & Efectos (${selectedSkillEffects.length} FX)`}
                    variant="purple"
                    alwaysExpanded
                    isActive={videoStudioSubTab === 'style'}
                    onClick={() => setVideoStudioSubTab('style')}
                  />

                  <ExpandableButton
                    icon={<Layers />}
                    label={`⏱️ Escaleta & Tiempos (${scriptSteps.length} escenas)`}
                    variant="amber"
                    alwaysExpanded
                    isActive={videoStudioSubTab === 'timeline'}
                    onClick={() => setVideoStudioSubTab('timeline')}
                  />

                  <ExpandableButton
                    icon={<MicVocal />}
                    label={`🎙️ Capas, Audio & Textos (${showDynamicSubtitles ? 'Subs ON' : 'Capas'})`}
                    variant="teal"
                    alwaysExpanded
                    isActive={videoStudioSubTab === 'layers'}
                    onClick={() => setVideoStudioSubTab('layers')}
                  />

                  <ExpandableButton
                    icon={<Code2 />}
                    label="</> Código HTML5 & GSAP"
                    variant="cyan"
                    alwaysExpanded
                    isActive={videoStudioSubTab === 'code'}
                    onClick={() => setVideoStudioSubTab('code')}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                    <span>{aspectRatio}</span>
                    <span>•</span>
                    <span>{selectedArtDirection}</span>
                  </span>
                  <ExpandableButton
                    size="sm"
                    icon={isGeneratingSuperPrompt ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    label="Actualizar Super-Prompt"
                    variant="indigo"
                    alwaysExpanded
                    disabled={isGeneratingSuperPrompt}
                    onClick={handleBuildAntigravitySuperPrompt}
                  />
                </div>
              </div>

              {/* ============================================================ */}
              {/* SUB-TAB 1: ESTILO DE ARTE (4 COLS) & 18 EFECTOS (6 COLS)     */}
              {/* ============================================================ */}
              {videoStudioSubTab === 'style' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 1. 4 Direcciones de Arte del Brandbook en 4 Columnas Horizontales a Todo lo Ancho */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        1. Dirección de Arte Oficial (Brandbook WAPPY IA • 4 Estilos)
                      </span>
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-300 font-bold">
                        Paleta activa: {selectedArtDirection}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ANTIGRAVITY_ART_DIRECTIONS.map((art) => {
                        const active = selectedArtDirection === art.id;
                        const swatchMap: Record<string, string[]> = {
                          'dark-tech-hud': ['#0C192E', '#00D4FF', '#C7F303'],
                          'wappy-lima-oliva': ['#C7F303', '#0E1300', '#0D9488'],
                          'crema-editorial-sst': ['#F6F5EF', '#0D9488', '#F59E0B'],
                          'cielo-wappy-cloud': ['#5BB8F5', '#EAF6FE', '#0D9488'],
                        };
                        const swatches = swatchMap[art.id] || ['#0C192E', '#C7F303'];
                        return (
                          <button
                            key={art.id}
                            type="button"
                            onClick={() => {
                              setSelectedArtDirection(art.id);
                              handleRebuildDefaultTemplate(
                                aspectRatio,
                                Boolean(baseVideoUrl),
                                selectedSceneTemplate,
                                undefined,
                                undefined,
                                undefined,
                                art.id,
                              );
                            }}
                            className={cn(
                              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 hover:-translate-y-0.5',
                              active
                                ? 'bg-purple-500/12 border-purple-500 text-slate-900 dark:text-white ring-2 ring-purple-500/25 shadow-xs'
                                : 'bg-slate-50/80 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-purple-400',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex items-center -space-x-1 shrink-0">
                                  {swatches.map((hex) => (
                                    <span
                                      key={hex}
                                      style={{ backgroundColor: hex }}
                                      className="w-4 h-4 rounded-full border border-white/60 dark:border-slate-700 shadow-2xs"
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-extrabold truncate">
                                  {art.label}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
                                {active ? '✓ ACTIVO' : '60 FPS'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                              {art.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Catálogo Interactivo de los 18 Efectos Virales en 6 Columnas Horizontales */}
                  <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                          2. Catálogo de Efectos Virales Antigravity ({selectedSkillEffects.length} seleccionados)
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Activa los efectos 3D, avatares y transiciones que se inyectarán en el Super-Prompt.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ExpandableButton
                          size="sm"
                          icon={<Check />}
                          label={
                            selectedSkillEffects.length === ANTIGRAVITY_EFFECTS_CATALOG.length
                              ? 'Deseleccionar todos'
                              : 'Seleccionar todos'
                          }
                          variant="indigo"
                          alwaysExpanded
                          onClick={() => {
                            if (selectedSkillEffects.length === ANTIGRAVITY_EFFECTS_CATALOG.length) {
                              setSelectedSkillEffects(['19-cover-2s']);
                            } else {
                              setSelectedSkillEffects(ANTIGRAVITY_EFFECTS_CATALOG.map((e) => e.id));
                            }
                          }}
                        />

                        <ExpandableButton
                          size="sm"
                          icon={<Sparkles />}
                          label="Laboratorio FX →"
                          variant="amber"
                          alwaysExpanded
                          onClick={() => handleTabChange('lab')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {ANTIGRAVITY_EFFECTS_CATALOG.map((ef) => {
                        const active = selectedSkillEffects.includes(ef.id);
                        return (
                          <button
                            key={ef.id}
                            type="button"
                            onClick={() => toggleSkillEffect(ef.id)}
                            className={cn(
                              'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 hover:-translate-y-0.5',
                              active
                                ? 'bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-teal-500/10 border-indigo-500/60 text-slate-900 dark:text-white ring-1 ring-indigo-500/30 shadow-2xs'
                                : 'bg-slate-50/70 dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400',
                            )}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-[11px] font-extrabold leading-tight">
                                {ef.label}
                              </span>
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-md flex items-center justify-center shrink-0 border',
                                  active
                                    ? 'bg-[#C7F303] text-[#0E1300] border-[#C7F303]'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700',
                                )}
                              >
                                {active && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                {ef.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                              {ef.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUB-TAB 2: ESCALETA HORIZONTAL POR TIEMPOS & PAUSAS          */}
              {/* ============================================================ */}
              {videoStudioSubTab === 'timeline' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-500" />
                        Escaleta de Escenas por Tiempos ({scriptSteps.length} tramos)
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Define qué suena y qué efecto visual aparece en cada tramo (`0.0s-2.0s` Portada Magnética, `2.0s-8.0s`, etc.).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ExpandableButton
                        size="sm"
                        icon={<Wand2 />}
                        label="Auto-Dividir Guion"
                        variant="amber"
                        alwaysExpanded
                        onClick={handleAutoStructureScriptSteps}
                      />
                      <ExpandableButton
                        size="sm"
                        icon={<Check />}
                        label="Sincronizar al Guion TTS"
                        variant="teal"
                        alwaysExpanded
                        onClick={applyScriptStepsToScriptText}
                      />
                      <ExpandableButton
                        size="sm"
                        icon={<Plus />}
                        label="Añadir Escena"
                        variant="emerald"
                        alwaysExpanded
                        onClick={() =>
                          setScriptSteps((prev) => [
                            ...prev,
                            {
                              id: `step-${Date.now()}`,
                              timeRange: `${prev.length * 5}.0s-${(prev.length + 1) * 5}.0s`,
                              title: `Escena 0${prev.length + 1}`,
                              narration: '[pausa 0.5s] Nueva frase sincronizada con la voz. <breath>',
                              visualEffect: '07 Zoom-Through',
                            },
                          ])
                        }
                      />
                    </div>
                  </div>

                  {/* Barra Rápida de Etiquetas de Pausa y Respiración */}
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/25 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 mr-1">
                      Insertar en última escena:
                    </span>
                    {PAUSE_AND_EMPHASIS_TAGS.map((p) => (
                      <ExpandableButton
                        key={p.tag}
                        size="sm"
                        icon={<Plus />}
                        label={p.tag}
                        variant="amber"
                        alwaysExpanded
                        title={p.desc}
                        onClick={() => {
                          setScriptSteps((prev) =>
                            prev.map((st, idx) =>
                              idx === prev.length - 1
                                ? { ...st, narration: `${st.narration.trim()} ${p.tag}` }
                                : st,
                            ),
                          );
                        }}
                      />
                    ))}
                  </div>

                  {/* Filas Horizontales de Escenas a Todo lo Ancho */}
                  <div className="space-y-2.5">
                    {scriptSteps.map((st, idx) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="lg:col-span-2 flex items-center gap-1.5">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-extrabold shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={st.timeRange}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScriptSteps((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, timeRange: val } : item,
                                ),
                              );
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-amber-500/30 text-[11px] font-mono font-extrabold text-amber-700 dark:text-amber-300"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScriptSteps((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, title: val } : item,
                                ),
                              );
                            }}
                            placeholder="Título de escena..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <select
                            value={st.visualEffect}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScriptSteps((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, visualEffect: val } : item,
                                ),
                              );
                            }}
                            className="w-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2 py-1.5 text-indigo-700 dark:text-indigo-300"
                          >
                            {ANTIGRAVITY_EFFECTS_CATALOG.map((ef) => (
                              <option key={ef.id} value={ef.label}>
                                {ef.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="lg:col-span-3">
                          <input
                            type="text"
                            value={st.narration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScriptSteps((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, narration: val } : item,
                                ),
                              );
                            }}
                            placeholder="Locución sincronizada de este tramo..."
                            className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="lg:col-span-1 flex justify-end">
                          <ExpandableButton
                            size="sm"
                            icon={<Trash2 />}
                            label="Quitar"
                            variant="danger"
                            disabled={scriptSteps.length <= 1}
                            onClick={() =>
                              setScriptSteps((prev) => prev.filter((_, i) => i !== idx))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUB-TAB 3: CAPAS MULTIMEDIA (VIDEO + VOZ) & TEXTOS EN 3 COLS */}
              {/* ============================================================ */}
              {videoStudioSubTab === 'layers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-150">
                  {/* Columna 1: Subir Video Base */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-blue-500" />
                        1. Tu Video Base a Cámara (Opcional)
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {baseVideoName
                          ? `Activo: ${baseVideoName}`
                          : 'Sube un MP4/WebM tuyo para superponerle capas HTML 60-FPS.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition">
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
                          alwaysExpanded
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

                  {/* Columna 2: Pista de Audio / Locución */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MicVocal className="w-3.5 h-3.5 text-emerald-500" />
                        2. Audio / Locución Sincronizada
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {customAudioName
                          ? `Archivo: ${customAudioName}`
                          : currentAudio
                            ? `Vinculado: ${currentAudio.title}`
                            : 'Usa el audio del Estudio TTS o sube un WAV/MP3.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition">
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
                          alwaysExpanded
                          onClick={() => {
                            URL.revokeObjectURL(customAudioUrl);
                            setCustomAudioUrl(null);
                            setCustomAudioName('');
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Columna 3: Textos de Capa y Subtítulos Palabra a Palabra */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                        3. Textos & Subtítulos
                      </span>
                      <div className="flex items-center gap-1.5">
                        <label className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showDynamicSubtitles}
                            onChange={(e) => setShowDynamicSubtitles(e.target.checked)}
                            className="rounded accent-teal-600"
                          />
                          Subs
                        </label>
                        {showDynamicSubtitles && (
                          <div className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
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
                                    : 'text-slate-600 dark:text-slate-300',
                                )}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={badgeOverlayText}
                        onChange={(e) => setBadgeOverlayText(e.target.value)}
                        placeholder="Insignia superior..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={headlineOverlayText}
                        onChange={(e) => setHeadlineOverlayText(e.target.value)}
                        placeholder="Titular principal..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {['#c7f303', '#14b8a6', '#10b981', '#6366f1', '#f59e0b', '#f43f5e'].map(
                          (col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setAccentColor(col)}
                              style={{ backgroundColor: col }}
                              className={cn(
                                'w-5 h-5 rounded-md border-2 transition cursor-pointer',
                                accentColor === col
                                  ? 'border-white ring-2 ring-teal-500 scale-110'
                                  : 'border-transparent opacity-80',
                              )}
                            />
                          ),
                        )}
                      </div>
                      <ExpandableButton
                        size="sm"
                        icon={<RefreshCw />}
                        label="Aplicar al Lienzo"
                        variant="cyan"
                        alwaysExpanded
                        onClick={() =>
                          handleRebuildDefaultTemplate(aspectRatio, Boolean(baseVideoUrl))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUB-TAB 4: EDITOR DE CÓDIGO HTML5 / TAILWIND / GSAP EN VIVO  */}
              {/* ============================================================ */}
              {videoStudioSubTab === 'code' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-cyan-500" />
                        Código Fuente HTML5 / Tailwind / GSAP en Vivo
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Cualquier cambio aquí actualiza inmediatamente el Monitor en Vivo de abajo.
                      </p>
                    </div>
                    <ExpandableButton
                      size="sm"
                      icon={<RefreshCw />}
                      label="Restaurar Plantilla Actual"
                      variant="amber"
                      alwaysExpanded
                      onClick={() =>
                        handleRebuildDefaultTemplate(
                          aspectRatio,
                          Boolean(baseVideoUrl),
                          selectedSceneTemplate,
                        )
                      }
                    />
                  </div>
                  <textarea
                    rows={12}
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="w-full bg-[#070d17] text-emerald-300 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* ================================================================ */}
            {/* BLOQUE 2 (POR ENCIMA DEL MONITOR): GENERADOR DE VIDEO CON IA Y   */}
            {/* ANTIGRAVITY EN 3 PASOS                                           */}
            {/* ================================================================ */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/35 dark:border-purple-500/40 bg-gradient-to-r from-indigo-50/50 via-purple-50/40 to-cyan-50/40 dark:from-[#0a1324] dark:via-[#11122c] dark:to-[#091c29] p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-800 dark:text-purple-200 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                    ✨ GENERADOR DE VIDEO CON IA Y ANTIGRAVITY • 3 PASOS
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    De tu Guion y Efectos al Video HTML5 + GSAP en Vivo
                  </h3>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                  PASO 01 (Super-Prompt) → PASO 02 (Generar Video) → PASO 03 (Correcciones en Vivo)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* TARJETA 1: PASO 01 - SUPER-PROMPT TÉCNICO */}
                <div className="rounded-2xl border border-indigo-500/35 bg-white/90 dark:bg-slate-900/90 p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0 overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold">
                        PASO 01 • ARQUITECTURA 7 PIEZAS
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {selectedSkillEffects.length} FX • {scriptSteps.length} escenas
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Construir Super-Prompt Técnico (Timings + Efectos)
                    </h4>
                    <textarea
                      rows={4}
                      value={aiScenePrompt}
                      onChange={(e) => setAiScenePrompt(e.target.value)}
                      placeholder="Haz clic en '1. Generar Super-Prompt' para ensamblar las 7 Piezas, tiempos y efectos seleccionados..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-indigo-500/30 rounded-xl p-2.5 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-y font-mono leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-indigo-500/15">
                    <button
                      type="button"
                      disabled={isGeneratingSuperPrompt}
                      onClick={handleBuildAntigravitySuperPrompt}
                      className="text-left text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-[#C7F303] truncate cursor-pointer transition disabled:opacity-60"
                    >
                      {isGeneratingSuperPrompt
                        ? '⚡ Consultando IA Gemini...'
                        : lastSuperPromptAiModel
                          ? `⚡ IA Activa (${lastSuperPromptAiModel})`
                          : '⚡ IA Gemini + 7 Piezas'}
                    </button>
                    <ExpandableButton
                      size="sm"
                      icon={
                        isGeneratingSuperPrompt ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Wand2 />
                        )
                      }
                      label={
                        isGeneratingSuperPrompt
                          ? 'Construyendo Super-Prompt...'
                          : '1. Generar Super-Prompt'
                      }
                      variant="indigo"
                      disabled={isGeneratingSuperPrompt}
                      onClick={handleBuildAntigravitySuperPrompt}
                    />
                  </div>
                </div>

                {/* TARJETA 2: PASO 02 - COMPILAR VIDEO CON ANTIGRAVITY */}
                <div className="rounded-2xl border border-purple-500/45 bg-gradient-to-b from-purple-500/10 via-white/95 to-teal-500/10 dark:from-purple-950/35 dark:via-slate-900/95 dark:to-teal-950/25 p-4 flex flex-col justify-between gap-3 shadow-xs ring-1 ring-purple-500/20 min-w-0 overflow-hidden">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-800 dark:text-[#C7F303] font-mono text-[10px] font-extrabold">
                        PASO 02 • MOTOR 60-FPS + VOZ
                      </span>
                      <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-300">
                        {(videoDuration || 20).toFixed(1)}s sincronizados
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Programar Video HTML5 + GSAP y Enviar al Lienzo
                    </h4>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-purple-500/25 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Formato & Arte:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {aspectRatio} • {selectedArtDirection}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Audio vinculado:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-300 truncate max-w-[160px]">
                          {customAudioName || currentAudio?.title || `Voz ${selectedVoice}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Destino automático:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300 truncate">
                          Lienzo en Vivo + Biblioteca
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-500/20">
                    <button
                      type="button"
                      disabled={isGeneratingHtmlAi}
                      onClick={handleGenerateHtmlWithAi}
                      className="text-left text-[11px] font-extrabold text-purple-800 dark:text-purple-300 hover:text-purple-600 dark:hover:text-[#C7F303] truncate cursor-pointer transition disabled:opacity-60"
                    >
                      {isGeneratingHtmlAi
                        ? '🎬 Programando 60-FPS...'
                        : '🎬 Compilar al Lienzo en Vivo'}
                    </button>
                    <ExpandableButton
                      size="sm"
                      icon={
                        isGeneratingHtmlAi ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Sparkles />
                        )
                      }
                      label={
                        isGeneratingHtmlAi
                          ? 'Antigravity Programando...'
                          : '2. Enviar al Generador de Video'
                      }
                      variant="purple"
                      disabled={isGeneratingHtmlAi}
                      onClick={handleGenerateHtmlWithAi}
                    />
                  </div>
                </div>

                {/* TARJETA 3: PASO 03 - CORRECCIONES EN VIVO CON ANTIGRAVITY */}
                <div className="rounded-2xl border border-cyan-500/35 bg-white/90 dark:bg-slate-900/90 p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0 overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-extrabold">
                        PASO 03 • REFINAMIENTO EN VIVO
                      </span>
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      ¿Deseas ajustar algo del video? Pide correcciones
                    </h4>

                    {/* Chips rápidos de corrección */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        'Agranda los títulos en verde lima #C7F303',
                        'Añade Giro 3D en la escena 2',
                        'Fondo Dark Tech HUD #0C192E',
                        'Resalta más el titular de portada',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setVideoCorrectionPrompt(chip)}
                          className="px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-[10px] font-semibold text-cyan-800 dark:text-cyan-300 cursor-pointer transition"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={videoCorrectionPrompt}
                      onChange={(e) => setVideoCorrectionPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendCorrectionsToAntigravity();
                        }
                      }}
                      placeholder="Escribe qué quieres cambiar y presiona Enter..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-cyan-500/15">
                    <button
                      type="button"
                      disabled={isApplyingCorrection || !videoCorrectionPrompt.trim()}
                      onClick={handleSendCorrectionsToAntigravity}
                      className="text-left text-[11px] font-extrabold text-cyan-800 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-[#C7F303] truncate cursor-pointer transition disabled:opacity-50"
                    >
                      {isApplyingCorrection
                        ? '✨ Aplicando Correcciones...'
                        : '✨ Edición Directa sobre Lienzo'}
                    </button>
                    <ExpandableButton
                      size="sm"
                      icon={
                        isApplyingCorrection ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Wand2 />
                        )
                      }
                      label={
                        isApplyingCorrection
                          ? 'Aplicando Correcciones...'
                          : '3. Enviar Correcciones a Antigravity'
                      }
                      variant="cyan"
                      disabled={isApplyingCorrection || !videoCorrectionPrompt.trim()}
                      onClick={handleSendCorrectionsToAntigravity}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* BLOQUE 3: MONITOR EN VIVO & LIENZO INTERACTIVO                   */}
            {/* ================================================================ */}
            <div className="w-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Cabecera del Monitor & Editor (Botones Oficiales WAPPY que se expanden al pasar el cursor) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      'w-3 h-3 rounded-full shrink-0',
                      isVisualEditMode
                        ? 'bg-amber-500 animate-ping'
                        : isVideoPlaying
                          ? 'bg-[#C7F303] animate-pulse'
                          : 'bg-teal-500',
                    )}
                  />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {isVisualEditMode
                      ? `Editor Visual Interactivo (${aspectRatio})`
                      : `Monitor en Vivo & Lienzo Interactivo (${aspectRatio})`}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    {aspectRatio === '9:16' ? '1080×1920 Vertical' : '1920×1080 Horizontal'} • 60 FPS
                  </span>
                </div>

                {/* Botonera Oficial WAPPY (ExpandableButton con hover expand/contract) */}
                <div className="flex flex-wrap items-center gap-2">
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
                    label="Renderizar .MP4"
                    variant="teal"
                    disabled={isRenderingServerMp4}
                    onClick={handleRenderServerMp4}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={isBuildingAcademyHtml ? <Loader2 className="animate-spin" /> : <Download />}
                    label="Descargar .HTML"
                    variant="green"
                    disabled={isBuildingAcademyHtml}
                    onClick={handleDownloadHtmlBundle}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Save />}
                    label="Guardar en Biblioteca"
                    variant="indigo"
                    onClick={() => saveVideoProjectToLibrary({}, false)}
                  />

                  <ExpandableButton
                    size="sm"
                    icon={<Maximize2 />}
                    label="Pantalla Completa"
                    variant="cyan"
                    onClick={toggleStageFullscreen}
                  />
                </div>
              </div>

              {/* Barra de Herramientas Rápidas del Modo Editor Visual (100% Botones WAPPY) */}
              {isVisualEditMode && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-amber-500 shrink-0" />
                    Arrastra cualquier elemento con el mouse • Doble clic sobre textos para editar en vivo
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <ExpandableButton
                      size="sm"
                      icon={<Type />}
                      label="+ Texto"
                      variant="teal"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_ADD_ELEMENT', kind: 'text' },
                          '*',
                        )
                      }
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Layers />}
                      label="+ Caja / Tarjeta"
                      variant="purple"
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_ADD_ELEMENT', kind: 'card' },
                          '*',
                        )
                      }
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Move />}
                      label="Caja Padre"
                      variant="cyan"
                      disabled={!selectedCanvasElement}
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_SELECT_PARENT' },
                          '*',
                        )
                      }
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Copy />}
                      label="Duplicar"
                      variant="indigo"
                      disabled={!selectedCanvasElement}
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_DUPLICATE_SELECTED' },
                          '*',
                        )
                      }
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Trash2 />}
                      label="Eliminar"
                      variant="danger"
                      disabled={!selectedCanvasElement}
                      onClick={() =>
                        iframeRef.current?.contentWindow?.postMessage(
                          { type: 'STUDIO_DELETE_SELECTED' },
                          '*',
                        )
                      }
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Check />}
                      label="Guardar Cambios"
                      variant="emerald"
                      onClick={handleSaveVisualEdits}
                    />
                  </div>
                </div>
              )}

              {/* Cuerpo del Estudio: Escenario Amplio (7 cols) + Consola Transporte & Exportación (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* IZQUIERDA/CENTRO (7 cols): Escenario Cinematográfico Amplio sin recortes */}
                <div className="lg:col-span-7 flex justify-center items-center bg-[#060d18] rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-inner overflow-hidden min-h-[480px]">
                  <div
                    ref={stageContainerRef}
                    className={cn(
                      'relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300',
                      isStageFullscreen
                        ? 'w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6'
                        : cn(
                            'rounded-2xl mx-auto flex items-center justify-center',
                            aspectRatio === '9:16'
                              ? 'w-full max-w-[390px] aspect-[9/16] max-h-[640px]'
                              : 'w-full max-w-[760px] aspect-[16/9] max-h-[520px] min-h-[300px]',
                          ),
                    )}
                  >
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
                            const curT = e.currentTarget.currentTime;
                            const durT =
                              e.currentTarget.duration && !isNaN(e.currentTarget.duration)
                                ? e.currentTarget.duration
                                : videoDuration || 20;
                            setVideoCurrentTime(curT);
                            iframeRef.current?.contentWindow?.postMessage(
                              {
                                type: 'STUDIO_SYNC_TIME',
                                currentTime: curT,
                                duration: durT,
                                playing: !e.currentTarget.paused && !e.currentTarget.ended,
                              },
                              '*',
                            );
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

                      {/* CAPA 1: Video Base Subido por el Usuario */}
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

                      {/* CAPA 3: Subtítulos Dinámicos Sincronizados Palabra a Palabra */}
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
                          <div className="bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]">
                            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                              {currentSubtitleWindow.words.map((word, idx) => {
                                const isActiveWord = idx === currentSubtitleWindow.activeOffset;
                                return (
                                  <span
                                    key={`${word}-${idx}`}
                                    className={cn(
                                      'text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150',
                                      isActiveWord
                                        ? 'text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]'
                                        : 'text-white/95',
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

                    {/* BARRA DE CONTROL FLOTANTE EN PANTALLA COMPLETA */}
                    {isStageFullscreen && (
                      <div className="w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl">
                        <ExpandableButton
                          size="sm"
                          icon={isVideoPlaying ? <Pause /> : <Play />}
                          label={isVideoPlaying ? 'Pausar' : 'Play'}
                          variant="teal"
                          onClick={toggleStagePlayback}
                        />

                        <ExpandableButton
                          size="sm"
                          icon={<RotateCcw />}
                          label="Reiniciar"
                          variant="cyan"
                          onClick={restartStagePlayback}
                        />

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

                        <ExpandableButton
                          size="sm"
                          icon={<Edit3 />}
                          label={isVisualEditMode ? 'Editando' : 'Editar'}
                          variant="orange"
                          isActive={isVisualEditMode}
                          onClick={toggleVisualEditMode}
                        />

                        <ExpandableButton
                          size="sm"
                          icon={<Minimize2 />}
                          label="Salir"
                          variant="danger"
                          onClick={toggleStageFullscreen}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* DERECHA (5 cols): Consola de Transporte, Inspector Visual & Exportación Multimodal */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  {/* 1. Consola de Transporte y Línea de Tiempo Sincronizada */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-teal-500" />
                        Transporte & Sincronía de Voz
                      </span>
                      <span className="text-xs font-mono font-extrabold text-teal-700 dark:text-teal-300 tabular-nums">
                        {videoCurrentTime.toFixed(1)}s / {(videoDuration || 20).toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <ExpandableButton
                        size="sm"
                        icon={isVideoPlaying ? <Pause /> : <Play />}
                        label={isVideoPlaying ? 'Pausar Video' : 'Reproducir Video'}
                        variant="teal"
                        onClick={toggleStagePlayback}
                      />

                      <ExpandableButton
                        size="sm"
                        icon={<RotateCcw />}
                        label="Reiniciar"
                        variant="cyan"
                        onClick={restartStagePlayback}
                      />

                      {baseVideoUrl && (
                        <ExpandableButton
                          size="sm"
                          icon={muteBaseVideo ? <VolumeX /> : <Volume2 />}
                          label={muteBaseVideo ? 'Audio Base OFF' : 'Audio Base ON'}
                          variant={muteBaseVideo ? 'danger' : 'emerald'}
                          onClick={() => setMuteBaseVideo(!muteBaseVideo)}
                        />
                      )}
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 20}
                      step={0.1}
                      value={videoCurrentTime}
                      onChange={(e) => handleStageSeek(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <span>
                        Locución:{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {currentAudio?.voiceName || selectedVoice}
                        </strong>
                      </span>
                      <span>
                        Subtítulos:{' '}
                        <strong className="text-teal-600 dark:text-teal-400">
                          {showDynamicSubtitles ? `Activos (${subtitlePosition})` : 'Ocultos'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* 2. Tarjeta de Exportación MP4 Todo Unido (Renderizado con Antigravity) */}
                  <div className="p-4 rounded-2xl border bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-100 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-800 dark:text-teal-200">
                          WhatsApp • Celular • Reels • TikTok
                        </span>
                        <Film className="w-4 h-4 text-teal-600 dark:text-teal-300 shrink-0" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold">
                        Descargar Video .MP4 (Todo Unido: HTML + Voz + Subtítulos)
                      </h4>
                      <p className="text-[11px] text-teal-800/80 dark:text-teal-200/80 leading-snug">
                        Envía la composición a Antigravity / FFmpeg para ensamblar el archivo .MP4 final listo para redes.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-teal-500/20">
                      <button
                        type="button"
                        disabled={isRenderingServerMp4}
                        onClick={handleRenderServerMp4}
                        className="text-left text-xs font-extrabold text-teal-800 dark:text-teal-200 hover:text-teal-600 dark:hover:text-[#C7F303] truncate cursor-pointer transition disabled:opacity-60"
                      >
                        {isRenderingServerMp4
                          ? '📦 Renderizando Video .MP4...'
                          : '📦 FFmpeg + Audio WAV Embebido'}
                      </button>
                      <ExpandableButton
                        size="sm"
                        icon={
                          isRenderingServerMp4 ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Film />
                          )
                        }
                        label={
                          isRenderingServerMp4
                            ? 'Renderizando Video .MP4...'
                            : 'Descargar Video .MP4 (Todo Unido)'
                        }
                        variant="teal"
                        disabled={isRenderingServerMp4}
                        onClick={handleRenderServerMp4}
                      />
                    </div>
                  </div>

                  {/* 3. Tarjeta de Exportación Instantánea HTML5 (Sin esperar a Antigravity) */}
                  <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                          Descarga Inmediata • Academia WAPPY LMS
                        </span>
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold">
                        Cápsula Interactiva HTML5 (Con Audio Embebido)
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 leading-snug">
                        Descarga inmediata en 1 clic sin re-renderizar, lista para abrir en cualquier navegador o incrustar en LMS.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
                      <button
                        type="button"
                        disabled={isBuildingAcademyHtml}
                        onClick={handleDownloadHtmlBundle}
                        className="text-left text-xs font-extrabold text-emerald-800 dark:text-emerald-200 hover:text-emerald-600 dark:hover:text-[#C7F303] truncate cursor-pointer transition disabled:opacity-60"
                      >
                        ⚡ Cápsula Offline + Código LMS
                      </button>
                      <div className="flex items-center gap-1.5">
                        <ExpandableButton
                          size="sm"
                          icon={
                            isBuildingAcademyHtml ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Download />
                            )
                          }
                          label="Descargar .HTML Inmediato"
                          variant="green"
                          disabled={isBuildingAcademyHtml}
                          onClick={handleDownloadHtmlBundle}
                        />
                        <ExpandableButton
                          size="sm"
                          icon={<Copy />}
                          label="Copiar LMS"
                          variant="fuchsia"
                          disabled={isBuildingAcademyHtml}
                          onClick={handleCopyLmsEmbed}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Inspector Visual del Elemento Seleccionado en el Lienzo */}
                  {isVisualEditMode && selectedCanvasElement && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          Elemento (&lt;{selectedCanvasElement.tagName}&gt;)
                        </span>
                        <ExpandableButton
                          size="sm"
                          icon={<RotateCcw />}
                          label="Restablecer"
                          variant="teal"
                          onClick={() => updateSelectedCanvasElement({ dx: 0, dy: 0, scale: 1 })}
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={selectedCanvasElement.text}
                        onChange={(e) => updateSelectedCanvasElement({ text: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Letra ({selectedCanvasElement.fontSize}px)
                          </label>
                          <div className="flex items-center gap-1">
                            <ExpandableButton
                              size="sm"
                              icon={<Minimize2 />}
                              label="A-"
                              variant="neutral"
                              onClick={() =>
                                updateSelectedCanvasElement({
                                  fontSize: Math.max(10, selectedCanvasElement.fontSize - 2),
                                })
                              }
                            />
                            <ExpandableButton
                              size="sm"
                              icon={<Maximize2 />}
                              label="A+"
                              variant="neutral"
                              onClick={() =>
                                updateSelectedCanvasElement({
                                  fontSize: Math.min(96, selectedCanvasElement.fontSize + 2),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Escala ({selectedCanvasElement.scale}x)
                          </label>
                          <div className="flex items-center gap-1">
                            <ExpandableButton
                              size="sm"
                              icon={<Minimize2 />}
                              label="-"
                              variant="neutral"
                              onClick={() =>
                                updateSelectedCanvasElement({
                                  scale: Math.max(
                                    0.5,
                                    Number((selectedCanvasElement.scale - 0.1).toFixed(2)),
                                  ),
                                })
                              }
                            />
                            <ExpandableButton
                              size="sm"
                              icon={<Plus />}
                              label="+"
                              variant="neutral"
                              onClick={() =>
                                updateSelectedCanvasElement({
                                  scale: Math.min(
                                    2.5,
                                    Number((selectedCanvasElement.scale + 0.1).toFixed(2)),
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Texto
                          </label>
                          <input
                            type="color"
                            value={selectedCanvasElement.color}
                            onChange={(e) => updateSelectedCanvasElement({ color: e.target.value })}
                            className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Fondo
                          </label>
                          <input
                            type="color"
                            value={selectedCanvasElement.backgroundColor}
                            onChange={(e) =>
                              updateSelectedCanvasElement({ backgroundColor: e.target.value })
                            }
                            className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 3: LABORATORIO DE EXPRESIVIDAD, VOCAL BURSTS & SKILLS FX     */}
        {/* ==================================================================== */}
        {activeTab === 'lab' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tarjeta de Cabecera del Laboratorio */}
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Laboratorio de Voces, Pausas, Vocal Bursts & Efectos Antigravity
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Escucha y prueba las 30 voces en vivo, construye pausas/respiraciones y selecciona los efectos visuales de las Skills de Antigravity para tu video.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExpandableButton
                  size="sm"
                  icon={<Volume2 />}
                  label="SFX Whoosh"
                  variant="cyan"
                  alwaysExpanded
                  onClick={() => playStudioSfxPreview('whoosh')}
                />
                <ExpandableButton
                  size="sm"
                  icon={<Volume2 />}
                  label="SFX Pop"
                  variant="amber"
                  alwaysExpanded
                  onClick={() => playStudioSfxPreview('pop')}
                />
                <ExpandableButton
                  size="sm"
                  icon={<Volume2 />}
                  label="SFX Ding"
                  variant="emerald"
                  alwaysExpanded
                  onClick={() => playStudioSfxPreview('ding')}
                />
              </div>
            </div>

            {/* Selector de Modelo en el Laboratorio */}
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400',
                      )}
                    >
                      {m.name} ({m.supportedVoices.length} voces)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 1: Efectos Vocales Orgánicos Integrados */}
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    1. Efectos Vocales Orgánicos (Vocal Bursts en Vivo)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Escucha cómo suena cada etiqueta con la voz actual ({selectedVoice}) o insértala en tu frase de prueba.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vocalBursts.map((b) => {
                  const isPlayingThis = playingBurstTag === b.tag;
                  return (
                    <div
                      key={b.tag}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                          {b.tag}
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{b.label}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{b.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ExpandableButton
                          size="sm"
                          icon={<Plus />}
                          label="Insertar"
                          variant="amber"
                          onClick={() => {
                            setLabTestText((prev) => `${prev.trim()} ${b.tag} `);
                          }}
                        />
                        <ExpandableButton
                          size="sm"
                          icon={
                            isPlayingThis ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Play />
                            )
                          }
                          label="Probar"
                          variant="indigo"
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
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: Probador Libre de Prosodia, Pausas y Dirección de Voz */}
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    2. Probador de Voces en Vivo y Constructor de Pausas / Énfasis
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Selecciona cualquier voz, escucha su timbre al instante, agrega pausas y envía tu configuración al Estudio de Voz o al Editor de Video.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Voces activas: {activeVoicesCount} de {voices.length}
                  </span>
                  <ExpandableButton
                    size="sm"
                    icon={
                      auditioningVoiceId === selectedVoice ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Volume2 />
                      )
                    }
                    label={`Escuchar ${selectedVoice}`}
                    variant="teal"
                    alwaysExpanded
                    disabled={auditioningVoiceId === selectedVoice}
                    onClick={() => handleAuditionVoice(selectedVoice)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5',
                          isSelected
                            ? 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/50 ring-1 ring-teal-500/30'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400',
                          !supported && 'opacity-55',
                        )}
                      >
                        <span>
                          {v.name} ({v.gender})
                        </span>
                        {supported && <Check className="w-3 h-3 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Prompt de Dirección (speechMetadata.style)
                </label>
                <input
                  type="text"
                  value={labStylePrompt}
                  onChange={(e) => setLabStylePrompt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Chips para insertar Pausas, Respiración y Énfasis en el Laboratorio */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Insertar Pausas, Respiración y Énfasis en el Texto de Prueba:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PAUSE_AND_EMPHASIS_TAGS.map((p) => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => setLabTestText((prev) => `${prev.trim()} ${p.tag} `)}
                      title={p.desc}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      + {p.label} <span className="font-mono opacity-75">({p.tag})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Texto de Prueba
                </label>
                <textarea
                  rows={3}
                  value={labTestText}
                  onChange={(e) => setLabTestText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <ExpandableButton
                  size="md"
                  icon={
                    isSynthesizingLab ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Sparkles />
                    )
                  }
                  label={
                    isSynthesizingLab
                      ? 'Sintetizando en el Laboratorio...'
                      : 'Sintetizar en el Laboratorio'
                  }
                  variant="indigo"
                  alwaysExpanded
                  disabled={isSynthesizingLab || !labTestText.trim()}
                  onClick={handleSynthesizeInLab}
                />

                <ExpandableButton
                  size="md"
                  icon={<MicVocal />}
                  label="Llevar Frase y Voz al Estudio TTS"
                  variant="teal"
                  alwaysExpanded
                  onClick={() => {
                    setScriptText(labTestText);
                    setStylePrompt(labStylePrompt);
                    handleTabChange('tts');
                  }}
                />

                {!podcastOnly && (
                  <ExpandableButton
                    size="md"
                    icon={<Film />}
                    label="Llevar al Editor de Video"
                    variant="purple"
                    alwaysExpanded
                    onClick={() => {
                      setScriptText(labTestText);
                      setStylePrompt(labStylePrompt);
                      handleTabChange('video');
                    }}
                  />
                )}
              </div>
            </div>

            {/* SECCIÓN 3: Catálogo de Efectos Visuales de las Skills de Antigravity (18 Efectos + 4 Direcciones de Arte) */}
            {!podcastOnly && (
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                    3. Catálogo de Efectos Visuales & Motion Graphics (Skills de Antigravity)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Selecciona los efectos y transiciones que Antigravity encadenará a 60 FPS en tu video HTML + GSAP ({selectedSkillEffects.length} activos).
                  </p>
                </div>
                <ExpandableButton
                  size="sm"
                  icon={<Film />}
                  label={`Ir al Editor de Video (${selectedSkillEffects.length} efectos)`}
                  variant="purple"
                  alwaysExpanded
                  onClick={() => handleTabChange('video')}
                />
              </div>

              {/* 4 Direcciones de Arte Oficiales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ANTIGRAVITY_ART_DIRECTIONS.map((art) => {
                  const isSelected = selectedArtDirection === art.id;
                  return (
                    <div
                      key={art.id}
                      className={cn(
                        'p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition',
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {art.label}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            60 FPS
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                          {art.colors}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          {art.description}
                        </p>
                      </div>
                      <ExpandableButton
                        size="sm"
                        icon={isSelected ? <Check /> : <Sparkles />}
                        label={isSelected ? 'Dirección Activa' : 'Usar Dirección de Arte'}
                        variant={isSelected ? 'teal' : 'purple'}
                        alwaysExpanded
                        onClick={() => setSelectedArtDirection(art.id)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 18 Efectos Virales de las Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ANTIGRAVITY_EFFECTS_CATALOG.map((ef) => {
                  const active = selectedSkillEffects.includes(ef.id);
                  return (
                    <div
                      key={ef.id}
                      className={cn(
                        'p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition',
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/45 ring-1 ring-indigo-500/30'
                          : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {ef.label}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                            {ef.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                          {ef.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <ExpandableButton
                          size="sm"
                          icon={active ? <Check /> : <Plus />}
                          label={
                            active ? 'Activo en Editor de Video' : 'Agregar al Editor de Video'
                          }
                          variant={active ? 'teal' : 'indigo'}
                          alwaysExpanded
                          onClick={() => toggleSkillEffect(ef.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 4: BIBLIOTECA DE AUDIOS Y VIDEOS HTML GENERADOS              */}
        {/* ==================================================================== */}
        {activeTab === 'library' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  {podcastOnly
                    ? 'Biblioteca de Podcasts y Locuciones 24 kHz'
                    : 'Biblioteca de Audios y Videos HTML'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {podcastOnly
                    ? 'Tus episodios de podcast y locuciones WAV a 24 kHz quedan guardados permanentemente para reproducirlos o descargarlos al instante.'
                    : 'Tus locuciones WAV y tus videos HTML5 + GSAP quedan guardados permanentemente para reabrir en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtros de Biblioteca: Todos / Audios / Videos HTML */}
                {!podcastOnly && (
                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {(
                      [
                        { id: 'all', label: `Todos (${libraryItems.length})` },
                        {
                          id: 'audio',
                          label: `🎙️ Audios (${libraryItems.filter((i) => i.kind !== 'video').length})`,
                        },
                        {
                          id: 'video',
                          label: `🎬 Videos HTML (${libraryItems.filter((i) => i.kind === 'video').length})`,
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLibraryFilter(f.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer',
                          libraryFilter === f.id
                            ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/40'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {libraryItems.length > 0 && (
                  <ExpandableButton
                    size="sm"
                    icon={<Trash2 />}
                    label="Limpiar Historial"
                    variant="danger"
                    alwaysExpanded
                    onClick={() => {
                      if (!window.confirm('¿Borrar todos los audios y videos guardados?')) return;
                      setLibraryItems([]);
                      clearMediaBlobs();
                    }}
                  />
                )}
              </div>
            </div>

            {libraryItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
                <MicVocal className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {podcastOnly
                    ? 'Aún no hay episodios de podcast en tu biblioteca'
                    : 'Aún no hay audios ni videos en tu biblioteca'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {podcastOnly
                    ? 'Genera tu primer episodio de podcast o locución en "1. Estudio de Podcast & Voz" y aparecerá aquí automáticamente.'
                    : 'Genera una locución en "Estudio de Voz (TTS)" o un video en "Compositor de Video HTML" y aparecerán aquí automáticamente.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryItems
                  .filter((item) => {
                    if (podcastOnly) return item.kind !== 'video';
                    if (libraryFilter === 'video') return item.kind === 'video';
                    if (libraryFilter === 'audio') return item.kind !== 'video';
                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.kind === 'video' && (
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                🎬 VIDEO HTML {item.aspectRatio || ''}
                              </span>
                            )}
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                              {item.voiceName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <span>⏱ {formatDurationBadge(item.durationSeconds)}</span>
                          <span>•</span>
                          <span>{item.wordCount} palabras</span>
                          <span>•</span>
                          <span>{formatLibraryDate(item.createdAt)}</span>
                        </div>
                        {item.stylePrompt && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2">
                            "{item.stylePrompt}"
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.kind === 'video' ? (
                            <ExpandableButton
                              size="sm"
                              icon={<Edit3 />}
                              label="Abrir en Editor"
                              variant="orange"
                              alwaysExpanded
                              onClick={() => openLibraryVideo(item)}
                            />
                          ) : (
                            <>
                              <ExpandableButton
                                size="sm"
                                icon={<Play />}
                                label="Reproducir"
                                variant="teal"
                                alwaysExpanded
                                onClick={() => openLibraryAudio(item)}
                              />
                              <ExpandableButton
                                size="sm"
                                icon={<Edit3 />}
                                label="Editar"
                                variant="amber"
                                alwaysExpanded
                                onClick={() => handleEditLibraryAudio(item)}
                              />
                              {!podcastOnly && (
                                <ExpandableButton
                                  size="sm"
                                  icon={<Film />}
                                  label="Usar en Video"
                                  variant="purple"
                                  alwaysExpanded
                                  onClick={() => openLibraryAudio(item, true)}
                                />
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.kind === 'video' && (
                            <>
                              <ExpandableButton
                                size="sm"
                                icon={<Download />}
                                label="Descargar .HTML"
                                variant="green"
                                alwaysExpanded
                                onClick={async () => {
                                  if (item.capsuleKey) {
                                    const b = await getMediaBlob(item.capsuleKey);
                                    if (b) {
                                      downloadBlobFile(b, `wappy-video-${item.id}.html`);
                                      return;
                                    }
                                  }
                                  if (item.htmlKey) {
                                    const b = await getMediaBlob(item.htmlKey);
                                    if (b) {
                                      downloadBlobFile(b, `wappy-video-${item.id}.html`);
                                      return;
                                    }
                                  }
                                  setStatusBanner({
                                    type: 'error',
                                    text: 'No se encontró el archivo HTML guardado para este elemento.',
                                  });
                                }}
                              />
                              <ExpandableButton
                                size="sm"
                                icon={<Film />}
                                label={item.mp4Key ? 'Descargar .MP4' : 'Renderizar .MP4'}
                                variant="teal"
                                alwaysExpanded
                                onClick={async () => {
                                  if (item.mp4Key) {
                                    const b = await getMediaBlob(item.mp4Key);
                                    if (b) {
                                      downloadBlobFile(b, `wappy-studio-reel-${item.id}.mp4`);
                                      return;
                                    }
                                  }
                                  await openLibraryVideo(item);
                                  setTimeout(() => {
                                    handleRenderServerMp4();
                                  }, 250);
                                }}
                              />
                            </>
                          )}
                          {item.kind !== 'video' && (
                            <ExpandableButton
                              size="sm"
                              icon={<Download />}
                              label="Descargar WAV"
                              variant="green"
                              alwaysExpanded
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

      {/* MODAL DE CONEXIÓN ANTIGRAVITY + SKILLS DE VIDEO & CLAVES API GOOGLE GEMINI (3 PESTAÑAS) */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Enlace Personal Antigravity, Pack de 7 Skills & Claves IA
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Conecta tu propio Antigravity (con o sin cuenta en WAPPY), instala las 7 Skills de Video/Diseño y gestiona tus claves Gemini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pestañas del Modal (3 Pestañas) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setApiKeyModalTab('antigravity')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5',
                  apiKeyModalTab === 'antigravity'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>🔌 Mi Antigravity & Skills</span>
              </button>
              <button
                type="button"
                onClick={() => setApiKeyModalTab('keys')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5',
                  apiKeyModalTab === 'keys'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Mis Claves Locales ({activeCustomKeyCount}/3)</span>
              </button>
              <button
                type="button"
                onClick={() => setApiKeyModalTab('models')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5',
                  apiKeyModalTab === 'models'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Modelos WAPPY ({WAPPY_GOOGLE_MODELS_ECOSYSTEM.length})</span>
              </button>
            </div>

            {apiKeyModalTab === 'antigravity' ? (
              <div className="space-y-4">
                {/* 1. Clave de Enlace Personal (Usuario wpy_... o Visitante wpy_guest_...) */}
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        1. Tu Clave de Enlace Personal Antigravity
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
                        {antigravityBridgeKey.startsWith('wpy_guest_')
                          ? 'Clave automática de visitante (sin necesidad de cuenta). También puedes pegar aquí tu clave wpy_... si tienes cuenta en WAPPY.'
                          : 'Clave personal vinculada a tu cuenta de WAPPY IA.'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5',
                        antigravityStreamConnected
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          antigravityStreamConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500',
                        )}
                      />
                      {antigravityStreamConnected ? 'Stream SSE Activo' : 'Listo para Enlazar'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={antigravityBridgeKey}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setAntigravityBridgeKey(val);
                        try {
                          localStorage.setItem('wappy_antigravity_bridge_key', val);
                        } catch {
                          /* ignore */
                        }
                      }}
                      placeholder="wpy_... o wpy_guest_..."
                      className="flex-1 px-3 py-2 rounded-xl border border-purple-500/30 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <ExpandableButton
                        size="sm"
                        icon={copiedBridgeItem === 'key' ? <Check /> : <Copy />}
                        label={copiedBridgeItem === 'key' ? '¡Copiada!' : 'Copiar Clave'}
                        variant="fuchsia"
                        alwaysExpanded
                        onClick={() => {
                          navigator.clipboard.writeText(antigravityBridgeKey);
                          setCopiedBridgeItem('key');
                          setTimeout(() => setCopiedBridgeItem(null), 2000);
                        }}
                      />
                      <ExpandableButton
                        size="sm"
                        icon={<RefreshCw />}
                        label="Sincronizar"
                        variant="cyan"
                        onClick={() => syncAntigravityBridgeKey(true)}
                        title="Generar o sincronizar clave de enlace Antigravity"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pack Importable de las 7 Skills de Diseño y Video WAPPY IA */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/25 space-y-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        2. 📦 Pack Importable de las 7 Skills de Diseño y Video WAPPY IA
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Instala en tu propio Antigravity las <strong>7 Skills Oficiales de Producción Audiovisual y UI de WAPPY IA</strong> junto con el puente reactivo <code className="font-mono">wappy-push-daemon.js</code> para que tu Antigravity programe videos HTML5 + GSAP a 60 FPS y los envíe directo a este Lienzo:
                      </p>
                    </div>
                  </div>

                  {/* Lista compacta de las 7 Skills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      {
                        id: 'protocolo-produccion-videos',
                        desc: 'Sistema de las 7 Piezas + Portada Magnética (2s)',
                      },
                      {
                        id: 'animaciones-17-efectos-reels',
                        desc: '19 Efectos Virales y Transiciones 3D a 60 FPS',
                      },
                      {
                        id: 'animaciones-wappy-brand',
                        desc: 'Identidad WAPPY Lima #C7F303, Avatar 3D y Tenshi',
                      },
                      {
                        id: 'animaciones-dark-tech-hud',
                        desc: 'HUD Cyberpunk #0C192E + #00D4FF y Tarjetas de Cristal',
                      },
                      {
                        id: 'animaciones-explicativas-sst',
                        desc: 'Visor Normativo Subrayado (Decreto 1072 / Res. 0312 / GTC-45)',
                      },
                      {
                        id: 'hyperframes-motion-design',
                        desc: 'Motor GSAP Determinista y Sincronización Palabra a Palabra',
                      },
                      {
                        id: 'wappy-ui-design-system',
                        desc: 'Sistema de 14 Grupos Semánticos y Glassmorphism',
                      },
                    ].map((sk) => (
                      <div
                        key={sk.id}
                        className="p-2 rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300 truncate">
                            {sk.id}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-zinc-400 truncate">
                            {sk.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Los 3 Botones Oficiales de Descarga e Instalación */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <ExpandableButton
                      size="sm"
                      icon={<Download />}
                      label="Descargar Pack de Skills (.JSON Importable)"
                      variant="green"
                      alwaysExpanded
                      onClick={handleDownloadSkillsBundleJson}
                    />

                    <ExpandableButton
                      size="sm"
                      icon={copiedBridgeItem === 'prompt' ? <Check /> : <Copy />}
                      label={
                        copiedBridgeItem === 'prompt'
                          ? '¡Prompt Copiado al Portapapeles!'
                          : 'Copiar Prompt para Enviar Skills a Antigravity'
                      }
                      variant="indigo"
                      alwaysExpanded
                      onClick={() => {
                        navigator.clipboard.writeText(buildAntigravitySkillsChatPrompt());
                        setCopiedBridgeItem('prompt');
                        setTimeout(() => setCopiedBridgeItem(null), 2500);
                        setStatusBanner({
                          type: 'success',
                          text: '📋 ¡Prompt copiado! Pégalo en el chat de tu Antigravity para instalar automáticamente las 7 Skills y conectar el puente en vivo.',
                        });
                      }}
                    />

                    <ExpandableButton
                      size="sm"
                      icon={<Terminal />}
                      label="Descargar Instalador 1-Clic (.command Mac / .bat Windows)"
                      variant="teal"
                      alwaysExpanded
                      onClick={handleDownloadAntigravitySkillsInstaller}
                    />
                  </div>

                  {/* Vista previa del Prompt / Comando para pegar en Antigravity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                      <span>
                        Prompt listo para pegar en el Chat de tu Antigravity (incluye tu clave{' '}
                        <code className="font-mono text-purple-600 dark:text-purple-400">
                          {antigravityBridgeKey}
                        </code>
                        ):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(buildAntigravitySkillsInstallCmd());
                          setCopiedBridgeItem('terminal');
                          setTimeout(() => setCopiedBridgeItem(null), 2000);
                        }}
                        className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        {copiedBridgeItem === 'terminal'
                          ? '✓ Comando Terminal copiado'
                          : 'Copiar solo comando Terminal'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[10px] border border-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
                      {buildAntigravitySkillsChatPrompt()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                  <ExpandableButton
                    size="sm"
                    icon={<Check />}
                    label="Listo"
                    variant="teal"
                    alwaysExpanded
                    onClick={() => setIsApiKeyModalOpen(false)}
                  />
                </div>
              </div>
            ) : apiKeyModalTab === 'keys' ? (
              <>
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
                  Obtén gratis tus claves en{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold underline hover:text-teal-600"
                  >
                    Google AI Studio (aistudio.google.com)
                  </a>
                  . WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos.
                </div>

                <div className="space-y-2.5">
                  {customApiKeys.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-white">
                            {item.label || `Clave Google Gemini #${idx + 1}`}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold px-1.5 py-0.5 rounded border',
                              idx === 0
                                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                            )}
                          >
                            {idx === 0 ? 'Prioridad #1' : `Failover #${idx + 1}`}
                          </span>
                        </div>
                        {item.status === 'valid' && (
                          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activa y verificada
                          </span>
                        )}
                        {item.status === 'invalid' && (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Clave inválida o vencida
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        value={item.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKeys((prev) =>
                            prev.map((k, i) =>
                              i === idx ? { ...k, key: val, status: 'unchecked' } : k,
                            ),
                          );
                        }}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                      />
                    </div>
                  ))}
                </div>

                {keyValidationMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {keyValidationMsg}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <ExpandableButton
                    size="sm"
                    icon={<Trash2 />}
                    label="Limpiar Claves"
                    variant="danger"
                    onClick={() => {
                      const reset: StoredGeminiKeyItem[] = [
                        { key: '', label: 'Clave Principal #1', status: 'unchecked' },
                        { key: '', label: 'Clave Respaldo #2', status: 'unchecked' },
                        { key: '', label: 'Clave Respaldo #3', status: 'unchecked' },
                      ];
                      setCustomApiKeys(reset);
                      localStorage.removeItem(GEMINI_KEYS_STORAGE);
                      window.dispatchEvent(new CustomEvent('wappy-keys-updated'));
                      setKeyValidationMsg('Claves eliminadas del navegador.');
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <ExpandableButton
                      size="sm"
                      icon={<X />}
                      label="Cerrar"
                      variant="neutral"
                      onClick={() => setIsApiKeyModalOpen(false)}
                    />
                    <ExpandableButton
                      size="sm"
                      icon={isValidatingKeys ? <Loader2 className="animate-spin" /> : <Save />}
                      label={isValidatingKeys ? 'Validando...' : 'Guardar y Validar'}
                      variant="teal"
                      disabled={isValidatingKeys}
                      onClick={handleSaveAndValidateKeys}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>Ecosistema Oficial GOOGLE_MODELS de WAPPY:</strong> Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {WAPPY_GOOGLE_MODELS_ECOSYSTEM.map((gm) => {
                    const isTts = gm.id.includes('tts');
                    const isGen =
                      gm.id === 'gemini-3.8-flash' ||
                      gm.id === 'gemini-3.6-flash' ||
                      gm.id === 'gemini-3.5-flash-lite';
                    const isActive =
                      (isTts && selectedModel === gm.id) ||
                      (isGen && selectedAiModel === gm.id);
                    return (
                      <div
                        key={gm.id}
                        onClick={() => {
                          if (isTts) {
                            setSelectedModel(gm.id);
                          } else if (isGen) {
                            setSelectedAiModel(gm.id);
                          }
                        }}
                        className={cn(
                          'p-3 rounded-xl border text-left transition flex flex-col justify-between',
                          isTts || isGen ? 'cursor-pointer' : 'opacity-90',
                          isActive
                            ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30'
                            : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400',
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                              {gm.category}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                              {gm.badge}
                            </span>
                          </div>
                          <div className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                            {gm.id}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug">
                            {gm.description}
                          </p>
                        </div>
                        {(isTts || isGen) && (
                          <div className="mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-zinc-400">
                              {isTts ? 'Motor de Voz TTS' : 'Motor IA Escenas/Guion'}
                            </span>
                            <span
                              className={cn(
                                'font-extrabold',
                                isActive
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-indigo-600 dark:text-indigo-400',
                              )}
                            >
                              {isActive ? '✓ En uso' : 'Usar este modelo →'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                  <ExpandableButton
                    size="sm"
                    icon={<Check />}
                    label="Listo"
                    variant="teal"
                    onClick={() => setIsApiKeyModalOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  onSendToVideo?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
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

  const skipSeconds = (delta: number) => {
    if (!audioRef.current) return;
    const maxDur = Math.max(1, duration || audioRef.current.duration || 0);
    const next = Math.max(0, Math.min(maxDur, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!src) return;
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'wappy-tts'}.wav`;
    try {
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = src;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const r = await fetch(src, { headers: getAuthHeaders() });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return;
      }
    } catch {
      /* fallback below */
    }
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!src) return null;

  return (
    <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5">
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

      {/* Fila 1: Cabecera del Reproductor (Punto verde + Título + Voz/WAV a la izquierda, Acciones a la derecha) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl">
              {title}
            </h3>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
            Voz:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {voiceName || 'Kore'}
            </span>{' '}
            • Formato WAV 24kHz
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

          {onSendToVideo && (
            <ExpandableButton
              size="sm"
              icon={<Film />}
              label="Llevar al Video"
              variant="purple"
              alwaysExpanded
              onClick={onSendToVideo}
            />
          )}

          <ExpandableButton
            size="sm"
            icon={<Download />}
            label="Descargar WAV"
            variant="green"
            alwaysExpanded
            onClick={handleDownload}
          />
        </div>
      </div>

      {/* Fila 2: Visualizador de Onda Interactivo (42 barras) */}
      <div className="flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden">
        {Array.from({ length: 42 }).map((_, idx) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const barRatio = idx / 42;
          const isPlayed = barRatio <= progress;
          const baseHeight = 20 + Math.sin(idx * 0.4) * 15 + Math.cos(idx * 0.9) * 12;
          const dynamicHeight = isPlaying
            ? Math.max(15, baseHeight * (0.8 + Math.sin(Date.now() / 200 + idx) * 0.4))
            : baseHeight;
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
              style={{ height: `${Math.max(16, Math.min(95, dynamicHeight))}%` }}
              className={cn(
                'w-1 rounded-full cursor-pointer transition-all duration-150',
                isPlayed
                  ? 'bg-gradient-to-t from-indigo-500 to-amber-400'
                  : 'bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700',
              )}
            />
          );
        })}
      </div>

      {/* Fila 3: Barra Deslizante de Tiempo Completa + Tiempos Debajo */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.1}
          value={Math.min(currentTime, Math.max(1, duration))}
          onChange={(e) => {
            const target = parseFloat(e.target.value);
            if (audioRef.current) {
              audioRef.current.currentTime = target;
            }
            setCurrentTime(target);
          }}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Fila 4: Controles de Transporte (Velocidad a la izquierda, ↺ ▶ ↻ al centro, Volumen a la derecha) */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => {
            const rates = [0.75, 1, 1.25, 1.5, 2];
            const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
            setPlaybackRate(next);
            if (audioRef.current) audioRef.current.playbackRate = next;
          }}
          title="Cambiar velocidad de reproducción"
          className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer"
        >
          {playbackRate}x
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => skipSeconds(-10)}
            title="Retroceder 10 segundos"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(10)}
            title="Adelantar 10 segundos"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              setIsMuted(v === 0);
              if (audioRef.current) {
                audioRef.current.volume = v;
                audioRef.current.muted = v === 0;
              }
            }}
            className="hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MONITOR DE TRABAJO ASÍNCRONO POR CAPAS (HASTA 60 MINUTOS)
// ============================================================================

function formatMinutesSecondsLabel(seconds: number): string {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

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
    <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Cabecera del Monitor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
              isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : isFailed
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400',
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isFailed ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isCompleted
                  ? '¡Audio de Larga Duración Completado!'
                  : isFailed
                    ? 'Error en la Generación'
                    : isPaused
                      ? 'Generación Pausada'
                      : `Generando fragmento ${job.currentChunkIndex + 1} de ${job.totalChunks}...`}
              </h4>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border',
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : isFailed
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse',
                )}
              >
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generados {formatMinutesSecondsLabel(job.generatedTotalSeconds)} de ~
              {formatMinutesSecondsLabel(job.estimatedTotalSeconds)} estimados
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
              alwaysExpanded
              onClick={onPause}
            />
          )}
          {isPaused && (
            <ExpandableButton
              size="sm"
              icon={<Play />}
              label="Reanudar"
              variant="teal"
              alwaysExpanded
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
            <div className="flex items-center gap-2 flex-wrap">
              <ExpandableButton
                size="sm"
                icon={<Play />}
                label="Cargar en Reproductor"
                variant="indigo"
                alwaysExpanded
                onClick={onLoadMaster}
              />
              <a
                href={job.downloadUrl || `/api/studio/tts/jobs/${job.id}/download`}
                download={`wappy-master-${job.id}.wav`}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold tracking-wide transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Descargar WAV Master</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progreso General */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">Progreso general</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
            {job.progressPercent}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isCompleted
                ? 'bg-emerald-500'
                : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500',
            )}
            style={{ width: `${Math.min(100, Math.max(0, job.progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Fragmentos del Audio (Preescucha por Capas) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fragmentos del Audio ({job.completedChunks} / {job.totalChunks})
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-500">
            Haz clic en un fragmento listo para preescucharlo
          </span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto">
          {job.chunks.map((c) => {
            const done = c.status === 'completed';
            const busy = c.status === 'processing';
            const failed = c.status === 'failed';
            return (
              <button
                key={c.index}
                type="button"
                disabled={!done}
                onClick={() => onPlayChunk(c)}
                title={`Fragmento #${c.index + 1}${c.wordCount ? ` (${c.wordCount} palabras)` : ''}${done ? ` - ${c.durationSeconds || 0}s [Haz clic para escuchar]` : ''}`}
                className={cn(
                  'h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border',
                  done
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs'
                    : busy
                      ? 'bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse'
                      : failed
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                        : 'bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60',
                )}
              >
                {done ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  c.index + 1
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aviso de Failover 429 o Error */}
      {job.failoverNotice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Rotación Automática 429:</strong> {job.failoverNotice}
          </span>
        </div>
      )}

      {isFailed && job.error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{job.error}</span>
        </div>
      )}
    </div>
  );
}
