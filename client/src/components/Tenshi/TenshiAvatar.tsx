import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '~/utils';
import { tenshiAudio } from './tenshiAudio';

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
  size?: number; // en píxeles (ej. 315, 180, 140, 92, 56, 36)
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
}

interface Particle {
  id: number;
  kind: 'spark' | 'heart' | 'z' | 'sweat';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  label?: string;
}

/**
 * Helper global para disparar reacciones espontáneas en Tenshi desde cualquier módulo SG-SST
 */
export function triggerTenshiReaction(mood: TenshiAvatarMood, durationMs = 2400) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tenshi-react', {
        detail: { mood, durationMs },
      })
    );
  }
}

export const TenshiAvatar: React.FC<TenshiAvatarProps> = ({
  size = 140,
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const transientTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const petMovesRef = useRef(0);
  const lastPetXRef = useRef<number | null>(null);
  const lastPetDirRef = useRef<number>(0);
  const idleSleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Función para activar una emoción temporal con auto-limpieza
  const triggerTransient = useCallback((newMood: TenshiAvatarMood, duration = 2200) => {
    setTransientMood(newMood);
    if (transientTimeoutRef.current) clearTimeout(transientTimeoutRef.current);
    transientTimeoutRef.current = setTimeout(() => {
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
      const custom = e as CustomEvent<{ mood?: TenshiAvatarMood; durationMs?: number }>;
      if (custom.detail?.mood) {
        setIsSleeping(false);
        triggerTransient(custom.detail.mood, custom.detail.durationMs || 2400);
      }
    };
    window.addEventListener('tenshi-react', handleGlobalReaction);
    return () => window.removeEventListener('tenshi-react', handleGlobalReaction);
  }, [triggerTransient]);

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

  // Determinar si el visor HUD está en modo de alta intensidad (conversación o reacción activa)
  const isHighEnergy =
    isSpeaking ||
    isVoiceActive ||
    isTyping ||
    isHovered ||
    isDragOver ||
    activeMood !== 'idle';

  // Emitir partículas según la emoción
  const emitParticles = useCallback((kind: Particle['kind'], count: number) => {
    const now = Date.now();
    const created: Particle[] = Array.from({ length: count }, (_, i) => {
      if (kind === 'heart') {
        return {
          id: now + i,
          kind,
          x: 28 + Math.random() * 44,
          y: 22 + Math.random() * 14,
          vx: (Math.random() - 0.5) * 2,
          vy: -2.5 - Math.random() * 2,
          size: 11 + Math.random() * 4,
          color: '#FB7185',
          label: Math.random() > 0.35 ? '♥' : '✨',
        };
      }
      if (kind === 'z') {
        return {
          id: now + i,
          kind,
          x: 64 + i * 7,
          y: 18 - i * 5,
          vx: 1,
          vy: -1.5,
          size: 10 + i * 3,
          color: '#93C5FD',
          label: 'z',
        };
      }
      if (kind === 'sweat') {
        return {
          id: now + i,
          kind,
          x: 74,
          y: 26,
          vx: 0.5,
          vy: 2.5,
          size: 11,
          color: '#38BDF8',
          label: '💧',
        };
      }
      return {
        id: now + i,
        kind: 'spark',
        x: 24 + Math.random() * 52,
        y: 18 + Math.random() * 28,
        vx: (Math.random() - 0.5) * 5,
        vy: -3 - Math.random() * 4,
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.45 ? '#10B981' : '#FBBF24',
        label: Math.random() > 0.5 ? '✦' : undefined,
      };
    });
    setParticles(created);
  }, []);

  // Sonidos y partículas al cambiar de estado
  const prevMoodRef = useRef(activeMood);
  useEffect(() => {
    if (prevMoodRef.current !== activeMood) {
      if (activeMood === 'thinking') {
        tenshiAudio.playThink();
      } else if (activeMood === 'searching') {
        tenshiAudio.playSearch();
      } else if (activeMood === 'question') {
        tenshiAudio.playQuestion();
      } else if (activeMood === 'success') {
        tenshiAudio.playSuccess();
        emitParticles('spark', 7);
      } else if (activeMood === 'love') {
        tenshiAudio.playPurr();
        emitParticles('heart', 5);
      } else if (activeMood === 'greeting') {
        emitParticles('spark', 3);
      } else if (activeMood === 'sleeping') {
        emitParticles('z', 3);
      }
      prevMoodRef.current = activeMood;
    }
  }, [activeMood, emitParticles]);

  // Emisión periódica de Zzz mientras duerme
  useEffect(() => {
    if (activeMood !== 'sleeping') return;
    const zInterval = setInterval(() => {
      emitParticles('z', 3);
    }, 2600);
    return () => clearInterval(zInterval);
  }, [activeMood, emitParticles]);

  // Limpieza de partículas
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles([]);
    }, 1500);
    return () => clearTimeout(timer);
  }, [particles]);

  // Parpadeo natural autónomo (con doble parpadeo ocasional y guiños espontáneos estilo Coucou)
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = 2200 + Math.random() * 2800;
      blinkTimer = setTimeout(() => {
        const rand = Math.random();
        if (rand < 0.12 && activeMood === 'idle') {
          // Guiño amistoso ocasional
          setIsWinking(true);
          setTimeout(() => {
            setIsWinking(false);
            scheduleNextBlink();
          }, 260);
        } else {
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
            // 22% de probabilidad de doble parpadeo rápido (muy vivo)
            if (Math.random() < 0.22) {
              setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                  setIsBlinking(false);
                  scheduleNextBlink();
                }, 110);
              }, 90);
            } else {
              scheduleNextBlink();
            }
          }, 130);
        }
      }, delay);
    };
    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, [activeMood]);

  // Seguimiento global 24/7 del cursor (incluso en el botón flotante) + Detector de inactividad (Sleep)
  useEffect(() => {
    let returnCenterTimeout: NodeJS.Timeout;

    const resetSleepTimer = () => {
      setIsSleeping((prev) => {
        if (prev) {
          // Se despierta con un pequeño salto elástico
          setIsSquashing(true);
          setTimeout(() => setIsSquashing(false), 320);
        }
        return false;
      });
      if (idleSleepTimerRef.current) clearTimeout(idleSleepTimerRef.current);
      idleSleepTimerRef.current = setTimeout(() => {
        if (!isSpeaking && !isVoiceActive && !isTyping) {
          setIsSleeping(true);
        }
      }, 95000); // 95s sin mover el mouse -> Tenshi se duerme tranquilo
    };

    const handleMouseMove = (e: MouseEvent) => {
      resetSleepTimer();
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.36; // Centro a la altura de los ojos de Tenshi

      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth * 0.45, 320)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight * 0.45, 320)));

      const factor = interactive ? 1 : 0.72;
      const ry = dx * 15 * factor;
      const rx = -dy * 12 * factor;
      const rz =
        activeMood === 'question'
          ? 9
          : activeMood === 'listening'
          ? 4.5
          : activeMood === 'thinking'
          ? -4.5
          : dx * 2.5 * factor;

      const glareX = 50 + dx * 38;
      const glareY = 50 + dy * 38;

      setTilt({ rx, ry, rz, lookX: dx, lookY: dy, glareX, glareY });

      // Resorte físico con retraso para la Aureola Celestial (Spring Lag de Coucou)
      setTimeout(() => {
        setHaloLag({
          dx: dx * 5.5,
          dy: dy * 3.2,
          tilt: dx * 7,
        });
      }, 65);

      clearTimeout(returnCenterTimeout);
      returnCenterTimeout = setTimeout(() => {
        setTilt({
          rx: 0,
          ry: 0,
          rz: activeMood === 'question' ? 8 : activeMood === 'thinking' ? -4 : 0,
          lookX: 0,
          lookY: 0,
          glareX: 50,
          glareY: 50,
        });
        setHaloLag({ dx: 0, dy: 0, tilt: 0 });
      }, 3400);
    };

    resetSleepTimer();
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(returnCenterTimeout);
      if (idleSleepTimerRef.current) clearTimeout(idleSleepTimerRef.current);
    };
  }, [interactive, activeMood, isSpeaking, isVoiceActive, isTyping]);

  // Detector de caricias en la cabeza (Petting Gesture -> estado 'love')
  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      // Solo cuenta si acaricia la mitad superior de la cabeza (entre la aureola y las gafas: 0% a 42%)
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
            setIsSquashing(true);
            setTimeout(() => setIsSquashing(false), 340);
          }
        }
      }
      lastPetXRef.current = e.clientX;
    },
    [activeMood, triggerTransient]
  );

  // Manejador de Clic con progresión estilo Coucou:
  // 1 clic -> Rebote normal | 2-3 clics rápidos -> Annoyed (molesto) | 4+ clics rápidos -> Dizzy (mareado)
  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastPokeTimeRef.current < 850) {
      pokeCountRef.current += 1;
    } else {
      pokeCountRef.current = 1;
    }
    lastPokeTimeRef.current = now;

    setIsClicked(true);
    setIsSquashing(true);
    setTimeout(() => setIsClicked(false), 220);
    setTimeout(() => setIsSquashing(false), 380);

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
  }, [onClick, triggerTransient]);

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
      setIsSquashing(true);
      setTimeout(() => setIsSquashing(false), 450);
      triggerTransient('success', 2000);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0 && onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
    },
    [onFileDrop, triggerTransient]
  );

  // Escala reactiva a la voz y Squash & Stretch elástico
  const voiceScale = isSpeaking ? 1 + Math.min(outputAmplitude * 0.22, 0.14) : isHovered ? 1.035 : 1;

  // ── ÁNGULOS DE ARTICULACIÓN DE BRAZOS Y CABEZA (RIGGING 2.5D) ──────────────
  // Brazo izquierdo (pivote en hombro izquierdo 34.8% 63.8%)
  const leftArmAngle = useMemo(() => {
    if (isDragOver) return 38; // Abre los brazos para recibir el archivo
    if (activeMood === 'greeting') return 36; // Levanta la mano saludando
    if (activeMood === 'success' || activeMood === 'love') return 32; // Brazos arriba celebrando
    if (activeMood === 'approval') return 24;
    if (activeMood === 'annoyed') return -6;
    if (isSpeaking) return 8 + Math.min(outputAmplitude * 28, 22);
    if (isHovered) return 14;
    return 0;
  }, [isDragOver, activeMood, isSpeaking, outputAmplitude, isHovered]);

  // Brazo derecho (pivote en hombro derecho 64.8% 63.8%)
  const rightArmAngle = useMemo(() => {
    if (isDragOver) return -38;
    if (activeMood === 'listening') return -24; // Mano hacia la oreja escuchando (como Coucou)
    if (activeMood === 'thinking' || activeMood === 'question') return -18; // Mano reflexiva
    if (activeMood === 'success' || activeMood === 'love') return -32;
    if (activeMood === 'approval') return -24;
    if (isSpeaking) return -(8 + Math.min(outputAmplitude * 26, 20));
    if (isHovered) return -10;
    return 0;
  }, [isDragOver, activeMood, isSpeaking, outputAmplitude, isHovered]);

  // Inclinación expresiva adicional de la cabeza (pivote en el cuello 50% 60.5%)
  const headExtraTilt = useMemo(() => {
    if (activeMood === 'question') return 9;
    if (activeMood === 'listening') return 5;
    if (activeMood === 'thinking') return -5;
    if (activeMood === 'love') return 6;
    if (activeMood === 'greeting') return -4;
    return 0;
  }, [activeMood]);

  // ── RENDERIZADO DE LOS VISORES HUD EXPRESIVOS (SIN CÍRCULOS DIABÓLICOS) ───
  // Reemplaza los antiguos anillos concéntricos hipnóticos por Ojos Cápsula Suaves (Estilo Mochi / EVE / Astro Bot)
  // con brillitos especulares de vida (catchlights), párpados cálidos y 14 expresiones amigables.
  const renderHUDLenses = () => {
    if (!showHUD || size < 28) return null;

    const maxShift = size < 55 ? 1.4 : 3.2;
    const eyeOffsetX =
      activeMood === 'thinking' ? maxShift * 0.75 : tilt.lookX * maxShift;
    const eyeOffsetY =
      activeMood === 'thinking'
        ? -maxShift * 0.65
        : activeMood === 'sleeping'
        ? maxShift * 0.5
        : tilt.lookY * (maxShift * 0.78);

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
            left: '30.7%',
            top: '31.8%',
            width: '25.6%',
            height: '15.4%',
          }}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-tenshi-lens-gleam pointer-events-none" />
          {renderFriendlyEye(eyeOffsetX, eyeOffsetY, 'left')}
        </div>

        {/* Lente Derecho */}
        <div
          className={lensCommonClass}
          style={{
            left: '68.4%',
            top: '31.7%',
            width: '25.6%',
            height: '15.2%',
          }}
        >
          <span
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-tenshi-lens-gleam pointer-events-none"
            style={{ animationDelay: '0.18s' }}
          />
          {renderFriendlyEye(eyeOffsetX, eyeOffsetY, 'right')}
        </div>
      </div>
    );
  };

  // Ojos amigables tipo Mochi / Astro Bot (sin anillos concéntricos intimidantes)
  const renderFriendlyEye = (offsetX: number, offsetY: number, side: 'left' | 'right') => {
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
          className="w-[56%] h-[36%] rounded-t-full border-t-[2.5px] border-emerald-200 shadow-[0_-2px_8px_rgba(110,231,183,0.9)]"
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
    // En lugar de un anillo hueco, es un óvalo relleno suave con dos brillitos especulares blancos (Catchlights)
    // que le dan una mirada tierna, viva y amigable.
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
          'relative flex items-center justify-center transition-transform duration-75 ease-out',
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
    if (activeMood === 'question') {
      return (
        <div className="absolute -top-1 right-[8%] z-30 animate-bounce rounded-full bg-cyan-400/90 px-1.5 py-0.5 text-[10px] font-black text-zinc-950 shadow-[0_0_12px_#22d3ee] pointer-events-none">
          ?
        </div>
      );
    }
    if (activeMood === 'approval') {
      return (
        <div className="absolute -top-1 right-[8%] z-30 animate-bounce rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-black text-zinc-950 shadow-[0_0_12px_#fbbf24] pointer-events-none">
          !
        </div>
      );
    }
    if (activeMood === 'thinking' || activeMood === 'searching') {
      return (
        <div className="absolute -top-1 right-[6%] z-30 flex items-center gap-0.5 rounded-full bg-zinc-900/85 border border-amber-400/60 px-1.5 py-1 shadow-[0_0_10px_rgba(251,191,36,0.4)] pointer-events-none">
          <span className="h-1 w-1 rounded-full bg-amber-300 animate-bounce" />
          <span
            className="h-1 w-1 rounded-full bg-amber-300 animate-bounce"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="h-1 w-1 rounded-full bg-amber-300 animate-bounce"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      );
    }
    return null;
  };

  // Determinar si usamos el Rigging Articulado de 4 capas (Cabeza, Brazo Izq, Brazo Der, Torso)
  const useArticulatedRig = size >= 52;

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
        perspective: '800px',
      }}
      title={interactive ? 'Tenshi - Copiloto SG-SST (Haz clic para hablar o acarícialo)' : undefined}
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
        @keyframes tenshi-arm-idle-left {
          0%, 100% { transform: rotateZ(0deg); }
          50% { transform: rotateZ(6deg); }
        }
        @keyframes tenshi-arm-idle-right {
          0%, 100% { transform: rotateZ(0deg); }
          50% { transform: rotateZ(-6deg); }
        }
        @keyframes tenshi-arm-wave {
          0%, 100% { transform: rotateZ(24deg); }
          50% { transform: rotateZ(44deg); }
        }
        @keyframes tenshi-arm-work-left {
          0%, 100% { transform: rotateZ(10deg) translateY(0); }
          50% { transform: rotateZ(24deg) translateY(-1.5%); }
        }
        @keyframes tenshi-arm-work-right {
          0%, 100% { transform: rotateZ(-24deg) translateY(-1.5%); }
          50% { transform: rotateZ(-10deg) translateY(0); }
        }
        @keyframes tenshi-particle-float {
          0% { transform: translate(0, 0) scale(0.7); opacity: 1; }
          100% { transform: translate(var(--tx, 0px), -26px) scale(1.15); opacity: 0; }
        }
        @keyframes tenshi-torso-breathe {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          50% { transform: scaleX(1.018) scaleY(0.985); }
        }
      `}</style>

      {/* Emisor de Partículas Contextuales (Chispas, Corazones, Zzz, Sudor) */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none z-40 font-bold select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.label ? `${p.size}px` : undefined,
            width: p.label ? undefined : p.size,
            height: p.label ? undefined : p.size,
            borderRadius: p.label ? undefined : '9999px',
            backgroundColor: p.label ? undefined : p.color,
            color: p.color,
            textShadow: `0 0 8px ${p.color}`,
            boxShadow: p.label ? undefined : `0 0 10px ${p.color}`,
            animation: 'tenshi-particle-float 1.35s ease-out forwards',
          }}
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

      {/* 2. Contenedor 3D del Avatar con Física de Rebote (Squash & Stretch + Rigging 2.5D) */}
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
            : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:drop-shadow-[0_6px_20px_rgba(16,185,129,0.35)]',
          activeMood === 'dizzy' && 'animate-spin',
          !isSpeaking && !isClicked && activeMood !== 'dizzy' && 'animate-tenshi-float'
        )}
        style={{
          transformOrigin: '50% 92%',
          transform:
            activeMood === 'dizzy'
              ? 'scale(0.92)'
              : isSquashing
              ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scaleX(1.12) scaleY(0.86) translateY(3%)`
              : `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg) scale(${
                  isClicked ? 0.9 : voiceScale
                })`,
          transformStyle: 'preserve-3d',
          transition:
            isClicked || isSquashing
              ? 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Halo Celestial Dorado Flotante con Resorte de Inercia (Spring Lag de Coucou) */}
        {showHaloEffect && size >= 45 && (
          <div
            className="absolute -top-3 left-1/2 pointer-events-none transition-transform duration-200 ease-out z-30"
            style={{
              width: '54%',
              height: '16%',
              transform: `translateX(calc(-50% + ${haloLag.dx}px)) translateY(${haloLag.dy}px) rotateX(68deg) rotateZ(${haloLag.tilt}deg)`,
              animation: isSpeaking
                ? 'tenshi-halo-pulse 1.2s infinite ease-in-out'
                : 'tenshi-halo-pulse 3.5s infinite ease-in-out',
              transformOrigin: 'center center',
            }}
          >
            <div
              className={cn(
                'h-full w-full rounded-[50%] border-2 transition-all duration-300',
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
                  : 'border-amber-300 shadow-[0_0_15px_rgba(252,211,77,0.75),inset_0_0_6px_rgba(252,211,77,0.35)] bg-amber-300/15'
              )}
            />
          </div>
        )}

        {useArticulatedRig ? (
          /* ── SISTEMA DE RIGGING ARTICULADO 2.5D SOBRE /assets/tenshi.png ── */
          <div className="relative h-full w-full pointer-events-none select-none">
            {/* CAPA 1: TORSO Y PATITAS (Respiración y soporte central) */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(34.6% 58%, 64.8% 58%, 67% 100%, 33% 100%)',
                transformOrigin: '50% 93%',
                animation: 'tenshi-torso-breathe 3.2s infinite ease-in-out',
              }}
            >
              <img
                src="/assets/tenshi.png"
                alt="Tenshi Torso"
                className="h-full w-full object-contain object-center"
              />
              {/* Destello en la Estrella Dorada del pecho cuando ejecuta herramientas o busca */}
              {(activeMood === 'working' ||
                activeMood === 'searching' ||
                activeMood === 'thinking' ||
                isSpeaking) && (
                <span
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/80 blur-[3px] animate-ping pointer-events-none"
                  style={{ left: '57.2%', top: '65.5%', width: '5.5%', height: '4.2%' }}
                />
              )}
            </div>

            {/* CAPA 2: BRAZO IZQUIERDO ARTICULADO (Pivote en Hombro Izquierdo 34.8% 63.8%) */}
            <div
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{
                clipPath: 'polygon(14% 60.5%, 35.8% 60.5%, 35.2% 72.5%, 34.5% 83%, 14% 83%)',
                transformOrigin: '34.8% 63.8%',
                transform: `rotateZ(${leftArmAngle}deg)`,
                animation:
                  activeMood === 'greeting'
                    ? 'tenshi-arm-wave 0.55s infinite ease-in-out'
                    : activeMood === 'working' || activeMood === 'searching'
                    ? 'tenshi-arm-work-left 0.35s infinite ease-in-out'
                    : leftArmAngle === 0
                    ? 'tenshi-arm-idle-left 3.2s infinite ease-in-out'
                    : undefined,
              }}
            >
              <img
                src="/assets/tenshi.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain object-center"
              />
            </div>

            {/* CAPA 3: BRAZO DERECHO ARTICULADO (Pivote en Hombro Derecho 64.8% 63.8%) */}
            <div
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{
                clipPath: 'polygon(63.8% 60.5%, 86% 60.5%, 86% 83%, 65.0% 83%, 64.4% 72.5%)',
                transformOrigin: '64.8% 63.8%',
                transform: `rotateZ(${rightArmAngle}deg)`,
                animation:
                  activeMood === 'working' || activeMood === 'searching'
                    ? 'tenshi-arm-work-right 0.35s infinite ease-in-out'
                    : rightArmAngle === 0
                    ? 'tenshi-arm-idle-right 3.2s infinite ease-in-out'
                    : undefined,
              }}
            >
              <img
                src="/assets/tenshi.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain object-center"
              />
            </div>

            {/* CAPA 4: CABEZA + OREJAS + GAFAS HUD (Pivote en el Cuello 50% 60.5%) */}
            <div
              className="absolute inset-0 z-10 transition-transform duration-200 ease-out"
              style={{
                transformOrigin: '50% 60.5%',
                transform: `rotateZ(${headExtraTilt + tilt.lookX * 3.5}deg) translateY(${
                  activeMood === 'sleeping' ? '1.8%' : isSpeaking ? `${-outputAmplitude * 1.6}%` : '0%'
                })`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  clipPath:
                    'polygon(0% 0%, 100% 0%, 100% 61.0%, 66% 61.6%, 50% 62.2%, 34% 61.6%, 0% 61.0%)',
                }}
              >
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi"
                  className="h-full w-full object-contain object-center"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/logo.svg';
                  }}
                />
              </div>

              {/* Visores HUD Expresivos adheridos exactamente al movimiento de la cabeza */}
              {renderHUDLenses()}
            </div>
          </div>
        ) : (
          /* Modo Mini (< 52px, para cabeceras compactas) */
          <>
            <img
              src="/assets/tenshi.png"
              alt="Tenshi"
              className="h-full w-full object-contain object-center pointer-events-none select-none"
              onError={(e) => {
                e.currentTarget.src = '/assets/logo.svg';
              }}
            />
            {renderHUDLenses()}
          </>
        )}
      </div>

      {/* Píldora de Estado Opcional Flotante (Estilo Coucou Capsule) */}
      {statusText && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30 shadow-md pointer-events-none transition-all duration-300">
          {statusText}
        </div>
      )}
    </div>
  );
};

export default TenshiAvatar;
