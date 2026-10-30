import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  X,
  ArrowUp,
  Sparkles,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  Volume1,
  Square,
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
}

interface SharedChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  createdAt?: string;
  files?: SharedFileItem[];
}

interface TunnelLinkState {
  ok: boolean;
  active: boolean;
  publicUrl: string | null;
  lanUrl: string;
  updatedAt: string | null;
  directMobileUrl?: string;
}

type ActiveDrawer = 'none' | 'chat' | 'files';
type PersonalityMode = 'express' | 'asistente' | 'profundo';

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

export default function WappyDotsMobilePage() {
  const [drawer, setDrawer] = useState<ActiveDrawer>('none');
  const [personality, setPersonality] = useState<PersonalityMode>('asistente');
  const [mood, setMood] = useState<TenshiAvatarMood>('idle');
  const [statusPillText, setStatusPillText] = useState<string>('✨ Lista para escucharte · 24 kHz');
  const [speechText, setSpeechText] = useState<string>(
    '¡Hola! Soy Tenshi en Wappy Dots. Tócame o pulsa el micrófono para hablar en vivo con tu Mac, Antigravity IDE y tus aplicaciones.',
  );
  const [promptInput, setPromptInput] = useState<string>('');
  const [messages, setMessages] = useState<SharedChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outputAmplitude, setOutputAmplitude] = useState<number>(0);
  const [isSFXMuted, setIsSFXMuted] = useState<boolean>(() => tenshiAudio.getMuted());
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  useEffect(() => {
    document.title = 'Tenshi · Wappy Dots | WAPPY IA';
  }, []);

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
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
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
      setStatusPillText('🔊 Hablando en vivo · 24 kHz');
      startAmplitudeLoop();

      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          stopAmplitudeLoop();
          setMood('idle');
          setStatusPillText('✨ Lista para escucharte · 24 kHz');
        }
      };

      source.start(startAt);
      return Math.max(400, (nextStartTimeRef.current - ctx.currentTime) * 1000 + 400);
    },
    [ensureAudioCtx, startAmplitudeLoop, stopAmplitudeLoop],
  );

  const speakFallback = useCallback(
    (text: string, onDone?: () => void) => {
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
        setStatusPillText('🔊 Tenshi hablando...');
      };
      u.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setOutputAmplitude(0);
        setMood('idle');
        setStatusPillText('✨ Lista para escucharte · 24 kHz');
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
    },
    [],
  );

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
    setStatusPillText('💤 Modo Live en espera · Toca 🎙️ para hablar');
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

  const refreshSharedState = useCallback(async () => {
    try {
      const res = await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat');
      if (!res.ok) return;
      const data = await res.json();
      const nextMsgs: SharedChatMessage[] = Array.isArray(data?.messages) ? data.messages : [];
      const nextFiles: SharedFileItem[] = Array.isArray(data?.files) ? data.files : [];

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
    } catch (_e) {
      // ignore
    }
  }, [callMacTunnel]);

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

  const executePrompt = useCallback(
    async (rawPrompt: string) => {
      const text = rawPrompt?.trim() || '';
      if (!text) return;

      if (isPauseOnlyCommand(text)) {
        flushAudioQueue();
        setSpeechText('⏸️ Locución pausada · Sigo activa escuchándote en vivo.');
        setMood('listening');
        setStatusPillText('⏸️ Pausada · Sigo en línea');
        return;
      }

      const isFarewell = isNaturalFarewellCommand(text);
      flushAudioQueue();
      tenshiAudio.playBlip();
      analyzeTenshiEmotionFromText(text, 'user');
      setIsProcessing(true);
      setMood('thinking');
      setStatusPillText(
        isFarewell ? '👋 Despidiéndose...' : '🧠 Procesando orden con tu Mac & Antigravity...',
      );
      setSpeechText(`«${text}»`);

      setMessages((prev) => [...prev, { role: 'user', content: text, source: 'mobile' }]);

      const styleInstruction =
        personality === 'express'
          ? 'MODO EXPRESS: Responde de forma ultra concisa (1 a 2 frases directas al grano).'
          : personality === 'profundo'
          ? 'MODO PROFUNDO: Analiza a fondo y estructura la solución paso a paso.'
          : 'MODO ASISTENTE UNIVERSAL: Sé cálida, ejecutiva, clara y resolutiva.';

      try {
        const res = await callMacTunnel('/api/gemini-tunnel/v1/audio/live-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer wappy-tunnel',
          },
          body: JSON.stringify({
            model: 'gemini-3.8-live',
            voice: 'Aoede',
            messages: [
              {
                role: 'system',
                content: `Eres Tenshi, asistente universal en vivo de Wappy Dots, conectada en tiempo real con la Mac del usuario, Antigravity IDE, generador de documentos (PDF/Word/Excel/HTML/QR), Google Flow, NotebookLM, Google Workspace y automatizaciones. ${styleInstruction} Si el usuario se despide ("hasta luego", "gracias por todo", "chao", "nos vemos"), pronuncia primero una despedida corta y cálida e invoca wappy_controlar_videollamada(accion: "colgar_llamada"). NUNCA cuelgues si solo dice "para", "detente" o "espera".`,
              },
              { role: 'user', content: text },
            ],
          }),
        });

        const replyData = await res.json();
        const rawReply =
          replyData?.text ||
          replyData?.choices?.[0]?.message?.content ||
          (isFarewell ? '¡Hasta luego! Fue un gusto ayudarte hoy.' : '¡Instrucción completada!');
        const shouldHangUp =
          isFarewell || Boolean(replyData?.should_hang_up) || String(rawReply).includes('HANGUP_CALL');
        const cleanReply =
          cleanDisplayMarkdown(String(rawReply).replace(/HANGUP_CALL:?/gi, '')) ||
          '¡Hasta luego! Fue un gusto ayudarte hoy.';

        setIsProcessing(false);
        setSpeechText(cleanReply.slice(0, 260) + (cleanReply.length > 260 ? '...' : ''));
        analyzeTenshiEmotionFromText(cleanReply, 'assistant');
        triggerTenshiReaction('success', 2600, ['✨', '💚', '🐾']);

        if (replyData?.audio_wav_base64) {
          const waitMs = await playWavBase64(replyData.audio_wav_base64);
          if (shouldHangUp) {
            setTimeout(() => stopVoiceMode(), waitMs);
          }
        } else {
          speakFallback(cleanReply, () => {
            if (shouldHangUp) {
              setTimeout(() => stopVoiceMode(), 400);
            }
          });
        }
      } catch (_e) {
        setIsProcessing(false);
        setMood('idle');
        setStatusPillText('⚠️ Reintentando conexión con tu Mac...');
        setSpeechText(
          'No pude contactar el túnel de tu Mac en este instante. Verifica que Wappy Dots esté abierto.',
        );
      }

      await refreshSharedState();
    },
    [
      callMacTunnel,
      flushAudioQueue,
      personality,
      playWavBase64,
      refreshSharedState,
      speakFallback,
      stopVoiceMode,
    ],
  );

  const toggleVoiceRecording = useCallback(() => {
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
      setStatusPillText('🎙️ Escuchando tu voz en vivo...');
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
          setTimeout(() => executePrompt(trimmed), 20);
        } else {
          setMood('idle');
          setStatusPillText('✨ Lista para escucharte · 24 kHz');
        }
        return '';
      });
    };

    r.onerror = () => {
      setIsListening(false);
      setMood('idle');
      setStatusPillText('✨ Lista para escucharte · 24 kHz');
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (_e) {
      // ignore
    }
  }, [ensureAudioCtx, executePrompt, flushAudioQueue, isListening, isMicMuted]);

  const handleToggleMicMute = () => {
    tenshiAudio.playBlip();
    if (!isMicMuted && isListening) {
      stopVoiceMode();
    }
    setIsMicMuted((prev) => !prev);
  };

  const handleToggleSFX = () => {
    const nextMuted = tenshiAudio.toggleMuted();
    setIsSFXMuted(nextMuted);
    if (!nextMuted) {
      tenshiAudio.playBlip();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard?.writeText(cleanDisplayMarkdown(text)).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearChat = async () => {
    tenshiAudio.playBlip();
    try {
      await callMacTunnel('/api/gemini-tunnel/antigravity/shared-chat/clear', { method: 'POST' });
      setMessages([]);
    } catch (_e) {
      setMessages([]);
    }
  };

  const getSourceBadge = (m: SharedChatMessage) => {
    if (m.source === 'antigravity') return '🚀 Antigravity IDE';
    if (m.source === 'notch-voice')
      return m.role === 'user' ? '🎙️ Isla Notch (Voz)' : '🔊 Tenshi Voz 24kHz';
    if (m.source === 'mobile') return '📱 Wappy Dots Móvil';
    return m.role === 'user' ? '💬 Tú' : '✨ Tenshi';
  };

  return (
    <div className="wappydots-mobile-shell relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#09090c] text-[#f5f6f8] select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');

        .wappydots-mobile-shell {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background:
            radial-gradient(ellipse 95% 42% at 50% -6%, rgba(217, 119, 6, 0.24) 0%, rgba(120, 53, 15, 0.12) 42%, transparent 75%),
            radial-gradient(circle at 50% 48%, rgba(99, 102, 241, 0.16) 0%, rgba(16, 185, 129, 0.08) 38%, transparent 70%),
            linear-gradient(180deg, #0b0b0f 0%, #09090c 55%, #070709 100%);
        }

        .wappydots-font-display {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        .wappydots-stage-grid {
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 75% 65% at 50% 50%, black 25%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 50%, black 25%, transparent 80%);
        }

        .wappydots-stardust {
          background-image:
            radial-gradient(1.5px 1.5px at 18% 22%, rgba(251, 191, 36, 0.75) 50%, transparent 100%),
            radial-gradient(1px 1px at 76% 16%, rgba(245, 158, 11, 0.65) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 62% 34%, rgba(199, 243, 3, 0.55) 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 68%, rgba(168, 85, 247, 0.6) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 84% 62%, rgba(251, 191, 36, 0.55) 50%, transparent 100%);
        }

        @keyframes wappydotsWave {
          0%, 100% { transform: scaleY(0.32); }
          50% { transform: scaleY(1); }
        }

        .wappydots-eq-bar {
          width: 3.5px;
          border-radius: 999px;
          background: linear-gradient(180deg, #c7f303 0%, #f59e0b 100%);
          animation: wappydotsWave 0.95s ease-in-out infinite;
        }
      `}</style>

      {/* Polvo estelar Ámbar/Dorado de Wappy Dots + Retícula de Escenario */}
      <div className="wappydots-stardust pointer-events-none absolute inset-0 opacity-80" />
      <div className="wappydots-stage-grid pointer-events-none absolute inset-0" />

      {/* ===================================================================== */}
      {/* 1. CABECERA ISLA NOTCH DE WAPPY DOTS (Dynamic Island Hardware Header)  */}
      {/* ===================================================================== */}
      <header
        className="relative z-30 flex items-center justify-between gap-2 px-3.5 sm:px-6 pb-2.5 pt-2.5 border-b border-white/[0.07] bg-[#0c0d12]/80 backdrop-blur-2xl"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
      >
        {/* Identidad Izquierda: Mini Tenshi + Wappy Dots */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/15 to-emerald-500/20 border border-amber-400/30 shadow-inner">
            <TenshiAvatar
              size={34}
              mood={mood}
              isSpeaking={isSpeaking}
              outputAmplitude={outputAmplitude}
              isVoiceActive={isListening}
              interactive={false}
              showHaloEffect={false}
              showHUD={true}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0c0d12] ${
                tunnelInfo.publicUrl ? 'bg-[#c7f303]' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="wappydots-font-display text-xs sm:text-sm font-black tracking-tight text-white">
                Wappy <span className="text-amber-400">Dots</span>
              </span>
              <span className="rounded-md border border-purple-400/35 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-200">
                Isla Móvil
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#8e939c] truncate">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  tunnelInfo.publicUrl
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="truncate">
                {tunnelInfo.publicUrl
                  ? 'Conectado en vivo con tu Mac · 24 kHz'
                  : 'Sincronizando túnel con tu Mac...'}
              </span>
            </div>
          </div>
        </div>

        {/* Cápsula Central Hardware Notch (Visible en Pantallas Medianas/Grandes) */}
        <div className="hidden md:inline-flex items-center gap-2.5 rounded-full bg-[#050608] border border-white/15 px-4 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.75),0_0_20px_rgba(245,158,11,0.12)]">
          <span className="h-2 w-2 rounded-full bg-[#c7f303] shadow-[0_0_8px_#c7f303]" />
          <span className="text-[11px] font-extrabold tracking-wide text-slate-100">
            «Oye Tenshi» · Hermes Core · Antigravity
          </span>
          <div className="flex items-center gap-0.5 h-3">
            <span className="wappydots-eq-bar h-2.5" style={{ animationDelay: '0s' }} />
            <span className="wappydots-eq-bar h-3.5" style={{ animationDelay: '0.15s' }} />
            <span className="wappydots-eq-bar h-2" style={{ animationDelay: '0.3s' }} />
            <span className="wappydots-eq-bar h-3.5" style={{ animationDelay: '0.45s' }} />
          </div>
        </div>

        {/* Controles Derecha */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleSFX}
            title={isSFXMuted ? 'Activar sonidos de Tenshi' : 'Silenciar sonidos de Tenshi'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 active:scale-95 transition"
          >
            {isSFXMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>

          <Link
            to="/wappy-dots"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20 transition active:scale-95"
          >
            <Laptop className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">App Escritorio</span>
            <span className="sm:hidden">Mac</span>
          </Link>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. ESCENARIO HEROICO DE TENSHI (Con Aureola 3D, HUD y Colores Dots)    */}
      {/* ===================================================================== */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-between overflow-hidden px-3 sm:px-4 py-1.5 sm:py-2.5">
        {/* Fila Superior de Insignias estilo Portal Wappy Dots */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/15 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-200 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c7f303] shadow-[0_0_8px_#c7f303]" />
            <span>ISLA NOTCH · VOZ 24KHZ</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-0.5 text-[10px] font-extrabold text-amber-200 shadow-sm">
            <span>😇 Tenshi + Antigravity + +24 Agentes</span>
          </div>
        </div>

        {/* Escenario Central con el Tenshi Real de Wappy (Aureola + Visor HUD + Física 3D) */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Resplandor Radial Doble (Ámbar Wappy Dots + Índigo/Esmeralda) detrás de Tenshi */}
          <div
            className={`pointer-events-none absolute h-52 w-52 sm:h-60 sm:w-60 rounded-full blur-3xl transition-all duration-500 ${
              isListening
                ? 'bg-rose-500/25 scale-110'
                : isSpeaking
                ? 'bg-amber-500/25 scale-110'
                : 'bg-gradient-to-tr from-purple-600/20 via-amber-500/15 to-emerald-500/20'
            }`}
          />

          <div
            onClick={() => {
              tenshiAudio.playBlip();
              toggleVoiceRecording();
            }}
            className="relative z-20 mt-2 cursor-pointer transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            title="Tócame para hablar o acaríciame"
          >
            <TenshiAvatar
              size={195}
              mood={mood}
              isSpeaking={isSpeaking}
              outputAmplitude={outputAmplitude}
              isVoiceActive={isListening}
              isTyping={isProcessing}
              statusText={statusPillText}
              interactive={true}
              showHaloEffect={true}
              showHUD={true}
            />
          </div>

          {/* Pedestal de Luz Elíptica bajo los pies de Tenshi (Idéntico a Wappy Portal) */}
          <div
            className="pointer-events-none -mt-2 h-4 w-40 rounded-full blur-md"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(199, 243, 3, 0.45) 0%, rgba(245, 158, 11, 0.25) 45%, rgba(16, 185, 129, 0) 75%)',
            }}
          />

          {/* Saludo + Burbuja Glassmorphism de Voz en Vivo */}
          <div className="mt-3 flex max-w-lg flex-col items-center text-center px-2">
            <h1 className="wappydots-font-display text-base sm:text-lg font-black tracking-tight text-white">
              ¡Hola, <span className="text-amber-400">Félix</span>!
            </h1>

            <div className="mt-1.5 relative flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#13141a]/90 px-3.5 py-2 text-xs leading-snug text-slate-200 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <span className="line-clamp-2 text-left">{speechText}</span>
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={flushAudioQueue}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/20"
                >
                  <Square className="h-2.5 w-2.5 fill-current" />
                  <span>Parar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => speakFallback(speechText)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
                >
                  <Volume1 className="h-3 w-3" />
                  <span>Oír</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. DOCK CÁPSULA DE TENSHI + BARRA DE CHAT ESTILO NOTCH WAPPY DOTS */}
        {/* ================================================================= */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-2 pb-0.5">
          {/* 🌟 Botonera Cápsula de Tenshi (Idéntica a TenshiChat.tsx + Wappy Dots) */}
          <div className="inline-flex items-center gap-2 sm:gap-3 rounded-2xl bg-[#121318]/95 px-3 py-1.5 backdrop-blur-xl border border-amber-500/30 shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
            {/* Botón Abrir Chat */}
            <button
              type="button"
              onClick={() => {
                tenshiAudio.playBlip();
                setDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'));
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 border ${
                drawer === 'chat'
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                  : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <span>Chat ({messages.length})</span>
            </button>

            {/* Botón Central Micrófono Live */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                isListening
                  ? 'animate-pulse border border-rose-400 bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                  : 'border border-[#c7f303]/60 bg-[#c7f303] text-[#0e1300] shadow-[0_0_20px_rgba(199,243,3,0.3)] hover:bg-[#d4ff1f]'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>{isListening ? 'Escuchando...' : 'Hablar Live'}</span>
            </button>

            {/* Botón Silenciar Micrófono (Mute) */}
            <button
              type="button"
              onClick={handleToggleMicMute}
              title={isMicMuted ? 'Reactivar micrófono' : 'Silenciar micrófono'}
              className={`rounded-xl p-2 transition-all active:scale-95 border ${
                isMicMuted
                  ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                  : 'border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MicOff className="h-4 w-4" />
            </button>

            {/* Botón Documentos Generados */}
            <button
              type="button"
              onClick={() => {
                tenshiAudio.playBlip();
                setDrawer((prev) => (prev === 'files' ? 'none' : 'files'));
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 border ${
                drawer === 'files'
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Docs ({files.length})</span>
            </button>
          </div>

          {/* Píldoras de Acción Rápida (WAPPY 14-Group Semantic Colors) */}
          <div className="flex w-full items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() =>
                executePrompt('Consulta el estado de Antigravity, proyectos activos y chats recientes')
              }
              className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/20 transition-all sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95"
            >
              🚀 Estado Antigravity
            </button>
            <button
              type="button"
              onClick={() =>
                executePrompt(
                  'Genera un informe ejecutivo en PDF con el resumen de mis proyectos y pásalo a mi celular',
                )
              }
              className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20 transition-all sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95"
            >
              📄 Crear PDF
            </button>
            <button
              type="button"
              onClick={() => executePrompt('Genera un código QR para https://wappy.club/wappydots')}
              className="shrink-0 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-[11px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/20 transition-all sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95"
            >
              📱 Crear QR
            </button>
            <button
              type="button"
              onClick={() => executePrompt('Lista mis tareas y automatizaciones activas')}
              className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20 transition-all sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95"
            >
              ⚙️ Mis Tareas
            </button>
            <button
              type="button"
              onClick={() =>
                executePrompt('¿Qué hay en la pantalla activa de mi Mac en este momento?')
              }
              className="shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-bold text-purple-200 hover:bg-purple-500/20 transition-all sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95"
            >
              👁️ Leer Pantalla Mac
            </button>
          </div>

          {/* Barra de Entrada idéntica al Chat del Notch de Wappy Dots */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!promptInput.trim()) return;
              const val = promptInput;
              setPromptInput('');
              executePrompt(val);
            }}
            className="w-full rounded-2xl border border-white/15 bg-[#14151c]/95 p-2 shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(99,102,241,0.12)] backdrop-blur-2xl"
          >
            {/* Sub-barra superior estilo Notch: Chip Antigravity + Personalidad + Modelo */}
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>Antigravity · Mac</span>
                </span>

                <div className="hidden sm:flex items-center gap-1">
                  {(
                    [
                      { id: 'express', label: '⚡ Express' },
                      { id: 'asistente', label: '✨ Asistente' },
                      { id: 'profundo', label: '🔬 Profundo' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPersonality(m.id)}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                        personality === m.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>gemini-3.8-live · 24kHz</span>
              </span>
            </div>

            {/* Campo de texto + Mic + Botón Circular de Envío */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 border border-white/[0.07]">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Pregúntame algo o envía una orden a tu Mac..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-[#8e939c] focus:outline-none"
              />
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Dictar por voz"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f6f8] text-[#0e0f11] hover:bg-[#c7f303] transition active:scale-90 shadow-md"
                title="Enviar"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 4. PANEL DESPLEGABLE DE CHAT UNIVERSAL (Idéntico a TenshiChat.tsx)    */}
      {/* ===================================================================== */}
      {drawer === 'chat' && (
        <div className="absolute inset-x-0 bottom-0 top-14 z-40 flex flex-col rounded-t-3xl border-t border-amber-500/30 bg-[#0d0e14]/95 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom duration-200">
          {/* Cabecera del Chat */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#12141c]/90 px-4 py-3 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <span className="wappydots-font-display text-sm font-extrabold text-white">
                Chat Universal · Wappy Dots
              </span>
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Sincronizado con Mac
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearChat}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nueva</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selector de Modo Universal */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] bg-[#0f1017] px-4 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Modo:
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'express', label: '⚡ Express' },
                  { id: 'asistente', label: '✨ Asistente' },
                  { id: 'profundo', label: '🔬 Profundo' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPersonality(m.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition border ${
                    personality === m.id
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="mt-12 text-center text-xs text-slate-400">
                Aún no hay mensajes. Escribe o habla con Tenshi para sincronizar con tu Mac.
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
                        ? 'ml-8 border-indigo-500/35 bg-indigo-500/15 text-slate-100'
                        : 'mr-4 border-white/10 bg-[#151720] text-slate-200'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                        {getSourceBadge(m)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => speakFallback(cleaned)}
                          className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                          title="Escuchar mensaje"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(cleaned, msgKey)}
                          className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
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
                            className="flex items-center justify-between rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                          >
                            <span className="truncate">📲 Abrir: {f.title || f.fileName}</span>
                            <span className="ml-2 shrink-0 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase text-[#c7f303]">
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

          {/* Barra de envío dentro del Chat */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!promptInput.trim()) return;
              const val = promptInput;
              setPromptInput('');
              executePrompt(val);
            }}
            className="flex items-center gap-2 border-t border-white/10 bg-[#12141c] p-3"
          >
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isListening ? 'bg-rose-600 text-white' : 'bg-white/10 text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Escribe un mensaje para Tenshi..."
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c7f303] px-4 py-2.5 text-xs font-extrabold text-[#0e1300]"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. CAJÓN DESPLEGABLE DE DOCUMENTOS GENERADOS (PDF/DOCX/XLSX/QR)       */}
      {/* ===================================================================== */}
      {drawer === 'files' && (
        <div className="absolute inset-x-0 bottom-0 top-14 z-40 flex flex-col rounded-t-3xl border-t border-emerald-500/30 bg-[#0d0e14]/95 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#12141c]/90 px-4 py-3 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="wappydots-font-display text-sm font-extrabold text-white">
                Documentos & Códigos QR ({files.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {files.length === 0 ? (
              <div className="mt-12 text-center text-xs text-slate-400">
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
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#151720] p-3.5 transition hover:border-amber-400/40"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-xs sm:text-sm font-bold text-white">
                        📄 {f.title || f.fileName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {f.fileName} · {sizeKb} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-300">
                        {f.format || 'DOC'}
                      </span>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
