import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '~/utils';
import { tenshiAudio } from './tenshiAudio';

export type TenshiAvatarMood = 'idle' | 'thinking' | 'speaking' | 'listening' | 'success' | 'dizzy';

export interface TenshiAvatarProps {
  size?: number; // en píxeles (ej. 180, 140, 56, 48, 36)
  mood?: TenshiAvatarMood;
  isSpeaking?: boolean;
  outputAmplitude?: number; // 0..1
  isVoiceActive?: boolean;
  isTyping?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  showHaloEffect?: boolean;
  showHUD?: boolean;
  statusText?: string; // Texto de estado opcional estilo píldora Coucou
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
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
  showHaloEffect = false,
  showHUD = true,
  statusText,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, rz: 0, lookX: 0, lookY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [forcedDizzy, setForcedDizzy] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Contador de clics rápidos (Poking detector de Coucou)
  const pokeCountRef = useRef(0);
  const lastPokeTimeRef = useRef(0);
  const dizzyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determinar emoción activa
  const activeMood: TenshiAvatarMood = useMemo(() => {
    if (forcedDizzy) return 'dizzy';
    if (explicitMood) return explicitMood;
    if (isSpeaking) return 'speaking';
    if (isTyping) return 'thinking';
    if (isVoiceActive) return 'listening';
    return 'idle';
  }, [forcedDizzy, explicitMood, isSpeaking, isTyping, isVoiceActive]);

  // Sonidos según cambio de estado
  const prevMoodRef = useRef(activeMood);
  useEffect(() => {
    if (prevMoodRef.current !== activeMood) {
      if (activeMood === 'thinking') {
        tenshiAudio.playThink();
      } else if (activeMood === 'success') {
        tenshiAudio.playSuccess();
        // Generar partículas de celebración
        const newParts: Particle[] = Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          x: 50 + (Math.random() - 0.5) * 40,
          y: 40 + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 5,
          vy: -3 - Math.random() * 4,
          size: 4 + Math.random() * 5,
          alpha: 1,
          color: Math.random() > 0.5 ? '#10B981' : '#FBBF24',
        }));
        setParticles(newParts);
      }
      prevMoodRef.current = activeMood;
    }
  }, [activeMood]);

  // Limpieza de partículas
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles([]);
    }, 1200);
    return () => clearTimeout(timer);
  }, [particles]);

  // Parpadeo natural autónomo cada 2.5 - 4.5 segundos
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = 2200 + Math.random() * 2500;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, delay);
    };
    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  // Seguimiento suave del cursor del ratón (Mirada 3D Coucou)
  useEffect(() => {
    if (!interactive) return;

    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Desplazamiento normalizado (-1 a 1)
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth / 2, 350)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight / 2, 350)));

      const ry = dx * 15;
      const rx = -dy * 13;
      const rz = activeMood === 'thinking' ? 4 : dx * 2;

      const glareX = 50 + dx * 38;
      const glareY = 50 + dy * 38;

      setTilt({ rx, ry, rz, lookX: dx, lookY: dy, glareX, glareY });

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setTilt({ rx: 0, ry: 0, rz: activeMood === 'thinking' ? 3 : 0, lookX: 0, lookY: 0, glareX: 50, glareY: 50 });
      }, 3200);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [interactive, activeMood]);

  // Manejador del Clic (Detección de "Poke" y mareo)
  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastPokeTimeRef.current < 900) {
      pokeCountRef.current += 1;
    } else {
      pokeCountRef.current = 1;
    }
    lastPokeTimeRef.current = now;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    // Si le das 4 clics seguidos: se marea y gira 360°
    if (pokeCountRef.current >= 4) {
      pokeCountRef.current = 0;
      setForcedDizzy(true);
      tenshiAudio.playDizzy();
      if (dizzyTimeoutRef.current) clearTimeout(dizzyTimeoutRef.current);
      dizzyTimeoutRef.current = setTimeout(() => {
        setForcedDizzy(false);
      }, 2500);
    } else {
      tenshiAudio.playBlip();
    }

    if (onClick) onClick();
  }, [onClick]);

  // Escala reactiva a la voz
  const voiceScale = isSpeaking ? 1 + Math.min(outputAmplitude * 0.28, 0.18) : isHovered ? 1.04 : 1;

  // Renderizado del HUD en los cristales de las gafas de sol
  // Coordenadas calculadas: Lente Izquierdo x=36.4%, y=45.7% | Lente Derecho x=64.8%, y=46.3%
  const renderHUDLenses = () => {
    if (!showHUD || size < 44) return null;

    // Desplazamiento de los ojos digitales según la mirada (-6 a 6 px normalizado)
    const eyeOffsetX = tilt.lookX * 5;
    const eyeOffsetY = tilt.lookY * 4;

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Lente Izquierdo */}
        <div
          className="absolute flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            left: '25%',
            top: '36%',
            width: '24%',
            height: '20%',
          }}
        >
          {renderEyeContent(eyeOffsetX, eyeOffsetY, 'left')}
        </div>

        {/* Lente Derecho */}
        <div
          className="absolute flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            left: '52%',
            top: '36%',
            width: '24%',
            height: '20%',
          }}
        >
          {renderEyeContent(eyeOffsetX, eyeOffsetY, 'right')}
        </div>
      </div>
    );
  };

  const renderEyeContent = (offsetX: number, offsetY: number, side: 'left' | 'right') => {
    // 1. Estado Mareado (@ @ espiral girando)
    if (activeMood === 'dizzy') {
      return (
        <span className="text-emerald-400 font-black text-sm animate-spin select-none drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]">
          🌀
        </span>
      );
    }

    // 2. Estado Éxito (^ ^ sonriente)
    if (activeMood === 'success') {
      return (
        <span className="text-emerald-400 font-black text-sm select-none drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] scale-y-125">
          ^
        </span>
      );
    }

    // 3. Estado Hablando (Mini Ecualizador Digital dentro del lente)
    if (isSpeaking) {
      const baseAmp = Math.max(0.2, outputAmplitude);
      return (
        <div className="flex items-center justify-center gap-0.5 h-3">
          <span
            className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
            style={{ height: `${Math.min(12, Math.max(3, baseAmp * 12 * (side === 'left' ? 0.9 : 1.1)))}px` }}
          />
          <span
            className="w-0.5 bg-emerald-300 rounded-full transition-all duration-75"
            style={{ height: `${Math.min(14, Math.max(4, baseAmp * 15))}px` }}
          />
          <span
            className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
            style={{ height: `${Math.min(12, Math.max(3, baseAmp * 11 * (side === 'left' ? 1.1 : 0.8)))}px` }}
          />
        </div>
      );
    }

    // 4. Parpadeo activo (Línea fina horizontal)
    if (isBlinking) {
      return <span className="h-0.5 w-3.5 bg-emerald-400/90 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />;
    }

    // 5. Estado Pensando (Escáner horizontal o ceja arqueada)
    if (activeMood === 'thinking') {
      return (
        <div className="relative w-4 h-1 overflow-hidden">
          <span className="absolute inset-0 bg-amber-400/40 rounded-full" />
          <span className="absolute inset-y-0 w-2 bg-amber-300 rounded-full animate-tenshi-scanner shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        </div>
      );
    }

    // 6. Estado Reposo / Mirada normal (Ojo digital ciber-gaze)
    return (
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        <span className="block h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.85)] ring-1 ring-emerald-300/60" />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative inline-flex flex-col items-center justify-center select-none group',
        interactive && 'cursor-pointer',
        className
      )}
      style={{
        width: size,
        height: size,
        perspective: '800px',
      }}
      title={interactive ? 'Tenshi - Asistente WAPPY (Haz clic para interactuar)' : undefined}
    >
      <style>{`
        @keyframes tenshi-halo-pulse {
          0%, 100% { transform: translateX(-50%) rotateX(68deg) translateY(0) scale(1); opacity: 0.88; }
          50% { transform: translateX(-50%) rotateX(68deg) translateY(-5px) scale(1.08); opacity: 1; }
        }
        @keyframes tenshi-aura-wave {
          0% { transform: scale(0.95); opacity: 0.65; }
          50% { transform: scale(1.14); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.65; }
        }
        @keyframes tenshi-spin-360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes tenshi-scanner {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-tenshi-scanner {
          animation: tenshi-scanner 0.9s infinite ease-in-out;
        }
      `}</style>

      {/* Partículas de Éxito / Alegría */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none rounded-full animate-ping z-30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}

      {/* 1. Ondas de Aura Expansiva (Voz o Micrófono Activo) */}
      {(isSpeaking || isVoiceActive) && size >= 60 && (
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

      {/* 2. Contenedor 3D del Avatar con Física de Rebote (Squash & Stretch) - Flotando Libre con Aureola Original y fondo transparente */}
      <div
        className={cn(
          'relative h-full w-full flex items-center justify-center transition-all duration-200 ease-out select-none',
          isSpeaking
            ? 'drop-shadow-[0_0_24px_rgba(16,185,129,0.75)]'
            : activeMood === 'thinking'
            ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.65)]'
            : isVoiceActive
            ? 'drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]'
            : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:drop-shadow-[0_6px_20px_rgba(16,185,129,0.35)]',
          forcedDizzy && 'animate-spin',
          !isSpeaking && !isClicked && !forcedDizzy && 'animate-tenshi-float'
        )}
        style={{
          transform: forcedDizzy
            ? 'scale(0.92)'
            : `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg) scale(${
                isClicked ? 0.88 : voiceScale
              })`,
          transformStyle: 'preserve-3d',
          transition: isClicked
            ? 'transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Imagen Oficial de Tenshi sin fondo (removebg) */}
        <img
          src="/assets/tenshi.png"
          alt="Tenshi"
          className="h-full w-full object-contain object-center pointer-events-none select-none transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/assets/logo.svg';
          }}
        />

        {/* 4. Capa HUD Cibernética sobre los cristales de las gafas de sol */}
        {renderHUDLenses()}

        {/* Indicador brillante inferior cuando habla */}
        {isSpeaking && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-2 w-14 rounded-full bg-emerald-400 blur-[2px] animate-pulse pointer-events-none z-10" />
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
