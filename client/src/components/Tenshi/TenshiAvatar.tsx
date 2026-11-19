import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '~/utils';
import { tenshiAudio } from './tenshiAudio';
import { getAvatarPresetById } from './tenshiAvatarCatalog';

export type TenshiAvatarMood =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'searching'
  | 'working'
  | 'speaking'
  | 'question'
  | 'approval'
  | 'success'
  | 'love'
  | 'annoyed'
  | 'dizzy'
  | 'sleeping';

export interface TenshiAvatarProps {
  size?: number; // en píxeles (ej. 315, 180, 140, 92, 56, 32)
  avatarId?: string;
  mood?: TenshiAvatarMood;
  isSpeaking?: boolean;
  outputAmplitude?: number; // 0..1
  isVoiceActive?: boolean;
  isTyping?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  onFileDrop?: (files: FileList) => void;
  showHaloEffect?: boolean;
  showHUD?: boolean;
  statusText?: string; // Texto de estado opcional estilo píldora Coucou
  statusPlacement?: 'bottom' | 'below-dock' | 'above-dock';
  smoothSizeTransition?: boolean; // Transición fluida de tamaño al alternar modo protagonista <-> split chat en PC
}

interface Particle {
  id: number;
  kind: 'spark' | 'heart' | 'z' | 'sweat' | 'cat';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  label?: string;
  delayMs?: number;
}

/**
 * Helper global para disparar reacciones espontáneas y ráfagas de emoticones gatunos en Tenshi
 */
export function triggerTenshiReaction(
  mood: TenshiAvatarMood,
  durationMs = 2600,
  emojis?: string[]
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tenshi-react', {
        detail: { mood, durationMs, emojis },
      })
    );
  }
}

/**
 * Detector de estado de ánimo en vivo (Texto + Voz) que lanza los emoticones de caritas de gato de Tenshi
 */
export function analyzeTenshiEmotionFromText(
  text: string,
  role: 'user' | 'assistant' = 'user'
) {
  if (!text || typeof text !== 'string') return;
  const clean = text.trim();
  if (!clean) return;

  // 1. 😹 Risa / Humor
  if (/\b(jaja\w*|jeje\w*|jiji\w*|chist\w*|qué risa|que risa|gracios\w*|divertid\w*)\b/i.test(clean) || /[😂🤣😹]/.test(clean)) {
    triggerTenshiReaction('love', 2800, ['😹', '😸', '😺', '🐾', '✨']);
    return;
  }

  // 2. 😻 Agradecimiento / Cariño
  if (
    /\b(gracias|muchas gracias|agradezc\w*|excelente|genial|súper|super|me encanta|te quiero|eres el mejor|brutal|maravillos\w*|increíble|increible)\b/i.test(
      clean
    ) ||
    /[❤️🥰😻😽💚]/.test(clean)
  ) {
    triggerTenshiReaction('love', 2800, ['😻', '😽', '💚', '🐾', '✨']);
    return;
  }

  // 3. 😼 Motivación / Actitud / Logro
  if (
    /\b(vamos con toda|listo|perfecto|logrado|aprobado|completado|éxito|exito|cumplimos|al 100|ganamos)\b/i.test(
      clean
    ) ||
    /[🔥🚀🏆😼]/.test(clean)
  ) {
    triggerTenshiReaction('success', 2800, ['😼', '😸', '🔥', '🚀', '🏆']);
    return;
  }

  // 4. 🙀 Sorpresa / Urgencia / Accidente SST
  if (
    /\b(accidente|urgente|grave|peligro\w*|emergencia|multa|lesión|lesion|hospital|mortal|incendio|sismo|riesgo crítico|riesgo critico)\b/i.test(
      clean
    ) ||
    /[🙀😱🚨⚠️]/.test(clean)
  ) {
    triggerTenshiReaction('approval', 3000, ['🙀', '🚨', '⚠️', '🦺', '🐾']);
    return;
  }

  // 5. 😿 Empatía / Estrés / Cansancio (principalmente cuando el usuario expresa fatiga o duda)
  if (
    role === 'user' &&
    (/\b(qué estrés|que estres|estresad\w*|cansad\w*|qué difícil|que dificil|no entiendo|ayúdame|ayudame|complicad\w*|agotad\w*|abrumad\w*|triste)\b/i.test(
      clean
    ) ||
      /[😿😢😭😤]/.test(clean))
  ) {
    triggerTenshiReaction('listening', 2800, ['😿', '😽', '🐾', '💪', '☕']);
    return;
  }

  // 6. 😾 Molestia / Queja
  if (
    role === 'user' &&
    (/\b(no funciona|no sirve|qué rabia|que rabia|molest\w*|dañad\w*|otra vez mal)\b/i.test(clean) ||
      /[😾😡🤬💢]/.test(clean))
  ) {
    triggerTenshiReaction('annoyed', 2400, ['😾', '💢', '🐾']);
    return;
  }

  // 7. 😺 Saludo / Bienvenida / Despedida
  if (
    role === 'user' &&
    /\b(hola|buenos días|buenos dias|buenas tardes|buenas noches|saludos|chao|adiós|adios|hasta luego|hasta mañana)\b/i.test(
      clean
    )
  ) {
    triggerTenshiReaction('greeting', 2600, ['😺', '😸', '👋', '🐾', '✨']);
    return;
  }

  // 8. Pregunta de Tenshi (solo dura 3.2 segundos y luego desaparece para no quedar pegada)
  if (role === 'assistant' && clean.endsWith('?')) {
    triggerTenshiReaction('question', 3200);
  }
}

export const TenshiAvatar: React.FC<TenshiAvatarProps> = ({
  size = 140,
  avatarId,
  mood: explicitMood,
  isSpeaking = false,
  outputAmplitude = 0,
  isVoiceActive = false,
  isTyping = false,
  interactive = true,
  className = '',
  onClick,
  onFileDrop,
  showHaloEffect = true,
  showHUD = true,
  statusText,
  statusPlacement = 'bottom',
  smoothSizeTransition = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [globalAvatarId, setGlobalAvatarId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wappy_active_avatar_id') || 'gato';
    }
    return 'gato';
  });

  useEffect(() => {
    const handleAvatarUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ avatarId?: string }>;
      const nextId =
        custom.detail?.avatarId ||
        localStorage.getItem('wappy_active_avatar_id') ||
        'gato';
      setGlobalAvatarId(nextId);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'wappy_active_avatar_id' && e.newValue) {
        setGlobalAvatarId(e.newValue);
      }
    };
    window.addEventListener('wappy-avatar-updated', handleAvatarUpdated);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('wappy-avatar-updated', handleAvatarUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const preset = useMemo(
    () => getAvatarPresetById(avatarId || globalAvatarId),
    [avatarId, globalAvatarId]
  );

  const [tilt, setTilt] = useState({
    rx: 0,
    ry: 0,
    rz: 0,
    lookX: 0,
    lookY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [haloLag, setHaloLag] = useState({ dx: 0, dy: 0, tilt: 0 });
  const [idleGaze, setIdleGaze] = useState({ x: 0, y: 0 });
  const [isCursorFollowing, setIsCursorFollowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isSquashing, setIsSquashing] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [transientMood, setTransientMood] = useState<TenshiAvatarMood | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Contadores de gestos tipo Coucou (Poke / Slap & Petting / Acariciar)
  const pokeCountRef = useRef(0);
  const lastPokeTimeRef = useRef(0);
  const transientTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haloLagTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const squashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const petMovesRef = useRef(0);
  const lastPetXRef = useRef<number | null>(null);
  const lastPetDirRef = useRef<number>(0);
  const idleSleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseMoveAtRef = useRef<number>(0);

  // Helpers seguros para animaciones táctiles con auto-limpieza
  const triggerSquash = useCallback((duration = 320) => {
    setIsSquashing(true);
    if (squashTimeoutRef.current) clearTimeout(squashTimeoutRef.current);
    squashTimeoutRef.current = setTimeout(() => {
      squashTimeoutRef.current = null;
      setIsSquashing(false);
    }, duration);
  }, []);

  const triggerClickPulse = useCallback((duration = 220) => {
    setIsClicked(true);
    if (clickedTimeoutRef.current) clearTimeout(clickedTimeoutRef.current);
    clickedTimeoutRef.current = setTimeout(() => {
      clickedTimeoutRef.current = null;
      setIsClicked(false);
    }, duration);
  }, []);

  // Limpieza global de timers puntuales al desmontar
  useEffect(() => {
    return () => {
      if (transientTimeoutRef.current) {
        clearTimeout(transientTimeoutRef.current);
        transientTimeoutRef.current = null;
      }
      if (haloLagTimeoutRef.current) {
        clearTimeout(haloLagTimeoutRef.current);
        haloLagTimeoutRef.current = null;
      }
      if (squashTimeoutRef.current) {
        clearTimeout(squashTimeoutRef.current);
        squashTimeoutRef.current = null;
      }
      if (clickedTimeoutRef.current) {
        clearTimeout(clickedTimeoutRef.current);
        clickedTimeoutRef.current = null;
      }
      if (idleSleepTimerRef.current) {
        clearTimeout(idleSleepTimerRef.current);
        idleSleepTimerRef.current = null;
      }
    };
  }, []);

  // Función para emitir una ráfaga de emoticones gatunos personalizados
  const emitCustomEmojis = useCallback((emojis: string[]) => {
    const now = Date.now();
    const baseSize = size >= 420 ? 30 : size >= 200 ? 22 : size >= 80 ? 15 : 11;
    const created: Particle[] = emojis.map((emoji, i) => ({
      id: now + i,
      kind: 'cat',
      x: 16 + ((i * 17 + Math.random() * 12) % 68),
      y: 16 + (i % 3) * 8,
      vx: (i % 2 === 0 ? -1 : 1) * (8 + Math.random() * 14),
      vy: -32 - Math.random() * 16,
      size: baseSize + (i % 2) * 3,
      color: '#10B981',
      label: emoji,
      delayMs: i * 110,
    }));
    setParticles(created);
  }, [size]);

  // Función para activar una emoción temporal con auto-limpieza
  const triggerTransient = useCallback((newMood: TenshiAvatarMood, duration = 2200) => {
    setTransientMood(newMood);
    if (transientTimeoutRef.current) clearTimeout(transientTimeoutRef.current);
    transientTimeoutRef.current = setTimeout(() => {
      transientTimeoutRef.current = null;
      setTransientMood(null);
    }, duration);
  }, []);

  // Saludo automático suave al montar por primera vez
  useEffect(() => {
    const greetTimer = setTimeout(() => {
      triggerTransient('greeting', 2000);
    }, 450);
    return () => clearTimeout(greetTimer);
  }, [triggerTransient]);

  // Escuchar eventos globales 'tenshi-react' de la plataforma WAPPY
  useEffect(() => {
    const handleGlobalReaction = (e: Event) => {
      const custom = e as CustomEvent<{
        mood?: TenshiAvatarMood;
        durationMs?: number;
        emojis?: string[];
      }>;
      if (custom.detail?.mood) {
        setIsSleeping(false);
        triggerSquash(320);
        triggerTransient(custom.detail.mood, custom.detail.durationMs || 2400);
        if (custom.detail.emojis && custom.detail.emojis.length > 0) {
          emitCustomEmojis(custom.detail.emojis);
        }
      }
    };
    window.addEventListener('tenshi-react', handleGlobalReaction);
    return () => window.removeEventListener('tenshi-react', handleGlobalReaction);
  }, [triggerTransient, emitCustomEmojis, triggerSquash]);

  // Determinar emoción activa con prioridad jerárquica
  const activeMood: TenshiAvatarMood = useMemo(() => {
    if (transientMood) return transientMood;
    if (explicitMood && explicitMood !== 'idle') return explicitMood;
    if (isSpeaking) return 'speaking';
    if (isTyping) return 'thinking';
    if (isVoiceActive) return 'listening';
    if (isSleeping) return 'sleeping';
    return explicitMood || 'idle';
  }, [transientMood, explicitMood, isSpeaking, isTyping, isVoiceActive, isSleeping]);

  // Refs sincronizadas para evitar recrear ciclos de parpadeo / mirada / mouse en cada cambio de estado
  const activeMoodRef = useRef<TenshiAvatarMood>(activeMood);
  activeMoodRef.current = activeMood;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const isVoiceActiveRef = useRef(isVoiceActive);
  isVoiceActiveRef.current = isVoiceActive;
  const isTypingRef = useRef(isTyping);
  isTypingRef.current = isTyping;
  const isSleepingRef = useRef(isSleeping);
  isSleepingRef.current = isSleeping;

  // Limpiar estados oculares si entra en sueño o sale de estados compatibles con mirada autónoma
  useEffect(() => {
    if (activeMood === 'sleeping') {
      setIsBlinking(false);
      setIsWinking(false);
    }
    if (activeMood !== 'idle' && activeMood !== 'listening') {
      setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
    }
  }, [activeMood]);

  // Despertar si hay actividad de voz/chat y rearmar el temporizador de sueño cuando vuelve a reposo
  useEffect(() => {
    if (isSpeaking || isVoiceActive || isTyping) {
      if (isSleepingRef.current) {
        setIsSleeping(false);
      }
      if (idleSleepTimerRef.current) {
        clearTimeout(idleSleepTimerRef.current);
        idleSleepTimerRef.current = null;
      }
      return;
    }

    if (!isSleeping) {
      if (idleSleepTimerRef.current) clearTimeout(idleSleepTimerRef.current);
      idleSleepTimerRef.current = setTimeout(() => {
        if (!isSpeakingRef.current && !isVoiceActiveRef.current && !isTypingRef.current) {
          setIsSleeping(true);
        }
      }, 95000);
    }
  }, [isSpeaking, isVoiceActive, isTyping, isSleeping]);

  // Determinar si el visor HUD está en modo de alta intensidad (conversación o reacción activa)
  const isHighEnergy =
    isSpeaking ||
    isVoiceActive ||
    isTyping ||
    isHovered ||
    isDragOver ||
    activeMood !== 'idle';

  // Emitir partículas según la emoción (usando emoticones de cara de gato por defecto)
  const emitParticles = useCallback(
    (kind: Particle['kind'], count: number) => {
      const now = Date.now();
      const baseSize = size >= 420 ? 28 : size >= 200 ? 20 : size >= 80 ? 14 : 10;
      if (kind === 'heart') {
        const catLove = ['😻', '😽', '💚', '🐾', '✨'];
        setParticles(
          Array.from({ length: count }, (_, i) => ({
            id: now + i,
            kind: 'cat',
            x: 18 + ((i * 16 + Math.random() * 10) % 64),
            y: 18 + (i % 2) * 8,
            vx: (Math.random() - 0.5) * 18,
            vy: -30,
            size: baseSize + (i % 2) * 2,
            color: '#FB7185',
            label: catLove[i % catLove.length],
            delayMs: i * 100,
          }))
        );
        return;
      }
      if (kind === 'z') {
        setParticles(
          Array.from({ length: count }, (_, i) => ({
            id: now + i,
            kind,
            x: 64 + i * 7,
            y: 18 - i * 5,
            vx: 6,
            vy: -18,
            size: 10 + i * 3,
            color: '#93C5FD',
            label: 'z',
            delayMs: i * 150,
          }))
        );
        return;
      }
      if (kind === 'sweat') {
        setParticles([
          {
            id: now,
            kind,
            x: 74,
            y: 26,
            vx: 4,
            vy: 14,
            size: baseSize,
            color: '#38BDF8',
            label: '😿',
          },
        ]);
        return;
      }
      const catSpark = ['😼', '😸', '😺', '🐾', '🔥', '🚀', '✨'];
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: now + i,
          kind: 'cat',
          x: 16 + ((i * 15 + Math.random() * 12) % 68),
          y: 16 + (i % 3) * 7,
          vx: (Math.random() - 0.5) * 22,
          vy: -32,
          size: baseSize + (i % 2) * 2,
          color: '#10B981',
          label: catSpark[i % catSpark.length],
          delayMs: i * 95,
        }))
      );
    },
    [size]
  );

  // Sonidos y partículas + rebote elástico al cambiar de estado
  const prevMoodRef = useRef(activeMood);
  useEffect(() => {
    if (prevMoodRef.current !== activeMood) {
      if (activeMood === 'thinking') {
        tenshiAudio.playThink();
      } else if (activeMood === 'searching') {
        tenshiAudio.playSearch();
      } else if (activeMood === 'question') {
        tenshiAudio.playQuestion();
      } else if (activeMood === 'approval') {
        emitCustomEmojis(['🙀', '🚨', '⚠️', '🦺']);
      } else if (activeMood === 'annoyed') {
        emitCustomEmojis(['😾', '💢', '🐾']);
      } else if (activeMood === 'success') {
        tenshiAudio.playSuccess();
        emitParticles('spark', 5);
      } else if (activeMood === 'love') {
        tenshiAudio.playPurr();
        emitParticles('heart', 5);
      } else if (activeMood === 'greeting') {
        emitCustomEmojis(['😺', '😸', '👋', '🐾']);
      } else if (activeMood === 'sleeping') {
        emitParticles('z', 3);
      }
      prevMoodRef.current = activeMood;
    }
  }, [activeMood, emitParticles, emitCustomEmojis]);

  // Emisión periódica de Zzz mientras duerme
  useEffect(() => {
    if (activeMood !== 'sleeping') return;
    const zInterval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        emitParticles('z', 3);
      }
    }, 2600);
    return () => clearInterval(zInterval);
  }, [activeMood, emitParticles]);

  // Limpieza de partículas
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2200);
    return () => clearTimeout(timer);
  }, [particles]);

  // Parpadeo natural autónomo blindado (cero fugas de timers, pausa en segundo plano y cadencia serena)
  useEffect(() => {
    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const clearAllTimers = () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };

    const scheduleSafe = (fn: () => void, ms: number) => {
      if (cancelled) return;
      const id = setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
    };

    const scheduleNextBlink = (overrideDelay?: number) => {
      clearAllTimers();
      if (cancelled || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }

      // Cadencia orgánica y serena: intervalo natural entre 3.2 s y 6.4 s
      const delay = overrideDelay ?? 3200 + Math.random() * 3200;
      scheduleSafe(() => {
        if (cancelled || (typeof document !== 'undefined' && document.hidden)) {
          setIsBlinking(false);
          setIsWinking(false);
          return;
        }

        const currentMood = activeMoodRef.current;
        if (currentMood === 'sleeping') {
          setIsBlinking(false);
          setIsWinking(false);
          scheduleNextBlink(3800 + Math.random() * 2400);
          return;
        }

        const rand = Math.random();
        // Guiño amistoso sutil (~6% solo en idle)
        if (rand < 0.06 && currentMood === 'idle') {
          setIsWinking(true);
          scheduleSafe(() => {
            setIsWinking(false);
            scheduleNextBlink();
          }, 260);
        } else {
          // Parpadeo suave de 145 ms
          setIsBlinking(true);
          scheduleSafe(() => {
            setIsBlinking(false);
            // Doble parpadeo ocasional (~12%) con pausa natural de 130 ms
            if (Math.random() < 0.12 && activeMoodRef.current !== 'sleeping') {
              scheduleSafe(() => {
                if (activeMoodRef.current === 'sleeping') {
                  scheduleNextBlink();
                  return;
                }
                setIsBlinking(true);
                scheduleSafe(() => {
                  setIsBlinking(false);
                  scheduleNextBlink();
                }, 145);
              }, 130);
            } else {
              scheduleNextBlink();
            }
          }, 145);
        }
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (cancelled) return;
      clearAllTimers();
      setIsBlinking(false);
      setIsWinking(false);
      if (!document.hidden) {
        scheduleNextBlink(2600 + Math.random() * 2600);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNextBlink(2800 + Math.random() * 2600);

    return () => {
      cancelled = true;
      clearAllTimers();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Movimiento autónomo NATURAL de mirada (solo cuando el mouse lleva >4 s quieto y está relajado/atento)
  useEffect(() => {
    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const clearAllTimers = () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };

    const scheduleSafe = (fn: () => void, ms: number) => {
      if (cancelled) return;
      const id = setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
    };

    const scheduleNextGaze = (overrideDelay?: number) => {
      clearAllTimers();
      if (cancelled || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }

      // Cada 3.8 – 6.8 segundos evalúa un desplazamiento ocular suave y natural
      const waitMs = overrideDelay ?? 3800 + Math.random() * 3000;
      scheduleSafe(() => {
        if (cancelled || (typeof document !== 'undefined' && document.hidden)) {
          setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
          return;
        }

        const currentMood = activeMoodRef.current;
        const mouseQuietMs = Date.now() - lastMouseMoveAtRef.current;
        const canLookAround =
          !isSleepingRef.current &&
          (currentMood === 'idle' || currentMood === 'listening') &&
          !isSpeakingRef.current &&
          mouseQuietMs > 4000;

        if (!canLookAround) {
          setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
          const retryMs =
            mouseQuietMs <= 4000
              ? Math.max(1200, 4200 - mouseQuietMs + Math.random() * 1400)
              : 3800 + Math.random() * 3000;
          scheduleNextGaze(retryMs);
          return;
        }

        // ~40% de las veces regresa/permanece calmadamente al centro
        if (Math.random() < 0.4) {
          setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
          scheduleNextGaze();
          return;
        }

        // Destino natural y contenido: x ∈ [-0.48, +0.48], y ∈ [-0.28, +0.22]
        const moodScale = currentMood === 'listening' ? 0.55 : 1;
        const nextX = (-0.48 + Math.random() * 0.96) * moodScale;
        const nextY = (-0.28 + Math.random() * 0.5) * moodScale;
        setIdleGaze({ x: nextX, y: nextY });

        // Sostiene la mirada calmadamente 2.2 – 4.2 s y vuelve suave al centro
        const holdMs = 2200 + Math.random() * 2000;
        scheduleSafe(() => {
          setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
          scheduleNextGaze();
        }, holdMs);
      }, waitMs);
    };

    const handleVisibilityChange = () => {
      if (cancelled) return;
      clearAllTimers();
      setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
      if (!document.hidden) {
        scheduleNextGaze(4200 + Math.random() * 2600);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNextGaze(4200 + Math.random() * 2600);

    return () => {
      cancelled = true;
      clearAllTimers();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Seguimiento global 24/7 del cursor + Detector de inactividad (Sleep)
  useEffect(() => {
    let returnCenterTimeout: ReturnType<typeof setTimeout> | null = null;

    const resetSleepTimer = () => {
      if (isSleepingRef.current) {
        setIsSleeping(false);
        triggerSquash(320);
      }
      if (idleSleepTimerRef.current) clearTimeout(idleSleepTimerRef.current);
      idleSleepTimerRef.current = setTimeout(() => {
        if (!isSpeakingRef.current && !isVoiceActiveRef.current && !isTypingRef.current) {
          setIsSleeping(true);
        }
      }, 95000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouseMoveAtRef.current = Date.now();
      setIsCursorFollowing(true);
      setIdleGaze((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
      resetSleepTimer();

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.36;

      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth * 0.45, 320)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight * 0.45, 320)));

      const factor = interactiveRef.current ? 1 : 0;
      const currentMood = activeMoodRef.current;
      const ry = dx * 16 * factor;
      const rx = -dy * 13 * factor;
      const rz =
        currentMood === 'question'
          ? 7.5
          : currentMood === 'listening'
          ? 4.5
          : currentMood === 'thinking'
          ? -4.5
          : currentMood === 'love'
          ? 5
          : dx * 3.2 * factor;

      const glareX = 50 + dx * 38;
      const glareY = 50 + dy * 38;

      setTilt({ rx, ry, rz, lookX: dx, lookY: dy, glareX, glareY });

      // Resorte físico con retraso para la Aureola Celestial (cancelando siempre el timer previo)
      if (haloLagTimeoutRef.current) clearTimeout(haloLagTimeoutRef.current);
      haloLagTimeoutRef.current = setTimeout(() => {
        haloLagTimeoutRef.current = null;
        setHaloLag({
          dx: dx * 6,
          dy: dy * 3.5,
          tilt: dx * 8,
        });
      }, 65);

      if (returnCenterTimeout) clearTimeout(returnCenterTimeout);
      returnCenterTimeout = setTimeout(() => {
        returnCenterTimeout = null;
        if (haloLagTimeoutRef.current) {
          clearTimeout(haloLagTimeoutRef.current);
          haloLagTimeoutRef.current = null;
        }
        const moodNow = activeMoodRef.current;
        setIsCursorFollowing(false);
        setTilt({
          rx: 0,
          ry: 0,
          rz: moodNow === 'question' ? 7 : moodNow === 'thinking' ? -4 : 0,
          lookX: 0,
          lookY: 0,
          glareX: 50,
          glareY: 50,
        });
        setHaloLag({ dx: 0, dy: 0, tilt: 0 });
      }, 3400);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (returnCenterTimeout) {
        clearTimeout(returnCenterTimeout);
        returnCenterTimeout = null;
      }
      if (haloLagTimeoutRef.current) {
        clearTimeout(haloLagTimeoutRef.current);
        haloLagTimeoutRef.current = null;
      }
      if (idleSleepTimerRef.current) {
        clearTimeout(idleSleepTimerRef.current);
        idleSleepTimerRef.current = null;
      }
    };
  }, [triggerSquash]);

  // Detector de caricias en la cabeza (Petting Gesture -> estado 'love')
  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      if (relY > 0.45) return;

      if (lastPetXRef.current !== null) {
        const deltaX = e.clientX - lastPetXRef.current;
        const dir = deltaX > 3 ? 1 : deltaX < -3 ? -1 : 0;
        if (dir !== 0 && dir !== lastPetDirRef.current) {
          lastPetDirRef.current = dir;
          petMovesRef.current += 1;
          if (petMovesRef.current >= 4 && activeMood !== 'love') {
            petMovesRef.current = 0;
            triggerTransient('love', 2600);
            triggerSquash(340);
          }
        }
      }
      lastPetXRef.current = e.clientX;
    },
    [interactive, activeMood, triggerTransient, triggerSquash]
  );

  // Manejador de Clic con progresión estilo Coucou:
  // 1 clic -> Rebote normal | 2-3 clics rápidos -> Annoyed (molesto) | 4+ clics rápidos -> Dizzy (mareado)
  const handleClick = useCallback(() => {
    if (!interactive) {
      if (onClick) onClick();
      return;
    }
    const now = Date.now();
    if (now - lastPokeTimeRef.current < 850) {
      pokeCountRef.current += 1;
    } else {
      pokeCountRef.current = 1;
    }
    lastPokeTimeRef.current = now;

    triggerClickPulse(220);
    triggerSquash(380);

    if (pokeCountRef.current >= 4) {
      pokeCountRef.current = 0;
      triggerTransient('dizzy', 2600);
      tenshiAudio.playDizzy();
    } else if (pokeCountRef.current >= 2) {
      triggerTransient('annoyed', 1100);
      tenshiAudio.playAnnoyed();
    } else {
      tenshiAudio.playBlip();
    }

    if (onClick) onClick();
  }, [interactive, onClick, triggerTransient, triggerClickPulse, triggerSquash]);

  // Drag & Drop de archivos sobre Tenshi (Efecto "Gulp" de Coucou)
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      tenshiAudio.playGulp();
      triggerSquash(450);
      triggerTransient('success', 2000);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0 && onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
    },
    [onFileDrop, triggerTransient, triggerSquash]
  );

  // Cinemática Elástica de Cuerpo Completo (0 cortes clip-path, 100% acabado de estudio como BotEngine de Coucou)
  const bodyScaleX = useMemo(() => {
    if (isClicked || isSquashing) return 1.13;
    if (isSpeaking) return 1 - Math.min(outputAmplitude * 0.06, 0.045);
    if (isHovered || isDragOver) return 1.04;
    return 1;
  }, [isClicked, isSquashing, isSpeaking, outputAmplitude, isHovered, isDragOver]);

  const bodyScaleY = useMemo(() => {
    if (isClicked || isSquashing) return 0.85;
    if (isSpeaking) return 1 + Math.min(outputAmplitude * 0.14, 0.11);
    if (isHovered || isDragOver) return 1.04;
    return 1;
  }, [isClicked, isSquashing, isSpeaking, outputAmplitude, isHovered, isDragOver]);

  const bodyTranslateY = useMemo(() => {
    if (isClicked || isSquashing) return 4;
    if (isSpeaking) return -Math.min(outputAmplitude * 7, 5);
    if (activeMood === 'sleeping') return 2;
    return 0;
  }, [isClicked, isSquashing, isSpeaking, outputAmplitude, activeMood]);

  // ── RENDERIZADO DE LOS VISORES HUD EXPRESIVOS (SIN CÍRCULOS DIABÓLICOS) ───
  // Ojos Cápsula Suaves (Estilo Mochi / EVE / Astro Bot) con doble brillito especular blanco (catchlights)
  const renderHUDLenses = () => {
    if (!showHUD || size < 28) return null;

    const usingAutonomousGaze =
      !isCursorFollowing &&
      (activeMood === 'idle' || activeMood === 'listening') &&
      !isSpeaking;
    const effectiveLookX = usingAutonomousGaze ? idleGaze.x : tilt.lookX;
    const effectiveLookY = usingAutonomousGaze ? idleGaze.y : tilt.lookY;

    const maxShift = size < 55 ? 1.4 : Math.min(12, Math.max(3.2, size * 0.018));
    const eyeOffsetX =
      activeMood === 'thinking' ? maxShift * 0.75 : effectiveLookX * maxShift;
    const eyeOffsetY =
      activeMood === 'thinking'
        ? -maxShift * 0.65
        : activeMood === 'sleeping'
        ? maxShift * 0.5
        : effectiveLookY * (maxShift * 0.78);

    const lensCommonClass = cn(
      'absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden transition-all duration-200',
      'rounded-[48%_48%_54%_54%]',
      isHighEnergy
        ? 'bg-zinc-950/80 border border-emerald-300/75 shadow-[0_0_12px_rgba(52,211,153,0.6),inset_0_0_6px_rgba(6,78,59,0.45)]'
        : 'bg-zinc-950/35 border border-emerald-400/20'
    );

    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Resplandor suave alrededor de las gafas cuando está activo */}
        {isHighEnergy && size >= 60 && (
          <div
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md pointer-events-none transition-opacity duration-300',
              activeMood === 'love'
                ? 'bg-rose-400/25'
                : activeMood === 'thinking' || activeMood === 'approval'
                ? 'bg-amber-400/20'
                : 'bg-emerald-400/20'
            )}
            style={{
              left: '49.5%',
              top: '31.8%',
              width: '64%',
              height: '20%',
            }}
          />
        )}

        {/* Rubor cálido en las mejillas (cuando está feliz, saludando o lo acarician) */}
        {(activeMood === 'love' || activeMood === 'success' || activeMood === 'greeting') && (
          <>
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400/45 blur-[4px] pointer-events-none transition-opacity duration-300"
              style={{ left: '21%', top: '43.5%', width: '13%', height: '6.5%' }}
            />
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400/45 blur-[4px] pointer-events-none transition-opacity duration-300"
              style={{ left: '78%', top: '43.5%', width: '13%', height: '6.5%' }}
            />
          </>
        )}

        {/* Lente Izquierdo */}
        <div
          className={lensCommonClass}
          style={{
            left: preset.leftLens.left,
            top: preset.leftLens.top,
            width: preset.leftLens.width,
            height: preset.leftLens.height,
            borderRadius: preset.leftLens.borderRadius || undefined,
          }}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-tenshi-lens-gleam pointer-events-none" />
          {renderFriendlyEye(eyeOffsetX, eyeOffsetY, 'left', usingAutonomousGaze)}
        </div>

        {/* Lente Derecho */}
        <div
          className={lensCommonClass}
          style={{
            left: preset.rightLens.left,
            top: preset.rightLens.top,
            width: preset.rightLens.width,
            height: preset.rightLens.height,
            borderRadius: preset.rightLens.borderRadius || undefined,
          }}
        >
          <span
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-tenshi-lens-gleam pointer-events-none"
            style={{ animationDelay: '0.18s' }}
          />
          {renderFriendlyEye(eyeOffsetX, eyeOffsetY, 'right', usingAutonomousGaze)}
        </div>
      </div>
    );
  };

  // Ojos amigables tipo Mochi / Astro Bot (sin anillos concéntricos intimidantes)
  const renderFriendlyEye = (
    offsetX: number,
    offsetY: number,
    side: 'left' | 'right',
    isAutonomousGaze = false
  ) => {
    // 1. Parpadeo natural o durmiendo (arco suave cerrado ︶)
    if (isBlinking || activeMood === 'sleeping') {
      return (
        <div
          className="w-[54%] h-[22%] rounded-b-full border-b-2 border-emerald-200/90 shadow-[0_2px_6px_rgba(110,231,183,0.7)] transition-all duration-100"
          style={{ transform: `translate(${offsetX * 0.4}px, ${offsetY * 0.4}px)` }}
        />
      );
    }

    // 2. Guiño amistoso (ojo izquierdo guiña en arco feliz ◠)
    if ((isWinking || activeMood === 'greeting') && side === 'left') {
      return (
        <div
          className={cn(
            'w-[56%] h-[36%] rounded-t-full border-t-[2.5px] border-emerald-200 shadow-[0_-2px_8px_rgba(110,231,183,0.9)] transition-transform',
            isAutonomousGaze ? 'duration-500 ease-in-out' : 'duration-150 ease-out'
          )}
          style={{ transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)` }}
        />
      );
    }

    // 3. Mareado (@ @ espiral)
    if (activeMood === 'dizzy') {
      return (
        <span className="text-emerald-300 font-black text-xs animate-spin select-none drop-shadow-[0_0_6px_#34d399]">
          🌀
        </span>
      );
    }

    // 4. Molesto por toques repetidos (párpado recto semicerrado — —)
    if (activeMood === 'annoyed') {
      return (
        <div
          className="w-[62%] h-[22%] rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]"
          style={{
            transform: `rotate(${side === 'left' ? '8deg' : '-8deg'})`,
          }}
        />
      );
    }

    // 5. Feliz / Éxito / Acariciado (Arcos sonrientes cálidos ◠ ◠ estilo Mochi Happy)
    if (activeMood === 'success' || activeMood === 'love') {
      const arcColor =
        activeMood === 'love'
          ? 'border-rose-200 shadow-[0_-2px_10px_rgba(251,113,133,0.95)]'
          : 'border-emerald-200 shadow-[0_-2px_10px_rgba(110,231,183,0.95)]';
      return (
        <div
          className={cn('w-[58%] h-[42%] rounded-t-full border-t-[3px] transition-all', arcColor)}
          style={{ transform: `translate(${offsetX * 0.6}px, ${offsetY * 0.6}px)` }}
        />
      );
    }

    // 6. Búsqueda Normativa / Web (Escáner suave horizontal con ojo atento)
    if (activeMood === 'searching') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="w-[46%] h-[58%] rounded-full bg-gradient-to-b from-cyan-100 to-emerald-300 animate-tenshi-scanner shadow-[0_0_10px_#6ee7b7]">
            <span className="block w-[36%] h-[32%] rounded-full bg-white mt-[18%] ml-[46%]" />
          </span>
        </div>
      );
    }

    // 7. OJO CÁPSULA EXPRESIVO PRINCIPAL (Idle, Listening, Speaking, Thinking, Question, Working, Approval)
    const voiceBounceY = isSpeaking ? Math.min(outputAmplitude * 2.8, 2.2) : 0;
    const isCuriousRight = activeMood === 'question' && side === 'right';
    const isThinkingLeft = activeMood === 'thinking' && side === 'left';

    const eyeScaleY = isSpeaking
      ? 1 + Math.min(outputAmplitude * 0.25, 0.18)
      : isCuriousRight
      ? 1.16
      : isThinkingLeft
      ? 0.82
      : isDragOver || activeMood === 'approval'
      ? 1.14
      : 1;

    const eyeScaleX = isDragOver || activeMood === 'listening' ? 1.08 : 1;

    return (
      <div
        className={cn(
          'relative flex items-center justify-center transition-transform',
          isAutonomousGaze ? 'duration-500 ease-in-out' : 'duration-150 ease-out',
          isHighEnergy ? 'opacity-100' : 'opacity-75 group-hover:opacity-100'
        )}
        style={{
          width: '36%',
          height: '58%',
          transform: `translate(${offsetX}px, ${offsetY - voiceBounceY}px) scale(${eyeScaleX}, ${eyeScaleY})`,
        }}
      >
        {/* Cuerpo del ojo tipo píldora suave (Mochi Squircle Eye) */}
        <div
          className={cn(
            'relative w-full h-full rounded-full transition-colors duration-200',
            activeMood === 'thinking' || activeMood === 'approval'
              ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
              : 'bg-gradient-to-b from-white via-emerald-200 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
          )}
        >
          {/* Brillito especular principal superior derecho (Catchlight de vida) */}
          <span
            className="absolute rounded-full bg-white shadow-[0_0_3px_#ffffff]"
            style={{
              top: '15%',
              right: '16%',
              width: '36%',
              height: '28%',
            }}
          />
          {/* Segundo brillito especular inferior izquierdo */}
          <span
            className="absolute rounded-full bg-white/90"
            style={{
              bottom: '18%',
              left: '20%',
              width: '18%',
              height: '15%',
            }}
          />
          {/* Párpado inferior sonriente cuando habla (hace que sus ojos sonrían mientras te habla) */}
          {isSpeaking && (
            <span
              className="absolute -bottom-[18%] inset-x-[-10%] h-[38%] rounded-t-full bg-zinc-950 transition-transform duration-75"
              style={{
                transform: `scaleY(${0.4 + Math.min(outputAmplitude * 0.9, 0.7)})`,
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // Badges flotantes holográficos estilo Coucou (?, !, •••)
  const renderStatusBadge = () => {
    if (size < 55) return null;
    const isGiant = size >= 420;
    if (activeMood === 'question') {
      return (
        <div
          className={cn(
            'absolute top-0 right-[8%] z-30 animate-bounce rounded-full bg-cyan-400/90 font-black text-zinc-950 shadow-[0_0_14px_#22d3ee] pointer-events-none',
            isGiant ? 'px-2.5 py-0.5 text-sm' : 'px-1.5 py-0.5 text-[10px]'
          )}
        >
          ?
        </div>
      );
    }
    if (activeMood === 'approval') {
      return (
        <div
          className={cn(
            'absolute top-0 right-[8%] z-30 animate-bounce rounded-full bg-amber-400/95 font-black text-zinc-950 shadow-[0_0_14px_#fbbf24] pointer-events-none',
            isGiant ? 'px-2.5 py-0.5 text-sm' : 'px-1.5 py-0.5 text-[10px]'
          )}
        >
          !
        </div>
      );
    }
    if (activeMood === 'thinking' || activeMood === 'searching') {
      const dotClass = isGiant
        ? 'h-1.5 w-1.5 rounded-full bg-amber-300 animate-bounce'
        : 'h-1 w-1 rounded-full bg-amber-300 animate-bounce';
      return (
        <div
          className={cn(
            'absolute top-0 right-[6%] z-30 flex items-center rounded-full bg-zinc-900/85 border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.45)] pointer-events-none',
            isGiant ? 'gap-1 px-2.5 py-1.5' : 'gap-0.5 px-1.5 py-1'
          )}
        >
          <span className={dotClass} />
          <span className={dotClass} style={{ animationDelay: '0.15s' }} />
          <span className={dotClass} style={{ animationDelay: '0.3s' }} />
        </div>
      );
    }
    return null;
  };

  // Clase de animación cinemática sobre el cuerpo íntegro (sin cortes clip-path)
  const bodyKinematicClass = useMemo(() => {
    if (activeMood === 'dizzy') return 'animate-spin';
    if (activeMood === 'annoyed') return 'animate-tenshi-shake';
    if (activeMood === 'success' || activeMood === 'greeting') return 'animate-tenshi-happy-jump';
    if (activeMood === 'love') return 'animate-tenshi-love-sway';
    if (activeMood === 'working' || activeMood === 'searching') return 'animate-tenshi-work-bob';
    if (!isSpeaking && !isClicked) return 'animate-tenshi-breathe-float';
    return '';
  }, [activeMood, isSpeaking, isClicked]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleContainerMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        lastPetXRef.current = null;
        petMovesRef.current = 0;
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        lastPetXRef.current = null;
        petMovesRef.current = 0;
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative inline-flex flex-col items-center justify-center select-none group',
        interactive && 'cursor-pointer',
        className
      )}
      style={{
        width: Math.round(size * 0.75),
        height: size,
        perspective: `${Math.max(800, Math.round(size * 2.4))}px`,
        transition: smoothSizeTransition
          ? 'width 560ms cubic-bezier(0.22, 1, 0.36, 1), height 560ms cubic-bezier(0.22, 1, 0.36, 1)'
          : undefined,
      }}
      title={interactive ? 'Tenshi - Asistente SG-SST (Haz clic para hablar o acarícialo)' : undefined}
    >
      <style>{`
        @keyframes tenshi-halo-pulse {
          0%, 100% { transform: translateX(-50%) rotateX(68deg) translateY(0) scale(1); opacity: 0.9; }
          50% { transform: translateX(-50%) rotateX(68deg) translateY(-4px) scale(1.07); opacity: 1; }
        }
        @keyframes tenshi-aura-wave {
          0% { transform: scale(0.95); opacity: 0.65; }
          50% { transform: scale(1.14); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.65; }
        }
        @keyframes tenshi-scanner {
          0%, 100% { transform: translateX(-45%); }
          50% { transform: translateX(45%); }
        }
        .animate-tenshi-scanner {
          animation: tenshi-scanner 0.75s infinite ease-in-out;
        }
        @keyframes tenshi-lens-gleam {
          0%, 65% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          72% { opacity: 0.75; }
          82% { transform: translateX(180%) skewX(-25deg); opacity: 0; }
          100% { transform: translateX(180%) skewX(-25deg); opacity: 0; }
        }
        .animate-tenshi-lens-gleam {
          animation: tenshi-lens-gleam 3.8s infinite ease-in-out;
        }
        @keyframes tenshi-particle-float {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
          18% { transform: translate(calc(var(--tx, 0px) * 0.25), calc(var(--ty, -28px) * 0.25)) scale(1.25); opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translate(var(--tx, 0px), var(--ty, -34px)) scale(1); opacity: 0; }
        }
        @keyframes tenshi-breathe-float {
          0%, 100% { transform: translateY(0px) scaleX(1) scaleY(1); }
          50% { transform: translateY(-4px) scaleX(0.988) scaleY(1.022); }
        }
        .animate-tenshi-breathe-float {
          animation: tenshi-breathe-float 3.4s infinite ease-in-out;
        }
        @keyframes tenshi-happy-jump {
          0% { transform: translateY(0) scaleX(1) scaleY(1); }
          20% { transform: translateY(var(--tenshi-jump-down, 3%)) scaleX(var(--tenshi-squash-x, 1.12)) scaleY(var(--tenshi-squash-y, 0.86)); }
          50% { transform: translateY(var(--tenshi-jump-up, -9%)) scaleX(var(--tenshi-stretch-x, 0.92)) scaleY(var(--tenshi-stretch-y, 1.1)) rotateZ(-3deg); }
          75% { transform: translateY(1.5%) scaleX(1.04) scaleY(0.96) rotateZ(2deg); }
          100% { transform: translateY(0) scaleX(1) scaleY(1) rotateZ(0deg); }
        }
        .animate-tenshi-happy-jump {
          animation: tenshi-happy-jump 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }
        @keyframes tenshi-love-sway {
          0%, 100% { transform: rotateZ(-4deg) scaleX(1.02) scaleY(0.98); }
          50% { transform: rotateZ(4deg) scaleX(0.98) scaleY(1.03) translateY(-3px); }
        }
        .animate-tenshi-love-sway {
          animation: tenshi-love-sway 1.1s infinite ease-in-out;
        }
        @keyframes tenshi-work-bob {
          0%, 100% { transform: translateY(0) scaleX(1.02) scaleY(0.98); }
          50% { transform: translateY(-3px) scaleX(0.98) scaleY(1.025); }
        }
        .animate-tenshi-work-bob {
          animation: tenshi-work-bob 0.48s infinite ease-in-out;
        }
        @keyframes tenshi-shake {
          0%, 100% { transform: translateX(0) scaleX(1.08) scaleY(0.92); }
          25% { transform: translateX(-5px) rotateZ(-3deg) scaleX(1.1) scaleY(0.9); }
          75% { transform: translateX(5px) rotateZ(3deg) scaleX(1.1) scaleY(0.9); }
        }
        .animate-tenshi-shake {
          animation: tenshi-shake 0.18s infinite ease-in-out;
        }
      `}</style>

      {/* Emisor de Partículas Contextuales y Caritas de Gato (😺 😸 😹 😻 😼 😽 🙀 😿 😾 🐾) */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none z-40 font-bold select-none drop-shadow-md"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.label ? `${p.size}px` : undefined,
              width: p.label ? undefined : p.size,
              height: p.label ? undefined : p.size,
              borderRadius: p.label ? undefined : '9999px',
              backgroundColor: p.label ? undefined : p.color,
              color: p.color,
              textShadow: p.kind === 'cat' ? '0 2px 8px rgba(0,0,0,0.35)' : `0 0 8px ${p.color}`,
              boxShadow: p.label ? undefined : `0 0 10px ${p.color}`,
              animation: 'tenshi-particle-float 1.65s cubic-bezier(0.22, 1, 0.36, 1) forwards',
              animationDelay: `${p.delayMs || 0}ms`,
              opacity: 0,
              '--tx': `${p.vx}px`,
              '--ty': `${p.vy}px`,
            } as React.CSSProperties
          }
        >
          {p.label}
        </span>
      ))}

      {/* Badges Flotantes de Estado (?, !, •••) */}
      {renderStatusBadge()}

      {/* 1. Ondas de Aura Expansiva (Voz, Micrófono o Drag & Drop Activo) */}
      {(isSpeaking || isVoiceActive || isDragOver) && size >= 60 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            animation: 'tenshi-aura-wave 1.8s infinite ease-in-out',
            background: isSpeaking
              ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0) 70%)'
              : 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, rgba(52,211,153,0) 70%)',
          }}
        />
      )}

      {/* 2. Contenedor 3D del Avatar con Física Elástica de Cuerpo Entero (Estilo Coucou BotEngine — 0 cortes clip-path) */}
      <div
        className={cn(
          'relative h-full w-full flex items-center justify-center transition-all duration-200 ease-out select-none',
          isSpeaking
            ? 'drop-shadow-[0_0_24px_rgba(16,185,129,0.75)]'
            : activeMood === 'thinking' || activeMood === 'searching'
            ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.65)]'
            : activeMood === 'love'
            ? 'drop-shadow-[0_0_20px_rgba(251,113,133,0.55)]'
            : isVoiceActive
            ? 'drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]'
            : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:drop-shadow-[0_6px_20px_rgba(16,185,129,0.35)]'
        )}
        style={{
          transformOrigin: '50% 92%',
          transform:
            activeMood === 'dizzy'
              ? 'scale(0.92)'
              : `perspective(${Math.max(800, Math.round(size * 2.4))}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg) translateY(${bodyTranslateY}px) scaleX(${bodyScaleX}) scaleY(${bodyScaleY})`,
          transformStyle: 'preserve-3d',
          transition:
            isClicked || isSquashing
              ? 'transform 0.11s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Cuerpo 3D Íntegro de Tenshi (0 cortes en axilas o cuello) con Cinemática Elástica apoyada en sus pies */}
        <div
          className={cn('relative h-full w-full pointer-events-none select-none', bodyKinematicClass)}
          style={
            {
              transformOrigin: '50% 92%',
              '--tenshi-jump-down': size >= 420 ? '1.8%' : '3%',
              '--tenshi-squash-x': size >= 420 ? '1.06' : '1.12',
              '--tenshi-squash-y': size >= 420 ? '0.93' : '0.86',
              '--tenshi-jump-up': size >= 420 ? '-3.6%' : '-9%',
              '--tenshi-stretch-x': size >= 420 ? '0.96' : '0.92',
              '--tenshi-stretch-y': size >= 420 ? '1.045' : '1.1',
            } as React.CSSProperties
          }
        >
          {/* Halo Celestial Dorado sincronizado al 100% con el movimiento del cuerpo de Tenshi */}
          {showHaloEffect && size >= 45 && (
            <div
              className="absolute -top-2.5 left-1/2 pointer-events-none z-30"
              style={{
                width: '54%',
                height: '15%',
                transform: 'translateX(-50%) rotateX(68deg)',
                transformOrigin: 'center center',
              }}
            >
              <div
                className={cn(
                  'h-full w-full rounded-[50%] border-[2.5px] transition-colors duration-300',
                  isSpeaking
                    ? 'border-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.95),inset_0_0_8px_rgba(52,211,153,0.5)] bg-emerald-400/20'
                    : activeMood === 'love'
                    ? 'border-rose-300 shadow-[0_0_20px_rgba(251,113,133,0.85),inset_0_0_8px_rgba(251,113,133,0.4)] bg-rose-300/20'
                    : isTyping || activeMood === 'thinking' || activeMood === 'searching'
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.85),inset_0_0_8px_rgba(251,191,36,0.4)] bg-amber-400/20'
                    : isVoiceActive
                    ? 'border-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.75),inset_0_0_6px_rgba(52,211,153,0.3)] bg-emerald-300/15'
                    : activeMood === 'sleeping'
                    ? 'border-amber-200/40 shadow-[0_0_8px_rgba(252,211,77,0.3)] bg-amber-200/5'
                    : 'border-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.85),inset_0_0_8px_rgba(252,211,77,0.4)] bg-amber-300/20'
                )}
              />
            </div>
          )}

          <img
            key={preset.src}
            src={preset.src}
            alt={preset.name}
            draggable={false}
            style={{ imageRendering: 'auto' }}
            className="h-full w-full object-contain object-center pointer-events-none select-none"
            onError={(e) => {
              const imgEl = e.currentTarget;
              if (!imgEl.dataset.retried) {
                imgEl.dataset.retried = '1';
                imgEl.src = `${preset.src.split('?')[0]}?t=${Date.now()}`;
              }
            }}
          />

          {/* Visores HUD Expresivos sincronizados con el cuerpo */}
          {renderHUDLenses()}

          {/* Destello en la Estrella Dorada del pecho cuando ejecuta herramientas, busca o habla */}
          {(activeMood === 'working' ||
            activeMood === 'searching' ||
            activeMood === 'thinking' ||
            isSpeaking) && (
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/80 blur-[3px] animate-ping pointer-events-none z-20"
              style={{ left: '57.2%', top: '65.5%', width: '5.5%', height: '4.2%' }}
            />
          )}
        </div>
      </div>

      {/* Píldora de Estado Flotante */}
      {statusText && (
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-full bg-zinc-900/95 backdrop-blur-md px-3.5 py-1 text-xs sm:text-[11px] font-semibold text-emerald-300 border border-emerald-500/40 shadow-lg pointer-events-none transition-all duration-300',
            statusPlacement === 'below-dock'
              ? '-bottom-14'
              : statusPlacement === 'above-dock'
              ? '-top-14'
              : '-bottom-6'
          )}
        >
          {statusText}
        </div>
      )}
    </div>
  );
};

export default TenshiAvatar;
