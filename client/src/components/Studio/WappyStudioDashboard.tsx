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
  Key,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sliders,
  Users,
  Search,
  Layers,
  Upload,
  Video,
  Code2,
  Cpu,
  Wand2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Film,
  Maximize2,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { OpenSidebar } from '~/components/Chat/Menus';
import ExpandableButton from '~/components/Common/ExpandableButton';
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
  failoverNotice?: {
    fromIndex: number;
    toIndex: number;
    label: string;
    reason: string;
    timestamp: number;
  };
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
}

interface LocalApiKeyItem {
  id: string;
  key: string;
  label: string;
  addedAt: number;
  isValidated: boolean;
}

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

function buildDefaultHtmlComposition({
  aspectRatio = '9:16',
  hasBaseVideo = false,
  badgeText = 'CÁPSULA INTERACTIVA WAPPY',
  headline = '5 Reglas de Oro en Seguridad',
  subheadline = 'Prevención inteligente en tiempo real con WAPPY Studio',
  accentColor = '#14b8a6',
}: {
  aspectRatio?: '9:16' | '16:9';
  hasBaseVideo?: boolean;
  badgeText?: string;
  headline?: string;
  subheadline?: string;
  accentColor?: string;
}) {
  const isVertical = aspectRatio === '9:16';
  const safeBadge = badgeText.replace(/</g, '&lt;');
  const safeHeadline = headline.replace(/</g, '&lt;');
  const safeSubheadline = subheadline.replace(/</g, '&lt;');

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
      background: ${hasBaseVideo ? 'transparent' : '#060d14'};
      color: #ffffff;
    }
    .grid-bg {
      background-image: radial-gradient(rgba(20, 184, 166, 0.16) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .glass-card {
      background: rgba(10, 18, 30, 0.78);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    }
  </style>
</head>
<body class="relative flex flex-col justify-between ${isVertical ? 'p-7' : 'p-10'} select-none">
  ${
    hasBaseVideo
      ? '<!-- Fondo transparente para dejar ver el video base del usuario -->'
      : `<div class="absolute inset-0 grid-bg pointer-events-none"></div>
         <div id="orb-1" class="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-35 pointer-events-none" style="background: ${accentColor};"></div>
         <div id="orb-2" class="absolute bottom-10 -right-20 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none" style="background: #6366f1;"></div>`
  }

  <!-- TOP HUD BAR -->
  <div id="top-bar" class="relative z-10 flex items-center justify-between gap-3">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full animate-ping" style="background: ${accentColor};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${safeBadge}</span>
    </div>
    <div class="glass-card px-3 py-1 rounded-full text-[11px] font-mono font-bold text-slate-300">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS -->
  <div class="relative z-10 my-auto flex flex-col ${isVertical ? 'gap-4' : 'gap-5 max-w-2xl'}">
    <div id="hero-card" class="glass-card rounded-3xl p-6 border-l-4" style="border-left-color: ${accentColor};">
      <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1.5">⚡ PUNTO CLAVE EN VIVO</div>
      <h1 class="${isVertical ? 'text-2xl' : 'text-4xl'} font-black leading-tight tracking-tight text-white">
        ${safeHeadline}
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-medium">
        ${safeSubheadline}
      </p>
      <div class="mt-4 h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden">
        <div id="accent-bar" class="h-full rounded-full" style="width: 0%; background: linear-gradient(90deg, ${accentColor}, #fbbf24);"></div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2.5" id="metrics-row">
      <div class="metric-item glass-card rounded-2xl p-3.5 text-center">
        <div class="text-lg font-black text-emerald-400">100%</div>
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Cumplimiento</div>
      </div>
      <div class="metric-item glass-card rounded-2xl p-3.5 text-center">
        <div class="text-lg font-black text-amber-400">60 FPS</div>
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Motion HTML</div>
      </div>
      <div class="metric-item glass-card rounded-2xl p-3.5 text-center">
        <div class="text-lg font-black text-indigo-400">IA 3.8</div>
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Voz Neural</div>
      </div>
    </div>
  </div>

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 h-16"></div>

  <script>
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
    window.mainTimeline = tl;

    tl.from("#top-bar", { y: -35, opacity: 0, duration: 0.65, ease: "back.out(1.7)" })
      .from("#hero-card", { scale: 0.88, y: 30, opacity: 0, duration: 0.75, ease: "back.out(1.5)" }, "-=0.3")
      .to("#accent-bar", { width: "100%", duration: 1.4, ease: "power2.out" }, "-=0.2")
      .from(".metric-item", { y: 25, opacity: 0, stagger: 0.15, duration: 0.55, ease: "back.out(1.7)" }, "-=0.8")
      .to("#hero-card", { y: -4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 3 });

    window.addEventListener("message", (event) => {
      const data = event.data || {};
      if (!window.mainTimeline) return;
      if (data.type === "STUDIO_PLAY") window.mainTimeline.play();
      if (data.type === "STUDIO_PAUSE") window.mainTimeline.pause();
      if (data.type === "STUDIO_RESTART") window.mainTimeline.restart();
      if (data.type === "STUDIO_SEEK" && typeof data.progress === "number") {
        window.mainTimeline.progress(Math.max(0, Math.min(1, data.progress)));
      }
    });
  </script>
</body>
</html>`;
}

// ============================================================================
// UTILIDADES DE ALMACENAMIENTO LOCAL DE CLAVES Y BIBLIOTECA
// ============================================================================

const LOCAL_KEYS_STORAGE = 'wappy_studio_gemini_keys';
const LOCAL_LIBRARY_STORAGE = 'wappy_studio_audio_library';
const LOCAL_WORKER_URL_STORAGE = 'wappy_studio_gpu_worker_url';

function getStoredCustomKeys(): LocalApiKeyItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEYS_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCustomKeyStrings(): string[] {
  return getStoredCustomKeys()
    .map((k) => k.key?.trim())
    .filter(Boolean);
}

function getAuthHeaders(extraKeys?: string[]): Record<string, string> {
  const keys = extraKeys ?? getCustomKeyStrings();
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(keys.length > 0 ? { 'x-gemini-api-keys': JSON.stringify(keys) } : {}),
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL: WAPPY STUDIO DASHBOARD
// ============================================================================

export default function WappyStudioDashboard() {
  const { user, isAuthenticated } = useAuthContext();
  const outletContext = useOutletContext<ContextType>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible ?? (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as StudioTab) || 'tts';
  const [activeTab, setActiveTab] = useState<StudioTab>(
    ['tts', 'video', 'lab', 'library'].includes(initialTab) ? initialTab : 'tts',
  );

  // Catálogo del Backend
  const [models, setModels] = useState<StudioModel[]>([]);
  const [voices, setVoices] = useState<StudioVoice[]>([]);
  const [presets, setPresets] = useState<StudioPreset[]>([]);
  const [vocalBursts, setVocalBursts] = useState<VocalBurst[]>([]);

  // Estado de Claves API y Pool
  const [poolStatus, setPoolStatus] = useState<{
    totalKeys: number;
    customKeysCount: number;
    systemKeysCount: number;
    autoRotationEnabled: boolean;
    keys: Array<{ index: number; label: string; maskedKey: string; status: string }>;
  } | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);

  // Estado del Estudio TTS
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash-tts');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Instructora experta en Seguridad y Salud en el Trabajo, voz cálida, clara, empática y profesional.',
  );
  const [multiSpeaker, setMultiSpeaker] = useState<boolean>(false);
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [wordsPerChunk, setWordsPerChunk] = useState<number>(150);
  const [scriptText, setScriptText] = useState<string>(SCRIPT_TEMPLATES[0].text);

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
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'Femenino' | 'Masculino'>('all');
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
    }),
  );

  // Estado del Reproductor de Video Compuesto
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(20);
  const [isRenderingGpu, setIsRenderingGpu] = useState<boolean>(false);
  const [gpuWorkerUrl, setGpuWorkerUrl] = useState<string>(
    () => localStorage.getItem(LOCAL_WORKER_URL_STORAGE) || '',
  );
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const baseVideoRef = useRef<HTMLVideoElement | null>(null);
  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  // Guardar biblioteca cuando cambie
  useEffect(() => {
    try {
      // Limitar a los últimos 15 elementos para no exceder cuota de localStorage
      localStorage.setItem(LOCAL_LIBRARY_STORAGE, JSON.stringify(libraryItems.slice(0, 15)));
    } catch {
      /* ignore quota */
    }
  }, [libraryItems]);

  // Cargar catálogo y estado de claves al montar
  const fetchPoolStatus = async () => {
    try {
      const resp = await fetch('/api/studio/keys-status', { headers: getAuthHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setPoolStatus(data);
      }
    } catch (err) {
      console.error('Error consultando estado de claves:', err);
    }
  };

  useEffect(() => {
    fetch('/api/studio/catalog', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.models) setModels(data.models);
        if (data.voices) setVoices(data.voices);
        if (data.presets) setPresets(data.presets);
        if (data.vocalBursts) setVocalBursts(data.vocalBursts);
      })
      .catch((err) => console.error('Error cargando catálogo de WAPPY Studio:', err));

    fetchPoolStatus();
  }, []);

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
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: clean, maxWordsPerChunk: wordsPerChunk }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.estimatedMinutes === 'number') setEstimatedMinutes(data.estimatedMinutes);
          if (typeof data.chunkCount === 'number') setChunkCount(data.chunkCount);
        })
        .catch(() => {
          setEstimatedMinutes(Math.round((words / 145) * 10) / 10);
          setChunkCount(Math.max(1, Math.ceil(words / wordsPerChunk)));
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [scriptText, wordsPerChunk]);

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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          voiceName: voiceId,
          model: isVoiceSupported(voiceId) ? selectedModel : 'gemini-3.8-flash-tts',
          text: `Hola, soy ${voiceId}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`,
        }),
      });
      const data = await resp.json();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          voiceName: selectedVoice,
          model: selectedModel,
          text: '¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo.',
        }),
      });
      const data = await resp.json();
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
        headers: getAuthHeaders(),
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
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al sintetizar vista previa.');
      }
      setCurrentAudio({
        base64: data.audioBase64,
        title: `Locución: ${snippet.slice(0, 38)}...`,
        durationSeconds: data.durationSeconds,
        voiceName: selectedVoice,
        scriptText: snippet,
      });
      const newItem: LibraryItem = {
        id: Date.now().toString(),
        title: `${snippet.slice(0, 42)}...`,
        createdAt: Date.now(),
        voiceName: selectedVoice,
        model: data.usedModel || selectedModel,
        durationSeconds: data.durationSeconds,
        wordCount: snippet.split(/\s+/).filter(Boolean).length,
        audioBase64: data.audioBase64,
        stylePrompt,
        scriptText: snippet,
      };
      setLibraryItems((prev) => [newItem, ...prev]);
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

  const handleStartFullJob = async () => {
    if (!scriptText.trim()) return;
    try {
      setStatusBanner(null);
      if (sseRef.current) {
        sseRef.current.close();
      }
      const resp = await fetch('/api/studio/tts/jobs', {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const data = await resp.json();
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

      const es = new EventSource(`/api/studio/tts/jobs/${data.jobId}/stream`);
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

      es.addEventListener('api_key_failover', (ev: MessageEvent) => {
        const d = JSON.parse(ev.data);
        setActiveJob((prev) => (prev ? { ...prev, failoverNotice: d } : null));
        fetchPoolStatus();
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
          title: `Master Completo: ${scriptText.trim().slice(0, 35)}...`,
          durationSeconds: d.totalDurationSeconds,
          voiceName: selectedVoice,
          scriptText,
        });
        const newItem: LibraryItem = {
          id: d.id,
          title: `Master: ${scriptText.trim().slice(0, 42)}...`,
          createdAt: Date.now(),
          voiceName: selectedVoice,
          model: selectedModel,
          durationSeconds: d.totalDurationSeconds,
          wordCount,
          downloadUrl: d.downloadUrl,
          stylePrompt,
          scriptText,
        };
        setLibraryItems((prev) => [newItem, ...prev]);
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
      headers: getAuthHeaders(),
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
  ) => {
    setHtmlCode(
      buildDefaultHtmlComposition({
        aspectRatio: nextRatio,
        hasBaseVideo: nextHasVideo,
        badgeText: badgeOverlayText,
        headline: headlineOverlayText,
        subheadline: subheadlineOverlayText,
        accentColor,
      }),
    );
  };

  const handleGenerateHtmlWithAi = async () => {
    try {
      setIsGeneratingHtmlAi(true);
      setStatusBanner(null);
      const resp = await fetch('/api/studio/video/generate-html', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: aiScenePrompt,
          scriptText,
          aspectRatio,
          hasBaseVideo: Boolean(baseVideoUrl),
          showSubtitles: showDynamicSubtitles,
          durationSeconds: Math.round(currentAudio?.durationSeconds || videoDuration || 25),
          companyName: user?.name || 'WAPPY IA',
        }),
      });
      const data = await resp.json();
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

  // Sincronización de Play / Pause / Seek entre Video Base, Audio Locución e iframe GSAP
  const toggleStagePlayback = () => {
    const nextPlaying = !isVideoPlaying;
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
    iframeRef.current?.contentWindow?.postMessage({ type: 'STUDIO_SEEK', progress }, '*');
    if (baseVideoRef.current) {
      baseVideoRef.current.currentTime = newTime;
    }
    if (stageAudioRef.current && activeStageAudioSrc) {
      stageAudioRef.current.currentTime = newTime;
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

  const handleDownloadHtmlBundle = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wappy-studio-video-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRenderGpuServerless = async () => {
    if (!gpuWorkerUrl.trim()) {
      setIsGpuModalOpen(true);
      return;
    }
    try {
      setIsRenderingGpu(true);
      setStatusBanner({
        type: 'info',
        text: 'Enviando composición HTML + Audio al Worker GPU Serverless (NVIDIA L4)...',
      });
      const resp = await fetch('/api/studio/video/render-serverless', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          htmlCode,
          audioBase64: currentAudio?.base64 || null,
          aspectRatio,
          durationSeconds: Math.round(videoDuration || 15),
          fps: 30,
          workerUrl: gpuWorkerUrl.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error en el Worker GPU.');
      }
      if (data.mp4Base64) {
        const a = document.createElement('a');
        a.href = `data:video/mp4;base64,${data.mp4Base64}`;
        a.download = `wappy-studio-render-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setStatusBanner({
          type: 'success',
          text: '¡Video MP4 1080p renderizado por GPU Serverless y descargado exitosamente!',
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'No se pudo completar el renderizado en el Worker GPU.',
      });
    } finally {
      setIsRenderingGpu(false);
    }
  };

  const totalAvailableKeys = poolStatus?.totalKeys || getCustomKeyStrings().length;

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
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            {/* Botonera Flotante Cápsula / Isla */}
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar">
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

            {/* Botones Auto-Expansibles WAPPY (14 Grupos Semánticos) */}
            <div className="flex items-center gap-1.5">
              <ExpandableButton
                icon={<Key />}
                label={
                  totalAvailableKeys > 1
                    ? `Claves API (${totalAvailableKeys} • Failover Activo)`
                    : totalAvailableKeys === 1
                      ? 'Claves API (1 Activa)'
                      : 'Configurar Claves API'
                }
                variant={totalAvailableKeys > 0 ? 'indigo' : 'amber'}
                onClick={() => setIsKeyModalOpen(true)}
              />

              <ExpandableButton
                icon={isTestingConnection ? <Loader2 className="animate-spin" /> : <Zap />}
                label="Probar Audio con IA"
                variant="purple"
                disabled={isTestingConnection}
                onClick={handleTestConnection}
              />

              <ExpandableButton
                icon={<Cpu />}
                label="Worker GPU Serverless"
                variant="cyan"
                onClick={() => setIsGpuModalOpen(true)}
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
                              {m.quotaLabel}
                            </span>
                            {isSelected ? (
                              <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Activo
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
                  /* 4. Catálogo de 14 Voces con Audición en Vivo */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                        <MicVocal className="w-3.5 h-3.5 text-teal-500" />
                        Catálogo de Voces ({activeModelObj?.supportedVoices.length || 14} activas)
                      </label>

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
                          Activas
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
                          placeholder="Buscar voz por nombre, tono o uso..."
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
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
                              'p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer',
                              isSelected
                                ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs'
                                : 'bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400',
                              !supported && 'opacity-65',
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1.5">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-extrabold text-text-primary">
                                      {v.name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                      {v.gender}
                                    </span>
                                  </div>
                                  <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold mt-0.5">
                                    {v.tone}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleAuditionVoice(v.id, e)}
                                  disabled={isAuditioning}
                                  title="Escuchar muestra de esta voz"
                                  className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer"
                                >
                                  {isAuditioning ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  )}
                                </button>
                              </div>
                              {v.tag && (
                                <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                  {v.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2">
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
                      Segmentación para Audios de hasta 1 Hora ({wordsPerChunk} palabras/chunk)
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
                        Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua y rotación limpia ante límites de cuota (429).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA (7 cols): Editor de Guion, Vocal Bursts y Despacho */}
              <div className="lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                {/* Barra de Estado de Claves Activas */}
                <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-text-primary">
                    <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>
                      <strong>{totalAvailableKeys} clave(s) API</strong> listas para síntesis
                      {totalAvailableKeys > 1
                        ? ' • Rotación y Failover Automático (429) activo para audios de 1 hora.'
                        : ' • Puedes agregar claves de respaldo para audios largos.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(true)}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Administrar claves
                  </button>
                </div>

                {/* Cabecera del Editor + Selector de Plantilla */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <MicVocal className="w-4 h-4 text-teal-500" />
                    Guion o Texto a Sintetizar
                  </h2>

                  <div className="flex items-center gap-2">
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
                        Cargar guion de ejemplo...
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
                      Efectos Vocales y Pausas Orgánicas (Clic para insertar en el cursor):
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
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{b.tag}</span>
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
                  rows={11}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora..."
                  className="w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[240px]"
                />

                {/* Barra de Métricas y Estimación */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span>
                        Palabras: <strong className="text-text-primary font-mono">{wordCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Caracteres: <strong className="text-text-primary font-mono">{charCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Fragmentos:{' '}
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
                    disabled={isPreviewing || activeJob?.status === 'processing' || !scriptText.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Probar Primer Fragmento (~40s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartFullJob}
                    disabled={activeJob?.status === 'processing' || isPreviewing || !scriptText.trim()}
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
            <div className="lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
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
                    handleRebuildDefaultTemplate('9:16', Boolean(baseVideoUrl));
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
                    handleRebuildDefaultTemplate('16:9', Boolean(baseVideoUrl));
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                    3. Textos de Capa y Subtítulos Dinámicos
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDynamicSubtitles}
                      onChange={(e) => setShowDynamicSubtitles(e.target.checked)}
                      className="rounded accent-teal-600"
                    />
                    Subtítulos Palabra a Palabra
                  </label>
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
                    onClick={() => handleRebuildDefaultTemplate(aspectRatio, Boolean(baseVideoUrl))}
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

            {/* COLUMNA DERECHA (6 cols): Reproductor en Vivo Multi-Capa + Exportación */}
            <div className="lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
              {/* Barra Superior del Lienzo */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-text-primary">
                    Lienzo Interactivo en Tiempo Real ({aspectRatio})
                  </h3>
                </div>

                {/* Botonera de Exportación WAPPY (ExpandableButton) */}
                <div className="flex items-center gap-1.5">
                  <ExpandableButton
                    size="sm"
                    icon={<Download />}
                    label="Exportar HTML"
                    variant="green"
                    onClick={handleDownloadHtmlBundle}
                  />
                  <ExpandableButton
                    size="sm"
                    icon={isRenderingGpu ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    label="Renderizar MP4 (GPU Serverless)"
                    variant="purple"
                    disabled={isRenderingGpu}
                    onClick={handleRenderGpuServerless}
                  />
                  <ExpandableButton
                    size="sm"
                    icon={<Maximize2 />}
                    label="Pantalla Completa"
                    variant="neutral"
                    onClick={() => {
                      stageContainerRef.current?.requestFullscreen?.().catch(() => {});
                    }}
                  />
                </div>
              </div>

              {/* ESCENARIO MULTI-CAPA (VIDEO BASE + IFRAME HTML/GSAP + SUBTÍTULOS HORMOZI) */}
              <div className="flex justify-center bg-slate-950 rounded-2xl p-3 border border-slate-800 shadow-inner">
                <div
                  ref={stageContainerRef}
                  className={cn(
                    'relative overflow-hidden rounded-xl bg-slate-950 shadow-2xl border border-white/10',
                    aspectRatio === '9:16'
                      ? 'w-full max-w-[330px] aspect-[9/16]'
                      : 'w-full aspect-[16/9]',
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
                      onEnded={() => setIsVideoPlaying(false)}
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

                  {/* CAPA 2: Composición Animada HTML5 + GSAP (Fondo transparente si hay video base) */}
                  <iframe
                    ref={iframeRef}
                    title="WAPPY Studio HTML Canvas"
                    srcDoc={htmlCode}
                    sandbox="allow-scripts"
                    className="absolute inset-0 w-full h-full border-0 z-10 pointer-events-none"
                  />

                  {/* CAPA 3: Subtítulos Dinámicos Sincronizados Palabra a Palabra (Estilo Hormozi / Claude) */}
                  {showDynamicSubtitles && currentSubtitleWindow && (
                    <div className="absolute bottom-5 inset-x-3 z-20 flex justify-center pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]">
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
              </div>

              {/* Controles de Línea de Tiempo del Escenario */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleStagePlayback}
                    className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-xs transition cursor-pointer shrink-0"
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
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
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 3: LABORATORIO DE EXPRESIVIDAD & VOCAL BURSTS                */}
        {/* ==================================================================== */}
        {activeTab === 'lab' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Laboratorio de Efectos Vocales Orgánicos (Vocal Bursts)
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Haz clic en cualquier etiqueta para escuchar cómo reacciona la voz seleccionada ({selectedVoice}) en tiempo real.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vocalBursts.map((b) => (
                  <div
                    key={b.tag}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                        {b.tag}
                      </span>
                      <p className="text-xs font-bold text-text-primary mt-0.5">{b.label}</p>
                      <p className="text-[11px] text-text-secondary">{b.description}</p>
                    </div>
                    <ExpandableButton
                      size="sm"
                      icon={<Play />}
                      label="Probar"
                      variant="purple"
                      onClick={async () => {
                        try {
                          setStatusBanner({
                            type: 'info',
                            text: `Sintetizando efecto ${b.tag} con la voz ${selectedVoice}...`,
                          });
                          const resp = await fetch('/api/studio/tts/synthesize', {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                              voiceName: selectedVoice,
                              model: 'gemini-3.8-flash-tts',
                              stylePrompt: 'Voz muy expresiva y natural.',
                              text: `Escucha cómo suena este efecto natural en medio de una frase: ${b.tag} ¡Suena totalmente humano!`,
                            }),
                          });
                          const data = await resp.json();
                          if (data.audioBase64) {
                            setCurrentAudio({
                              base64: data.audioBase64,
                              title: `Efecto ${b.tag} (${selectedVoice})`,
                              durationSeconds: data.durationSeconds,
                              voiceName: selectedVoice,
                            });
                            setStatusBanner(null);
                          }
                        } catch (err: any) {
                          setStatusBanner({ type: 'error', text: err.message });
                        }
                      }}
                    />
                  </div>
                ))}
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
                  Biblioteca de Locuciones y Masters WAV
                </h2>
                <p className="text-xs text-text-secondary">
                  Tus pistas generadas quedan guardadas para escucharlas, descargarlas en WAV o enviarlas al Compositor de Video.
                </p>
              </div>
              {libraryItems.length > 0 && (
                <ExpandableButton
                  icon={<Trash2 />}
                  label="Limpiar Historial"
                  variant="danger"
                  onClick={() => setLibraryItems([])}
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
                  Genera una locución en la pestaña "Estudio de Voz (TTS)" y aparecerá aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-extrabold text-text-primary line-clamp-1">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0">
                          {item.voiceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                        <span>~{item.durationSeconds}s</span>
                        <span>•</span>
                        <span>{item.wordCount} palabras</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <ExpandableButton
                          size="sm"
                          icon={<Play />}
                          label="Reproducir"
                          variant="teal"
                          onClick={() =>
                            setCurrentAudio({
                              base64: item.audioBase64,
                              url: item.downloadUrl,
                              title: item.title,
                              durationSeconds: item.durationSeconds,
                              voiceName: item.voiceName,
                              scriptText: item.scriptText,
                            })
                          }
                        />
                        <ExpandableButton
                          size="sm"
                          icon={<Film />}
                          label="Usar en Video"
                          variant="purple"
                          onClick={() => {
                            setCurrentAudio({
                              base64: item.audioBase64,
                              url: item.downloadUrl,
                              title: item.title,
                              durationSeconds: item.durationSeconds,
                              voiceName: item.voiceName,
                              scriptText: item.scriptText,
                            });
                            handleTabChange('video');
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <ExpandableButton
                          size="sm"
                          icon={<Download />}
                          label="Descargar WAV"
                          variant="green"
                          onClick={() => {
                            const href =
                              item.downloadUrl ||
                              (item.audioBase64 ? `data:audio/wav;base64,${item.audioBase64}` : '');
                            if (!href) return;
                            const a = document.createElement('a');
                            a.href = href;
                            a.download = `wappy-audio-${item.id}.wav`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                        />
                        <ExpandableButton
                          size="sm"
                          icon={<Trash2 />}
                          label="Eliminar"
                          variant="danger"
                          onClick={() =>
                            setLibraryItems((prev) => prev.filter((x) => x.id !== item.id))
                          }
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

      {/* MODAL 1: GESTOR DE CLAVES API DE GEMINI & FAILOVER */}
      {isKeyModalOpen && (
        <ApiKeyPoolModal
          poolStatus={poolStatus}
          onClose={() => setIsKeyModalOpen(false)}
          onUpdated={() => fetchPoolStatus()}
        />
      )}

      {/* MODAL 2: CONFIGURACIÓN DEL WORKER GPU SERVERLESS (OPCIÓN C - MODAL.COM) */}
      {isGpuModalOpen && (
        <GpuWorkerConfigModal
          workerUrl={gpuWorkerUrl}
          onSaveUrl={(url) => {
            setGpuWorkerUrl(url);
            localStorage.setItem(LOCAL_WORKER_URL_STORAGE, url);
            setIsGpuModalOpen(false);
          }}
          onClose={() => setIsGpuModalOpen(false)}
        />
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
            <ExpandableButton size="sm" icon={<Pause />} label="Pausar" variant="amber" onClick={onPause} />
          )}
          {isPaused && (
            <ExpandableButton size="sm" icon={<Play />} label="Reanudar" variant="teal" onClick={onResume} />
          )}
          {!isCompleted && !isFailed && (
            <ExpandableButton size="sm" icon={<X />} label="Cancelar" variant="danger" onClick={onCancel} />
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
              {done ? <Volume2 className="w-3 h-3" /> : busy ? <Loader2 className="w-3 h-3 animate-spin" /> : c.index + 1}
            </button>
          );
        })}
      </div>

      {job.failoverNotice && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Failover Automático Activado:</strong> La Clave #{job.failoverNotice.fromIndex + 1} alcanzó el límite 429; continuando con {job.failoverNotice.label} sin cortar tu audio.
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODAL 1: GESTOR DE CLAVES API Y MONITOR DE FAILOVER
// ============================================================================

function ApiKeyPoolModal({
  poolStatus,
  onClose,
  onUpdated,
}: {
  poolStatus: any;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [localKeys, setLocalKeys] = useState<LocalApiKeyItem[]>(() => getStoredCustomKeys());
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState<{ valid: boolean; text: string } | null>(null);

  const saveKeys = (next: LocalApiKeyItem[]) => {
    setLocalKeys(next);
    localStorage.setItem(LOCAL_KEYS_STORAGE, JSON.stringify(next));
    onUpdated();
  };

  const handleAddKeys = async (skipValidation = false) => {
    const raw = newKeyInput.trim();
    if (!raw) return;
    const candidates = Array.from(
      new Set(
        raw
          .split(/[,;\n\r]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 8),
      ),
    );
    if (candidates.length === 0) return;

    if (!skipValidation) {
      setValidating(true);
      setFeedback(null);
      try {
        const resp = await fetch('/api/studio/keys-validate', {
          method: 'POST',
          headers: getAuthHeaders(candidates),
          body: JSON.stringify({ customKeys: candidates }),
        });
        const data = await resp.json();
        const invalid = (data.results || []).find((r: any) => !r.valid);
        if (invalid) {
          setFeedback({ valid: false, text: invalid.error || 'Una de las claves no es válida.' });
          setValidating(false);
          return;
        }
      } catch (err: any) {
        setFeedback({ valid: false, text: err.message || 'Error al validar clave.' });
        setValidating(false);
        return;
      }
      setValidating(false);
    }

    const added: LocalApiKeyItem[] = candidates.map((k, idx) => ({
      id: `k_${Date.now()}_${idx}`,
      key: k,
      label:
        candidates.length === 1 && newKeyLabel.trim()
          ? newKeyLabel.trim()
          : `Clave Local #${localKeys.length + idx + 1}`,
      addedAt: Date.now(),
      isValidated: true,
    }));

    saveKeys([...localKeys, ...added]);
    setNewKeyInput('');
    setNewKeyLabel('');
    setFeedback({
      valid: true,
      text: `¡${added.length} clave(s) agregada(s) al pool de rotación automática!`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">
                Pool de Claves API Gemini & Failover Automático
              </h3>
              <p className="text-xs text-text-secondary">
                WAPPY utiliza tus claves de cuenta automáticamente y te permite sumar claves adicionales para audios de 1 hora sin cortes por error 429.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-text-primary">
            Agregar Clave(s) de Respaldo (AIzaSy...)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                placeholder="Pega una o varias claves separadas por coma"
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 pr-8 text-xs text-text-primary font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-text-primary"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Etiqueta (ej. Cuenta 2)"
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary"
            />
          </div>

          {feedback && (
            <div
              className={cn(
                'p-2.5 rounded-xl text-xs font-semibold',
                feedback.valid
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30',
              )}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Obtener clave en Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="flex items-center gap-2">
              <ExpandableButton
                size="sm"
                icon={<Plus />}
                label="Guardar Directo"
                variant="neutral"
                disabled={!newKeyInput.trim() || validating}
                onClick={() => handleAddKeys(true)}
              />
              <ExpandableButton
                size="sm"
                icon={validating ? <Loader2 className="animate-spin" /> : <Check />}
                label={validating ? 'Validando...' : 'Validar y Guardar'}
                variant="teal"
                disabled={!newKeyInput.trim() || validating}
                onClick={() => handleAddKeys(false)}
              />
            </div>
          </div>
        </div>

        {/* Lista de claves del pool */}
        <div className="space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
            Claves Activas en el Pool ({poolStatus?.totalKeys || localKeys.length})
          </div>
          {localKeys.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-text-primary">
                  #{idx + 1} • {item.label}
                </div>
                <div className="text-[11px] font-mono text-text-secondary">
                  {item.key.slice(0, 6)}••••••••{item.key.slice(-4)}
                </div>
              </div>
              <ExpandableButton
                size="sm"
                icon={<Trash2 />}
                label="Quitar"
                variant="danger"
                onClick={() => saveKeys(localKeys.filter((k) => k.id !== item.id))}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-zinc-800">
          <ExpandableButton icon={<Check />} label="Listo / Cerrar" variant="teal" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL 2: CONFIGURACIÓN DEL WORKER GPU SERVERLESS (MODAL.COM / RUNPOD)
// ============================================================================

function GpuWorkerConfigModal({
  workerUrl,
  onSaveUrl,
  onClose,
}: {
  workerUrl: string;
  onSaveUrl: (url: string) => void;
  onClose: () => void;
}) {
  const [urlInput, setUrlInput] = useState(workerUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">
                Worker GPU Serverless (Opción C • Modal.com / RunPod)
              </h3>
              <p className="text-xs text-text-secondary">
                Renderiza videos MP4 a 1080p en una tarjeta NVIDIA L4 en ~10 segundos sin usar ni un 1% de CPU de tu VPS principal (`srv999875`).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-teal-400 font-sans font-bold">
            🚀 Despliega tu Worker incluido en el repositorio en 3 comandos:
          </div>
          <div>1. pip install modal</div>
          <div>2. modal setup</div>
          <div>3. modal deploy scripts/modal_gpu_video_worker.py</div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-text-primary mb-1.5">
            URL del Endpoint Serverless (Modal.com / RunPod)
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://tu-usuario--wappy-studio-gpu-renderer-render-html-video.modal.run"
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary font-mono focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
          <ExpandableButton icon={<X />} label="Cancelar" variant="neutral" onClick={onClose} />
          <ExpandableButton
            icon={<Check />}
            label="Guardar Endpoint GPU"
            variant="teal"
            onClick={() => onSaveUrl(urlInput)}
          />
        </div>
      </div>
    </div>
  );
}
