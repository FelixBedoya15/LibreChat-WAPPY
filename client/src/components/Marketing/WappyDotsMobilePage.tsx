import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  SwitchCamera,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
  ArrowUp,
  ArrowRight,
  Sparkles,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Plus,
  ShieldCheck,
  Trash2,
  Search,
  Rocket,
  Globe,
  BookOpen,
  Film,
  FolderOpen,
  Paperclip,
  Settings2,
} from 'lucide-react';
import {
  TenshiAvatar,
  TenshiAvatarMood,
  triggerTenshiReaction,
  analyzeTenshiEmotionFromText,
} from '~/components/Tenshi/TenshiAvatar';
import { tenshiAudio } from '~/components/Tenshi/tenshiAudio';

interface SharedFileItem {
  id: string;
  fileName: string;
  title?: string;
  format: string;
  sizeBytes?: number;
  createdAt?: string;
  project?: string;
  conversationId?: string;
}

interface SharedChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  createdAt?: string;
  conversationId?: string;
  files?: SharedFileItem[];
}

interface WappyDotsIntegrationInfo {
  id: string;
  label: string;
  fullName: string;
  icon: string;
  badgeColor: string;
  description: string;
}

interface SharedChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  activeIntegration: string;
  agentId?: string;
  messages: SharedChatMessage[];
}

interface TunnelLinkState {
  ok: boolean;
  active: boolean;
  publicUrl: string | null;
  lanUrl: string;
  updatedAt: string | null;
  directMobileUrl?: string;
}

type ActiveDrawer = 'none' | 'chat' | 'history' | 'integration' | 'files' | 'agents' | 'tunnel';
type PersonalityMode = 'express' | 'asistente' | 'profundo';
type PipVisionMode = 'camera' | 'mac';

const DEFAULT_INTEGRATIONS: WappyDotsIntegrationInfo[] = [
  {
    id: 'antigravity',
    label: 'Antigravity',
    fullName: 'Google Antigravity IDE',
    icon: 'rocket',
    badgeColor: '#C7F303',
    description: 'Control directo de proyectos, código, agentes y terminal en tu Mac',
  },
  {
    id: 'google-workspace',
    label: 'Workspace',
    fullName: 'Google Workspace (Gmail, Calendar, Drive)',
    icon: 'globe',
    badgeColor: '#38BDF8',
    description: 'Envío de correos, agenda, documentos, hojas de cálculo y Drive',
  },
  {
    id: 'notebooklm',
    label: 'NotebookLM',
    fullName: 'Google NotebookLM',
    icon: 'book',
    badgeColor: '#A78BFA',
    description: 'Investigación profunda sobre fuentes, cuadernos y Audio Overview',
  },
  {
    id: 'google-flow',
    label: 'Google Flow',
    fullName: 'Google Flow & Veo Studio',
    icon: 'film',
    badgeColor: '#F472B6',
    description: 'Producción audiovisual cinematográfica Veo e imágenes con IA',
  },
  {
    id: 'wappy-sst',
    label: 'Somos SST',
    fullName: 'Wappy IA Cloud · Somos SST',
    icon: 'shield',
    badgeColor: '#10B981',
    description: '41 herramientas operativas SG-SST, GTC-45, PESV y Resolución 0312',
  },
  {
    id: 'terminal-mac',
    label: 'Mi Mac',
    fullName: 'Control de Pantalla y Archivos Mac',
    icon: 'laptop',
    badgeColor: '#F59E0B',
    description: 'Visión de pantalla en vivo, creación de PDF/Word/Excel/QR y automatizaciones',
  },
];

// Icono exacto para el Panel Izquierdo (de MobileBottomNav.tsx)
const LeftPanelIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`h-5 w-5 transition-all duration-200 ${
      active ? 'text-teal-400 scale-105' : 'text-zinc-400 hover:text-white'
    }`}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path
      d="M9 4.5v15"
      strokeWidth="2"
      className={active ? 'stroke-teal-400' : 'stroke-current'}
    />
    <circle cx="6" cy="9" r="0.9" fill="currentColor" />
    <circle cx="6" cy="12" r="0.9" fill="currentColor" />
    <circle cx="6" cy="15" r="0.9" fill="currentColor" />
  </svg>
);

// Icono exacto para el Panel Derecho (de MobileBottomNav.tsx)
const RightPanelIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`h-5 w-5 transition-all duration-200 ${
      active ? 'text-teal-400 scale-105' : 'text-zinc-400 hover:text-white'
    }`}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path
      d="M15 4.5v15"
      strokeWidth="2"
      className={active ? 'stroke-teal-400' : 'stroke-current'}
    />
    <circle cx="18" cy="9" r="0.9" fill="currentColor" />
    <circle cx="18" cy="12" r="0.9" fill="currentColor" />
    <circle cx="18" cy="15" r="0.9" fill="currentColor" />
  </svg>
);

function normalizeVoiceCmd(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPauseOnlyCommand(rawText: string): boolean {
  const n = normalizeVoiceCmd(rawText);
  const pauseExact = new Set([
    'para',
    'detente',
    'espera',
    'un momento',
    'silencio',
    'callate',
    'basta',
    'no sigas',
    'tenshi para',
    'tenshi detente',
    'tenshi espera',
    'tenshi silencio',
    'tenshi basta',
    'para tenshi',
    'espera un momento',
    'para un momento',
  ]);
  return pauseExact.has(n);
}

function isNaturalFarewellCommand(rawText: string): boolean {
  if (isPauseOnlyCommand(rawText)) return false;
  const n = normalizeVoiceCmd(rawText);
  const farewellPhrases = [
    'hasta luego',
    'hasta pronto',
    'hasta manana',
    'nos vemos',
    'gracias por todo',
    'muchas gracias por todo',
    'eso es todo por hoy',
    'eso era todo gracias',
    'eso era todo',
    'nada mas por hoy',
    'chao',
    'adios',
    'feliz noche',
    'feliz tarde',
    'feliz dia',
    'cuelga la llamada',
    'finalizar llamada',
    'terminar llamada',
    'duermete',
    'ya duermase',
    'descansa',
  ];
  return farewellPhrases.some((p) => n === p || n.endsWith(' ' + p) || n.startsWith(p + ' '));
}

function cleanDisplayMarkdown(raw: string): string {
  return String(raw || '')
    .replace(/🔊\s*\*\*Respuesta por voz de Tenshi:\*\*\s*/gi, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function renderIntegrationIcon(iconName: string, className = 'h-4 w-4') {
  switch (iconName) {
    case 'rocket':
      return <Rocket className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'film':
      return <Film className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'laptop':
      return <Laptop className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

const DEFAULT_HERO_SUBTITLE =
  'Soy tu copiloto universal en Wappy Dots. Tócame para hablar o pulsa el micrófono.';

const GENERAL_TOOLS_CATALOG = [
  { id: 'web_search', label: 'Web Buscar', emoji: '🌐', defaultEnabled: true },
  { id: 'mac_control', label: 'Control de Mi Mac y Pantalla', emoji: '💻', defaultEnabled: true },
  { id: 'external_agents', label: 'Agentes Conectados (Claude / Codex / Gemini)', emoji: '🤖', defaultEnabled: true },
  { id: 'consultar_agente_especializado', label: 'Consultar Especialista', emoji: '🧑‍⚕️', defaultEnabled: true },
  { id: 'gestor_automatizaciones', label: 'Automatizaciones', emoji: '⚡', defaultEnabled: true },
  { id: 'generar_documentos', label: 'Documentos (PDF, Word, Excel, QR)', emoji: '📄', defaultEnabled: true },
  { id: 'somos_sst', label: 'Somos SST', emoji: '❤️', defaultEnabled: false },
  { id: 'siigo_erp', label: 'Siigo Nube ERP', emoji: '💼', defaultEnabled: true },
] as const;

const GOOGLE_TOOLS_CATALOG = [
  { id: 'google_antigravity', label: 'Google Antigravity', emoji: '🅰️', defaultEnabled: true },
  { id: 'google_notebooklm', label: 'Google NotebookLM', emoji: '📓', defaultEnabled: true },
  { id: 'google_flow', label: 'Google Flow (Veo & Imagen)', emoji: '🎬', defaultEnabled: true },
  { id: 'google_drive', label: 'Google Drive', emoji: '☁️', defaultEnabled: true },
  { id: 'google_gmail', label: 'Google Gmail', emoji: '✉️', defaultEnabled: true },
  { id: 'google_calendar', label: 'Google Calendar', emoji: '📅', defaultEnabled: true },
  { id: 'google_docs', label: 'Google Docs', emoji: '📄', defaultEnabled: true },
  { id: 'google_sheets', label: 'Google Sheets', emoji: '📊', defaultEnabled: true },
  { id: 'google_slides', label: 'Google Slides', emoji: '🖼️', defaultEnabled: true },
] as const;

const AVAILABLE_TEXT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
] as const;

export default function WappyDotsMobilePage() {
  const [drawer, setDrawer] = useState<ActiveDrawer>('none');
  const [personality, setPersonality] = useState<PersonalityMode>('asistente');
  const [mood, setMood] = useState<TenshiAvatarMood>('idle');
  const [speechText, setSpeechText] = useState<string>(DEFAULT_HERO_SUBTITLE);
  const [promptInput, setPromptInput] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [composerMenu, setComposerMenu] = useState<'none' | 'attach' | 'general' | 'google'>('none');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    dataBase64: string;
  } | null>(null);
  const [enabledTools, setEnabledTools] = useState<string[]>(() => [
    ...GENERAL_TOOLS_CATALOG.filter((t) => t.defaultEnabled).map((t) => t.id),
    ...GOOGLE_TOOLS_CATALOG.filter((t) => t.defaultEnabled).map((t) => t.id),
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleConnectedTool = useCallback((toolId: string) => {
    tenshiAudio.playBlip();
    setEnabledTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId],
    );
  }, []);

  const triggerFileSelect = useCallback((accept: string) => {
    setComposerMenu('none');
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setAttachedFile({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64: base64,
      });
      setDrawer('chat');
    };
    reader.readAsDataURL(file);
  }, []);

  // Estado Multi-Chat e Integraciones sincronizado con Wappy Dots Backend
  const [messages, setMessages] = useState<SharedChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [sessions, setSessions] = useState<SharedChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('chat_principal');
  const [activeIntegration, setActiveIntegration] = useState<string>('antigravity');
  const [integrations, setIntegrations] = useState<WappyDotsIntegrationInfo[]>(DEFAULT_INTEGRATIONS);

  // Estado de Voz Live 24 kHz
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outputAmplitude, setOutputAmplitude] = useState<number>(0);
  const [isSFXMuted, setIsSFXMuted] = useState<boolean>(() => tenshiAudio.getMuted());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estado Picture-in-Picture (PiP: Cámara Móvil + Pantalla Mac)
  const [isPipOpen, setIsPipOpen] = useState<boolean>(false);
  const [pipMode, setPipMode] = useState<PipVisionMode>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [macScreenUrl, setMacScreenUrl] = useState<string | null>(null);
  const [isLoadingMacScreen, setIsLoadingMacScreen] = useState<boolean>(false);

  // Estado del Túnel de la Mac
  const [tunnelInfo, setTunnelInfo] = useState<TunnelLinkState>({
    ok: false,
    active: false,
    publicUrl: null,
    lanUrl: 'http://127.0.0.1:3001',
    updatedAt: null,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ampRafRef = useRef<number | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const prevMsgCountRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    document.title = 'Tenshi · Wappy Dots | WAPPY IA';
  }, []);

  const activeIntegrationInfo = useMemo<WappyDotsIntegrationInfo>(() => {
    return (
      integrations.find((item) => item.id === activeIntegration) ||
      DEFAULT_INTEGRATIONS.find((item) => item.id === activeIntegration) ||
      DEFAULT_INTEGRATIONS[0]
    );
  }, [integrations, activeIntegration]);

  const activeSession = useMemo<SharedChatSession | undefined>(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  const filteredSessions = useMemo<SharedChatSession[]>(() => {
    const q = historySearch?.trim().toLowerCase() || '';
    if (!q) return sessions;
    return sessions.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const msgMatch = Array.isArray(s.messages)
        ? s.messages.some((m) => (m.content || '').toLowerCase().includes(q))
        : false;
      return titleMatch || msgMatch;
    });
  }, [sessions, historySearch]);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.65;
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const stopAmplitudeLoop = useCallback(() => {
    if (ampRafRef.current !== null) {
      cancelAnimationFrame(ampRafRef.current);
      ampRafRef.current = null;
    }
    setOutputAmplitude(0);
  }, []);

  const startAmplitudeLoop = useCallback(() => {
    stopAmplitudeLoop();
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!isSpeakingRef.current) {
        setOutputAmplitude(0);
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / (dataArray.length * 255);
      setOutputAmplitude(Math.min(1, avg * 2.6));
      ampRafRef.current = requestAnimationFrame(tick);
    };
    ampRafRef.current = requestAnimationFrame(tick);
  }, [stopAmplitudeLoop]);

  const flushAudioQueue = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop(0);
        src.disconnect();
      } catch (_e) {
        // ignore
      }
    });
    activeSourcesRef.current.clear();
    if (audioCtxRef.current) {
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {
        // ignore
      }
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    stopAmplitudeLoop();
  }, [stopAmplitudeLoop]);

  const playWavBase64 = useCallback(
    async (b64: string): Promise<number> => {
      const ctx = ensureAudioCtx();
      if (!ctx) return 0;
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      } else {
        source.connect(ctx.destination);
      }

      const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
      nextStartTimeRef.current = startAt + audioBuffer.duration;
      activeSourcesRef.current.add(source);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setMood('speaking');
      startAmplitudeLoop();

      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          stopAmplitudeLoop();
          setMood('idle');
        }
      };

      source.start(startAt);
      return Math.max(400, (nextStartTimeRef.current - ctx.currentTime) * 1000 + 400);
    },
    [ensureAudioCtx, startAmplitudeLoop, stopAmplitudeLoop],
  );

  const speakFallback = useCallback((text: string, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const clean = cleanDisplayMarkdown(text).slice(0, 280);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'es-CO';
    u.rate = 1.05;
    u.pitch = 1.12;
    u.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setMood('speaking');
      setOutputAmplitude(0.55);
    };
    u.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setOutputAmplitude(0);
      setMood('idle');
      onDone?.();
    };
    u.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setOutputAmplitude(0);
      setMood('idle');
      onDone?.();
    };
    window.speechSynthesis.speak(u);
  }, []);

  const stopVoiceMode = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        // ignore
      }
    }
    flushAudioQueue();
    setMood('idle');
  }, [flushAudioQueue]);

  // Descubrimiento del túnel activo de la Mac
  const fetchTunnelLink = useCallback(async (): Promise<TunnelLinkState> => {
    try {
      const params = new URLSearchParams(window.location.search);
      const customParam = params.get('tunnel')?.trim();
      if (customParam) {
        localStorage.setItem('wappydots_custom_tunnel', customParam);
      }
      const res = await fetch('/api/tenshi/wappydots-link');
      if (res.ok) {
        const data = await res.json();
        const savedCustom = localStorage.getItem('wappydots_custom_tunnel')?.trim();
        const resolvedPublic = savedCustom || data.publicUrl || null;
        const nextState: TunnelLinkState = {
          ok: true,
          active: Boolean(resolvedPublic || data.active),
          publicUrl: resolvedPublic,
          lanUrl: data.lanUrl || 'http://127.0.0.1:3001',
          updatedAt: data.updatedAt || null,
          directMobileUrl: data.directMobileUrl,
        };
        setTunnelInfo(nextState);
        return nextState;
      }
    } catch (_e) {
      // ignore
    }
    return tunnelInfo;
  }, [tunnelInfo]);

  const callMacTunnel = useCallback(
    async (subPath: string, init?: RequestInit): Promise<Response> => {
      const cleanPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
      const base = tunnelInfo.publicUrl?.replace(/\/$/, '');
      if (base) {
        try {
          const directRes = await fetch(`${base}${cleanPath}`, init);
          if (directRes.ok) return directRes;
        } catch (_e) {
          // fallback a wappydots-proxy
        }
      }
      return fetch(`/api/tenshi/wappydots-proxy${cleanPath}`, init);
    },
    [tunnelInfo.publicUrl],
  );

  const resolveFileHref = useCallback(
    (fileName: string): string => {
      const enc = encodeURIComponent(fileName);
      const base = tunnelInfo.publicUrl?.replace(/\/$/, '');
      if (base) {
        return `${base}/api/gemini-tunnel/files/${enc}`;
      }
      return `/api/tenshi/wappydots-proxy/api/gemini-tunnel/files/${enc}`;
    },
    [tunnelInfo.publicUrl],
  );

  const applySharedStorePayload = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return;
    const nextMsgs: SharedChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
    const nextFiles: SharedFileItem[] = Array.isArray(data.files) ? data.files : [];
    const nextSessions: SharedChatSession[] = Array.isArray(data.sessions) ? data.sessions : [];
    const nextIntegrations: WappyDotsIntegrationInfo[] =
      Array.isArray(data.integrations) && data.integrations.length > 0
        ? data.integrations
        : DEFAULT_INTEGRATIONS;

    if (nextMsgs.length > prevMsgCountRef.current) {
      const latest = nextMsgs[nextMsgs.length - 1];
      if (latest && latest.role === 'assistant') {
        const cleaned = cleanDisplayMarkdown(latest.content);
        if (cleaned) {
          setSpeechText(cleaned.slice(0, 220) + (cleaned.length > 220 ? '...' : ''));
        }
        if (prevMsgCountRef.current > 0 && latest.source !== 'mobile') {
          triggerTenshiReaction('success', 2800, ['✨', '📄', '🚀']);
        }
      }
    }
    prevMsgCountRef.current = nextMsgs.length;
    setMessages(nextMsgs);
    setFiles(nextFiles);
    if (nextSessions.length > 0) {
      setSessions(nextSessions);
    }
    setIntegrations(nextIntegrations);
    if (typeof data.activeSessionId === 'string' && data.activeSessionId) {
      setActiveSessionId(data.activeSessionId);
    }
    if (typeof data.activeIntegration === 'string' && data.activeIntegration) {
      setActiveIntegration(data.activeIntegration);
    }
  }, []);

  const refreshSharedState = useCallback(async () => {
    try {
      const res = await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat');
      if (!res.ok) return;
      const data = await res.json();
      applySharedStorePayload(data);
    } catch (_e) {
      // ignore
    }
  }, [callMacTunnel, applySharedStorePayload]);

  useEffect(() => {
    fetchTunnelLink().then(() => {
      refreshSharedState();
    });
    const linkTimer = setInterval(fetchTunnelLink, 15000);
    const chatTimer = setInterval(refreshSharedState, 3500);
    return () => {
      clearInterval(linkTimer);
      clearInterval(chatTimer);
    };
  }, [fetchTunnelLink, refreshSharedState]);

  useEffect(() => {
    if (drawer === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, drawer]);

  // =========================================================================
  // CONTROL DE CONVERSACIONES MULTI-SESIÓN E INTEGRACIONES
  // =========================================================================
  const handleNewChatSession = useCallback(
    async (openChat = true) => {
      tenshiAudio.playBlip();
      try {
        const res = await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integrationId: activeIntegration }),
        });
        if (res.ok) {
          const data = await res.json();
          prevMsgCountRef.current = 0;
          applySharedStorePayload(data);
        } else {
          setMessages([]);
        }
      } catch (_e) {
        setMessages([]);
      }
      setSpeechText(DEFAULT_HERO_SUBTITLE);
      if (openChat) {
        setDrawer('chat');
      }
    },
    [activeIntegration, applySharedStorePayload, callMacTunnel],
  );

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      tenshiAudio.playBlip();
      try {
        const res = await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          prevMsgCountRef.current = Array.isArray(data?.messages) ? data.messages.length : 0;
          applySharedStorePayload(data);
        }
      } catch (_e) {
        // ignore
      }
      setDrawer('chat');
    },
    [applySharedStorePayload, callMacTunnel],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      tenshiAudio.playBlip();
      try {
        const res = await callMacTunnel(
          `/api/gemini-tunnel/antigravity/shared-chat/session/${encodeURIComponent(sessionId)}`,
          { method: 'DELETE' },
        );
        if (res.ok) {
          const data = await res.json();
          prevMsgCountRef.current = Array.isArray(data?.messages) ? data.messages.length : 0;
          applySharedStorePayload(data);
        }
      } catch (_e) {
        // ignore
      }
    },
    [applySharedStorePayload, callMacTunnel],
  );

  const handleSelectIntegration = useCallback(
    async (integrationId: string) => {
      tenshiAudio.playBlip();
      setActiveIntegration(integrationId);
      const chosen =
        integrations.find((i) => i.id === integrationId) ||
        DEFAULT_INTEGRATIONS.find((i) => i.id === integrationId) ||
        DEFAULT_INTEGRATIONS[0];
      triggerTenshiReaction('success', 2000, ['✨', '🔗']);
      setSpeechText(`Integración activa: ${chosen.fullName}. Lista para ejecutar tus órdenes.`);

      try {
        const res = await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat/integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integrationId }),
        });
        if (res.ok) {
          const data = await res.json();
          applySharedStorePayload(data);
        }
      } catch (_e) {
        // ignore
      }
    },
    [applySharedStorePayload, callMacTunnel, integrations],
  );

  // =========================================================================
  // PICTURE-IN-PICTURE (CÁMARA MÓVIL & PANTALLA EN VIVO DE MI MAC)
  // =========================================================================
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_e) {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraStream = useCallback(
    async (targetFacing: 'user' | 'environment' = facingMode) => {
      stopCameraStream();
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Cámara no soportada en este navegador.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (_err) {
        setCameraError('Permiso de cámara no concedido.');
      }
    },
    [facingMode, stopCameraStream],
  );

  const fetchMacScreen = useCallback(async (): Promise<string | null> => {
    setIsLoadingMacScreen(true);
    try {
      const res = await callMacTunnel('/api/gemini-tunnel/mac-screen');
      if (res.ok) {
        const data = await res.json();
        if (data?.imageDataUrl) {
          setMacScreenUrl(data.imageDataUrl);
          setIsLoadingMacScreen(false);
          return data.imageDataUrl;
        }
      }
    } catch (_e) {
      // ignore
    }
    setIsLoadingMacScreen(false);
    return null;
  }, [callMacTunnel]);

  useEffect(() => {
    if (!isPipOpen) {
      stopCameraStream();
      return;
    }
    if (pipMode === 'camera') {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
      fetchMacScreen();
    }
    return () => {
      stopCameraStream();
    };
  }, [isPipOpen, pipMode, facingMode, startCameraStream, stopCameraStream, fetchMacScreen]);

  const handleTogglePip = useCallback(() => {
    tenshiAudio.playBlip();
    setIsPipOpen((prev) => !prev);
  }, []);

  const handleSwitchCamera = useCallback(() => {
    tenshiAudio.playBlip();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // =========================================================================
  // ENVÍO DE MENSAJES Y ÓRDENES A TENSHI (VOZ LIVE 24KHZ + TEXTO + VISIÓN)
  // =========================================================================
  const sendMessage = useCallback(
    async (
      rawPrompt: string,
      options?: { viaVoice?: boolean; imageDataUrl?: string; openChatDrawer?: boolean },
    ) => {
      const text = rawPrompt?.trim() || '';
      if (!text) return;

      if (isPauseOnlyCommand(text)) {
        flushAudioQueue();
        setSpeechText('⏸️ Locución pausada · Sigo activa escuchándote en vivo.');
        setMood('listening');
        return;
      }

      if (options?.openChatDrawer) {
        setDrawer('chat');
      }

      const isFarewell = isNaturalFarewellCommand(text);
      flushAudioQueue();
      tenshiAudio.playBlip();
      analyzeTenshiEmotionFromText(text, 'user');
      setIsProcessing(true);
      setMood('thinking');
      setSpeechText(`«${text}»`);

      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: text,
          source: options?.viaVoice ? 'notch-voice' : 'mobile',
          conversationId: activeSessionId,
        },
      ]);

      const systemPrompt = `Eres Tenshi, asistente universal en vivo de Wappy Dots en modo libre inteligente. Todas las integraciones (Google Antigravity IDE, Google Workspace, NotebookLM, Google Flow, Somos SST, generador de documentos PDF/Word/Excel/HTML/QR y control de la Mac del usuario) conviven juntas y están activas al mismo tiempo en esta conversación. Si el usuario se despide ("hasta luego", "gracias por todo", "chao", "nos vemos"), pronuncia primero una despedida corta y cálida e invoca wappy_controlar_videollamada(accion: "colgar_llamada"). NUNCA cuelgues si solo dice "para", "detente" o "espera".`;

      const useLiveAudioModel = Boolean(options?.viaVoice && !options?.imageDataUrl);
      const userMessageContent: any = options?.imageDataUrl
        ? [
            { type: 'text', text },
            { type: 'image_url', image_url: { url: options.imageDataUrl } },
          ]
        : text;

      const fileToSend = attachedFile;
      if (fileToSend) {
        setAttachedFile(null);
      }

      try {
        let res = await callMacTunnel('/api/gemini-tunnel/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer wappy-tunnel',
          },
          body: JSON.stringify({
            model: useLiveAudioModel ? 'gemini-3.8-live' : selectedModel,
            voice: 'Aoede',
            session_id: activeSessionId,
            integration_id: 'universal',
            enabled_tools: enabledTools,
            ...(fileToSend ? { wappy_file: fileToSend } : {}),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessageContent },
            ],
          }),
        });

        let replyData = await res.json();

        // Si el modelo Live invocó una herramienta (tool_calls), ejecutar el turno de herramientas con el modelo seleccionado
        if (
          useLiveAudioModel &&
          (replyData?.choices?.[0]?.finish_reason === 'tool_calls' ||
            replyData?.choices?.[0]?.message?.tool_calls?.length)
        ) {
          res = await callMacTunnel('/api/gemini-tunnel/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer wappy-tunnel',
            },
            body: JSON.stringify({
              model: selectedModel,
              session_id: activeSessionId,
              integration_id: 'universal',
              enabled_tools: enabledTools,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
              ],
            }),
          });
          replyData = await res.json();
        }

        const rawReply =
          replyData?.text ||
          replyData?.choices?.[0]?.message?.content ||
          (isFarewell ? '¡Hasta luego! Fue un gusto ayudarte hoy.' : '¡Instrucción completada!');
        const shouldHangUp =
          isFarewell ||
          Boolean(replyData?.should_hang_up) ||
          String(rawReply).includes('HANGUP_CALL');
        const cleanReply =
          cleanDisplayMarkdown(String(rawReply).replace(/HANGUP_CALL:?/gi, '')) ||
          '¡Hasta luego! Fue un gusto ayudarte hoy.';

        setIsProcessing(false);
        setSpeechText(cleanReply.slice(0, 260) + (cleanReply.length > 260 ? '...' : ''));
        analyzeTenshiEmotionFromText(cleanReply, 'assistant');
        triggerTenshiReaction('success', 2600, ['✨', '💚', '🐾']);

        const wavBase64 =
          replyData?.audio_wav_base64 || replyData?.choices?.[0]?.message?.audio_wav_base64;

        if (wavBase64) {
          const waitMs = await playWavBase64(wavBase64);
          if (shouldHangUp) {
            setTimeout(() => stopVoiceMode(), waitMs);
          }
        } else if (options?.viaVoice || isListening) {
          speakFallback(cleanReply, () => {
            if (shouldHangUp) {
              setTimeout(() => stopVoiceMode(), 400);
            }
          });
        }
      } catch (_e) {
        setIsProcessing(false);
        setMood('idle');
        setSpeechText(
          'No pude contactar el túnel de tu Mac en este instante. Verifica que Wappy Dots esté abierto.',
        );
      }

      await refreshSharedState();
    },
    [
      activeIntegration,
      activeIntegrationInfo,
      activeSessionId,
      callMacTunnel,
      flushAudioQueue,
      isListening,
      personality,
      playWavBase64,
      refreshSharedState,
      speakFallback,
      stopVoiceMode,
    ],
  );

  const handleCaptureCameraAndAnalyze = useCallback(() => {
    tenshiAudio.playBlip();
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      sendMessage('Analiza lo que estoy enfocando con mi cámara móvil.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      sendMessage(
        'Analiza esta foto capturada con la cámara de mi celular y descríbeme qué observas o cómo me puedes ayudar.',
        { imageDataUrl: dataUrl },
      );
    }
  }, [sendMessage]);

  const handleAskAboutMacScreen = useCallback(async () => {
    tenshiAudio.playBlip();
    let img = macScreenUrl;
    if (!img) {
      img = await fetchMacScreen();
    }
    sendMessage(
      '¿Qué hay en la pantalla activa de mi Mac en este momento? Analízala y dime cómo me puedes asistir.',
      img ? { imageDataUrl: img } : undefined,
    );
  }, [fetchMacScreen, macScreenUrl, sendMessage]);

  const toggleVoiceMode = useCallback(() => {
    ensureAudioCtx();
    tenshiAudio.playBlip();
    if (isSpeakingRef.current) {
      flushAudioQueue();
    }
    if (isMicMuted) {
      setIsMicMuted(false);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDrawer('chat');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        // ignore
      }
      setIsListening(false);
      setMood('idle');
      return;
    }

    const r = new SpeechRecognition();
    r.lang = 'es-CO';
    r.continuous = false;
    r.interimResults = true;

    r.onstart = () => {
      if (isSpeakingRef.current) {
        flushAudioQueue();
      }
      setIsListening(true);
      setMood('listening');
      setSpeechText('Voz en vivo activa. Te estoy escuchando...');
    };

    r.onresult = (ev: any) => {
      const transcript = Array.from(ev.results || [])
        .map((res: any) => res[0]?.transcript || '')
        .join('');
      if (transcript.trim().length > 1 && isSpeakingRef.current) {
        flushAudioQueue();
      }
      setSpeechText(transcript || 'Escuchando...');
      setPromptInput(transcript);
    };

    r.onend = () => {
      setIsListening(false);
      setPromptInput((current) => {
        const trimmed = current?.trim() || '';
        if (trimmed) {
          setTimeout(() => sendMessage(trimmed, { viaVoice: true }), 20);
        } else {
          setMood('idle');
        }
        return '';
      });
    };

    r.onerror = () => {
      setIsListening(false);
      setMood('idle');
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (_e) {
      // ignore
    }
  }, [ensureAudioCtx, flushAudioQueue, isListening, isMicMuted, sendMessage]);

  const handleToggleMicMute = useCallback(() => {
    tenshiAudio.playBlip();
    if (isSpeakingRef.current) {
      flushAudioQueue();
      return;
    }
    if (!isMicMuted && isListening) {
      stopVoiceMode();
    }
    setIsMicMuted((prev) => !prev);
  }, [flushAudioQueue, isListening, isMicMuted, stopVoiceMode]);

  const handleToggleSFX = useCallback(() => {
    const nextMuted = tenshiAudio.toggleMuted();
    setIsSFXMuted(nextMuted);
    if (!nextMuted) {
      tenshiAudio.playBlip();
    }
  }, []);

  const handleCopyMessage = useCallback((text: string, id: string) => {
    navigator.clipboard?.writeText(cleanDisplayMarkdown(text)).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const getSourceBadge = (m: SharedChatMessage) => {
    if (m.source === 'antigravity') return '🚀 Antigravity IDE';
    if (m.source === 'notch-voice')
      return m.role === 'user' ? '🎙️ Voz en Vivo' : '🔊 Tenshi Voz 24kHz';
    if (m.source === 'mobile') return '📱 Wappy Dots Móvil';
    return m.role === 'user' ? '💬 Tú' : '✨ Tenshi';
  };

  const heroSubtitleText = useMemo(() => {
    if (isMicMuted) {
      return 'Micrófono silenciado (Mute activo). Tenshi no te escucha.';
    }
    if (isSpeaking || isProcessing || isListening) {
      return speechText || 'Voz en vivo activa. Te estoy escuchando...';
    }
    if (speechText && speechText !== DEFAULT_HERO_SUBTITLE) {
      return speechText;
    }
    return DEFAULT_HERO_SUBTITLE;
  }, [isListening, isMicMuted, isProcessing, isSpeaking, speechText]);

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#09090c] text-white select-none"
      style={{
        paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
      }}
    >
      {/* ===================================================================== */}
      {/* ZONA 1 — CABECERA SUPERIOR (Idéntica a Tenshi Hero Móvil en LibreChat)*/}
      {/* ===================================================================== */}
      <header
        className="relative z-30 flex items-center justify-between bg-[#09090c]/90 backdrop-blur-md border-b border-white/[0.06] px-4 py-3 shrink-0"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        }}
      >
        {/* Izquierda: Mini TenshiAvatar + Nombre + Insignia WAPPY DOTS + Subtítulo dinámico */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <TenshiAvatar
              size={32}
              mood={mood}
              isSpeaking={isSpeaking}
              outputAmplitude={outputAmplitude}
              isVoiceActive={isListening}
              interactive={false}
              showHaloEffect={false}
              showHUD={true}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#09090c] ${
                isListening
                  ? 'bg-[#C7F303] animate-pulse'
                  : tunnelInfo.active
                  ? 'bg-[#C7F303]'
                  : 'bg-emerald-400'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[15px] text-white leading-none">Tenshi</h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-[#C7F303] rounded-full border border-[#C7F303]/35">
                WAPPY DOTS
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400 truncate">
              {isSpeaking
                ? 'Hablando contigo...'
                : isListening
                ? 'Voz en vivo activa'
                : 'Copiloto Universal · Conectada con tu Mac'}
            </p>
          </div>
        </div>

        {/* Derecha: Sonido + Botón Cápsula "Ir a Wappy →" */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSFX}
            title={isSFXMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
          >
            {isSFXMuted ? (
              <VolumeX className="h-4 w-4 text-emerald-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'tunnel' ? 'none' : 'tunnel'));
            }}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs font-semibold active:scale-95 transition-all hover:border-zinc-600"
          >
            <span>Ir a Wappy</span>
            <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* TARJETA FLOTANTE PICTURE-IN-PICTURE (PiP: CÁMARA MÓVIL / MI MAC)      */}
      {/* ===================================================================== */}
      {isPipOpen && (
        <div className="fixed top-16 right-4 z-30 w-44 sm:w-52 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Selector de Modo PiP */}
          <div className="flex items-center justify-between gap-1 bg-zinc-900/95 px-2 py-1.5 border-b border-white/10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPipMode('camera')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  pipMode === 'camera'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                📱 Cámara
              </button>
              <button
                type="button"
                onClick={() => setPipMode('mac')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  pipMode === 'mac'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🖥️ Mi Mac
              </button>
            </div>
            <button
              type="button"
              onClick={handleTogglePip}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              title="Cerrar vista PiP"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {pipMode === 'camera' ? (
            <div className="relative h-32 w-full bg-black">
              {cameraError ? (
                <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-zinc-400">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Voltear cámara"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 active:scale-95"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1.5 inset-x-1.5">
                <button
                  type="button"
                  onClick={handleCaptureCameraAndAnalyze}
                  className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-zinc-950 text-[10px] font-extrabold shadow-lg active:scale-95"
                >
                  <Camera className="h-3 w-3" />
                  <span>Analizar Foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative h-32 w-full bg-black flex flex-col justify-between">
              {macScreenUrl ? (
                <img
                  src={macScreenUrl}
                  alt="Pantalla de mi Mac"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-zinc-400">
                  {isLoadingMacScreen ? 'Capturando pantalla Mac...' : 'Toca refrescar para ver tu Mac'}
                </div>
              )}
              <button
                type="button"
                onClick={fetchMacScreen}
                title="Refrescar pantalla Mac"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 active:scale-95"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMacScreen ? 'animate-spin' : ''}`} />
              </button>
              <div className="absolute bottom-1.5 inset-x-1.5">
                <button
                  type="button"
                  onClick={handleAskAboutMacScreen}
                  className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-zinc-950 text-[10px] font-extrabold shadow-lg active:scale-95"
                >
                  <Laptop className="h-3 w-3" />
                  <span>Preguntar sobre mi pantalla</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ZONA 2 & ZONA 3 — ESCENARIO HEROICO CENTRAL + BOTONERA CÁPSULA 4 ICONOS*/}
      {/* ===================================================================== */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-4 -mt-2 select-none overflow-hidden">
        {/* Halo radial muy sutil detrás de Tenshi sobre fondo negro puro #09090c */}
        <div
          className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl opacity-30 transition-all duration-500"
          style={{
            background: isListening
              ? 'radial-gradient(circle, rgba(199,243,3,0.28) 0%, rgba(16,185,129,0.08) 60%, transparent 100%)'
              : isSpeaking
              ? 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(20,184,166,0.08) 60%, transparent 100%)'
              : 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(245,158,11,0.08) 55%, transparent 100%)',
          }}
        />

        {/* Avatar Grande de Tenshi (315px) — Aureola 100% despejada sin cajas encima */}
        <div
          className="relative z-10 flex flex-col items-center my-1 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
          onClick={toggleVoiceMode}
          title="Tócame para hablar"
        >
          <TenshiAvatar
            size={315}
            mood={mood}
            isSpeaking={isSpeaking}
            outputAmplitude={outputAmplitude}
            isVoiceActive={isListening}
            isTyping={isProcessing}
            interactive={true}
            showHaloEffect={true}
            showHUD={true}
          />
        </div>

        {/* Saludo & Subtítulo limpio debajo de Tenshi */}
        <div className="relative z-10 mt-6 mb-4 text-center px-6">
          <h2 className="text-[26px] font-extrabold text-white tracking-tight mb-1.5">
            ¡Hola, Felix!
          </h2>
          <p className="text-[14px] text-zinc-400 leading-relaxed max-w-[310px] mx-auto line-clamp-3">
            {heroSubtitleText}
          </p>
        </div>

        {/* ZONA 3 — Botonera Cápsula Central de 4 Iconos */}
        <div className="relative z-10 inline-flex items-center gap-3 p-1.5 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl">
          {/* Botón 1: Chat Activo */}
          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'));
            }}
            title={drawer === 'chat' ? 'Cerrar chat' : 'Abrir chat con Tenshi'}
            className={`relative p-2.5 rounded-full transition-all active:scale-90 ${
              drawer === 'chat'
                ? 'text-emerald-400 bg-white/15'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            {messages.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C7F303] ring-2 ring-zinc-900" />
            )}
          </button>

          {/* Botón 2: Micrófono / Modo Voz Live 24 kHz */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            title={isListening ? 'Detener modo voz Live' : 'Activar modo voz Live 24 kHz'}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${
              isListening
                ? 'text-emerald-400 bg-white/20 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50 animate-pulse'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Botón 3: Silenciar Micrófono (Mute) / Callar voz de Tenshi */}
          <button
            type="button"
            onClick={handleToggleMicMute}
            title={isMicMuted ? 'Reactivar micrófono' : 'Silenciar micrófono o voz'}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${
              isMicMuted
                ? 'text-red-400 bg-red-500/25 border border-red-500/50 shadow-lg shadow-red-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MicOff className={`h-5 w-5 ${isMicMuted ? 'text-red-400' : 'text-zinc-400 opacity-80'}`} />
          </button>

          {/* Botón 4: Cámara / Visión PiP (Cámara Móvil + Pantalla Mac) */}
          <button
            type="button"
            onClick={handleTogglePip}
            title={isPipOpen ? 'Cerrar visión PiP' : 'Abrir cámara o pantalla de mi Mac'}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${
              isPipOpen
                ? 'text-emerald-400 bg-white/20 shadow-lg shadow-emerald-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isPipOpen ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          </button>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 5. LÁMINA DESLIZABLE DE CHAT ACTIVO (drawer === 'chat')               */}
      {/* ===================================================================== */}
      {drawer === 'chat' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          {/* Cabecera del Chat Activo */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-zinc-900/90 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-sm font-bold text-white truncate">
                {activeSession?.title || 'Nueva conversación'}
              </span>
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#C7F303]/35 bg-[#C7F303]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#C7F303]">
                Universal
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleNewChatSession(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-300 hover:bg-teal-500/20 active:scale-95 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
                title="Cerrar y ver a Tenshi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="mt-8 flex flex-col items-center text-center px-4">
                <p className="text-xs text-zinc-400 max-w-xs">
                  Todas tus integraciones (<strong className="text-white">Antigravity, Workspace, NotebookLM, Flow, SST y tu Mac</strong>) conviven juntas en este mismo chat.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      sendMessage('Consulta el estado de Antigravity, proyectos activos y chats recientes')
                    }
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    🚀 Estado Antigravity
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendMessage(
                        'Genera un informe ejecutivo en PDF con el resumen de mis proyectos y pásalo a mi celular',
                      )
                    }
                    className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20"
                  >
                    📄 Crear Informe PDF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendMessage('¿Qué hay en la pantalla activa de mi Mac en este momento?')
                    }
                    className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20"
                  >
                    🖥️ Analizar mi Mac
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const msgKey = m.id || `msg-${idx}`;
                const cleaned = cleanDisplayMarkdown(m.content);
                return (
                  <div
                    key={msgKey}
                    className={`rounded-2xl border p-3.5 text-xs sm:text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'ml-8 border-teal-500/35 bg-teal-500/15 text-zinc-100'
                        : 'mr-4 border-white/10 bg-zinc-900/90 text-zinc-200'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C7F303]">
                        {getSourceBadge(m)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => speakFallback(cleaned)}
                          className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                          title="Escuchar mensaje"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(cleaned, msgKey)}
                          className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                          title="Copiar"
                        >
                          {copiedId === msgKey ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap">{cleaned}</div>

                    {Array.isArray(m.files) && m.files.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {m.files.map((f) => (
                          <a
                            key={f.id || f.fileName}
                            href={resolveFileHref(f.fileName)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
                          >
                            <span className="truncate">📲 Abrir: {f.title || f.fileName}</span>
                            <span className="ml-2 shrink-0 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase text-[#C7F303]">
                              {f.format}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Barra de envío del Chat Activo con [📎 Adjuntar], [⚙️ Integraciones Generales + Modelo IA] y [G Integraciones de Google] */}
          <div className="relative border-t border-white/10 bg-zinc-900 p-3 shrink-0 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Popover 1: 📎 Adjuntar Imagen/Video, Documento o Archivo (Imagen 3) */}
            {composerMenu === 'attach' && (
              <div className="absolute bottom-16 left-3 z-50 w-72 rounded-2xl border border-white/15 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl space-y-1">
                <button
                  type="button"
                  onClick={() => triggerFileSelect('image/*,video/*')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-100 hover:bg-white/10"
                >
                  <span>📷 Imagen / Video</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerFileSelect('.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.pptx,.ppt')
                  }
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-100 hover:bg-white/10"
                >
                  <span>📄 Documento (PDF, Word, Excel, Texto)</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileSelect('*/*')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-100 hover:bg-white/10"
                >
                  <span>📎 Adjunto completo (Cualquier archivo)</span>
                </button>
              </div>
            )}

            {/* Popover 2: ⚙️ Modelo IA + Integraciones Generales Conectadas (Imagen 5) */}
            {composerMenu === 'general' && (
              <div className="absolute bottom-16 left-3 z-50 w-72 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl space-y-2.5">
                <div className="border-b border-white/10 pb-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1.5">
                    <span>⚙️ Modelo IA</span>
                    <span className="text-[10px] text-emerald-400">Prioridad + Rotación</span>
                  </div>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  >
                    {AVAILABLE_TEXT_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {GENERAL_TOOLS_CATALOG.map((tool) => {
                    const checked = enabledTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleConnectedTool(tool.id)}
                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 cursor-pointer"
                      >
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {tool.emoji} {tool.label}
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                            checked ? 'bg-emerald-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              checked ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popover 3: G Integraciones de Google por aparte (Imagen 4) */}
            {composerMenu === 'google' && (
              <div className="absolute bottom-16 left-3 z-50 w-72 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 pb-1.5 border-b border-white/10">
                  Integraciones de Google
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pt-1 pr-1">
                  {GOOGLE_TOOLS_CATALOG.map((tool) => {
                    const checked = enabledTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleConnectedTool(tool.id)}
                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 cursor-pointer"
                      >
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {tool.emoji} {tool.label}
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                            checked ? 'bg-emerald-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              checked ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chip de archivo adjunto */}
            {attachedFile && (
              <div className="flex items-center justify-between rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs text-sky-200">
                <span className="truncate font-semibold">📎 {attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="ml-2 text-sky-300 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!promptInput.trim() && !attachedFile) return;
                const val =
                  promptInput.trim() ||
                  `Analiza el archivo adjunto (${attachedFile?.name || 'archivo'}) y explícame su contenido.`;
                setPromptInput('');
                setComposerMenu('none');
                sendMessage(val);
              }}
              className="flex items-center gap-1.5"
            >
              {/* 1. Botón 📎 Adjuntar */}
              <button
                type="button"
                onClick={() =>
                  setComposerMenu((prev) => (prev === 'attach' ? 'none' : 'attach'))
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                  composerMenu === 'attach'
                    ? 'border-[#C7F303]/60 bg-[#C7F303]/15 text-[#C7F303]'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
                title="Adjuntar Imagen, Video o Documento"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* 2. Botón ⚙️ Modelo IA + Integraciones Generales */}
              <button
                type="button"
                onClick={() =>
                  setComposerMenu((prev) => (prev === 'general' ? 'none' : 'general'))
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                  composerMenu === 'general'
                    ? 'border-[#C7F303]/60 bg-[#C7F303]/15 text-[#C7F303]'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
                title="Modelo IA e Integraciones Generales"
              >
                <Settings2 className="h-4 w-4" />
              </button>

              {/* 3. Botón G Integraciones de Google */}
              <button
                type="button"
                onClick={() =>
                  setComposerMenu((prev) => (prev === 'google' ? 'none' : 'google'))
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-black text-sm transition ${
                  composerMenu === 'google'
                    ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
                    : 'border-white/10 bg-white/5 text-blue-400 hover:bg-white/10'
                }`}
                title="Integraciones de Google"
              >
                G
              </button>

              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Mensaje a Tenshi..."
                className="flex-1 min-w-0 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50"
              />

              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                  isListening ? 'bg-emerald-500 text-zinc-950 animate-pulse' : 'bg-white/10 text-white'
                }`}
                title="Dictar por voz"
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C7F303] text-[#0E1300] font-extrabold active:scale-95 transition"
                title="Enviar"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.8]" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PANEL IZQUIERDO: HISTORIAL DE CHATS (drawer === 'history')            */}
      {/* ===================================================================== */}
      {drawer === 'history' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-bold text-white">
                Historial de Conversaciones ({sessions.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNewChatSession(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-300 hover:bg-teal-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-white/[0.06] bg-zinc-900/50">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {filteredSessions.length === 0 ? (
              <div className="mt-10 text-center text-xs text-zinc-400">
                No se encontraron conversaciones.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isCurrent = s.id === activeSessionId;
                const msgCount = Array.isArray(s.messages) ? s.messages.length : 0;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                      isCurrent
                        ? 'border-teal-500/50 bg-teal-500/10'
                        : 'border-white/10 bg-zinc-900/80 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs sm:text-sm font-bold text-white">
                          {s.title || 'Nueva conversación'}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 rounded-full bg-[#C7F303]/20 border border-[#C7F303]/40 px-2 py-0.5 text-[9px] font-extrabold text-[#C7F303]">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>{msgCount} {msgCount === 1 ? 'mensaje' : 'mensajes'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 active:scale-95"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PANEL DE INTEGRACIONES CONECTADAS (drawer === 'integration')          */}
      {/* ===================================================================== */}
      {drawer === 'integration' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#C7F303]" />
              <span className="text-sm font-bold text-white">
                Integraciones Activas en tu Chat
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            <p className="text-xs text-zinc-400 mb-2">
              Todas estas integraciones <strong className="text-white">conviven juntas al mismo tiempo</strong> en cada uno de tus chats. Toca cualquiera para usarla ahora mismo:
            </p>
            {integrations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const quickPrompt =
                    item.id === 'antigravity'
                      ? 'Muéstrame mis proyectos activos y chats recientes en Antigravity.'
                      : item.id === 'google-workspace'
                      ? 'Revisa mi agenda de hoy en Google Calendar y mis correos importantes.'
                      : item.id === 'notebooklm'
                      ? 'Consulta mis cuadernos e investigaciones en NotebookLM.'
                      : item.id === 'google-flow'
                      ? 'Ayúdame a crear un video o imagen con Google Flow.'
                      : item.id === 'wappy-sst'
                      ? 'Consulta el resumen general 360 del SG-SST en Somos SST.'
                      : '¿Qué hay en la pantalla activa de mi Mac en este momento?';
                  sendMessage(quickPrompt, { openChatDrawer: true });
                }}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-3.5 text-left transition hover:border-emerald-500/50 active:scale-[0.99]"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05]"
                    style={{ color: item.badgeColor }}
                  >
                    {renderIntegrationIcon(item.icon, 'h-5 w-5')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.fullName}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C7F303]/20 border border-[#C7F303]/40 px-2.5 py-1 text-[10px] font-extrabold text-[#C7F303]">
                    <Check className="h-3 w-3" />
                    Activa
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CAJÓN DE DOCUMENTOS GENERADOS Y SOMOS SST (drawer === 'files')        */}
      {/* ===================================================================== */}
      {drawer === 'files' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">
                Somos SST · Documentos & QR ({files.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Acciones Rápidas de Generación */}
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-white/[0.06] bg-zinc-900/40 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Genera un informe ejecutivo en PDF con el resumen de mis proyectos y pásalo a mi celular',
                  { openChatDrawer: true },
                )
              }
              className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
            >
              📄 Crear PDF
            </button>
            <button
              type="button"
              onClick={() =>
                sendMessage('Genera un código QR para https://wappy.club/wappydots', {
                  openChatDrawer: true,
                })
              }
              className="shrink-0 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-bold text-fuchsia-300 hover:bg-fuchsia-500/20"
            >
              📱 Crear QR
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectIntegration('wappy-sst');
                sendMessage('Consulta el resumen general 360 del SG-SST en Somos SST', {
                  openChatDrawer: true,
                });
              }}
              className="shrink-0 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20"
            >
              🛡️ Resumen 360 SST
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {files.length === 0 ? (
              <div className="mt-12 text-center text-xs text-zinc-400">
                Aún no hay archivos generados. Pídele a Tenshi un PDF, Word, Excel, HTML o código QR.
              </div>
            ) : (
              files.map((f) => {
                const sizeKb = Math.max(1, Math.round((f.sizeBytes || 0) / 1024));
                return (
                  <a
                    key={f.id || f.fileName}
                    href={resolveFileHref(f.fileName)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/90 p-3.5 transition hover:border-emerald-400/40"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-xs sm:text-sm font-bold text-white">
                        📄 {f.title || f.fileName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        {f.fileName} · {sizeKb} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#C7F303]">
                        {f.format || 'DOC'}
                      </span>
                      <ExternalLink className="h-4 w-4 text-zinc-400" />
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PANEL DERECHO: AGENTES Y CONTROL MAC (drawer === 'agents')            */}
      {/* ===================================================================== */}
      {drawer === 'agents' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-bold text-white">
                Agentes & Control de mi Mac
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Control Directo de Mac & Antigravity IDE */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-white">
                Órdenes Directas a tu Mac & Antigravity IDE
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawer('none');
                  setPipMode('mac');
                  setIsPipOpen(true);
                  fetchMacScreen();
                }}
                className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
              >
                <span>🖥️ Ver Pantalla de mi Mac en Vivo (PiP)</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  tenshiAudio.playBlip();
                  await callMacTunnel('/api/gemini-tunnel/antigravity/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool: 'open_window', args: {} }),
                  }).catch(() => {});
                  setDrawer('none');
                  setSpeechText('Ventana de Antigravity IDE traída al frente en tu Mac.');
                }}
                className="w-full flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
              >
                <span>🚀 Abrir Antigravity.app en mi Mac</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  sendMessage(
                    'Consulta el estado de Antigravity, proyectos activos y chats recientes',
                    { openChatDrawer: true },
                  )
                }
                className="w-full flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs font-bold text-purple-200 hover:bg-purple-500/20"
              >
                <span>📂 Listar Proyectos y Chats de Antigravity</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  sendMessage('Lista mis tareas y automatizaciones activas en Wappy Dots', {
                    openChatDrawer: true,
                  })
                }
                className="w-full flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
              >
                <span>⚙️ Ver Automatizaciones y Tareas Activas</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL RÁPIDO DE CONEXIÓN TÚNEL & NAVEGACIÓN ("Ir a Wappy →")          */}
      {/* ===================================================================== */}
      {drawer === 'tunnel' && (
        <div
          className="absolute inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-[#C7F303]" />
              <span className="text-sm font-bold text-white">
                Estado del Túnel Mac & Ir a Wappy
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Conexión con tu Mac</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                    tunnelInfo.active
                      ? 'bg-emerald-500/20 text-[#C7F303] border border-[#C7F303]/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      tunnelInfo.active ? 'bg-[#C7F303]' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  {tunnelInfo.active ? 'En línea · 24 kHz' : 'Vía Proxy Wappy'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 break-all">
                Túnel público: {tunnelInfo.publicUrl || 'Conectado mediante proxy seguro de wappy.club'}
              </p>
              <p className="text-[11px] text-zinc-500">Red local Mac: {tunnelInfo.lanUrl}</p>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/wappy-dots"
                className="flex items-center justify-between rounded-2xl border border-teal-500/40 bg-teal-500/15 p-4 text-sm font-bold text-teal-200 hover:bg-teal-500/25 transition"
              >
                <span>💻 Ir a Wappy Dots (Versión Escritorio)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/c/new"
                className="flex items-center justify-between rounded-2xl border border-white/15 bg-zinc-900 p-4 text-sm font-bold text-white hover:bg-zinc-800 transition"
              >
                <span>✨ Ir a Wappy IA Chat Principal (/c/new)</span>
                <ArrowRight className="h-4 w-4 text-[#C7F303]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ZONA 4 — BARRA FLOTANTE INFERIOR DE 5 BOTONES (MobileBottomNav Exacta)*/}
      {/* ===================================================================== */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 px-3 pb-2 pointer-events-none"
        style={{
          paddingBottom: 'max(8px, calc(env(safe-area-inset-bottom, 0px) - 4px))',
        }}
      >
        <nav
          aria-label="Navegación Wappy Dots Móvil"
          className="relative flex items-center justify-between px-2 py-1 max-w-md mx-auto bg-zinc-900/95 text-white backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.65)] pointer-events-auto"
        >
          {/* 1. Extremo Izquierdo: Historial de Chats (LeftPanelIcon exacto) */}
          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'history' ? 'none' : 'history'));
            }}
            aria-label="Historial de chats"
            className={`flex items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all active:scale-90 ${
              drawer === 'history' ? 'bg-teal-500/10 text-teal-400' : 'hover:bg-white/5'
            }`}
          >
            <LeftPanelIcon active={drawer === 'history'} />
          </button>

          {/* 2. Mano Izquierda: Integración Activa con el Agente (GraduationCap exacto) */}
          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'integration' ? 'none' : 'integration'));
            }}
            aria-label="Integración activa"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-90 ${
              drawer === 'integration'
                ? 'text-teal-400 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center h-5 w-5">
              <GraduationCap
                className={`h-5 w-5 transition-transform duration-150 ${
                  drawer === 'integration' ? 'scale-110 text-teal-400' : ''
                }`}
              />
              <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full ring-2 ring-zinc-900 bg-[#C7F303]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[72px] font-medium text-zinc-200">
              Integraciones
            </span>
          </button>

          {/* 3. Centro Destacado Elevado: Nuevo Chat (+ Plus) */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-4">
            <button
              type="button"
              onClick={() => handleNewChatSession(true)}
              aria-label="Nuevo Chat"
              className="relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 bg-gradient-to-tr from-teal-500 via-emerald-400 to-teal-300 text-white shadow-[0_4px_18px_rgba(20,184,166,0.45)] ring-4 ring-[#09090c] active:scale-90 group"
            >
              <Plus className="h-6 w-6 text-white stroke-[2.8] transition-transform duration-200 group-active:rotate-90" />
            </button>
            <span className="text-[10px] mt-0.5 font-semibold tracking-tight text-white">
              Nuevo Chat
            </span>
          </div>

          {/* 4. Mano Derecha: Somos SST & Documentos Generados (ShieldCheck exacto) */}
          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'files' ? 'none' : 'files'));
            }}
            aria-label="Somos SST y Documentos"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-90 ${
              drawer === 'files' ? 'text-teal-400 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center h-5 w-5">
              <ShieldCheck
                className={`h-5 w-5 transition-transform duration-150 ${
                  drawer === 'files' ? 'scale-110 text-teal-400' : ''
                }`}
              />
              {files.length > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-emerald-500 text-[9px] font-extrabold text-zinc-950 flex items-center justify-center">
                  {files.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px] font-medium">
              Somos SST
            </span>
          </button>

          {/* 5. Extremo Derecho: Agentes y Control Mac (RightPanelIcon exacto) */}
          <button
            type="button"
            onClick={() => {
              tenshiAudio.playBlip();
              setDrawer((prev) => (prev === 'agents' ? 'none' : 'agents'));
            }}
            aria-label="Agentes y Control Mac"
            className={`flex items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all active:scale-90 ${
              drawer === 'agents' ? 'bg-teal-500/10 text-teal-400' : 'hover:bg-white/5'
            }`}
          >
            <RightPanelIcon active={drawer === 'agents'} />
          </button>
        </nav>
      </div>
    </div>
  );
}
