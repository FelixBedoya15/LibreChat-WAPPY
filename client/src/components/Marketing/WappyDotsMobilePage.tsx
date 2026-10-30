import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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

type MobileTab = 'avatar' | 'chat' | 'files';
type TenshiMood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'love';

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

export default function WappyDotsMobilePage() {
  const [activeTab, setActiveTab] = useState<MobileTab>('avatar');
  const [mood, setMood] = useState<TenshiMood>('idle');
  const [statusPillText, setStatusPillText] = useState<string>('✨ Tenshi en línea · Lista para escucharte');
  const [speechText, setSpeechText] = useState<string>(
    '¡Hola! Soy Tenshi en tu celular. Toca el micrófono 🎙️ o escríbeme cualquier orden para tu Mac, Antigravity o documentos.',
  );
  const [heroInput, setHeroInput] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<SharedChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [tunnelInfo, setTunnelInfo] = useState<TunnelLinkState>({
    ok: false,
    active: false,
    publicUrl: null,
    lanUrl: 'http://127.0.0.1:3001',
    updatedAt: null,
  });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; left: number; top: number }>>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const prevMsgCountRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const petMovesRef = useRef<number>(0);
  const lastPetXRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = 'Tenshi Móvil · Wappy Dots | WAPPY IA';
  }, []);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        audioCtxRef.current = new Ctx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

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
  }, []);

  const playPopSound = useCallback(() => {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.065);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.075);
    } catch (_e) {
      // ignore
    }
  }, [ensureAudioCtx]);

  const emitParticles = useCallback((emojis = ['😻', '💚', '✨', '🐾']) => {
    const batch = emojis.map((emoji, idx) => ({
      id: Date.now() + idx + Math.random(),
      emoji,
      left: 30 + Math.random() * 40,
      top: 25 + Math.random() * 25,
    }));
    setParticles((prev) => [...prev, ...batch]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
    }, 1500);
  }, []);

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
      source.connect(ctx.destination);

      const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
      nextStartTimeRef.current = startAt + audioBuffer.duration;
      activeSourcesRef.current.add(source);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setMood('speaking');
      setStatusPillText('🔊 Tenshi hablando en vivo (24 kHz)...');

      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          setMood('idle');
          setStatusPillText('✨ Tenshi en línea · Lista para escucharte');
        }
      };

      source.start(startAt);
      return Math.max(400, (nextStartTimeRef.current - ctx.currentTime) * 1000 + 400);
    },
    [ensureAudioCtx],
  );

  const speakFallback = useCallback((text: string, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const clean = String(text || '')
      .replace(/[*#_`]/g, '')
      .slice(0, 280);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'es-CO';
    u.rate = 1.05;
    u.pitch = 1.12;
    u.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setMood('speaking');
      setStatusPillText('🔊 Tenshi hablando...');
    };
    u.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setMood('idle');
      setStatusPillText('✨ Tenshi en línea · Lista para escucharte');
      onDone?.();
    };
    u.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
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
    setStatusPillText('💤 Modo Live apagado · Toca 🎙️ cuando me necesites');
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

  // Petición inteligente al túnel de la Mac (directo HTTPS -> fallback Proxy en wappy.club)
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

      if (nextMsgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
        const latest = nextMsgs[nextMsgs.length - 1];
        if (latest && latest.role === 'assistant' && latest.source !== 'mobile') {
          emitParticles(['✨', '📄', '🚀']);
          setSpeechText(
            String(latest.content || '').slice(0, 200) +
              (String(latest.content || '').length > 200 ? '...' : ''),
          );
        }
      }
      prevMsgCountRef.current = nextMsgs.length;
      setMessages(nextMsgs);
      setFiles(nextFiles);
    } catch (_e) {
      // ignore
    }
  }, [callMacTunnel, emitParticles]);

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
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

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
      playPopSound();
      setMood('thinking');
      setStatusPillText(isFarewell ? '👋 Tenshi despidiéndose...' : '🧠 Tenshi procesando en tu Mac...');
      setSpeechText(`Procesando: "${text}"...`);

      setMessages((prev) => [...prev, { role: 'user', content: text, source: 'mobile' }]);

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
                content:
                  'Eres Tenshi, asistente universal en vivo de Wappy Dots en el celular del usuario, conectada en tiempo real con su Mac, Antigravity IDE, generador de documentos (PDF/Word/Excel/HTML/QR), Google Flow, NotebookLM, Google Workspace y tareas. Responde de forma cálida, ágil y natural. Si el usuario se despide ("hasta luego", "gracias por todo", "chao", "nos vemos"), pronuncia primero una despedida corta y cálida e invoca wappy_controlar_videollamada(accion: "colgar_llamada"). NUNCA cuelgues si solo dice "para", "detente" o "espera".',
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
          String(rawReply).replace(/HANGUP_CALL:?/gi, '').trim() ||
          '¡Hasta luego! Fue un gusto ayudarte hoy.';

        setSpeechText(cleanReply.slice(0, 220) + (cleanReply.length > 220 ? '...' : ''));
        setMood('happy');
        setStatusPillText(shouldHangUp ? '👋 ¡Hasta pronto!' : '😸 ¡Respuesta lista!');
        emitParticles(['✨', '💚', '🐾']);

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
        setMood('idle');
        setStatusPillText('⚠️ Reintentando conexión con tu Mac...');
        setSpeechText('No pude contactar el túnel de tu Mac en este instante. Verifica que Wappy Dots esté abierto.');
      }

      await refreshSharedState();
    },
    [
      callMacTunnel,
      emitParticles,
      flushAudioQueue,
      playPopSound,
      playWavBase64,
      refreshSharedState,
      speakFallback,
      stopVoiceMode,
    ],
  );

  const toggleVoiceRecording = useCallback(() => {
    ensureAudioCtx();
    if (isSpeakingRef.current) {
      flushAudioQueue();
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador móvil no soporta dictado directo. Escribe tu mensaje en la barra inferior.');
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
      playPopSound();
    };

    r.onresult = (ev: any) => {
      const transcript = Array.from(ev.results || [])
        .map((res: any) => res[0]?.transcript || '')
        .join('');
      if (transcript.trim().length > 1 && isSpeakingRef.current) {
        flushAudioQueue();
      }
      setSpeechText(transcript || 'Escuchando...');
      setHeroInput(transcript);
      setChatInput(transcript);
    };

    r.onend = () => {
      setIsListening(false);
      setHeroInput((current) => {
        const trimmed = current?.trim() || '';
        if (trimmed) {
          setTimeout(() => executePrompt(trimmed), 20);
        } else {
          setMood('idle');
          setStatusPillText('✨ Tenshi en línea · Lista para escucharte');
        }
        return '';
      });
      setChatInput('');
    };

    r.onerror = () => {
      setIsListening(false);
      setMood('idle');
      setStatusPillText('✨ Tenshi en línea · Lista para escucharte');
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (_e) {
      // ignore
    }
  }, [ensureAudioCtx, executePrompt, flushAudioQueue, isListening, playPopSound]);

  const handleTouchMoveAvatar = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (t.clientX - cx) / (rect.width * 0.5)));
    const dy = Math.max(-1, Math.min(1, (t.clientY - cy) / (rect.height * 0.5)));
    setTilt({ rx: -dy * 14, ry: dx * 16 });

    if (lastPetXRef.current !== null) {
      if (Math.abs(t.clientX - lastPetXRef.current) > 18) {
        petMovesRef.current += 1;
        lastPetXRef.current = t.clientX;
        if (petMovesRef.current >= 3) {
          petMovesRef.current = 0;
          setMood('love');
          setStatusPillText('😻 ¡Tenshi ronronea feliz!');
          emitParticles(['😻', '😽', '💚', '🐾']);
        }
      }
    } else {
      lastPetXRef.current = t.clientX;
    }
  };

  const handleTouchEndAvatar = () => {
    setTilt({ rx: 0, ry: 0 });
    lastPetXRef.current = null;
  };

  const getSourceBadge = (m: SharedChatMessage) => {
    if (m.source === 'antigravity') return '🤖 Antigravity IDE · Actividad & Tarea';
    if (m.source === 'notch-voice') return m.role === 'user' ? '🎙️ Notch de Mac (Voz)' : '🔊 Tenshi Voz 24kHz';
    if (m.source === 'mobile') return '📱 Enviado desde Celular';
    return m.role === 'user' ? '💬 Instrucción a Tenshi' : '✨ Tenshi';
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#060d18] text-slate-100 select-none">
      {/* Header Superior Compacto */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0a1526]/90 px-3.5 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#c7f303] shadow-[0_0_10px_#c7f303]" />
          <div>
            <div className="text-xs font-extrabold tracking-wide text-white">
              WAPPY DOTS <span className="text-[#c7f303]">MÓVIL</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {tunnelInfo.publicUrl
                ? '🟢 Conectado en vivo con tu Mac'
                : '🟡 Sincronizando túnel de tu Mac...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSpeaking && (
            <button
              type="button"
              onClick={flushAudioQueue}
              className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-200 active:scale-95"
            >
              ⏹️ Silenciar
            </button>
          )}
          <Link
            to="/wappy-dots"
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
          >
            💻 App Mac
          </Link>
        </div>
      </header>

      {/* Tabs de Navegación */}
      <div className="grid grid-cols-3 gap-1.5 border-b border-white/10 bg-[#091220] px-3 py-2">
        <button
          type="button"
          onClick={() => setActiveTab('avatar')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            activeTab === 'avatar'
              ? 'border border-[#c7f303]/40 bg-[#c7f303]/15 text-[#c7f303]'
              : 'bg-white/5 text-slate-400'
          }`}
        >
          😺 Tenshi Live
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            activeTab === 'chat'
              ? 'border border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
              : 'bg-white/5 text-slate-400'
          }`}
        >
          💬 Chat ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            activeTab === 'files'
              ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
              : 'bg-white/5 text-slate-400'
          }`}
        >
          📑 Docs ({files.length})
        </button>
      </div>

      {/* VISTA 1: AVATAR 3D INTERACTIVO + VOZ EN VIVO */}
      {activeTab === 'avatar' && (
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-3">
          {/* Píldora de estado superior (top-20 separación espacial) */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-200">
              <span>{statusPillText}</span>
            </div>
            <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs leading-relaxed text-slate-200 backdrop-blur-md">
              {speechText}
            </div>
          </div>

          {/* Escenario Central 3D de Tenshi */}
          <div
            className="relative my-2 flex flex-1 items-center justify-center"
            onTouchMove={handleTouchMoveAvatar}
            onTouchEnd={handleTouchEndAvatar}
            onClick={() => {
              playPopSound();
              setMood('love');
              setStatusPillText('😻 ¡Acariciaste a Tenshi!');
              emitParticles(['😻', '💚', '✨']);
            }}
          >
            <div
              className={` pointer-events-none absolute h-56 w-56 rounded-full blur-3xl transition-all duration-500 ${
                mood === 'listening'
                  ? 'bg-rose-500/25 scale-110'
                  : mood === 'speaking'
                  ? 'bg-[#c7f303]/25 scale-110'
                  : 'bg-teal-500/20'
              }`}
            />
            {particles.map((p) => (
              <span
                key={p.id}
                className="pointer-events-none absolute animate-bounce text-xl"
                style={{ left: `${p.left}%`, top: `${p.top}%` }}
              >
                {p.emoji}
              </span>
            ))}
            <div
              style={{
                transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: tilt.rx === 0 && tilt.ry === 0 ? 'transform 0.35s ease' : 'none',
              }}
              className="relative flex flex-col items-center"
            >
              <img
                src="/assets/tenshi.png"
                alt="Tenshi 3D"
                className={`h-52 w-auto object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.65)] transition-transform duration-300 ${
                  mood === 'speaking' ? 'scale-105' : mood === 'listening' ? 'scale-102' : ''
                }`}
              />
            </div>
          </div>

          {/* Controles Inferiores (bottom-5 separación espacial) */}
          <div className="flex flex-col gap-2.5 pb-1">
            {/* Píldoras de acción rápida */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => executePrompt('Consulta el estado de Antigravity, proyectos activos y chats recientes')}
                className="shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 active:scale-95"
              >
                🚀 Estado Antigravity
              </button>
              <button
                type="button"
                onClick={() =>
                  executePrompt('Genera un informe ejecutivo en PDF con el resumen de mis proyectos y pásalo a mi celular')
                }
                className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 active:scale-95"
              >
                📄 Crear PDF
              </button>
              <button
                type="button"
                onClick={() => executePrompt('Genera un código QR para https://wappy.club/wappydots')}
                className="shrink-0 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200 active:scale-95"
              >
                📱 Crear QR
              </button>
              <button
                type="button"
                onClick={() => executePrompt('Lista mis tareas y automatizaciones activas')}
                className="shrink-0 rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-semibold text-purple-200 active:scale-95"
              >
                ⚙️ Mis Tareas
              </button>
            </div>

            {/* Botón Micrófono Principal + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-lg transition active:scale-95 ${
                  isListening
                    ? 'animate-pulse border-2 border-rose-300 bg-rose-600 text-white'
                    : 'border border-[#c7f303]/50 bg-[#c7f303] text-[#0e1300]'
                }`}
                title="Hablar con Tenshi"
              >
                {isListening ? '🔴' : '🎙️'}
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!heroInput.trim()) return;
                  const val = heroInput;
                  setHeroInput('');
                  executePrompt(val);
                }}
                className="flex flex-1 items-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-1.5"
              >
                <input
                  type="text"
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  placeholder="Habla o escribe cualquier orden..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#c7f303] px-3 py-1.5 text-xs font-extrabold text-[#0e1300] active:scale-95"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: CHAT UNIVERSAL SINCRONIZADO */}
      {activeTab === 'chat' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
            {messages.length === 0 ? (
              <div className="mt-12 text-center text-xs text-slate-400">
                Habla con Tenshi o escribe aquí abajo. Todo se sincroniza en vivo con la isla de tu Mac.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className={`rounded-2xl border p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-8 border-teal-500/30 bg-teal-500/15 text-slate-100'
                      : 'mr-4 border-white/10 bg-white/[0.05] text-slate-200'
                  }`}
                >
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#c7f303]">
                    {getSourceBadge(m)}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {Array.isArray(m.files) && m.files.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.files.map((f) => (
                        <a
                          key={f.id || f.fileName}
                          href={resolveFileHref(f.fileName)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-[#c7f303]/30 bg-[#c7f303]/10 px-3 py-2 text-xs font-bold text-[#c7f303]"
                        >
                          <span>📲 Abrir: {f.title || f.fileName}</span>
                          <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase">
                            {f.format}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              const val = chatInput;
              setChatInput('');
              executePrompt(val);
            }}
            className="flex items-center gap-2 border-t border-white/10 bg-[#091220] p-3"
          >
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                isListening ? 'bg-rose-600 text-white' : 'bg-white/10 text-white'
              }`}
            >
              {isListening ? '🔴' : '🎙️'}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe un mensaje para Tenshi..."
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c7f303] px-3.5 py-2 text-xs font-extrabold text-[#0e1300]"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* VISTA 3: DOCUMENTOS GENERADOS */}
      {activeTab === 'files' && (
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {files.length === 0 ? (
            <div className="mt-12 text-center text-xs text-slate-400">
              Aún no hay documentos generados. Pídele a Tenshi un PDF, Word, Excel, HTML o código QR.
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
                  className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.05] p-3.5 transition hover:border-[#c7f303]/40"
                >
                  <div>
                    <div className="text-xs font-bold text-white">📄 {f.title || f.fileName}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {f.fileName} · {sizeKb} KB
                    </div>
                  </div>
                  <span className="rounded-lg border border-[#c7f303]/40 bg-[#c7f303]/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#c7f303]">
                    {f.format || 'DOC'}
                  </span>
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
